# Trabajo Practico - RIR-API: Room Impulse Response API

## Objetivo general

Desarrollar **RIR-API**, una API REST en Python (FastAPI) para el calculo de parametros acusticos segun la norma ISO 3382 (UNE-EN ISO 3382, 2010). El sistema debe contemplar todos los elementos necesarios para el procesamiento de respuestas al impulso: generacion de senales de excitacion, procesamiento de la RI y calculo de parametros acusticos, expuestos como endpoints de una API consumible por cualquier cliente (frontend web, script, otra aplicacion).

El proyecto se desarrolla de forma incremental en **4 milestones** (M0-M3), utilizando herramientas profesionales de desarrollo de software.

> **API de referencia**: La catedra desarrolló una implementacion de referencia desplegada en produccion. Pueden explorar la documentacion interactiva (Swagger UI) en [https://rir-api.onrender.com/docs](https://rir-api.onrender.com/docs) para entender la estructura de endpoints, schemas y respuestas esperadas. Esta API sirve como guia, no como solucion — cada grupo debe desarrollar su propia implementacion.

## El TP como caso de aplicación de Señales y Sistemas

RIR-API es el ejemplo de cómo resolver un problema complejo aplicando los conceptos de la materia. El hilo conductor va de lo conceptual a lo aplicado:

1. **Fenómeno físico.** La reverberación: el sonido de una fuente se suma a sus reflexiones en las superficies del recinto.
2. **Modelo.** La sala se modela como un **sistema lineal e invariante en el tiempo (LTI)**: si $x(t)$ es lo que emite la fuente y $y(t)$ lo que capta el micrófono, $y(t) = (x * h)(t)$. La **respuesta al impulso** $h(t)$ caracteriza por completo a la sala; medir la sala es medir $h(t)$. Las propiedades vistas en clase tienen consecuencias concretas: linealidad (no saturar la cadena), invariancia (repetir y promediar), causalidad (nada llega antes que el sonido directo) y estabilidad ($h(t)$ decae, y cómo decae es el tiempo de reverberación).
3. **Módulos.** La medición es una **cadena de sistemas en cascada**: PC → DAC → amplificador → parlante → sala → micrófono → ADC → PC. Por asociatividad de la convolución, toda la cadena equivale a un único sistema; si los transductores son aproximadamente ideales en la banda de interés, ese sistema es la sala.
4. **Cada módulo, una técnica de procesamiento digital de señales:**

| Concepto de la materia | Qué resuelve en la medición | Función del TP | Milestone |
|------------------------|-----------------------------|----------------|-----------|
| Señales aleatorias, densidad espectral $1/f$ | Excitar todas las bandas con energía pareja por octava | `generar_ruido_rosa` | M1 |
| Frecuencia instantánea, filtro inverso | Una excitación que separa la respuesta lineal de la distorsión | `generar_sine_sweep` | M1 |
| Muestreo, DAC/ADC, sistemas en cascada | Emitir y grabar a la vez | `reproducir_y_grabar` | M1 |
| Convolución, delta, asociatividad | Recuperar $h(t)$ a partir de la grabación | `obtener_ri_desde_sweep` | M2 |
| Filtros LTI (Butterworth, IEC 61260) | Analizar la sala por bandas de octava | `filtro_octava` | M2 |
| Escala logarítmica | Expresar niveles en dB | `a_escala_log` | M2 |
| Señal analítica, transformada de Hilbert | Envolvente de $h(t)$ | `suavizar_signal` | M3 |
| Energía, integración | Curva de decaimiento (Schroeder) | `integral_schroeder` | M3 |
| Mínimos cuadrados | Pendiente de la curva: T30, T20, EDT | `regresion_lineal`, `calcular_parametros_acusticos` | M3 |

5. **Automatización.** Los módulos se encadenan en un software y se exponen como una **API REST**: la medición se automatiza y entrega datos normalizados por la ISO 3382.

El mismo método (observar, modelar, descomponer, resolver cada módulo, encadenar y automatizar) sirve para cualquier problema de ingeniería de sonido que se pueda plantear como señales que atraviesan sistemas. Las [presentaciones del TP](presentaciones/README.md) desarrollan este recorrido, empezando por la conceptual.

## Objetivos de aprendizaje

Al completar este trabajo practico, los alumnos habran adquirido las siguientes habilidades:

- **Modelado con Señales y Sistemas**: plantear un fenómeno físico (la reverberación) como un sistema LTI y descomponer la medición en una cadena de sistemas.
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

| Milestone | Titulo | Presentacion | Entrega | Tag | Evaluacion |
|-----------|--------|--------------|---------|-----|------------|
| [M0](especificacion/m0_arquitectura.md) | El Plano (arquitectura) | Mie 30/09/2026 | Mie 07/10/2026 (asincronica, Slack/GitHub) | - | Seguimiento, sin nota |
| [M1](especificacion/m1_generacion.md) | Generacion de senales | Mie 14/10/2026 | Mie 28/10/2026 | `v0.1.0` | Seguimiento, sin nota |
| [M2](especificacion/m2_procesamiento.md) | Procesamiento de la RI | Mie 21/10/2026 | Mie 04/11/2026 | `v0.2.0` | Seguimiento, sin nota |
| [M3](especificacion/m3_producto_final.md) | Producto final + oral | Mie 28/10/2026 | Mie 18/11/2026 | `v1.0.0` | **Con nota** (60% M3 + 40% oral) |

En cada **presentacion** la catedra presenta la consigna del milestone; en cada **entrega** los grupos muestran su avance (~15 minutos) y reciben feedback por Slack.

Ver la [rubrica de evaluacion](rubrica.md) para conocer los criterios detallados de calificacion.

---

## Resumen de entregas por milestone

### M0 - El Plano (entrega 07/10)
- README del repositorio con integrantes, instrucciones y estructura.
- Diagrama de arquitectura (Mermaid o draw.io).
- Al menos 10 GitHub Issues con labels y asignaciones.
- Proyecto instalable con `pip` o `uv`.

### M1 - Generacion de senales (entrega 28/10)
| Funcion | Descripcion |
|---------|-------------|
| `generar_ruido_rosa(duracion, fs)` | Ruido rosa via algoritmo Voss-McCartney. Espectro -3 dB/octava. |
| `generar_sine_sweep(f1, f2, duracion, fs)` | Sine sweep logaritmico + filtro inverso. |
| `reproducir_y_grabar(signal, fs, duracion_grabacion)` | Reproduccion y grabacion simultanea con `sounddevice`. |

### M2 - Procesamiento de la RI (entrega 04/11)
| Funcion | Descripcion |
|---------|-------------|
| `cargar_audio(ruta)` | Carga archivos WAV/FLAC, devuelve array + sr. |
| `sintetizar_ri(t60_por_banda, fs, duracion)` | Sintetiza RI con T60 conocidos para validacion. |
| `obtener_ri_desde_sweep(grabacion, filtro_inverso)` | Deconvolucion via FFT para obtener la RI. |
| `filtro_octava(signal, fc, fs, orden)` | Filtro de banda de octava segun IEC 61260 (Butterworth). |
| `a_escala_log(signal)` | Conversion a escala logaritmica normalizada (dB). |

### M3 - Producto final: API REST (entrega 18/11)
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

## Presentacion oral

- **Duracion**: 20 minutos de presentacion + 5 minutos de preguntas.
- **Audiencia**: toda la clase (estudiantes y docentes).
- **Formato**: virtual (sesion del miercoles 18/11), con apoyo visual y **demostracion en vivo de la API**.

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

Cada grupo debe mantener un archivo **`AI_LOG.md`** (**obligatorio**, sin nota propia: sin `AI_LOG.md`, M3 no se considera completo) en la raiz del repositorio que documente el uso de herramientas de IA (ChatGPT, Claude, Copilot, etc.) durante el proyecto.

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
- [Consigna de TP version Matlab (referencia historica)](https://github.com/maxiyommi/signal-systems/blob/master/trabajo_practico/consigna_TP_matlab%20(desactualizado).pdf)

### Herramientas de desarrollo
- [FastAPI: documentacion oficial](https://fastapi.tiangolo.com/)
- [Pydantic: validacion de datos](https://docs.pydantic.dev/)
- [uv: gestor de paquetes para Python](https://docs.astral.sh/uv/)
- [pytest: framework de testing](https://docs.pytest.org/)
- [ruff: linting rapido](https://docs.astral.sh/ruff/)
- [GitHub Actions: CI/CD](https://docs.github.com/en/actions)

### Datasets
- [OpenAIR Library - Respuestas al impulso](https://www.openairlib.net/)

### Lectura recomendada
- [How to read a paper (Stanford)](https://web.stanford.edu/class/ee384m/Handouts/HowtoReadPaper.pdf)
- Farina, A. (2000). "Simultaneous measurement of impulse response and distortion with a swept-sine technique." 108th AES Convention.
- Schroeder, M. R. (1965). "New method of measuring reverberation time." JASA, 37(3), 409-412.

### Material de la catedra
- [Presentaciones del TP (conceptual, consigna y milestones)](presentaciones/README.md)
- [Carpeta con material de apoyo](https://drive.google.com/drive/folders/1unNETr7js3hWZtuxa7-5uV9wns9KdTdT?usp=share_link)
