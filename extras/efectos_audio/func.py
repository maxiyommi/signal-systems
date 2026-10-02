"""
func.py
-------
Funciones utilitarias de procesamiento de señales de audio.

Módulo auxiliar con operaciones comunes reutilizables a lo largo del curso:
normalización, conversión de canales y síntesis de formas de onda clásicas.
"""

import numpy as np
from numpy.typing import NDArray


def normalizar(y: NDArray[np.float64]) -> NDArray[np.float64]:
    """
    Normaliza una señal dividiéndola por su valor absoluto máximo.

    Escala la señal para que su pico quede en ``±1``, lo que evita el
    *clipping* (distorsión por desbordamiento) al reproducir o exportar audio.

    Parameters
    ----------
    y : NDArray[np.float64]
        Señal de audio a normalizar, de cualquier longitud.

    Returns
    -------
    NDArray[np.float64]
        Señal normalizada en el rango ``[-1, 1]``.

    Raises
    ------
    ValueError
        Si la señal es completamente silenciosa (todos los valores son 0),
        ya que la división por cero no está definida.

    Examples
    --------
    >>> import numpy as np
    >>> y = np.array([0.0, 0.5, 2.0, -1.0])
    >>> normalizar(y)
    array([ 0.  ,  0.25,  1.  , -0.5 ])
    """
    max_val = np.max(np.abs(y))
    if max_val == 0.0:
        raise ValueError(
            "La señal es silenciosa (todos los valores son 0): "
            "no se puede normalizar."
        )
    return y / max_val


def to_mono(y: NDArray[np.float64]) -> NDArray[np.float64]:
    """
    Convierte una señal estéreo a mono promediando los canales.

    Si la señal ya es mono, la retorna sin modificaciones. Si es estéreo
    (shape ``[muestras, canales]``), promedia los canales sobre el eje 1.

    Parameters
    ----------
    y : NDArray[np.float64]
        Señal de audio. Puede ser:

        - **1-D** ``(N,)``  → mono, se devuelve tal cual.
        - **2-D** ``(N, C)`` → estéreo u otro multi-canal, se promedia a mono.

    Returns
    -------
    NDArray[np.float64]
        Señal mono de shape ``(N,)``.

    Raises
    ------
    ValueError
        Si el array tiene más de 2 dimensiones.

    Examples
    --------
    >>> import numpy as np
    >>> stereo = np.array([[0.5, 0.3], [0.8, 0.2], [-0.4, -0.6]])
    >>> to_mono(stereo)
    array([ 0.4,  0.5, -0.5])
    """
    if y.ndim == 1:
        return y
    elif y.ndim == 2:
        return np.mean(y, axis=1)
    else:
        raise ValueError(
            f"Se esperaba un array 1-D (mono) o 2-D (estéreo), "
            f"pero se recibió un array de {y.ndim} dimensiones."
        )


def diente_de_sierra(
    N: int,
    duracion: float,
    fs: int,
    frecuencia: float,
) -> NDArray[np.float64]:
    """
    Genera una onda diente de sierra mediante síntesis aditiva (serie de Fourier).

    Aproxima la onda diente de sierra como la suma de sus primeros ``N`` armónicos
    sinusoidales, usando la representación en series de Fourier:

        y(t) = Σ_{n=1}^{N}  sin(2π · n · f · t) / n

    A mayor ``N``, mejor la aproximación a la forma ideal, pero más pronunciado
    el **fenómeno de Gibbs** (oscilaciones en las discontinuidades).

    Parameters
    ----------
    N : int
        Número de armónicos a sumar. ``N = 1`` produce una sinusoide pura.
        Valores entre 10 y 50 producen una buena aproximación audible.
    duracion : float
        Duración de la señal generada en segundos.
    fs : int
        Frecuencia de muestreo en Hz (ej. 44100).
    frecuencia : float
        Frecuencia fundamental de la onda en Hz (altura percibida del tono).

    Returns
    -------
    NDArray[np.float64]
        Señal diente de sierra de longitud ``int(duracion * fs)``.

    Notes
    -----
    La señal **no está normalizada**. Para exportar como audio, aplicar
    :func:`normalizar` antes de escribir el archivo.

    Examples
    --------
    >>> import numpy as np
    >>> y = diente_de_sierra(N=20, duracion=1.0, fs=44100, frecuencia=220.0)
    >>> y.shape
    (44100,)
    """
    samples = int(duracion * fs)
    t = np.arange(samples) / fs
    y = np.zeros(samples)
    for n in range(1, N + 1):
        y += np.sin(2.0 * np.pi * n * frecuencia * t) / n
    return y
