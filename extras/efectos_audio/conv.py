"""
conv.py
-------
Convolución de señales de audio con respuestas al impulso (reverb convolutiva).

Fundamento teórico
------------------
La reverb convolutiva aprovecha el **Teorema de Representación de Sistemas LTI**:
cualquier sala o espacio acústico, modelado como un sistema LTI, queda
completamente caracterizado por su **Respuesta al Impulso** (IR, del inglés
*Impulse Response*).

Conocida la IR ``h[n]``, la salida del sistema ante cualquier entrada ``x[n]``
es la convolución discreta:

    y[n] = (x * h)[n] = Σ_{k=0}^{N-1}  x[k] · h[n - k]

Para IRs largas (salas de conciertos, catedrales) esta suma directa tiene
complejidad O(N²). Se usa en cambio la **convolución vía FFT** que, por el
Teorema de convolución, reduce la complejidad a O(N log N):

    Y(ω) = X(ω) · H(ω)   →   y[n] = IFFT { FFT{x} · FFT{h} }
"""

import numpy as np
import scipy.signal as signal
from numpy.typing import NDArray


def convolve_ir(
    x: NDArray[np.float64],
    fs_x: int,
    ir: NDArray[np.float64],
    fs_ir: int,
    normalize: bool = True,
) -> NDArray[np.float64]:
    """
    Aplica una respuesta al impulso (IR) a una señal de audio por convolución FFT.

    Si las frecuencias de muestreo de la señal (``fs_x``) y la IR (``fs_ir``)
    difieren, la IR es re-muestreada mediante interpolación lineal para que
    ambas queden en ``fs_x`` antes de la convolución.

    Parameters
    ----------
    x : NDArray[np.float64]
        Señal de audio de entrada (mono). Longitud ``N``.
    fs_x : int
        Frecuencia de muestreo de la señal de entrada en Hz.
    ir : NDArray[np.float64]
        Respuesta al impulso de la sala o espacio a emular. Puede ser:

        - **1-D** ``(M,)``   → IR mono.
        - **2-D** ``(M, C)`` → IR estéreo/multi-canal; se promedia a mono.

    fs_ir : int
        Frecuencia de muestreo de la IR en Hz.
    normalize : bool, optional
        Si es ``True`` (por defecto), normaliza la señal de salida al rango
        ``[-1, 1]`` para evitar clipping. Si es ``False``, retorna la
        convolución sin escalar.

    Returns
    -------
    NDArray[np.float64]
        Señal de salida convolucionada. Su longitud es ``N + M - 1``, donde
        el tramo adicional ``M - 1`` corresponde a la **cola de reverberación**
        natural.

    Notes
    -----
    La longitud de salida es mayor que la entrada. Si se desea recortar al
    tamaño original, usar ``y[:len(x)]`` (pero se pierde la cola de reverb).

    La implementación usa :func:`scipy.signal.fftconvolve` con ``mode='full'``,
    que selecciona automáticamente el tamaño de FFT óptimo (potencia de 2).

    Examples
    --------
    >>> import soundfile as sf
    >>> from conv import convolve_ir
    >>>
    >>> x, fs_x = sf.read("audio/guitarra.wav")
    >>> ir, fs_ir = sf.read("audio/sala_catedral.wav")
    >>> y = convolve_ir(x, fs_x, ir, fs_ir, normalize=True)
    >>> sf.write("audio/guitarra_catedral.wav", y, fs_x)
    """
    x = np.asarray(x, dtype=np.float64)
    ir = np.asarray(ir, dtype=np.float64)

    # Convertir IR estéreo o multi-canal a mono
    if ir.ndim > 1:
        ir = np.mean(ir, axis=1)

    # Re-muestrear la IR si las tasas de muestreo no coinciden
    if fs_x != fs_ir:
        duration = len(ir) / fs_ir
        t_old = np.linspace(0.0, duration, len(ir))
        t_new = np.linspace(0.0, duration, int(duration * fs_x))
        ir = np.interp(t_new, t_old, ir)

    # Convolución vía FFT: complejidad O(N log N)
    y = signal.fftconvolve(x, ir, mode="full")

    # Normalización opcional
    if normalize:
        max_val = np.max(np.abs(y))
        if max_val > 0.0:
            y = y / max_val

    return y
