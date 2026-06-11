"""
Seguridad: hashear PINs y generar/verificar tokens JWT.
"""

from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from werkzeug.security import generate_password_hash, check_password_hash
from app.core.config import settings


def hash_password(password: str) -> str:
    """Hashea un PIN/contraseña."""
    return generate_password_hash(password, method="pbkdf2:sha256")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica un PIN contra su hash."""
    return check_password_hash(hashed_password, plain_password)


def create_access_token(subject: str, extra_claims: dict | None = None) -> str:
    """Genera un token de acceso."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": subject, "exp": expire, "type": "access"}
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    """Decodifica un JWT."""
    try:
        return jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
    except JWTError:
        return None