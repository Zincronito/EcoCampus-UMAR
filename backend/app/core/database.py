"""
Conexión a PostgreSQL con SQLAlchemy async.
Este archivo define el motor de BD, las sesiones y la clase base de los modelos.
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# ── Motor de conexión 
# Es como el "cliente" que se conecta a PostgreSQL
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.API_DEBUG,   # En desarrollo imprime las queries SQL en consola
    pool_pre_ping=True,        # Verifica que la conexión siga viva antes de usarla
)

# ── Fábrica de sesiones 
# Cada request de la API obtiene su propia sesión (transacción)
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ── Clase base para todos los modelos 
# Todos nuestros modelos (Campus, Container, User...) heredan de esta clase
class Base(DeclarativeBase):
    pass


# ── Dependency para FastAPI 
# Esto se inyecta en cada endpoint que necesite acceso a la BD
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()