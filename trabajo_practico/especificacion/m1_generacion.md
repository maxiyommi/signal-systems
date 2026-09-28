# M1 · Generación de señales

!!! info "Fechas y evaluación"
    - **Presentación de la consigna:** miércoles 14 de octubre 2026
    - **Fecha de entrega:** miércoles 28 de octubre 2026 (en clase)
    - **Tag de versión:** `v0.1.0`
    - **Evaluación:** seguimiento, sin nota (el grupo muestra su avance y recibe feedback por Slack)

## Objetivo

Implementar las funciones de generación de señales de excitación necesarias para mediciones acústicas según ISO 3382, así como la función de reproducción y grabación simultánea. Al finalizar este milestone, el sistema debe ser capaz de generar ruido rosa, sine sweep logarítmico con su filtro inverso, y realizar adquisición de audio en tiempo real.

---

## Del plano al primer cálculo

En M0 dibujaron las tres capas. En M1 le ponen **código real** a una sola de ellas: `services/`.

Los routers no se tocan todavía. Los schemas tampoco. Solo:

- `services/pink_noise.py`
- `services/sine_sweep.py`
- `services/audio_io.py` (reproducir/grabar)

`generar_ruido_rosa` y `generar_sine_sweep` son *funciones puras de DSP*: entra `numpy`, sale `numpy`, y no dependen de HTTP, JSON ni FastAPI. `reproducir_y_grabar` es la única que toca el mundo exterior (la placa de audio), por eso vive en su propio módulo.

!!! note "Por qué importa"
    Una función pura es fácil de testear, se conecta a un endpoint en M3 sin cambios y evita problemas cuando en M2 se combinen funciones.

    **Regla:** la lógica de DSP no depende de HTTP ni de FastAPI. La E/S (archivos, placa de audio) queda en funciones propias, separadas del cálculo.

## Conceptos y figuras

Lo que hay que entender antes de implementar, con los gráficos de la implementación de referencia de la cátedra.

### Función 01 · ruido rosa

<figure class="figura-tp" markdown>
[![PSD del ruido rosa generado con la API de referencia](../img/m1/psd_ruido_rosa.png)](../img/m1/psd_ruido_rosa.png)
<figcaption markdown="span">PSD medida (Welch) vs. teórico -3 dB/oct · pendiente medida sobre la API de cátedra: -3.02 dB/oct</figcaption>
</figure>

El ruido rosa (también llamado ruido $1/f$) se caracteriza por tener una densidad espectral de potencia inversamente proporcional a la frecuencia: $S(f) = k/f$, donde $k$ es una constante. En escala logarítmica esto corresponde a una caída de **-3 dB/octava** (o equivalentemente, -10 dB/década), porque $\Delta L = 10 \log_{10}(1/2) \approx -3{,}01$ dB.

Algoritmo recomendado **Voss-McCartney**: suma de múltiples generadores de ruido blanco que se actualizan a tasas $2^i$. El generador $i$ se actualiza cuando el bit $i$ del índice $n$ cambia. La suma produce una señal cuyo espectro se aproxima a $1/f$. Alternativa aceptable: ruido blanco filtrado en frecuencia con $H(f) = 1/\sqrt{f}$.

<small>Especificación (m1_generacion) §1 — *Voss, R. F. & Clarke, J. (1978). "1/f noise" in music. JASA 63(1).*</small>

### Función 02 · sine sweep logarítmico

<figure class="figura-tp" markdown>
[![Waveform y espectrograma del sine sweep 20 Hz a 20 kHz](../img/m1/sweep_waveform_spec.png)](../img/m1/sweep_waveform_spec.png)
<figcaption markdown="span">Sweep 20 Hz → 20 kHz, 5 s · línea blanca discontinua = f(t) teórica</figcaption>
</figure>

El sine sweep logarítmico (también llamado exponencial) se define como: $\;x(t) = \sin\!\left[\tfrac{2\pi f_1 T}{\ln(f_2/f_1)}\!\left(e^{t \ln(f_2/f_1)/T} - 1\right)\right]$, con $f_1$ frecuencia inicial, $f_2$ final, $T$ duración total, $0 \leq t \leq T$.

