"""Servicio de filtrado por bandas de octava.

Milestone 2: Procesamiento de la respuesta al impulso.
"""

import numpy as np


def filtro_octava(signal: np.ndarray, fc: float, fs: int, orden: int = 4) -> np.ndarray:
    """Aplica un filtro pasabanda de una octava centrado en ``fc`` (IEC 61260).

    Filtro Butterworth pasabanda (``scipy.signal.butter``) con frecuencias de corte:

    - inferior: ``fc / sqrt(2)``
    - superior: ``fc * sqrt(2)``

    Aplicarlo con ``scipy.signal.filtfilt`` (fase cero), importante para no
    distorsionar EDT y T60.

    Parameters
    ----------
    signal : np.ndarray
        Senal de entrada (array 1D).
    fc : float
        Frecuencia central de la banda de octava en Hz.
    fs : int
        Frecuencia de muestreo en Hz.
    orden : int, optional
        Orden del filtro Butterworth (por defecto 4).

    Returns
    -------
    np.ndarray
        Senal filtrada (array 1D, misma longitud que ``signal``).
    """
    raise NotImplementedError("Implementar en Milestone 2")
