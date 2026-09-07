import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend root or parent if present
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)
load_dotenv()  # Fallback to current working dir .env

class Settings:
    PROJECT_NAME: str = "BillSplit AI API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

    DEFAULT_CURRENCY: str = os.getenv("DEFAULT_CURRENCY", "₹")
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "*",
    ]

settings = Settings()

