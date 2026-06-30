"""
Router de Ubicaciones.
CRUD completo de ubicaciones (lugares dentro de un campus).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field
import uuid

from app.core.database import get_db
from app.models.location import Location
from app.models.campus import Campus

router = APIRouter()


# ─────────────────────────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────────────────────────

class CampusInfo(BaseModel):
    id: uuid.UUID
    name: str
    code: str

    class Config:
        from_attributes = True


class LocationResponse(BaseModel):
    id: uuid.UUID
    name: str
    sector: str | None = None
    location_type: str | None = None
    description: str | None = None
    is_active: bool
    campus_id: uuid.UUID
    campus: CampusInfo | None = None

    class Config:
        from_attributes = True


class LocationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    sector: str | None = Field(None, max_length=100)
    location_type: str | None = Field(None, max_length=50)
    description: str | None = Field(None, max_length=500)
    campus_id: uuid.UUID


class LocationUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=150)
    sector: str | None = Field(None, max_length=100)
    location_type: str | None = Field(None, max_length=50)
    description: str | None = Field(None, max_length=500)
    campus_id: uuid.UUID | None = None
    is_active: bool | None = None


# ─────────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────────

@router.get("", response_model=list[LocationResponse])
async def get_all_locations(
    only_active: bool = True,
    campus_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Obtiene todas las ubicaciones.
    
    Parametros opcionales:
    - only_active: filtrar solo activas (default: True)
    - campus_id: filtrar por campus
    """
    try:
        query = select(Location).options(selectinload(Location.campus))
        
        if only_active:
            query = query.where(Location.is_active == True)
        
        if campus_id:
            query = query.where(Location.campus_id == campus_id)
        
        result = await db.execute(query.order_by(Location.name))
        locations = result.scalars().all()
        return locations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/{location_id}", response_model=LocationResponse)
async def get_location(
    location_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Obtiene una ubicacion por su ID."""
    result = await db.execute(
        select(Location)
        .where(Location.id == location_id)
        .options(selectinload(Location.campus))
    )
    location = result.scalar_one_or_none()
    if not location:
        raise HTTPException(status_code=404, detail="Ubicacion no encontrada")
    return location


@router.post("", response_model=LocationResponse, status_code=201)
async def create_location(
    location: LocationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Crea una nueva ubicacion."""
    try:
        # Verificar que el campus existe
        campus_result = await db.execute(
            select(Campus).where(Campus.id == location.campus_id)
        )
        campus = campus_result.scalar_one_or_none()
        if not campus:
            raise HTTPException(
                status_code=400,
                detail="El campus especificado no existe"
            )
        
        # Verificar que no exista otra ubicacion con el mismo nombre en el mismo campus
        existing = await db.execute(
            select(Location).where(
                Location.name == location.name,
                Location.campus_id == location.campus_id
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe una ubicacion con el nombre '{location.name}' en este campus"
            )
        
        new_location = Location(
            name=location.name,
            sector=location.sector,
            location_type=location.location_type,
            description=location.description,
            campus_id=location.campus_id,
            is_active=True,
        )
        db.add(new_location)
        await db.commit()
        await db.refresh(new_location, ["campus"])
        return new_location
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear: {str(e)}")


@router.patch("/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: uuid.UUID,
    location_data: LocationUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Actualiza una ubicacion."""
    try:
        result = await db.execute(
            select(Location)
            .where(Location.id == location_id)
            .options(selectinload(Location.campus))
        )
        location = result.scalar_one_or_none()
        if not location:
            raise HTTPException(status_code=404, detail="Ubicacion no encontrada")
        
        # Validar campus si se cambia
        if location_data.campus_id and location_data.campus_id != location.campus_id:
            campus_result = await db.execute(
                select(Campus).where(Campus.id == location_data.campus_id)
            )
            if not campus_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=400,
                    detail="El campus especificado no existe"
                )
        
        # Actualizar solo los campos enviados
        update_data = location_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(location, key, value)
        
        await db.commit()
        await db.refresh(location, ["campus"])
        return location
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar: {str(e)}")


@router.delete("/{location_id}", status_code=204)
async def delete_location(
    location_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Soft delete de una ubicacion (marca como inactiva)."""
    try:
        result = await db.execute(
            select(Location).where(Location.id == location_id)
        )
        location = result.scalar_one_or_none()
        if not location:
            raise HTTPException(status_code=404, detail="Ubicacion no encontrada")
        
        location.is_active = False
        await db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al desactivar: {str(e)}")