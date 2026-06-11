import asyncio
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.user import User
from sqlalchemy import select, update

async def rehash_pins():
    async with AsyncSessionLocal() as db:
        # Obtener todos los usuarios
        result = await db.execute(select(User))
        users = result.scalars().all()
        
        for user in users:
            # Rehashear con el nuevo formato
            if user.employee_id == "ADMIN-001":
                new_hash = hash_password("1234")
                print(f"Rehashing {user.employee_id}: {new_hash}")
            elif user.employee_id == "REC-001":
                new_hash = hash_password("0000")
                print(f"Rehashing {user.employee_id}: {new_hash}")
            else:
                continue
            
            # Actualizar en la BD
            await db.execute(
                update(User)
                .where(User.id == user.id)
                .values(hashed_pin=new_hash)
            )
        
        await db.commit()
        print("✅ PINs rehashed!")

asyncio.run(rehash_pins())