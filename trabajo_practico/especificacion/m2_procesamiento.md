# Milestone 2: Procesamiento de la Respuesta al Impulso

**Presentacion de la consigna**: miercoles 21 de octubre 2026
**Fecha de entrega**: miercoles 4 de noviembre 2026 (en clase)
**Tag de version**: `v0.2.0`
**Evaluacion**: seguimiento, sin nota (el grupo muestra su avance y recibe feedback por Slack)

## Objetivo

Implementar las funciones de procesamiento de la respuesta al impulso (RI): carga de archivos de audio, sintesis de RI conocidas para validacion, deconvolucion, filtrado por bandas de octava y conversion a escala logaritmica. Al finalizar este milestone, el sistema debe ser capaz de obtener la RI a partir de una grabacion de sine sweep y procesarla en bandas de frecuencia.

---

## Funciones a implementar

### 1. `cargar_audio(ruta)`

**Firma sugerida:**
```python
def cargar_audio(ruta: str | Path) -> tuple[np.ndarray, int]:
    """
    Carga un archivo de audio WAV o FLAC.

    Parameters
    ----------
    ruta : str | Path
        Ruta al archivo de audio.

    Returns
    -------
    tuple[np.ndarray, int]
        Tupla con (senal, frecuencia_de_muestreo).
        La senal se devuelve como float64 normalizada entre -1 y 1.

    Raises
    ------
    FileNotFoundError
        Si el archivo no existe.
    ValueError
        Si el formato no es soportado.
    """
```

**Consideraciones:**
- Soportar al menos los formatos WAV y FLAC.
- Utilizar `soundfile` o `scipy.io.wavfile` para la carga.
- Convertir automaticamente a float64 normalizado independientemente de la profundidad de bits original (16-bit, 24-bit, 32-bit).
- Si el audio es estereo, devolver ambos canales y documentar la convencion (filas vs. columnas).
- Incluir manejo de errores robusto con mensajes claros.

---

### 2. `sintetizar_ri(t60_por_banda, fs, duracion)`

**Firma sugerida:**
```python
def sintetizar_ri(
    t60_por_banda: dict[float, float], fs: int, duracion: float
) -> np.ndarray:
    """
    Sintetiza una respuesta al impulso con valores de T60 conocidos por banda.

    Parameters
    ----------
    t60_por_banda : dict[float, float]
        Diccionario {frecuencia_central_Hz: T60_segundos}.
        Ejemplo: {125: 2.0, 250: 1.8, 500: 1.5, 1000: 1.2, 2000: 1.0, 4000: 0.8}
    fs : int
        Frecuencia de muestreo en Hz.
    duracion : float
        Duracion total de la RI sintetizada en segundos.

    Returns
    -------
    np.ndarray
        Respuesta al impulso sintetizada.
    """
```

**Fundamento matematico:**

Una respuesta al impulso idealizada en un recinto puede modelarse como un decaimiento exponencial modulado por ruido:

$$h(t) = n(t) \cdot e^{-\alpha t}$$

donde $n(t)$ es ruido blanco gaussiano y $\alpha$ es la constante de decaimiento relacionada con el tiempo de reverberacion $T_{60}$:

$$\alpha = \frac{3 \ln(10)}{T_{60}} = \frac{6.908}{T_{60}}$$

Esta relacion se deriva de la definicion de $T_{60}$ como el tiempo en que la energia decae 60 dB:

$$20 \log_{10}(e^{-\alpha T_{60}}) = -60 \text{ dB}$$

$$-\alpha T_{60} \cdot 20 \log_{10}(e) = -60$$

$$\alpha = \frac{60}{T_{60} \cdot 20 \log_{10}(e)} = \frac{3\ln(10)}{T_{60}}$$

**Procedimiento de sintesis multi-banda:**

1. Para cada banda de frecuencia en `t60_por_banda`:
   a. Generar ruido blanco de duracion `duracion`.
   b. Filtrar con filtro pasa-banda centrado en la frecuencia central (usar `filtro_octava` del punto 4).
   c. Aplicar la envolvente exponencial con el $\alpha$ correspondiente al $T_{60}$ de esa banda.
