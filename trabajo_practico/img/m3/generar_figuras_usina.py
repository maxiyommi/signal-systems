"""Genera las figuras reales de M3: parámetros por banda y validación de T30 (Usina del Arte).

Uso (desde la raíz del repo):

    uv run --with scipy --with numpy --with soundfile --with matplotlib python \\
        trabajo_practico/img/m3/generar_figuras_usina.py RUTA/ir_posic4-1erpiso_-_sfdc.wav

La RI es de OpenAIR (Usina del Arte, sala sinfónica, posición 4, 1.er piso). Los parámetros se
calculan con el método que pide M3: RI recortada 5 ms antes del pico, filtro de octava Butterworth
de orden 4 con sosfiltfilt, integral de Schroeder truncada en el cruce con el ruido y regresión
en el tramo de cada parámetro. La referencia es la API de la cátedra sobre el mismo archivo
(referencia_api_catedra_usina.json, en esta carpeta).
"""

import json
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import scipy.signal as sps
import soundfile as sf

AQUI = Path(__file__).parent
BANDAS = [125, 250, 500, 1000, 2000, 4000]
TRAMOS = {"EDT": (0, -10), "T20": (-5, -25), "T30": (-5, -35)}
FONDO, TINTA, EJE, GRILLA = "#f5f4f0", "#1c1b22", "#6b6b78", "#dcdad3"
COLORES = {"EDT": "#7c3aed", "T20": "#b45309", "T30": "#2563eb", "ref": "#6b7280"}
FUENTE = "Usina del Arte, posición 4, 1.er piso · OpenAIR (openair.hosted.york.ac.uk)"


def recortar(ir: np.ndarray, fs: int) -> np.ndarray:
    """La RI empieza 5 ms antes del pico, como la deja get_impulse_response (M2)."""
    i = int(np.argmax(np.abs(ir)))
    return ir[max(0, i - int(0.005 * fs)):]


def cruce_con_ruido(banda: np.ndarray, fs: int) -> int:
    """Muestra donde la recta de la caída (nivel por bloques de 10 ms) cruza el ruido de fondo."""
    n = int(0.01 * fs)
    db = 10 * np.log10(np.array([np.mean(banda[k:k + n] ** 2) for k in range(0, len(banda) - n, n)]) + 1e-30)
    ruido = 10 * np.log10(np.mean(banda[int(0.9 * len(banda)):] ** 2) + 1e-30)
    i0 = int(np.argmax(db))
    fin = next((k for k in range(i0, len(db)) if db[k] <= ruido + 10), len(db) - 1)
    t = (np.arange(len(db)) + 0.5) * n / fs
    m, c = np.polyfit(t[i0:fin], db[i0:fin], 1)
    return min(len(banda), int((ruido - c) / m * fs))


def parametros(ir: np.ndarray, fs: int) -> dict[str, list[float]]:
    out = {k: [] for k in TRAMOS}
    for fc in BANDAS:
        sos = sps.butter(4, [fc / np.sqrt(2), fc * np.sqrt(2)], "bandpass", fs=fs, output="sos")
        banda = sps.sosfiltfilt(sos, ir)
        banda = banda[:cruce_con_ruido(banda, fs)]
        energia = np.cumsum(banda[::-1] ** 2)[::-1]
        edc = 10 * np.log10(energia / energia[0] + 1e-300)
        t = np.arange(len(banda)) / fs
        for clave, (desde, hasta) in TRAMOS.items():
            tramo = (edc <= desde) & (edc >= hasta)
            out[clave].append(-60 / np.polyfit(t[tramo], edc[tramo], 1)[0])
    return out


def estilo(ax, titulo: str, ylabel: str) -> None:
    ax.set_facecolor(FONDO)
    ax.set_title(titulo, loc="left", fontsize=20, fontweight="bold", color=TINTA, pad=12)
    ax.set_xlabel("Frecuencia central [Hz]", fontsize=16, color=TINTA)
    ax.set_ylabel(ylabel, fontsize=16, color=TINTA)
    ax.tick_params(labelsize=15, colors=EJE)
    ax.grid(True, color=GRILLA, linestyle="--", linewidth=0.8)
    for lado in ("top", "right"):
        ax.spines[lado].set_visible(False)
    for lado in ("left", "bottom"):
        ax.spines[lado].set_color(EJE)


def figura_parametros(p: dict[str, list[float]], destino: Path) -> None:
    fig, ax = plt.subplots(figsize=(14, 6.9), dpi=100, facecolor=FONDO)
    x = np.arange(len(BANDAS))
    for clave, marcador in (("EDT", "o"), ("T20", "s"), ("T30", "^")):
        ax.plot(x, p[clave], marker=marcador, markersize=9, linewidth=2.6 if clave == "T30" else 2.2,
                color=COLORES[clave], label=clave)
    estilo(ax, "Parámetros por banda · Usina del Arte (RI real)", "Tiempo de reverberación [s]")
    ax.set_xticks(x, [str(b) for b in BANDAS])
    ax.set_ylim(0, 2.6)
    ax.legend(fontsize=16, frameon=False, loc="lower center", ncol=3)
    fig.text(0.075, 0.02, FUENTE, fontsize=11, color=EJE)
    fig.tight_layout(rect=(0, 0.04, 1, 1))
    fig.savefig(destino, facecolor=FONDO)
    plt.close(fig)


def figura_validacion(t30: list[float], ref: list[float], destino: Path) -> None:
    fig, ax = plt.subplots(figsize=(14, 6.9), dpi=100, facecolor=FONDO)
    x, ancho = np.arange(len(BANDAS)), 0.38
    tolerancia = [min(0.1 * r, 0.5) for r in ref]
    ax.bar(x - ancho / 2, t30, ancho, color=COLORES["T30"], label="RIR-API (método de M3)")
    ax.bar(x + ancho / 2, ref, ancho, color=COLORES["ref"], label="Referencia: API de la cátedra")
    ax.errorbar(x + ancho / 2, ref, yerr=tolerancia, fmt="none", ecolor=TINTA, elinewidth=1.6, capsize=7,
                label="Tolerancia (±10 % o ±0,5 s, lo que sea menor)")
    for xi, a, r in zip(x, t30, ref):
        ax.text(xi - ancho / 2, a + 0.04, f"{a - r:+.2f} s".replace(".", ","), ha="center", fontsize=12, color=TINTA)
    estilo(ax, "Validación de T30 · Usina del Arte: RIR-API vs. referencia", "T30 [s]")
    ax.set_xticks(x, [str(b) for b in BANDAS])
    ax.set_ylim(0, 3.1)
    ax.legend(fontsize=14, frameon=False, loc="upper center", ncol=3)
    fig.text(0.075, 0.02, FUENTE + " · sobre cada barra, la diferencia con la referencia", fontsize=11, color=EJE)
    fig.tight_layout(rect=(0, 0.04, 1, 1))
    fig.savefig(destino, facecolor=FONDO)
    plt.close(fig)


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    ir, fs = sf.read(sys.argv[1])
    p = parametros(recortar(ir, fs), fs)
    ref = json.loads((AQUI / "referencia_api_catedra_usina.json").read_text(encoding="utf-8"))["parameters"]
    ref_t30 = [ref["T30"][str(b)] for b in BANDAS]
    figura_parametros(p, AQUI / "parametros_por_banda.png")
    figura_validacion(p["T30"], ref_t30, AQUI / "validacion_comercial.png")
    for clave in TRAMOS:
        print(clave, [round(v, 2) for v in p[clave]])
    print("ref T30", [round(v, 2) for v in ref_t30])


if __name__ == "__main__":
    main()
