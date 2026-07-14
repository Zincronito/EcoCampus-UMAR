import asyncio
import uuid
import random
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.collection_record import CollectionRecord
from app.models.notification import Notification
from app.models.container import Container
from app.models.user import User

async def seed():
    async with AsyncSessionLocal() as session:
        # Obtener TODOS los contenedores reales
        containers_result = await session.execute(select(Container))
        containers = containers_result.scalars().all()
        
        if not containers:
            print("❌ No hay contenedores. Créalos primero.")
            return
        
        # Obtener recolector
        users_result = await session.execute(select(User).where(User.role == "collector"))
        collectors = users_result.scalars().all()
        collector_id = collectors[0].id if collectors else uuid.UUID("6521db40-04d2-4baf-8c09-4b9e0b026269")
        
        print(f"📦 Contenedores disponibles: {len(containers)}")
        print(f"👤 Recolector: {collector_id}")
        
        # Opciones variadas
        conditions_options = [
            "tapado",
            "tapado",
            "tapado",  # Más comunes (sin problemas)
            "destapado",
            "huele_mal",
            "fauna",
            "desbordado",
            "destapado,huele_mal",
            "fauna,desbordado",
            "destapado,fauna,huele_mal",
            "desbordado,huele_mal,fauna,destapado",
        ]
        
        fill_levels = ["empty", "quarter", "half", "three_quarter", "full", "overflow"]
        separation_levels = ["0", "0", "0", "1", "1", "2", "2", "3", "3"]  # Distribuido
        physical_states = ["buen_estado", "buen_estado", "buen_estado", "contenedor_roto", "tapa_rota"]
        
        # Pesos base por categoría (simulando diferentes tipos de residuos)
        weight_ranges = [(20, 60), (40, 100), (60, 150), (80, 200)]
        
        # Generar 60 registros distribuidos en 60 días
        count = 0
        for day_offset in range(60):
            # 1-2 registros por día
            records_per_day = random.randint(1, 3)
            
            for _ in range(records_per_day):
                container = random.choice(containers)
                weight_range = random.choice(weight_ranges)
                gross = random.uniform(weight_range[0], weight_range[1])
                net = gross - random.uniform(3, 8)
                
                record = CollectionRecord(
                    gross_weight=round(gross, 2),
                    net_weight=round(net, 2),
                    fill_level=random.choice(fill_levels),
                    physical_state=random.choice(physical_states),
                    condition=random.choice(conditions_options),
                    separation_level=random.choice(separation_levels),
                    is_weight_estimated=random.random() < 0.25,
                    container_id=container.id,
                    collector_id=collector_id,
                    created_at=datetime.now(timezone.utc) - timedelta(
                        days=60-day_offset,
                        hours=random.randint(0, 23),
                        minutes=random.randint(0, 59)
                    ),
                )
                session.add(record)
                count += 1
        
        await session.commit()
        print(f"✅ {count} registros creados con datos variados")
        print(f"   📅 Distribuidos en los últimos 60 días")
        print(f"   📦 Usando {len(containers)} contenedores diferentes")
        print(f"   🎯 Con múltiples condiciones, niveles de llenado y separación")

asyncio.run(seed())