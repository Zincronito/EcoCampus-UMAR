"""
Modelo: Usuario (recolector, admin, supervisor)
"""

from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


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

    def __repr__(self) -> str:
        return f"<User {self.employee_id}: {self.full_name}>"