# Consigna del TP: RIR-API (Room Impulse Response API)

## Objetivo general

Desarrollar **RIR-API**, una API REST en Python (FastAPI) para el cálculo de parámetros acústicos según la norma ISO 3382 (UNE-EN ISO 3382, 2010). El sistema debe contemplar todos los elementos necesarios para el procesamiento de respuestas al impulso: generación de señales de excitación, procesamiento de la RI y cálculo de parámetros acústicos, expuestos como endpoints de una API que puede consumir cualquier cliente (frontend web, script, otra aplicación).

El proyecto se desarrolla de forma incremental en **4 milestones** (M0-M3), con herramientas profesionales de desarrollo de software.

## El TP como caso de aplicación de Señales y Sistemas

RIR-API es el ejemplo de cómo resolver un problema complejo aplicando los conceptos de la materia: se parte de un **fenómeno físico** (la reverberación), se lo **modela** (la sala como sistema LTI, $y = x * h$), se **descompone** la medición en una cadena de sistemas, se **resuelve cada módulo** con una técnica de procesamiento digital de señales y se **automatiza** la medición con una API. El desarrollo completo, con los interactivos, está en el [marco conceptual](marco_conceptual.md); el orden de lectura, en la [ruta del TP](ruta.md).

## Objetivos de aprendizaje

Al completar este trabajo práctico, cada estudiante habrá trabajado:

- **Modelado con Señales y Sistemas**: plantear un fenómeno físico (la reverberación) como un sistema LTI y descomponer la medición en una cadena de sistemas.
- **Procesamiento de señales**: implementar algoritmos de generación, filtrado, deconvolución y análisis de señales de audio.
- **Normativa técnica**: interpretar y aplicar los lineamientos de la ISO 3382 y la IEC 61260.
- **Desarrollo de software**: diseñar e implementar una API REST modular en Python con FastAPI, con buenas prácticas de código, testing y documentación.
- **Arquitectura de APIs**: diseñar endpoints, schemas de validación (Pydantic), manejo de errores HTTP y documentación OpenAPI.
- **Validación**: evaluar el propio software comparando sus resultados con valores conocidos y con software de referencia.
- **Trabajo colaborativo**: usar Git, GitHub, issues, pull requests y revisiones de código.
- **Comunicación técnica**: documentar el proceso y presentar resultados de forma profesional.

!!! warning "Criterio de validación"
    Los tiempos de reverberación (EDT, T20, T30) no deben diferir en más de **±0,5 s** de los que arroja un software de referencia (por ejemplo REW) o de los valores con los que se sintetizó la RI; C80, no más de **±1 dB**. El detalle está en la [especificación de M3](especificacion/m3_producto_final.md).

---

## Estructura del TP: milestones

| Milestone | Presentación | Entrega | Tag | Evaluación |
|-----------|--------------|---------|-----|------------|
| [M0 · El plano (arquitectura)](especificacion/m0_arquitectura.md) | Mié 30/9 | Mié 7/10 (asincrónica, Slack/GitHub) | — | Seguimiento, sin nota |
| [M1 · Generación de señales](especificacion/m1_generacion.md) | Mié 14/10 | Mié 28/10 | `v0.1.0` | Seguimiento, sin nota |
| [M2 · Procesamiento de la RI](especificacion/m2_procesamiento.md) | Mié 21/10 | Mié 4/11 | `v0.2.0` | Seguimiento, sin nota |
| [M3 · Producto final](especificacion/m3_producto_final.md) | Mié 28/10 | Mié 18/11 (+ presentación oral) | `v1.0.0` | **Con nota** (60 % M3 + 40 % oral) |

En cada **presentación** la cátedra presenta la consigna del milestone. En las entregas de M1 y M2 los grupos muestran su avance en clase (~15 minutos) y reciben feedback por Slack; M0 se entrega por Slack. El detalle de cada sesión está en el [cronograma](../cronograma.md) y los criterios de calificación, en la [rúbrica](rubrica.md).

---

## Resumen de entregas por milestone

