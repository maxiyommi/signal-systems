# El álgebra de la deconvolución vía sweep + filtro inverso

Material complementario a la presentación del Milestone 2 (RIR-API · Procesamiento de la Respuesta al Impulso). Cubre el fundamento teórico de la función `obtener_ri_desde_sweep(grabacion, filtro_inverso)` que pide la spec.

---

## 1. Modelo: la sala como sistema LTI

Para extraer parámetros acústicos con sentido físico, asumimos que la sala se comporta como un **sistema lineal e invariante en el tiempo** (LTI):

- **Lineal** — si reproducís dos señales sumadas, la respuesta es la suma de las respuestas individuales (principio de superposición).
- **Invariante en el tiempo** — la respuesta no cambia con el momento en que medís (la sala no "se cansa" ni "aprende").

Bajo esa asunción, la sala queda completamente caracterizada por **una única función**: su **respuesta al impulso** $h(t)$.

$h(t)$ es lo que saldría del micrófono si en el instante $t = 0$ explotase un impulso ideal $\delta(t)$ en el parlante. Contiene **toda** la información acústica de la sala: las primeras reflexiones, la cola difusa, los modos resonantes, la absorción por banda.

Para cualquier entrada $x(t)$ que reproduzcas, la salida en el micrófono es la **convolución**:

$$
y(t) = (x * h)(t) = \int_{-\infty}^{\infty} x(\tau)\, h(t - \tau)\, d\tau
$$

### Notas de validez

- Linealidad falla cerca del clip (parlante saturado).
- Invariancia falla si hay movimiento (puertas abriendo, gente caminando) o cambios de temperatura/humedad apreciables durante la medición.
- En la práctica: nivel moderado, sala vacía, medir rápido. La asunción LTI vale con error < 1 dB en condiciones razonables.

---

## 2. El sueño: medir $h(t)$ directamente con un impulso

Como la convolución de cualquier función con un delta es la función misma:

$$
\delta * h = h
$$

**Si pudieras reproducir un impulso ideal $\delta(t)$ en la sala**, lo que sale del micrófono sería literalmente la respuesta al impulso. Acto de magia: grabar y abrir el WAV es leer $h(t)$.

### Por qué no funciona en la práctica

$\delta(t)$ tiene **amplitud infinita** en $t = 0$ y duración cero. Energía total finita pero potencia instantánea infinita. Los parlantes reales:

- No pueden mover la membrana infinitamente rápido (limite de slew rate).
- Distorsionan groseramente cerca del nivel máximo.
- Tienen su propia respuesta en frecuencia (no plana, especialmente en graves).

### Lo más cercano: la palmada

Una palmada (o un globo reventando) tiene espectro casi plano y duración corta — aproxima un $\delta$. Pero tiene tres problemas:

- **Poca energía total** → SNR bajo. La cola de reverberación se pierde en el ruido de fondo.
- **No es repetible**: cada palmada es distinta, no podés promediar.
- **Respuesta no plana en bajas frecuencias** (las palmas tienen poca energía debajo de 100 Hz).

Por eso para medición precisa nadie usa palmadas — se usan **señales largas y deterministas** que después se "comprimen" matemáticamente al impulso. El sine sweep es la más popular.

---

## 3. La magia: sine sweep + filtro inverso ≈ delta

En M1 implementaron `generar_sine_sweep(f1, f2, duracion, fs)` que devuelve **dos** señales:

- $x(t)$ — el sweep logarítmico que barre de $f_1$ a $f_2$.
- $x_{\text{inv}}(t)$ — su filtro inverso (el mismo sweep invertido temporalmente, con envolvente compensada).

La propiedad que justifica todo este método (debida a **Farina, 2000**):

$$
\boxed{\;x(t) * x_{\text{inv}}(t) \approx \delta(t)\;}
$$

### Por qué vale (intuición)

Pensá el sweep como **una colección de tonos puros**, cada uno apareciendo en un instante distinto: la frecuencia $f$ pasa por el sweep cuando $t = T \cdot \log(f/f_1) / \log(f_2/f_1)$.

Cuando convolucionás con el filtro inverso (que es el sweep invertido + corregido en amplitud), **cada frecuencia se "apila" en $t = 0$**: el tono de $f$ Hz que aparecía en $t_f$ del sweep ahora cae exactamente en $t = 0$ del resultado, porque el inverso tiene esa misma frecuencia en el instante $T - t_f$.

Todas las frecuencias suman en fase en $t = 0$ → pico angosto y alto.

### Por qué es "≈" y no "="

Tres motivos:

1. **Banda finita**: el sweep solo cubre de $f_1$ a $f_2$ (típicamente 20 Hz–20 kHz). Frecuencias fuera de esa banda no se cancelan; aparecen como un pequeño "ruido" en el resultado.
2. **Discretización**: estamos trabajando con muestras a $f_s$, no con señales continuas. La FFT tiene su grilla.
3. **Compensación de amplitud imperfecta**: el filtro inverso compensa la "doble pasada" del sweep log por las bajas frecuencias, pero la corrección numérica no es exacta.

