"""Genera las figuras estáticas de la explicación de la integral de Schroeder (M3, servicio 2).

Uso (desde la raíz del repo):

    uv run --with scipy --with numpy --with matplotlib python \\
        trabajo_practico/img/m3/generar_figuras_schroeder.py

No necesita archivos de audio: todas las figuras usan una RI sintética de T60 conocido (ruido blanco
con caída exponencial, filtrada en la octava de 1 kHz con sosfiltfilt y con 5 ms de ceros antes del
directo, como la deja get_impulse_response de M2). La semilla es fija: las figuras son reproducibles.
"""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import scipy.signal as sps

AQUI = Path(__file__).parent
FS = 48000
T60 = 1.0
FC = 1000
FONDO, TINTA, EJE, GRILLA = "#f5f4f0", "#1c1b22", "#6b6b78", "#dcdad3"
AZUL, VIOLETA, AMBAR, GRIS, ROJO = "#2563eb", "#7c3aed", "#b45309", "#9ca3af", "#b91c1c"
EPS = 1e-300


def coma(x: float, decimales: int = 2) -> str:
    return f"{x:.{decimales}f}".replace(".", ",")


def octava(x: np.ndarray, fc: float = FC) -> np.ndarray:
    sos = sps.butter(4, [fc / np.sqrt(2), fc * np.sqrt(2)], "bandpass", fs=FS, output="sos")
    return sps.sosfiltfilt(sos, x)


def ri_sintetica(t60: float = T60, duracion: float = 2.0, ruido_db: float | None = None,
                 seed: int = 0) -> np.ndarray:
    """RI de una banda de octava: caída exponencial de T60 dado y, opcional, ruido de fondo.

    ``ruido_db`` es el nivel del ruido de fondo respecto del pico de la energía de la banda
    promediada en 10 ms (el mismo promedio con que se grafica).
    """
    rng = np.random.default_rng(seed)
    n = int(duracion * FS)
    t = np.arange(n) / FS
    h = octava(rng.standard_normal(n) * np.exp(-3 * np.log(10) / t60 * t))
    h = np.concatenate([np.zeros(int(0.005 * FS)), h])
    h /= np.max(np.abs(h))
    if ruido_db is not None:
        ruido = octava(rng.standard_normal(len(h)))
        m = int(0.01 * FS)
        pico = np.max(np.convolve(h ** 2, np.ones(m) / m, mode="same"))
        ruido *= np.sqrt(pico * 10 ** (ruido_db / 10) / np.mean(ruido ** 2))
        h = h + ruido
    return h


def schroeder(h: np.ndarray) -> np.ndarray:
    energia = np.cumsum((h ** 2)[::-1])[::-1]
    return 10 * np.log10(energia / energia[0] + EPS)


def t30(edc: np.ndarray) -> float:
    t = np.arange(len(edc)) / FS
    tramo = (edc <= -5) & (edc >= -35)
    return -60 / np.polyfit(t[tramo], edc[tramo], 1)[0]


def cruce_con_ruido(h: np.ndarray) -> int:
    """Muestra donde la recta de la caída (nivel por bloques de 10 ms) cruza el ruido de fondo."""
    n = int(0.01 * FS)
    db = 10 * np.log10(np.array([np.mean(h[k:k + n] ** 2) for k in range(0, len(h) - n, n)]) + 1e-30)
    ruido = 10 * np.log10(np.mean(h[int(0.9 * len(h)):] ** 2) + 1e-30)
    i0 = int(np.argmax(db))
    fin = next((k for k in range(i0, len(db)) if db[k] <= ruido + 10), len(db) - 1)
    t = (np.arange(len(db)) + 0.5) * n / FS
    m, c = np.polyfit(t[i0:fin], db[i0:fin], 1)
    return min(len(h), int((ruido - c) / m * FS))


def energia_db(h: np.ndarray, ms: float = 0) -> np.ndarray:
    """h² en dB respecto del máximo; con ``ms`` > 0, promediada en ventanas de ese largo."""
    e = h ** 2
    if ms:
        m = int(ms * FS / 1000)
        e = np.convolve(e, np.ones(m) / m, mode="same")
    return 10 * np.log10(e / np.max(e) + 1e-30)


