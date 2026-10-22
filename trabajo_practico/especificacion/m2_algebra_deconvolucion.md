# El álgebra de la deconvolución vía sweep + filtro inverso

Material complementario de [M2 · Procesamiento de la RI](m2_procesamiento.md). Cubre el fundamento teórico de la función `get_impulse_response(recording, inverse_filter)` que pide la consigna.

---

## 1. Modelo: la sala como sistema LTI

Para extraer parámetros acústicos con sentido físico, asumimos que la sala se comporta como un **sistema lineal e invariante en el tiempo** (LTI):

- **Lineal** — si reproducís dos señales sumadas, la respuesta es la suma de las respuestas individuales (principio de superposición).
- **Invariante en el tiempo** — la respuesta no cambia con el momento en que medís (la sala no "se cansa" ni "aprende").

Bajo ese supuesto, la sala queda completamente caracterizada por **una única función**: su **respuesta al impulso** $h(t)$.

$h(t)$ es lo que saldría del micrófono si en el instante $t = 0$ explotase un impulso ideal $\delta(t)$ en el parlante. Contiene **toda** la información acústica de la sala: las primeras reflexiones, la cola difusa, los modos resonantes, la absorción por banda.

Para cualquier entrada $x(t)$ que reproduzcas, la salida en el micrófono es la **convolución**:

$$
y(t) = (x * h)(t) = \int_{-\infty}^{\infty} x(\tau)\, h(t - \tau)\, d\tau
$$

Leída en voz alta, la integral dice: **cada instante $\tau$ de la entrada dispara una copia de $h$**, corrida hasta $\tau$ y escalada por $x(\tau)$, y la salida es la suma de todas esas copias. Con una entrada de tres impulsos se ve directo:

<figure class="figura-deconv" data-figura="convolucion">
<canvas role="img" aria-label="Convolución: una entrada de tres impulsos, la respuesta al impulso de la sala y la salida como suma de tres copias de h corridas y escaladas"></canvas>
<figcaption>Cada impulso de x(t) produce una copia de h(t) en su instante y con su amplitud (fila "copias"); donde las copias se pisan, se suman, y el resultado es y(t). Una señal cualquiera es una sucesión de impulsos, por eso conocer h(t) alcanza para predecir la salida de cualquier entrada. Acá h(t) es una oscilación amortiguada para que se distingan las copias; la de una sala es mucho más larga y densa, pero la regla es la misma.</figcaption>
</figure>

### Notas de validez

- Linealidad falla cerca del clip (parlante saturado).
- Invariancia falla si hay movimiento (puertas abriendo, gente caminando) o cambios de temperatura/humedad apreciables durante la medición.
- En la práctica: nivel moderado, sala vacía, medir rápido. En esas condiciones el supuesto LTI es una muy buena aproximación.

---

## 2. El sueño: medir h(t) directamente con un impulso

Como la convolución de cualquier función con un delta es la función misma:

$$
\delta * h = h
$$

**Si pudieras reproducir un impulso ideal $\delta(t)$ en la sala**, lo que sale del micrófono sería literalmente la respuesta al impulso. Acto de magia: grabar y abrir el WAV es leer $h(t)$.

### Por qué no funciona en la práctica

$\delta(t)$ tiene **amplitud infinita** en $t = 0$ y duración cero. Su área vale 1 ($\int \delta(t)\,dt = 1$), pero ni siquiera tiene energía finita: $\int \delta^2(t)\,dt$ diverge. Los parlantes reales:

- No pueden mover la membrana infinitamente rápido (límite de slew rate).
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

En M1 implementaron `generate_sine_sweep_pair(duration, f1, f2, fs)` que devuelve **dos** señales:

- $x(t)$ — el sweep logarítmico que barre de $f_1$ a $f_2$.
- $x_{\text{inv}}(t)$ — su filtro inverso (el mismo sweep invertido temporalmente, con envolvente compensada).

La propiedad que justifica todo este método (debida a **Farina, 2000**):

$$
\boxed{\;x(t) * x_{\text{inv}}(t) \approx \delta(t)\;}
$$

### Por qué vale (intuición)

Pensá el sweep como **una colección de tonos puros**, cada uno apareciendo en un instante distinto: la frecuencia $f$ pasa por el sweep cuando $t = T \cdot \log(f/f_1) / \log(f_2/f_1)$.

