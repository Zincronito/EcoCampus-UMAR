"""
Modelo: Categoría de residuo.
Ejemplo: Orgánico, Vidrio, PET, Papel y Cartón, RPBI, Inorgánico.
"""

from sqlalchemy import Float, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class WasteCategory(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "waste_categories"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500))
    color: Mapped[str] = mapped_column(String(50), nullable=False)
    icon: Mapped[str | None] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(default=True)
    # Densidad aproximada del residuo en kg/L (para calculo volumetrico)
    # Editable desde el dashboard para ajustar con datos reales
    density_kg_per_cubic_meter: Mapped[float] = mapped_column("densityKgPerCubicMeter", Float, default=650)

    # Relación: una categoría puede tener muchos contenedores
    containers: Mapped[list["Container"]] = relationship(back_populates="waste_category")

    def __repr__(self) -> str:
        return f"<WasteCategory {self.name}>"