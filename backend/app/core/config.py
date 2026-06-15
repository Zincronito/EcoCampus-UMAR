"""
Configuración centralizada del proyecto.
Lee las variables del archivo .env y las valida con tipos de Python.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Aplicación 
    API_ENV: str = "development"
    API_DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "EcoCampus UMAR API"

    # ── Base de datos 
    POSTGRES_USER: str = "ecocampus"
    POSTGRES_PASSWORD: str = "ecocampus_dev_2024"
    POSTGRES_HOST: str = "db"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "ecocampus_db"

    @property
    def DATABASE_URL(self) -> str:
        """Construye la URL de conexión a PostgreSQL."""
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # ── Seguridad / JWT 
    SECRET_KEY: str = "cambiar-esta-clave-en-produccion"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ── CORS 
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8081"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # ── MinIO 
    MINIO_ROOT_USER: str = "minio_admin"
    MINIO_ROOT_PASSWORD: str = "minio_secret_2024"
    MINIO_BUCKET_INCIDENTS: str = "incident-photos"

    model_config = {"env_file": "../../.env", "extra": "ignore"}


# Instancia global — se importa en todo el proyecto
settings = Settings()