"""Tests para los servicios de procesamiento de senales (Milestone 2).

Mientras las funciones lancen ``NotImplementedError`` estos tests quedan como
``xfail`` (no ponen el CI en rojo). Los WAV de prueba se generan en un
directorio temporal (``tmp_path``); si quieren usar archivos propios, pueden
dejarlos en ``tests/data/``.
"""

import numpy as np
import pytest
import soundfile as sf
from scipy import signal as sps

from app.services.filter import filter_single_band
from app.services.signal_utils import (
    generate_synthetic_ir,
    get_impulse_response,
    load_audio,
    logarithmic_scale_conversion,
)
from app.services.sine_sweep import generate_sine_sweep_pair

pytestmark = pytest.mark.xfail(
    raises=NotImplementedError, strict=False, reason="se implementa en M2"
)


def _t60_desde_schroeder(ir: np.ndarray, fs: int) -> float:
    """T60 extrapolado de la pendiente de Schroeder entre -5 y -25 dB (T20)."""
    energia = np.cumsum(ir[::-1] ** 2)[::-1]
    edc = 10 * np.log10(energia / energia[0] + 1e-300)
    t = np.arange(len(ir)) / fs
    tramo = (edc <= -5) & (edc >= -25)
    pendiente = np.polyfit(t[tramo], edc[tramo], 1)[0]
    return -60 / pendiente


# --------------------------------------------------------------------------- #
# Carga de audio
# --------------------------------------------------------------------------- #
class TestLoadAudio:
    """Tests para la funcion load_audio."""

    def test_load_audio_wav(self, tmp_path):
        """Carga un WAV mono: devuelve (senal 1D, fs) con la longitud correcta."""
        fs = 48000
        t = np.arange(fs) / fs
        ruta = tmp_path / "seno.wav"
        sf.write(ruta, 0.5 * np.sin(2 * np.pi * 1000 * t), fs, subtype="PCM_16")

        senal, fs_leida = load_audio(ruta)
        assert fs_leida == fs
        assert isinstance(senal, np.ndarray)
        assert senal.ndim == 1
        assert len(senal) == fs

    def test_load_audio_stereo_to_mono(self, tmp_path):
        """Un WAV estereo se devuelve mono (promedio de canales)."""
        fs = 48000
        n = fs // 2
        izq = 0.5 * np.ones(n)
        der = 0.1 * np.ones(n)
        ruta = tmp_path / "estereo.wav"
        sf.write(ruta, np.column_stack([izq, der]), fs, subtype="FLOAT")

        senal, _ = load_audio(str(ruta))
        assert senal.ndim == 1
        assert len(senal) == n
        np.testing.assert_allclose(senal, 0.3, atol=1e-6)

    def test_load_audio_file_not_found(self):
        """Lanza FileNotFoundError si el archivo no existe."""
        with pytest.raises(FileNotFoundError):
            load_audio("archivo_que_no_existe.wav")

    def test_load_audio_invalid_format(self, tmp_path):
        """Lanza ValueError si el archivo no es un audio valido."""
        ruta = tmp_path / "no_es_audio.wav"
        ruta.write_text("esto no es un archivo de audio")
        with pytest.raises(ValueError):
            load_audio(ruta)

    def test_load_audio_normalization(self, tmp_path):
        """La salida es float64 y esta normalizada entre -1 y 1 (PCM 16 a plena escala)."""
        fs = 44100
        pcm = np.array([32767, -32768, 16384, 0] * 1000, dtype=np.int16)
        ruta = tmp_path / "pcm16.wav"
        sf.write(ruta, pcm, fs, subtype="PCM_16")

        senal, _ = load_audio(ruta)
        assert senal.dtype == np.float64
        assert np.max(np.abs(senal)) <= 1.0
        assert np.max(np.abs(senal)) > 0.99


# --------------------------------------------------------------------------- #
# Sintesis de RI
# --------------------------------------------------------------------------- #
class TestGenerateSyntheticIR:
    """Tests para la funcion generate_synthetic_ir."""

    def test_synthetic_ir_duration(self):
        """La RI tiene duration * fs muestras."""
        fs, duration = 44100, 1.5
        ir = generate_synthetic_ir(duration, {500: 1.0, 1000: 0.8}, fs)
        assert isinstance(ir, np.ndarray)
        assert len(ir) == int(duration * fs)

    def test_synthetic_ir_decay(self):
        """El decaimiento en la banda de 1 kHz corresponde a T60 = 2 s (+-10 %)."""
        fs, t60 = 44100, 2.0
        ir = generate_synthetic_ir(3 * t60, {1000: t60}, fs)
        sos = sps.butter(4, [1000 / np.sqrt(2), 1000 * np.sqrt(2)], "bandpass", fs=fs, output="sos")
        ir_banda = sps.sosfiltfilt(sos, ir)
        t60_medido = _t60_desde_schroeder(ir_banda, fs)
        assert abs(t60_medido - t60) <= 0.1 * t60, f"T60 medido = {t60_medido:.2f} s"


