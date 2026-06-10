"""
Seguridad: hashear PINs/contraseñas y generar/verificar tokens JWT.
"""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# ── Hashing de contraseñas 
# bcrypt convierte "1234" en "$2b$12$LJ3m..." (irreversible)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Convierte un PIN/contraseña en un hash seguro."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Compara un PIN en texto plano contra su hash almacenado."""
    return pwd_context.verify(plain_password, hashed_password)


# ── JWT (JSON Web Tokens) 
def create_access_token(subject: str, extra_claims: dict | None = None) -> str:
    """
    Genera un token de acceso.
    - subject: el ID del usuario (se guarda en el campo 'sub' del token)
    - extra_claims: datos adicionales como el rol
    """
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": subject, "exp": expire, "type": "access"}
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(subject: str) -> str:
    """Token de larga duración para renovar el access_token sin re-login."""
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    payload = {"sub": subject, "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    """Decodifica un JWT. Retorna None si es inválido o expiró."""
    try:
        return jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
    except JWTError:
        return None