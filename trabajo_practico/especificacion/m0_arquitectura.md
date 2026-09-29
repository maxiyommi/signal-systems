# M0 · El plano (arquitectura)

!!! info "Fechas y evaluación"
    - **Presentación de la consigna:** miércoles 30 de septiembre de 2026 (presencial)
    - **Entrega:** miércoles 7 de octubre de 2026, asincrónica por Slack/GitHub (ese día no hay clase)
    - **Evaluación:** seguimiento, sin nota (el grupo muestra su avance y recibe feedback por Slack)

## Objetivo

Planificar la arquitectura del software antes de escribir una sola línea de código. Este milestone busca que el grupo defina la estructura del proyecto, distribuya responsabilidades y establezca las bases para un desarrollo organizado y colaborativo.

## Por qué importa

Nadie construye un edificio sin un plano. Con software pasa lo mismo: arrancar a codear sin plan termina en un proyecto que colapsa en M2. M0 **no es un milestone de código**: es el acuerdo del grupo sobre qué se construye, cómo se organizan las partes, quién hace qué y en qué orden. En el hilo conductor del TP, es la etapa de **descomponer el problema en módulos**.

!!! warning "Señales de un plano flojo"
    Nadie sabe qué carpeta toca · tres personas tocan el mismo archivo · issues vagos ("hacer M1") · para M2 el código es un caos.

## Qué están construyendo: una API REST

