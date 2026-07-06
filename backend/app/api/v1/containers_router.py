"""
Router de Contenedores.
CRUD completo de contenedores fisicos.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field
import uuid
from app.core.database import get_db
from app.models.container import Container
from app.models.location import Location
from app.models.waste_category import WasteCategory
from app.models.campus import Campus
from sqlalchemy import func

router = APIRouter()


# ─────────────────────────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────────────────────────

class CategoryInfo(BaseModel):
    id: uuid.UUID
    name: str
    color: str
    icon: str | None = None

    class Config:
        from_attributes = True


class CampusInfo(BaseModel):
    id: uuid.UUID
    name: str
    code: str

    class Config:
        from_attributes = True


class LocationInfo(BaseModel):
    id: uuid.UUID
    name: str
    sector: str | None = None
    campus: CampusInfo | None = None

    class Config:
        from_attributes = True


class ContainerResponse(BaseModel):
    id: uuid.UUID
    container_code: str
    tare_weight: float
    volume_cubic_meters : float | None
    status: str
    qr_generated: bool
    is_active: bool
    location_id: uuid.UUID
    waste_category_id: uuid.UUID
    waste_category: CategoryInfo | None = None
    location: LocationInfo | None = None

    class Config:
        from_attributes = True


class ContainerCreate(BaseModel):
    container_code: str | None = Field(None, max_length=50)
    tare_weight: float = Field(..., ge=0)
    volume_cubic_meters : float | None = Field(None, ge=0)
    status: str = Field("active", max_length=50)
    location_id: uuid.UUID
    waste_category_id: uuid.UUID


class ContainerUpdate(BaseModel):
    container_code: str | None = Field(None, min_length=1, max_length=50)
    tare_weight: float | None = Field(None, ge=0)
    volume_cubic_meters : float | None = Field(None, ge=0)
    status: str | None = Field(None, max_length=50)
    location_id: uuid.UUID | None = None
    waste_category_id: uuid.UUID | None = None
    is_active: bool | None = None


# ─────────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────────

@router.get("", response_model=list[ContainerResponse])
async def get_all_containers(
    only_active: bool = True,
    location_id: uuid.UUID | None = None,
    waste_category_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Obtiene todos los contenedores.
    
    Parametros opcionales:
    - only_active: filtrar solo activos (default: True)
    - location_id: filtrar por ubicacion
    - waste_category_id: filtrar por categoria
    """
    try:
        query = select(Container).options(
            selectinload(Container.waste_category),
            selectinload(Container.location).selectinload(Location.campus),
        )
        
        if only_active:
            query = query.where(Container.is_active == True)
        
        if location_id:
            query = query.where(Container.location_id == location_id)
        
        if waste_category_id:
            query = query.where(Container.waste_category_id == waste_category_id)
        
        result = await db.execute(query.order_by(Container.container_code))
        containers = result.scalars().all()
        return containers
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/code/{container_code}", response_model=ContainerResponse)
async def get_container_by_code(
    container_code: str,
    db: AsyncSession = Depends(get_db),
):
    """Obtiene un contenedor por su codigo (ej: CONT-HUA-001). Para QR scan."""
    result = await db.execute(
        select(Container)
        .where(Container.container_code == container_code)
        .options(
            selectinload(Container.waste_category),
            selectinload(Container.location).selectinload(Location.campus),
        )
    )
    container = result.scalar_one_or_none()
    if not container:
        raise HTTPException(
            status_code=404,
            detail=f"Contenedor con codigo '{container_code}' no encontrado"
        )
    return container

