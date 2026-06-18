"""
efectos.py
----------
Efectos de audio implementados en Python siguiendo el marco de Señales y Sistemas.

Cada función representa un sistema con propiedades bien definidas (causalidad,
linealidad, invarianza temporal) que se corresponden con efectos de audio clásicos.

Efectos disponibles
-------------------
- tremolo : Modulación de amplitud mediante LFO (sistema LTV)
- delay   : Eco recursivo con retroalimentación (sistema IIR, LTI)
"""

import numpy as np
from numpy.typing import NDArray


def tremolo(
    x: NDArray[np.float64],
    fs: int,
    depth: float = 0.8,
    f_mod: float = 1.0,
) -> NDArray[np.float64]:
    """
    Aplica el efecto de tremolo a una señal de audio.

    El tremolo es un sistema **lineal variante en el tiempo (LTV)**. La señal de
    entrada x[n] se multiplica punto a punto por una envolvente modulante m[n],
    generada por un oscilador de baja frecuencia (LFO):

        y[n] = x[n] · m[n]

        m[n] = (1 - depth) + depth · ½ · (1 + sin(2π · f_mod · n / fs))

    La envolvente m[n] oscila entre ``(1 - depth)`` y ``1``, lo que produce la
    variación periódica de volumen característica del efecto. Al tratarse de una
    multiplicación por una señal dependiente del tiempo, el sistema **no es LTI**.

    Parameters
    ----------
    x : NDArray[np.float64]
        Señal de audio de entrada (mono), normalizada en el rango [-1, 1].
    fs : int
        Frecuencia de muestreo en Hz (ej. 44100).
    depth : float, optional
        Profundidad de modulación, en el intervalo [0, 1].

        - ``0.0`` → sin efecto, la señal queda inalterada.
        - ``1.0`` → modulación completa; la señal alcanza silencio en los valles del LFO.

        Por defecto ``0.8``.
    f_mod : float, optional
        Frecuencia del LFO en Hz. Valores típicos entre 1 y 8 Hz producen tremolo
        musical audible. Por defecto ``1.0`` Hz.

    Returns
    -------
    NDArray[np.float64]
        Señal de salida con el efecto de tremolo aplicado, misma longitud que ``x``.

    Notes
    -----
    La envolvente resultante satisface :math:`m[n] \\in [1-d,\\, 1]` para todo :math:`n`,
    por lo que la señal de salida siempre está acotada si la entrada lo está
    (sistema BIBO estable).

    Examples
    --------
    >>> import numpy as np
    >>> fs = 44100
    >>> t = np.arange(fs) / fs
    >>> x = np.sin(2 * np.pi * 440 * t)   # 1 segundo de La4
    >>> y = tremolo(x, fs, depth=0.9, f_mod=5.0)
    >>> assert y.shape == x.shape
    """
    t = np.arange(len(x)) / fs
    lfo = 0.5 * (1.0 + np.sin(2.0 * np.pi * f_mod * t))
    mod = (1.0 - depth) + depth * lfo
    return x * mod


def delay(
    x: NDArray[np.float64],
    fs: int,
    delay_time: float = 0.5,
    feedback: float = 0.3,
    dry_wet: float = 0.5,
) -> NDArray[np.float64]:
    """
    Aplica el efecto de delay (eco) a una señal de audio.

    El delay implementa un sistema **recursivo, causal y LTI** (con parámetros
    fijos). La ecuación en diferencias es:

        y[n] = x[n] + feedback · y[n - D]

    donde ``D = round(delay_time · fs)`` es el retardo en muestras.

    La retroalimentación hace que cada eco genere nuevos ecos, decayendo
    exponencialmente. La respuesta al impulso es la suma infinita:

        h[n] = Σ_{k=0}^{∞}  feedback^k · δ[n - k·D]

    lo que clasifica al sistema como **IIR** (Infinite Impulse Response). La
    salida final mezcla la señal procesada con la original según ``dry_wet``:

        salida[n] = (1 - dry_wet) · x[n] + dry_wet · y[n]

    Parameters
    ----------
    x : NDArray[np.float64]
        Señal de audio de entrada (mono), normalizada en [-1, 1].
    fs : int
        Frecuencia de muestreo en Hz (ej. 44100).
    delay_time : float, optional
        Tiempo de retardo entre repeticiones en segundos. Por defecto ``0.5`` s.
    feedback : float, optional
        Ganancia del lazo de retroalimentación, en el intervalo ``[0, 1)``.

        - ``0.0`` → un único eco (sistema FIR de un tap).
        - Valores próximos a ``1.0`` → muchas repeticiones de larga duración.

        **Debe ser estrictamente menor que 1** para garantizar estabilidad.
        Por defecto ``0.3``.
    dry_wet : float, optional
        Proporción de mezcla entre señal seca y procesada, en ``[0, 1]``.

        - ``0.0`` → solo señal original (sin efecto).
        - ``1.0`` → solo señal procesada.

        Por defecto ``0.5``.

    Returns
    -------
    NDArray[np.float64]
        Señal de salida con el efecto de delay aplicado, misma longitud que ``x``.

    Notes
    -----
    **Condición de estabilidad:** el sistema es BIBO estable si y solo si
    ``|feedback| < 1``. Los polos de la función de transferencia se ubican en
    :math:`z_k = feedback^{1/D}`, dentro del círculo unitario.

    La implementación es recursiva pura (muestra a muestra), lo que garantiza
    causalidad y permite que el efecto se aplique en tiempo real.

    Examples
    --------
    >>> import numpy as np
    >>> fs = 44100
    >>> t = np.arange(fs * 2) / fs          # 2 segundos
    >>> x = np.zeros(fs * 2)
    >>> x[0] = 1.0                           # impulso unitario
    >>> y = delay(x, fs, delay_time=0.4, feedback=0.5, dry_wet=1.0)
    >>> # Los ecos aparecen cada 0.4 s con amplitud 0.5^k
    """
    delay_samples = int(delay_time * fs)
    n = len(x)
    y = np.zeros(n)

    for i in range(n):
        echo = y[i - delay_samples] if i >= delay_samples else 0.0
        y[i] = x[i] + feedback * echo

    return (1.0 - dry_wet) * x + dry_wet * y
