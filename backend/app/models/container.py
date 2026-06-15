"""
Modelo: Contenedor de residuos.
Cada contenedor está en una ubicación, tiene una categoría, y recibe reportes de recolección.
"""

import uuid

from sqlalchemy import ForeignKey, String, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class Container(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "containers"

    container_code: Mapped[str] = mapped_column("containerCode", String(50), unique=True, nullable=False)
    tare_weight: Mapped[float] = mapped_column("tareWeight", Float, nullable=False)
    volume_liters: Mapped[float | None] = mapped_column("volumeLiters", Float)
    status: Mapped[str] = mapped_column(String(50), default="active")
    qr_generated: Mapped[bool] = mapped_column("qrGenerated", Boolean, default=False)
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=True)

    # FKs
    waste_category_id: Mapped[uuid.UUID] = mapped_column(
        "wasteCategoryId", ForeignKey("waste_categories.id"), nullable=False
    )
    location_id: Mapped[uuid.UUID] = mapped_column(
        "locationId", ForeignKey("locations.id"), nullable=False
    )

    # Relaciones
    waste_category: Mapped["WasteCategory"] = relationship(back_populates="containers")
    location: Mapped["Location"] = relationship(back_populates="containers")
    collection_records: Mapped[list["CollectionRecord"]] = relationship(back_populates="container")
    incidents: Mapped[list["Incident"]] = relationship(back_populates="container")

    def __repr__(self) -> str:
        return f"<Container {self.container_code}>"