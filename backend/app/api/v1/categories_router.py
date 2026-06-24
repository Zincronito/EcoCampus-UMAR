"""
Router: Categorias de residuos (Waste Categories).
Endpoints para gestionar las categorias de residuos (Organicos, Inorganicos, etc.)
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.waste_category import WasteCategory

router = APIRouter(prefix="/categories", tags=["Categorias"])


# ============================================================
# SCHEMAS PYDANTIC
# ============================================================

class CategoryResponse(BaseModel):
    """Schema de respuesta para una categoria"""
    id: uuid.UUID
    name: str
    description: str | None = None
    color: str
    icon: str | None = None
    is_active: bool
    density_kg_per_liter: float | None = None


class CategoryCreate(BaseModel):
    """Schema para crear una nueva categoria"""
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)
    color: str = Field(..., max_length=50)
    icon: str | None = Field(None, max_length=50)
    density_kg_per_liter: float | None = Field(None, ge=0)


class CategoryUpdate(BaseModel):
    """Schema para actualizar una categoria (todos los campos opcionales)"""
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)
    color: str | None = Field(None, max_length=50)
    icon: str | None = Field(None, max_length=50)
    is_active: bool | None = None
    density_kg_per_liter: float | None = Field(None, ge=0)


class DensityUpdate(BaseModel):
    """Schema para actualizar solo la densidad"""
    density_kg_per_liter: float = Field(..., ge=0)


# ============================================================
# ENDPOINTS
# ============================================================

@router.get("", response_model=list[CategoryResponse])
async def get_all_categories(
    only_active: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene todas las categorias de residuos.
    Por defecto solo retorna las activas.
    """
    try:
        query = select(WasteCategory)
        if only_active:
            query = query.where(WasteCategory.is_active == True)
        
        result = await db.execute(query)
        categories = result.scalars().all()
        return categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener categorias: {str(e)}")


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Obtiene una categoria por su ID."""
    try:
        result = await db.execute(
            select(WasteCategory).where(WasteCategory.id == category_id)
        )
        category = result.scalar_one_or_none()
        
        if not category:
            raise HTTPException(status_code=404, detail="Categoria no encontrada")
        
        return category
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener categoria: {str(e)}")


@router.post("", response_model=CategoryResponse, status_code=201)
async def create_category(
    category: CategoryCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Crea una nueva categoria de residuos.
    Solo accesible para administradores.
    """
    try:
        # Verificar que no exista una categoria con el mismo nombre
        existing = await db.execute(
            select(WasteCategory).where(WasteCategory.name == category.name)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe una categoria con el nombre '{category.name}'"
            )
        
        new_category = WasteCategory(
            name=category.name,
            description=category.description,
            color=category.color,
            icon=category.icon,
            density_kg_per_liter=category.density_kg_per_liter,
            is_active=True,
        )
        
        db.add(new_category)
        await db.commit()
        await db.refresh(new_category)
        
        return new_category
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear categoria: {str(e)}")


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: uuid.UUID,
    update_data: CategoryUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Actualiza los datos de una categoria.
    Util para que los admins corrijan datos como densidad, color, etc.
    """
    try:
        result = await db.execute(
            select(WasteCategory).where(WasteCategory.id == category_id)
        )
        category = result.scalar_one_or_none()
        
        if not category:
            raise HTTPException(status_code=404, detail="Categoria no encontrada")
        
        # Actualizar solo los campos enviados
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(category, field, value)
        
        await db.commit()
        await db.refresh(category)
        
        return category
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar categoria: {str(e)}")


@router.patch("/{category_id}/density", response_model=CategoryResponse)
async def update_category_density(
    category_id: uuid.UUID,
    density_data: DensityUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Actualiza solo la densidad de una categoria.
    Endpoint especifico para ajustes de precision basados en datos reales.
    """
    try:
        result = await db.execute(
            select(WasteCategory).where(WasteCategory.id == category_id)
        )
        category = result.scalar_one_or_none()
        
        if not category:
            raise HTTPException(status_code=404, detail="Categoria no encontrada")
        
        category.density_kg_per_liter = density_data.density_kg_per_liter
        
        await db.commit()
        await db.refresh(category)
        
        return category
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar densidad: {str(e)}")


@router.delete("/{category_id}", status_code=204)
async def delete_category(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Soft delete de una categoria (la marca como inactiva).
    No la elimina fisicamente para preservar integridad referencial.
    """
    try:
        result = await db.execute(
            select(WasteCategory).where(WasteCategory.id == category_id)
        )
        category = result.scalar_one_or_none()
        
        if not category:
            raise HTTPException(status_code=404, detail="Categoria no encontrada")
        
        category.is_active = False
        await db.commit()
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar categoria: {str(e)}")