2. Sumar todas las componentes filtradas.
3. Normalizar la senal resultante.

**Uso principal:** Esta funcion sirve como referencia para validar que las funciones de calculo de parametros acusticos (M3) devuelven los valores correctos, ya que los $T_{60}$ de entrada son conocidos.

---

### 3. `obtener_ri_desde_sweep(grabacion, filtro_inverso)`

**Firma sugerida:**
```python
def obtener_ri_desde_sweep(
    grabacion: np.ndarray, filtro_inverso: np.ndarray
) -> np.ndarray:
    """
    Obtiene la respuesta al impulso mediante deconvolucion.

    Parameters
    ----------
    grabacion : np.ndarray
        Senal grabada que contiene la respuesta del recinto al sweep.
    filtro_inverso : np.ndarray
        Filtro inverso del sweep utilizado en la excitacion.

    Returns
    -------
    np.ndarray
        Respuesta al impulso del recinto.
    """
```

**Fundamento matematico:**

Si excitamos un sistema lineal e invariante en el tiempo (LTI) con un sine sweep $x(t)$, la respuesta grabada es:

$$y(t) = x(t) * h(t)$$

donde $h(t)$ es la respuesta al impulso del recinto y $*$ denota convolucion.

Para recuperar $h(t)$, convolucionamos la grabacion con el filtro inverso $x_{inv}(t)$:

$$h(t) = y(t) * x_{inv}(t) = [x(t) * h(t)] * x_{inv}(t) = [x(t) * x_{inv}(t)] * h(t) \approx \delta(t) * h(t) = h(t)$$

**Implementacion via FFT:**

La convolucion se realiza eficientemente en el dominio frecuencial:

$$H(f) = Y(f) \cdot X_{inv}(f)$$

$$h(t) = \mathcal{F}^{-1}\{H(f)\}$$

Usar `scipy.signal.fftconvolve` con `mode='full'` y luego recortar la senal al rango relevante.

**Post-procesamiento:**
- Identificar el pico principal de la RI (instante de llegada directa).
- Recortar la senal para que comience en el pico o ligeramente antes.
- Normalizar respecto al pico.

---

### 4. `filtro_octava(signal, fc, fs, orden)`

**Firma sugerida:**
```python
def filtro_octava(
    signal: np.ndarray, fc: float, fs: int, orden: int = 4
) -> np.ndarray:
    """
    Aplica un filtro pasa-banda de octava segun IEC 61260.

    Parameters
    ----------
    signal : np.ndarray
        Senal de entrada.
    fc : float
        Frecuencia central de la banda en Hz.
    fs : int
        Frecuencia de muestreo en Hz.
    orden : int, optional
        Orden del filtro Butterworth (default: 4).

    Returns
    -------
    np.ndarray
        Senal filtrada en la banda de octava especificada.
    """
```

**Fundamento matematico:**

Segun la norma **IEC 61260**, las frecuencias de corte de un filtro de banda de octava se definen como:

$$f_{inf} = \frac{f_c}{\sqrt{2}} = f_c \cdot 2^{-1/2}$$

$$f_{sup} = f_c \cdot \sqrt{2} = f_c \cdot 2^{1/2}$$

donde $f_c$ es la frecuencia central nominal.

Las frecuencias centrales normalizadas de las bandas de octava son:

| Banda | $f_c$ (Hz) | $f_{inf}$ (Hz) | $f_{sup}$ (Hz) |
|-------|-----------|----------------|----------------|
| 1     | 31.5      | 22.3           | 44.5           |
| 2     | 63        | 44.5           | 89.1           |
| 3     | 125       | 88.4           | 176.8          |
| 4     | 250       | 176.8          | 353.6          |
| 5     | 500       | 353.6          | 707.1          |
| 6     | 1000      | 707.1          | 1414.2         |
| 7     | 2000      | 1414.2         | 2828.4         |
| 8     | 4000      | 2828.4         | 5656.9         |
| 9     | 8000      | 5656.9         | 11313.7        |
| 10    | 16000     | 11313.7        | 22627.4        |

