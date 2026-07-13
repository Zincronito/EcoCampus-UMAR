"""API v1 Routes."""
from . import (
    auth_router,
    containers_router,
    records_router,
    incidents_router,
    categories_router,
    campus_router,
    locations_router,
    collectors_router,
    notifications_router,
)
__all__ = [
    "auth_router",
    "containers_router",
    "records_router",
    "incidents_router",
    "categories_router",
    "campus_router",
    "locations_router",
    "collectors_router",
    "notifications_router",
]