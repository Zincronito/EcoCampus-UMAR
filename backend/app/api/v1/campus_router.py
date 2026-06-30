"""
Router de Campus.
GET /campus - obtener todos los campus
GET /campus/{id} - obtener un campus especifico
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import uuid

from app.core.database import get_db
from app.models.campus import Campus

router = APIRouter()


# Schema
class CampusResponse(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    address: str | None = None
    is_active: bool

    class Config:
        from_attributes = True


# Endpoints
@router.get("", response_model=list[CampusResponse])
async def get_all_campuses(
    only_active: bool = True,
    db: AsyncSession = Depends(get_db),
):
    """Obtiene todos los campus."""
    try:
        query = select(Campus)
        if only_active:
            query = query.where(Campus.is_active == True)
        
        result = await db.execute(query.order_by(Campus.name))
        campuses = result.scalars().all()
        return campuses
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/{campus_id}", response_model=CampusResponse)
async def get_campus(
    campus_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Obtiene un campus por su ID."""
    result = await db.execute(select(Campus).where(Campus.id == campus_id))
    campus = result.scalar_one_or_none()
    if not campus:
        raise HTTPException(status_code=404, detail="Campus no encontrado")
    return campus