def estilo(ax, titulo: str, xlabel: str, ylabel: str, tam: int = 18) -> None:
    ax.set_facecolor(FONDO)
    ax.set_title(titulo, loc="left", fontsize=tam, fontweight="bold", color=TINTA, pad=10)
    ax.set_xlabel(xlabel, fontsize=15, color=TINTA)
    ax.set_ylabel(ylabel, fontsize=15, color=TINTA)
    ax.tick_params(labelsize=13, colors=EJE)
    ax.grid(True, color=GRILLA, linestyle="--", linewidth=0.8)
    for lado in ("top", "right"):
        ax.spines[lado].set_visible(False)
    for lado in ("left", "bottom"):
        ax.spines[lado].set_color(EJE)


def guardar(fig, nombre: str, nota: str) -> None:
    fig.text(0.012, 0.015, nota, fontsize=11, color=EJE)
    fig.tight_layout(rect=(0, 0.05, 1, 1))
    fig.savefig(AQUI / nombre, facecolor=FONDO)
    plt.close(fig)


NOTA = f"RI sintética · octava de 1 kHz · T60 = {coma(T60, 1)} s · fs = 48 kHz"


def figura_paso_a_paso() -> None:
    """h² → energía que queda E(t) → L(t) en dB, con el mismo instante t0 marcado en los tres."""
    h = ri_sintetica(duracion=1.6)
    t = np.arange(len(h)) / FS
    e = h ** 2
    resto = np.cumsum(e[::-1])[::-1]
    t0 = 0.15
    i0 = int(t0 * FS)
    fig, axs = plt.subplots(1, 3, figsize=(16, 5.6), dpi=100, facecolor=FONDO)

    ax = axs[0]
    ax.plot(t, e / e.max(), color=GRIS, linewidth=0.6)
    ax.fill_between(t[i0:], 0, e[i0:] / e.max(), color=AZUL, alpha=0.55, linewidth=0)
    ax.axvline(t0, color=TINTA, linestyle=":", linewidth=1.4)
    ax.set_ylim(0, 0.3)
    ax.set_xlim(0, 1.2)
    ax.annotate("área = energía que\nqueda desde t₀", xy=(0.22, 0.03), xytext=(0.45, 0.15), fontsize=13,
                color=AZUL, arrowprops=dict(arrowstyle="->", color=AZUL))
    estilo(ax, "1 · Energía h²(t)", "Tiempo [s]", "h² (normalizada)", 16)

    ax = axs[1]
    ax.plot(t, resto / resto[0], color=AZUL, linewidth=2.4)
    ax.plot([t0], [resto[i0] / resto[0]], "o", color=TINTA, markersize=8)
    ax.axvline(t0, color=TINTA, linestyle=":", linewidth=1.4)
    ax.set_xlim(0, 1.2)
    ax.annotate(f"E(t₀) / E(0) = {coma(resto[i0] / resto[0], 3)}", xy=(t0, resto[i0] / resto[0]),
                xytext=(0.4, 0.55), fontsize=13, color=TINTA, arrowprops=dict(arrowstyle="->", color=TINTA))
    estilo(ax, "2 · Lo que queda: E(t) = ∫ₜ^∞ h²", "Tiempo [s]", "E(t) / E(0)", 16)

    ax = axs[2]
    edc = schroeder(h)
    ax.plot(t, edc, color=AZUL, linewidth=2.4)
    ax.plot([t0], [edc[i0]], "o", color=TINTA, markersize=8)
    ax.axvline(t0, color=TINTA, linestyle=":", linewidth=1.4)
    ax.annotate(f"10·log₁₀({coma(resto[i0] / resto[0], 3)}) = {coma(edc[i0], 1).replace('-', '−')} dB",
                xy=(t0, edc[i0]), xytext=(0.3, -4), fontsize=13, color=TINTA, arrowprops=dict(arrowstyle="->", color=TINTA))
    ax.set_ylim(-80, 3)
    ax.set_xlim(0, 1.2)
    estilo(ax, "3 · En dB: L(t) = 10·log₁₀ E(t)/E(0)", "Tiempo [s]", "Nivel [dB]", 16)

    guardar(fig, "schroeder_paso_a_paso.png",
            NOTA + " · t₀ = 0,15 s marcado en los tres paneles · en dB, una exponencial es una recta")


