"""RIR-API - Room Impulse Response API.

Punto de entrada de la aplicacion FastAPI.

Uso:
    uvicorn app.main:app --reload
"""

from fastapi import FastAPI

from app.routers import health
from app.settings import settings

app = FastAPI(
    title=settings.app_name,
    description="API para procesamiento y analisis de respuestas al impulso segun ISO 3382.",
    version=settings.version,
)

# Routers
app.include_router(health.router)

# TODO (M3): Agregar routers de signals, filters, acoustics, analysis, utils
# app.include_router(signals.router, prefix="/api/v1/signals", tags=["signals"])
# app.include_router(filters.router, prefix="/api/v1/filters", tags=["filters"])
# app.include_router(acoustics.router, prefix="/api/v1/acoustics", tags=["acoustics"])
# app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["analysis"])
# app.include_router(utils.router, prefix="/api/v1/utils", tags=["utils"])


@app.get("/")
async def root():
    """Informacion basica de la API."""
    return {
        "name": settings.app_name,
        "version": settings.version,
        "description": "Room Impulse Response API",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