**Implementacion:**

1. Calcular las frecuencias de corte normalizadas para el filtro digital:
   $$W_{inf} = \frac{2 f_{inf}}{f_s}, \quad W_{sup} = \frac{2 f_{sup}}{f_s}$$

2. Disenar un filtro Butterworth pasa-banda con `scipy.signal.butter`:
   ```python
   b, a = scipy.signal.butter(orden, [W_inf, W_sup], btype='band')
   ```

3. Aplicar el filtro con `scipy.signal.filtfilt` para obtener fase cero (filtra en ambas direcciones):
   ```python
   signal_filtrada = scipy.signal.filtfilt(b, a, signal)
   ```

**Importante:** Usar `filtfilt` en lugar de `lfilter` para evitar distorsion de fase, lo cual es critico para el calculo correcto de parametros temporales como EDT y $T_{60}$.

**Verificacion:** El espectro del filtro debe cumplir que la atenuacion en las frecuencias de corte es de -3 dB respecto al maximo.

---

### 5. `a_escala_log(signal)`

**Firma sugerida:**
```python
def a_escala_log(signal: np.ndarray) -> np.ndarray:
    """
    Convierte una senal a escala logaritmica normalizada (dB).

    Parameters
    ----------
    signal : np.ndarray
        Senal de entrada (valores lineales).

    Returns
    -------
    np.ndarray
        Senal en decibeles, normalizada respecto al valor maximo.
    """
```

**Fundamento matematico:**

La conversion a escala logaritmica normalizada se define como:

$$L(t) = 10 \log_{10}\left(\frac{h^2(t)}{\max(h^2(t))}\right)$$

O equivalentemente, trabajando con amplitud:

$$L(t) = 20 \log_{10}\left(\frac{|h(t)|}{\max(|h(t)|)}\right)$$

El resultado es una senal en dB donde el valor maximo es 0 dB.

**Consideraciones de implementacion:**
- Evitar logaritmo de cero: reemplazar valores cero o negativos por un valor minimo (por ejemplo, `np.finfo(float).eps` o `-np.inf` en dB).
- Opcionalmente, establecer un piso de ruido (floor) en dB, por ejemplo -120 dB, para evitar valores extremadamente negativos.

---

## Tests requeridos

### Test 1: Carga de audio

```python
def test_cargar_audio_wav():
    """Verificar carga correcta de archivo WAV."""

def test_cargar_audio_formato_invalido():
    """Verificar que lanza error con formato no soportado."""

def test_cargar_audio_normalizacion():
    """Verificar que la salida esta normalizada entre -1 y 1."""
```

### Test 2: Sintesis de RI

```python
def test_sintetizar_ri_duracion():
    """Verificar que la RI tiene la duracion correcta."""

def test_sintetizar_ri_decaimiento():
    """
    Verificar que el decaimiento por banda corresponde
    aproximadamente al T60 especificado.
    """
```

**Procedimiento del test de decaimiento:**
1. Sintetizar una RI con $T_{60} = 2.0$ s en la banda de 1000 Hz.
2. Filtrar la RI sintetizada en la banda de 1000 Hz.
3. Calcular la curva de decaimiento en dB.
4. Medir el tiempo en que la curva cruza -60 dB.
5. Verificar que el $T_{60}$ medido esta dentro del 10% del valor especificado.

### Test 3: Deconvolucion

```python
def test_obtener_ri_pico():
    """
    Verificar que la RI obtenida por deconvolucion tiene
    un pico principal claramente identificable.
    """
```

**Procedimiento:**
1. Generar un sweep y su filtro inverso (M1).
2. Convolucionar el sweep con una RI sintetizada conocida para simular una grabacion.
3. Aplicar `obtener_ri_desde_sweep` con la grabacion simulada y el filtro inverso.
4. Verificar que la RI recuperada se parece a la RI original (correlacion cruzada > 0.9).

