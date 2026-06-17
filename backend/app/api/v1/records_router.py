"""
Router de Reportes de Recolección
POST /records - crear un nuevo reporte de recolección
GET /records - obtener todos los reportes
GET /records/collector/{collector_id} - obtener reportes de un recolector
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import uuid
from datetime import datetime

from app.core.database import get_db
from app.models.collection_record import CollectionRecord
from app.models.container import Container
from app.models.user import User

router = APIRouter()

# ────────────────────────────────────────────────────────────
# SCHEMAS (Pydantic models)
# ────────────────────────────────────────────────────────────

class CollectionRecordCreate(BaseModel):
    """Schema para crear un nuevo reporte de recolección"""
    gross_weight: float
    net_weight: float | None = None
    fill_level: str
    physical_state: str  # Nuevo campo
    condition: str
    separation_level: str
    container_id: uuid.UUID
    collector_id: uuid.UUID
    synced_from_offline: bool = False
    device_recorded_at: str | None = None


class CollectionRecordResponse(BaseModel):
    """Schema para retornar un reporte de recolección"""
    id: uuid.UUID
    gross_weight: float
    net_weight: float | None
    fill_level: str
    physical_state: str  # Nuevo campo
    condition: str
    separation_level: str
    container_id: uuid.UUID
    collector_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ────────────────────────────────────────────────────────────
# ENDPOINTS
# ────────────────────────────────────────────────────────────

@router.post("", response_model=CollectionRecordResponse, status_code=201)
async def create_collection_record(
    record: CollectionRecordCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Crea un nuevo reporte de recolección.
    
    Este endpoint es llamado cuando un recolector reporta un contenedor.
    Valida que el contenedor y el recolector existan.
    
    Args:
        record: datos del reporte (peso, condición, separación, etc)
    
    Retorna: el reporte creado con su ID
    """
    try:
        # Validar que el contenedor existe
        container_result = await db.execute(
            select(Container).where(Container.id == record.container_id)
        )
        container = container_result.scalar_one_or_none()
        if not container:
            raise HTTPException(status_code=404, detail="Contenedor no encontrado")
        
        # Validar que el recolector existe
        collector_result = await db.execute(
            select(User).where(User.id == record.collector_id)
        )
        collector = collector_result.scalar_one_or_none()
        if not collector:
            raise HTTPException(status_code=404, detail="Recolector no encontrado")
        
        # Crear el reporte
        new_record = CollectionRecord(
            gross_weight=record.gross_weight,
            net_weight=record.net_weight,
            fill_level=record.fill_level,
            physical_state=record.physical_state,  # Nuevo campo
            condition=record.condition,
            separation_level=record.separation_level,
            container_id=record.container_id,
            collector_id=record.collector_id,
            synced_from_offline=record.synced_from_offline,
            device_recorded_at=record.device_recorded_at,
        )
        
        db.add(new_record)
        await db.commit()
        await db.refresh(new_record)
        
        return new_record
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear reporte: {str(e)}")


@router.get("", response_model=list[CollectionRecordResponse])
async def get_collection_records(db: AsyncSession = Depends(get_db)):
    """
    Obtiene todos los reportes de recolección.
    
    Retorna: lista de reportes ordenados por fecha (más recientes primero)
    """
    try:
        result = await db.execute(
            select(CollectionRecord).order_by(CollectionRecord.created_at.desc())
        )
        records = result.scalars().all()
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener reportes: {str(e)}")


@router.get("/collector/{collector_id}")
async def get_collector_records(
    collector_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene todos los reportes de un recolector con info del contenedor y categoria.
    Incluye tambien la incidencia asociada (si existe).
    """
    try:
        # Validar que el recolector existe
        collector_result = await db.execute(
            select(User).where(User.id == collector_id)
        )
        collector = collector_result.scalar_one_or_none()
        if not collector:
            raise HTTPException(status_code=404, detail="Recolector no encontrado")
        
        # Obtener reportes con sus relaciones cargadas
        from sqlalchemy.orm import selectinload
        from app.models.container import Container
        from app.models.location import Location
        
        result = await db.execute(
            select(CollectionRecord)
            .where(CollectionRecord.collector_id == collector_id)
            .options(
                selectinload(CollectionRecord.container)
                .selectinload(Container.waste_category),
                selectinload(CollectionRecord.container)
                .selectinload(Container.location)
                .selectinload(Location.campus),
                selectinload(CollectionRecord.incident),
            )
            .order_by(CollectionRecord.created_at.desc())
        )
        records = result.scalars().all()
        
        # Armar la respuesta con info enriquecida
        response = []
        for record in records:
            response.append({
                "id": str(record.id),
                "gross_weight": record.gross_weight,
                "net_weight": record.net_weight,
                "fill_level": record.fill_level,
                "physical_state": record.physical_state,
                "condition": record.condition,
                "separation_level": record.separation_level,
                "created_at": record.created_at.isoformat() if record.created_at else None,
                "container": {
                    "id": str(record.container.id),
                    "container_code": record.container.container_code,
                    "volume_liters": record.container.volume_liters,
                    "tare_weight": record.container.tare_weight,
                } if record.container else None,
                "category": {
                    "id": str(record.container.waste_category.id),
                    "name": record.container.waste_category.name,
                    "color": record.container.waste_category.color,
                } if record.container and record.container.waste_category else None,
                "location": {
                    "name": record.container.location.name,
                    "sector": record.container.location.sector,
                    "campus": record.container.location.campus.name if record.container.location.campus else None,
                } if record.container and record.container.location else None,
                "incident": {
                    "id": str(record.incident.id),
                    "description": record.incident.description,
                    "quick_tag": record.incident.quick_tag,
                    "status": record.incident.status,
                } if record.incident else None
            })
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener reportes: {str(e)}")