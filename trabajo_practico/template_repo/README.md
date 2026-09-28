# RIR-API

API REST para procesamiento y analisis de respuestas al impulso segun la norma ISO 3382.

<!-- Badge de CI: reemplazar <usuario>/<repo> por los datos del repositorio del grupo -->
![CI](https://github.com/<usuario>/<repo>/actions/workflows/ci.yml/badge.svg)
![Python](https://img.shields.io/badge/python-3.12+-blue.svg)

## Descripcion

RIR-API es el trabajo practico de Senales y Sistemas (UNTREF, 2C 2026): una API REST
(FastAPI) con la cadena completa de procesamiento acustico, desde la generacion de senales
de excitacion hasta el calculo de parametros acusticos (EDT, T20, T30, D50, C80) segun
ISO 3382-1.

- Consigna, especificaciones y ruta del TP: <https://maxiyommi.github.io/signal-systems/trabajo_practico/ruta/>
- API de referencia de la catedra (Swagger UI): <https://rir-api.onrender.com/docs>

> Este README es un punto de partida: el grupo lo completa en M0 (integrantes, roles,
> diagrama de arquitectura, branching strategy) y lo va actualizando hasta M3 (seccion
> "Validacion" con los resultados).

## Integrantes

| Nombre | Legajo | Rol |
|--------|--------|-----|
| ...    | ...    | ... |

## Requisitos previos

- Python 3.12 o superior
- [uv](https://docs.astral.sh/uv/) (gestor de paquetes y entornos virtuales)
- git y una cuenta de GitHub

## Arranque: crear el repositorio del grupo

Cada grupo trabaja en **un repositorio nuevo propio** y copia adentro el contenido de este
template (no es un fork).

1. Una persona del grupo crea en GitHub un repositorio **vacio** (por ejemplo `rir-api`,
   sin README ni .gitignore) y agrega al resto del grupo y a los docentes
   (**@maxiyommi** y **@jero-scafati**) como colaboradores
   (*Settings → Collaborators → Add people*).
2. Copiar el template y hacer el primer commit:

```bash
# Bajar el repositorio de la materia (solo la ultima version)
git clone --depth 1 https://github.com/maxiyommi/signal-systems.git

# Clonar el repositorio (vacio) del grupo
git clone https://github.com/<usuario>/rir-api.git

# Copiar el contenido del template (incluye archivos ocultos: .github/, .gitignore)
cp -r signal-systems/trabajo_practico/template_repo/. rir-api/

cd rir-api
git add .
git commit -m "chore: estructura inicial desde el template de la catedra"
git branch -M main
git push -u origin main
```

3. El resto del grupo clona `rir-api` y listo. La carpeta `signal-systems/` se puede borrar.

## Instalacion y ejecucion

```bash
# Crear el entorno e instalar dependencias (incluye las de desarrollo: pytest, ruff, ...)
uv sync

# Iniciar la API con hot-reload
uv run uvicorn app.main:app --reload

# Correr los tests
uv run pytest
```

La API queda disponible en `http://localhost:8000`. Documentacion interactiva:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

`uv sync` genera un `uv.lock` con las versiones exactas instaladas: **commitéenlo** en el
repositorio del grupo para que todos (y el CI) usen las mismas versiones.

## Estructura del proyecto

```
rir-api/
├── app/
│   ├── __init__.py
│   ├── main.py                    # Punto de entrada FastAPI (/ y /health)
│   ├── settings.py                # Configuracion (pydantic-settings, variables RIR_*)
│   ├── routers/
│   │   ├── __init__.py
│   │   └── health.py              # GET /health
│   ├── schemas/
│   │   └── __init__.py            # Modelos Pydantic de request/response (M3)
│   └── services/
│       ├── __init__.py
│       ├── pink_noise.py          # generar_ruido_rosa (M1)
│       ├── sine_sweep.py          # generar_sine_sweep (M1)
│       ├── audio_io.py            # reproducir_y_grabar (M1)
│       ├── signal_utils.py        # cargar_audio, sintetizar_ri, obtener_ri_desde_sweep, a_escala_log (M2)
│       ├── filter.py              # filtro_octava (M2)
│       └── acoustic_parameters.py # suavizar_signal, integral_schroeder, regresion_lineal,
│                                  # calcular_parametros_acusticos, metodo_lundeby (M3)
├── tests/
│   ├── data/                      # WAV chicos de prueba (se versionan)
│   ├── test_placeholder.py        # Test trivial (M0)
│   ├── test_generacion.py         # Tests de M1
│   ├── test_procesamiento.py      # Tests de M2
│   ├── test_analisis.py           # Tests de M3 (services)
│   └── test_api.py                # Tests de endpoints (/health desde M0, resto M3)
├── data/                          # Mediciones y audios locales (ignorado por git)
├── docs/
│   └── README.md                  # Guia para la documentacion (graficas de validacion, etc.)
├── .github/workflows/ci.yml       # CI: ruff + pytest en cada push/PR
├── .gitignore
├── pyproject.toml                 # Dependencias y configuracion (ruff, pytest)
└── README.md
```

Los routers y schemas de `signals`, `filters`, `acoustics`, `analysis` y `utils` se agregan
en M3 (ver los `TODO` en `app/main.py`).

## Milestones y entregas (2C 2026)

| Milestone | Entrega | Tag | Evaluacion |
|-----------|---------|-----|------------|
| **M0 · El plano** (arquitectura) | mie 7/10 (asincronica, por Slack/GitHub) | — | Seguimiento, sin nota |
| **M1 · Generacion de senales** | mie 28/10 (en clase) | `v0.1.0` | Seguimiento, sin nota |
| **M2 · Procesamiento de la RI** | mie 4/11 | `v0.2.0` | Seguimiento, sin nota |
| **M3 · Producto final** + presentacion oral | mie 18/11 | `v1.0.0` | **Nota del TP: 60 % M3 + 40 % oral** |

- No hay informe escrito: la validacion de resultados va en una seccion **"Validacion"** de
  este README.
- **`AI_LOG.md`** en la raiz del repositorio es **obligatorio** (sin nota propia, pero sin
  `AI_LOG.md` M3 no se considera completo): registren el uso de herramientas de IA durante
  todo el proyecto.
- Detalle de cada milestone: <https://maxiyommi.github.io/signal-systems/trabajo_practico/ruta/>

### M0 · El plano

- [ ] Repositorio del grupo creado a partir del template, con los docentes como colaboradores.
- [ ] `uv sync`, `uv run uvicorn app.main:app --reload` y `uv run pytest` funcionan.
- [ ] README con integrantes y roles, instalacion, estructura y branching strategy.
- [ ] Diagrama de arquitectura (Mermaid o draw.io) con todos los modulos de M1, M2 y M3.
- [ ] Al menos 10 issues con labels (`milestone-1`, `milestone-2`, `milestone-3`) y asignados.

### M1 · Generacion de senales (`v0.1.0`)

- [ ] `generar_ruido_rosa()` en `app/services/pink_noise.py` (Voss-McCartney recomendado).
- [ ] `generar_sine_sweep()` (sweep + filtro inverso) en `app/services/sine_sweep.py`.
- [ ] `reproducir_y_grabar()` en `app/services/audio_io.py`.
- [ ] Tests de `tests/test_generacion.py` pasando; graficas de validacion en `docs/m1/`.

### M2 · Procesamiento de la RI (`v0.2.0`)

- [ ] `cargar_audio()`, `sintetizar_ri()`, `obtener_ri_desde_sweep()` y `a_escala_log()`
      en `app/services/signal_utils.py`.
- [ ] `filtro_octava()` en `app/services/filter.py`.
- [ ] Tests de `tests/test_procesamiento.py` pasando.

### M3 · Producto final (`v1.0.0`)

- [ ] `suavizar_signal()`, `integral_schroeder()`, `regresion_lineal()` y
      `calcular_parametros_acusticos()` en `app/services/acoustic_parameters.py`.
- [ ] Routers y schemas que exponen toda la funcionalidad como API REST.
- [ ] Tests de `tests/test_analisis.py` y `tests/test_api.py` pasando.
- [ ] Seccion "Validacion" en este README, `AI_LOG.md` y presentacion oral.
- [ ] (Opcional) `metodo_lundeby()`.

## Tests

Las funciones de `app/services/` vienen como *stubs* que lanzan `NotImplementedError`. Sus
tests estan marcados como `xfail` (fallo esperado), asi el CI queda en verde desde el
primer dia:

- Mientras la funcion no este implementada, el test aparece como `x` (xfailed).
- Cuando la implementen bien, aparece como `X` (xpassed). En ese momento conviene **borrar
  la marca `xfail`** del modulo de tests (`pytestmark = ...`) para que el test cuente como
  un test normal.
- Si la implementacion es incorrecta, el test **falla** (rojo) con el `AssertionError`.

```bash
uv run pytest                                  # todos los tests
uv run pytest -v tests/test_generacion.py      # un archivo, con detalle
uv run pytest -v -k ruido_rosa                 # tests cuyo nombre contiene "ruido_rosa"
uv run pytest -rxX                             # listar xfailed / xpassed
uv run pytest --cov=app                        # con cobertura
```

`reproducir_y_grabar` se testea con un *mock* de `sounddevice`, por lo que el CI no necesita
placa de audio. Para probarla de verdad, corran la funcion localmente con un parlante y un
microfono y documenten la configuracion (dispositivo, canales, fs, buffer size).

## Linter y formato

```bash
uv run ruff check app/ tests/          # verificar estilo
uv run ruff check --fix app/ tests/    # corregir lo automatico
uv run ruff format app/ tests/         # formatear
```

El CI (`.github/workflows/ci.yml`) corre `ruff check`, `ruff format --check` y
`pytest --cov=app` en cada push a `main` y en cada pull request.

## Configuracion

`app/settings.py` define la configuracion con `pydantic-settings`. Cualquier valor se puede
sobreescribir con variables de entorno con prefijo `RIR_` (por ejemplo `RIR_FS_DEFAULT=44100`)
o con un archivo `.env` en la raiz (ignorado por git).

## Referencias

- ISO 3382-1:2009 — Acoustics — Measurement of room acoustic parameters.
- Farina, A. (2000). *Simultaneous measurement of impulse response and distortion with a
  swept-sine technique.* 108th AES Convention.
- Schroeder, M. R. (1965). *New method of measuring reverberation time.* JASA 37(3).
- [FastAPI](https://fastapi.tiangolo.com/) · [Pydantic](https://docs.pydantic.dev/) ·
  [uv](https://docs.astral.sh/uv/)
