from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.chat_engine import DocumentRetriever, generate_answer, _distance_to_confidence

router = APIRouter()
retriever = DocumentRetriever()


class ChatQuery(BaseModel):
    query: str
    top_k: Optional[int] = 3


class SourceResult(BaseModel):
    content: str
    source: str
    chunk_index: Optional[int] = None
    distance: float
    confidence: float


class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceResult]
    query: str


@router.post("/", response_model=ChatResponse)
async def chat(body: ChatQuery):
    if not body.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    try:
        docs, metadatas, distances = retriever.retrieve(body.query, top_k=body.top_k or 3)
        answer = generate_answer(body.query, docs, metadatas)

        sources: List[SourceResult] = []
        for doc, meta, dist in zip(docs, metadatas, distances):
            sources.append(
                SourceResult(
                    content=doc[:500],
                    source=meta.get("source", "unknown"),
                    chunk_index=meta.get("chunk_index"),
                    distance=round(dist, 4),
                    confidence=_distance_to_confidence(dist),
                )
            )

        return ChatResponse(answer=answer, sources=sources, query=body.query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")
