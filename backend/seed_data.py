"""
Script para cargar datos iniciales en la BD.
Ejecutar: python seed_data.py
"""

import asyncio
import sys
sys.path.insert(0, '/app')

from app.core.database import AsyncSessionLocal
from app.models.campus import Campus
from app.models.location import Location
from app.models.waste_category import WasteCategory
from app.models.user import User
from app.models.container import Container
from app.models.collection_record import CollectionRecord
from app.models.incident import Incident
from werkzeug.security import generate_password_hash
import uuid


async def seed():
    """Carga datos iniciales en la BD."""
    async with AsyncSessionLocal() as session:
        try:
            print("🌱 Iniciando seed...")
            
            # ────────────────────────────────────────────────────────────
            # 1. CREAR CAMPUS
            # ────────────────────────────────────────────────────────────
            print("📍 Creando campus...")
            
            campus_huatulco = Campus(
                name="Campus Huatulco",
                code="HUA",
                address="Benito Juárez s/n, Huatulco, Oaxaca"
            )
            campus_puerto_angel = Campus(
                name="Campus Puerto Ángel",
                code="PA",
                address="Carretera Costera, Puerto Ángel, Oaxaca"
            )
            campus_zipolite = Campus(
                name="Campus Zipolite",
                code="ZIP",
                address="Calle Principal, Zipolite, Oaxaca"
            )
            
            session.add_all([campus_huatulco, campus_puerto_angel, campus_zipolite])
            await session.flush()
            
            # ────────────────────────────────────────────────────────────
            # 2. CREAR CATEGORÍAS DE RESIDUO
            # ────────────────────────────────────────────────────────────
            print("♻️  Creando categorías de residuo...")
            
            categories = [
                WasteCategory(name="Orgánico", description="Residuos orgánicos", color="#8B4513"),
                WasteCategory(name="Papel y Cartón", description="Papel y cartón", color="#FFD700"),
                WasteCategory(name="Plástico", description="Plástico PET y otros", color="#4169E1"),
                WasteCategory(name="Vidrio", description="Vidrio", color="#00FF00"),
                WasteCategory(name="Metal", description="Metal y aluminio", color="#C0C0C0"),
                WasteCategory(name="Inorgánico", description="Residuos inorgánicos", color="#808080"),
            ]
            
            session.add_all(categories)
            await session.flush()
            
            # ────────────────────────────────────────────────────────────
            # 3. CREAR UBICACIONES
            # ────────────────────────────────────────────────────────────
            print("📌 Creando ubicaciones...")
            
            locations = [
                Location(name="Plaza Central", sector="Centro", location_type="plaza", campus_id=campus_huatulco.id),
                Location(name="Instituto de Biología", sector="Académico", location_type="building", campus_id=campus_huatulco.id),
                Location(name="Cafetería Principal", sector="Servicios", location_type="cafeteria", campus_id=campus_puerto_angel.id),
                Location(name="Biblioteca", sector="Académico", location_type="building", campus_id=campus_puerto_angel.id),
                Location(name="Jardín Botánico", sector="Investigación", location_type="garden", campus_id=campus_zipolite.id),
                Location(name="Estacionamiento", sector="Servicios", location_type="parking", campus_id=campus_zipolite.id),
                Location(name="Laboratorio Marino", sector="Investigación", location_type="lab", campus_id=campus_huatulco.id),
            ]
            
            session.add_all(locations)
            await session.flush()
            
            # ────────────────────────────────────────────────────────────
            # 4. CREAR USUARIOS
            # ────────────────────────────────────────────────────────────
            print("👤 Creando usuarios...")
            
            admin = User(
                employee_id="ADMIN-001",
                full_name="Administrador General",
                email="admin@ecocampus.mx",
                phone="9511234567",
                hashed_pin=generate_password_hash("1234"),
                role="admin",
                shift="morning",
                is_active=True
            )
            
            collectors = [
                User(
                    employee_id="REC-HUA-001",
                    full_name="Roberto Mendoza García",
                    email="roberto@ecocampus.mx",
                    phone="9512345678",
                    hashed_pin=generate_password_hash("0000"),
                    role="collector",
                    shift="morning",
                    assigned_sector="Huatulco",
                    is_active=True
                ),
                User(
                    employee_id="REC-PA-001",
                    full_name="María López Rodríguez",
                    email="maria@ecocampus.mx",
                    phone="9513456789",
                    hashed_pin=generate_password_hash("0000"),
                    role="collector",
                    shift="afternoon",
                    assigned_sector="Puerto Ángel",
                    is_active=True
                ),
                User(
                    employee_id="SUP-001",
                    full_name="Carlos Sánchez Juárez",
                    email="carlos@ecocampus.mx",
                    phone="9514567890",
                    hashed_pin=generate_password_hash("0000"),
                    role="supervisor",
                    shift="morning",
                    is_active=True
                ),
            ]
            
            session.add(admin)
            session.add_all(collectors)
            await session.flush()
            
            # ────────────────────────────────────────────────────────────
            # 5. CREAR CONTENEDORES
            # ────────────────────────────────────────────────────────────
            print("🗑️  Creando contenedores...")
            
            containers = [
                Container(
                    container_code="CONT-HUA-001",
                    tare_weight=5.0,
                    volume_liters=120,
                    status="active",
                    location_id=locations[0].id,
                    waste_category_id=categories[0].id,
                ),
                Container(
                    container_code="CONT-HUA-002",
                    tare_weight=5.0,
                    volume_liters=120,
                    status="active",
                    location_id=locations[1].id,
                    waste_category_id=categories[1].id,
                ),
                Container(
                    container_code="CONT-PA-001",
                    tare_weight=5.0,
                    volume_liters=120,
                    status="active",
                    location_id=locations[2].id,
                    waste_category_id=categories[2].id,
                ),
                Container(
                    container_code="CONT-PA-002",
                    tare_weight=5.0,
                    volume_liters=120,
                    status="active",
                    location_id=locations[3].id,
                    waste_category_id=categories[3].id,
                ),
                Container(
                    container_code="CONT-ZIP-001",
                    tare_weight=5.0,
                    volume_liters=120,
                    status="active",
                    location_id=locations[4].id,
                    waste_category_id=categories[4].id,
                ),
                Container(
                    container_code="CONT-ZIP-002",
                    tare_weight=5.0,
                    volume_liters=120,
                    status="active",
                    location_id=locations[5].id,
                    waste_category_id=categories[5].id,
                ),
            ]
            
            session.add_all(containers)
            await session.flush()
            
            # ────────────────────────────────────────────────────────────
            # 6. CREAR REPORTES DE RECOLECCIÓN
            # ────────────────────────────────────────────────────────────
            print("📝 Creando reportes de recolección...")
            
            records = [
                CollectionRecord(
                    gross_weight=45.5,
                    net_weight=40.5,
                    fill_level="85",
                    condition="good",
                    separation_level="2",
                    container_id=containers[0].id,
                    collector_id=collectors[0].id,
                ),
                CollectionRecord(
                    gross_weight=38.2,
                    net_weight=33.2,
                    fill_level="75",
                    condition="fair",
                    separation_level="1",
                    container_id=containers[1].id,
                    collector_id=collectors[0].id,
                ),
                CollectionRecord(
                    gross_weight=52.0,
                    net_weight=47.0,
                    fill_level="95",
                    condition="good",
                    separation_level="3",
                    container_id=containers[2].id,
                    collector_id=collectors[1].id,
                ),
                CollectionRecord(
                    gross_weight=28.5,
                    net_weight=23.5,
                    fill_level="60",
                    condition="good",
                    separation_level="2",
                    container_id=containers[3].id,
                    collector_id=collectors[1].id,
                ),
            ]
            
            session.add_all(records)
            await session.flush()
            
            # ────────────────────────────────────────────────────────────
            # 7. CREAR INCIDENTES
            # ────────────────────────────────────────────────────────────
            print("⚠️  Creando incidentes...")
            
            incidents = [
                Incident(
                    description="Contenedor dañado en la esquina, falta una manija",
                    quick_tag="damage",
                    status="open",
                    container_id=containers[0].id,
                    reported_by_id=collectors[0].id,
                    collection_record_id=records[0].id,
                ),
                Incident(
                    description="Presencia de fauna nociva (hormigas) en el sector",
                    quick_tag="fauna",
                    status="open",
                    container_id=containers[1].id,
                    reported_by_id=collectors[0].id,
                ),
                Incident(
                    description="Derrame de líquidos en la zona de recolección",
                    quick_tag="spillage",
                    status="in_progress",
                    container_id=containers[2].id,
                    reported_by_id=collectors[1].id,
                ),
            ]
            
            session.add_all(incidents)
            
            # ────────────────────────────────────────────────────────────
            # COMMIT
            # ────────────────────────────────────────────────────────────
            await session.commit()
            print("✅ Seed completado correctamente!")
            print(f"   - {len([campus_huatulco, campus_puerto_angel, campus_zipolite])} campus")
            print(f"   - {len(categories)} categorías")
            print(f"   - {len(locations)} ubicaciones")
            print(f"   - {len([admin] + collectors)} usuarios")
            print(f"   - {len(containers)} contenedores")
            print(f"   - {len(records)} reportes de recolección")
            print(f"   - {len(incidents)} incidentes")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error en seed: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(seed())