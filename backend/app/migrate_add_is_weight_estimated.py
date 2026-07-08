"""
Script para agregar columna isWeightEstimated a collection_records.

Uso:
    docker-compose --env-file .env.docker exec backend python -m app.migrate_add_is_weight_estimated
"""
import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionLocal


async def migrate():
    print("=" * 60)
    print("Agregando columna isWeightEstimated a collection_records")
    print("=" * 60)

    async with AsyncSessionLocal() as db:
        try:
            # Verificar si la columna ya existe
            result = await db.execute(text("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'collection_records' AND column_name = 'isWeightEstimated'
            """))
            col_exists = result.scalar_one_or_none() is not None

            if col_exists:
                print("✓ Columna 'isWeightEstimated' ya existe")
            else:
                # Agregar columna
                await db.execute(text("""
                    ALTER TABLE collection_records 
                    ADD COLUMN "isWeightEstimated" BOOLEAN DEFAULT FALSE
                """))
                print("✓ Columna 'isWeightEstimated' agregada")
                
                # Marcar como estimados aquellos con netWeight NULL o 0
                await db.execute(text("""
                    UPDATE collection_records 
                    SET "isWeightEstimated" = TRUE 
                    WHERE "netWeight" IS NULL OR "netWeight" = 0
                """))
                
                result = await db.execute(text("""
                    SELECT COUNT(*) FROM collection_records WHERE "isWeightEstimated" = TRUE
                """))
                count = result.scalar()
                print(f"✓ Marcados {count} registros como estimados")

            await db.commit()
            print("\n✅ Migración completada exitosamente")

        except Exception as e:
            await db.rollback()
            print(f"\n❌ Error: {str(e)}")
            raise


if __name__ == "__main__":
    asyncio.run(migrate())