"""Servicio de reproduccion y grabacion simultanea.

Milestone 1: Generacion de senales.

``sounddevice`` se importa **dentro** de la funcion (import perezoso): asi el
resto de la API, los tests y el CI funcionan en maquinas sin placa de audio.
"""

import numpy as np


def play_and_record(signal: np.ndarray, fs: int, record_duration: float) -> np.ndarray:
    """Reproduce una senal y graba simultaneamente (``sounddevice.playrec``).

    Consideraciones:

    - ``record_duration`` debe ser mayor o igual a la duracion de la senal
      para capturar la cola de reverberacion del recinto.
    - Aceptar senales mono (array 1D) y estereo (array 2D ``(muestras, canales)``)
      sin asumir la forma.
    - Se recomienda un silencio inicial (pre-roll) de 0.5-1 s para compensar la
      latencia del sistema de audio.
    - Documentar en el README la configuracion usada (dispositivo, canales, fs,
      buffer size).

    Parameters
    ----------
    signal : np.ndarray
        Senal a reproducir (1D mono o 2D ``(muestras, canales)``).
    fs : int
        Frecuencia de muestreo en Hz.
    record_duration : float
        Duracion total de la grabacion en segundos.

    Returns
    -------
    np.ndarray
        Senal grabada, con ``int(record_duration * fs)`` muestras.

    Raises
    ------
    RuntimeError
        Si no hay un dispositivo de audio disponible (con un mensaje informativo).
    """
    # Importar sounddevice ACA adentro (import perezoso), no al inicio del modulo:
    # import sounddevice as sd
    raise NotImplementedError("Implementar en Milestone 1")