### Test 4: Filtro de octava

```python
def test_filtro_octava_frecuencia_central():
    """Verificar que el filtro pasa correctamente la frecuencia central."""

def test_filtro_octava_atenuacion():
    """Verificar atenuacion fuera de banda."""

def test_filtro_octava_respuesta_frecuencia():
    """Verificar que la respuesta cumple -3 dB en frecuencias de corte."""
```

**Procedimiento del test de respuesta en frecuencia:**
1. Calcular la respuesta en frecuencia del filtro con `scipy.signal.freqz`.
2. Verificar que la ganancia en $f_c$ es maxima (0 dB, con tolerancia de 0.5 dB).
3. Verificar que la ganancia en $f_{inf}$ y $f_{sup}$ es aproximadamente -3 dB (tolerancia de 1 dB).
4. Verificar que la atenuacion a una octava de distancia ($f_c/2$ y $2 f_c$) es mayor a 20 dB.

### Test 5: Escala logaritmica

```python
def test_a_escala_log_maximo_cero():
    """Verificar que el valor maximo de la salida es 0 dB."""

def test_a_escala_log_relacion():
    """Verificar que una senal con amplitud mitad da -6 dB."""
```

---

## Dataset de validacion

Para validar el procesamiento, utilizar respuestas al impulso de la base de datos **OpenAIR** (Open Acoustic Impulse Response Library):

- **URL**: [https://www.openairlib.net/](https://www.openairlib.net/)
- **RIs recomendadas para testing:**
  - Elveden Hall, Suffolk, England (sala grande, T60 largo)
  - Maes Howe, Orkney, Scotland (recinto pequeno, T60 corto)
  - Hamilton Mausoleum, Scotland (T60 extremadamente largo, ~15 s)
  - Arthur Sykes Rymer Auditorium, University of York (auditorio tipico)

**Procedimiento de validacion:**
1. Descargar al menos 2 RIs de OpenAIR.
2. Procesarlas con las funciones desarrolladas.
3. Comparar los resultados (espectro, forma de onda, decaimiento) con los valores reportados en la base de datos.
4. Documentar la comparacion en el README del repositorio.

**Validacion con software comercial:**
- Procesar las mismas RIs con software de referencia: **REW (Room EQ Wizard)**, **ARTA**, **Aurora Plugins** o similar.
- Los resultados no deben diferir significativamente (se evaluara en detalle en M3).

---

## Calidad de codigo

Todos los requisitos de M1 aplican, mas los siguientes:

- **Modularidad**: cada funcion debe estar en un modulo separado o agrupada logicamente dentro de la capa de servicios. Ejemplo:
  ```
  app/
  ├── services/
  │   ├── __init__.py
  │   ├── pink_noise.py       # M1
  │   ├── sine_sweep.py       # M1
  │   ├── signal_utils.py     # M2
  │   ├── filter.py           # M2
  │   └── acoustic_parameters.py  # M3 (placeholder)
  ```
- **Cobertura de tests**: apuntar a al menos 80% de cobertura en las funciones de M2.
- **CI**: se recomienda fuertemente configurar GitHub Actions para ejecutar tests automaticamente en cada push. Archivo sugerido: `.github/workflows/ci.yml`.
- **Tag**: al completar el milestone, crear el tag `v0.2.0`.

---

## Recursos

- [OpenAIR Library](https://www.openairlib.net/)
- [scipy.signal.butter](https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.butter.html)
- [scipy.signal.filtfilt](https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.filtfilt.html)
- [scipy.signal.fftconvolve](https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.fftconvolve.html)
- [IEC 61260-1:2014 - Electroacoustics - Octave-band and fractional-octave-band filters](https://www.iso.org/standard/69056.html)
- [REW - Room EQ Wizard (software gratuito)](https://www.roomeqwizard.com/)
