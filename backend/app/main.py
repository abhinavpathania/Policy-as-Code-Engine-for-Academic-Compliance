from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.routes import router
from app.config import CHROMA_DB_PATH

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    print(f"✓ Backend starting – ChromaDB at {CHROMA_DB_PATH}")
    yield
    print("⏹ Backend shutting down")

app = FastAPI(
    title="Policy-as-Code Engine API",
    description="Clause-level regulatory retrieval and grounded generation",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Policy-as-Code Engine API v2.0"}