La frecuencia instantánea es $f(t) = f_1 \cdot e^{t \ln(f_2/f_1)/T}$, que crece exponencialmente de $f_1$ a $f_2$. Logarítmico (no lineal) porque buscamos *igual energía por octava* — coincide con la escala de los filtros de bandas IEC 61260 que van a usar en M2.

<small>Especificación (m1_generacion) §2 — *Farina, A. (2000). Simultaneous measurement of impulse response and distortion with a swept-sine technique. 108th AES Convention.*</small>

### Función 02 · filtro inverso

<figure class="figura-tp" markdown>
[![Convolución del sweep con su filtro inverso resultando en un pico tipo impulso](../img/m1/convolucion_impulso.png)](../img/m1/convolucion_impulso.png)
<figcaption markdown="span">Convolución sweep ∗ inverso · pico vs. piso ≈ 98 dB de relación (el test pide ≥ 60 dB)</figcaption>
</figure>

El filtro inverso se obtiene invirtiendo temporalmente el sweep y aplicando una corrección de amplitud que compensa la distribución no uniforme de energía por frecuencia del sweep logarítmico: $\;x_{\text{inv}}(t) = x(T - t) \cdot A(t)$, con envolvente $A(t) = e^{-t \ln(f_2/f_1)/T}$, que decae de 1 a $f_1/f_2$: el sweep invertido termina en las frecuencias bajas, y ahí la envolvente las atenúa ($-6$ dB/octava).

La corrección es necesaria porque el sweep logarítmico permanece **más tiempo en las frecuencias bajas** y concentra más energía allí. El filtro inverso compensa atenuando esa banda. La convolución del sweep con su filtro inverso debe producir un impulso ideal: $\;x(t) * x_{\text{inv}}(t) \approx \delta(t)$. En la práctica, un pulso estrecho con lóbulos laterales pequeños.

<small>Especificación (m1_generacion) §2 (filtro inverso) — *esto es lo que en M2 usan para deconvolucionar la respuesta al impulso de la sala.*</small>

### Reproducir y grabar en simultáneo

!!! note "Backend · `sounddevice`"
    ```python
    import sounddevice as sd
    recorded = sd.playrec(signal, samplerate=fs, channels=1, blocking=True)
    sd.wait()
    ```

    Reproduce y graba a la vez sobre el mismo dispositivo (con una latencia fija, que se compensa con un *pre-roll*: unos milisegundos de silencio al inicio). Documenten en el README la config: dispositivo, canales, fs, buffer size.

!!! note "Detalles que rompen mediciones"
    - **Pre-roll** 0.5-1 s — compensa latencia del driver
    - **Grabación > señal** — capturar la cola de reverberación
    - Manejar **mono y estéreo** sin asumir shape
    - Error **informativo** si no hay device

!!! note "Cliente · cómo se hace lo mismo en el navegador (frontend de cátedra)"
    `sd.playrec()` no existe en el browser. La analogía es la **Web Audio API**:

    - `navigator.mediaDevices.getUserMedia({audio: {sampleRate: {ideal: fs}}})` — permiso + micrófono
    - `new AudioContext({sampleRate})` + `AudioBufferSourceNode` — reproduce la señal de excitación
    - `new MediaRecorder(stream, {mimeType: 'audio/webm;codecs=opus'})` — captura el stream
    - Conversión a WAV en cliente con `OfflineAudioContext` antes de subir al backend
    - `setSinkId()` para elegir salida cuando hay múltiples dispositivos

    **Mismos cuidados**: sample rate explícito, manejo de permisos denegados, latencia entre play y record (acá la introduce el browser, no el driver de audio). Grabar en mono para no duplicar el tamaño del archivo subido al backend.

## Funciones a implementar

### 1. `generar_ruido_rosa(duracion, fs)`

