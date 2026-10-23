## Videos recomendados — 3Blue1Brown

Videos cortos de [3Blue1Brown](https://www.youtube.com/@3blue1brown) que muestran en animación los conceptos que usamos en clase y en el TP. **Son opcionales**: sirven para afianzar la intuición antes o después de cada clase. Varios tienen **audio en español**: en el reproductor, ⚙️ → *Pista de audio*.

Cada card indica, en **En el curso**, dónde aparece ese concepto en el material.

### Clase 7 · Sistemas

<div class="grid cards videos-3b1b" markdown>

-   ![Miniatura: The Physics of Euler's Formula](https://img.youtube.com/vi/-j8PzkZ70Lg/hqdefault.jpg){ .miniatura loading=lazy }

    :material-rotate-orbit:{ .lg .middle } __La física de la fórmula de Euler__

    ---

    Por qué las exponenciales complejas $e^{st}$ describen oscilaciones que crecen o decaen: el preludio a Laplace.

    [:material-play-circle: Ver video](https://www.youtube.com/watch?v=-j8PzkZ70Lg){ .md-button target="_blank" rel="noopener" }

    **En el curso:** [Clase 7 · §2.4 Estabilidad](https://github.com/maxiyommi/signal-systems/blob/master/clases/clase_07/contenido.py#L353) · [Clase 9 · §1 Idea fundamental de la DFT](https://github.com/maxiyommi/signal-systems/blob/master/clases/clase_09/contenido.py#L47) · [M2 · Servicio 3: RI sintética con $e^{-\alpha t}$](../trabajo_practico/especificacion/m2_procesamiento.md#servicio-3-generate_synthetic_irduration-t60_values-fs)

-   ![Miniatura: But what is a Laplace Transform?](https://img.youtube.com/vi/j0wJBEZdwLs/hqdefault.jpg){ .miniatura loading=lazy }

    :material-math-integral:{ .lg .middle } __¿Qué es la transformada de Laplace?__

    ---

    Cómo una señal se descompone en exponenciales complejas y por qué eso simplifica el análisis de sistemas LTI.

    [:material-play-circle: Ver video](https://www.youtube.com/watch?v=j0wJBEZdwLs){ .md-button target="_blank" rel="noopener" }

    **En el curso:** [Clase 7 · §3 Sistemas LTI](https://github.com/maxiyommi/signal-systems/blob/master/clases/clase_07/contenido.py#L432) · [Marco conceptual · §4 La sala es un sistema](../trabajo_practico/marco_conceptual.md#4-la-sala-es-un-sistema)

</div>

### Clase 8 · Convolución

<div class="grid cards videos-3b1b" markdown>

-   ![Miniatura: But what is a convolution?](https://img.youtube.com/vi/KuXjwB4LzSA/hqdefault.jpg){ .miniatura loading=lazy }

    :material-sigma:{ .lg .middle } __¿Qué es una convolución?__

    ---

    La convolución discreta como ventana deslizante y por qué se calcula mucho más rápido con la FFT.

    [:material-play-circle: Ver video](https://www.youtube.com/watch?v=KuXjwB4LzSA){ .md-button target="_blank" rel="noopener" }

    **En el curso:** [Clase 8 · §1 Definición](https://github.com/maxiyommi/signal-systems/blob/master/clases/clase_08/contenido.py#L43) · [Clase 8 · §3 Convolución vía FFT](https://github.com/maxiyommi/signal-systems/blob/master/clases/clase_08/contenido.py#L358) · [M2 · Servicio 4: `get_impulse_response`](../trabajo_practico/especificacion/m2_procesamiento.md#servicio-4-get_impulse_responserecording-inverse_filter) · [El álgebra de la deconvolución · §5](../trabajo_practico/especificacion/m2_algebra_deconvolucion.md#5-por-que-la-convolucion-es-conmutativa-y-asociativa)

-   ![Miniatura: Convolutions | Why X+Y in probability is a beautiful mess](https://img.youtube.com/vi/IaSGqQa5O-M/hqdefault.jpg){ .miniatura loading=lazy }

    :material-chart-bell-curve-cumulative:{ .lg .middle } __Convoluciones: el caso continuo__

    ---

    La convolución como integral, vista a través de la suma de variables aleatorias.

    [:material-play-circle: Ver video](https://www.youtube.com/watch?v=IaSGqQa5O-M){ .md-button target="_blank" rel="noopener" }

    **En el curso:** [Clase 8 · §2 Propiedades](https://github.com/maxiyommi/signal-systems/blob/master/clases/clase_08/contenido.py#L188) · [El álgebra de la deconvolución · §5 (integrales)](../trabajo_practico/especificacion/m2_algebra_deconvolucion.md#5-por-que-la-convolucion-es-conmutativa-y-asociativa)

</div>

### Clase 9 · Frecuencia y filtros

<div class="grid cards videos-3b1b" markdown>

-   ![Miniatura: ¿Qué es la transformada de Fourier?](https://img.youtube.com/vi/spUNpyF58BY/hqdefault.jpg){ .miniatura loading=lazy }

    :material-waveform:{ .lg .middle } __¿Qué es la transformada de Fourier? Una introducción visual__

    ---

    De la señal en el tiempo a su espectro: qué frecuencias tiene y con qué peso.

    [:material-play-circle: Ver video](https://www.youtube.com/watch?v=spUNpyF58BY){ .md-button target="_blank" rel="noopener" }

    **En el curso:** [Clase 9 · §1 DFT/FFT](https://github.com/maxiyommi/signal-systems/blob/master/clases/clase_09/contenido.py#L45) · [M2 · Servicio 2: `filter_single_band`](../trabajo_practico/especificacion/m2_procesamiento.md#servicio-2-filter_single_bandsignal-fs-center_freq-order) · [El álgebra de la deconvolución · En frecuencia](../trabajo_practico/especificacion/m2_algebra_deconvolucion.md#la-forma-facil-de-verlo-en-frecuencia)

-   ![Miniatura: But what is a Fourier series?](https://img.youtube.com/vi/r6sGWTCMz2k/hqdefault.jpg){ .miniatura loading=lazy }

    :material-sine-wave:{ .lg .middle } __¿Qué es una serie de Fourier?__

    ---

    Cómo cualquier señal periódica se arma sumando senoidales (y círculos que giran).

    [:material-play-circle: Ver video](https://www.youtube.com/watch?v=r6sGWTCMz2k){ .md-button target="_blank" rel="noopener" }

    **En el curso:** [Clase 6 · §3.2 Acorde (suma de senoidales)](https://github.com/maxiyommi/signal-systems/blob/master/clases/clase_06/contenido.py#L347) · [Clase 9 · §1 Idea fundamental](https://github.com/maxiyommi/signal-systems/blob/master/clases/clase_09/contenido.py#L47) · [M1 · Generación de señales](../trabajo_practico/especificacion/m1_generacion.md)

-   ![Miniatura: The more general uncertainty principle](https://img.youtube.com/vi/MBnnXbOM5S4/hqdefault.jpg){ .miniatura loading=lazy }

    :material-blur:{ .lg .middle } __El principio de incertidumbre, más general__

    ---

    Por qué no se puede tener a la vez buena resolución en tiempo y en frecuencia.

    [:material-play-circle: Ver video](https://www.youtube.com/watch?v=MBnnXbOM5S4){ .md-button target="_blank" rel="noopener" }

    **En el curso:** [Clase 9 · §2 Ventanas y fuga espectral](https://github.com/maxiyommi/signal-systems/blob/master/clases/clase_09/contenido.py#L277) · [Clase 9 · §3 Espectrogramas](https://github.com/maxiyommi/signal-systems/blob/master/clases/clase_09/contenido.py#L348) · [Clase 10 · §2 Compromiso suavidad vs. detalle](https://github.com/maxiyommi/signal-systems/blob/master/clases/clase_10/contenido.py#L132)

</div>
