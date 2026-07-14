from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # ── Aplicación 
    API_ENV: str = "production"
    API_DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "EcoCampus UMAR API"

    # ── Base de datos 
    # Quitamos los valores por defecto para obligar a usar las variables de entorno
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str = "db"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str
    DATABASE_URL: str # Definimos la variable directamente

    # ── Seguridad / JWT 
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200

    # ── CORS 
    CORS_ORIGINS: str = "*" # Permite todo en desarrollo, o ajusta según necesites

    # ── MinIO 
    MINIO_ROOT_USER: str
    MINIO_ROOT_PASSWORD: str
    MINIO_BUCKET_INCIDENTS: str = "incidents"

    # Corregimos la ruta del env_file a la raíz del contenedor
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()