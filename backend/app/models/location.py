"""
Modelo: Ubicación dentro de un campus.
Ejemplo: "Plaza Central", "Instituto de Biología", "Cafetería".
"""

import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class Location(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "locations"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    sector: Mapped[str | None] = mapped_column(String(100))
    location_type: Mapped[str | None] = mapped_column(String(50))
    description: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(default=True)

    # FK: cada ubicación pertenece a un campus
    campus_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("campuses.id"), nullable=False
    )

    # Relaciones
    campus: Mapped["Campus"] = relationship(back_populates="locations")
    containers: Mapped[list["Container"]] = relationship(back_populates="location")

    def __repr__(self) -> str:
        return f"<Location {self.name} @ {self.sector}>"