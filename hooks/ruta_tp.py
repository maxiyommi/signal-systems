"""
hooks/ruta_tp.py
───────────────────────────────────────────────────────────────────────────────
Hook de MkDocs que agrega a cada página del Trabajo Práctico:

  - al inicio, "Dónde estamos": en qué paso de los 6 de la ruta está la página,
    qué etapa del hilo conductor (del fenómeno físico a la medición
    automatizada) trabaja y el material de apoyo que conviene leer antes;
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
        "corto": "Marco",
        "titulo": "Marco conceptual",
        "tema": "El fenómeno y cómo se modela con Señales y Sistemas",
        "etapas": ["fenomeno", "modelo", "modulos"],
        "antes": [],
    },
    {
        "src": "trabajo_practico/README.md",
        "corto": "Consigna",
        "titulo": "Consigna",
        "tema": "Qué se construye, milestones y evaluación",
        "etapas": [],
        "antes": [("Marco conceptual", "trabajo_practico/marco_conceptual.md")],
    },
    {
        "src": "trabajo_practico/especificacion/m0_arquitectura.md",
        "corto": "M0",
        "titulo": "M0 · El plano (arquitectura)",
        "tema": "Arquitectura, repositorio, issues y /health",
        "etapas": ["modulos"],
        "antes": [_clase(1, "entorno, Git y GitHub"), _clase(3, "módulos y testing"), _clase(7, "sistemas y respuesta al impulso")],
    },
    {
        "src": "trabajo_practico/especificacion/m1_generacion.md",
        "corto": "M1",
        "titulo": "M1 · Generación de señales",
        "tema": "Ruido rosa, sine sweep, grabación y los primeros endpoints",
        "etapas": ["excitacion"],
        "antes": [_clase(4, "generación de señales con NumPy"), _clase(6, "audio digital, ruido y sweep")],
    },
    {
        "src": "trabajo_practico/especificacion/m2_procesamiento.md",
        "corto": "M2",
        "titulo": "M2 · Procesamiento de la RI",
        "tema": "Deconvolución, bandas de octava, dB y un endpoint que recibe archivos",
        "etapas": ["identificacion"],
        "antes": [_clase(8, "convolución y deconvolución"), _clase(9, "FFT, filtros y bandas de octava")],
    },
    {
        "src": "trabajo_practico/especificacion/m3_producto_final.md",
        "corto": "M3",
        "titulo": "M3 · Producto final",
        "tema": "Schroeder, parámetros ISO 3382 y la API completa",
        "etapas": ["dato", "automatizacion"],
        "antes": [_clase(10, "envolvente, Schroeder y parámetros"), _clase(11, "calidad y CI"),
                  _clase(12, "documentación"), _clase(13, "API REST"), _clase(14, "pulido")],
    },
]

_POR_SRC = {p["src"]: i for i, p in enumerate(RUTA)}
PAGINA_RUTA = "trabajo_practico/ruta.md"
MARCADOR = "<!-- ruta-completa -->"


def _rel(desde, hacia):
    """Link relativo (entre archivos .md) para que MkDocs lo resuelva."""
    return posixpath.relpath(hacia, posixpath.dirname(desde))


_POR_ID = {h["id"]: h for h in HILO}


def _pasos(actual):
    """Los 6 pasos de la ruta en una fila; el actual resaltado y los anteriores marcados como hechos."""
    items = "\n".join(
        f'<li class="ruta-tp__paso{" actual" if i == actual else " hecho" if i < actual else ""}">'
        f'<span>{i + 1}</span>{p["corto"]}</li>'
        for i, p in enumerate(RUTA)
    )
    return f'<ol class="ruta-tp__pasos">\n{items}\n</ol>'


def _etapas_texto(etapas):
    if not etapas:
        return "reúne todo el recorrido: qué se construye, en qué milestones y cómo se evalúa."
    return " · ".join(f'**{_POR_ID[e]["titulo"]}** ({_POR_ID[e]["detalle"]})' for e in etapas) + "."


def encabezado(src):
    i = _POR_SRC[src]
    p = RUTA[i]
    antes = " · ".join(
        f"[{t}]({u if u.startswith('http') else _rel(src, u)})" for t, u in p["antes"]
    ) or "no requiere lectura previa."
    return (
        '<div class="ruta-tp" markdown>\n\n'
        f'**Ruta del TP · Paso {i + 1} de {len(RUTA)}: {p["titulo"]}** · [Ver la ruta completa]({_rel(src, PAGINA_RUTA)})\n\n'
        f'{_pasos(i)}\n\n'
        f'**En el hilo conductor:** {_etapas_texto(p["etapas"])}\n\n'
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
    """Recorrido completo para la página Ruta del TP: los 6 pasos, cada uno con su etapa del hilo."""
    def etiquetas(p):
        if not p["etapas"]:
            return '<span class="ruta-etiqueta ruta-etiqueta--general">Todo el recorrido</span>'
        return " ".join(
            f'<span class="ruta-etiqueta" title="{_POR_ID[e]["detalle"]}">{_POR_ID[e]["titulo"]}</span>'
            for e in p["etapas"]
        )
    pasos = "\n".join(
        f'{i}. **[{p["titulo"]}]({_rel(PAGINA_RUTA, p["src"])})**: {p["tema"]}.<br>{etiquetas(p)}'
        for i, p in enumerate(RUTA, 1)
    )
    return f'<div class="ruta-pasos" markdown="1">\n\n{pasos}\n\n</div>\n'


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
