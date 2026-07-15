"""Crea el usuario admin inicial."""
import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.notification import Notification  # ← AGREGAR

async def create_admin():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.employee_id == "ADMIN-001")
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            print("⚠️  Admin ya existe.")
            return
        
        admin = User(
            employee_id="ADMIN-001",
            full_name="Administrador",
            hashed_pin=hash_password("1234"),
            role="admin",
            is_active=True,
        )
        session.add(admin)
        await session.commit()
        print("✅ Admin creado: ADMIN-001 / PIN: 1234")

asyncio.run(create_admin())