**Firma sugerida:**
```python
def generar_ruido_rosa(duracion: float, fs: int) -> np.ndarray:
    """
    Genera ruido rosa utilizando el algoritmo Voss-McCartney.

    Parameters
    ----------
    duracion : float
        Duracion de la senal en segundos.
    fs : int
        Frecuencia de muestreo en Hz.

    Returns
    -------
    np.ndarray
        Array con la senal de ruido rosa normalizada entre -1 y 1.
    """
```

**Fundamento matemático:**

El ruido rosa (también llamado ruido $1/f$) se caracteriza por tener una densidad espectral de potencia inversamente proporcional a la frecuencia:

$$S(f) = \frac{k}{f}$$

donde $k$ es una constante. En escala logarítmica, esto corresponde a una caída de **-3 dB/octava** (o equivalentemente, -10 dB/decada).

La relación en decibeles entre dos frecuencias separadas por una octava ($f_2 = 2 f_1$) es:

$$\Delta L = 10 \log_{10}\left(\frac{S(f_2)}{S(f_1)}\right) = 10 \log_{10}\left(\frac{f_1}{f_2}\right) = 10 \log_{10}\left(\frac{1}{2}\right) \approx -3.01 \text{ dB}$$

**Algoritmo Voss-McCartney:**

El algoritmo genera ruido rosa mediante la suma de múltiples generadores de ruido blanco que se actualizan a diferentes tasas. Cada generador $i$ se actualiza cada $2^i$ muestras. La suma de todos los generadores produce una señal cuyo espectro se aproxima a $1/f$.

El procedimiento es:

1. Definir $N_{bits}$ generadores de ruido blanco (típicamente 16-20).
2. Para cada muestra $n$, determinar cuales generadores deben actualizarse. El generador $i$ se actualiza cuando el bit $i$ de $n$ cambia respecto a $n-1$.
3. Sumar las salidas de todos los generadores.
4. Normalizar la señal resultante.

**Alternativa aceptable:** También se acepta la generación en el dominio frecuencial, creando ruido blanco y aplicando un filtro con respuesta $H(f) = 1/\sqrt{f}$:

$$X_{rosa}(f) = X_{blanco}(f) \cdot \frac{1}{\sqrt{f}}$$

**Referencia:** Voss, R. F., & Clarke, J. (1978). "1/f noise" in music: Music from 1/f noise. *Journal of the Acoustical Society of América*, 63(1), 258-263.

---

### 2. `generar_sine_sweep(f1, f2, duracion, fs)`

**Firma sugerida:**
```python
def generar_sine_sweep(
    f1: float, f2: float, duracion: float, fs: int
) -> tuple[np.ndarray, np.ndarray]:
    """
    Genera un sine sweep logaritmico y su filtro inverso.

    Parameters
    ----------
    f1 : float
        Frecuencia inicial en Hz.
    f2 : float
        Frecuencia final en Hz.
    duracion : float
        Duracion del sweep en segundos.
    fs : int
        Frecuencia de muestreo en Hz.

    Returns
    -------
    tuple[np.ndarray, np.ndarray]
        Tupla con (sweep, filtro_inverso), ambos normalizados.
    """
```

**Fundamento matemático:**

El sine sweep logarítmico (también llamado exponencial) se define como:

$$x(t) = \sin\left[\frac{2\pi f_1 T}{\ln(f_2/f_1)} \left(e^{t \ln(f_2/f_1)/T} - 1\right)\right]$$

donde:
- $f_1$ es la frecuencia inicial (Hz)
- $f_2$ es la frecuencia final (Hz)
- $T$ es la duración total del sweep (s)
- $t$ es el tiempo, con $0 \leq t \leq T$

La frecuencia instantanea del sweep en el instante $t$ es:

$$f(t) = f_1 \cdot e^{t \ln(f_2/f_1)/T}$$

que crece exponencialmente de $f_1$ a $f_2$.

**Filtro inverso:**

El filtro inverso se obtiene invirtiendo temporalmente el sweep y aplicando una corrección de amplitud que compensa la distribución no uniforme de energía por frecuencia del sweep logarítmico:

