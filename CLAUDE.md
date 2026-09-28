# CLAUDE.md — Señales y Sistemas (UNTREF)

## Qué es este repositorio

Material práctico de la asignatura **Señales y Sistemas** de Ingeniería de Sonido (UNTREF). El curso completo son 15 clases (dictadas en el 1C 2026, martes). En el **2C 2026** la práctica son 7 sesiones los miércoles (30/9 — 18/11) dedicadas al TP; las semanas 1-6 las da la titular (Trina Adrián de Pérez). Ver `cronograma.md`.

### Estructura

```
signal-systems/
├── clases/              # 15 clases con notebooks Marimo (.py) — curso completo
├── trabajo_practico/    # TP: RIR-API (Room Impulse Response API)
│   ├── README.md        # Consigna completa
│   ├── especificacion/  # Milestones M0-M3
│   ├── rubrica.md       # Criterios de evaluación
│   ├── ruta.md, marco_conceptual.md  # Ruta del TP y marco conceptual (páginas del sitio)
│   ├── interactivos/    # Escenas HTML (Web Audio, three.js) embebidas en el sitio + lógica acústica con tests
│   └── template_repo/   # Template FastAPI: cada grupo lo copia a un repo nuevo (no es fork)
├── guias/               # Setup entorno, Git, Marimo, Quarto
├── material_extra/      # GGWave, GameOfLife, recursos IA
└── cronograma.md        # Cursada actual (arriba) + curso completo (referencia)
```

### Tres pilares del curso

1. **Lógica y programación** — Python, NumPy/SciPy, procesamiento de señales
2. **Vibecoding, Agents, Skills** — IA como herramienta de desarrollo
3. **De idea a MVP** — Git, testing, CI/CD, el TP como producto real

## Convenciones

- **Idioma**: Todo el contenido está en español (sin tildes en código/archivos). Los nombres de archivos, variables y funciones usan snake_case en inglés o español según contexto.
- **Notebooks**: Usan Marimo (archivos `.py`), no Jupyter.
- **TP (RIR-API)**: API REST con FastAPI. Estructura `app/` con `routers/`, `services/`, `schemas/`. La API de referencia de la cátedra está desplegada en https://rir-api.onrender.com/docs.
- **Template repo**: En `trabajo_practico/template_repo/` — cada grupo copia su contenido a un repo nuevo (instrucciones en su README y en M0). Stubs con `NotImplementedError` y tests de M1-M3 marcados `xfail` hasta implementarlos.
- **Branches**: `master` es la rama principal (cada push despliega el sitio), `develop` para trabajo en progreso.
- **Commits**: Mensajes descriptivos en español o inglés, sin convención estricta.

## Qué NO hacer

- No modificar el contenido teórico (eso está en el Aula Virtual de UNTREF).
- No agregar audios nuevos al repo salvo los livianos que usa el sitio (`trabajo_practico/audio/`, `trabajo_practico/interactivos/audio/`).
- No incluir soluciones completas en el template_repo — solo stubs con `NotImplementedError`.
- No cambiar la estructura de milestones (M0-M3) ni las fechas sin confirmación.

## Trabajo práctico — RIR-API

El TP pide a los alumnos desarrollar una API REST para cálculo de parámetros acústicos ISO 3382:

| Milestone | Presentación → Entrega (2C 2026) | Contenido |
|-----------|----------------------------------|-----------|
| M0 | 30/9 → 7/10 (async, Slack/GitHub) | Arquitectura, repo, /health endpoint |
| M1 | 14/10 → 28/10 | Ruido rosa, sine sweep, reproducir_y_grabar (services) |
| M2 | 21/10 → 4/11 | cargar_audio, sintetizar_ri, deconvolución, bandas de octava, dB (services) |
| M3 | 28/10 → 18/11 | API REST completa, endpoints, validación, demo + oral |

Evaluación 2C 2026: M0-M2 seguimiento sin nota; nota del TP = 60 % M3 + 40 % oral (`AI_LOG.md` obligatorio sin nota; sin informe escrito). La landing (`docs/overrides/home.html`) lista las sesiones de la cursada actual a mano. Todo el material del TP está en páginas del sitio (sección Trabajo Práctico); `hooks/ruta_tp.py` agrega a cada página "Dónde estamos" (orden de lectura + hilo conductor) y "Qué sigue". Lo interactivo vive en `trabajo_practico/interactivos/` y se embebe con iframe.

### Implementación de referencia (fuera de este repo)

- **Backend**: repo `RIR-API` (desplegado en https://rir-api.onrender.com)
- **Frontend**: repo `RIR-API_frontend` (desplegado en https://rir-api-frontend.onrender.com)

## Comandos útiles

```bash
# Abrir notebook de clase
marimo edit clases/clase_01/contenido.py

# Linting
ruff check .
ruff format .

# Tests de la lógica acústica de los interactivos y del hook de la ruta
node --test trabajo_practico/interactivos/_comun/tests/*.test.mjs
python3 -m unittest hooks.tests.test_ruta_tp

# Tests del template
cd trabajo_practico/template_repo && pytest -v
```
