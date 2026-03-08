from fastapi import APIRouter
from app.api.endpoints import documents, chat

router = APIRouter()

router.include_router(documents.router, prefix="/documents", tags=["documents"])
router.include_router(chat.router, prefix="/chat", tags=["chat"])

@router.get("/health", tags=["system"])
async def health():
    return {"status": "ok", "version": "2.0.0"}
