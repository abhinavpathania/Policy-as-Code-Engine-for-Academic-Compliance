import ollama
import chromadb
from typing import List, Dict, Tuple
from app.config import CHROMA_DB_PATH, EMBED_MODEL, LLM_MODEL, DEFAULT_TOP_K


class DocumentRetriever:
    def __init__(self, chroma_db_path: str = CHROMA_DB_PATH):
        self.client = chromadb.PersistentClient(path=chroma_db_path)
        self.collection = self.client.get_or_create_collection("policy_docs")

    def retrieve(
        self, query: str, top_k: int = DEFAULT_TOP_K
    ) -> Tuple[List[str], List[Dict], List[float]]:
        """Embed the query and return (docs, metadatas, distances)."""
        query_embedding = ollama.embeddings(model=EMBED_MODEL, prompt=query)[
            "embedding"
        ]

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents", "metadatas", "distances"],
        )

        if not results["documents"] or not results["documents"][0]:
            return [], [], []

        return (
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        )


def _distance_to_confidence(distance: float) -> float:
    """Convert L2 distance to a 0-100 confidence score.
    L2 distances from nomic-embed-text are typically 150-250.
    Lower distance = more similar."""
    import math
    # Exponential decay: closer = higher confidence
    # distance ~150 -> ~95%, ~200 -> ~60%, ~250 -> ~30%, ~300 -> ~10%
    score = 100.0 * math.exp(-0.015 * (distance - 140))
    return round(max(0.0, min(100.0, score)), 1)


def generate_answer(
    query: str, context_docs: List[str], sources: List[Dict]
) -> str:
    if not context_docs:
        return "No relevant documents found in the knowledge base."

    context = "\n\n".join(
        [
            f"[Source: {sources[i].get('source', 'unknown')}]\n{doc[:1500]}"
            for i, doc in enumerate(context_docs)
        ]
    )

    prompt = (
        "You are an expert in academic compliance regulations (UGC, AICTE, institutional bylaws). "
        "Given the following regulatory sources and clauses, answer the question below accurately and comprehensively. "
        "If the question asks for multiple items (objectives, guidelines, requirements, etc.), "
        "list ALL items found in the context — do not summarise or condense. "
        "Always cite the document source for each claim.\n\n"
        "==== Context ====\n"
        f"{context}\n"
        "==== End Context ====\n\n"
        f"Question: {query}\n\n"
        "Answer (provide complete details with citations):"
    )

    response = ollama.generate(model=LLM_MODEL, prompt=prompt)["response"]
    return response
