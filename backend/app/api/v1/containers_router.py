"""
Router de Contenedores
GET /containers - obtener todos los contenedores
GET /containers/{id} - obtener un contenedor específico
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import uuid

from app.core.database import get_db
from app.models.container import Container

router = APIRouter()

# ────────────────────────────────────────────────────────────
# SCHEMAS (Pydantic models para request/response)
# ────────────────────────────────────────────────────────────

class ContainerResponse(BaseModel):
    id: uuid.UUID
    container_code: str
    tare_weight: float
    volume_liters: float | None
    status: str
    qr_generated: bool
    location_id: uuid.UUID
    waste_category_id: uuid.UUID

    class Config:
        from_attributes = True


# ────────────────────────────────────────────────────────────
# ENDPOINTS
# ────────────────────────────────────────────────────────────

@router.get("", response_model=list[ContainerResponse])
async def get_containers(db: AsyncSession = Depends(get_db)):
    """
    Obtiene todos los contenedores activos del sistema.
    
    Retorna: lista de contenedores con sus datos básicos
    """
    try:
        result = await db.execute(
            select(Container).where(Container.is_active == True)
        )
        containers = result.scalars().all()
        return containers
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener contenedores: {str(e)}")


@router.get("/{container_id}")
async def get_container(
    container_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene un contenedor especifico por su ID con info de categoria y ubicacion.
    """
    try:
        from sqlalchemy.orm import selectinload
        from app.models.location import Location
        
        result = await db.execute(
            select(Container)
            .where(Container.id == container_id)
            .options(
                selectinload(Container.waste_category),
                selectinload(Container.location).selectinload(Location.campus),
            )
        )
        container = result.scalar_one_or_none()
        
        if not container:
            raise HTTPException(status_code=404, detail="Contenedor no encontrado")
        
        return {
            "id": str(container.id),
            "container_code": container.container_code,
            "volume_liters": container.volume_liters,
            "tare_weight": container.tare_weight,
            "status": container.status,
            "location_id": str(container.location_id) if container.location_id else None,
            "waste_category_id": str(container.waste_category_id) if container.waste_category_id else None,
            "waste_category": {
                "id": str(container.waste_category.id),
                "name": container.waste_category.name,
                "color": container.waste_category.color,
            } if container.waste_category else None,
            "location": {
                "id": str(container.location.id),
                "name": container.location.name,
                "sector": container.location.sector,
                "campus": container.location.campus.name if container.location.campus else None,
            } if container.location else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener contenedor: {str(e)}")