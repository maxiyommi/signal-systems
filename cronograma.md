# Cronograma — Señales y Sistemas 2026 (Práctica)

## Cursada actual: 2.º cuatrimestre 2026

**Días**: miércoles, a partir de la semana 7 (30 de septiembre — 18 de noviembre de 2026)
**Modalidad**: 4 sesiones presenciales + 3 virtuales

Las semanas 1 a 6 (teoría + Prácticas 1 a 3) están a cargo de la Prof. Trina Adrián de Pérez. Desde la semana 7, la práctica se dedica al **Trabajo Práctico RIR-API**. Cada presentación de milestone ocupa ~2 de las 3 horas; el resto es taller y consultas. Los notebooks del material de apoyo **no se dictan en vivo**: se trabajan durante la semana, con acompañamiento por Slack.

| # | Fecha | Modalidad | En vivo | Material de apoyo |
|---|-------|-----------|---------|-------------------|
| 1 | Mié 30/9 | Presencial | Introducción al TP + [Presentación M0](https://github.com/maxiyommi/signal-systems/blob/master/clases/clase_04/extra/m0_presentacion.pdf) + setup del repo | [Clase 1](https://github.com/maxiyommi/signal-systems/tree/master/clases/clase_01) · [Clase 3](https://github.com/maxiyommi/signal-systems/tree/master/clases/clase_03) · [Clase 7](https://github.com/maxiyommi/signal-systems/tree/master/clases/clase_07) |
| — | Mié 7/10 | Asincrónica | **Entrega M0** por Slack/GitHub (no hay clase) | — |
| 2 | Mié 14/10 | Presencial | [Presentación M1](https://github.com/maxiyommi/signal-systems/blob/master/clases/clase_08/extra/m1_presentacion.pdf) (generación) | [Clase 6](https://github.com/maxiyommi/signal-systems/tree/master/clases/clase_06) · [Clase 4](https://github.com/maxiyommi/signal-systems/tree/master/clases/clase_04) |
| 3 | Mié 21/10 | Virtual | [Presentación M2](https://github.com/maxiyommi/signal-systems/blob/master/clases/clase_11/extra/m2_presentacion.html) (procesamiento) + taller M1 | [Clase 8](https://github.com/maxiyommi/signal-systems/tree/master/clases/clase_08) · [Clase 9](https://github.com/maxiyommi/signal-systems/tree/master/clases/clase_09) |
| 4 | Mié 28/10 | Presencial | **Entrega M1** + [Presentación M3](https://github.com/maxiyommi/signal-systems/blob/master/clases/clase_14/extra/m3_presentacion.pdf) (producto) | [Clase 10](https://github.com/maxiyommi/signal-systems/tree/master/clases/clase_10) |
| 5 | Mié 4/11 | Virtual | **Entrega M2** + taller del producto (API, deploy) | [Clase 13](https://github.com/maxiyommi/signal-systems/tree/master/clases/clase_13) · [Clase 11](https://github.com/maxiyommi/signal-systems/tree/master/clases/clase_11) |
| 6 | Mié 11/11 | Presencial | Taller de cierre + consultas (semana de Parcial 2) | [Clase 12](https://github.com/maxiyommi/signal-systems/tree/master/clases/clase_12) · [Clase 14](https://github.com/maxiyommi/signal-systems/tree/master/clases/clase_14) |
| 7 | Mié 18/11 | Virtual | **Entrega final M3** + **Presentación oral (Demo Day)** | [Clase 15](https://github.com/maxiyommi/signal-systems/tree/master/clases/clase_15) |

### Milestones del TP

| Milestone | Presentación | Entrega | Tag | Evaluación |
|-----------|--------------|---------|-----|------------|
| M0: Arquitectura | 30/9 | 7/10 (Slack/GitHub) | — | Seguimiento, sin nota |
| M1: Generación de señales | 14/10 | 28/10 | `v0.1.0` | Seguimiento, sin nota |
| M2: Procesamiento de RI | 21/10 | 4/11 | `v0.2.0` | Seguimiento, sin nota |
| M3: Producto final + oral | 28/10 | 18/11 | `v1.0.0` | **Con nota**: 60 % M3 + 40 % oral |

El TP pesa el 20 % de la nota de la materia. Ver la [rúbrica](trabajo_practico/rubrica.md).

---

## Curso completo (referencia)

El curso completo tiene **15 clases**. Este es el recorrido tal como se dictó en el 1.er cuatrimestre 2026 (martes 15-18 h, 31/3 — 7/7); sirve como mapa de todo el material disponible.

### Pilares del curso

| Pilar | Descripción | Color |
|-------|-------------|-------|
| **P1** | Lógica y estructuras básicas de programación | `██` |
| **P2** | Vibecoding, Agents, Skills | `▓▓` |
| **P3** | De idea a MVP | `░░` |

---

### Vista general

| # | Fecha | Clase | P1 | P2 | P3 | Entregable |
|---|-------|-------|:--:|:--:|:--:|------------|
| 1 | 31 Mar | El Punto de Partida | ██ | ▓ | ░ | Repo GitHub + entorno |
| 2 | 7 Abr | Hablar en Python | ██ | ▓ | · | Ejercicios pushed |
| 3 | 14 Abr | Construir con Funciones | ██ | · | ░ | Repo TP grupal creado |
| 4 | 21 Abr | El Universo NumPy y las Señales | ██ | ▓ | · | Ejercicios de señales |
| 5 | 28 Abr | Operaciones con Señales | ██ | ▓ | ░ | **M0: Arquitectura** |
| 6 | 5 May | Audio en Python + Generación | ██ | ▓ | ░░ | Avance M1 |
| 7 | 12 May | Sistemas y Clasificación | ██ | ▓ | · | Ejercicios de sistemas |
| 8 | 19 May | Convolución + Entrega 1 | ██ | · | ░░ | **M1: Generación** (`v0.1.0`) |
| 9 | 26 May | Frecuencia y Filtros | ██ | ▓ | · | Ejercicios FFT/filtros |
| 10 | 2 Jun | Procesamiento de la RI | █ | ▓ | ░░ | Avance M2 |
| 11 | 9 Jun | Vibecoding en Profundidad | · | ▓▓ | ░ | Pipeline CI en repo |
| 12 | 16 Jun | Entrega 2 + Documentación | · | ▓ | ░░ | **M2: Procesamiento** (`v0.2.0`) |
| 13 | 23 Jun | De Funciones a Producto | █ | ▓ | ░░ | Avance M3 |
| 14 | 30 Jun | Pulido y Preparación | · | ▓ | ░░ | Informe borrador |
| 15 | 7 Jul | Demo Day | · | · | ░░ | **M3: Producto Final** (`v1.0.0`) |

---

### Detalle por clase

#### Bloque 1: Fundamentos (Semanas 1-4)

##### Clase 1 — 31 Mar: "El Punto de Partida"
- Presentación del curso y los 3 pilares
- Python fundamentals: variables, tipos, operadores, strings
- Git & GitHub desde el minuto uno
- Teaser: ¿Qué es vibecoding?
- **Tarea**: configurar entorno + push README al repo personal

##### Clase 2 — 7 Abr: "Hablar en Python"
- Condicionales, loops, list comprehensions, f-strings
- Estructuras de datos: listas, tuplas, dicts, sets
- IA nivel 1: Claude.ai/ChatGPT para generar código simple
- **Tarea**: ejercicios de estructuras de datos

##### Clase 3 — 14 Abr: "Construir con Funciones"
- Funciones, docstrings (NumPy style), type hints
- Módulos y paquetes
- Formación de grupos del TP + creación de repos
- Testing básico con pytest
- **Tarea**: estructura del repo TP + primer commit grupal

##### Clase 4 — 21 Abr: "El Universo NumPy y las Señales"
- NumPy: arrays, indexing, broadcasting, operaciones vectorizadas
- Señales discretas: impulso, escalón, senoidales, exponenciales
- Matplotlib para señales
- SciPy introducción
- IA nivel 2: evaluar críticamente código generado
- **Tarea**: ejercicios de generación de señales

#### Bloque 2: Procesamiento de Señales (Semanas 5-8)

##### Clase 5 — 28 Abr: "Operaciones con Señales"
- Transformaciones: desplazamiento, escalado, inversión temporal
- Operaciones entre señales: suma, multiplicación
- Periodicidad, energía, potencia
- **TP Milestone 0**: presentación de arquitectura
- **Entrega M0**: plan + diagrama + repo con issues

##### Clase 6 — 5 May: "Audio en Python + Generación de Señales"
- Audio fundamentals: muestreo, bit depth, formatos
- Librerías: soundfile, sounddevice
- Sesión de trabajo TP — funciones de M1
- IA para debugging

##### Clase 7 — 12 May: "Sistemas y Clasificación"
- Clasificación: lineal, TI, causal, estable, con memoria
- Sistemas LTI y respuesta al impulso
- Conexión con acústica de salas
- IA nivel 3: escribir funciones completas con spec

##### Clase 8 — 19 May: "Convolución + Entrega 1"
- Convolución: definición, propiedades, implementación
- Convolución en audio: reverb como convolución
- **Presentaciones Entrega 1** + code review cruzado
- **Entrega M1**: ruido rosa, sine sweep, reproducción/grabación (`v0.1.0`)

#### Bloque 3: Procesamiento Avanzado + IA (Semanas 9-12)

##### Clase 9 — 26 May: "Frecuencia y Filtros"
- DFT/FFT: espectro de magnitud y fase
- Espectrogramas
- Filtros digitales: FIR vs IIR, Butterworth
- Filtros de bandas de octava IEC 61260
- IA para investigación: entender normas y papers

##### Clase 10 — 2 Jun: "Procesamiento de la RI"
- Transformada de Hilbert, envolvente
- Media móvil, suavizado
- Integral de Schroeder
- Regresión lineal por mínimos cuadrados
- Sesión de trabajo TP — funciones de M2
- Intro a agentes IA

##### Clase 11 — 9 Jun: "Vibecoding en Profundidad"
- Deep dive: filosofía del vibecoding
- Riesgos y limitaciones del código IA
- Workshop de agentes IA
- Calidad de código: ruff, formateo
- GitHub Actions CI/CD

##### Clase 12 — 16 Jun: "Entrega 2 + Documentación Moderna"
- **Presentaciones Entrega 2** + code review cruzado
- Documentación: docstrings, README, API docs, GitHub Pages
- Quarto para informe técnico
- IA para documentación
- **Entrega M2**: carga audio, síntesis RI, filtros, escala log (`v0.2.0`)

#### Bloque 4: Integración y Entrega (Semanas 13-15)

##### Clase 13 — 23 Jun: "De Funciones a Producto"
- Integración: main.py, CLI, configuración, error handling
- Packaging con pyproject.toml
- Sesión de trabajo TP — funciones de M3
- IA para refactoring

##### Clase 14 — 30 Jun: "Pulido y Preparación"
- Taller de informe técnico (Quarto/LaTeX)
- Habilidades de presentación
- Sesión de trabajo final
- Reflexión sobre IA en el curso

##### Clase 15 — 7 Jul: "Demo Day"
- **Presentaciones finales** (20 min + 5 min Q&A por grupo)
- Retrospectiva del curso
- **Entrega M3**: software completo, informe, presentación (`v1.0.0`)

---

### Herramientas

| Herramienta | Uso |
|-------------|-----|
| Python 3.12+ | Lenguaje principal |
| uv | Gestor de paquetes |
| VS Code | IDE |
| Git + GitHub | Control de versiones |
| Marimo | Notebooks interactivos |
| NumPy, SciPy, Matplotlib | Computación científica |
| soundfile, sounddevice | Audio I/O |
| pytest | Testing |
| ruff | Linting y formateo |
| GitHub Actions | CI/CD |
| Claude.ai / ChatGPT | Herramientas IA (gratuitas) |
| Quarto / LaTeX | Informe técnico |
