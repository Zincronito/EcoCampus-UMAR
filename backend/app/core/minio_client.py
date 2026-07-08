"""
Cliente de MinIO para subir fotos y archivos.
"""
import os
from minio import Minio
from minio.error import S3Error
from app.core.config import settings

# Configuración de MinIO desde config.py
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
MINIO_ACCESS_KEY = settings.MINIO_ROOT_USER  # "minio_admin"
MINIO_SECRET_KEY = settings.MINIO_ROOT_PASSWORD  # "minio_secret_2024"
MINIO_BUCKET_INCIDENTS = settings.MINIO_BUCKET_INCIDENTS  # "incident-photos"

# Cliente de MinIO
minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False  # Cambiar a True si usas HTTPS
)


async def ensure_buckets_exist():
    """Crea los buckets si no existen."""
    try:
        exists = minio_client.bucket_exists(MINIO_BUCKET_INCIDENTS)
        if not exists:
            minio_client.make_bucket(MINIO_BUCKET_INCIDENTS)
            print(f"✓ Bucket '{MINIO_BUCKET_INCIDENTS}' creado")
        else:
            print(f"✓ Bucket '{MINIO_BUCKET_INCIDENTS}' ya existe")
    except S3Error as e:
        print(f"Error al crear buckets: {e}")


from io import BytesIO

async def upload_incident_photo(file_data: bytes, filename: str) -> str:
    """
    Sube una foto de incidencia a MinIO.
    
    Args:
        file_data: contenido del archivo en bytes
        filename: nombre del archivo (ej: incident_123.jpg)
    
    Returns:
        URL pública del archivo
    """
    try:
        # Convertir bytes a BytesIO para que MinIO pueda leerlo
        file_stream = BytesIO(file_data)
        
        minio_client.put_object(
            MINIO_BUCKET_INCIDENTS,
            filename,
            file_stream,
            length=len(file_data),
            content_type="image/jpeg"
        )
        
        # Devolver URL (MinIO en localhost)
        url = f"http://{MINIO_ENDPOINT}/{MINIO_BUCKET_INCIDENTS}/{filename}"
        return url
        
    except S3Error as e:
        raise Exception(f"Error al subir foto a MinIO: {e}")