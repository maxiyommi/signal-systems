"""Tests para los servicios de analisis de parametros acusticos (Milestone 3).

Mientras las funciones lancen ``NotImplementedError`` estos tests quedan como
``xfail`` (no ponen el CI en rojo).
"""

import numpy as np
import pytest

from app.services.acoustic_parameters import (
    apply_schroeder_integral,
    apply_smoothing,
    calculate_parameters_from_ir,
    linear_regression,
)

pytestmark = pytest.mark.xfail(
    raises=NotImplementedError, strict=False, reason="se implementa en M3"
)


def _exponential_ir(t60: float, fs: int, duration: float, seed: int = 0) -> np.ndarray:
    """RI sintetica de banda ancha: ruido blanco con decaimiento exponencial."""
    rng = np.random.default_rng(seed)
    t = np.arange(int(duration * fs)) / fs
    return rng.standard_normal(len(t)) * np.exp(-3 * np.log(10) / t60 * t)


# --------------------------------------------------------------------------- #
# Suavizado
# --------------------------------------------------------------------------- #
class TestApplySmoothing:
    """Tests para la funcion apply_smoothing."""

    def test_smoothing_hilbert_envelope(self):
        """La envolvente de Hilbert es no negativa, suave y sigue la amplitud."""
        fs = 8000
        t = np.arange(fs) / fs
        amplitud = np.exp(-3 * t)
        x = amplitud * np.sin(2 * np.pi * 500 * t)
        env = apply_smoothing(x, fs, method="hilbert")
        assert len(env) == len(x)
        assert np.all(env >= 0)
        centro = slice(fs // 10, -fs // 10)  # evitar efectos de borde
        np.testing.assert_allclose(env[centro], amplitud[centro], rtol=0.05)
        # Mas suave que la senal original: variaciones muestra a muestra menores.
        assert np.mean(np.abs(np.diff(env[centro]))) < np.mean(np.abs(np.diff(x[centro])))

    def test_smoothing_hilbert_default(self):
        """Sin especificar method se usa Hilbert."""
        fs = 8000
        x = np.sin(2 * np.pi * np.arange(1000) / 50)
        np.testing.assert_allclose(apply_smoothing(x, fs), apply_smoothing(x, fs, method="hilbert"))

    def test_smoothing_moving_average_length(self):
        """Con media movil, la salida tiene la misma longitud y es no negativa."""
        fs = 10000
        x = np.random.default_rng(0).standard_normal(5000)
        env = apply_smoothing(x, fs, method="moving_average", window_ms=10)
        assert len(env) == len(x)
        assert np.all(env >= 0)


# --------------------------------------------------------------------------- #
# Integral de Schroeder
# --------------------------------------------------------------------------- #
class TestApplySchroederIntegral:
    """Tests para la funcion apply_schroeder_integral."""

    def test_schroeder_shape(self):
        """La EDC tiene la misma longitud que la entrada."""
        ir = _exponential_ir(0.5, 8000, 1.0)
        assert len(apply_schroeder_integral(ir)) == len(ir)

    def test_schroeder_max_zero_db(self):
        """El primer valor de la integral de Schroeder es 0 dB."""
        edc = apply_schroeder_integral(_exponential_ir(0.5, 8000, 1.0))
        assert abs(edc[0]) < 1e-6
        assert np.max(edc) <= 1e-6

    def test_schroeder_decreasing(self):
        """La curva de Schroeder es monotonamente decreciente."""
        edc = apply_schroeder_integral(_exponential_ir(0.5, 8000, 1.0))
        finitos = edc[np.isfinite(edc)]
        assert np.all(np.diff(finitos) <= 1e-9)

    def test_schroeder_synthetic_ir(self):
        """Para T60 conocido, la EDC es casi lineal con pendiente -60/T60 dB/s."""
        fs, t60 = 8000, 1.5
        ir = _exponential_ir(t60, fs, 3 * t60)
        edc = apply_schroeder_integral(ir)
        t = np.arange(len(ir)) / fs
        tramo = (edc <= -5) & (edc >= -35)
        slope = np.polyfit(t[tramo], edc[tramo], 1)[0]
        assert abs(slope - (-60 / t60)) <= 0.1 * (60 / t60)


# --------------------------------------------------------------------------- #
# Regresion lineal
# --------------------------------------------------------------------------- #
class TestLinearRegression:
    """Tests para la funcion linear_regression."""

    def test_linear_regression_exact(self):
        """Para datos perfectamente lineales, R^2 = 1 y se recuperan m y b."""
        x = np.array([0.0, 1.0, 2.0, 3.0, 4.0])
        y = 2.0 * x + 1.0
        slope, intercept, r2 = linear_regression(x, y)
        assert abs(slope - 2.0) < 1e-10
        assert abs(intercept - 1.0) < 1e-10
        assert abs(r2 - 1.0) < 1e-10

    def test_linear_regression_slope(self):
        """Con datos ruidosos se aproxima a la recta conocida y R^2 queda alto."""
        rng = np.random.default_rng(42)
        x = np.linspace(0, 10, 100)
        y = 3.0 * x + 5.0 + rng.normal(0, 0.1, 100)
        slope, intercept, r2 = linear_regression(x, y)
        assert abs(slope - 3.0) < 0.05
        assert abs(intercept - 5.0) < 0.2
        assert 0.99 < r2 <= 1.0


# --------------------------------------------------------------------------- #
# Parametros acusticos
# --------------------------------------------------------------------------- #
class TestCalculateParametersFromIR:
    """Tests para la funcion calculate_parameters_from_ir."""

    def test_parameters_synthetic_ir(self):
        """Con una RI de T60 = 2 s, T30 en 1 kHz queda dentro de +-10 %."""
        fs, t60 = 44100, 2.0
        params = calculate_parameters_from_ir(_exponential_ir(t60, fs, 3 * t60), fs)
        for clave in ("EDT", "T20", "T30", "D50", "C80"):
            assert clave in params
        t30 = params["T30"][1000]
        assert abs(t30 - t60) <= 0.1 * t60, f"T30(1 kHz) = {t30:.2f} s"

    def test_d50_range(self):
        """D50 esta entre 0 % y 100 % en todas las bandas."""
        fs = 44100
        params = calculate_parameters_from_ir(_exponential_ir(1.0, fs, 2.0), fs)
        for valor in params["D50"].values():
            assert 0.0 <= valor <= 100.0

    def test_c80_consistency(self):
        """Para una RI con mucha energia temprana (T60 corto), C80 es positivo."""
        fs = 44100
        params = calculate_parameters_from_ir(_exponential_ir(0.3, fs, 1.0), fs)
        for valor in params["C80"].values():
            assert valor > 0
