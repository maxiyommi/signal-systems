# M1 · Generación de señales

!!! info "Fechas y evaluación"
    - **Presentación de la consigna:** miércoles 14 de octubre 2026
    - **Fecha de entrega:** miércoles 28 de octubre 2026 (en clase)
    - **Tag de versión:** `v0.1.0`
    - **Evaluación:** seguimiento, sin nota (el grupo muestra su avance y recibe feedback por Slack)

## Objetivo

Implementar los **servicios de generación** de señales de excitación que necesita una medición acústica según ISO 3382, y el servicio que reproduce y graba en simultáneo. Al terminar este milestone, la API sabe generar ruido rosa y un sine sweep logarítmico con su filtro inverso, y adquirir audio en tiempo real.

---

## En el plano de la API

Es el mismo diagrama que dibujaron en M0, ahora **parado en M1**: al verlo se encienden los recuadros de este milestone. Son solo **services** (y las librerías que usan); los endpoints de generación se agregan en M3, por eso siguen punteados. Tocá cualquier recuadro para ver su estructura básica, o M0, M2 y M3 para ver de dónde vienen y adónde van.

<div class="arq-marco" data-inicial="1">
--8<-- "arquitectura.html"
</div>

---

## Del plano al primer cálculo

En M0 dibujaron las tres capas. En M1 le ponen **código real** a una sola: los **servicios** (`app/services/`). Son las funciones que después la API va a exponer como endpoints: cada una hace un cálculo, recibe NumPy y devuelve NumPy, sin saber nada de HTTP ni de JSON.

M1 son **tres servicios**. Cada uno se presenta igual:

1. **Qué es:** el concepto de Señales y Sistemas detrás.
2. **Probalo:** generalo, escuchalo y miralo acá mismo, con el mismo algoritmo que la API de referencia.
3. **El código, archivo por archivo:** el service que implementan, el test que lo verifica y cómo lo va a exponer la API en M3.

Dónde va cada cosa en el repositorio:

```text
rir-api/
├── app/
│   ├── services/
│   │   ├── pink_noise.py     ← Servicio 1 · generate_pink_noise          (M1)
│   │   ├── sine_sweep.py     ← Servicio 2 · generate_sine_sweep_pair     (M1)
│   │   └── audio_io.py       ← Servicio 3 · play_and_record              (M1)
│   ├── schemas/signals.py    ← qué datos recibe cada endpoint            (M3)
│   └── routers/signals.py    ← los endpoints /api/v1/signals/...         (M3)
└── tests/
    └── test_generacion.py    ← los tests de los tres servicios           (M1)
```

El template ya trae los tres archivos de `services/` con la firma y el docstring, y los tests escritos: su trabajo es reemplazar el `raise NotImplementedError` por la implementación hasta que los tests pasen.

!!! note "Por qué importa"
    Un servicio es una **función pura**: con los mismos datos devuelve siempre lo mismo. Es fácil de testear, se conecta a un endpoint en M3 sin cambios, y en M2 se puede combinar con otros servicios sin sorpresas.

    **Regla:** la lógica de DSP no depende de HTTP ni de FastAPI. La entrada y salida (archivos, placa de audio) queda en funciones propias, separadas del cálculo: por eso `play_and_record` vive en su propio archivo.

