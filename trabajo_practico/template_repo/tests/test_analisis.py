"""Tests para los servicios de analisis de parametros acusticos (Milestone 3).

Mientras las funciones lancen ``NotImplementedError`` estos tests quedan como
``xfail`` (no ponen el CI en rojo).
"""

import numpy as np
import pytest

from app.services.acoustic_parameters import (
    calcular_parametros_acusticos,
    integral_schroeder,
    regresion_lineal,
    suavizar_signal,
)

pytestmark = pytest.mark.xfail(
    raises=NotImplementedError, strict=False, reason="se implementa en M3"
)


def _ri_exponencial(t60: float, fs: int, duracion: float, seed: int = 0) -> np.ndarray:
    """RI sintetica de banda ancha: ruido blanco con decaimiento exponencial."""
    rng = np.random.default_rng(seed)
    t = np.arange(int(duracion * fs)) / fs
    return rng.standard_normal(len(t)) * np.exp(-3 * np.log(10) / t60 * t)


# --------------------------------------------------------------------------- #
# Suavizado
# --------------------------------------------------------------------------- #
class TestSuavizarSignal:
    """Tests para la funcion suavizar_signal."""

    def test_suavizar_hilbert_envolvente(self):
        """La envolvente de Hilbert es no negativa, suave y sigue la amplitud."""
        fs = 8000
        t = np.arange(fs) / fs
        amplitud = np.exp(-3 * t)
        x = amplitud * np.sin(2 * np.pi * 500 * t)
        env = suavizar_signal(x, "hilbert")
        assert len(env) == len(x)
        assert np.all(env >= 0)
        centro = slice(fs // 10, -fs // 10)  # evitar efectos de borde
        np.testing.assert_allclose(env[centro], amplitud[centro], rtol=0.05)
        # Mas suave que la senal original: variaciones muestra a muestra menores.
        assert np.mean(np.abs(np.diff(env[centro]))) < np.mean(np.abs(np.diff(x[centro])))

    def test_suavizar_hilbert_por_defecto(self):
        """Sin especificar ventana se usa Hilbert."""
        x = np.sin(2 * np.pi * np.arange(1000) / 50)
        np.testing.assert_allclose(suavizar_signal(x), suavizar_signal(x, "hilbert"))

    def test_suavizar_media_movil_longitud(self):
        """Con ventana entera, la salida tiene la misma longitud y es no negativa."""
        x = np.random.default_rng(0).standard_normal(5000)
        env = suavizar_signal(x, 101)
        assert len(env) == len(x)
        assert np.all(env >= 0)


# --------------------------------------------------------------------------- #
# Integral de Schroeder
# --------------------------------------------------------------------------- #
class TestIntegralSchroeder:
    """Tests para la funcion integral_schroeder."""

    def test_schroeder_forma(self):
        """La EDC tiene la misma longitud que la entrada."""
        ri = _ri_exponencial(0.5, 8000, 1.0)
        assert len(integral_schroeder(ri)) == len(ri)

    def test_schroeder_maximo_cero_db(self):
        """El primer valor de la integral de Schroeder es 0 dB."""
        edc = integral_schroeder(_ri_exponencial(0.5, 8000, 1.0))
        assert abs(edc[0]) < 1e-6
        assert np.max(edc) <= 1e-6

    def test_schroeder_decreciente(self):
        """La curva de Schroeder es monotonamente decreciente."""
        edc = integral_schroeder(_ri_exponencial(0.5, 8000, 1.0))
        finitos = edc[np.isfinite(edc)]
        assert np.all(np.diff(finitos) <= 1e-9)

    def test_schroeder_ri_sintetizada(self):
        """Para T60 conocido, la EDC es casi lineal con pendiente -60/T60 dB/s."""
        fs, t60 = 8000, 1.5
        ri = _ri_exponencial(t60, fs, 3 * t60)
        edc = integral_schroeder(ri)
        t = np.arange(len(ri)) / fs
        tramo = (edc <= -5) & (edc >= -35)
        pendiente = np.polyfit(t[tramo], edc[tramo], 1)[0]
        assert abs(pendiente - (-60 / t60)) <= 0.1 * (60 / t60)


# --------------------------------------------------------------------------- #
# Regresion lineal
# --------------------------------------------------------------------------- #
class TestRegresionLineal:
    """Tests para la funcion regresion_lineal."""

    def test_regresion_lineal_exacta(self):
        """Para datos perfectamente lineales, R^2 = 1 y se recuperan m y b."""
        x = np.array([0.0, 1.0, 2.0, 3.0, 4.0])
        y = 2.0 * x + 1.0
        pendiente, ordenada, r2 = regresion_lineal(x, y)
        assert abs(pendiente - 2.0) < 1e-10
        assert abs(ordenada - 1.0) < 1e-10
        assert abs(r2 - 1.0) < 1e-10

    def test_regresion_lineal_pendiente(self):
        """Con datos ruidosos se aproxima a la recta conocida y R^2 queda alto."""
        rng = np.random.default_rng(42)
        x = np.linspace(0, 10, 100)
        y = 3.0 * x + 5.0 + rng.normal(0, 0.1, 100)
        pendiente, ordenada, r2 = regresion_lineal(x, y)
        assert abs(pendiente - 3.0) < 0.05
        assert abs(ordenada - 5.0) < 0.2
        assert 0.99 < r2 <= 1.0


# --------------------------------------------------------------------------- #
# Parametros acusticos
# --------------------------------------------------------------------------- #
class TestParametrosAcusticos:
    """Tests para la funcion calcular_parametros_acusticos."""

    def test_parametros_ri_sintetizada(self):
        """Con una RI de T60 = 2 s, T30 en 1 kHz queda dentro de +-10 %."""
        fs, t60 = 44100, 2.0
        params = calcular_parametros_acusticos(_ri_exponencial(t60, fs, 3 * t60), fs)
        for clave in ("EDT", "T20", "T30", "D50", "C80"):
            assert clave in params
        t30 = params["T30"][1000]
        assert abs(t30 - t60) <= 0.1 * t60, f"T30(1 kHz) = {t30:.2f} s"

    def test_d50_rango(self):
        """D50 esta entre 0 % y 100 % en todas las bandas."""
        fs = 44100
        params = calcular_parametros_acusticos(_ri_exponencial(1.0, fs, 2.0), fs)
        for valor in params["D50"].values():
            assert 0.0 <= valor <= 100.0

    def test_c80_consistencia(self):
        """Para una RI con mucha energia temprana (T60 corto), C80 es positivo."""
        fs = 44100
        params = calcular_parametros_acusticos(_ri_exponencial(0.3, fs, 1.0), fs)
        for valor in params["C80"].values():
            assert valor > 0
