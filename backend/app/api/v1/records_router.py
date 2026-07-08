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
                "is_weight_estimated": record.is_weight_estimated,
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

@router.get("/analytics")
async def get_analytics(
    date_from: str | None = None,
    date_to: str | None = None,
    campus_id: uuid.UUID | None = None,
    sector: str | None = None,
    category_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db)
):
    """Calcula KPIs y métricas para el dashboard."""
    try:
        from sqlalchemy.orm import selectinload
        from app.models.container import Container
        from app.models.location import Location
        from datetime import datetime
        
        # Query base simple
        query = select(CollectionRecord)
        
        # Filtros de fecha solamente
        if date_from:
            date_from_obj = datetime.fromisoformat(date_from)
            query = query.where(CollectionRecord.created_at >= date_from_obj)
        
        if date_to:
            date_to_obj = datetime.fromisoformat(date_to)
            query = query.where(CollectionRecord.created_at <= date_to_obj)
        
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
# ──────────────────────────────────────────────────────────────────────────
        # CALCULAR PESO APROXIMADO PARA REGISTROS SIN PESO NETO
        # ──────────────────────────────────────────────────────────────────────────
        for record in records:
            if record.net_weight is None or record.net_weight == 0:
                # Intentar calcular peso aproximado
                if record.container and record.container.waste_category:
                    volumen = record.container.volume_cubic_meters or 0
                    densidad = record.container.waste_category.density_kg_per_cubic_meter or 0
                    
                    if volumen > 0 and densidad > 0:
                        # Mapeo de fill_level a fracción
                        fill_level_map = {
                            "empty": 0,
                            "quarter": 0.25,
                            "half": 0.5,
                            "three_quarter": 0.75,
                            "full": 0.95,
                            "overflow": 1.0,
                        }
                        fill_fraction = fill_level_map.get(record.fill_level, 0.5)

                        # peso_aproximado = volumen × densidad × fracción_llenado
                        peso_aprox = volumen * densidad * fill_fraction
                        record.net_weight = peso_aprox
                        record.is_weight_estimated = True  # ← MARCAR COMO ESTIMADO
        
        # Aplicar filtros en Python (post-procesamiento)
        if campus_id:
            records = [r for r in records if r.container and r.container.location and r.container.location.campus_id == campus_id]
        
        if sector:
            records = [r for r in records if r.container and r.container.location and r.container.location.sector == sector]
        
        if category_id:
            records = [r for r in records if r.container and r.container.waste_category_id == category_id]
        
        # Empty response
        if not records:
            return {
                "summary": {
                    "total_weight": 0,
                    "average_generation_rate": 0,
                    "total_records": 0,
                    "correct_separation_percentage": 0,
                },
                "generation": {
                    "by_category": [],
                    "by_sector": [],
                    "by_campus": [],
                    "temporal": [],
                },
                "operations": {
                    "average_fill_level": 0,
                    "overflow_frequency": 0,
                    "incident_count": 0,
                },
                "separation": {
                    "by_level": {},
                    "correct_percentage": 0,
                    "temporal": [],
                },
                "incidents": {
                    "uncovered": 0,
                    "fauna": 0,
                    "odor": 0,
                    "overflow": 0,
                    "total": 0,
                },
            }
        
        total_weight = sum(r.net_weight or 0 for r in records)
        total_records = len(records)
        
        if total_records > 1:
            time_diffs = []
            sorted_records = sorted(records, key=lambda x: x.created_at)
            for i in range(1, len(sorted_records)):
                delta = (sorted_records[i].created_at - sorted_records[i-1].created_at).days
                if delta > 0:
                    time_diffs.append(delta)
            avg_delta_t = sum(time_diffs) / len(time_diffs) if time_diffs else 1
            avg_generation_rate = total_weight / avg_delta_t if avg_delta_t > 0 else 0
        else:
            avg_generation_rate = total_weight
        
        # Tasa por semana (lunes-viernes)
        weekday_records = [r for r in records if r.created_at.weekday() < 5]
        
        if weekday_records:
            weeks = set()
            for record in weekday_records:
                iso_year, iso_week, _ = record.created_at.isocalendar()
                weeks.add((iso_year, iso_week))
            
            num_weeks = len(weeks) if weeks else 1
            weekday_total = sum(r.net_weight or 0 for r in weekday_records)
            weekly_generation_rate = weekday_total / num_weeks if num_weeks > 0 else 0
        else:
            weekly_generation_rate = 0
        
        correct_separation = sum(1 for r in records if r.separation_level in ["0", "1"])
        correct_separation_percentage = (correct_separation / total_records * 100) if total_records > 0 else 0
        
        by_category = {}
        for record in records:
            if not record.container or not record.container.waste_category:
                continue
            cat_id = str(record.container.waste_category.id)
            cat_name = record.container.waste_category.name
            cat_color = record.container.waste_category.color
            if cat_id not in by_category:
                by_category[cat_id] = {"name": cat_name, "weight": 0, "color": cat_color}
            by_category[cat_id]["weight"] += record.net_weight or 0
        
        category_data = [
            {
                "id": cat_id,
                "name": data["name"],
                "weight": round(data["weight"], 2),
                "percentage": round(data["weight"] / total_weight * 100, 2) if total_weight > 0 else 0,
                "color": data["color"],
            }
            for cat_id, data in by_category.items()
        ]
        
        by_sector = {}
        for record in records:
            if not record.container or not record.container.location:
                continue
            sector = record.container.location.sector
            if sector not in by_sector:
                by_sector[sector] = 0
            by_sector[sector] += record.net_weight or 0
        
        sector_data = [
            {"sector": s, "weight": round(w, 2), "percentage": round(w / total_weight * 100, 2) if total_weight > 0 else 0}
            for s, w in sorted(by_sector.items(), key=lambda x: x[1], reverse=True)
        ]
        
        by_campus = {}
        for record in records:
            if not record.container or not record.container.location or not record.container.location.campus:
                continue
            campus = record.container.location.campus.name
            if campus not in by_campus:
                by_campus[campus] = 0
            by_campus[campus] += record.net_weight or 0
        
        campus_data = [
            {"campus": c, "weight": round(w, 2), "percentage": round(w / total_weight * 100, 2) if total_weight > 0 else 0}
            for c, w in sorted(by_campus.items(), key=lambda x: x[1], reverse=True)
        ]
        
        temporal_data = {}
        for record in records:
            date_key = record.created_at.date().isoformat() if record.created_at else "unknown"
            if date_key not in temporal_data:
                temporal_data[date_key] = 0
            temporal_data[date_key] += record.net_weight or 0
        
        temporal_list = [
            {"date": d, "weight": round(w, 2)}
            for d, w in sorted(temporal_data.items())
        ]
        
        fill_level_map = {
            "empty": 0, "quarter": 1, "half": 2,
            "three_quarter": 3, "full": 4, "overflow": 5,
        }
        fill_levels = [fill_level_map.get(r.fill_level, 2) for r in records if r.fill_level]
        average_fill_level = sum(fill_levels) / len(fill_levels) if fill_levels else 0
        
        separation_levels = {}
        level_names = {"0": "Excelente", "1": "Aceptable", "2": "Deficiente", "3": "Crítico"}
        for record in records:
            level = record.separation_level  # Ya es string
            separation_levels[level] = separation_levels.get(level, 0) + 1
        
        separation_data = {
            level: {
                "count": count,
                "percentage": round(count / total_records * 100, 2),
                "name": level_names.get(level, f"Nivel {level}"),
            }
            for level, count in separation_levels.items()
        }
        
        incidents_count = sum(1 for r in records if r.incident)
        incident_tags = {}
        for record in records:
            if record.incident:
                tag = record.incident.quick_tag
                incident_tags[tag] = incident_tags.get(tag, 0) + 1
        
        incident_data = {
            "uncovered": incident_tags.get("destapado", 0),
            "fauna": incident_tags.get("fauna", 0),
            "odor": incident_tags.get("olor", 0),
            "overflow": incident_tags.get("desbordado", 0),
            "total": incidents_count,
        }
        
        temporal_separation = {}
        for record in records:
            date_key = record.created_at.date().isoformat() if record.created_at else "unknown"
            if date_key not in temporal_separation:
                temporal_separation[date_key] = {"total": 0, "correct": 0}
            temporal_separation[date_key]["total"] += 1
            if record.separation_level in ["0", "1"]:
                temporal_separation[date_key]["correct"] += 1
        
        temporal_separation_list = [
            {
                "date": d,
                "correct_percentage": round(data["correct"] / data["total"] * 100, 2) if data["total"] > 0 else 0,
            }
            for d, data in sorted(temporal_separation.items())
        ]
        
        return {
           "summary": {
                "total_weight": round(total_weight, 2),
                "average_generation_rate": round(avg_generation_rate, 2),
                "weekly_generation_rate": round(weekly_generation_rate, 2),
                "total_records": total_records,
                "correct_separation_percentage": round(correct_separation_percentage, 2),
            },
            "generation": {
                "by_category": category_data,
                "by_sector": sector_data,
                "by_campus": campus_data,
                "temporal": temporal_list,
            },
            "operations": {
                "average_fill_level": round(average_fill_level, 2),
                "overflow_frequency": incident_data["overflow"],
                "incident_count": incidents_count,
            },
            "separation": {
                "by_level": separation_data,
                "correct_percentage": round(correct_separation_percentage, 2),
                "temporal": temporal_separation_list,
            },
            "incidents": incident_data,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")