"""Configuracion de la aplicacion (pydantic-settings).

Los valores por defecto se pueden sobreescribir con variables de entorno con
prefijo ``RIR_`` (por ejemplo ``RIR_FS_DEFAULT=44100``) o con un archivo ``.env``
en la raiz del repositorio (ignorado por git).
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Parametros configurables de RIR-API."""

    model_config = SettingsConfigDict(env_prefix="RIR_", env_file=".env", extra="ignore")

    app_name: str = "RIR-API"
    version: str = "0.1.0"
    fs_default: int = 48000
    max_upload_mb: int = 50
    cors_origins: list[str] = ["*"]
    data_dir: str = "data"


settings = Settings()