$$x_{inv}(t) = x(T - t) \cdot A(t)$$

donde la envolvente de amplitud es:

$$A(t) = e^{-t \ln(f_2/f_1)/T}$$

Esta corrección es necesaria porque el sweep logarítmico permanece más tiempo en las frecuencias bajas, concentrando más energía allí. Como el sweep invertido recorre las frecuencias de $f_2$ a $f_1$, multiplicarlo por $A(t)$ (que decae de 1 a $f_1/f_2$) atenúa las bajas frecuencias en $-6$ dB/octava y el producto $X(f)\,X_{inv}(f)$ queda plano.

!!! warning "Multiplicar, no dividir"
    Dividir por $A(t)$ refuerza los graves en lugar de atenuarlos: la convolución sale inclinada unos ±40 dB entre 100 Hz y 10 kHz. Con la corrección bien aplicada, la implementación de referencia obtiene un pico ~98 dB por encima del resto.

La convolución del sweep con su filtro inverso debe producir un impulso (delta de Dirac) ideal:

$$x(t) * x_{inv}(t) \approx \delta(t)$$

En la práctica, el resultado será un pulso estrecho con lóbulos laterales pequeños.

**Referencia:** Farina, A. (2000). "Simultaneous measurement of impulse response and distortion with a swept-sine technique." *108th AES Convention*.

---

### 3. `reproducir_y_grabar(signal, fs, duracion_grabacion)`

**Firma sugerida:**
```python
def reproducir_y_grabar(
    signal: np.ndarray, fs: int, duracion_grabacion: float
) -> np.ndarray:
    """
    Reproduce una senal y graba simultaneamente.

    Parameters
    ----------
    signal : np.ndarray
        Senal a reproducir.
    fs : int
        Frecuencia de muestreo en Hz.
    duracion_grabacion : float
        Duracion total de la grabacion en segundos.
        Debe ser >= duracion de la senal para capturar la reverberacion.

    Returns
    -------
    np.ndarray
        Array con la senal grabada.
    """
```

**Consideraciones técnicas:**

- Utilizar la librería `sounddevice` con la función `sd.playrec()` para reproducción y grabación simultánea.
- La `duracion_grabacion` debe ser mayor que la duración de la señal reproducida para capturar la cola de reverberación del recinto.
- La función debe manejar correctamente señales mono y estéreo.
- Se recomienda agregar un silencio inicial (pre-roll) de 0.5-1 s antes de la señal para compensar latencia del sistema de audio.
- La función debe verificar que los dispositivos de audio están disponibles y manejar errores de manera informativa.

**Nota sobre la configuración de audio:** Cada grupo deberá documentar en el README la configuración de su interfaz de audio (dispositivo, canales, frecuencia de muestreo soportada, buffer size).

---

## Tests requeridos

Todos los tests deben estar en el directorio `tests/` y ejecutarse con `pytest`.

### Test 1: Espectro del ruido rosa

```python
def test_ruido_rosa_espectro():
    """
    Verificar que el espectro del ruido rosa tiene una pendiente
    de aproximadamente -3 dB/octava.
    """
```

**Procedimiento:**
1. Generar ruido rosa de al menos 10 segundos a 44100 Hz.
2. Calcular la PSD (Power Spectral Density) usando el método de Welch (`scipy.signal.welch`).
3. Calcular la pendiente en dB/octava entre 100 Hz y 10000 Hz.
4. Verificar que la pendiente está entre -4 dB/octava y -2 dB/octava (tolerancia de 1 dB/octava respecto al valor teórico de -3 dB/octava).

### Test 2: Rango de frecuencias del sine sweep

```python
def test_sine_sweep_rango_frecuencias():
    """
    Verificar que el sine sweep cubre el rango de frecuencias
    especificado de f1 a f2.
    """
```

**Procedimiento:**
1. Generar un sweep de 20 Hz a 20000 Hz de 5 segundos a 44100 Hz.
2. Calcular el espectrograma de la señal.
3. Verificar que hay energía significativa en las frecuencias inicial y final.
4. Verificar que la frecuencia instantanea crece monótonamente.

