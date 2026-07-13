"""
Modelo: Notificación para alertas del sistema.
"""
import uuid
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin
from app.models.user import User    

class Notification(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "notifications"
    
    title: Mapped[str] = mapped_column(nullable=False)
    message: Mapped[str] = mapped_column(nullable=False)
    notification_type: Mapped[str] = mapped_column(nullable=False)  # "overflow", "fauna", "damage", "separation", etc
    severity: Mapped[str] = mapped_column(default="info")  # "info", "warning", "critical"
    is_read: Mapped[bool] = mapped_column(default=False)
    
    # FK
    user_id: Mapped[uuid.UUID] = mapped_column(
        "userId", ForeignKey("users.id"), nullable=False
    )
    
    # Relaciones
    user: Mapped["User"] = relationship(back_populates="notifications")
    
    def __repr__(self) -> str:
        return f"<Notification {self.notification_type}: {self.title}>"