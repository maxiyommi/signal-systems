"""Servicio de calculo de parametros acusticos segun ISO 3382.

Milestone 3: Producto final.
"""

import numpy as np


def suavizar_signal(signal: np.ndarray, ventana: int | str = "hilbert") -> np.ndarray:
    """Suaviza una senal y devuelve su envolvente en **amplitud**.

    - ``ventana='hilbert'`` (recomendado): envolvente de Hilbert,
      ``np.abs(scipy.signal.hilbert(signal))``.
    - ``ventana`` entero: media movil de ``ventana`` muestras. Para que la
      salida quede en amplitud (comparable con Hilbert), devolver la raiz de la
      media movil de ``signal**2`` (envolvente RMS) o, alternativamente, la
      media movil de ``|signal|``. Documentar cual se eligio.

    Parameters
    ----------
    signal : np.ndarray
        Senal de entrada (tipicamente una RI filtrada por banda, array 1D).
    ventana : int | str, optional
        ``'hilbert'`` (por defecto) o el tamano de la ventana de media movil
        en muestras.

    Returns
    -------
    np.ndarray
        Envolvente en amplitud (no negativa), de la misma longitud que ``signal``.

    Raises
    ------
    ValueError
        Si ``ventana`` no es ``'hilbert'`` ni un entero positivo.
    """
    raise NotImplementedError("Implementar en Milestone 3")


def integral_schroeder(ri: np.ndarray) -> np.ndarray:
    """Calcula la integral de Schroeder (Energy Decay Curve) en dB.

    ``E[n] = sum_{k=n}^{N-1} h[k]**2`` (integracion inversa, por ejemplo con
    ``np.cumsum`` sobre la senal invertida) y ``L[n] = 10*log10(E[n] / E[0])``.

    Parameters
    ----------
    ri : np.ndarray
        Respuesta al impulso (o RI filtrada por banda, array 1D).

    Returns
    -------
    np.ndarray
        Curva de decaimiento en dB, normalizada a 0 dB en la primera muestra,
        de la misma longitud que ``ri``.

    References
    ----------
    .. [1] Schroeder, M. R. (1965). "New method of measuring reverberation
       time." JASA 37(3), 409-412.
    """
    raise NotImplementedError("Implementar en Milestone 3")


def regresion_lineal(x: np.ndarray, y: np.ndarray) -> tuple[float, float, float]:
    """Calcula la regresion lineal por minimos cuadrados.

    Se recomienda implementarla a mano (formulas de minimos cuadrados) en lugar
    de ``np.polyfit``, para demostrar comprension del metodo.

    Parameters
    ----------
    x : np.ndarray
        Variable independiente (tipicamente tiempo en segundos).
    y : np.ndarray
        Variable dependiente (tipicamente curva de Schroeder en dB).

    Returns
    -------
    pendiente : float
        Pendiente de la recta ajustada ``m`` (dB/s en el contexto acustico).
    ordenada : float
        Ordenada al origen ``b`` (dB).
    r_cuadrado : float
        Coeficiente de determinacion R^2.
    """
    raise NotImplementedError("Implementar en Milestone 3")


def calcular_parametros_acusticos(ri: np.ndarray, fs: int) -> dict[str, dict[float, float]]:
    """Calcula los parametros acusticos ISO 3382 por banda de octava.

    Parametros: EDT (0 a -10 dB), T10 (-5 a -15 dB), T20 (-5 a -25 dB),
    T30 (-5 a -35 dB), D50 (%) y C80 (dB).

    Parameters
    ----------
    ri : np.ndarray
        Respuesta al impulso (array 1D).
    fs : int
        Frecuencia de muestreo en Hz.

    Returns
    -------
    dict[str, dict[float, float]]
        ``{parametro: {frecuencia_central: valor}}``.
        Ejemplo: ``{'T30': {125: 1.5, 250: 1.3, ...}, 'EDT': {...}, 'D50': {...},
        'C80': {...}}``.

    References
    ----------
    .. [1] ISO 3382-1:2009. "Acoustics -- Measurement of room acoustic
       parameters -- Part 1: Performance spaces."
    """
    raise NotImplementedError("Implementar en Milestone 3")


def metodo_lundeby(ri: np.ndarray, fs: int) -> tuple[int, float]:
    """Estima el punto de truncamiento de la RI (metodo de Lundeby).

    Parameters
    ----------
    ri : np.ndarray
        Respuesta al impulso (array 1D).
    fs : int
        Frecuencia de muestreo en Hz.

    Returns
    -------
    indice_truncamiento : int
        Indice de la muestra donde la RI se cruza con el ruido de fondo.
    nivel_ruido_db : float
        Nivel estimado del ruido de fondo en dB.

    Notes
    -----
    Esta funcion es **opcional** (extra).

    References
    ----------
    .. [1] Lundeby, A. et al. (1995). "Uncertainties of measurements in
       room acoustics." Acustica 81(4), 344-355.
    """
    raise NotImplementedError("Implementar en Milestone 3 (opcional)")
