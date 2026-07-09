"""
Script para insertar 15 registros de demo
Con valores variados para validar cálculos de KPIs
"""
import uuid
from datetime import datetime, timedelta
from sqlalchemy import text
from app.core.database import SessionLocal

def insert_demo_records():
    db = SessionLocal()
    
    try:
        print("🧹 Limpiando registros anteriores...")
        db.execute(text("DELETE FROM collection_records"))
        db.commit()
        
        print("📊 Insertando 15 registros nuevos...")
        
        # Datos variados
        base_date = datetime(2026, 7, 1)
        
        records = [
            # Semana 1
            (100, 95, 'half', 'buen_estado', 'tapado', '0', 0, 'CONT-HUA-002', 'REC-HUA-001'),
            (None, None, 'three_quarter', 'buen_estado', 'destapado', '1', 1, 'CONT-PA-001', 'REC-PA-001'),
            (150, 145, 'full', 'buen_estado', 'tapado', '0', 2, 'CONT-PE-001', 'REC-HUA-002'),
            (80, 75, 'quarter', 'tapa_rota', 'tapado,huele_mal', '2', 3, 'CONT-HUA-002', 'REC-HUA-001'),
            (None, None, 'empty', 'buen_estado', 'destapado', '1', 4, 'CONT-PA-002', 'REC-PA-001'),
            
            # Semana 2
            (120, 115, 'half', 'buen_estado', 'tapado', '0', 7, 'CONT-PE-002', 'REC-HUA-002'),
            (140, 135, 'three_quarter', 'buen_estado', 'tapado', '1', 8, 'CONT-HUA-002', 'REC-HUA-001'),
            (None, None, 'full', 'contenedor_roto', 'desbordado', '3', 9, 'CONT-PA-001', 'REC-PA-001'),
            (90, 85, 'half', 'buen_estado', 'tapado', '0', 10, 'CONT-PE-001', 'REC-HUA-002'),
            (None, None, 'quarter', 'buen_estado', 'destapado,fauna', '2', 11, 'CONT-HUA-002', 'REC-HUA-001'),
            
            # Semana 3
            (160, 155, 'full', 'buen_estado', 'tapado', '0', 14, 'CONT-PA-002', 'REC-PA-001'),
            (110, 105, 'half', 'buen_estado', 'tapado', '1', 15, 'CONT-PE-002', 'REC-HUA-002'),
            (None, None, 'three_quarter', 'tapa_rota', 'huele_mal', '2', 16, 'CONT-HUA-002', 'REC-HUA-001'),
            (130, 125, 'full', 'buen_estado', 'tapado', '0', 17, 'CONT-PA-001', 'REC-PA-001'),
            (None, None, 'quarter', 'buen_estado', 'destapado', '1', 18, 'CONT-PE-001', 'REC-HUA-002'),
        ]
        
        inserted = 0
        failed = 0
        
        for gross_w, net_w, fill, phys, cond, sep, days_offset, cont_code, collector_code in records:
            try:
                record_id = str(uuid.uuid4())
                created_at = (base_date + timedelta(days=days_offset)).isoformat()
                
                # Obtener IDs reales
                cont_result = db.execute(text(f"SELECT id FROM containers WHERE \"containerCode\" = '{cont_code}'"))
                container_id = cont_result.scalar()
                
                user_result = db.execute(text(f"SELECT id FROM users WHERE \"employeeId\" = '{collector_code}'"))
                collector_id = user_result.scalar()
                
                if not container_id or not collector_id:
                    print(f"  ⚠️  Omitido: {cont_code}/{collector_code} (IDs no encontrados)")
                    failed += 1
                    continue
                
                is_estimated = 1 if (net_w is None or net_w == 0) else 0
                
                db.execute(text(f"""
                    INSERT INTO collection_records 
                    (id, "grossWeight", "netWeight", "fillLevel", "physicalState", condition, "separationLevel", "createdAt", container_id, collector_id, "isWeightEstimated")
                    VALUES
                    ('{record_id}', {gross_w}, {net_w}, '{fill}', '{phys}', '{cond}', '{sep}', '{created_at}', '{container_id}', '{collector_id}', {is_estimated})
                """))
                inserted += 1
                
            except Exception as e:
                print(f"  ❌ Error en registro: {str(e)}")
                failed += 1
                continue
        
        db.commit()
        print(f"\n✅ {inserted} REGISTROS INSERTADOS")
        print(f"⚠️  {failed} REGISTROS FALLARON")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    insert_demo_records()