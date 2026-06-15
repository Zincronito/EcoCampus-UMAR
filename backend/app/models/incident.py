"""
Modelo: Incidente reportado.
Cuando hay un problema con un contenedor (daño, derrame, fauna, etc), se reporta aquí.
"""

import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class Incident(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "incidents"

    description: Mapped[str] = mapped_column(String(500), nullable=False)
    quick_tag: Mapped[str | None] = mapped_column("quickTag", String(50))
    photo_url: Mapped[str | None] = mapped_column("photoUrl", String(500))
    status: Mapped[str] = mapped_column(String(50), default="open")

    # FKs
    collection_record_id: Mapped[uuid.UUID | None] = mapped_column(
        "collectionRecordId", ForeignKey("collection_records.id"), unique=True
    )
    reported_by_id: Mapped[uuid.UUID] = mapped_column(
        "reportedById", ForeignKey("users.id"), nullable=False
    )
    container_id: Mapped[uuid.UUID] = mapped_column(
        "containerId", ForeignKey("containers.id"), nullable=False
    )

    # Relaciones
    collection_record: Mapped["CollectionRecord | None"] = relationship(back_populates="incident")
    reported_by: Mapped["User"] = relationship(back_populates="incidents")
    container: Mapped["Container"] = relationship(back_populates="incidents")

    def __repr__(self) -> str:
        return f"<Incident {self.quick_tag}: {self.status}>"