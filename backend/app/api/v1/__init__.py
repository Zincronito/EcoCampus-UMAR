"""API v1 Routes - Endpoints de autenticación, contenedores, recolección e incidentes."""
from . import (
    auth_router,
    containers_router,
    records_router,
    incidents_router,
    categories_router,
    campus_router,
    locations_router,
)
__all__ = [
    "auth_router",
    "containers_router",
    "records_router",
    "incidents_router",
    "categories_router",
    "campus_router",
    "locations_router",
]