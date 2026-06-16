"""
Modelo: Reporte de recolección.
Cada vez que un recolector reporta un contenedor, se crea un registro aquí.
Incluye: peso, condición, nivel de separación, etc.
"""

import uuid

from sqlalchemy import ForeignKey, String, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class CollectionRecord(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "collection_records"

    gross_weight: Mapped[float] = mapped_column("grossWeight", Float, nullable=False)
    net_weight: Mapped[float | None] = mapped_column("netWeight", Float)
    fill_level: Mapped[str] = mapped_column("fillLevel", String(50), nullable=False)
    physical_state: Mapped[str] = mapped_column("physicalState", String(50), nullable=False)
    condition: Mapped[str] = mapped_column(String(255), nullable=False)
    separation_level: Mapped[str] = mapped_column("separationLevel", String(50), nullable=False)
    synced_from_offline: Mapped[bool] = mapped_column("syncedFromOffline", Boolean, default=False)
    device_recorded_at: Mapped[str | None] = mapped_column("deviceRecordedAt", String(50))

    # FKs
    container_id: Mapped[uuid.UUID] = mapped_column(
        "containerId", ForeignKey("containers.id"), nullable=False
    )
    collector_id: Mapped[uuid.UUID] = mapped_column(
        "collectorId", ForeignKey("users.id"), nullable=False
    )

    # Relaciones
    container: Mapped["Container"] = relationship(back_populates="collection_records")
    collector: Mapped["User"] = relationship(back_populates="collection_records")
    incident: Mapped["Incident | None"] = relationship(back_populates="collection_record", uselist=False)

    def __repr__(self) -> str:
        return f"<CollectionRecord {self.container_id} by {self.collector_id}>"