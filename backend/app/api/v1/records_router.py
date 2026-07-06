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
    gross_weight: float | None = None
    net_weight: float | None = None
    fill_level: str
    physical_state: str  
    condition: str
    separation_level: str
    container_id: uuid.UUID
    collector_id: uuid.UUID
    synced_from_offline: bool = False
    device_recorded_at: str | None = None


class CollectionRecordResponse(BaseModel):
    """Schema para retornar un reporte de recolección"""
    id: uuid.UUID
    gross_weight: float | None = None
    net_weight: float | None = None
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
    Crea un nuevo reporte de recoleccion.
    
    Valida:
    - Que el contenedor exista
    - Que el recolector exista
    - Que el peso bruto sea mayor que la tara del contenedor
    """
    try:
        # Validar que el contenedor existe
        container_result = await db.execute(
            select(Container).where(Container.id == record.container_id)
        )
        container = container_result.scalar_one_or_none()
        if not container:
            raise HTTPException(status_code=404, detail="Contenedor no encontrado")
        
        # Validar que el peso bruto sea mayor que la tara
        # Validar que el peso bruto sea mayor que la tara (solo si se proporciono peso)
        if record.gross_weight is not None:
            if record.gross_weight <= container.tare_weight:
                raise HTTPException(
                    status_code=400,
                    detail=f"El peso bruto ({record.gross_weight} kg) debe ser mayor que la tara del contenedor ({container.tare_weight} kg)"
                )
        
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
            physical_state=record.physical_state,
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
                    " volume_cubic_meters": record.container. volume_cubic_meters,
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
    
@router.get("/reports")
async def get_reports(
    date_from: str | None = None,
    date_to: str | None = None,
    collector_id: uuid.UUID | None = None,
    campus_id: uuid.UUID | None = None,
    category_id: uuid.UUID | None = None,
    location_id: uuid.UUID | None = None,
    has_incident: bool | None = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene reportes con filtros opcionales.
    """
    try:
        from sqlalchemy.orm import selectinload
        from app.models.container import Container
        from app.models.location import Location
        from datetime import datetime
        
        query = select(CollectionRecord)
        
        # Filtros
        if date_from:
            date_from_obj = datetime.fromisoformat(date_from)
            query = query.where(CollectionRecord.created_at >= date_from_obj)
        
        if date_to:
            date_to_obj = datetime.fromisoformat(date_to)
            query = query.where(CollectionRecord.created_at <= date_to_obj)
        
        if collector_id:
            query = query.where(CollectionRecord.collector_id == collector_id)
        
        if category_id:
            query = query.where(Container.waste_category_id == category_id)
        
        if location_id:
            query = query.where(Container.location_id == location_id)
        
        if campus_id:
            query = query.join(Container).join(Location).where(Location.campus_id == campus_id)
        
        if has_incident is not None:
            from app.models.incident import Incident
            if has_incident:
                query = query.where(CollectionRecord.incident.isnot(None))
            else:
                query = query.where(CollectionRecord.incident.is_(None))
        
        # Cargar relaciones
        query = query.options(
            selectinload(CollectionRecord.container)
            .selectinload(Container.waste_category),
            selectinload(CollectionRecord.container)
            .selectinload(Container.location)
            .selectinload(Location.campus),
            selectinload(CollectionRecord.collector),
            selectinload(CollectionRecord.incident),
        ).order_by(CollectionRecord.created_at.desc())
        
        result = await db.execute(query)
        records = result.scalars().all()
        
        # Armar respuesta
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
                    " volume_cubic_meters": record.container. volume_cubic_meters,
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
                } if record.incident else None,
                "collector": {
                    "id": str(record.collector.id),
                    "employee_id": record.collector.employee_id,
                    "full_name": record.collector.full_name,
                } if record.collector else None,
            })
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener reportes: {str(e)}")