# Trabajo Practico - RIR-API: Room Impulse Response API

## Objetivo general

Desarrollar **RIR-API**, una API REST en Python (FastAPI) para el calculo de parametros acusticos segun la norma ISO 3382 (UNE-EN ISO 3382, 2010). El sistema debe contemplar todos los elementos necesarios para el procesamiento de respuestas al impulso: generacion de senales de excitacion, procesamiento de la RI y calculo de parametros acusticos, expuestos como endpoints de una API consumible por cualquier cliente (frontend web, script, otra aplicacion).

El proyecto se desarrolla de forma incremental en **4 milestones** (M0-M3), utilizando herramientas profesionales de desarrollo de software.

> **API de referencia**: La catedra desarrolló una implementacion de referencia desplegada en produccion. Pueden explorar la documentacion interactiva (Swagger UI) en [https://rir-api.onrender.com/docs](https://rir-api.onrender.com/docs) para entender la estructura de endpoints, schemas y respuestas esperadas. Esta API sirve como guia, no como solucion — cada grupo debe desarrollar su propia implementacion.

## Objetivos de aprendizaje

Al completar este trabajo practico, los alumnos habran adquirido las siguientes habilidades:

- **Desarrollo de software**: disenar e implementar una API REST modular en Python con FastAPI, con buenas practicas de codigo, testing y documentacion.
- **Arquitectura de APIs**: disenar endpoints, schemas de validacion (Pydantic), manejo de errores HTTP y documentacion OpenAPI.
- **Procesamiento de senales**: implementar algoritmos de generacion, filtrado, deconvolucion y analisis de senales de audio.
- **Normativa tecnica**: interpretar y aplicar los lineamientos de la ISO 3382 y la IEC 61260.
- **Validacion**: autoevaluar el software comparando resultados con herramientas comerciales.
- **Trabajo colaborativo**: usar Git, GitHub, issues, pull requests y revisiones de codigo.
- **Comunicacion tecnica**: documentar el proceso y presentar resultados de forma profesional.
- **Despliegue**: llevar el producto a un entorno accesible (deploy), acercandose a un MVP real.

> **Los resultados obtenidos no deben diferir en mas de +-0.5 s de los arrojados por algun software comercial (y/o de los establecidos en la RI sintetizada).**

---

## Estructura del TP: Milestones

| Milestone | Titulo | Fecha de entrega | Tag | Peso |
|-----------|--------|-----------------|-----|------|
| [M0](especificacion/m0_arquitectura.md) | El Plano (arquitectura) | Semana 5 - 28/04/2026 | - | 5% |
| [M1](especificacion/m1_generacion.md) | Generacion de senales | Semana 8 - 19/05/2026 | `v0.1.0` | 15% |
| [M2](especificacion/m2_procesamiento.md) | Procesamiento de la RI | Semana 12 - 16/06/2026 | `v0.2.0` | 20% |
| [M3](especificacion/m3_producto_final.md) | Producto final | Semana 15 - 07/07/2026 | `v1.0.0` | 30% |

Completar la [rubrica de evaluacion](rubrica.md) para conocer los criterios detallados de calificacion.

---

## Resumen de entregas por milestone

### M0 - El Plano (Semana 5)
- README del repositorio con integrantes, instrucciones y estructura.
- Diagrama de arquitectura (Mermaid o draw.io).
- Al menos 10 GitHub Issues con labels y asignaciones.
- Proyecto instalable con `pip` o `uv`.

### M1 - Generacion de senales (Semana 8)
| Funcion | Descripcion |
|---------|-------------|
| `generar_ruido_rosa(duracion, fs)` | Ruido rosa via algoritmo Voss-McCartney. Espectro -3 dB/octava. |
| `generar_sine_sweep(f1, f2, duracion, fs)` | Sine sweep logaritmico + filtro inverso. |
| `reproducir_y_grabar(signal, fs, duracion_grabacion)` | Reproduccion y grabacion simultanea con `sounddevice`. |

### M2 - Procesamiento de la RI (Semana 12)
| Funcion | Descripcion |
|---------|-------------|
| `cargar_audio(ruta)` | Carga archivos WAV/FLAC, devuelve array + sr. |
| `sintetizar_ri(t60_por_banda, fs, duracion)` | Sintetiza RI con T60 conocidos para validacion. |
| `obtener_ri_desde_sweep(grabacion, filtro_inverso)` | Deconvolucion via FFT para obtener la RI. |
| `filtro_octava(signal, fc, fs, orden)` | Filtro de banda de octava segun IEC 61260 (Butterworth). |
| `a_escala_log(signal)` | Conversion a escala logaritmica normalizada (dB). |

### M3 - Producto final: API REST (Semana 15)
| Componente | Descripcion |
|------------|-------------|
| `suavizar_signal(signal, ventana)` | Media movil o envolvente de Hilbert. |
| `integral_schroeder(ri)` | Integracion inversa de Schroeder. |
| `regresion_lineal(x, y)` | Minimos cuadrados para calcular tiempos de reverberacion. |
| `calcular_parametros_acusticos(ri, fs)` | EDT, T10, T20, T30, T60, D50, C80 por banda de octava. |
| **API REST (FastAPI)** | Endpoints que exponen toda la funcionalidad de M1, M2 y M3. |
| `metodo_lundeby(ri, fs)` *(extra)* | Limites de integracion mas precisos. |

---

## Herramientas y tecnologias

| Herramienta | Uso |
|-------------|-----|
| **Python 3.10+** | Lenguaje de desarrollo |
| **FastAPI** | Framework para la API REST |
| **Pydantic** | Validacion de datos y schemas |
| **Uvicorn** | Servidor ASGI para correr la API |
| **NumPy / SciPy** | Procesamiento de senales y calculos numericos |
| **sounddevice** | Reproduccion y grabacion de audio |
| **matplotlib** | Visualizacion de resultados |
| **pytest** | Framework de testing |
| **ruff** | Linting y formateo de codigo |
| **Git / GitHub** | Control de versiones y colaboracion |
| **GitHub Actions** | Integracion continua (CI) |
| **uv** | Gestion de entornos y dependencias (recomendado) |
| **Quarto / LaTeX** | Informe final |

---

## De idea a MVP: el ejemplo de la catedra

La catedra desarrolló una implementacion completa de RIR-API como ejemplo de como llevar una idea tecnica a un producto funcional:

- **Backend (API)**: API REST desplegada en [https://rir-api.onrender.com](https://rir-api.onrender.com) — los alumnos pueden explorar la [documentacion interactiva (Swagger UI)](https://rir-api.onrender.com/docs) para entender la estructura, los endpoints y los schemas de respuesta.
- **Frontend**: Aplicacion web que consume la API, desplegada en [https://rir-api-frontend.onrender.com](https://rir-api-frontend.onrender.com) — pueden usarla para comparar sus resultados contra los de la implementacion de referencia.
- **Deploy**: La API corre en produccion en Render, accesible desde cualquier lugar.

Este flujo (modulos de procesamiento → API → frontend → deploy) es un ejemplo concreto de como transformar conocimiento tecnico en un MVP presentable. **El objetivo del TP es que cada grupo recorra este mismo camino con su propia implementacion.**

---

## Grupos de trabajo

- Grupos de **3 a 4 integrantes** (excluyente).
- Cada integrante debe tener un **rol definido** y contribuciones verificables en el historial de Git.
- Las entregas se realizan via **tag de GitHub** en la fecha indicada.
- Los docentes deben tener acceso al repositorio como colaboradores.

---

## Informe final

El informe final es **obligatorio** y se realiza en **Quarto** o **LaTeX** (formato UNTREF para memorias cuatrimestrales).

### Distribucion de contenido

| Resumen | Introduccion | Marco teorico | Desarrollo experimental | Resultados | Conclusiones |
|---------|-------------|---------------|------------------------|------------|-------------|
| 5% | 10% | 10% | 25% | 30% | 20% |

### Pautas del informe

- Extension maxima: **5 paginas** (sin apendices).
- Debe incluir diagrama de arquitectura, graficas de resultados y tabla de validacion con software comercial.
- Remitir a detalles relevantes, no ahondar en teoria (usar referencias).
- Documentar como se conectan todos los modulos.
- Validacion del algoritmo con software comercial.
- Los informes entregados fuera de fecha no se evaluan (pasan a recuperatorio).

### Herramientas de escritura

- **LaTeX online**: [Overleaf](https://www.overleaf.com/)
- **LaTeX offline**: [Texmaker](https://www.xm1math.net/texmaker/) + [MiKTeX](https://miktex.org/)
- **Alternativa moderna**: [Quarto](https://quarto.org/) (soporta Jupyter notebooks, Markdown y LaTeX)

> Para la elaboracion del informe en LaTeX recomendamos la lectura del documento [Curso introductorio a escritura en LaTeX](https://drive.google.com/file/d/1yaJD1QCCDyI8oMFzS0ZVzFg-8cyGPZCA/view?usp=share_link), desarrollado por [Nahuel Passano](https://www.linkedin.com/in/nahuelpassano) y [Paula Ortega Riera](https://www.linkedin.com/in/paulaortegariera) de [Infiniem Labs](https://www.infiniemlabs.com.ar/).

---

## Presentacion oral

- **Duracion**: 20 minutos de presentacion + 5 minutos de preguntas.
- **Audiencia**: toda la clase (estudiantes y docentes).
- **Formato**: presencial con apoyo visual y **demostracion en vivo de la API**.

### Estructura recomendada

1. **Introduccion** (3 min): contexto, equipo, arquitectura de la API.
2. **Desarrollo tecnico** (8 min): demo en vivo (Swagger UI, requests), decisiones de diseno, integracion de capas.
3. **Resultados y validacion** (6 min): comparacion con software comercial, precision.
4. **Reflexiones** (3 min): dificultades, aprendizajes, mejoras posibles.

### Evaluacion de la presentacion

| Aspecto | Peso | Descripcion |
|---------|------|-------------|
| Aspectos tecnicos | 40% | Profundidad, calidad de implementacion, validacion, demo |
| Comunicacion | 35% | Claridad, material visual, gestion del tiempo, respuestas |
| Analisis critico | 25% | Reflexion sobre limitaciones, comparacion objetiva, aprendizajes |

---

## Log de desarrollo con IA

Cada grupo debe mantener un archivo **`AI_LOG.md`** en la raiz del repositorio que documente el uso de herramientas de IA (ChatGPT, Claude, Copilot, etc.) durante el proyecto.

### Que documentar en cada entrada

1. Fecha y milestone.
2. Herramienta utilizada.
3. Consulta realizada (resumida).
4. Resultado obtenido (resumido).
5. Evaluacion: fue util? que se modifico? que se aprendio?

> El uso de IA esta **permitido y fomentado** como herramienta de aprendizaje. Lo que se evalua es la **honestidad**, la **reflexion critica** sobre las respuestas obtenidas y la capacidad de **adaptar** las sugerencias al contexto del proyecto. Ver la [rubrica](rubrica.md) para los criterios detallados.

---

## Recursos

### API de referencia
- [Frontend web (comparar resultados)](https://rir-api-frontend.onrender.com)
- [Documentacion interactiva (Swagger UI)](https://rir-api.onrender.com/docs)
- [Documentacion alternativa (ReDoc)](https://rir-api.onrender.com/redoc)

### Normativas y referencias tecnicas
- [ISO 3382-1:2009 - Measurement of room acoustic parameters](https://www.iso.org/standard/40979.html)
- [IEC 61260-1:2014 - Octave-band and fractional-octave-band filters](https://www.iso.org/standard/69056.html)
- [Consigna de TP version Matlab (referencia historica)](consigna_TP_matlab%20(desactualizado).pdf)

### Herramientas de desarrollo
- [FastAPI: documentacion oficial](https://fastapi.tiangolo.com/)
- [Pydantic: validacion de datos](https://docs.pydantic.dev/)
- [uv: gestor de paquetes para Python](https://docs.astral.sh/uv/)
- [pytest: framework de testing](https://docs.pytest.org/)
- [ruff: linting rapido](https://docs.astral.sh/ruff/)
- [GitHub Actions: CI/CD](https://docs.github.com/en/actions)

### Datasets
- [OpenAIR Library - Respuestas al impulso](https://www.openairlib.net/)

### Documentacion y escritura
- [Overleaf - Editor LaTeX online](https://www.overleaf.com/)
- [Quarto - Publicacion tecnica](https://quarto.org/)
- [Generador de tablas en LaTeX](https://www.tablesgenerator.com/)

### Lectura recomendada
- [How to read a paper (Stanford)](https://web.stanford.edu/class/ee384m/Handouts/HowtoReadPaper.pdf)
- Farina, A. (2000). "Simultaneous measurement of impulse response and distortion with a swept-sine technique." 108th AES Convention.
- Schroeder, M. R. (1965). "New method of measuring reverberation time." JASA, 37(3), 409-412.

### Material de la catedra
- [Presentacion con detalle de la consigna](https://docs.google.com/presentation/d/1XJAI0wFRRS6IaVops3jCAcfdRxvMJyQs_mIetzehh1c/edit?usp=sharing)
- [Carpeta con material de apoyo](https://drive.google.com/drive/folders/1unNETr7js3hWZtuxa7-5uV9wns9KdTdT?usp=share_link)
