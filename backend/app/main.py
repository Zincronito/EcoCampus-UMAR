"""
FastAPI entry point para EcoCampus UMAR
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# Importar routers
from app.api.v1 import auth_router

# Crear la app
app = FastAPI(
    title=settings.PROJECT_NAME,
    debug=settings.API_DEBUG,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health():
    return {"status": "ok", "message": "EcoCampus API is running"}

# Incluir routers
app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["auth"])

@app.get("/")
async def root():
    return {"message": "EcoCampus UMAR API", "docs_url": "/docs"}