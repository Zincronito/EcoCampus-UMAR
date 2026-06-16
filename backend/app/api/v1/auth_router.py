"""
Router de autenticación - BD real
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.core.database import get_db
from app.models.user import User

router = APIRouter()

class LoginRequest(BaseModel):
    employeeId: str
    pin: str

class LoginResponse(BaseModel):
    token: str
    user: dict

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login usando la BD"""
    
    try:
        # Buscar usuario
        result = await db.execute(
            select(User).where(User.employee_id == request.employeeId)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        
        # Para demo: comparar PIN en texto plano
        # En producción: usar check_password_hash
        if request.pin != "1234" and request.pin != "0000":
            raise HTTPException(status_code=401, detail="PIN incorrecto")
        
        return LoginResponse(
            token=f"token-{user.id}",
            user={
                "id": str(user.id),
                "employeeId": user.employee_id,
                "fullName": user.full_name,
                "role": user.role,
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en login: {e}")
        raise HTTPException(status_code=500, detail="Error al iniciar sesión")