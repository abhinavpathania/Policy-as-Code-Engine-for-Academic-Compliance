import os
import re
import ollama
import chromadb
from typing import List
from pydantic import BaseModel
from app.config import CHROMA_DB_PATH, EMBED_MODEL, CHUNK_MIN_LENGTH, CLEANED_TEXT_DIR

# Try PyPDF2 for electronic PDFs (no poppler needed)
try:
    from PyPDF2 import PdfReader
    HAS_PYPDF2 = True
except ImportError:
    HAS_PYPDF2 = False

# Keep pytesseract as optional fallback for truly scanned PDFs
try:
    from pdf2image import convert_from_path
    import pytesseract
    HAS_OCR = True
except Exception:
    HAS_OCR = False


class Clause(BaseModel):
    id: str
    content: str
    metadata: dict


def pdf_to_text(pdf_path: str) -> str:
    """Extract text from a PDF. Uses PyPDF2 first (electronic PDFs),
    falls back to OCR (pytesseract + poppler) if PyPDF2 returns nothing."""
    text = ""

    # Attempt 1: PyPDF2 (works for electronic/digital PDFs, no poppler needed)
    if HAS_PYPDF2:
        try:
            reader = PdfReader(pdf_path)
            pages = []
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    pages.append(f"--- Page {i + 1} ---\n{page_text.strip()}")
            text = "\n".join(pages)
        except Exception as e:
            print(f"PyPDF2 extraction failed: {e}")

    # Attempt 2: OCR fallback (only if PyPDF2 yielded nothing and OCR is available)
    if not text.strip() and HAS_OCR:
        try:
            images = convert_from_path(pdf_path)
            pages = []
            for i, img in enumerate(images):
                page_text = pytesseract.image_to_string(img)
                pages.append(f"--- Page {i + 1} ---\n{page_text.strip()}")
            text = "\n".join(pages)
        except Exception as e:
            print(f"OCR extraction failed: {e}")

    if not text.strip():
        raise ValueError(
            "Could not extract text from PDF. "
            "For electronic PDFs, PyPDF2 is used. "
            "For scanned PDFs, install poppler (brew install poppler) and pytesseract."
        )

    return text


