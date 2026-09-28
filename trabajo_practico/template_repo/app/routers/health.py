"""Health check endpoint."""

from datetime import datetime

from fastapi import APIRouter

from app.settings import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    """Verifica que la API esta funcionando correctamente."""
    return {
        "status": "healthy",
        "version": settings.version,
        "timestamp": datetime.now().isoformat(),
    }