!!! note "Los nombres coinciden con la API de referencia"
    Los servicios, sus parámetros y los endpoints usan los mismos nombres que la implementación de la cátedra ([Swagger](https://rir-api.onrender.com/docs)): `generate_pink_noise` atiende `POST /api/v1/signals/pink-noise`, `generate_sine_sweep_pair` atiende `POST /api/v1/signals/sine-sweep/pair`. Los nombres van en inglés; la documentación, en español.

---

## Servicio 1 · `generate_pink_noise(duration, fs)`

### Qué es

El **ruido rosa** (o ruido $1/f$) tiene una densidad espectral de potencia inversamente proporcional a la frecuencia:

$$S(f) = \frac{k}{f}$$

Entre dos frecuencias separadas una octava ($f_2 = 2 f_1$) el nivel cae

$$\Delta L = 10 \log_{10}\left(\frac{S(f_2)}{S(f_1)}\right) = 10 \log_{10}\left(\frac{1}{2}\right) \approx -3{,}01 \text{ dB}$$

o sea **−3 dB por octava**. Como cada octava es el doble de ancha que la anterior, la energía **por octava** queda igual en todas: por eso se usa para medir salas, que se analizan por bandas de octava (M2).

Hay dos formas de generarlo, y la API de referencia tiene las dos:

- **Voss-McCartney** (`/pink-noise/voss`): se suman 16 a 20 generadores de ruido blanco; el generador $i$ se renueva cada $2^i$ muestras (cuando cambia el bit $i$ del índice $n$). Los que cambian lento aportan los graves.
- **Filtrado de ruido blanco** (`/pink-noise`): ruido blanco que pasa por un filtro con $|H(f)| \propto 1/\sqrt{f}$, por ejemplo un IIR de tercer orden (`scipy.signal.lfilter`) o en frecuencia con la FFT: $X_{rosa}(f) = X_{blanco}(f) / \sqrt{f}$.

<small>Voss, R. F. & Clarke, J. (1978). "1/f noise" in music: Music from 1/f noise. *JASA*, 63(1), 258-263.</small>

### Probalo

Generá ruido rosa, escuchalo y mirá su espectro: la curva medida tiene que seguir la recta de −3 dB/octava. Probá los dos métodos y distintas duraciones (con más duración, más promedios y una curva más lisa).

<div class="servicio-demo" data-servicio="pink-noise"></div>

### El código, archivo por archivo

=== "Service"

    <span class="ruta-archivo">app/services/pink_noise.py</span>

    ```python
    import numpy as np


    def generate_pink_noise(duration: float, fs: int) -> np.ndarray:
        """Genera una senal de ruido rosa de la duracion especificada.

        Parameters
        ----------
        duration : float
            Duracion de la senal en segundos.
        fs : int
            Frecuencia de muestreo en Hz.

        Returns
        -------
        np.ndarray
            Ruido rosa normalizado entre -1 y 1, de largo int(duration * fs).
        """
        raise NotImplementedError("Implementar en Milestone 1")   # ← acá va su implementación
    ```

    Mismo nombre y orden de argumentos que `generate_pink_noise` de la API de referencia. La de cátedra además acepta `output_path` para escribir el WAV; acá el service **solo devuelve el array** (guardar archivos es tarea del router, en M3).

=== "Test"

    <span class="ruta-archivo">tests/test_generacion.py</span>

    ```python
    def test_pink_noise_spectrum(self):
        """La PSD cae aproximadamente -3 dB/octava entre 100 Hz y 10 kHz."""
        fs = 44100
        ruido = generate_pink_noise(10.0, fs)
        f, pxx = sps.welch(ruido, fs=fs, nperseg=8192)
        banda = (f >= 100) & (f <= 10000)
        # Regresion de nivel (dB) contra octavas (log2 f): la pendiente es dB/octava.
        pendiente = np.polyfit(np.log2(f[banda]), 10 * np.log10(pxx[banda]), 1)[0]
        assert -4.0 <= pendiente <= -2.0, f"pendiente = {pendiente:.2f} dB/oct"
    ```

    Es lo mismo que calcula la demo: la densidad espectral con el método de Welch y la pendiente por regresión. En el mismo archivo están `test_pink_noise_duration`, `test_pink_noise_type` y `test_pink_noise_normalized` (largo, tipo y rango de la señal).

=== "Endpoint (M3)"

    En M1 no se escribe: así lo va a exponer la API en M3. El schema describe el pedido y el router llama al service.

    <span class="ruta-archivo">app/schemas/signals.py</span>

    ```python
    class PinkNoiseRequest(BaseModel):
        duration: float = Field(gt=0, le=60)            # segundos
        sample_rate: int = Field(default=44100, ge=8000, le=192000)
    ```

    <span class="ruta-archivo">app/routers/signals.py</span>

    ```python
    @router.post("/pink-noise")                         # POST /api/v1/signals/pink-noise
    async def pink_noise(req: PinkNoiseRequest):
        audio = generate_pink_noise(req.duration, req.sample_rate)
        return {"duration": req.duration, "sample_rate": req.sample_rate,
                "num_samples": len(audio), "max_amplitude": float(np.max(np.abs(audio)))}
    ```

---

## Servicio 2 · `generate_sine_sweep_pair(duration, f1, f2, fs)`

Devuelve **dos señales**: el sine sweep, que se reproduce en la sala, y su filtro inverso, que en M2 se usa para recuperar la respuesta al impulso.

### Qué es: el sine sweep logarítmico

Un seno cuya frecuencia sube de $f_1$ a $f_2$ en $T$ segundos, de forma exponencial:

$$x(t) = \sin\left[\frac{2\pi f_1 T}{\ln(f_2/f_1)} \left(e^{t \ln(f_2/f_1)/T} - 1\right)\right], \qquad 0 \leq t \leq T$$

Su frecuencia instantánea es

$$f(t) = f_1 \cdot e^{t \ln(f_2/f_1)/T}$$

que tarda **el mismo tiempo en recorrer cada octava**: igual energía por octava, como el ruido rosa y como los filtros de bandas de la IEC 61260 que van a usar en M2.

### Qué es: el filtro inverso

Es el sweep **invertido en el tiempo** y multiplicado por una envolvente de amplitud:

$$x_{inv}(t) = x(T - t) \cdot A(t), \qquad A(t) = e^{-t \ln(f_2/f_1)/T}$$

El sweep pasa más tiempo en los graves (cada octava grave dura lo mismo que una aguda, pero tiene menos ciclos), así que concentra más energía ahí. El sweep invertido recorre de $f_2$ a $f_1$, y $A(t)$, que decae de 1 a $f_1/f_2$, atenúa los graves $-6$ dB/octava para compensar. Resultado: el sweep convolucionado con su filtro inverso da un **impulso**,

$$x(t) * x_{inv}(t) \approx \delta(t)$$

y por eso en M2, convolucionando la grabación de la sala con el filtro inverso, se obtiene la respuesta al impulso de la sala.

!!! warning "Multiplicar, no dividir"
    Dividir por $A(t)$ refuerza los graves en lugar de atenuarlos. Con la corrección bien aplicada, el pico del impulso queda ~90 dB por encima del resto; sin la corrección, ~50 dB; dividiendo, ~35 dB. El test pide 60 dB justamente para detectar estos errores.

<small>Farina, A. (2000). "Simultaneous measurement of impulse response and distortion with a swept-sine technique." *108th AES Convention*.</small>

### Probalo

Cambiá la duración y el rango de frecuencias, escuchá el sweep y su filtro inverso, y mirá tres cosas: el espectrograma (la energía sigue la curva teórica $f(t)$), la forma del filtro inverso (la amplitud baja hacia el final, en los graves) y la convolución de los dos, que da un impulso.

<div class="servicio-demo" data-servicio="sine-sweep"></div>

### El código, archivo por archivo

=== "Service"

    <span class="ruta-archivo">app/services/sine_sweep.py</span>

    ```python
    import numpy as np


    def generate_sine_sweep_pair(
        duration: float, f1: float, f2: float, fs: int
    ) -> tuple[np.ndarray, np.ndarray]:
        """Genera un sine sweep logaritmico y su filtro inverso.

        Parameters
        ----------
        duration : float
            Duracion del sweep en segundos.
        f1, f2 : float
            Frecuencias inicial y final en Hz.
        fs : int
            Frecuencia de muestreo en Hz.

        Returns
        -------
        tuple[np.ndarray, np.ndarray]
            (sweep, inverse_filter), ambos de largo int(duration * fs) y normalizados.
        """
        raise NotImplementedError("Implementar en Milestone 1")   # ← acá va su implementación
    ```

    Mismo nombre y orden de argumentos que `generate_sine_sweep_pair` de la API de referencia, que además define valores por defecto (`f1=20`, `f2=20000`, `fs=44100`). Pueden agregarlos: los tests pasan los cuatro argumentos.

=== "Tests"

    <span class="ruta-archivo">tests/test_generacion.py</span>

    ```python
    def test_sine_sweep_frequency_range(self):
        """El sweep barre de f1 a f2 con frecuencia instantanea creciente."""
        f1, f2, fs = 20.0, 20000.0, 44100
        sweep, _ = generate_sine_sweep_pair(5.0, f1, f2, fs)
        f, _, sxx = sps.spectrogram(sweep, fs=fs, nperseg=4096, noverlap=2048)
        f_pico = f[np.argmax(sxx, axis=0)]           # frecuencia con mas energia en cada instante
        df = f[1] - f[0]
        assert f_pico[0] < 200                        # arranca cerca de f1
        assert f_pico[-1] > 0.75 * f2                 # termina cerca de f2
        assert np.all(np.diff(f_pico) >= -2 * df)     # y siempre sube


    def test_sweep_convolution_impulse(self):
        """sweep * inverse_filter aproxima un impulso (pico >= 60 dB sobre el resto)."""
        fs = 44100
        sweep, inverse_filter = generate_sine_sweep_pair(5.0, 20, 20000, fs)
        impulso = sps.fftconvolve(sweep, inverse_filter)
        energia = impulso**2
        i_pico = int(np.argmax(energia))
        ventana = int(0.01 * fs)                      # se excluyen +-10 ms alrededor del pico
        resto = np.concatenate([energia[: i_pico - ventana], energia[i_pico + ventana :]])
        relacion_db = 10 * np.log10(energia[i_pico] / np.mean(resto))
        assert relacion_db >= 60, f"pico/resto = {relacion_db:.1f} dB"
    ```

    El primero es el espectrograma de la demo; el segundo, la convolución (la demo muestra la misma relación pico/resto). En el mismo archivo están `test_sine_sweep_pair_returns_tuple` y `test_sine_sweep_duration`.

=== "Endpoint (M3)"

    En M1 no se escribe: así lo va a exponer la API en M3.

    <span class="ruta-archivo">app/schemas/signals.py</span>

    ```python
    class SineSweepRequest(BaseModel):
        duration: float = Field(gt=0, le=60)
        start_freq: float = Field(default=20, ge=1, le=20000)
        end_freq: float = Field(default=20000, ge=1, le=22050)
        sample_rate: int = Field(default=44100, ge=8000, le=192000)
    ```

    <span class="ruta-archivo">app/routers/signals.py</span>

    ```python
    @router.post("/sine-sweep/pair")                    # POST /api/v1/signals/sine-sweep/pair
    async def sine_sweep_pair(req: SineSweepRequest):
        sweep, inverse_filter = generate_sine_sweep_pair(
            req.duration, req.start_freq, req.end_freq, req.sample_rate
        )
        return {"sine_sweep": {"num_samples": len(sweep)},
                "inverse_filter": {"num_samples": len(inverse_filter)}}
    ```

---

## Servicio 3 · `play_and_record(signal, fs, record_duration)`

### Qué es

Para medir una sala hay que **reproducir** la señal de excitación (el sweep) por un parlante y **grabar al mismo tiempo** lo que capta el micrófono. En la cadena de medición del [marco conceptual](../marco_conceptual.md#5-la-medicion-es-una-cadena-de-sistemas), este servicio es el tramo PC → DAC → … → ADC → PC.

Con `sounddevice` se hace con una sola función, que reproduce y graba sobre el mismo dispositivo:

```python
import sounddevice as sd
recording = sd.playrec(signal, samplerate=fs, channels=1, blocking=True)
```

Detalles que, si se olvidan, arruinan la medición:

- **Grabar más de lo que dura la señal** (`record_duration` > duración del sweep): después del sweep la sala sigue sonando, y esa cola de reverberación es justamente lo que se quiere medir.
- **Pre-roll:** 0,5 a 1 s de silencio al inicio, para compensar la latencia del driver de audio.
- **Mono y estéreo:** aceptar arrays 1D y 2D sin suponer la forma.
- **Error informativo** (`RuntimeError` con un mensaje claro) si no hay dispositivo de audio.
- Documentar en el README la configuración: dispositivo, canales, frecuencia de muestreo y tamaño de buffer.

Este servicio no tiene demo: necesita su placa de audio. La prueba real (parlante + micrófono, puede ser la PC) es parte de la validación de M1.

!!! note "Cómo lo hace la API de referencia"
    RIR-API no tiene este servicio: en la versión de cátedra la grabación la hace el frontend, en el navegador, con la Web Audio API (`getUserMedia` para el micrófono, `AudioBufferSourceNode` para reproducir, `MediaRecorder` para grabar). Los cuidados son los mismos: frecuencia de muestreo explícita, permisos del micrófono y latencia entre reproducir y grabar. En este TP el servicio vive en el backend y usa `sounddevice`.

### El código, archivo por archivo

=== "Service"

    <span class="ruta-archivo">app/services/audio_io.py</span>

    ```python
    import numpy as np


    def play_and_record(signal: np.ndarray, fs: int, record_duration: float) -> np.ndarray:
        """Reproduce una senal y graba simultaneamente.

        Parameters
        ----------
        signal : np.ndarray
            Senal a reproducir (1D mono o 2D estereo).
        fs : int
            Frecuencia de muestreo en Hz.
        record_duration : float
            Duracion total de la grabacion en segundos (>= duracion de la senal).

        Returns
        -------
        np.ndarray
            La senal grabada, de largo int(record_duration * fs).

        Raises
        ------
        RuntimeError
            Si no hay dispositivo de audio disponible.
        """
        # import sounddevice as sd   (adentro de la funcion: los tests lo reemplazan)
        raise NotImplementedError("Implementar en Milestone 1")   # ← acá va su implementación
    ```

=== "Test"

    <span class="ruta-archivo">tests/test_generacion.py</span>

    ```python
    def test_play_and_record_shape(monkeypatch):
        """Acepta mono y estereo, respeta la duracion y falla informativamente sin dispositivo."""
        fs, record_duration = 44100, 2.0
        esperado = int(record_duration * fs)
        monkeypatch.setitem(sys.modules, "sounddevice", _sounddevice_falso())

        mono = np.zeros(fs)                           # 1 s, array 1D
        estereo = np.zeros((fs, 2))                   # 1 s, array 2D (muestras, canales)
        for senal in (mono, estereo):
            recording = play_and_record(senal, fs, record_duration)
            assert isinstance(recording, np.ndarray)
            assert abs(recording.shape[0] - esperado) <= 0.01 * esperado

        monkeypatch.setitem(sys.modules, "sounddevice", _sounddevice_falso(hay_dispositivo=False))
        with pytest.raises(RuntimeError):
            play_and_record(mono, fs, record_duration)
    ```

    El test **no usa la placa de audio**: reemplaza `sounddevice` por un módulo falso (un *mock*), así corre también en el CI de GitHub, donde no hay parlantes. Por eso el `import sounddevice` va adentro de la función.

=== "Endpoint"

    No tiene endpoint: grabar con la placa de audio del servidor no tiene sentido en una API (el servidor está en un datacenter, no en la sala). La API recibe la grabación ya hecha como archivo, en M2 y M3.

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
    Comparen sus gráficos con las demos de los servicios 1 y 2 de esta página, que usan el algoritmo de la API de referencia. Los valores deberían estar en el mismo orden:

    - Ruido rosa: -3 ± 1 dB/oct
    - Sweep: barrido monótono visible
    - Convolución: pico claro > 60 dB sobre el piso

    Si su resultado se ve muy distinto al de las demos, hay un bug: empiecen por ahí.

### Buenas prácticas que ya vimos funcionar

Patrones aplicados en la API de cátedra. No los pide la rúbrica — pero les ahorran trabajo en M2 y M3.

!!! note "01 · Metadatos en el router, no en el service"
    La función devuelve el array (así lo piden la firma y los tests). En M3, el endpoint arma la respuesta JSON con `sample_rate`, `num_samples`, `max_amplitude`, etc., sin tocar el service.

!!! note "02 · Normalizar al 90% del máximo"
    `signal = signal / max(|signal|) * 0.9`  
    Deja margen (*headroom*) para evitar saturación al guardar el WAV o reproducir.

!!! note "03 · Descartar el transitorio si filtran ruido blanco"
    Si generan el ruido rosa filtrando ruido blanco con un filtro IIR (`scipy.signal.lfilter`), generen `N + N_trans` muestras y eliminen las primeras `N_trans`: los primeros milisegundos salen con el transitorio del filtro. Una regla práctica es $N_{trans} = \ln(1000) / (1 - |p_{max}|)$, donde $p_{max}$ es el polo de mayor módulo (las muestras que tarda el transitorio en caer 60 dB). Para el filtro de la API de referencia da ~1430 muestras.

    Ojo con los paréntesis: en la API de referencia está escrito `np.log(1000)/1 - max(np.abs(np.roots(A)))`, que por precedencia de operadores da ~6 muestras en lugar de ~1430. Es un bug real: un test del transitorio lo habría detectado.

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
    uv run pytest -v -k "pink_noise"     # correr tests que matchean el nombre
    ```

    `-v` (verbose) muestra cada test con su nombre y si pasó; sin `-v` solo ven puntos. `-k` filtra tests por substring del nombre — útil para correr solo lo que están tocando. Si un test falla, `pytest --pdb` abre el debugger en el punto exacto de la falla, y `pytest -x` detiene la corrida en el primer fallo.

### Checklist de entrega

Lo que tiene que estar en el tag `v0.1.0` el 28/10.

- [ ] `generate_pink_noise` con test pasando
- [ ] `generate_sine_sweep_pair` + filtro inverso con tests pasando
- [ ] `play_and_record` con test de forma
- [ ] Las gráficas y la evidencia de validación en `docs/m1/`, enlazadas desde el README
- [ ] `pytest -v` en verde: los tests de los tres servicios
- [ ] Docstrings y type hints en los 3 servicios
- [ ] PRs mergeados, no commits directos a `main`
- [ ] Tag `v0.1.0` anotado y empujado al remote


## Recursos

- [sounddevice: documentación](https://python-sounddevice.readthedocs.io/)
- [scipy.signal.welch](https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.welch.html)
- [Farina, A. (2000) - Swept-sine technique (PDF)](https://www.angelofarina.it/Public/Papers/134-AES00.PDF)
- [Voss-McCartney algorithm](https://www.firstpr.com.au/dsp/pink-noise/)
- [Audacity: análisis espectral](https://manual.audacityteam.org/man/plot_spectrum.html)
