"""Servicio de generacion de sine sweep logaritmico.

Milestone 1: Generacion de senales.
"""

import numpy as np


def generar_sine_sweep(
    f1: float, f2: float, duracion: float, fs: int
) -> tuple[np.ndarray, np.ndarray]:
    """Genera un barrido senoidal logaritmico (sine sweep) y su filtro inverso.

    El sweep es ``x(t) = sin[2*pi*f1*T / ln(f2/f1) * (exp(t*ln(f2/f1)/T) - 1)]``
    y el filtro inverso es el sweep invertido en el tiempo con correccion de
    amplitud ``A(t) = exp(-t*ln(f2/f1)/T)`` (tecnica de Farina, 2000). La
    convolucion ``sweep * filtro_inverso`` debe aproximar un impulso.

    Parameters
    ----------
    f1 : float
        Frecuencia inicial del barrido en Hz (tipicamente 20 Hz).
    f2 : float
        Frecuencia final del barrido en Hz (tipicamente 20000 Hz).
    duracion : float
        Duracion del barrido en segundos.
    fs : int
        Frecuencia de muestreo en Hz.

    Returns
    -------
    sweep : np.ndarray
        Senal del barrido senoidal, normalizada, de longitud ``int(duracion * fs)``.
    filtro_inverso : np.ndarray
        Filtro inverso correspondiente, normalizado, de la misma longitud.

    References
    ----------
    .. [1] Farina, A. (2000). "Simultaneous measurement of impulse response
       and distortion with a swept-sine technique." 108th AES Convention.
    """
    raise NotImplementedError("Implementar en Milestone 1")
