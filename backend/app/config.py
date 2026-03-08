import os
from pathlib import Path

# ── Project paths ──
PROJECT_ROOT = Path(__file__).resolve().parent.parent  # backend/
REPO_ROOT = PROJECT_ROOT.parent  # Policy-as-Code-Engine-for-Academic-Compliance/
CHROMA_DB_PATH = str(REPO_ROOT / "Chroma_db_database")
DATA_DIR = str(REPO_ROOT / "Data")
CLEANED_TEXT_DIR = str(REPO_ROOT / "Data" / "CleanedText")
UPLOAD_DIR = str(PROJECT_ROOT / "uploads")

os.makedirs(UPLOAD_DIR, exist_ok=True)

# ── Ollama models ──
EMBED_MODEL = "nomic-embed-text:latest"
LLM_MODEL = "qwen2.5:3b-instruct"

# ── RAG settings ──
DEFAULT_TOP_K = 3
CHUNK_MIN_LENGTH = 50

# ── Server ──
API_HOST = "0.0.0.0"
API_PORT = 8000
