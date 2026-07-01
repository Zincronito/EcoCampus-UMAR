"""
Router de Recolectores (User con rol 'collector').
CRUD completo + autogenerado de ID de empleado.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.models.user import User
from app.models.campus import Campus

router = APIRouter()


# ────────────────────────────────────────────────────────────────────────────
# SCHEMAS
# ────────────────────────────────────────────────────────────────────────────

class CollectorResponse(BaseModel):
    id: uuid.UUID
    employee_id: str
    full_name: str
    email: str | None = None
    phone: str | None = None
    role: str
    shift: str | None = None
    assigned_sector: str | None = None
    is_active: bool

    class Config:
        from_attributes = True


class CollectorCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: str | None = Field(None, max_length=100)
    phone: str | None = Field(None, max_length=20)
    pin: str = Field(..., min_length=4, max_length=10)
    shift: str | None = Field(None, max_length=50)
    assigned_sector: str | None = Field(None, max_length=100)
    campus_code: str = Field(..., max_length=20)  # Para autogenerar el ID


class CollectorUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=150)
    email: str | None = Field(None, max_length=100)
    phone: str | None = Field(None, max_length=20)
    pin: str | None = Field(None, min_length=4, max_length=10)  # Opcional
    shift: str | None = Field(None, max_length=50)
    assigned_sector: str | None = Field(None, max_length=100)
    is_active: bool | None = None


# ────────────────────────────────────────────────────────────────────────────
# ENDPOINTS
# ────────────────────────────────────────────────────────────────────────────

@router.get("", response_model=list[CollectorResponse])
async def get_all_collectors(
    only_active: bool = True,
    db: AsyncSession = Depends(get_db),
):
    """Obtiene todos los recolectores (usuarios con rol='collector')."""
    try:
        query = select(User).where(User.role == "collector")
        if only_active:
            query = query.where(User.is_active == True)
        result = await db.execute(query.order_by(User.full_name))
        collectors = result.scalars().all()
        return collectors
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/next-id/{campus_code}")
async def get_next_collector_id(
    campus_code: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Genera el siguiente employee_id disponible para recolectores de un campus.
    
    Formato: REC-[CAMPUS_CODE]-[NNN]
    Ejemplo: REC-HUA-003
    """
    try:
        # Verificar que el campus existe
        campus_result = await db.execute(
            select(Campus).where(Campus.code == campus_code.upper())
        )
        campus = campus_result.scalar_one_or_none()
        if not campus:
            raise HTTPException(status_code=404, detail="Campus no encontrado")
        
        prefix = f"REC-{campus_code.upper()}-"
        
        # Buscar todos los usuarios cuyo employee_id empiece con el prefix
        result = await db.execute(
            select(User.employee_id)
            .where(User.role == "collector")
            .where(User.employee_id.like(f"{prefix}%"))
        )
        existing_ids = [row[0] for row in result.all()]
        
        max_number = 0
        for emp_id in existing_ids:
            try:
                number_part = emp_id.replace(prefix, "")
                number = int(number_part)
                if number > max_number:
                    max_number = number
            except (ValueError, AttributeError):
                continue
        
        next_number = max_number + 1
        next_id = f"{prefix}{next_number:03d}"
        
        return {
            "employee_id": next_id,
            "campus_code": campus_code.upper(),
            "campus_name": campus.name,
            "next_number": next_number,
            "existing_count": len(existing_ids),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/{collector_id}", response_model=CollectorResponse)
async def get_collector(
    collector_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Obtiene un recolector por su ID."""
    result = await db.execute(
        select(User).where(User.id == collector_id).where(User.role == "collector")
    )
    collector = result.scalar_one_or_none()
    if not collector:
        raise HTTPException(status_code=404, detail="Recolector no encontrado")
    return collector


@router.post("", response_model=CollectorResponse, status_code=201)
async def create_collector(
    collector: CollectorCreate,
    db: AsyncSession = Depends(get_db),
):
    """Crea un nuevo recolector. El employee_id se autogenera."""
    try:
        # Verificar que el campus exista
        campus_result = await db.execute(
            select(Campus).where(Campus.code == collector.campus_code.upper())
        )
        campus = campus_result.scalar_one_or_none()
        if not campus:
            raise HTTPException(
                status_code=400,
                detail=f"El campus '{collector.campus_code}' no existe"
            )
        
        # Autogenerar employee_id
        prefix = f"REC-{campus.code}-"
        result = await db.execute(
            select(User.employee_id)
            .where(User.role == "collector")
            .where(User.employee_id.like(f"{prefix}%"))
        )
        existing_ids = [row[0] for row in result.all()]
        
        max_number = 0
        for emp_id in existing_ids:
            try:
                number_part = emp_id.replace(prefix, "")
                number = int(number_part)
                if number > max_number:
                    max_number = number
            except (ValueError, AttributeError):
                continue
        
        next_number = max_number + 1
        final_id = f"{prefix}{next_number:03d}"
        
        # Verificar email unico si viene
        if collector.email:
            email_check = await db.execute(
                select(User).where(User.email == collector.email)
            )
            if email_check.scalar_one_or_none():
                raise HTTPException(
                    status_code=400,
                    detail=f"Ya existe un usuario con el email '{collector.email}'"
                )
        
        # Crear el recolector
        new_collector = User(
            employee_id=final_id,
            full_name=collector.full_name,
            email=collector.email,
            phone=collector.phone,
            hashed_pin=collector.pin,  # NOTA: en texto plano por ahora
            role="collector",
            shift=collector.shift,
            assigned_sector=collector.assigned_sector,
            is_active=True,
        )
        db.add(new_collector)
        await db.commit()
        await db.refresh(new_collector)
        return new_collector
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear: {str(e)}")


@router.patch("/{collector_id}", response_model=CollectorResponse)
async def update_collector(
    collector_id: uuid.UUID,
    collector_data: CollectorUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Actualiza un recolector."""
    try:
        result = await db.execute(
            select(User).where(User.id == collector_id).where(User.role == "collector")
        )
        collector = result.scalar_one_or_none()
        if not collector:
            raise HTTPException(status_code=404, detail="Recolector no encontrado")
        
        # Validar email unico si se cambia
        if collector_data.email and collector_data.email != collector.email:
            email_check = await db.execute(
                select(User).where(User.email == collector_data.email)
            )
            if email_check.scalar_one_or_none():
                raise HTTPException(
                    status_code=400,
                    detail=f"Ya existe un usuario con el email '{collector_data.email}'"
                )
        
        # Actualizar campos
        update_data = collector_data.model_dump(exclude_unset=True)
        
        # PIN: si viene, actualizar; si no, no tocar
        if "pin" in update_data:
            if update_data["pin"]:  # Solo si no es vacio
                collector.hashed_pin = update_data["pin"]
            del update_data["pin"]
        
        for key, value in update_data.items():
            setattr(collector, key, value)
        
        await db.commit()
        await db.refresh(collector)
        return collector
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar: {str(e)}")


@router.delete("/{collector_id}", status_code=204)
async def delete_collector(
    collector_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Soft delete de un recolector."""
    try:
        result = await db.execute(
            select(User).where(User.id == collector_id).where(User.role == "collector")
        )
        collector = result.scalar_one_or_none()
        if not collector:
            raise HTTPException(status_code=404, detail="Recolector no encontrado")
        
        collector.is_active = False
        await db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al desactivar: {str(e)}")