### Test 3: Convolución sweep * filtro inverso

```python
def test_sweep_convolucion_impulso():
    """
    Verificar que la convolucion del sweep con su filtro inverso
    produce una aproximacion a un impulso.
    """
```

**Procedimiento:**
1. Generar sweep y filtro inverso.
2. Calcular la convolución (preferiblemente vía FFT con `scipy.signal.fftconvolve`).
3. Encontrar el pico máximo de la señal resultante.
4. Verificar que la energía del pico es al menos **60 dB** superior a la energía promedio del resto de la señal (excluyendo una ventana alrededor del pico). Con el filtro inverso correcto se obtienen ~98 dB; un inverso mal corregido queda por debajo de 60 dB.

### Test 4: Reproducción y grabación

```python
def test_reproducir_y_grabar_forma():
    """
    Verificar que la funcion maneja correctamente senales mono y estereo.
    """
```

**Procedimiento:**
1. Verificar que la función acepta arrays 1D (mono) y 2D (estéreo).
2. Verificar que la grabación tiene la duración esperada (número de muestras = `duracion_grabacion * fs`, con tolerancia del 1%).
3. Verificar que la función lanza una excepción informativa si no hay dispositivo de audio disponible.

**Nota:** Este test puede requerir un mock del dispositivo de audio para ejecutarse en CI. Documentar como ejecutarlo localmente.

---

## Validación

Además de los tests automatizados, cada grupo debe realizar las siguientes validaciones manuales:

1. **Comparación espectral con Audacity o REW:**
   - Exportar el ruido rosa generado a WAV y abrirlo en Audacity.
   - Analizar el espectro y verificar visualmente la pendiente de -3 dB/octava.
   - Repetir para el sine sweep: verificar que el espectrograma muestra un barrido logarítmico de $f_1$ a $f_2$.

2. **Verificación de la convolución:**
   - Graficar el resultado de la convolución sweep * filtro inverso.
   - El resultado debe parecerse a un impulso con lóbulos laterales mínimos.
   - Guardar esta gráfica en `docs/m1/` y enlazarla desde el README.

3. **Prueba de reproducción y grabación:**
   - Realizar una prueba real con un parlante y un micrófono (puede ser con la PC).
   - Verificar que la señal grabada contiene la señal reproducida.

Incluir capturas de pantalla o gráficas de todas las validaciones en la documentación del milestone.

---

## Calidad de código

- **Docstrings**: todas las funciones públicas deben tener docstrings en formato NumPy.
- **Type hints**: todas las funciones deben tener anotaciones de tipos en parámetros y retorno.
- **PEP 8**: el código debe pasar `ruff check` sin errores.
- **Commits**: usar commits descriptivos y frecuentes. Se revisa el historial de Git (en M3 forma parte de la nota, criterio "Prácticas Git").
- **Pull requests**: cada función debe desarrollarse en una rama separada y mergearse vía PR con al menos una revisión de otro integrante.
- **Tag**: al completar el milestone, crear el tag `v0.1.0` en la rama `main`.

---

## Guía de entrega

### Evidencia en el repositorio

Además de los tests automatizados, cada grupo entrega evidencia visual:

- Espectro del ruido rosa abierto en **Audacity** o REW, con la pendiente visible
- Espectrograma del sweep mostrando el barrido $f_1 \to f_2$
- Gráfica de la convolución sweep ∗ inverso (debe parecer un impulso)
- Prueba real con parlante + micrófono (puede ser la PC)

Las capturas o PNG van en `docs/m1/` del repo y se enlazan desde el README.

!!! note "Referencia visual"
    Comparen contra los gráficos de las funciones 01 y 02 de esta página. Las pendientes y SNRs deberían estar en el mismo orden.

    - Ruido rosa: -3 ± 1 dB/oct
    - Sweep: barrido monótono visible
    - Convolución: pico claro > 60 dB sobre el piso

    Si su resultado se ve muy distinto a las imágenes de cátedra, hay un bug — empiecen por ahí.

