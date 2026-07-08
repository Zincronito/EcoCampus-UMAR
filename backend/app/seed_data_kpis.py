"""
Script para insertar datos realistas y controlados para testing de KPIs.

Datos diseñados para verificar cálculos de:
- Tasa promedio (kg/día)
- Tasa semanal (kg/semana, solo L-V)
- Separación correcta
- Distribución por categoría/sector/campus

Uso:
    docker-compose --env-file .env.docker exec backend python -m app.seed_data_kpis
"""
import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.campus import Campus
from app.models.location import Location
from app.models.container import Container
from app.models.waste_category import WasteCategory
from app.models.collection_record import CollectionRecord
from app.models.incident import Incident
import uuid


async def seed_kpis():
    async with AsyncSessionLocal() as db:
        print("=" * 80)
        print("INSERTANDO DATOS REALISTAS PARA TESTING DE KPIs")
        print("=" * 80)

        try:
            # ──────────────────────────────────────────────────────────────────────────
            # 1. OBTENER DATOS EXISTENTES (Campus, Categorías, etc)
            # ──────────────────────────────────────────────────────────────────────────

            # Obtener campuses
            result = await db.execute(select(Campus).limit(3))
            campuses = result.scalars().all()
            
            if not campuses:
                print("❌ No hay campuses en la BD. Crea algunos primero.")
                return

            # Obtener categorías
            result = await db.execute(select(WasteCategory).limit(4))
            categories = result.scalars().all()
            
            if not categories:
                print("❌ No hay categorías en la BD. Crea algunas primero.")
                return

            # Obtener recolectores
            result = await db.execute(select(User).where(User.role == "collector").limit(2))
            collectors = result.scalars().all()
            
            if not collectors:
                print("❌ No hay recolectores en la BD. Crea algunos primero.")
                return

            # Obtener ubicaciones
            result = await db.execute(select(Location).limit(6))
            locations = result.scalars().all()
            
            if not locations:
                print("❌ No hay ubicaciones en la BD. Crea algunas primero.")
                return

            # Obtener contenedores
            result = await db.execute(select(Container).limit(4))
            containers = result.scalars().all()
            
            if not containers:
                print("❌ No hay contenedores en la BD. Crea algunos primero.")
                return

            print(f"✓ Datos base encontrados:")
            print(f"  - {len(campuses)} campus")
            print(f"  - {len(categories)} categorías")
            print(f"  - {len(collectors)} recolectores")
            print(f"  - {len(containers)} contenedores")

            # ──────────────────────────────────────────────────────────────────────────
            # 2. CREAR REGISTROS DE RECOLECCIÓN CON DATOS REALISTAS
            # ──────────────────────────────────────────────────────────────────────────

            # Fecha base: lunes 1 de julio 2026
            base_date = datetime(2026, 7, 1, 8, 0, 0)

            records_data = [
                # LUNES 1 - semana 27
                {
                    "date": base_date,  # Lunes 1 de julio
                    "container": containers[0],
                    "collector": collectors[0],
                    "gross_weight": 150.0,
                    "tare_weight": containers[0].tare_weight,
                    "fill_level": "three_quarter",
                    "separation_level": "0",  # Excelente
                    "is_estimated": False,
                },
                
                # MARTES 2 - +1 día
                {
                    "date": base_date + timedelta(days=1),
                    "container": containers[1],
                    "collector": collectors[1],
                    "gross_weight": 120.0,
                    "tare_weight": containers[1].tare_weight,
                    "fill_level": "half",
                    "separation_level": "1",  # Aceptable
                    "is_estimated": False,
                },
                
                # MIÉRCOLES 3 - +1 día
                {
                    "date": base_date + timedelta(days=2),
                    "container": containers[2],
                    "collector": collectors[0],
                    "gross_weight": 95.0,
                    "tare_weight": containers[2].tare_weight,
                    "fill_level": "quarter",
                    "separation_level": "2",  # Deficiente
                    "is_estimated": False,
                },
                
                # JUEVES 4 - +1 día
                {
                    "date": base_date + timedelta(days=3),
                    "container": containers[3],
                    "collector": collectors[1],
                    "gross_weight": None,  # SIN PESO - SERÁ ESTIMADO
                    "tare_weight": None,
                    "fill_level": "half",
                    "separation_level": "0",
                    "is_estimated": True,
                },
                
                # VIERNES 5 - +1 día
                {
                    "date": base_date + timedelta(days=4),
                    "container": containers[0],
                    "collector": collectors[1],
                    "gross_weight": 140.0,
                    "tare_weight": containers[0].tare_weight,
                    "fill_level": "three_quarter",
                    "separation_level": "1",
                    "is_estimated": False,
                },
                
                # SÁBADO 6 - FIN DE SEMANA - +1 día (no contar en tasa semanal)
                {
                    "date": base_date + timedelta(days=5),
                    "container": containers[1],
                    "collector": collectors[0],
                    "gross_weight": 80.0,
                    "tare_weight": containers[1].tare_weight,
                    "fill_level": "quarter",
                    "separation_level": "2",
                    "is_estimated": False,
                },
                
                # DOMINGO 7 - FIN DE SEMANA - +1 día (no contar en tasa semanal)
                {
                    "date": base_date + timedelta(days=6),
                    "container": containers[2],
                    "collector": collectors[1],
                    "gross_weight": None,
                    "tare_weight": None,
                    "fill_level": "full",
                    "separation_level": "3",  # Crítico
                    "is_estimated": True,
                },

                # LUNES 8 - semana 28 - +1 día
                {
                    "date": base_date + timedelta(days=7),
                    "container": containers[3],
                    "collector": collectors[0],
                    "gross_weight": 135.0,
                    "tare_weight": containers[3].tare_weight,
                    "fill_level": "three_quarter",
                    "separation_level": "0",
                    "is_estimated": False,
                },

                # MARTES 9 - +1 día
                {
                    "date": base_date + timedelta(days=8),
                    "container": containers[0],
                    "collector": collectors[1],
                    "gross_weight": None,
                    "tare_weight": None,
                    "fill_level": "half",
                    "separation_level": "1",
                    "is_estimated": True,
                },

                # MIÉRCOLES 10 - +1 día
                {
                    "date": base_date + timedelta(days=9),
                    "container": containers[1],
                    "collector": collectors[0],
                    "gross_weight": 105.0,
                    "tare_weight": containers[1].tare_weight,
                    "fill_level": "quarter",
                    "separation_level": "2",
                    "is_estimated": False,
                },

                # JUEVES 11 - +1 día
                {
                    "date": base_date + timedelta(days=10),
                    "container": containers[2],
                    "collector": collectors[1],
                    "gross_weight": 125.0,
                    "tare_weight": containers[2].tare_weight,
                    "fill_level": "three_quarter",
                    "separation_level": "0",
                    "is_estimated": False,
                },
            ]

            # ──────────────────────────────────────────────────────────────────────────
            # 3. INSERTAR REGISTROS
            # ──────────────────────────────────────────────────────────────────────────

            print("\n📝 Insertando registros de recolección:")
            
            for idx, data in enumerate(records_data, 1):
                container = data["container"]
                
                # Calcular peso neto
                if data["gross_weight"] is not None:
                    net_weight = data["gross_weight"] - data["tare_weight"]
                    is_estimated = False
                else:
                    # Calcular aproximado
                    fill_map = {
                        "empty": 0,
                        "quarter": 0.25,
                        "half": 0.5,
                        "three_quarter": 0.75,
                        "full": 0.95,
                        "overflow": 1.0,
                    }
                    fill_fraction = fill_map.get(data["fill_level"], 0.5)
                    volume = container.volume_cubic_meters or 0
                    density = container.waste_category.density_kg_per_cubic_meter or 0
                    net_weight = volume * density * fill_fraction
                    is_estimated = True

                record = CollectionRecord(
                    id=str(uuid.uuid4()),
                    gross_weight=data["gross_weight"],
                    net_weight=round(net_weight, 2),
                    fill_level=data["fill_level"],
                    physical_state="normal",
                    condition="good",
                    separation_level=data["separation_level"],
                    synced_from_offline=False,
                    device_recorded_at=data["date"].isoformat(),
                    is_weight_estimated=is_estimated,
                    created_at=data["date"],
                    container_id=container.id,
                    collector_id=data["collector"].id,
                )
                
                db.add(record)
                print(f"  {idx}. {data['date'].strftime('%a %d/%m %H:%M')} | "
                      f"{container.container_code} | "
                      f"{net_weight:.1f} kg {'(est)' if is_estimated else '(real)'}")

            await db.commit()

            # ──────────────────────────────────────────────────────────────────────────
            # 4. RESUMEN Y CÁLCULOS ESPERADOS
            # ──────────────────────────────────────────────────────────────────────────

            print("\n" + "=" * 80)
            print("✅ DATOS INSERTADOS EXITOSAMENTE")
            print("=" * 80)

            # Verificar totales
            result = await db.execute(select(CollectionRecord))
            all_records = result.scalars().all()
            
            total_weight = sum(r.net_weight or 0 for r in all_records)
            total_records = len(all_records)
            
            # Filtrar solo L-V
            weekday_records = [r for r in all_records if r.created_at.weekday() < 5]
            weekday_weight = sum(r.net_weight or 0 for r in weekday_records)
            
            print(f"\n📊 VERIFICACIÓN DE DATOS:")
            print(f"  Total registros: {total_records}")
            print(f"  Registros hábiles (L-V): {len(weekday_records)}")
            print(f"  Peso total: {total_weight:.2f} kg")
            print(f"  Peso hábiles: {weekday_weight:.2f} kg")
            
            print(f"\n🧮 CÁLCULOS ESPERADOS:")
            print(f"  Período: 9 días (1-10 de julio)")
            print(f"  Δt promedio: ~1.3 días entre eventos")
            print(f"  Tasa promedio esperada: ~{total_weight / 1.3:.2f} kg/día")
            print(f"  Tasa semanal esperada: ~{weekday_weight / 1.8:.2f} kg/semana")
            print(f"  (Semanas hábiles únicas: 2)")
            
            # Separación correcta
            correct = sum(1 for r in all_records if r.separation_level in ["0", "1"])
            pct_correct = (correct / total_records * 100) if total_records > 0 else 0
            print(f"  Separación correcta esperada: {pct_correct:.1f}%")
            
            print("\n" + "=" * 80)

        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
            await db.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(seed_kpis())