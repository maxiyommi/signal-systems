"""
hooks/extras_nav.py
───────────────────────────────────────────────────────────────────────────────
Hook de MkDocs que genera dinámicamente las páginas de la sección "Extras"
y las inyecta en la navegación del sitio.

CÓMO AGREGAR UNA NUEVA SECCIÓN EXTRA
─────────────────────────────────────
Solo hay que agregar un diccionario a EXTRAS_CONFIG:

  id          → identificador único (nombre de carpeta en docs/extras/)
  title       → título en el nav y en la página
  description → descripción corta para el índice general
  source_dir  → ruta relativa a la raíz del proyecto
  has_readme  → si True, usa el README.md de source_dir como página principal
  has_pdfs    → si True, genera una página que embede los PDFs encontrados
  asset_globs → patrones glob de archivos a copiar junto a la página
"""

import glob
import logging
import os
import shutil

log = logging.getLogger("mkdocs.plugins")

EXTRAS_CONFIG: list[dict] = [
    {
        "id": "ggwave",
        "title": "ggwave — Datos por Audio",
        "description": (
            "Transmisión de datos a través de sonido usando la librería ggwave. "
            "Incluye ejemplos de encoding/decoding, transmisión de QR por audio y "
            "visualizaciones de modulaciones FSK."
        ),
        "source_dir": "material_extra/ggwave",
        "has_readme": True,
        "has_pdfs": False,
        "asset_globs": ["*.png", "*.jpg", "*.gif", "*.svg", "*.wav", "*.mp3"],
    },
    {
        "id": "recursos_ia",
        "title": "Recursos de IA",
        "description": (
            "Herramientas, bibliografía y recursos recomendados sobre el uso de "
            "Inteligencia Artificial aplicada a señales y sistemas."
        ),
        "source_dir": "material_extra/recursos_ia",
        "has_readme": True,
        "has_pdfs": False,
        "asset_globs": [],
    },
    {
        "id": "intro_ia",
        "title": "Introducción a la IA",
        "description": (
            "Presentaciones de introducción a la Inteligencia Artificial y "
            "Machine Learning, con el dataset Iris como caso de estudio."
        ),
        "source_dir": "material_extra/Intro_IA",
        "has_readme": False,
        "has_pdfs": True,
        "asset_globs": ["*.pdf"],
    },
    # ── Para agregar la sección de efectos de audio cuando esté lista: ─────
    {
        "id": "efectos_audio",
        "title": "Efectos de Audio en Python",
        "description": "Tremolo, delay, reverb y flanger vistos desde señales y sistemas.",
        "source_dir": "material_extra/efectos_audio",
        "has_readme": True,
        "has_pdfs": False,
        "asset_globs": ["*.png", "*.wav", "assets/*", "*.py"],
    },
]

EXTRAS_DOCS_SUBDIR = "extras"


def on_config(config: dict) -> dict:
    """Inyecta la sección 'Extras' al nav de MkDocs."""
    nav = config.get("nav")
    if nav is None:
        log.info("[extras_nav] Nav no definido en mkdocs.yml, usando auto-discovery.")
        return config
    
    # Insertar antes de 'Reglas Slack'
    extras_entry = {"Extras": _build_nav_entries()}
    inserted = False
    for i, item in enumerate(nav):
        if isinstance(item, dict) and "Reglas Slack" in item:
            nav.insert(i, extras_entry)
            inserted = True
            break
    
    if not inserted:
        nav.append(extras_entry)

    config["nav"] = nav
    log.info(f"[extras_nav] Sección 'Extras' inyectada con {len(EXTRAS_CONFIG)} entradas.")
    return config


def on_pre_build(config: dict) -> None:
    """Genera los archivos en docs/extras/ antes del build."""
    docs_dir = config["docs_dir"]
    extras_dir = os.path.join(docs_dir, EXTRAS_DOCS_SUBDIR)
    os.makedirs(extras_dir, exist_ok=True)
    _write_extras_index(extras_dir)
    generated = 0
    for extra in EXTRAS_CONFIG:
        try:
            _process_extra(extra, extras_dir)
            generated += 1
        except Exception as exc:
            log.error(f"[extras_nav] Error procesando '{extra['id']}': {exc}")
    log.info(f"[extras_nav] {generated}/{len(EXTRAS_CONFIG)} secciones generadas.")