Los nombres de funciones, parámetros y tests van en inglés y en *snake_case* (PEP 8), alineados con la implementación de referencia de la cátedra (ver [De idea a MVP](#de-idea-a-mvp-la-implementacion-de-referencia)); la documentación y los comentarios, en español. Cada especificación aclara dónde la firma difiere de la referencia.

La API crece con el TP: **cada milestone expone como endpoints lo que construye**. En M1 genera señales, en M2 sintetiza RIs y filtra un WAV subido, y en M3 recibe una RI y devuelve sus parámetros acústicos.

### M0 · El plano (entrega 7/10)
- README del repositorio con integrantes, roles, instrucciones y estructura.
- Diagrama de arquitectura (Mermaid o draw.io).
- Al menos 10 GitHub Issues con labels y asignaciones.
- Proyecto que arranca con `uv run uvicorn app.main:app --reload` y responde en `/health`.

### M1 · Generación de señales (entrega 28/10)
| Función | Descripción |
|---------|-------------|
| `generate_pink_noise(duration, fs)` | Ruido rosa (algoritmo Voss-McCartney). Espectro −3 dB/octava. |
| `generate_sine_sweep_pair(duration, f1, f2, fs)` | Sine sweep logarítmico + filtro inverso. |
| `play_and_record(signal, fs, record_duration)` | Reproducción y grabación simultánea con `sounddevice`. |
| **Endpoints** | `POST /api/v1/signals/pink-noise` y `POST /api/v1/signals/sine-sweep`: devuelven WAV. |

### M2 · Procesamiento de la RI (entrega 4/11)
| Función | Descripción |
|---------|-------------|
| `load_audio(path)` | Carga archivos WAV/FLAC; devuelve la señal en mono y la frecuencia de muestreo. |
| `generate_synthetic_ir(duration, t60_values, fs)` | Sintetiza una RI con T60 conocidos para validar. |
| `get_impulse_response(recording, inverse_filter)` | Deconvolución vía FFT para obtener la RI. |
| `filter_single_band(signal, fs, center_freq, order)` | Filtro de banda de octava según IEC 61260 (Butterworth). |
| `logarithmic_scale_conversion(signal)` | Conversión a escala logarítmica normalizada (dB). |
| **Endpoints** | `POST /api/v1/signals/synthetic-ir` (WAV) y `POST /api/v1/filters/single-band` (recibe un WAV subido). |

### M3 · Producto final: la API completa (entrega 18/11)
| Componente | Descripción |
|------------|-------------|
| `apply_smoothing(signal, fs, method, window_ms)` | Envolvente: transformada de Hilbert o media móvil. |
| `apply_schroeder_integral(ir)` | Integración inversa de Schroeder. |
| `linear_regression(x, y)` | Mínimos cuadrados para calcular los tiempos de reverberación. |
| `calculate_parameters_from_ir(ir, fs)` | EDT, T10, T20, T30, D50 y C80 por banda de octava. |
| **Endpoints** | `POST /api/v1/acoustics/parameters` (recibe una RI, devuelve los parámetros por banda), `/utils/schroeder` y `/utils/smoothing`. Con los de M1 y M2, la API completa. |
| `apply_lundeby(ir, fs)` *(opcional)* | Estima el punto de corte por ruido de fondo; se valora dentro del criterio Funcionalidad. |

---

## Herramientas y tecnologías

| Herramienta | Uso |
|-------------|-----|
| **Python 3.12+** | Lenguaje de desarrollo |
| **uv** | Gestión de entornos y dependencias |
| **FastAPI** | Framework para la API REST |
| **Pydantic** | Validación de datos y schemas |
| **Uvicorn** | Servidor ASGI para correr la API |
| **NumPy / SciPy** | Procesamiento de señales y cálculo numérico |
| **sounddevice** | Reproducción y grabación de audio |
| **matplotlib** | Visualización de resultados |
| **pytest** | Framework de testing |
| **ruff** | Linting y formateo de código |
| **Git / GitHub** | Control de versiones y colaboración |
| **GitHub Actions** | Integración continua (CI) |

El punto de partida es el [template del repositorio](https://github.com/maxiyommi/signal-systems/tree/master/trabajo_practico/template_repo): ya trae la estructura, las dependencias, el CI y los tests de cada milestone. Cómo copiarlo está en la [especificación de M0](especificacion/m0_arquitectura.md).

---

## De idea a MVP: la implementación de referencia

La cátedra desarrolló una implementación completa de RIR-API como ejemplo de cómo llevar una idea técnica a un producto funcional:

- **Backend (API)**: desplegada en [rir-api.onrender.com](https://rir-api.onrender.com). La [documentación interactiva (Swagger UI)](https://rir-api.onrender.com/docs) muestra la estructura de endpoints, schemas y respuestas.
- **Frontend**: aplicación web que consume la API, en [rir-api-frontend.onrender.com](https://rir-api-frontend.onrender.com). Sirve para comparar sus resultados con los de la referencia.
- **Deploy**: la API corre en producción en Render, accesible desde cualquier lugar.

La referencia es una guía para comparar resultados, no un contrato ni una solución: cada grupo desarrolla su propia implementación siguiendo las especificaciones. Este flujo (módulos de procesamiento → API → frontend → deploy) es el camino de una idea a un MVP presentable; el TP recorre la parte central (módulos y API) y el deploy es opcional.

!!! tip "La referencia puede tardar en responder"
    El plan gratuito de Render apaga el servicio cuando nadie lo usa. El primer pedido puede tardar hasta un minuto; después responde normal.

---

## Grupos de trabajo

- Grupos de **3 a 4 integrantes**.
- Cada integrante tiene un **rol definido** y contribuciones verificables en el historial de Git.
- M1, M2 y M3 se entregan con un **tag de Git** (`v0.1.0`, `v0.2.0`, `v1.0.0`) creado en `main` en la fecha indicada.
- Los docentes (**@maxiyommi** y **@jero-scafati**) tienen que estar agregados como colaboradores del repositorio.

---

## Presentación oral (18/11)

- **Duración**: 20 minutos de presentación + 5 minutos de preguntas.
- **Audiencia**: toda la clase (estudiantes y docentes).
- **Formato**: virtual (sesión del miércoles 18/11), con apoyo visual y **demostración en vivo de la API**.

Estructura recomendada:

1. **Introducción** (3 min): contexto, equipo, arquitectura de la API.
2. **Desarrollo técnico** (8 min): demo en vivo (Swagger UI, requests), decisiones de diseño, integración de capas.
3. **Resultados y validación** (6 min): comparación con los valores de referencia, precisión.
4. **Reflexiones** (3 min): dificultades, aprendizajes, mejoras posibles.

Los criterios de evaluación de la presentación (aspectos técnicos, comunicación y análisis crítico) están en la [rúbrica](rubrica.md#rubrica-de-presentacion-oral-40).

---

## Log de desarrollo con IA

Cada grupo mantiene un archivo **`AI_LOG.md`** en la raíz del repositorio que documenta el uso de herramientas de IA (ChatGPT, Claude, Copilot, etc.) durante el proyecto. Es **obligatorio** y no lleva nota propia: sin `AI_LOG.md`, M3 no se considera completo.

### Qué documentar en cada entrada

1. Fecha y milestone.
2. Herramienta utilizada.
3. Consulta realizada (resumida).
4. Resultado obtenido (resumido).
5. Evaluación: ¿fue útil?, ¿qué se modificó?, ¿qué se aprendió?

> El uso de IA está **permitido y fomentado** como herramienta de aprendizaje. Lo que importa es la **honestidad**, la **reflexión crítica** sobre las respuestas obtenidas y la capacidad de **adaptar** las sugerencias al contexto del proyecto. Hay ejemplos y recursos en [Recursos de IA](https://github.com/maxiyommi/signal-systems/tree/master/material_extra/recursos_ia).

---

## Recursos

### Implementación de referencia
- [Frontend web (comparar resultados)](https://rir-api-frontend.onrender.com)
- [Documentación interactiva (Swagger UI)](https://rir-api.onrender.com/docs)
- [Documentación alternativa (ReDoc)](https://rir-api.onrender.com/redoc)

### Normativas y referencias técnicas
- [ISO 3382-1:2009 - Measurement of room acoustic parameters](https://www.iso.org/standard/40979.html)
- [IEC 61260-1:2014 - Octave-band and fractional-octave-band filters](https://www.iso.org/standard/69056.html)
- [Consigna del TP en versión MATLAB (referencia histórica)](https://github.com/maxiyommi/signal-systems/blob/master/trabajo_practico/consigna_TP_matlab%20(desactualizado).pdf)

### Herramientas de desarrollo
- [FastAPI: documentación oficial](https://fastapi.tiangolo.com/)
- [Pydantic: validación de datos](https://docs.pydantic.dev/)
- [uv: gestor de paquetes para Python](https://docs.astral.sh/uv/)
- [pytest: framework de testing](https://docs.pytest.org/)
- [ruff: linting rápido](https://docs.astral.sh/ruff/)
- [GitHub Actions: CI/CD](https://docs.github.com/en/actions)

### Datasets
- [MIT IR Survey - Respuestas al impulso reales](https://mcdermottlab.mit.edu/Reverb/IR_Survey.html) (OpenAIR, la base clásica, está fuera de línea desde septiembre de 2026)

### Lectura recomendada
- [How to read a paper (Stanford)](https://web.stanford.edu/class/ee384m/Handouts/HowtoReadPaper.pdf)
- Farina, A. (2000). "Simultaneous measurement of impulse response and distortion with a swept-sine technique." 108th AES Convention. [PDF](https://www.angelofarina.it/Public/Papers/134-AES00.PDF)
- Schroeder, M. R. (1965). "New method of measuring reverberation time." JASA, 37(3), 409-412.

### Material de la cátedra
- [Ruta del TP y marco conceptual](ruta.md)
- [Carpeta con material de apoyo (Drive)](https://drive.google.com/drive/folders/1unNETr7js3hWZtuxa7-5uV9wns9KdTdT?usp=share_link)
