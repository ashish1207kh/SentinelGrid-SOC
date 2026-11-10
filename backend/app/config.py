import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings:
    PROJECT_NAME: str = "SentinelGrid"
    TAGLINE: str = "AI-Driven Cyber Resilience Platform for Critical National Infrastructure"
    VERSION: str = "2.4.0-INTERNSHIP-DEMO"
    ORGANIZATION: str = "Secure Worldz - AI Security Operations"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sentinelgrid-super-secure-cni-jwt-key-2026-secureworldz")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/sentinelgrid.db")
    
    DEFAULT_ANOMALY_THRESHOLD: float = 0.62
    ISOLATION_FOREST_CONTAMINATION: float = 0.08
    
    ALLOWED_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()
