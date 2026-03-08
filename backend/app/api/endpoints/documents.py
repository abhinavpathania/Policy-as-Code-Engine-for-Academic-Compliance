from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from app.services.document_processing import DocumentProcessor
from app.config import UPLOAD_DIR
import shutil
import os
import threading

router = APIRouter()
processor = DocumentProcessor()

# Track background ingestion status
_ingest_status = {"running": False, "result": None}


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        clauses = processor.process_pdf(file_path, file.filename)
        return {
            "message": f"'{file.filename}' processed successfully",
            "clauses_extracted": len(clauses),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)


def _run_ingestion():
    """Run ingestion in a background thread so it doesn't block the server."""
    global _ingest_status
    _ingest_status = {"running": True, "result": None}
    try:
        results = processor.ingest_cleaned_text_dir(force=True)
        _ingest_status = {"running": False, "result": results}
    except Exception as e:
        _ingest_status = {"running": False, "result": {"error": str(e)}}


@router.post("/ingest-existing")
async def ingest_existing():
    """Start ingestion in background thread. Returns immediately."""
    if _ingest_status["running"]:
        return {"message": "Ingestion already in progress. Check /ingest-status for progress."}

    thread = threading.Thread(target=_run_ingestion, daemon=True)
    thread.start()
    return {"message": "Ingestion started in background. Check /ingest-status for progress."}


@router.get("/ingest-status")
async def ingest_status():
    """Check the status of the background ingestion."""
    if _ingest_status["running"]:
        stats = processor.get_stats()
        return {
            "status": "running",
            "current_clauses": stats["total_clauses"],
            "current_documents": stats["total_documents"],
        }
    elif _ingest_status["result"] is not None:
        result = _ingest_status["result"]
        if "error" in result:
            return {"status": "error", "error": result["error"]}
        return {
            "status": "done",
            "message": f"Ingested {len(result['ingested'])} documents",
            "ingested": result["ingested"],
            "skipped": result["skipped"],
            "errors": result["errors"],
        }
    return {"status": "idle"}


@router.get("/")
async def list_documents():
    sources = processor.get_all_sources()
    return {"documents": sources}


@router.get("/stats")
async def get_stats():
    return processor.get_stats()


@router.get("/{document_id}/clauses")
async def get_document_clauses(document_id: str):
    clauses = processor.get_clauses_for_source(document_id)
    return {"clauses": clauses, "count": len(clauses)}


@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """Delete a document and all its clauses from ChromaDB."""
    try:
        result = processor.delete_document(document_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
