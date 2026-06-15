"""Models - Modelos SQLAlchemy ORM."""
"""
Todos los modelos se importan aquí para que estén disponibles
cuando SQLAlchemy los necesite.
"""

from app.models.base import UUIDMixin, TimestampMixin
from app.models.campus import Campus
from app.models.location import Location
from app.models.waste_category import WasteCategory
from app.models.user import User
from app.models.container import Container
from app.models.collection_record import CollectionRecord
from app.models.incident import Incident

__all__ = [
    "UUIDMixin",
    "TimestampMixin",
    "Campus",
    "Location",
    "WasteCategory",
    "User",
    "Container",
    "CollectionRecord",
    "Incident",
]