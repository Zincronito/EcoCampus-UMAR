"""
FastAPI entry point para EcoCampus UMAR
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.minio_client import ensure_buckets_exist
from app import models
from app.core.config import settings
from app.models.user import User
from app.models.notification import Notification

# Importar routers
from app.api.v1 import (
    auth_router, 
    containers_router, 
    records_router, 
    incidents_router, 
    categories_router, 
    locations_router, 
    campus_router, 
    collectors_router, 
    notifications_router
)

# Crear la app
app = FastAPI(
    title=settings.PROJECT_NAME,
    debug=settings.API_DEBUG,
)

# Lista de orígenes permitidos
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3050",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3050",
    "https://horario.utm.mx",
    "http://horario.utm.mx",  # Agregado protocolo HTTP 
]

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health():
    return {"status": "ok", "message": "EcoCampus API is running"}

# ────────────────────────────────────────────────────────────
# INCLUIR ROUTERS
# ────────────────────────────────────────────────────────────

app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(containers_router.router, prefix="/api/v1/containers", tags=["containers"])
app.include_router(records_router.router, prefix="/api/v1/records", tags=["records"])
app.include_router(incidents_router.router, prefix="/api/v1/incidents", tags=["incidents"]) # El duplicado de fotos ha sido eliminado
app.include_router(categories_router.router, prefix="/api/v1/categories", tags=["categories"])
app.include_router(campus_router.router, prefix="/api/v1/campus", tags=["campus"])
app.include_router(locations_router.router, prefix="/api/v1/locations", tags=["locations"])
app.include_router(collectors_router.router, prefix="/api/v1/collectors", tags=["collectors"])
app.include_router(notifications_router.router, prefix="/api/v1", tags=["notifications"])

# ────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "EcoCampus UMAR API", "docs_url": "/docs"}

@app.on_event("startup")
async def startup_event():
    """Crear tablas y buckets al iniciar"""
    from app.core.database import engine, Base
    
    # Crear todas las tablas
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Crear buckets de MinIO
    await ensure_buckets_exist()