Cuando convolucionás con el filtro inverso (que es el sweep invertido + corregido en amplitud), **cada frecuencia se "apila" en el mismo instante**: el tono de $f$ Hz aparece en $t_f$ del sweep y en $T - t_f$ del inverso, así que en el resultado llega en $t_f + (T - t_f) = T$. Ese instante no depende de $f$: es el mismo para todas.

<figure class="figura-deconv" data-figura="apilado">
<canvas role="img" aria-label="Frecuencia instantánea del sweep (sube), del filtro inverso (baja) y de su convolución (una línea vertical en t igual a T)"></canvas>
<figcaption>Frecuencia instantánea del sweep (sube) y del filtro inverso (baja), con el eje de frecuencia logarítmico. Cada frecuencia, por ejemplo 100 Hz, 1 kHz y 10 kHz, suma sus dos instantes y llega a T: en la convolución quedan todas alineadas en una línea vertical, que es un impulso.</figcaption>
</figure>

Todas las frecuencias suman en fase en ese instante → pico angosto y alto. En la salida completa de la convolución el pico cae en $t = T$; al recortar desde el pico (sección 6), ese instante pasa a ser el $t = 0$ de la RI.

### Por qué es "≈" y no "="

Tres motivos:

1. **Banda finita**: el sweep solo cubre de $f_1$ a $f_2$ (típicamente 20 Hz–20 kHz). Fuera de esa banda no hay energía, así que el resultado no es un delta perfecto sino un **delta de banda limitada**: un pulso angosto con pequeñas oscilaciones a los lados.
2. **Discretización**: estamos trabajando con muestras a $f_s$, no con señales continuas. La FFT tiene su grilla.
3. **Compensación de amplitud imperfecta**: el filtro inverso compensa que el sweep logarítmico pasa más tiempo en los graves (su espectro cae −3 dB/octava, como el ruido rosa), pero la corrección numérica no es exacta.

En la práctica, con el sweep de M1 (2 s, 20 Hz a 20 kHz), lo que queda fuera del pico está entre unos 55 dB (a ±10 ms) y 80 dB (a ±0,5 s) por debajo: más que los 60 dB que hacen falta para medir un T60. Para efectos de medición *se comporta como* $\delta$.

### Por qué Farina (2000) propuso esto

Antes del sweep + filtro inverso, lo estándar era:

- **MLS (Maximum Length Sequence)**: ruido pseudo-aleatorio con autocorrelación ≈ $\delta$. Funciona pero es sensible a no linealidades (la distorsión se reparte en todo el dominio temporal y arruina la cola).
- **Ruido interrumpido** (ruido rosa que se corta, el método clásico de la ISO 3382): la caída que se graba es aleatoria, hay que promediar muchas mediciones y no da la RI completa.

La gran ventaja del sweep logarítmico es que **la distorsión armónica queda separada en el tiempo** del impulso principal. Si el parlante distorsiona, el armónico $n$ de cada tono aparece cuando el sweep pasa por $n \cdot f$, que en un sweep logarítmico es siempre el mismo tiempo antes: el armónico $n$-ésimo cae en

$$
\Delta t_n = -\frac{T \ln(n)}{\ln(f_2/f_1)}
$$

respecto del pico (negativo: **antes**), así que podés ventanearlo y descartarlo. Resultado: medición **lineal** aunque tu cadena tenga distorsión.

<figure class="figura-deconv" data-figura="distorsion">
<canvas role="img" aria-label="Resultado de deconvolucionar una grabación con distorsión: el pico lineal en cero y los armónicos 2, 3 y 4 como picos más chicos antes del pico"></canvas>
<figcaption>Un sweep de 2 s (20 Hz a 20 kHz) que pasa por un parlante no lineal, deconvolucionado con su filtro inverso. La respuesta lineal queda en 0; los armónicos 2.º, 3.º y 4.º aparecen como picos aparte, antes, justo donde predice Δtₙ (líneas punteadas). Al recortar desde el pico, quedan afuera.</figcaption>
</figure>

