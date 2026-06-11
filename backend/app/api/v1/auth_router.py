"""
Router de autenticación - Versión simplificada para demo
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    employeeId: str
    pin: str

class LoginResponse(BaseModel):
    token: str
    user: dict

# Credenciales de demo (en producción usarías la BD)
DEMO_USERS = {
    "ADMIN-001": {"pin": "1234", "fullName": "Administrador", "role": "admin"},
    "REC-001": {"pin": "0000", "fullName": "Rodrigo Mendoza", "role": "collector"},
}

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Login demo sin BD"""
    
    user_data = DEMO_USERS.get(request.employeeId)
    
    if not user_data or user_data["pin"] != request.pin:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    # Token simulado
    token = f"demo-token-{request.employeeId}"
    
    return LoginResponse(
        token=token,
        user={
            "id": request.employeeId,
            "employeeId": request.employeeId,
            "fullName": user_data["fullName"],
            "role": user_data["role"],
        }
    )