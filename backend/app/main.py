from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database.connection import engine, Base, SessionLocal
from app.database.seed_data import seed_database
from app.api import (
    auth, dashboard, logs, alerts, ai_detection,
    campaigns, mitre, assets, soar, incidents,
    cert_in, audit, simulation
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema exists and seed data is populated
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db, force_reset=False)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=f"{settings.TAGLINE} | Developed for Secure Worldz AI Security Analyst Internship",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(logs.router)
app.include_router(alerts.router)
app.include_router(ai_detection.router)
app.include_router(campaigns.router)
app.include_router(mitre.router)
app.include_router(assets.router)
app.include_router(soar.router)
app.include_router(incidents.router)
app.include_router(cert_in.router)
app.include_router(audit.router)
app.include_router(simulation.router)

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "version": settings.VERSION,
        "organization": settings.ORGANIZATION,
        "status": "OPERATIONAL",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "platform": "SentinelGrid CNI Cyber Defense"}
