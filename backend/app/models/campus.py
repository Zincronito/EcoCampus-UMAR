"""
Modelo: Campus universitario.
La UMAR tiene 3 campus. Cada campus tiene ubicaciones (sectores).
"""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class Campus(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "campuses"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    address: Mapped[str | None] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True)

    # Relación: un campus tiene muchas ubicaciones
    locations: Mapped[list["Location"]] = relationship(back_populates="campus")

    def __repr__(self) -> str:
        return f"<Campus {self.code}: {self.name}>"