### Buenas prácticas que ya vimos funcionar

Patrones aplicados en la API de cátedra. No los pide la rúbrica — pero les ahorran trabajo en M2 y M3.

!!! note "01 · Metadatos en el router, no en el service"
    La función devuelve el array (así lo piden la firma y los tests). En M3, el endpoint arma la respuesta JSON con `sample_rate`, `num_samples`, `max_amplitude`, etc., sin tocar el service.

!!! note "02 · Normalizar al 90% del máximo"
    `signal = signal / max(|signal|) * 0.9`  
    Deja margen (*headroom*) para evitar saturación al guardar el WAV o reproducir.

!!! note "03 · Descartar el transitorio si filtran ruido blanco"
    Si generan el ruido rosa filtrando ruido blanco con un filtro IIR (`scipy.signal.lfilter`), generen `N + N_trans` muestras y eliminen las primeras `N_trans`: los primeros milisegundos salen con el transitorio del filtro.

!!! note "04 · Generación ≠ Plotting"
    `pink_noise.py` genera. `signal_utils.py` grafica. Funciones distintas, archivos distintos. Si mañana cambian el plot, no rompen el generador.

!!! note "05 · Guardar WAV fuera del service"
    Si en M3 un endpoint devuelve un WAV, que lo escriba el router en un archivo temporal (`tempfile`), no en la carpeta de trabajo: los tests no ensucian el repo.

!!! note "06 · Dos implementaciones, mismo test"
    Voss-McCartney y el filtrado de ruido blanco son válidos. El test es el contrato, no la implementación. Esto les da margen de optimizar después sin romper nada.

### Lo que mira el docente

**Código**

- [ ] Docstrings NumPy en toda función pública
- [ ] Type hints en parámetros y retorno
- [ ] Tests en `tests/` que pasen al correr `pytest -v`
- [ ] Imports limpios, sin código muerto

**Git**

- [ ] Cada función en una rama propia
- [ ] Merge a `main` vía PR con review de otro integrante
- [ ] Historial coherente (no un commit gigante "M1")
- [ ] Tag `v0.1.0` anotado y empujado al remote

!!! note "Recordatorio · cómo correr los tests"
    ```bash
    # desde la raiz del repo
    uv sync                              # asegurar dependencias instaladas
    uv run pytest -v                     # correr todos los tests con output verboso
    uv run pytest -v tests/test_generacion.py  # correr solo un archivo
    uv run pytest -v -k "ruido_rosa"     # correr tests que matchean el nombre
    ```

    `-v` (verbose) muestra cada test con su nombre y si pasó; sin `-v` solo ven puntos. `-k` filtra tests por substring del nombre — útil para correr solo lo que están tocando. Si un test falla, `pytest --pdb` abre el debugger en el punto exacto de la falla, y `pytest -x` detiene la corrida en el primer fallo.

### Checklist de entrega

Lo que tiene que estar en el tag `v0.1.0` el 28/10.

- [ ] `generar_ruido_rosa` con test pasando
- [ ] `generar_sine_sweep` + filtro inverso con tests pasando
- [ ] `reproducir_y_grabar` con test de forma
- [ ] Las gráficas y la evidencia de validación en `docs/m1/`, enlazadas desde el README
- [ ] `pytest -v` en verde — los 4 tests requeridos
- [ ] Docstrings y type hints en las 3 funciones públicas
- [ ] PRs mergeados, no commits directos a `main`
- [ ] Tag `v0.1.0` anotado y empujado al remote


## Recursos

- [sounddevice: documentación](https://python-sounddevice.readthedocs.io/)
- [scipy.signal.welch](https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.welch.html)
- [Farina, A. (2000) - Swept-sine technique (PDF)](https://www.angelofarina.it/Public/Papers/134-AES00.PDF)
- [Voss-McCartney algorithm](https://www.firstpr.com.au/dsp/pink-noise/)
- [Audacity: análisis espectral](https://manual.audacityteam.org/man/plot_spectrum.html)