**Referencia**: Farina, A. (2000). "Simultaneous measurement of impulse response and distortion with a swept-sine technique." 108th AES Convention. [PDF](https://www.angelofarina.it/Public/Papers/134-AES00.PDF)

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

Del archivo grabado y del filtro inverso (que tenías guardado), **obtuviste $h(t)$ directamente** por convolución. Eso es lo que implementa `get_impulse_response(recording, inverse_filter)`.

---

## 5. Por qué la convolución es conmutativa y asociativa

El paso (iii) del razonamiento anterior depende de que podamos reordenar paréntesis. Acá la justificación.

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

!!! warning "¿Cuándo vale?"
    El teorema de convolución no es gratis: necesita estas condiciones.

    1. **Las transformadas tienen que existir.** El enunciado clásico pide señales absolutamente integrables, $\int |a(t)|\,dt < \infty$, o de energía finita, $\int |a(t)|^2\,dt < \infty$. Con eso la convolución también existe y $\mathcal{F}\{a * b\} = A \cdot B$ vale. Las señales ideales sin transformada clásica (un seno que dura para siempre, el escalón, $\delta$) entran en el sentido de las **distribuciones**: sus transformadas tienen deltas, y la igualdad sigue valiendo mientras el producto esté definido. Lo que no está definido es, por ejemplo, multiplicar dos deltas en la misma frecuencia, que es convolucionar dos senos eternos de la misma frecuencia: esa convolución diverge. **En el TP no hay problema:** el sweep, el filtro inverso, la grabación y la RI duran un tiempo finito y tienen amplitud acotada.
    2. **El sistema tiene que ser LTI.** Escribir la grabación como $Y(f) = X(f)\,H(f)$ supone que la sala es lineal e invariante (sección 1). Con un sistema no lineal no existe una única $H(f)$: la energía aparece en otras frecuencias (armónicos) y el producto deja de describir la salida. Por eso la distorsión del parlante no se "deconvoluciona": queda separada en el tiempo (sección 3).
    3. **En la computadora, la DFT da convolución circular.** Con señales muestreadas y la FFT, el producto de dos DFT de $N$ puntos es la transformada de la convolución **circular**: lo que pasa del final vuelve a entrar por el principio. Para obtener la convolución **lineal** hay que rellenar con ceros hasta $N + M - 1$ muestras como mínimo. `scipy.signal.fftconvolve` lo hace solo; si arman la deconvolución a mano con `np.fft`, se tienen que ocupar ustedes, o la cola de la RI aparece "doblada" sobre el comienzo.

### Aplicado a nuestra cadena

$$
\mathcal{F}\{y * x_{\text{inv}}\}(f) = Y(f) \cdot X_{\text{inv}}(f) = X(f) \cdot H(f) \cdot X_{\text{inv}}(f) = H(f) \cdot \underbrace{X(f) \cdot X_{\text{inv}}(f)}_{\approx\, 1}
$$

Por la propiedad de Farina del sweep, $X(f) \cdot X_{\text{inv}}(f) \approx 1$ en toda la banda útil → $\mathcal{F}\{y * x_{\text{inv}}\} \approx H(f)$ → inversa de Fourier → $\approx h(t)$.

Ese "$\approx 1$" tiene tres letras chicas, y conviene saber cuáles son:

- **Solo entre $f_1$ y $f_2$.** Fuera del rango del sweep, $X(f) \approx 0$ y el producto también: lo que se recupera es $h(t)$ **limitada a la banda** $[f_1, f_2]$, no la $h(t)$ completa. Por eso el sweep tiene que cubrir todas las bandas de octava que se van a analizar en M3.
- **Salvo una ganancia y un retardo.** Con el filtro inverso tal como sale de M1, el producto es en realidad $c \cdot e^{-j 2\pi f T}$: una constante (por la normalización) y un retardo puro de $T$ segundos. El retardo es lo que pone el pico en $t = T$ en la salida completa (figura de la sección 3), y la constante se va al normalizar la RI al pico.
- **Con ruido, el ruido también pasa.** Si la grabación es $y = x * h + r$, la cuenta da $H(f) + R(f)\,X_{\text{inv}}(f)$: el ruido de fondo filtrado por el inverso. Es el piso que se ve después de la caída en la figura de la sección 6. Un sweep más largo concentra más energía en el pico y baja ese piso, unos 3 dB cada vez que se duplica la duración.

---

## 6. Implementación práctica

### Esqueleto del código

```python
import numpy as np
from scipy.signal import fftconvolve

def get_impulse_response(recording: np.ndarray, inverse_filter: np.ndarray) -> np.ndarray:
    """Extrae la respuesta al impulso de la sala vía deconvolución con filtro inverso."""
    # Paso 1: convolucion full (devuelve N + M - 1 muestras)
    ir_full = fftconvolve(recording, inverse_filter, mode="full")

    # Paso 2: ubicar el pico (es donde "aterriza" el impulso recuperado)
    peak_idx = int(np.argmax(np.abs(ir_full)))

    # Paso 3: empezar unos 5 ms antes del pico, descartando la pre-respuesta.
    # La firma no recibe fs: 240 muestras son 5 ms a 48 kHz (5,4 ms a 44,1 kHz).
    antes = 240
    ir = ir_full[max(0, peak_idx - antes):]

    # Paso 4: normalizar al pico
    ir = ir / np.max(np.abs(ir))

    return ir
```

Así se ve lo que devuelve el paso 1 y qué se queda en los pasos 2 y 3, para una sala de T60 = 0,6 s medida con un sweep de 2 s:

<figure class="figura-deconv" data-figura="cadena">
<canvas role="img" aria-label="Salida completa de fftconvolve en dB: tramo previo al pico que se descarta, el pico, la ventana que se conserva y el ruido de fondo después"></canvas>
<figcaption>La salida completa de fftconvolve, en dB respecto del pico. Antes del pico no hay información de la sala (zona sombreada: se descarta). Desde el pico, la caída coincide con la h(t) de la sala (gris punteado) hasta que la tapa el ruido de fondo de la grabación; el recuadro marca lo que devuelve la función: desde 5 ms antes del pico hasta el final.</figcaption>
</figure>

### Detalles que importan

1. **`fftconvolve` y no `convolve`** — para señales largas (sweep de 3-5 s a 48 kHz), `fftconvolve` es órdenes de magnitud más rápido. `np.convolve` tarda minutos donde `fftconvolve` tarda milisegundos.

2. **`mode="full"`** — devuelve la convolución completa. La longitud es $N + M - 1$, donde $N$ es la longitud de la grabación y $M$ la del filtro. La RI útil está en la mitad de ese arreglo, alrededor del pico.

3. **Ubicar el pico con `argmax(abs(...))`** — el pico es donde el impulso recuperado tiene su máximo. Antes del pico hay "pre-eco" (componentes no causales del filtro inverso), que se descarta; pero la RI arranca **unos 5 ms antes** del pico, no justo en él: si empieza exactamente en el sonido directo, el filtrado por bandas de M3 (`sosfiltfilt`) deforma el comienzo y el EDT de los graves sale mal.

4. **El final no se recorta acá** — después de la caída queda el ruido de fondo de la grabación. De eso se ocupa M3: el rango dinámico decide qué tiempos se pueden calcular, y Lundeby (opcional) dice dónde cortar la integral de Schroeder.

5. **Normalizar al final** — `ir = ir / np.max(np.abs(ir))`. Imprescindible para que el output sea homogéneo entre mediciones.

### Verificación con los tests de la consigna

El test de deconvolución de M2 (`test_impulse_response_peak`) usa esta cadena:

1. Armar una RI conocida (en el test: sonido directo + cola exponencial filtrada; también sirve una generada con `generate_synthetic_ir()`).
2. Generar el sweep + filtro inverso con M1.
3. Convolucionar `sweep * RI_sintetica` → simular la "grabación".
4. Llamar `get_impulse_response(recording, inverse_filter)`.
5. Verificar correlación cruzada con la RI original > 0.9.

Si el álgebra está bien implementada, la correlación queda > 0.95 fácil. Si está < 0.9, hay bug — probablemente en la ubicación del pico o en el modo de convolución.

---

## 7. Lecturas recomendadas

- **Farina, A. (2000).** "Simultaneous measurement of impulse response and distortion with a swept-sine technique." 108th AES Convention. [PDF](https://www.angelofarina.it/Public/Papers/134-AES00.PDF) — el paper original que estableció este método.

- **Müller, S. & Massarani, P. (2001).** "Transfer-function measurement with sweeps." *Journal of the Audio Engineering Society*, 49(6). — generalización y discusión de tradeoffs vs MLS.

- **Stan, G.-B., Embrechts, J.-J. & Archambeau, D. (2002).** "Comparison of different impulse response measurement techniques." *Journal of the Audio Engineering Society*, 50(4). — comparación cuantitativa entre sweep, MLS y otros métodos.

- **ISO 3382-1:2009** — Norma internacional para medición de parámetros acústicos de salas. Define cómo procesar la RI una vez recuperada (lo que ven en M3).

- **Oppenheim, A. V., Schafer, R. W., & Buck, J. R. (1999).** *Discrete-Time Signal Processing*. Capítulos 2 y 3 — convolución, propiedades, dominio frecuencia. La referencia clásica de DSP.

---

**Última actualización:** Octubre 2026 · Material de cátedra · Señales y Sistemas (UNTREF)
