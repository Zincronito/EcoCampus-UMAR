"""
Modelo: Usuario (recolector, admin, supervisor)
"""

from sqlalchemy import String, Boolean
from app.core.database import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import TimestampMixin, UUIDMixin
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.notification import Notification

class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    employee_id: Mapped[str] = mapped_column("employeeId", String(50), unique=True, nullable=False)
    full_name: Mapped[str] = mapped_column("fullName", String(150), nullable=False)
    email: Mapped[str | None] = mapped_column(String(100), unique=True)
    phone: Mapped[str | None] = mapped_column(String(20))
    hashed_pin: Mapped[str | None] = mapped_column("hashedPin", String(255))
    google_id: Mapped[str | None] = mapped_column("googleId", String(255), unique=True)
    role: Mapped[str] = mapped_column(String(50), default="collector")
    shift: Mapped[str | None] = mapped_column(String(50))
    assigned_sector: Mapped[str | None] = mapped_column("assignedSector", String(100))
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=True)
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user")
    # Relaciones
    collection_records: Mapped[list["CollectionRecord"]] = relationship(back_populates="collector")
    incidents: Mapped[list["Incident"]] = relationship(back_populates="reported_by")
    def __repr__(self) -> str:
        return f"<User {self.employee_id}: {self.full_name}>"