def figura_energia_vs_edc() -> None:
    """La energía de la RI en dB es ruidosa; la curva de Schroeder es lisa y monótona."""
    h = ri_sintetica(duracion=1.5)
    t = np.arange(len(h)) / FS
    fig, ax = plt.subplots(figsize=(14, 6.4), dpi=100, facecolor=FONDO)
    ax.plot(t, energia_db(h), color=GRIS, linewidth=0.5, label="Energía h²(t) [dB]")
    ax.plot(t, energia_db(h, 10), color=AMBAR, linewidth=1.6, label="Energía promediada en 10 ms [dB]")
    ax.plot(t, schroeder(h), color=AZUL, linewidth=3, label="Curva de Schroeder L(t)")
    ax.plot(t, -60 / T60 * (t - 0.005), color=TINTA, linestyle="--", linewidth=1.4,
            label=f"Caída ideal: −60 dB en {coma(T60, 1)} s")
    ax.set_ylim(-90, 3)
    ax.set_xlim(0, 1.5)
    estilo(ax, "Por qué integrar: la energía tiembla, la curva de Schroeder no",
           "Tiempo [s]", "Nivel [dB]")
    ax.legend(fontsize=13, frameon=False, loc="upper right")
    guardar(fig, "schroeder_energia_vs_edc.png",
            NOTA + " · una recta ajustada sobre la energía depende de cada pico; sobre la EDC, no")


def figura_promedio() -> None:
    """Teorema de Schroeder: el promedio de muchas caídas de ruido interrumpido es la EDC."""
    h = ri_sintetica(duracion=1.0)
    n = len(h)
    t = np.arange(n) / FS
    rng = np.random.default_rng(7)
    caidas = []
    for _ in range(200):
        x = rng.standard_normal(n)  # ruido que suena "desde siempre" y se corta en t = 0
        y = sps.fftconvolve(x, h)[n - 1:2 * n - 1]  # y[k] = sum_m x[-m] h[k+m]: solo la cola
        caidas.append(y ** 2)
    caidas = np.array(caidas)
    total = np.sum(h ** 2)  # valor esperado de y²[0] con ruido de varianza 1: E(0)
    a_db = lambda e: 10 * np.log10(e / total + 1e-30)  # noqa: E731
    fig, ax = plt.subplots(figsize=(14, 6.4), dpi=100, facecolor=FONDO)
    m = int(0.005 * FS)
    suave = lambda e: np.convolve(e, np.ones(m) / m, mode="same")  # noqa: E731
    for k, c in enumerate(caidas[:8]):
        ax.plot(t, a_db(suave(c)), color=GRIS, linewidth=0.8,
                label="Caídas de ruido interrumpido (8 de 200, una por medición)" if k == 0 else None)
    ax.plot(t, a_db(suave(caidas.mean(axis=0))), color=AMBAR, linewidth=2.6,
            label="Promedio de las 200 caídas")
    ax.plot(t, schroeder(h), color=AZUL, linewidth=2.4, linestyle="--",
            label="Integral de Schroeder de UNA sola RI")
    ax.set_ylim(-70, 8)
    ax.set_xlim(0, 0.9)
    estilo(ax, "Schroeder (1965): una RI integrada = el promedio de infinitas mediciones",
           "Tiempo desde que se corta el ruido [s]", "Nivel [dB]")
    ax.legend(fontsize=13, frameon=False, loc="upper right")
    guardar(fig, "schroeder_promedio.png",
            NOTA + " · método clásico (ISO 3382): excitar con ruido, cortarlo y promediar muchas caídas")


