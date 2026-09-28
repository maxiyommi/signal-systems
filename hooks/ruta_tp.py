"""
hooks/ruta_tp.py
───────────────────────────────────────────────────────────────────────────────
Hook de MkDocs que agrega a cada página del Trabajo Práctico:

  - al inicio, "Dónde estamos": posición en el orden de lectura, la etapa del
    hilo conductor (del fenómeno físico a la medición automatizada) y el
    material de apoyo que conviene leer antes;
  - al final, "Qué sigue": la próxima página y dónde buscar información.

En trabajo_practico/ruta.md reemplaza el marcador <!-- ruta-completa --> por el
recorrido completo. Es la fuente única del orden de lectura: para cambiarlo,
editar RUTA. Las fechas NO van acá (viven en cronograma.md).
"""

import posixpath

REPO = "https://github.com/maxiyommi/signal-systems/tree/master/"
SLACK = "https://senalesysistemas.slack.com"


def _clase(n, tema):
    return (f"Clase {n} · {tema}", f"{REPO}clases/clase_{n:02d}")


HILO = [
    {"id": "fenomeno", "titulo": "Fenómeno físico", "detalle": "la reverberación en un recinto"},
    {"id": "modelo", "titulo": "Modelo", "detalle": "la sala como sistema LTI: y = x ∗ h"},
    {"id": "modulos", "titulo": "Módulos", "detalle": "la medición como cadena de sistemas"},
    {"id": "excitacion", "titulo": "Excitación", "detalle": "diseñar x(t): ruido rosa y sine sweep"},
    {"id": "identificacion", "titulo": "Identificación", "detalle": "obtener h(t): deconvolución y bandas"},
    {"id": "dato", "titulo": "Del sistema al dato", "detalle": "envolvente, Schroeder y regresión"},
    {"id": "automatizacion", "titulo": "Automatización", "detalle": "una API que mide y entrega datos"},
]

RUTA = [
    {
        "src": "trabajo_practico/marco_conceptual.md",
        "titulo": "Marco conceptual",
        "tema": "El fenómeno y cómo se modela con Señales y Sistemas",
        "etapas": ["fenomeno", "modelo", "modulos"],
        "antes": [],
    },
    {
        "src": "trabajo_practico/README.md",
        "titulo": "Consigna",
        "tema": "Qué se construye, milestones y evaluación",
        "etapas": [],
        "antes": [],
    },
    {
        "src": "trabajo_practico/especificacion/m0_arquitectura.md",
        "titulo": "M0 · El plano",
        "tema": "Arquitectura, repositorio, issues y /health",
        "etapas": ["modulos"],
        "antes": [_clase(1, "entorno, Git y GitHub"), _clase(3, "módulos y testing"), _clase(7, "sistemas y respuesta al impulso")],
    },
    {
        "src": "trabajo_practico/especificacion/m1_generacion.md",
        "titulo": "M1 · Generación",
        "tema": "Ruido rosa, sine sweep y grabación",
        "etapas": ["excitacion"],
        "antes": [_clase(6, "audio digital, ruido y sweep"), _clase(4, "generación de señales con NumPy")],
    },
    {
        "src": "trabajo_practico/especificacion/m2_procesamiento.md",
        "titulo": "M2 · Procesamiento",
        "tema": "Deconvolución, bandas de octava y escala en dB",
        "etapas": ["identificacion"],
        "antes": [_clase(8, "convolución y deconvolución"), _clase(9, "FFT, filtros y bandas de octava")],
    },
    {
        "src": "trabajo_practico/especificacion/m3_producto_final.md",
        "titulo": "M3 · Producto final",
        "tema": "Schroeder, parámetros ISO 3382 y API REST",
        "etapas": ["dato", "automatizacion"],
        "antes": [_clase(10, "envolvente, Schroeder y parámetros"), _clase(13, "API REST"), _clase(11, "calidad y CI"),
                  _clase(12, "documentación"), _clase(14, "pulido")],
    },
]

_POR_SRC = {p["src"]: i for i, p in enumerate(RUTA)}
PAGINA_RUTA = "trabajo_practico/ruta.md"
MARCADOR = "<!-- ruta-completa -->"


def _rel(desde, hacia):
    """Link relativo (entre archivos .md) para que MkDocs lo resuelva."""
    return posixpath.relpath(hacia, posixpath.dirname(desde))


def _hilo(etapas):
    items = "\n".join(
        f'<li class="ruta-tp__etapa{" actual" if h["id"] in etapas else ""}">'
        f'<strong>{h["titulo"]}</strong><span>{h["detalle"]}</span></li>'
        for h in HILO
    )
    return f'<ol class="ruta-tp__hilo">\n{items}\n</ol>'


def encabezado(src):
    i = _POR_SRC[src]
    p = RUTA[i]
    antes = " · ".join(f"[{t}]({u})" for t, u in p["antes"]) or "no requiere lectura previa."
    return (
        '<div class="ruta-tp" markdown>\n\n'
        f'**Ruta del TP · {i + 1} de {len(RUTA)} — {p["titulo"]}** · [Ver la ruta completa]({_rel(src, PAGINA_RUTA)})\n\n'
        f'{_hilo(p["etapas"])}\n\n'
        f'**Leer antes:** {antes}\n\n'
        '</div>\n'
    )


def pie(src):
    i = _POR_SRC[src]
    sig = RUTA[i + 1] if i + 1 < len(RUTA) else None
    que_sigue = (
        f'**Qué sigue:** [{sig["titulo"]}]({_rel(src, sig["src"])}) — {sig["tema"]}.'
        if sig else "**Fin del recorrido.** Lo que queda es construir, validar y presentar."
    )
    buscar = " · ".join([
        f"[Ruta del TP]({_rel(src, PAGINA_RUTA)})",
        f"[Rúbrica]({_rel(src, 'trabajo_practico/rubrica.md')})",
        f"[Cronograma (fechas)]({_rel(src, 'cronograma.md')})",
        f"[Consultas en Slack]({SLACK})",
    ])
    return (
        '<div class="ruta-tp ruta-tp--pie" markdown>\n\n'
        f"{que_sigue}\n\n"
        f"**Dónde buscar:** {buscar}\n\n"
        "</div>\n"
    )


def ruta_completa():
    """Recorrido completo para la página Ruta del TP."""
    pasos = "\n".join(
        f'{i}. **[{p["titulo"]}]({_rel(PAGINA_RUTA, p["src"])})** — {p["tema"]}.'
        for i, p in enumerate(RUTA, 1)
    )
    return f"{_hilo([])}\n\n{pasos}\n"


def agregar_ruta(markdown, src):
    if src == PAGINA_RUTA:
        return markdown.replace(MARCADOR, ruta_completa())
    if src not in _POR_SRC:
        return markdown
    lineas = markdown.split("\n")
    if lineas and lineas[0].startswith("# "):
        cuerpo = "\n".join(lineas[1:])
        salida = f"{lineas[0]}\n\n{encabezado(src)}\n{cuerpo}"
    else:
        salida = f"{encabezado(src)}\n{markdown}"
    return f"{salida.rstrip()}\n\n{pie(src)}"


def on_page_markdown(markdown, page, config, files):  # noqa: ARG001 (firma de MkDocs)
    return agregar_ruta(markdown, page.file.src_uri)