# --------------------------------------------------------------------------- #
# Deconvolucion
# --------------------------------------------------------------------------- #
def test_impulse_response_peak():
    """La RI recuperada por deconvolucion se parece a la original (correlacion > 0.9)."""
    fs = 44100
    rng = np.random.default_rng(0)

    # RI conocida: sonido directo + cola exponencial, limitada a 100 Hz - 10 kHz
    # (dentro del rango del sweep) con un filtro causal.
    n = int(0.5 * fs)
    t = np.arange(n) / fs
    ir = 0.3 * rng.standard_normal(n) * np.exp(-3 * np.log(10) / 0.3 * t)
    ir[0] = 1.0
    sos = sps.butter(2, [100, 10000], "bandpass", fs=fs, output="sos")
    ir = sps.sosfilt(sos, ir)

    sweep, inverse_filter = generate_sine_sweep_pair(2.0, 20, 20000, fs)
    recording = sps.fftconvolve(sweep, ir)  # grabacion simulada
    ir_rec = get_impulse_response(recording, inverse_filter)

    # Alinear por correlacion cruzada y comparar el tramo superpuesto.
    xcorr = sps.correlate(ir_rec, ir, mode="full", method="fft")
    desplazamiento = int(np.argmax(np.abs(xcorr))) - (len(ir) - 1)
    if desplazamiento >= 0:
        tramo_rec = ir_rec[desplazamiento : desplazamiento + len(ir)]
        tramo_ref = ir[: len(tramo_rec)]
    else:
        tramo_rec = ir_rec[: len(ir) + desplazamiento]
        tramo_ref = ir[-desplazamiento : -desplazamiento + len(tramo_rec)]
    correlacion = abs(np.corrcoef(tramo_rec, tramo_ref)[0, 1])
    assert correlacion > 0.9, f"correlacion = {correlacion:.3f}"


# --------------------------------------------------------------------------- #
# Filtro de octava
# --------------------------------------------------------------------------- #
def _respuesta_en_frecuencia(fc: float, fs: int) -> tuple[np.ndarray, np.ndarray]:
    """Respuesta en frecuencia (dB) de filter_single_band medida con un impulso centrado."""
    n = fs  # 1 s -> resolucion de 1 Hz
    delta = np.zeros(n)
    delta[n // 2] = 1.0
    h = filter_single_band(delta, fs, fc)
    mag = np.abs(np.fft.rfft(h))
    f = np.fft.rfftfreq(n, 1 / fs)
    return f, 20 * np.log10(mag + 1e-300)


class TestFilterSingleBand:
    """Tests para la funcion filter_single_band."""

    def test_filter_single_band_center_frequency(self):
        """Un seno en fc pasa sin atenuacion apreciable (+-1 dB)."""
        fs, fc = 48000, 1000.0
        t = np.arange(2 * fs) / fs
        seno = np.sin(2 * np.pi * fc * t)
        salida = filter_single_band(seno, fs, fc)
        centro = slice(fs // 2, -fs // 2)  # descartar transitorios
        ganancia_db = 20 * np.log10(np.std(salida[centro]) / np.std(seno[centro]))
        assert abs(ganancia_db) <= 1.0, f"ganancia en fc = {ganancia_db:.2f} dB"

    def test_filter_single_band_attenuation(self):
        """Un seno dos octavas por encima de fc queda atenuado mas de 20 dB."""
        fs, fc = 48000, 1000.0
        t = np.arange(2 * fs) / fs
        seno = np.sin(2 * np.pi * 4 * fc * t)
        salida = filter_single_band(seno, fs, fc)
        centro = slice(fs // 2, -fs // 2)
        ganancia_db = 20 * np.log10(np.std(salida[centro]) / np.std(seno[centro]))
        assert ganancia_db < -20, f"ganancia en 4*fc = {ganancia_db:.2f} dB"

    def test_filter_single_band_frequency_response(self):
        """0 dB en fc, caida en los bordes de banda y > 20 dB a una octava de distancia."""
        fs, fc = 48000, 1000.0
        f, h_db = _respuesta_en_frecuencia(fc, fs)

        def ganancia(freq: float) -> float:
            return float(np.interp(freq, f, h_db))

        assert abs(ganancia(fc)) <= 0.5
        # Butterworth: -3 dB en los bordes con una pasada (lfilter/sosfilt);
        # con filtfilt la magnitud se eleva al cuadrado y queda en -6 dB.
        for f_borde in (fc / np.sqrt(2), fc * np.sqrt(2)):
            assert -7.0 <= ganancia(f_borde) <= -2.0
        assert ganancia(fc / 2) < -20
        assert ganancia(2 * fc) < -20


# --------------------------------------------------------------------------- #
# Escala logaritmica
# --------------------------------------------------------------------------- #
class TestLogarithmicScaleConversion:
    """Tests para la funcion logarithmic_scale_conversion."""

    def test_logarithmic_scale_type(self):
        """Retorna un np.ndarray de la misma longitud."""
        x = np.array([1.0, 0.5])
        db = logarithmic_scale_conversion(x)
        assert isinstance(db, np.ndarray)
        assert len(db) == len(x)

    def test_logarithmic_scale_max_zero(self):
        """El valor maximo de la salida es 0 dB."""
        x = np.array([0.1, 1.0, 0.5, 0.25])
        db = logarithmic_scale_conversion(x)
        assert abs(np.max(db)) < 1e-10
        assert int(np.argmax(db)) == 1

    def test_logarithmic_scale_ratio(self):
        """Una senal con amplitud mitad da -6 dB."""
        db = logarithmic_scale_conversion(np.array([1.0, 0.5]))
        assert abs(db[1] - 20 * np.log10(0.5)) < 0.1
