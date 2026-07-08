"""
Router de Incidentes
POST /incidents - reportar un incidente
GET /incidents - obtener todos los incidentes
GET /incidents/container/{container_id} - obtener incidentes de un contenedor
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import uuid
from datetime import datetime

from app.core.database import get_db
from app.models.incident import Incident
from app.models.container import Container
from app.models.user import User
from app.models.collection_record import CollectionRecord
from fastapi import File, UploadFile
from app.core.minio_client import upload_incident_photo

router = APIRouter()

# ────────────────────────────────────────────────────────────
# SCHEMAS (Pydantic models)
# ────────────────────────────────────────────────────────────

class IncidentCreate(BaseModel):
    """Schema para crear un nuevo incidente"""
    description: str
    quick_tag: str | None = None  # "damage", "spillage", "overfilled", "fauna", etc
    photo_url: str | None = None
    container_id: uuid.UUID
    reported_by_id: uuid.UUID
    collection_record_id: uuid.UUID | None = None


class IncidentResponse(BaseModel):
    """Schema para retornar un incidente"""
    id: uuid.UUID
    description: str
    quick_tag: str | None
    photo_url: str | None
    status: str
    container_id: uuid.UUID
    reported_by_id: uuid.UUID
    collection_record_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ────────────────────────────────────────────────────────────
# ENDPOINTS
# ────────────────────────────────────────────────────────────

@router.post("", response_model=IncidentResponse, status_code=201)
async def create_incident(
    incident: IncidentCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Reporta un nuevo incidente con un contenedor.
    
    Incidentes pueden ser: daño, derrame, fauna nociva, contenedor lleno, etc.
    
    Args:
        incident: datos del incidente (descripción, tipo, foto, etc)
    
    Retorna: el incidente creado con su ID
    """
    try:
        # Validar que el contenedor existe
        container_result = await db.execute(
            select(Container).where(Container.id == incident.container_id)
        )
        container = container_result.scalar_one_or_none()
        if not container:
            raise HTTPException(status_code=404, detail="Contenedor no encontrado")
        
        # Validar que el recolector existe
        reporter_result = await db.execute(
            select(User).where(User.id == incident.reported_by_id)
        )
        reporter = reporter_result.scalar_one_or_none()
        if not reporter:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Si hay collection_record_id, validar que existe
        if incident.collection_record_id:
            record_result = await db.execute(
                select(CollectionRecord).where(CollectionRecord.id == incident.collection_record_id)
            )
            record = record_result.scalar_one_or_none()
            if not record:
                raise HTTPException(status_code=404, detail="Reporte de recolección no encontrado")
        
        # Crear el incidente
        new_incident = Incident(
            description=incident.description,
            quick_tag=incident.quick_tag,
            photo_url=incident.photo_url,
            container_id=incident.container_id,
            reported_by_id=incident.reported_by_id,
            collection_record_id=incident.collection_record_id,
            status="open",  # Por defecto, nuevo incidente está abierto
        )
        
        db.add(new_incident)
        await db.commit()
        await db.refresh(new_incident)
        
        return new_incident
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear incidente: {str(e)}")

@router.post("/upload-photo", status_code=200)
async def upload_incident_photo_endpoint(
    file: UploadFile = File(...)
):
    """
    Sube una foto de incidencia a MinIO.
    
    Returns: URL pública de la foto
    """
    try:
        # Validar que es imagen
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")
        
        # Leer contenido
        file_content = await file.read()
        
        # Generar nombre único
        filename = f"incident_{uuid.uuid4()}.jpg"
        
        # Subir a MinIO
        photo_url = await upload_incident_photo(file_content, filename)
        
        return {"photo_url": photo_url, "filename": filename}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir foto: {str(e)}")

@router.get("", response_model=list[IncidentResponse])
async def get_incidents(db: AsyncSession = Depends(get_db)):
    """
    Obtiene todos los incidentes reportados.
    
    Retorna: lista de incidentes ordenados por fecha (más recientes primero)
    """
    try:
        result = await db.execute(
            select(Incident).order_by(Incident.created_at.desc())
        )
        incidents = result.scalars().all()
        return incidents
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener incidentes: {str(e)}")


@router.get("/container/{container_id}", response_model=list[IncidentResponse])
async def get_container_incidents(
    container_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene todos los incidentes reportados de un contenedor específico.
    
    Args:
        container_id: UUID del contenedor
    
    Retorna: lista de incidentes del contenedor
    """
    try:
        # Validar que el contenedor existe
        container_result = await db.execute(
            select(Container).where(Container.id == container_id)
        )
        container = container_result.scalar_one_or_none()
        if not container:
            raise HTTPException(status_code=404, detail="Contenedor no encontrado")
        
        # Obtener incidentes del contenedor
        result = await db.execute(
            select(Incident)
            .where(Incident.container_id == container_id)
            .order_by(Incident.created_at.desc())
        )
        incidents = result.scalars().all()
        return incidents
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener incidentes: {str(e)}")


@router.patch("/{incident_id}/status")
async def update_incident_status(
    incident_id: uuid.UUID,
    new_status: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Actualiza el estado de un incidente (open, in_progress, resolved).
    
    Args:
        incident_id: UUID del incidente
        new_status: nuevo estado
    
    Retorna: el incidente actualizado
    """
    try:
        result = await db.execute(
            select(Incident).where(Incident.id == incident_id)
        )
        incident = result.scalar_one_or_none()
        
        if not incident:
            raise HTTPException(status_code=404, detail="Incidente no encontrado")
        
        incident.status = new_status
        await db.commit()
        await db.refresh(incident)
        
        return incident
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar incidente: {str(e)}")