class DocumentProcessor:
    def __init__(self, chroma_db_path: str = CHROMA_DB_PATH):
        self.client = chromadb.PersistentClient(path=chroma_db_path)
        self.collection = self.client.get_or_create_collection("policy_docs")

    def simple_cleanup(self, text: str) -> str:
        return "\n".join(line.strip() for line in text.splitlines() if line.strip())

    def extract_clauses(self, text: str, source_name: str) -> List[Clause]:
        """Split text into overlapping chunks of ~500 chars, respecting line boundaries."""
        CHUNK_SIZE = 500     # target chars per chunk
        CHUNK_OVERLAP = 50   # chars of overlap between chunks

        lines = text.splitlines()
        clauses: List[Clause] = []
        chunk_lines: list = []
        chunk_len = 0
        chunk_idx = 0

        for line in lines:
            chunk_lines.append(line)
            chunk_len += len(line) + 1  # +1 for newline

            if chunk_len >= CHUNK_SIZE:
                chunk_text = "\n".join(chunk_lines).strip()
                if len(chunk_text) >= CHUNK_MIN_LENGTH:
                    metadata = {"source": source_name, "chunk_index": chunk_idx}
                    clauses.append(
                        Clause(
                            id=f"{source_name}_chunk_{chunk_idx}",
                            content=chunk_text,
                            metadata=metadata,
                        )
                    )
                    chunk_idx += 1

                # Keep last few lines for overlap
                overlap_lines: list = []
                overlap_len = 0
                for ol in reversed(chunk_lines):
                    if overlap_len + len(ol) > CHUNK_OVERLAP:
                        break
                    overlap_lines.insert(0, ol)
                    overlap_len += len(ol) + 1
                chunk_lines = overlap_lines
                chunk_len = overlap_len

        # Remaining lines
        if chunk_lines:
            chunk_text = "\n".join(chunk_lines).strip()
            if len(chunk_text) >= CHUNK_MIN_LENGTH:
                metadata = {"source": source_name, "chunk_index": chunk_idx}
                clauses.append(
                    Clause(
                        id=f"{source_name}_chunk_{chunk_idx}",
                        content=chunk_text,
                        metadata=metadata,
                    )
                )

        return clauses

    def _embed_single(self, text: str) -> list:
        """Embed a single text string via Ollama."""
        response = ollama.embeddings(model=EMBED_MODEL, prompt=text)
        return response["embedding"]

    def embed_and_store(self, clauses: List[Clause], batch_size: int = 50):
        """Embed clauses using concurrent threads and store in batches."""
        if not clauses:
            return

        from concurrent.futures import ThreadPoolExecutor, as_completed

        ids = [c.id for c in clauses]
        documents = [c.content for c in clauses]
        metadatas = [c.metadata for c in clauses]

        # Concurrent embedding (4 parallel Ollama calls)
        embeddings = [None] * len(documents)
        with ThreadPoolExecutor(max_workers=4) as pool:
            future_to_idx = {
                pool.submit(self._embed_single, doc): i
                for i, doc in enumerate(documents)
            }
            for future in as_completed(future_to_idx):
                idx = future_to_idx[future]
                embeddings[idx] = future.result()

        # Batched ChromaDB upsert
        for start in range(0, len(ids), batch_size):
            end = start + batch_size
            self.collection.upsert(
                ids=ids[start:end],
                embeddings=embeddings[start:end],
                metadatas=metadatas[start:end],
                documents=documents[start:end],
            )

    def process_pdf(self, pdf_path: str, source_name: str) -> List[Clause]:
        """Process a PDF file: extract text, chunk, embed, store."""
        raw_text = pdf_to_text(pdf_path)
        clean_text = self.simple_cleanup(raw_text)
        clauses = self.extract_clauses(clean_text, source_name)
        self.embed_and_store(clauses)
        return clauses

    def process_text(self, text: str, source_name: str) -> List[Clause]:
        """Process a pre-cleaned text string: chunk, embed, store."""
        clean_text = self.simple_cleanup(text)
        clauses = self.extract_clauses(clean_text, source_name)
        self.embed_and_store(clauses)
        return clauses

    def ingest_cleaned_text_dir(self, text_dir: str = CLEANED_TEXT_DIR, force: bool = False) -> dict:
        """Ingest all .txt files from the existing CleanedText folder.
        If force=True, delete existing entries for each source and re-ingest.
        Otherwise skip files whose source name already exists."""
        existing_sources = set()
        try:
            data = self.collection.get(include=["metadatas"])
            for m in data["metadatas"]:
                if m and "source" in m:
                    existing_sources.add(m["source"])
        except Exception:
            pass

        results = {"ingested": [], "skipped": [], "errors": []}

        for fname in sorted(os.listdir(text_dir)):
            if not fname.lower().endswith(".txt"):
                continue

            if fname in existing_sources and not force:
                results["skipped"].append(fname)
                continue

            try:
                # If force and source exists, delete old entries first
                if fname in existing_sources and force:
                    old_data = self.collection.get(
                        where={"source": fname}, include=["documents"]
                    )
                    if old_data["ids"]:
                        self.collection.delete(ids=old_data["ids"])
                        print(f"🗑 Deleted {len(old_data['ids'])} old entries for {fname}")

                with open(os.path.join(text_dir, fname), "r", encoding="utf-8") as f:
                    text = f.read()
                clauses = self.process_text(text, fname)
                results["ingested"].append({"name": fname, "clauses": len(clauses)})
                print(f"✓ Ingested: {fname} ({len(clauses)} clauses)")
            except Exception as e:
                results["errors"].append({"name": fname, "error": str(e)})
                print(f"✗ Error ingesting {fname}: {e}")

        return results

    def get_all_sources(self):
        try:
            data = self.collection.get(include=["metadatas"])
            source_counts: dict = {}
            for m in data["metadatas"]:
                if m and "source" in m:
                    src = m["source"]
                    source_counts[src] = source_counts.get(src, 0) + 1
            return [
                {"id": s, "name": s, "clauses": c} for s, c in source_counts.items()
            ]
        except Exception:
            return []

    def get_clauses_for_source(self, source_id: str):
        try:
            data = self.collection.get(
                where={"source": source_id}, include=["documents", "metadatas"]
            )
            return [
                {"content": doc, "metadata": meta}
                for doc, meta in zip(data["documents"], data["metadatas"])
            ]
        except Exception:
            return []

    def get_stats(self):
        try:
            count = self.collection.count()
            sources = self.get_all_sources()
            return {
                "total_clauses": count,
                "total_documents": len(sources),
                "documents": sources,
            }
        except Exception:
            return {"total_clauses": 0, "total_documents": 0, "documents": []}

    def delete_document(self, source_name: str) -> dict:
        """Delete all clauses for a given source document from ChromaDB."""
        try:
            data = self.collection.get(
                where={"source": source_name}, include=["documents"]
            )
            if not data["ids"]:
                return {"deleted": 0, "message": f"No entries found for '{source_name}'"}
            self.collection.delete(ids=data["ids"])
            return {"deleted": len(data["ids"]), "message": f"Deleted {len(data['ids'])} clauses for '{source_name}'"}
        except Exception as e:
            raise Exception(f"Failed to delete '{source_name}': {str(e)}")