En la práctica el resultado es un impulso con SNR > 90 dB respecto del piso, que para efectos de medición *se comporta como* $\delta$.

### Por qué Farina (2000) propuso esto

Antes del sweep + filtro inverso, lo estándar era:

- **MLS (Maximum Length Sequence)**: ruido pseudo-aleatorio con autocorrelación ≈ $\delta$. Funciona pero es sensible a no linealidades (la distorsión se reparte en todo el dominio temporal y arruina la cola).
- **Ruido rosa**: similar problema, peor crest factor.

La gran ventaja del sweep logarítmico es que **la distorsión armónica queda separada en el tiempo** del impulso principal. El armónico $n$-ésimo aparece a un tiempo $\Delta t_n < 0$ (negativo) respecto del pico, así que podés ventanearlo y descartarlo. Resultado: medición **lineal** aunque tu cadena tenga distorsión.

**Referencia**: Farina, A. (2000). "Simultaneous measurement of impulse response and distortion with a swept-sine technique." 108th AES Convention. [PDF](http://pcfarina.eng.unipr.it/Public/Papers/134-AES00.PDF)

---

## 4. La cadena de la medición — el álgebra paso a paso

### Lo que tenés

| Símbolo | Qué es | De dónde viene |
|---|---|---|
| $x(t)$ | sweep sintético | lo generaste en M1, lo reproducís en la sala |
| $x_{\text{inv}}(t)$ | filtro inverso del sweep | lo generaste en M1 junto al sweep, lo guardás |
| $y(t)$ | grabación del micrófono | la captura el mic durante el sweep |
| $h(t)$ | respuesta al impulso de la sala | **desconocida — es lo que querés extraer** |

### Paso (i) — reproducir y grabar

Al pasar el sweep $x(t)$ por la sala (sistema LTI), el micrófono capta la convolución:

$$
y(t) = (x * h)(t)
$$

$y(t)$ queda en el archivo WAV. $h(t)$ sigue oculta.

### Paso (ii) — convolucionar con el filtro inverso

Tomás la grabación y le aplicás el filtro inverso (que sí conocés):

$$
y(t) * x_{\text{inv}}(t) = \bigl((x * h) * x_{\text{inv}}\bigr)(t)
$$

### Paso (iii) — usar las propiedades de la convolución

La convolución es **conmutativa** y **asociativa** (lo demostramos en la sección 5). Reordenamos los paréntesis:

$$
\bigl(x * h\bigr) * x_{\text{inv}} = h * \bigl(x * x_{\text{inv}}\bigr)
$$

### Paso (iv) — aplicar la propiedad del sweep + inverso

De la sección 3 sabemos que $x * x_{\text{inv}} \approx \delta$. Sustituimos:

$$
h * \bigl(x * x_{\text{inv}}\bigr) \approx h * \delta = h
$$

### Resultado

$$
\boxed{\;y(t) * x_{\text{inv}}(t) \approx h(t)\;}
$$

Del archivo grabado y del filtro inverso (que tenías guardado), **obtuviste $h(t)$ directamente** por convolución. Eso es lo que implementa `obtener_ri_desde_sweep(grabacion, filtro_inverso)`.

---

## 5. Por qué la convolución es conmutativa y asociativa

Los tres pasos del razonamiento anterior dependen de que podamos reordenar paréntesis. Acá la justificación.

### Conmutativa

Por definición:

$$
(a * b)(t) = \int_{-\infty}^{\infty} a(\tau)\, b(t - \tau)\, d\tau
$$

Cambio de variable $\sigma = t - \tau$ (entonces $\tau = t - \sigma$, $d\tau = -d\sigma$):

$$
\int_{-\infty}^{\infty} a(t - \sigma)\, b(\sigma)\, d\sigma = (b * a)(t)
$$

→ $a * b = b * a$. ✓

### Asociativa

$$
\bigl((a * b) * c\bigr)(t) = \int (a * b)(\tau)\, c(t - \tau)\, d\tau = \int \int a(\sigma)\, b(\tau - \sigma)\, d\sigma\, c(t - \tau)\, d\tau
$$

Aplicando **Fubini** (intercambio de integrales, vale para funciones bien comportadas):

$$
= \int a(\sigma) \int b(\tau - \sigma)\, c(t - \tau)\, d\tau\, d\sigma
$$

La integral interna, con cambio $\rho = \tau - \sigma$, da $(b * c)(t - \sigma)$. Entonces:

$$
= \int a(\sigma)\, (b * c)(t - \sigma)\, d\sigma = \bigl(a * (b * c)\bigr)(t)
$$

→ $(a * b) * c = a * (b * c)$. ✓

### La forma "fácil" de verlo: en frecuencia

Las propiedades de la convolución son obvias si pasás al **dominio de Fourier**, donde la convolución se transforma en producto:

$$
\mathcal{F}\{a * b\}(f) = A(f) \cdot B(f)
$$

(Teorema de convolución.) Y la multiplicación de números complejos es trivialmente conmutativa y asociativa:

$$
A \cdot B = B \cdot A, \qquad (A \cdot B) \cdot C = A \cdot (B \cdot C)
$$

Aplicando la inversa de Fourier a cualquiera de esas igualdades recuperás las propiedades en el tiempo.

### Aplicado a nuestra cadena

$$
\mathcal{F}\{y * x_{\text{inv}}\}(f) = Y(f) \cdot X_{\text{inv}}(f) = X(f) \cdot H(f) \cdot X_{\text{inv}}(f) = H(f) \cdot \underbrace{X(f) \cdot X_{\text{inv}}(f)}_{\approx\, 1}
$$

Por la propiedad de Farina del sweep, $X(f) \cdot X_{\text{inv}}(f) \approx 1$ en toda la banda útil → $\mathcal{F}\{y * x_{\text{inv}}\} \approx H(f)$ → inversa de Fourier → $\approx h(t)$.

---

## 6. Implementación práctica

### Esqueleto del código

```python
import numpy as np
from scipy.signal import fftconvolve

def obtener_ri_desde_sweep(grabacion: np.ndarray, filtro_inverso: np.ndarray) -> np.ndarray:
    """Extrae la respuesta al impulso de la sala vía deconvolución con filtro inverso."""
    # Paso 1: convolucion full (devuelve N + M - 1 muestras)
    ri_full = fftconvolve(grabacion, filtro_inverso, mode="full")

    # Paso 2: ubicar el pico (es donde "aterriza" el impulso recuperado)
    peak_idx = int(np.argmax(np.abs(ri_full)))

    # Paso 3: recortar desde el pico, descartando la pre-respuesta
    duracion_ri_max = 2.0  # segundos, ajustar según el T60 esperado
    fs = 44100
    fin = peak_idx + int(duracion_ri_max * fs)
    ri = ri_full[peak_idx:fin]

    # Paso 4: normalizar al pico
    ri = ri / np.max(np.abs(ri))

    return ri
```

### Detalles que importan

1. **`fftconvolve` y no `convolve`** — para señales largas (sweep de 3-5 s a 48 kHz), `fftconvolve` es órdenes de magnitud más rápido. `np.convolve` tarda minutos donde `fftconvolve` tarda milisegundos.

2. **`mode="full"`** — devuelve la convolución completa. La longitud es $N + M - 1$, donde $N$ es la longitud de la grabación y $M$ la del filtro. La RI útil está en la mitad de ese arreglo, alrededor del pico.

3. **Ubicar el pico con `argmax(abs(...))`** — el pico es donde el impulso recuperado tiene su máximo. Antes del pico hay "pre-eco" (componentes no causales del filtro inverso), que se descarta.

4. **Recortar a la duración útil** — la RI tiene una cola que decae exponencialmente. Recortar a 2-3 veces el T60 esperado deja todo lo útil y descarta el ruido de fondo.

5. **Normalizar al final** — `ri = ri / np.max(np.abs(ri))`. Imprescindible para que el output sea homogéneo entre mediciones.

### Verificación con la propia spec

El test 3 de M2 (`test_obtener_ri_pico`) usa esta cadena:

1. Sintetizar una RI conocida con `sintetizar_ri()`.
2. Generar el sweep + filtro inverso con M1.
3. Convolucionar `sweep * RI_sintetica` → simular la "grabación".
4. Llamar `obtener_ri_desde_sweep(grabacion, filtro_inverso)`.
5. Verificar correlación cruzada con la RI original > 0.9.

Si el álgebra está bien implementada, la correlación queda > 0.95 fácil. Si está < 0.9, hay bug — probablemente en la ubicación del pico o en el modo de convolución.

---

## 7. Lecturas recomendadas

- **Farina, A. (2000).** "Simultaneous measurement of impulse response and distortion with a swept-sine technique." 108th AES Convention. [PDF](http://pcfarina.eng.unipr.it/Public/Papers/134-AES00.PDF) — el paper original que estableció este método.

- **Müller, S. & Massarani, P. (2001).** "Transfer-function measurement with sweeps." *Journal of the Audio Engineering Society*, 49(6). — generalización y discusión de tradeoffs vs MLS.

- **Stan, G.-B., Embrechts, J.-J. & Archambeau, D. (2002).** "Comparison of different impulse response measurement techniques." *Journal of the Audio Engineering Society*, 50(4). — comparación cuantitativa entre sweep, MLS y otros métodos.

- **ISO 3382-1:2009** — Norma internacional para medición de parámetros acústicos de salas. Define cómo procesar la RI una vez recuperada (lo que vienen en M3).

- **Oppenheim, A. V., Schafer, R. W., & Buck, J. R. (1999).** *Discrete-Time Signal Processing*. Capítulos 2 y 3 — convolución, propiedades, dominio frecuencia. La referencia clásica de DSP.

---

**Última actualización:** Junio 2026 · Material de cátedra · Señales y Sistemas (UNTREF)
