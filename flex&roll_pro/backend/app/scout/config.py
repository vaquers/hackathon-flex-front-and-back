"""Global configuration for AI-Scout."""
import os
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent.parent  # backend/
load_dotenv(ROOT_DIR / ".env")

# API
OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
DEFAULT_MODEL: str = os.getenv("LLM_MODEL", "google/gemini-2.0-flash-001")

# Timeouts and retries
REQUEST_TIMEOUT: int = 60
LLM_TIMEOUT: int = 120
MAX_RETRIES: int = 3
RETRY_DELAY: float = 2.0

# Pipeline defaults
DEFAULT_SEARCH_DEPTH: int = 3
SLEEP_BETWEEN_LEADS: float = 1.5

# Paths
DATA_DIR: Path = ROOT_DIR / "data"
