"""Tests para los servicios de generacion de senales (Milestone 1).

Mientras las funciones lancen ``NotImplementedError`` estos tests quedan como
``xfail`` (no ponen el CI en rojo). Cuando las implementen, pasan a ``XPASS``;
si la implementacion es incorrecta, fallan con ``AssertionError``.
"""

import sys
import types

import numpy as np
import pytest
from scipy import signal as sps

from app.services.audio_io import reproducir_y_grabar
from app.services.pink_noise import generar_ruido_rosa
from app.services.sine_sweep import generar_sine_sweep

pytestmark = pytest.mark.xfail(
    raises=NotImplementedError, strict=False, reason="se implementa en M1"
)


# --------------------------------------------------------------------------- #
# Ruido rosa
# --------------------------------------------------------------------------- #
class TestGenerarRuidoRosa:
    """Tests para la funcion generar_ruido_rosa."""

    def test_ruido_rosa_duracion(self):
        """La longitud de la senal corresponde a duracion * fs."""
        duracion, fs = 2.0, 44100
        ruido = generar_ruido_rosa(duracion, fs)
        assert len(ruido) == int(duracion * fs)

    def test_ruido_rosa_tipo(self):
        """Retorna un np.ndarray 1D."""
        ruido = generar_ruido_rosa(1.0, 44100)
        assert isinstance(ruido, np.ndarray)
        assert ruido.ndim == 1

    def test_ruido_rosa_normalizado(self):
        """La senal esta normalizada entre -1 y 1."""
        ruido = generar_ruido_rosa(1.0, 44100)
        assert np.max(np.abs(ruido)) <= 1.0

    def test_ruido_rosa_espectro(self):
        """La PSD cae aproximadamente -3 dB/octava entre 100 Hz y 10 kHz."""
        fs = 44100
        ruido = generar_ruido_rosa(10.0, fs)
        f, pxx = sps.welch(ruido, fs=fs, nperseg=8192)
        banda = (f >= 100) & (f <= 10000)
        # Regresion de nivel (dB) contra octavas (log2 f): la pendiente es dB/octava.
        pendiente = np.polyfit(np.log2(f[banda]), 10 * np.log10(pxx[banda]), 1)[0]
        assert -4.0 <= pendiente <= -2.0, f"pendiente = {pendiente:.2f} dB/oct"


# --------------------------------------------------------------------------- #
# Sine sweep
# --------------------------------------------------------------------------- #
class TestGenerarSineSweep:
    """Tests para la funcion generar_sine_sweep."""

    def test_sine_sweep_retorna_tupla(self):
        """Retorna una tupla (sweep, filtro_inverso) de np.ndarray."""
        resultado = generar_sine_sweep(20, 20000, 1.0, 44100)
        assert isinstance(resultado, tuple)
        assert len(resultado) == 2
        assert isinstance(resultado[0], np.ndarray)
        assert isinstance(resultado[1], np.ndarray)

    def test_sine_sweep_duracion(self):
        """Ambas senales tienen longitud duracion * fs."""
        duracion, fs = 3.0, 44100
        sweep, filtro_inv = generar_sine_sweep(20, 20000, duracion, fs)
        assert len(sweep) == int(duracion * fs)
        assert len(filtro_inv) == int(duracion * fs)

    def test_sine_sweep_rango_frecuencias(self):
        """El sweep barre de f1 a f2 con frecuencia instantanea creciente."""
        f1, f2, fs = 20.0, 20000.0, 44100
        sweep, _ = generar_sine_sweep(f1, f2, 5.0, fs)
        f, _, sxx = sps.spectrogram(sweep, fs=fs, nperseg=4096, noverlap=2048)
        f_pico = f[np.argmax(sxx, axis=0)]
        df = f[1] - f[0]
        # Energia significativa cerca de f1 al principio y de f2 al final.
        assert f_pico[0] < 200, f"arranca en {f_pico[0]:.0f} Hz"
        assert f_pico[-1] > 0.75 * f2, f"termina en {f_pico[-1]:.0f} Hz"
        # Frecuencia instantanea monotonamente creciente (tolerancia de 2 bins).
        assert np.all(np.diff(f_pico) >= -2 * df)

    def test_sweep_convolucion_impulso(self):
        """sweep * filtro_inverso aproxima un impulso (pico >= 40 dB sobre el resto)."""
        fs = 44100
        sweep, filtro_inv = generar_sine_sweep(20, 20000, 5.0, fs)
        impulso = sps.fftconvolve(sweep, filtro_inv)
        energia = impulso**2
        i_pico = int(np.argmax(energia))
        ventana = int(0.01 * fs)  # se excluyen +-10 ms alrededor del pico
        resto = np.concatenate([energia[: i_pico - ventana], energia[i_pico + ventana :]])
        relacion_db = 10 * np.log10(energia[i_pico] / np.mean(resto))
        assert relacion_db >= 40, f"pico/resto = {relacion_db:.1f} dB"


# --------------------------------------------------------------------------- #
# Reproduccion y grabacion (con mock de sounddevice: no requiere placa de audio)
# --------------------------------------------------------------------------- #
def _sounddevice_falso(hay_dispositivo: bool = True) -> types.ModuleType:
    """Crea un modulo ``sounddevice`` falso para usar en CI."""
    sd = types.ModuleType("sounddevice")

    class PortAudioError(Exception):
        pass

    def playrec(data, samplerate=None, channels=None, blocking=False, **kwargs):
        if not hay_dispositivo:
            raise PortAudioError("No hay dispositivo de audio")
        data = np.asarray(data)
        canales = channels or (1 if data.ndim == 1 else data.shape[1])
        return np.zeros((data.shape[0], canales))

    def rec(frames, samplerate=None, channels=1, blocking=False, **kwargs):
        if not hay_dispositivo:
            raise PortAudioError("No hay dispositivo de audio")
        return np.zeros((int(frames), channels))

    def query_devices(*args, **kwargs):
        if not hay_dispositivo:
            raise PortAudioError("No hay dispositivo de audio")
        return {"name": "falso", "max_input_channels": 2, "max_output_channels": 2}

    sd.PortAudioError = PortAudioError
    sd.playrec = playrec
    sd.rec = rec
    sd.play = lambda *args, **kwargs: None
    sd.wait = lambda *args, **kwargs: None
    sd.query_devices = query_devices
    sd.check_input_settings = lambda *args, **kwargs: query_devices()
    sd.check_output_settings = lambda *args, **kwargs: query_devices()
    sd.default = types.SimpleNamespace(device=(0, 0), samplerate=None, channels=None)
    return sd


def test_reproducir_y_grabar_forma(monkeypatch):
    """Acepta mono y estereo, respeta la duracion y falla informativamente sin dispositivo."""
    fs, duracion_grabacion = 44100, 2.0
    esperado = int(duracion_grabacion * fs)
    monkeypatch.setitem(sys.modules, "sounddevice", _sounddevice_falso())

    mono = np.zeros(fs)  # 1 s, array 1D
    estereo = np.zeros((fs, 2))  # 1 s, array 2D (muestras, canales)
    for senal in (mono, estereo):
        grabacion = reproducir_y_grabar(senal, fs, duracion_grabacion)
        assert isinstance(grabacion, np.ndarray)
        assert abs(grabacion.shape[0] - esperado) <= 0.01 * esperado

    monkeypatch.setitem(sys.modules, "sounddevice", _sounddevice_falso(hay_dispositivo=False))
    with pytest.raises(RuntimeError):
        reproducir_y_grabar(mono, fs, duracion_grabacion)
