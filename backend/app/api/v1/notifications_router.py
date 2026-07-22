"""
Router: Notificaciones del sistema.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.models.user import User
from app.models.notification import Notification
from pydantic import BaseModel
from app.models.collection_record import CollectionRecord
import uuid
from datetime import datetime

router = APIRouter(prefix="/notifications", tags=["notifications"])



class NotificationResponse(BaseModel):
    id: uuid.UUID
    title: str
    message: str
    notification_type: str
    severity: str
    is_read: bool
    created_at: datetime
    collection_record_id: uuid.UUID | None = None

    class Config:
        from_attributes = True

@router.get("", response_model=list[NotificationResponse])
async def get_notifications(
    session: AsyncSession = Depends(get_db),
):
    """
    Obtener todas las notificaciones.
    Auto-limpia notificaciones más viejas que 7 días antes de responder.
    """
    from datetime import datetime, timedelta, timezone
    from sqlalchemy import delete as sql_delete

    # Auto-borrado: eliminar notificaciones > 7 días
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    await session.execute(
        sql_delete(Notification).where(Notification.created_at < cutoff)
    )
    await session.commit()

    # Devolver las que quedan
    query = select(Notification).order_by(Notification.created_at.desc())
    result = await session.execute(query)
    notifications = result.scalars().all()
    return notifications

@router.patch("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    session: AsyncSession = Depends(get_db),
):
    """Marcar notificación como leída."""
    query = select(Notification).where(Notification.id == notification_id)
    result = await session.execute(query)
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    
    notification.is_read = True
    await session.commit()
    return {"message": "Notificación marcada como leída"}




async def create_notification(
    session: AsyncSession,
    title: str,
    message: str,
    notification_type: str,
    severity: str = "info",
    user_id: str = None,
):
    """Helper para crear notificaciones."""
    notification = Notification(
        title=title,
        message=message,
        notification_type=notification_type,
        severity=severity,
        user_id=user_id or "6521db40-04d2-4baf-8c09-4b9e0b026269",  # Admin por defecto
    )
    session.add(notification)
    await session.commit()
    return notification