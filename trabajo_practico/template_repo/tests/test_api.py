"""Tests para los endpoints de la API.

Cada milestone expone lo que construye:

- M0: ``/`` y ``/health`` (pasan desde el principio).
- M1: ``/api/v1/signals/pink-noise`` y ``/api/v1/signals/sine-sweep``.
- M2: ``/api/v1/signals/synthetic-ir`` y ``/api/v1/filters/single-band``.
- M3: ``/api/v1/acoustics/parameters``, ``/api/v1/utils/schroeder`` y ``/api/v1/utils/smoothing``.

Mientras un endpoint no existe responde 404, por eso sus tests estan marcados
``xfail`` sin ``raises``: fallan por assert, no por ``NotImplementedError``.
Cuando lo implementen, borren la marca de ese test.
"""

import io

import numpy as np
import pytest
import soundfile as sf
from fastapi.testclient import TestClient

from app.main import app
from app.routers.audio_http import wav_response

client = TestClient(app)

xfail_m1 = pytest.mark.xfail(strict=False, reason="se implementa en M1")
xfail_m2 = pytest.mark.xfail(strict=False, reason="se implementa en M2")
xfail_m3 = pytest.mark.xfail(strict=False, reason="se implementa en M3")


def _wav_en_memoria(signal: np.ndarray, fs: int) -> bytes:
    buffer = io.BytesIO()
    sf.write(buffer, signal, fs, format="WAV", subtype="PCM_16")
    return buffer.getvalue()


def _ri_sintetica(fs: int = 44100, t60: float = 0.5) -> np.ndarray:
    t = np.arange(fs) / fs
    rng = np.random.default_rng(0)
    ir = rng.standard_normal(fs) * np.exp(-3 * np.log(10) / t60 * t)
    return ir / np.max(np.abs(ir)) * 0.9


# ── M0 ───────────────────────────────────────────────────────────────────────


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


def test_wav_response_roundtrip():
    """wav_response (ya resuelta en el template) devuelve un WAV que se puede leer."""
    senal = np.linspace(-0.5, 0.5, 1000)
    response = wav_response(senal, 8000)
    assert response.media_type == "audio/wav"
    leida, fs = sf.read(io.BytesIO(response.body))
    assert fs == 8000
    assert np.allclose(leida, senal, atol=1e-6)


# ── M1 ───────────────────────────────────────────────────────────────────────


@xfail_m1
def test_signals_pink_noise_endpoint():
    """/api/v1/signals/pink-noise genera y devuelve un WAV valido."""
    response = client.post(
        "/api/v1/signals/pink-noise", json={"duration": 1.0, "sample_rate": 44100}
    )
    assert response.status_code == 200
    senal, fs = sf.read(io.BytesIO(response.content))
    assert fs == 44100
    assert len(senal) == 44100


@xfail_m1
def test_signals_sine_sweep_endpoint():
    """/api/v1/signals/sine-sweep devuelve el sweep o, con inverse=True, su filtro inverso."""
    pedido = {"duration": 1.0, "start_freq": 20, "end_freq": 20000, "sample_rate": 44100}
    sweep = client.post("/api/v1/signals/sine-sweep", json=pedido)
    inverso = client.post("/api/v1/signals/sine-sweep", json={**pedido, "inverse": True})
    assert sweep.status_code == 200 and inverso.status_code == 200
    s, fs = sf.read(io.BytesIO(sweep.content))
    k, _ = sf.read(io.BytesIO(inverso.content))
    assert fs == 44100
    assert len(s) == 44100
    assert not np.allclose(s[: len(k)], k[: len(s)])


@xfail_m1
def test_invalid_duration_returns_422():
    """Una duracion negativa la rechaza el schema (Pydantic) con 422."""
    response = client.post(
        "/api/v1/signals/pink-noise", json={"duration": -1.0, "sample_rate": 44100}
    )
    assert response.status_code == 422


# ── M2 ───────────────────────────────────────────────────────────────────────


@xfail_m2
def test_signals_synthetic_ir_endpoint():
    """/api/v1/signals/synthetic-ir devuelve una RI en WAV con la duracion pedida."""
    pedido = {"duration": 1.0, "t60_values": {"1000": 0.8}, "sample_rate": 44100}
    response = client.post("/api/v1/signals/synthetic-ir", json=pedido)
    assert response.status_code == 200
    senal, fs = sf.read(io.BytesIO(response.content))
    assert fs == 44100
    assert len(senal) == 44100


@xfail_m2
def test_filters_single_band_endpoint():
    """/api/v1/filters/single-band recibe un WAV y devuelve la banda filtrada."""
    fs = 44100
    ruido = np.random.default_rng(1).standard_normal(fs) * 0.5
    archivos = {"file": ("ruido.wav", _wav_en_memoria(ruido, fs), "audio/wav")}
    response = client.post(
        "/api/v1/filters/single-band", files=archivos, data={"center_freq": 1000}
    )
    assert response.status_code == 200
    filtrada, fs_out = sf.read(io.BytesIO(response.content))
    assert fs_out == fs
    assert len(filtrada) == fs


@xfail_m2
def test_invalid_file_returns_422():
    """Un archivo que no es audio devuelve 422 Unprocessable Entity."""
    archivos = {"file": ("no_es_audio.wav", b"esto no es audio", "audio/wav")}
    response = client.post(
        "/api/v1/filters/single-band", files=archivos, data={"center_freq": 1000}
    )
    assert response.status_code == 422


# ── M3 ───────────────────────────────────────────────────────────────────────


@xfail_m3
def test_acoustics_parameters_endpoint():
    """Enviar una RI a /api/v1/acoustics/parameters devuelve los parametros por banda."""
    fs = 44100
    archivos = {"file": ("ir.wav", _wav_en_memoria(_ri_sintetica(fs), fs), "audio/wav")}
    response = client.post("/api/v1/acoustics/parameters", files=archivos)
    assert response.status_code == 200
    assert isinstance(response.json(), dict)


@xfail_m3
def test_utils_schroeder_endpoint():
    """/api/v1/utils/schroeder devuelve la curva de caida (en dB, decreciente)."""
    fs = 44100
    archivos = {"file": ("ir.wav", _wav_en_memoria(_ri_sintetica(fs), fs), "audio/wav")}
    response = client.post("/api/v1/utils/schroeder", files=archivos)
    assert response.status_code == 200
    assert isinstance(response.json(), dict)


@xfail_m3
def test_utils_smoothing_endpoint():
    """/api/v1/utils/smoothing devuelve la envolvente de la senal."""
    fs = 44100
    archivos = {"file": ("ir.wav", _wav_en_memoria(_ri_sintetica(fs), fs), "audio/wav")}
    response = client.post("/api/v1/utils/smoothing", files=archivos)
    assert response.status_code == 200
    assert isinstance(response.json(), dict)
