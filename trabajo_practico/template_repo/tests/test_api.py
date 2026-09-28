"""Tests para los endpoints de la API.

Los de ``/`` y ``/health`` pasan desde M0. Los endpoints de M3 todavia no
existen (responden 404), por eso esos tests estan marcados ``xfail`` sin
``raises``: fallan por assert, no por ``NotImplementedError``.
"""

import io

import numpy as np
import pytest
import soundfile as sf
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

xfail_m3 = pytest.mark.xfail(strict=False, reason="se implementa en M3")


def _wav_en_memoria(signal: np.ndarray, fs: int) -> bytes:
    buffer = io.BytesIO()
    sf.write(buffer, signal, fs, format="WAV", subtype="PCM_16")
    return buffer.getvalue()


class TestHealthEndpoint:
    """Tests para el endpoint /health."""

    def test_health_endpoint(self):
        """/health responde 200 con status 'healthy' y version."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data


class TestRootEndpoint:
    """Tests para el endpoint raiz /."""

    def test_root_returns_200(self):
        """/ responde con status 200."""
        assert client.get("/").status_code == 200

    def test_root_returns_api_info(self):
        """La raiz devuelve informacion de la API."""
        data = client.get("/").json()
        assert data["name"] == "RIR-API"
        assert "docs" in data


@xfail_m3
def test_analysis_endpoint():
    """Enviar un WAV a /api/v1/analysis/impulse-response devuelve parametros."""
    fs = 44100
    t = np.arange(fs) / fs
    rng = np.random.default_rng(0)
    ri = 0.9 * rng.standard_normal(fs) * np.exp(-3 * np.log(10) / 0.5 * t)
    ri = ri / np.max(np.abs(ri)) * 0.9
    archivos = {"file": ("ri.wav", _wav_en_memoria(ri, fs), "audio/wav")}
    response = client.post("/api/v1/analysis/impulse-response", files=archivos)
    assert response.status_code == 200
    assert isinstance(response.json(), dict)


@xfail_m3
def test_signals_pink_noise_endpoint():
    """/api/v1/signals/pink-noise genera y devuelve un WAV valido."""
    response = client.post("/api/v1/signals/pink-noise", json={"duracion": 1.0, "fs": 44100})
    assert response.status_code == 200
    senal, fs = sf.read(io.BytesIO(response.content))
    assert fs == 44100
    assert len(senal) == 44100


@xfail_m3
def test_invalid_file_returns_422():
    """Un archivo que no es audio devuelve 422 Unprocessable Entity."""
    archivos = {"file": ("no_es_audio.wav", b"esto no es audio", "audio/wav")}
    response = client.post("/api/v1/analysis/impulse-response", files=archivos)
    assert response.status_code == 422
