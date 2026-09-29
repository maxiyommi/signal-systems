"""Utilidades HTTP para audio: responder un WAV y recibir un archivo subido.

No son procesamiento de senales: resuelven la conexion entre FastAPI y NumPy
para que los routers queden cortos. Se usan desde M1 (``wav_response``) y M2
(``uploaded_file``). Vienen resueltas en el template; no hace falta tocarlas.
"""

import io
import tempfile
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

import numpy as np
import soundfile as sf
from fastapi import Response, UploadFile


def wav_response(signal: np.ndarray, fs: int, filename: str = "signal.wav") -> Response:
    """Devuelve una senal como archivo WAV descargable.

    Parameters
    ----------
    signal : np.ndarray
        Senal a enviar (se guarda en punto flotante de 32 bits, sin recortar).
    fs : int
        Frecuencia de muestreo en Hz.
    filename : str
        Nombre sugerido para la descarga.

    Returns
    -------
    fastapi.Response
        Respuesta ``audio/wav`` con el archivo como contenido.
    """
    buffer = io.BytesIO()
    sf.write(buffer, np.asarray(signal, dtype=np.float32), fs, format="WAV", subtype="FLOAT")
    return Response(
        content=buffer.getvalue(),
        media_type="audio/wav",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@contextmanager
def uploaded_file(file: UploadFile) -> Iterator[Path]:
    """Guarda un archivo subido en una carpeta temporal y entrega su ruta.

    Asi el router puede usar ``load_audio(path)`` igual que con un archivo local.
    La carpeta se borra al salir del ``with``: los tests no ensucian el repo.

    Examples
    --------
    >>> with uploaded_file(file) as path:  # doctest: +SKIP
    ...     signal, fs = load_audio(path)
    """
    suffix = Path(file.filename or "").suffix or ".wav"
    with tempfile.TemporaryDirectory() as folder:
        path = Path(folder) / f"upload{suffix}"
        path.write_bytes(file.file.read())
        yield path
