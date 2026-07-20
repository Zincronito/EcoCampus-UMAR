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
    is_weight_estimated: bool
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
        # Validar que el contenedor existe (cargar waste_category)
        from sqlalchemy.orm import selectinload
        
        container_result = await db.execute(
            select(Container)
            .where(Container.id == record.container_id)
            .options(selectinload(Container.waste_category))
        )
        container = container_result.scalar_one_or_none()
        if not container:
            raise HTTPException(status_code=404, detail="Contenedor no encontrado")
       
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
       
        # CALCULAR PESO APROXIMADO SI NO VIENE
        net_weight = record.net_weight
        is_weight_estimated = False
       
        if net_weight is None or net_weight == 0:
            if container and container.waste_category:
                volumen = container.volume_cubic_meters or 0
                densidad = container.waste_category.density_kg_per_cubic_meter or 0
               
                if volumen > 0 and densidad > 0:
                    fill_level_map = {
                        "empty": 0,
                        "quarter": 0.25,
                        "half": 0.5,
                        "three_quarter": 0.75,
                        "full": 0.95,
                        "overflow": 1.0,
                    }
                    fill_fraction = fill_level_map.get(record.fill_level, 0.5)
                    net_weight = volumen * densidad * fill_fraction
                    is_weight_estimated = True
       
        # Crear el reporte (UNA SOLA VEZ)
        new_record = CollectionRecord(
            gross_weight=record.gross_weight,
            net_weight=net_weight,
            fill_level=record.fill_level,
            physical_state=record.physical_state,
            condition=record.condition,
            separation_level=record.separation_level,
            is_weight_estimated=is_weight_estimated,
            container_id=record.container_id,
            collector_id=record.collector_id,
            synced_from_offline=record.synced_from_offline,
            device_recorded_at=record.device_recorded_at,
        )
       
        db.add(new_record)
        await db.commit()
        await db.refresh(new_record)
        
    # ─── Generar notificaciones según problemas detectados
        from app.models.notification import Notification
        
        notifications_to_create = []
        
        # Verificar condiciones problemáticas
        if record.condition:
            conditions = record.condition.lower().split(",")
            
            if any("destapado" in c for c in conditions):
                notifications_to_create.append({
                    "title": "Contenedor Destapado",
                    "message": f"Contenedor en mal estado detectado",
                    "type": "uncovered",
                    "severity": "warning"
                })
            
            if any("fauna" in c for c in conditions):
                notifications_to_create.append({
                    "title": "Presencia de Fauna",
                    "message": f"Fauna nociva detectada en contenedor",
                    "type": "fauna",
                    "severity": "critical"
                })
            
            if any("huele_mal" in c for c in conditions):  # ← Cambiar "olor" por "huele_mal"
                notifications_to_create.append({
                    "title": "Mal Olor",
                    "message": f"Contenedor con mal olor detectado",
                    "type": "odor",
                    "severity": "warning"
                })
            
            if any("desbordad" in c for c in conditions):
                notifications_to_create.append({
                    "title": "Contenedor Desbordado",
                    "message": f"Contenedor desbordado - requiere atención inmediata",
                    "type": "overflow",
                    "severity": "critical"
                })
        
        # Verificar separación deficiente
        try:
            separation_level = int(record.separation_level)
            if separation_level >= 2:  # Deficiente o crítico
                notifications_to_create.append({
                    "title": "Separación Deficiente",
                    "message": f"Sector con mala separación detectado",
                    "type": "separation",
                    "severity": "warning"
                })
        except:
            pass
        
        admin_result = await db.execute(
            select(User).where(User.role == "admin").limit(1)
        )
        admin_user = admin_result.scalar_one_or_none()
        admin_user_id = admin_user.id if admin_user else None

        # Crear notificaciones (UN SOLO LOOP)
        if admin_user_id:
            for notif_data in notifications_to_create:
                notification = Notification(
                    title=notif_data["title"],
                    message=notif_data["message"],
                    notification_type=notif_data["type"],
                    severity=notif_data["severity"],
                    user_id=admin_user_id,
                )
                db.add(notification)
    
            if notifications_to_create:
                await db.commit()

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
    limit_days: int | None = None,
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
        from datetime import timedelta, timezone

        query = select(CollectionRecord).where(
            CollectionRecord.collector_id == collector_id
        )

        # Filtro opcional por días recientes
        if limit_days is not None and limit_days > 0:
            MEXICO_OFFSET = timezone(timedelta(hours=-6))
            cutoff_date = datetime.now(MEXICO_OFFSET) - timedelta(days=limit_days)
            query = query.where(CollectionRecord.created_at >= cutoff_date)

        query = query.options(
            selectinload(CollectionRecord.container)
            .selectinload(Container.waste_category),
            selectinload(CollectionRecord.container)
            .selectinload(Container.location)
            .selectinload(Location.campus),
            selectinload(CollectionRecord.incident),
        ).order_by(CollectionRecord.created_at.desc())

        result = await db.execute(query)
        records = result.scalars().all()
        
        # Armar la respuesta con info enriquecida
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
        from datetime import timedelta, timezone
        
        # Filtros de fecha (asumiendo UTC-6 México)
        MEXICO_OFFSET = timezone(timedelta(hours=-6))
        
        if date_from:
            # Interpretar como fecha local México y convertir a UTC
            date_from_obj = datetime.fromisoformat(date_from).replace(tzinfo=MEXICO_OFFSET)
            query = query.where(CollectionRecord.created_at >= date_from_obj)

        if date_to:
            # Sumar 1 día para incluir todo el día final, e interpretar como local México
            date_to_obj = (datetime.fromisoformat(date_to) + timedelta(days=1)).replace(tzinfo=MEXICO_OFFSET)
            query = query.where(CollectionRecord.created_at < date_to_obj)
        
        # Si hay algún filtro que requiera JOINs, los hacemos UNA sola vez al principio
        needs_container_join = category_id or location_id or campus_id
        needs_location_join = campus_id

        if needs_container_join:
            query = query.join(Container, CollectionRecord.container_id == Container.id)

        if needs_location_join:
            query = query.join(Location, Container.location_id == Location.id)

        if collector_id:
            query = query.where(CollectionRecord.collector_id == collector_id)

        if category_id:
            query = query.where(Container.waste_category_id == category_id)

        if location_id:
            query = query.where(Container.location_id == location_id)

        if campus_id:
            query = query.where(Location.campus_id == campus_id)
        
        if has_incident is not None:
            from app.models.incident import Incident
            from sqlalchemy import exists
    
            if has_incident:
                query = query.where(
                    exists().where(Incident.collection_record_id == CollectionRecord.id)
                )
            else:
                query = query.where(
                    ~exists().where(Incident.collection_record_id == CollectionRecord.id)
        )
        
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
                    "photo_url": record.incident.photo_url,
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
         # Filtros de fecha (opcionales)
         # Filtros de fecha (asumiendo UTC-6 México)
        from datetime import timedelta, timezone
        MEXICO_OFFSET = timezone(timedelta(hours=-6))
        
        if date_from:
            date_from_obj = datetime.fromisoformat(date_from).replace(tzinfo=MEXICO_OFFSET)
            query = query.where(CollectionRecord.created_at >= date_from_obj)

        if date_to:
            date_to_obj = (datetime.fromisoformat(date_to) + timedelta(days=1)).replace(tzinfo=MEXICO_OFFSET)
            query = query.where(CollectionRecord.created_at < date_to_obj)
        
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
        
        # Aplicar filtros en Python (post-procesamiento)
        if campus_id:
            records = [r for r in records if r.container and r.container.location and r.container.location.campus_id == campus_id]
        
        if sector:
            records = [r for r in records if r.container and r.container.location and r.container.location.sector == sector]
        
        if category_id:
            records = [r for r in records if r.container and r.container.waste_category_id == category_id]
        
        # Empty response
        # NIVEL DE SEPARACIÓN PROMEDIO
        if records:
            separation_values = []
            for record in records:
                try:
                    sep_level = int(record.separation_level)
                    separation_values.append(sep_level)
                except (ValueError, TypeError):
                    pass
            
            if separation_values:
                average_separation = sum(separation_values) / len(separation_values)
                average_separation_rounded = round(average_separation)
            else:
                average_separation_rounded = 0
        else:
            average_separation_rounded = 0
        if not records:
            return {
                "summary": {
                    "total_weight": 0,
                    "average_generation_rate": 0,
                    "total_records": 0,
                    "correct_separation_percentage": 0,
                    "average_separation_level": average_separation_rounded,
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
            sorted_records = sorted(records, key=lambda x: x.created_at)
            fecha_min = sorted_records[0].created_at
            fecha_max = sorted_records[-1].created_at
            
            # Período total en DÍAS CALENDARIO (no promedio de intervalos)
            periodo_total_dias = (fecha_max - fecha_min).days + 1
            
            avg_generation_rate = total_weight / periodo_total_dias
        else:
            avg_generation_rate = total_weight if total_weight > 0 else 0
        
        # Tasa por semana (lunes-viernes)
        weekly_generation_rate = avg_generation_rate * 7
        
        correct_separation = sum(1 for r in records if r.separation_level in ["0", "1"])
        correct_separation_percentage = (correct_separation / total_records * 100) if total_records > 0 else 0
        separation_levels = []
        for r in records:
            if r.separation_level and r.separation_level.isdigit():
                separation_levels.append(int(r.separation_level))
        
        if separation_levels:
            avg_separation_level = round(sum(separation_levels) / len(separation_levels))
        else:
            avg_separation_level = 0
        
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
        # Llenado promedio por sector
        fill_level_by_sector = {}
        for record in records:
            sector = record.container.location.sector if record.container.location else "Sin sector"
            if sector not in fill_level_by_sector:
                fill_level_by_sector[sector] = []
            
            fill_map = {"empty": 0, "quarter": 1, "half": 2, "three_quarter": 3, "full": 4, "overflow": 5}
            fill_value = fill_map.get(record.fill_level, 0)
            fill_level_by_sector[sector].append(fill_value)
        
        by_fill_level_sector = [
            {"sector": sector, "average_fill": round(sum(values) / len(values), 2)}
            for sector, values in fill_level_by_sector.items()
        ]
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
# Contar condiciones del contenedor (destapado, fauna, mal olor, desbordado)
        conditions_count = {}
        for record in records:
            if record.condition:
                conditions = [c.strip().lower() for c in record.condition.split(",")]
                for cond in conditions:
                    conditions_count[cond] = conditions_count.get(cond, 0) + 1

        uncovered_count = sum(conditions_count.get(c, 0) for c in conditions_count.keys() if "destapado" in c)
        fauna_count = sum(conditions_count.get(c, 0) for c in conditions_count.keys() if "fauna" in c)
        odor_count = sum(conditions_count.get(c, 0) for c in conditions_count.keys() if "olor" in c or "huele" in c)
        overflow_count = sum(conditions_count.get(c, 0) for c in conditions_count.keys() if "desbordad" in c)

        incident_data = {
            "uncovered": uncovered_count,
            "fauna": fauna_count,
            "odor": odor_count,
            "overflow": overflow_count,
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
                "average_separation_level": avg_separation_level,
            },
            "generation": {
                "by_category": category_data,
                "by_sector": sector_data,
                "by_campus": campus_data,
                "temporal": temporal_list,
                "by_fill_level_sector": by_fill_level_sector,
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