def figura_ruido_de_fondo() -> None:
    """Con ruido de fondo la curva se dobla hacia arriba y el T30 crece; truncar lo corrige."""
    fig, axs = plt.subplots(1, 2, figsize=(16, 6.2), dpi=100, facecolor=FONDO,
                            gridspec_kw={"width_ratios": [1, 1.25]})
    niveles = [(-80, AZUL), (-60, VIOLETA), (-45, ROJO)]

    ax = axs[0]
    h = ri_sintetica(ruido_db=-45)
    t = np.arange(len(h)) / FS
    ax.plot(t, energia_db(h, 10), color=ROJO, linewidth=1.4, label="Energía (10 ms) con ruido a −45 dB")
    ax.axhline(-45, color=TINTA, linestyle=":", linewidth=1.4)
    ax.text(1.95, -50, "ruido de fondo (−45 dB)", ha="right", va="top", fontsize=13, color=TINTA)
    ax.plot(t, -60 / T60 * (t - 0.005), color=TINTA, linestyle="--", linewidth=1.2, label="Caída de la sala")
    ax.set_ylim(-90, 3)
    estilo(ax, "La grabación no termina en silencio", "Tiempo [s]", "Nivel [dB]", 16)
    ax.legend(fontsize=12, frameon=False, loc="upper right")

    ax = axs[1]
    for nivel, color in niveles:
        h = ri_sintetica(ruido_db=nivel)
        edc = schroeder(h)
        t = np.arange(len(h)) / FS
        ax.plot(t, edc, color=color, linewidth=2.4,
                label=f"Ruido a −{-nivel} dB → T30 = {coma(t30(edc))} s")
    h = ri_sintetica(ruido_db=-45)
    corte = cruce_con_ruido(h)
    edc = schroeder(h[:corte])
    ax.plot(np.arange(corte) / FS, edc, color=AMBAR, linewidth=2.6, linestyle="--",
            label=f"Ruido a −45 dB, truncada en {coma(corte / FS)} s → T30 = {coma(t30(edc))} s")
    ax.axvline(corte / FS, color=AMBAR, linestyle=":", linewidth=1.2)
    ax.axhline(-35, color=EJE, linestyle=":", linewidth=1)
    ax.axhline(-5, color=EJE, linestyle=":", linewidth=1)
    ax.text(0.02, -37, "tramo del T30: de −5 a −35 dB", va="top", fontsize=12, color=EJE)
    ax.set_ylim(-90, 3)
    estilo(ax, f"La curva se dobla y el T30 se infla (sala de {coma(T60, 1)} s)", "Tiempo [s]",
           "Nivel [dB]", 16)
    ax.legend(fontsize=12, frameon=False, loc="upper right")
    guardar(fig, "schroeder_ruido_fondo.png",
            NOTA + " · nivel de ruido respecto del pico de energía de la banda · 2 s de grabación")


def figura_final() -> None:
    """Las últimas muestras: con PCM de 16 bits E vale 0 y el log da −∞; eps + recorte lo arregla."""
    h = ri_sintetica(duracion=2.0)
    h16 = np.round(h * 32767) / 32767  # lo que queda al guardar el WAV en PCM de 16 bits
    t = np.arange(len(h)) / FS
    energia = np.cumsum((h16 ** 2)[::-1])[::-1]
    with np.errstate(divide="ignore"):
        crudo = 10 * np.log10(energia / energia[0])
    arreglado = np.maximum(10 * np.log10(energia / energia[0] + 1e-30), -150)
    ceros = np.isneginf(crudo)
    fig, ax = plt.subplots(figsize=(14, 6.2), dpi=100, facecolor=FONDO)
    ax.plot(t, np.where(ceros, np.nan, crudo), color=AZUL, linewidth=3,
            label="10·log₁₀(E/E₀) sin cuidado: −∞ donde E = 0 (hueco)")
    ax.plot(t, arreglado, color=AMBAR, linewidth=1.8, linestyle="--",
            label="Con eps y np.maximum(edc, −150): finito en todo el largo")
    if ceros.any():
        t_cero = t[np.argmax(ceros)]
        ax.axvspan(t_cero, t[-1], color=ROJO, alpha=0.12)
        ax.text(t_cero + 0.02, -60, f"desde {coma(t_cero)} s la cola\nquedó en 0 al\ncuantizar a 16 bits:\n"
                "log(0) = −∞\n→ JSON no lo admite", fontsize=13, color=ROJO, va="top")
    ax.set_ylim(-160, 5)
    ax.set_xlim(0, t[-1])
    estilo(ax, "El final de la curva: log₁₀(0) = −∞", "Tiempo [s]", "Nivel [dB]")
    ax.legend(fontsize=13, frameon=False, loc="upper right")
    guardar(fig, "schroeder_final.png", NOTA + " · RI guardada en PCM de 16 bits, sin ruido de fondo")


def main() -> None:
    figura_paso_a_paso()
    figura_energia_vs_edc()
    figura_promedio()
    figura_ruido_de_fondo()
    figura_final()
    for nivel in (-80, -60, -45):
        h = ri_sintetica(ruido_db=nivel)
        corte = cruce_con_ruido(h)
        print(f"T30 con ruido a {nivel} dB:", round(t30(schroeder(h)), 2),
              "· truncada en", round(corte / FS, 2), "s:", round(t30(schroeder(h[:corte])), 2))


if __name__ == "__main__":
    main()