def _build_nav_entries() -> list:
    entries = [f"{EXTRAS_DOCS_SUBDIR}/index.md"]
    for extra in EXTRAS_CONFIG:
        entries.append({extra["title"]: f"{EXTRAS_DOCS_SUBDIR}/{extra['id']}/index.md"})
    return entries


def _write_extras_index(extras_dir: str) -> None:
    lines = [
        "# Material Extra\n\n",
        "Recursos complementarios que profundizan en temas específicos del curso, "
        "más allá del temario formal de Señales y Sistemas.\n\n",
    ]
    for extra in EXTRAS_CONFIG:
        lines.append(
            f"- **[{extra['title']}]({extra['id']}/index.md)** — {extra['description']}\n"
        )
    _write_if_changed(os.path.join(extras_dir, "index.md"), "".join(lines))


def _process_extra(extra: dict, extras_dir: str) -> None:
    source_dir = extra["source_dir"]
    dest_dir = os.path.join(extras_dir, extra["id"])
    os.makedirs(dest_dir, exist_ok=True)
    for pattern in extra.get("asset_globs", []):
        for filepath in glob.glob(os.path.join(source_dir, pattern)):
            rel_path = os.path.relpath(filepath, source_dir)
            dest = os.path.join(dest_dir, rel_path)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            if not _is_up_to_date(filepath, dest):
                shutil.copy2(filepath, dest)
    if extra.get("has_readme"):
        _generate_readme_page(extra, source_dir, dest_dir)
    elif extra.get("has_pdfs"):
        _generate_pdf_page(extra, source_dir, dest_dir)
    else:
        _write_placeholder(extra, dest_dir)


def _generate_readme_page(extra: dict, source_dir: str, dest_dir: str) -> None:
    readme_path = os.path.join(source_dir, "README.md")
    if not os.path.exists(readme_path):
        log.warning(f"[extras_nav] README no encontrado en '{source_dir}'.")
        _write_placeholder(extra, dest_dir)
        return
    with open(readme_path, encoding="utf-8") as f:
        content = f.read()
    _write_if_changed(os.path.join(dest_dir, "index.md"), content)


def _generate_pdf_page(extra: dict, source_dir: str, dest_dir: str) -> None:
    pdfs = sorted(glob.glob(os.path.join(source_dir, "*.pdf")))
    lines = [f"# {extra['title']}\n\n", f"{extra['description']}\n\n"]
    if not pdfs:
        lines.append("> No se encontraron archivos PDF en esta sección.\n")
    else:
        for pdf_path in pdfs:
            pdf_name = os.path.basename(pdf_path)
            display_name = (
                pdf_name.replace(".pdf", "").replace("_", " ").replace("-", " ").title()
            )
            lines += [
                f"## {display_name}\n\n",
                f'<p><a href="{pdf_name}" target="_blank" '
                f'class="md-button md-button--primary">📄 Abrir PDF</a></p>\n\n',
                f'<div class="pdf-viewer">\n',
                f'  <iframe src="{pdf_name}" width="100%" height="760px"\n',
                f'    style="border: 1px solid var(--md-default-fg-color--lightest); border-radius: 4px;"\n',
                f'    title="{display_name}"></iframe>\n',
                f'</div>\n\n',
            ]
    _write_if_changed(os.path.join(dest_dir, "index.md"), "".join(lines))


def _write_placeholder(extra: dict, dest_dir: str) -> None:
    content = (
        f"# {extra['title']}\n\n"
        f"{extra['description']}\n\n"
        f"> ⚠️ Contenido en construcción.\n"
    )
    _write_if_changed(os.path.join(dest_dir, "index.md"), content)


def _write_if_changed(path: str, content: str) -> None:
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            if f.read() == content:
                return
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def _is_up_to_date(src: str, dst: str) -> bool:
    return os.path.exists(dst) and os.path.getmtime(src) <= os.path.getmtime(dst)
