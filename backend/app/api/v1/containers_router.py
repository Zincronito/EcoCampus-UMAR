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


@router.get("/{container_id}", response_model=ContainerResponse)
async def get_container(
    container_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene un contenedor específico por su ID.
    
    Args:
        container_id: UUID del contenedor
    
    Retorna: datos del contenedor
    """
    try:
        result = await db.execute(
            select(Container).where(Container.id == container_id)
        )
        container = result.scalar_one_or_none()
        
        if not container:
            raise HTTPException(status_code=404, detail="Contenedor no encontrado")
        
        return container
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener contenedor: {str(e)}")