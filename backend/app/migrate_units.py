"""
Script para migrar unidades de contenedores y categorías:
- containers.volumeLiters (L) → containers.volumeCubicMeters (m³)
- waste_categories.densityKgPerLiter (kg/L) → waste_categories.densityKgPerCubicMeter (kg/m³)

Conversiones:
- 1 m³ = 1000 L → volumen_L / 1000 = volumen_m³
- 1 kg/L = 1000 kg/m³ → densidad_kg_L * 1000 = densidad_kg_m³

Uso:
    docker-compose --env-file .env.docker exec backend python migrate_units.py
"""
import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionLocal


async def migrate_units():
    print("=" * 60)
    print("Iniciando migración de unidades a m³ y kg/m³")
    print("=" * 60)

    async with AsyncSessionLocal() as db:
        # ──────────────────────────────────────────────────────────────────────────
        # PARTE 1: Contenedores (volumeLiters → volumeCubicMeters)
        # ──────────────────────────────────────────────────────────────────────────
        print("\n📦 CONTENEDORES:")

        # Verificar si la columna nueva ya existe
        result = await db.execute(text("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'containers' AND column_name = 'volumeCubicMeters'
        """))
        new_col_exists = result.scalar_one_or_none() is not None

        if new_col_exists:
            print("  ✓ Columna 'volumeCubicMeters' ya existe, saltando renombrado")
        else:
            # Verificar si existe la columna vieja
            result = await db.execute(text("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'containers' AND column_name = 'volumeLiters'
            """))
            old_col_exists = result.scalar_one_or_none() is not None

            if old_col_exists:
                # Renombrar columna
                await db.execute(text('ALTER TABLE containers RENAME COLUMN "volumeLiters" TO "volumeCubicMeters"'))
                print("  ✓ Columna renombrada: volumeLiters → volumeCubicMeters")

                # Convertir valores (dividir entre 1000)
                await db.execute(text('UPDATE containers SET "volumeCubicMeters" = "volumeCubicMeters" / 1000 WHERE "volumeCubicMeters" IS NOT NULL'))

                # Contar registros actualizados
                result = await db.execute(text('SELECT COUNT(*) FROM containers WHERE "volumeCubicMeters" IS NOT NULL'))
                count = result.scalar()
                print(f"  ✓ {count} contenedor(es) convertidos de L a m³")
            else:
                print("  ⚠️  Columna 'volumeLiters' no existe, nada que migrar")

        # ──────────────────────────────────────────────────────────────────────────
        # PARTE 2: Categorías (densityKgPerLiter → densityKgPerCubicMeter)
        # ──────────────────────────────────────────────────────────────────────────
        print("\n♻️  CATEGORÍAS:")

        # Verificar si la columna nueva ya existe
        result = await db.execute(text("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'waste_categories' AND column_name = 'densityKgPerCubicMeter'
        """))
        new_col_exists = result.scalar_one_or_none() is not None

        if new_col_exists:
            print("  ✓ Columna 'densityKgPerCubicMeter' ya existe, saltando renombrado")
        else:
            # Verificar si existe la columna vieja
            result = await db.execute(text("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'waste_categories' AND column_name = 'densityKgPerLiter'
            """))
            old_col_exists = result.scalar_one_or_none() is not None

            if old_col_exists:
                # Renombrar columna
                await db.execute(text('ALTER TABLE waste_categories RENAME COLUMN "densityKgPerLiter" TO "densityKgPerCubicMeter"'))
                print("  ✓ Columna renombrada: densityKgPerLiter → densityKgPerCubicMeter")

                # Convertir valores (multiplicar por 1000)
                await db.execute(text('UPDATE waste_categories SET "densityKgPerCubicMeter" = "densityKgPerCubicMeter" * 1000 WHERE "densityKgPerCubicMeter" IS NOT NULL'))

                # Contar registros actualizados
                result = await db.execute(text('SELECT COUNT(*) FROM waste_categories WHERE "densityKgPerCubicMeter" IS NOT NULL'))
                count = result.scalar()
                print(f"  ✓ {count} categoría(s) convertidas de kg/L a kg/m³")
            else:
                print("  ⚠️  Columna 'densityKgPerLiter' no existe, nada que migrar")

        await db.commit()

        # ──────────────────────────────────────────────────────────────────────────
        # VERIFICACIÓN
        # ──────────────────────────────────────────────────────────────────────────
        print("\n" + "=" * 60)
        print("VERIFICACIÓN:")
        print("=" * 60)

        result = await db.execute(text('SELECT "containerCode", "volumeCubicMeters" FROM containers WHERE "volumeCubicMeters" IS NOT NULL LIMIT 5'))
        print("\nContenedores (primeros 5):")
        for row in result.all():
            print(f"  - {row[0]}: {row[1]} m³")

        result = await db.execute(text('SELECT name, "densityKgPerCubicMeter" FROM waste_categories WHERE "densityKgPerCubicMeter" IS NOT NULL'))
        print("\nCategorías con densidad:")
        for row in result.all():
            print(f"  - {row[0]}: {row[1]} kg/m³")

        print("\n✅ Migración completada exitosamente")


if __name__ == "__main__":
    asyncio.run(migrate_units())