@router.get("/next-code/{campus_id}")
async def get_next_container_code(
    campus_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Genera el siguiente codigo de contenedor disponible para un campus
    Formato: CONT-[CAMPUS_CODE]-[NNN]
    Ejemplo: CONT-HUA-003
    """
    try:
        # Obtener el campus
        campus_result = await db.execute(
            select(Campus).where(Campus.id == campus_id)
        )
        campus = campus_result.scalar_one_or_none()
        if not campus:
            raise HTTPException(status_code=404, detail="Campus no encontrado")
        
        # Buscar todos los contenedores de ubicaciones de ese campus
        # Necesitamos JOIN con Location para filtrar por campus
        prefix = f"CONT-{campus.code}-"
        
        result = await db.execute(
            select(Container.container_code)
            .join(Location, Container.location_id == Location.id)
            .where(Location.campus_id == campus_id)
            .where(Container.container_code.like(f"{prefix}%"))
        )
        existing_codes = [row[0] for row in result.all()]
        
        # Extraer numeros y obtener el maximo
        max_number = 0
        for code in existing_codes:
            try:
                # Extraer el numero al final: CONT-HUA-003 -> 003 -> 3
                number_part = code.replace(prefix, "")
                number = int(number_part)
                if number > max_number:
                    max_number = number
            except (ValueError, AttributeError):
                continue
        
        next_number = max_number + 1
        next_code = f"{prefix}{next_number:03d}"
        
        return {
            "code": next_code,
            "campus_code": campus.code,
            "campus_name": campus.name,
            "next_number": next_number,
            "existing_count": len(existing_codes),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/{container_id}", response_model=ContainerResponse)
async def get_container(
    container_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Obtiene un contenedor por su ID."""
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
    return container


@router.post("", response_model=ContainerResponse, status_code=201)
async def create_container(
    container: ContainerCreate,
    db: AsyncSession = Depends(get_db),
):
    """Crea un nuevo contenedor. Si no se envia container_code, se autogenera."""
    try:
        # Verificar que existan location y category
        loc_result = await db.execute(
            select(Location)
            .where(Location.id == container.location_id)
            .options(selectinload(Location.campus))
        )
        location = loc_result.scalar_one_or_none()
        if not location:
            raise HTTPException(status_code=400, detail="La ubicacion no existe")
        
        cat_result = await db.execute(
            select(WasteCategory).where(WasteCategory.id == container.waste_category_id)
        )
        if not cat_result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="La categoria no existe")
        
        # Autogenerar codigo si no viene o esta vacio
        final_code = container.container_code.strip() if container.container_code else ""
        
        if not final_code:
            # AUTOGENERAR
            campus = location.campus
            if not campus:
                raise HTTPException(
                    status_code=400, 
                    detail="La ubicacion no tiene campus asignado"
                )
            
            prefix = f"CONT-{campus.code}-"
            
            result = await db.execute(
                select(Container.container_code)
                .join(Location, Container.location_id == Location.id)
                .where(Location.campus_id == campus.id)
                .where(Container.container_code.like(f"{prefix}%"))
            )
            existing_codes = [row[0] for row in result.all()]
            
            max_number = 0
            for code in existing_codes:
                try:
                    number_part = code.replace(prefix, "")
                    number = int(number_part)
                    if number > max_number:
                        max_number = number
                except (ValueError, AttributeError):
                    continue
            
            next_number = max_number + 1
            final_code = f"{prefix}{next_number:03d}"
        
        # Verificar unicidad (por si vino manualmente)
        existing = await db.execute(
            select(Container).where(Container.container_code == final_code)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un contenedor con el codigo '{final_code}'"
            )
        
        # Crear
        new_container = Container(
            container_code=final_code,
            tare_weight=container.tare_weight,
            volume_cubic_meters =container.volume_cubic_meters ,
            status=container.status,
            location_id=container.location_id,
            waste_category_id=container.waste_category_id,
            qr_generated=False,
            is_active=True,
        )
        db.add(new_container)
        await db.commit()
        await db.refresh(new_container, ["waste_category", "location"])
        if new_container.location:
            await db.refresh(new_container.location, ["campus"])
        return new_container
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear: {str(e)}")


@router.patch("/{container_id}", response_model=ContainerResponse)
async def update_container(
    container_id: uuid.UUID,
    container_data: ContainerUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Actualiza un contenedor."""
    try:
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
        
        # Validar codigo unico si se cambia
        if container_data.container_code and container_data.container_code != container.container_code:
            existing = await db.execute(
                select(Container).where(Container.container_code == container_data.container_code)
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=400,
                    detail=f"Ya existe un contenedor con el codigo '{container_data.container_code}'"
                )
        
        # Validar location si se cambia
        if container_data.location_id and container_data.location_id != container.location_id:
            loc_result = await db.execute(
                select(Location).where(Location.id == container_data.location_id)
            )
            if not loc_result.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="La ubicacion no existe")
        
        # Validar category si se cambia
        if container_data.waste_category_id and container_data.waste_category_id != container.waste_category_id:
            cat_result = await db.execute(
                select(WasteCategory).where(WasteCategory.id == container_data.waste_category_id)
            )
            if not cat_result.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="La categoria no existe")
        
        # Actualizar
        update_data = container_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(container, key, value)
        
        await db.commit()
        await db.refresh(container, ["waste_category", "location"])
        if container.location:
            await db.refresh(container.location, ["campus"])
        return container
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar: {str(e)}")



@router.delete("/{container_id}", status_code=204)
async def delete_container(
    container_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Soft delete de un contenedor."""
    try:
        result = await db.execute(select(Container).where(Container.id == container_id))
        container = result.scalar_one_or_none()
        if not container:
            raise HTTPException(status_code=404, detail="Contenedor no encontrado")
        
        container.is_active = False
        await db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al desactivar: {str(e)}")