Un servidor que recibe pedidos HTTP y devuelve datos en JSON. Abran la [API de referencia](https://rir-api.onrender.com/docs) en el navegador o pruébenla desde la terminal:

```bash
curl https://rir-api.onrender.com/health
# {"status": "healthy", "version": "0.1.0", "timestamp": "..."}
```

| Concepto | Qué es |
|----------|--------|
| **Endpoint** | Una URL que hace una cosa. `GET /health` devuelve "estoy vivo". |
| **Request / response** | El cliente manda audio y parámetros; la API responde con T30, C80, etc. |
| **JSON** | El formato para pasar datos: `{"t30": 1.2, "c80": 5.4}`. |

## Tres capas

Una API recibe pedidos y devuelve respuestas. Para que el código no sea un caos, cada pedido pasa por **tres capas**, y cada una hace **una sola cosa**. La forma más fácil de entenderlo es pensar en un restaurante.

<div class="capas-analogia">
<div class="capa capa--router">
<div class="capa__icono"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/><circle cx="5" cy="12" r="2"/></svg></div>
<p class="capa__nombre">Router</p>
<p class="capa__rol">El <strong>mozo</strong></p>
<p>Recibe el pedido del cliente, lo lleva adentro y le trae la respuesta.</p>
<p class="capa__no">No cocina.</p>
<code>app/routers/</code>
</div>
<div class="capa capa--schema">
<div class="capa__icono"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4h6v3H9z"/><path d="M7 5H5v16h14V5h-2"/><path d="m9 14 2 2 4-4"/></svg></div>
<p class="capa__nombre">Schema</p>
<p class="capa__rol">El <strong>control de la comanda</strong></p>
<p>Revisa que el pedido esté bien escrito: que estén todos los datos y que tengan sentido.</p>
<p class="capa__no">No atiende ni cocina.</p>
<code>app/schemas/</code>
</div>
<div class="capa capa--service">
<div class="capa__icono"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg></div>
<p class="capa__nombre">Service</p>
<p class="capa__rol">La <strong>cocina</strong></p>
<p>Hace el trabajo de verdad: acá está el procesamiento de señales de M1, M2 y M3.</p>
<p class="capa__no">No sabe quién pidió ni cómo llegó el pedido.</p>
<code>app/services/</code>
</div>
</div>

### El viaje de un pedido

Seguí paso a paso qué pasa cuando alguien le pide ruido rosa a la API. Probá los dos casos: un pedido bien escrito y uno con un error.

<div class="viaje">
<div class="viaje__casos" role="group" aria-label="Caso">
<button type="button" data-caso="valido" aria-pressed="true">Pedido válido</button>
<button type="button" data-caso="invalido" aria-pressed="false">Pedido con un error</button>
</div>
<ol class="viaje__actores">
<li data-actor="cliente"><span class="viaje__icono"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H4z"/><path d="M9 20h6M12 16v4"/></svg></span><strong>Cliente</strong><span>navegador, script o frontend</span></li>
<li data-actor="router"><span class="viaje__icono"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/><circle cx="5" cy="12" r="2"/></svg></span><strong>Router</strong><span>el mozo</span></li>
<li data-actor="schema"><span class="viaje__icono"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4h6v3H9z"/><path d="M7 5H5v16h14V5h-2"/><path d="m9 14 2 2 4-4"/></svg></span><strong>Schema</strong><span>la comanda</span></li>
<li data-actor="service"><span class="viaje__icono"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg></span><strong>Service</strong><span>la cocina</span></li>
</ol>
<ol class="viaje__pasos" data-caso="valido">
<li data-actor="cliente" data-sentido="ida"><p>El cliente pide ruido rosa de 2 segundos. Manda un <strong>request</strong> a la dirección <code>POST /api/v1/signals/pink-noise</code> con los datos en JSON:</p><pre><code>{"duration": 2, "sample_rate": 44100}</code></pre></li>
<li data-actor="router" data-sentido="ida"><p>El <strong>router</strong> recibe el pedido. No calcula nada: primero se lo pasa al schema para que lo controle.</p></li>
<li data-actor="schema" data-sentido="ida"><p>El <strong>schema</strong> controla la comanda: ¿<code>duration</code> es un número mayor que 0 y como mucho 60? ¿<code>sample_rate</code> es un entero? Todo en orden: el pedido sigue.</p><pre><code>duration    = 2      ✓  (mayor que 0, hasta 60)
sample_rate = 44100  ✓  (entero)</code></pre></li>
<li data-actor="service" data-sentido="ida"><p>El <strong>service</strong> hace el trabajo: llama a la función de M1, que devuelve un arreglo de NumPy con 2 × 44 100 = 88 200 muestras. No sabe nada de HTTP ni de JSON.</p><pre><code>generate_pink_noise(2, 44100)  →  array([0.12, -0.03, 0.41, ...])</code></pre></li>
<li data-actor="router" data-sentido="vuelta"><p>El router recibe el arreglo y lo convierte en JSON, el formato que entiende cualquier cliente.</p></li>
<li data-actor="cliente" data-sentido="vuelta"><p>El cliente recibe la <strong>respuesta</strong> con el código <code>200 OK</code> (salió todo bien) y los datos:</p><pre><code>{"audio": [0.12, -0.03, 0.41, ...]}</code></pre></li>
</ol>
<ol class="viaje__pasos" data-caso="invalido">
<li data-actor="cliente" data-sentido="ida"><p>Ahora el cliente se equivoca y pide una duración negativa:</p><pre><code>{"duration": -1, "sample_rate": 44100}</code></pre></li>
<li data-actor="router" data-sentido="ida"><p>El router recibe el pedido y, como siempre, se lo pasa al schema.</p></li>
<li data-actor="schema" data-sentido="ida"><p>El schema encuentra el error: <code>duration = -1</code> no es mayor que 0. <strong>El pedido se frena acá.</strong></p><pre><code>duration = -1     ✗  (tiene que ser mayor que 0)</code></pre></li>
<li data-actor="cliente" data-sentido="vuelta"><p>La API responde <code>422</code> (datos inválidos) con una explicación del error. <strong>El service nunca se ejecutó</strong>: la cocina no recibe comandas mal escritas, y por eso sus funciones no tienen que andar revisando datos.</p><pre><code>{"detail": [{"loc": ["body", "duration"],
             "msg": "Input should be greater than 0"}]}</code></pre></li>
</ol>
<div class="viaje__panel" aria-live="polite"></div>
<div class="viaje__nav">
<button type="button" data-mover="-1">Anterior</button>
<span class="viaje__contador"></span>
<button type="button" data-mover="1">Siguiente</button>
</div>
</div>

### Las tres capas en el código

Cada capa es un archivo en su carpeta. Así se ve el mismo pedido de ruido rosa en cada una (M0 no pide escribirlas todavía: es para que sepan dónde va cada cosa).

=== "1 · Router (el mozo)"

    En `app/routers/`. Recibe el request, lo pasa por el schema, llama al service y devuelve JSON. **No calcula.**

    ```python
    @router.post("/pink-noise")
    async def pink_noise(req: PinkNoiseRequest):      # FastAPI valida req con el schema
        audio = services.generate_pink_noise(req.duration, req.sample_rate)
        return {"audio": audio.tolist()}              # arreglo de NumPy → lista → JSON
    ```

=== "2 · Schema (la comanda)"

    En `app/schemas/`. Un modelo de Pydantic que describe cómo tiene que venir el pedido; si algo no cumple, FastAPI responde 422 solo.

    ```python
    class PinkNoiseRequest(BaseModel):
        duration: float = Field(gt=0, le=60)           # mayor que 0 y hasta 60 segundos
        sample_rate: int = Field(default=44100)        # si no viene, 44100
    ```

=== "3 · Service (la cocina)"

    En `app/services/`. Funciones puras de procesamiento de señales: entra NumPy, sale NumPy. **No saben de HTTP ni de JSON**, y por eso se pueden testear solas.

    ```python
    def generate_pink_noise(duration: float, fs: int) -> np.ndarray:
        n = int(duration * fs)
        # algoritmo Voss-McCartney
        return signal
    ```

!!! tip "Una regla para acordarse"
    Si una función de `services/` importa algo de FastAPI, o un router hace cuentas con NumPy, algo está en el lugar equivocado.

## Entregables, paso a paso

M0 se arma en este orden: primero el **repositorio** con su estructura, después el **plano** (el diagrama), después el **plan de trabajo** (los issues) y las **reglas para trabajar en equipo** (la branching strategy). Al final, la entrega por Slack.

### 1. Crear el repositorio del grupo

Una persona del grupo crea en GitHub un repositorio **vacío**, por ejemplo `rir-api`, sin README ni `.gitignore` (los trae el template en el paso siguiente). Después agrega como colaboradores al resto del grupo y a los docentes.

!!! tip "No olvidar a los docentes"
    Agregar como **colaboradores** del repositorio a **@maxiyommi** y **@jero-scafati** (*Settings → Collaborators → Add people*). Sin esto no podemos ver el repo ni darles feedback.

### 2. Copiar la estructura del template

La estructura **no se escribe desde cero**: el [template del repositorio](https://github.com/maxiyommi/signal-systems/tree/master/trabajo_practico/template_repo) ya la trae, con las tres capas, los services de M1 a M3 listos para completar, los tests y el CI. No se forkea: se copia su contenido adentro del repositorio que crearon en el paso 1.

```bash
# 1. Bajar el repositorio de la materia (solo la última versión)
git clone --depth 1 https://github.com/maxiyommi/signal-systems.git

# 2. Clonar el repositorio (vacío) del grupo y copiar el template, con los archivos ocultos
git clone https://github.com/<usuario>/rir-api.git
cp -r signal-systems/trabajo_practico/template_repo/. rir-api/

# 3. Primer commit
cd rir-api
git add .
git commit -m "chore: estructura inicial desde el template de la cátedra"
git branch -M main
git push -u origin main

# 4. Probar que anda
uv sync
uv run uvicorn app.main:app --reload     # abrir http://localhost:8000/docs
uv run pytest -v
```

Así queda el repositorio:

```text
rir-api/
├── pyproject.toml          # Dependencias: fastapi, numpy, scipy, pydantic, sounddevice… y las de desarrollo
├── README.md               # Lo completan en este paso
├── app/
│   ├── main.py             # Punto de entrada FastAPI: responde en / y /health
│   ├── settings.py         # Configuración (pydantic-settings)
│   ├── routers/            # Endpoints (por ahora, /health)
│   ├── schemas/            # Modelos de Pydantic
│   └── services/           # Un módulo por tema: los services de M1, M2 y M3, para completar
├── tests/                  # test_placeholder.py pasa; los de M1-M3 quedan como xfail hasta implementarlos
├── docs/                   # Evidencia de validación (gráficos, capturas)
├── data/
└── .github/workflows/ci.yml   # Lint + tests en cada push
```

Si `http://localhost:8000/health` responde `200 OK` y `pytest` termina sin fallas (los tests de M1 a M3 aparecen como `xfailed` hasta que implementen cada función), la estructura está lista. El paso a paso completo está en el README del template.

#### Completar el README

El template trae un `README.md` base con estas secciones; complétenlo:

- **Nombre del proyecto** y descripción breve (1-2 párrafos).
- **Integrantes del grupo** con nombre completo, legajo y rol (por ejemplo: generación de señales, procesamiento, testing/CI, documentación).
- **Instrucciones de instalación**: cómo clonar, instalar dependencias y ejecutar. Tienen que funcionar copiando y pegando los comandos.
- **Estructura del proyecto**: el árbol de carpetas de arriba, con una línea por carpeta.

En el mismo README va el diagrama del paso siguiente.

### 3. Diagrama de arquitectura

Con la estructura en su lugar, el diagrama explica **cómo se van a llenar esas carpetas**. Es el **plano de la API**: muestra qué capas tiene, qué archivos hay en cada carpeta, qué hace cada uno y por dónde viaja un pedido. Este es el de la API completa, con los mismos nombres que la implementación de referencia. Usá los botones para ver cómo se va armando milestone a milestone y el recorrido de un análisis de punta a punta.

<div class="arq">
<div class="arq-controles" role="group" aria-label="Qué mostrar"><span>Ver la API al terminar:</span><button type="button" data-ver="0">M0</button><button type="button" data-ver="1">M1</button><button type="button" data-ver="2">M2</button><button type="button" data-ver="3" aria-pressed="true">M3 (completa)</button><button type="button" data-ver="recorrido">Recorrido de un análisis</button></div>
<p class="arq-leyenda" aria-live="polite"></p>
<div class="arq-colores"><span data-m="0">M0 · El plano</span><span data-m="1">M1 · Generación</span><span data-m="2">M2 · Procesamiento</span><span data-m="3">M3 · Producto final</span></div>
<div class="arq-capa arq-capa--cliente"><div class="arq-capa__nombre"><strong>Cliente</strong><span>quien usa la API</span></div><div class="arq-capa__contenido"><span class="arq-chip" data-m="0">Swagger (/docs)</span><span class="arq-chip" data-m="0">frontend o script</span><span class="arq-chip" data-m="3" data-paso="1" data-explica="El cliente sube la respuesta al impulso grabada (un WAV) a POST /api/v1/acoustics/parameters.">sube un WAV</span><span class="arq-chip" data-m="3" data-paso="10" data-explica="El cliente recibe el JSON con EDT, T20, T30, D50 y C80 por banda, y los muestra.">recibe el JSON</span></div></div>
<div class="arq-flecha"><span>↓ request HTTP (datos en JSON o un archivo) &nbsp;·&nbsp; ↑ respuesta en JSON</span></div>
<div class="arq-capa"><div class="arq-capa__nombre"><strong>Routers</strong><span>app/routers/ · reciben y responden</span></div><div class="arq-capa__contenido"><div class="arq-archivo"><span class="arq-archivo__nombre">health.py</span><span class="arq-chip" data-m="0"><code>GET /health</code></span></div><div class="arq-archivo"><span class="arq-archivo__nombre">signals.py</span><span class="arq-chip" data-m="1"><code>POST /signals/pink-noise</code></span><span class="arq-chip" data-m="1"><code>POST /signals/sine-sweep/pair</code></span><span class="arq-chip" data-m="2"><code>POST /signals/synthetic-ir</code></span><span class="arq-chip" data-m="2"><code>POST /signals/convolve</code></span></div><div class="arq-archivo"><span class="arq-archivo__nombre">filters.py</span><span class="arq-chip" data-m="2"><code>POST /filters/single-band</code></span></div><div class="arq-archivo"><span class="arq-archivo__nombre">utils.py</span><span class="arq-chip" data-m="2"><code>POST /utils/log-scale</code></span><span class="arq-chip" data-m="3"><code>POST /utils/smoothing</code></span><span class="arq-chip" data-m="3"><code>POST /utils/schroeder</code></span><span class="arq-chip" data-m="3"><code>POST /utils/lundeby</code></span></div><div class="arq-archivo"><span class="arq-archivo__nombre">acoustics.py</span><span class="arq-chip" data-m="3" data-paso="2" data-explica="El router de acoustics.py recibe el archivo; no calcula nada: llama a los services en orden."><code>POST /acoustics/parameters</code></span></div></div></div>
<div class="arq-flecha"><span>↓ validan los datos con</span></div>
<div class="arq-capa"><div class="arq-capa__nombre"><strong>Schemas</strong><span>app/schemas/ · validan qué entra y qué sale</span></div><div class="arq-capa__contenido"><div class="arq-archivo"><span class="arq-archivo__nombre">responses.py</span><span class="arq-chip" data-m="0"><code>HealthResponse</code></span><span class="arq-chip" data-m="3" data-paso="9" data-explica="El router arma la respuesta con el schema BandAnalysisResponse: Pydantic valida que el JSON tenga la forma prometida."><code>BandAnalysisResponse</code></span></div><div class="arq-archivo"><span class="arq-archivo__nombre">signals.py</span><span class="arq-chip" data-m="1"><code>PinkNoiseRequest</code></span><span class="arq-chip" data-m="1"><code>SineSweepRequest</code></span><span class="arq-chip" data-m="2"><code>SyntheticIRRequest</code></span><span class="arq-chip" data-m="2"><code>ConvolveRequest</code></span></div><div class="arq-archivo"><span class="arq-archivo__nombre">utils.py</span><span class="arq-chip" data-m="2"><code>LogScaleResponse</code></span><span class="arq-chip" data-m="3"><code>SmoothingRequest</code></span><span class="arq-chip" data-m="3"><code>SchroederResponse</code></span><span class="arq-chip" data-m="3"><code>LundebyResponse</code></span></div></div></div>
<div class="arq-flecha"><span>↓ llaman a la función que hace el cálculo</span></div>
<div class="arq-capa"><div class="arq-capa__nombre"><strong>Services</strong><span>app/services/ · el procesamiento de señales</span></div><div class="arq-capa__contenido"><div class="arq-archivo"><span class="arq-archivo__nombre">pink_noise.py</span><span class="arq-chip" data-m="1"><code>generate_pink_noise</code></span></div><div class="arq-archivo"><span class="arq-archivo__nombre">sine_sweep.py</span><span class="arq-chip" data-m="1"><code>generate_sine_sweep_pair</code></span></div><div class="arq-archivo"><span class="arq-archivo__nombre">audio_io.py</span><span class="arq-chip" data-m="1"><code>play_and_record</code></span></div><div class="arq-archivo"><span class="arq-archivo__nombre">signal_utils.py</span><span class="arq-chip" data-m="2" data-paso="3" data-explica="load_audio lee el WAV y lo convierte en un arreglo de NumPy (mono, normalizado)."><code>load_audio</code></span><span class="arq-chip" data-m="2"><code>generate_synthetic_ir</code></span><span class="arq-chip" data-m="2"><code>get_impulse_response</code></span><span class="arq-chip" data-m="2"><code>logarithmic_scale_conversion</code></span></div><div class="arq-archivo"><span class="arq-archivo__nombre">filter.py</span><span class="arq-chip" data-m="2" data-paso="4" data-explica="filter_single_band separa la RI en bandas de octava; el router lo repite para cada banda."><code>filter_single_band</code></span></div><div class="arq-archivo"><span class="arq-archivo__nombre">acoustic_parameters.py</span><span class="arq-chip" data-m="3" data-paso="5" data-explica="apply_smoothing obtiene la envolvente de la RI de cada banda."><code>apply_smoothing</code></span><span class="arq-chip" data-m="3" data-paso="6" data-explica="apply_schroeder_integral calcula la curva de caída de cada banda."><code>apply_schroeder_integral</code></span><span class="arq-chip" data-m="3" data-paso="7" data-explica="linear_regression ajusta la recta de la caída: de su pendiente salen EDT, T20 y T30."><code>linear_regression</code></span><span class="arq-chip" data-m="3" data-paso="8" data-explica="calculate_parameters_from_ir junta todo y calcula también D50 y C80."><code>calculate_parameters_from_ir</code></span><span class="arq-chip" data-m="3"><code>apply_lundeby</code></span></div></div></div>
<div class="arq-flecha"><span>↓ usan</span></div>
<div class="arq-capa arq-capa--libs"><div class="arq-capa__nombre"><strong>Librerías</strong><span>lo que usa cada capa</span></div><div class="arq-capa__contenido"><span class="arq-chip" data-m="0">FastAPI</span><span class="arq-chip" data-m="0">Pydantic</span><span class="arq-chip" data-m="1">NumPy</span><span class="arq-chip" data-m="1">SciPy</span><span class="arq-chip" data-m="1">sounddevice</span><span class="arq-chip" data-m="2">soundfile</span></div></div>
<ol class="arq-pasos" hidden></ol>
</div>

**Cómo leerlo:**

- **De arriba hacia abajo va el pedido**, de abajo hacia arriba vuelve la respuesta. Cada capa solo habla con la de al lado: el cliente nunca llama a un service directamente.
- **Cada caja gris es un archivo** de su carpeta. Adentro, sus endpoints, schemas o funciones.
- **Los colores son los milestones.** En M0 se dibuja **todo** el plano, aunque solo exista `/health`: el diagrama es el mapa de lo que van a construir, no de lo que ya hicieron.

**Así lo arrancan en su README.** Este ejemplo tiene M1 completo y M2 y M3 como cajas punteadas. Copien el código y reemplacen cada caja punteada por los archivos y funciones que correspondan, siguiendo el diagrama de arriba. GitHub dibuja Mermaid solo, dentro del README.

=== "Diagrama"

    ```mermaid
    flowchart TB
        C["Cliente<br/>Swagger · frontend · script"]
        subgraph API["RIR-API (FastAPI)"]
            direction TB
            subgraph R["app/routers/"]
                RH["health.py<br/>GET /health"]
                RS["signals.py<br/>POST /signals/pink-noise<br/>POST /signals/sine-sweep/pair"]
                RM2["M2: /signals/convolve, /filters/single-band, ..."]
                RM3["M3: /acoustics/parameters, ..."]
            end
            subgraph SC["app/schemas/"]
                SS["signals.py<br/>PinkNoiseRequest<br/>SineSweepRequest"]
                SM["M2 y M3: ..."]
            end
            subgraph SV["app/services/"]
                PN["pink_noise.py<br/>generate_pink_noise"]
                SW["sine_sweep.py<br/>generate_sine_sweep_pair"]
                IO["audio_io.py<br/>play_and_record"]
                VM2["M2: signal_utils.py, filter.py"]
                VM3["M3: acoustic_parameters.py"]
            end
        end
        L["NumPy · SciPy · sounddevice"]
        C -->|"request HTTP + JSON"| RS
        RS -->|"valida con"| SS
        RS -->|"llama a"| PN
        RS -->|"llama a"| SW
        PN --> L
        SW --> L
        IO --> L
        classDef pendiente stroke-dasharray: 5 5
        class RM2,RM3,SM,VM2,VM3 pendiente
    ```

=== "Código para copiar"

    ````markdown
    ```mermaid
    flowchart TB
        C["Cliente<br/>Swagger · frontend · script"]
        subgraph API["RIR-API (FastAPI)"]
            direction TB
            subgraph R["app/routers/"]
                RH["health.py<br/>GET /health"]
                RS["signals.py<br/>POST /signals/pink-noise<br/>POST /signals/sine-sweep/pair"]
                RM2["M2: /signals/convolve, /filters/single-band, ..."]
                RM3["M3: /acoustics/parameters, ..."]
            end
            subgraph SC["app/schemas/"]
                SS["signals.py<br/>PinkNoiseRequest<br/>SineSweepRequest"]
                SM["M2 y M3: ..."]
            end
            subgraph SV["app/services/"]
                PN["pink_noise.py<br/>generate_pink_noise"]
                SW["sine_sweep.py<br/>generate_sine_sweep_pair"]
                IO["audio_io.py<br/>play_and_record"]
                VM2["M2: signal_utils.py, filter.py"]
                VM3["M3: acoustic_parameters.py"]
            end
        end
        L["NumPy · SciPy · sounddevice"]
        C -->|"request HTTP + JSON"| RS
        RS -->|"valida con"| SS
        RS -->|"llama a"| PN
        RS -->|"llama a"| SW
        PN --> L
        SW --> L
        IO --> L
        classDef pendiente stroke-dasharray: 5 5
        class RM2,RM3,SM,VM2,VM3 pendiente
    ```
    ````

Si prefieren dibujarlo a mano, pueden usar **draw.io**, exportarlo a PNG e incluirlo en el README. Sea cual sea la herramienta, el diagrama de M0 tiene que mostrar:

- **Las tres capas** (routers, schemas y services) y el cliente.
- **Todos los archivos de M1, M2 y M3** con sus funciones (están en las especificaciones de [M1](m1_generacion.md), [M2](m2_procesamiento.md) y [M3](m3_producto_final.md)).
- **El flujo de datos:** request HTTP → validación con Pydantic → service → respuesta.
- **Entradas y salidas del sistema completo:** del archivo de audio a los parámetros acústicos.
- **Las dependencias externas** relevantes (FastAPI, NumPy, SciPy, Pydantic, sounddevice).

### 4. GitHub Issues

El diagrama dice **qué** hay que construir; los issues lo convierten en **tareas con dueño**. Crear al menos **10 issues** en el repositorio de GitHub, cada uno con:

- **Título descriptivo**: por ejemplo, "Implementar generación de ruido rosa con algoritmo Voss-McCartney".
- **Descripción** con los requisitos funcionales y criterios de aceptación.
- **Labels** que indiquen el milestone correspondiente: `milestone-1`, `milestone-2`, `milestone-3`.
- **Asignación** a uno o más integrantes del grupo.
- **Estimación** de complejidad (opcional pero recomendada): labels como `complejidad-baja`, `complejidad-media`, `complejidad-alta`.

| Malo | Bueno |
|------|-------|
| "Hacer M1": demasiado grande, nadie sabe qué entra ni cuándo está listo. | "Implementar `generate_pink_noise` con Voss-McCartney". Criterios: recibe `(duration, fs)` y devuelve `np.ndarray`; el espectro cae ~3 dB/octava; tiene un test unitario. Labels `milestone-1`, `complejidad-media`, asignado. |

**Regla de oro:** un issue es algo que una persona puede terminar en una sesión de trabajo.

### 5. Branching strategy

Con las tareas repartidas, falta acordar **cómo trabajan sobre el mismo código sin pisarse**. Documéntenlo en el README o en un archivo `CONTRIBUTING.md`:

- Rama `main` protegida: solo se modifica con un merge vía pull request.
- Una rama por issue, con convención de nombres: `feature/nombre-descriptivo`.
- Convención de commits (recomendada: [Conventional Commits](https://www.conventionalcommits.org/)).

La [guía de Git](../../guias/git_basico.md) explica el flujo `main` + feature + pull request.

## Cómo entregar M0

El miércoles 7 de octubre no hay clase. Antes del final del día, cada grupo publica en Slack **un único mensaje** con:

1. El **link al repositorio** (con los docentes ya agregados como colaboradores).
2. Una **captura** de `http://localhost:8000/health` respondiendo, o del CI en verde.
3. Los **integrantes** y el rol de cada uno.

El feedback llega en el hilo de ese mensaje. Si algo no les anda, pregunten antes en Slack, en hilos (ver las [reglas](../../reglas_slack.md)).

## Checklist de entrega

En el mismo orden que los pasos:

- [ ] **1.** Repositorio creado, con los docentes (@maxiyommi y @jero-scafati) como colaboradores
- [ ] **2.** Estructura del template copiada y en `main`
- [ ] **2.** `uv run uvicorn app.main:app --reload` levanta la API y `/health` responde
- [ ] **2.** `pytest` termina sin fallas
- [ ] **2.** README completo: integrantes y roles, instalación que funciona, estructura
- [ ] **3.** Diagrama de arquitectura en el README, con todos los archivos de M1, M2 y M3
- [ ] **4.** Al menos 10 issues con labels y asignaciones
- [ ] **5.** Branching strategy documentada
- [ ] Mensaje de entrega publicado en Slack

## Recursos recomendados

- [API de referencia de la cátedra (Swagger UI)](https://rir-api.onrender.com/docs)
- [FastAPI: documentación oficial](https://fastapi.tiangolo.com/)
- [Pydantic: validación de datos](https://docs.pydantic.dev/)
- [uv: gestor de paquetes rápido para Python](https://docs.astral.sh/uv/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Mermaid: diagramas en Markdown](https://mermaid.js.org/)
- [GitHub Issues: documentación](https://docs.github.com/en/issues)
