# Marco conceptual: la reverberación

Esta página explica el **fenómeno** que mide el TP y cómo se lo **modela con Señales y Sistemas**. Está pensada como una dinámica de preguntas: antes de leer cada respuesta, intentá responderla.

## 1. Escuchemos y observemos

Tenemos dos grabaciones de la misma fuente: una **anecoica** (sin sala) y otra en una **sala polideportiva**. Abrí el interactivo, escuchalas sin mirar y después revelá la forma de onda; cambiá a *Dominio espectral* para comparar los espectros.

<a class="interactivo-enlace" href="../interactivos/escucha.html" target="_blank" rel="noopener"><span class="interactivo-enlace__tag">Interactivo</span><span class="interactivo-enlace__info"><strong>Escucha a ciegas</strong><span>La misma fuente con y sin sala: escuchala y comparala en tiempo y en frecuencia. Se abre en una pestaña nueva.</span></span><span class="interactivo-enlace__flecha"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg></span></a>

Las preguntas **para pensar** están dentro del interactivo, al lado de lo que se escucha y se ve.

## 2. La reverberación: directo, reflexiones y cola

La **reverberación** es la suma del **sonido directo** y de las **reflexiones** en las superficies del recinto. El micrófono no recibe un único evento, sino una sucesión de llegadas: primero el sonido directo, después las primeras reflexiones y finalmente una cola densa que decae. Esa sucesión en el tiempo es el **ecograma**.

<a class="interactivo-enlace" href="../interactivos/sala.html" target="_blank" rel="noopener"><span class="interactivo-enlace__tag">Interactivo</span><span class="interactivo-enlace__info"><strong>La sala: directo, reflexiones y cola</strong><span>Simulación 3D por fuentes imagen: ecograma y auralización. Se abre en una pestaña nueva.</span></span><span class="interactivo-enlace__flecha"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg></span></a>

Arrastrá el micrófono, cambiá la absorción de las paredes y escuchá el resultado. Compará la sala simulada con la **sala real** (respuesta medida) y con el **aire libre** (sin paredes: solo sonido directo).

Las preguntas **para pensar** están dentro del interactivo.

**Resumen.** La reverberación es un fenómeno físico propio de los recintos cerrados: la suma del sonido directo y de las reflexiones. La percibimos con buena sensibilidad, pero de oído no podemos cuantificarla ni separar sus componentes. Necesitamos un **transductor electroacústico** para captarla y estudiarla en los dominios **temporal** y **espectral**.

## 3. ¿Para qué medirla?

La reverberación modifica el sonido de la fuente y le agrega características propias del recinto. A veces ayuda (la música en una sala de conciertos) y a veces perjudica (la inteligibilidad de la palabra en un aula). Para **evaluarla** hay que **cuantificarla**: energía, potencia, valores máximo y mínimo y, sobre todo, **cómo decae el nivel en el tiempo**.

## 4. La sala es un sistema

Acá está el paso clave: pasamos de un fenómeno físico a un **modelo de Señales y Sistemas**. Si $x(t)$ es lo que emite la fuente e $y(t)$ lo que capta el micrófono, la sala es un sistema con respuesta al impulso $h(t)$:

$$
y(t) = (x * h)(t) \quad\Longleftrightarrow\quad Y(f) = X(f)\,H(f)
$$

Si el sistema es **lineal e invariante en el tiempo (LTI)**, $h(t)$ lo caracteriza por completo: **medir la sala es medir su respuesta al impulso**. Todos los parámetros de la ISO 3382 se calculan a partir de $h(t)$. Las propiedades que vimos en clase tienen consecuencias concretas en la medición:

| Propiedad | Qué significa en la sala | Consecuencia práctica |
|-----------|--------------------------|-----------------------|
| **Linealidad** <button type="button" class="definicion-boton" popovertarget="def-linealidad" aria-label="Definición de linealidad" title="Definición">?</button> | Vale la superposición | No saturar ningún elemento de la cadena: por eso se ajustan los niveles |
| **Invariancia en el tiempo** <button type="button" class="definicion-boton" popovertarget="def-invariancia" aria-label="Definición de invariancia en el tiempo" title="Definición">?</button> | La sala no cambia durante la medición | Se puede repetir la medición y promediar |
| **Causalidad** <button type="button" class="definicion-boton" popovertarget="def-causalidad" aria-label="Definición de causalidad" title="Definición">?</button> | $h(t) = 0$ para $t < 0$ | Ninguna reflexión llega antes que el sonido directo |
| **Estabilidad** <button type="button" class="definicion-boton" popovertarget="def-estabilidad" aria-label="Definición de estabilidad" title="Definición">?</button> | $h(t)$ decae: las superficies absorben energía | Cómo decae es el **tiempo de reverberación** |

Tocá el **?** de cada propiedad para ver su definición.

<div id="def-linealidad" popover="auto" class="definicion" markdown="1">
<p class="definicion__titulo">Linealidad</p>

Un sistema $T$ es **lineal** si cumple el **principio de superposición**: para cualquier par de entradas $x_1(t)$, $x_2(t)$ y constantes $a$, $b$,

$$T\{a\,x_1(t) + b\,x_2(t)\} = a\,T\{x_1(t)\} + b\,T\{x_2(t)\}$$

Reúne dos propiedades: **aditividad** (la respuesta a una suma es la suma de las respuestas) y **homogeneidad** (escalar la entrada escala la salida en la misma proporción).

<button type="button" class="definicion__cerrar" popovertarget="def-linealidad" popovertargetaction="hide">Cerrar</button>
</div>

<div id="def-invariancia" popover="auto" class="definicion" markdown="1">
<p class="definicion__titulo">Invariancia en el tiempo</p>

Un sistema es **invariante en el tiempo** si un corrimiento de la entrada solo corre la salida, sin cambiarla: si $y(t) = T\{x(t)\}$, entonces para todo $t_0$

$$T\{x(t - t_0)\} = y(t - t_0)$$

El sistema se comporta igual hoy que dentro de un rato: sus parámetros no cambian con el tiempo.

<button type="button" class="definicion__cerrar" popovertarget="def-invariancia" popovertargetaction="hide">Cerrar</button>
</div>

<div id="def-causalidad" popover="auto" class="definicion" markdown="1">
<p class="definicion__titulo">Causalidad</p>

Un sistema es **causal** si la salida en un instante $t$ depende solo de la entrada en ese instante y en los anteriores ($\tau \leq t$), nunca de valores futuros.

Para un sistema LTI, esto equivale a que la respuesta al impulso sea nula antes de que llegue el impulso:

$$h(t) = 0 \quad \text{para} \quad t < 0$$

<button type="button" class="definicion__cerrar" popovertarget="def-causalidad" popovertargetaction="hide">Cerrar</button>
</div>

<div id="def-estabilidad" popover="auto" class="definicion" markdown="1">
<p class="definicion__titulo">Estabilidad (BIBO)</p>

Un sistema es **estable** en sentido BIBO (*bounded input, bounded output*) si toda entrada acotada produce una salida acotada:

$$|x(t)| \leq M_x < \infty \;\Rightarrow\; |y(t)| \leq M_y < \infty$$

Para un sistema LTI, esto equivale a que la respuesta al impulso sea absolutamente integrable:

$$\int_{-\infty}^{\infty} |h(t)|\,dt < \infty$$

<button type="button" class="definicion__cerrar" popovertarget="def-estabilidad" popovertargetaction="hide">Cerrar</button>
</div>

## 5. La medición es una cadena de sistemas

Entre la señal que generamos y la que grabamos hay varios sistemas en cascada. Cada uno es un **módulo** que se puede estudiar por separado:

**PC** (genera $x[n]$) → **DAC** → **amplificador** → **parlante** → **sala** → **micrófono** → **ADC** → **PC** (graba $y[n]$)

$$
y = x * h_\text{DAC} * h_\text{amp} * h_\text{parl} * h_\text{sala} * h_\text{mic} * h_\text{ADC} = x * h_\text{total}
$$

Por **asociatividad y conmutatividad de la convolución**, toda la cadena equivale a un único sistema $h_\text{total}$. Si los transductores son aproximadamente ideales en la banda de interés ($h_i \approx \delta$), entonces $h_\text{total} \approx h_\text{sala}$. Lo que no es ideal también se resuelve con Señales y Sistemas: la distorsión del parlante queda separada en el tiempo con el **sine sweep y su filtro inverso** (M1-M2), y el ruido de fondo se controla en el cálculo (M3).

## 6. Tiempo de reverberación: de la curva de caída a T30

!!! quote "Definiciones"
    **ISO 354:** *es el tiempo necesario para que el nivel de presión sonora disminuya 60 dB después del cese de la fuente.*

    **ISO 3382 (T30):** *es el tiempo, expresado en segundos, que se requiere para que el nivel de presión sonora disminuya en 60 dB, calculado sobre una recta obtenida de la regresión lineal por mínimos cuadrados de una curva de caída medida desde un nivel 5 dB por debajo del nivel inicial, hasta un nivel de 30 dB inferior a dicho nivel* (UNE-EN ISO 3382, 2010).

<a class="interactivo-enlace" href="../interactivos/caida.html" target="_blank" rel="noopener"><span class="interactivo-enlace__tag">Interactivo</span><span class="interactivo-enlace__info"><strong>De la curva de caída a T30</strong><span>Integral de Schroeder, regresión y el efecto del ruido de fondo. Se abre en una pestaña nueva.</span></span><span class="interactivo-enlace__flecha"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg></span></a>

Subí el ruido de fondo: si el piso de ruido no queda al menos 10 dB por debajo del punto de −35 dB de la curva, la integral de Schroeder se "levanta" y **T30 deja de ser válido**. En M3 lo controlan recortando la RI antes de integrar; el método de Lundeby, que estima ese punto de corte automáticamente, es opcional.

## 7. Cada pregunta de la medición, una técnica de Señales y Sistemas

Para medir hay que resolver una serie de preguntas. Cada una se responde con un concepto de la materia, y ese concepto se convierte en un **servicio** de la API:

| Pregunta de la medición | Concepto de Señales y Sistemas | Servicio | Milestone |
|-------------------------|--------------------------------|----------|-----------|
| ¿Con qué señal excitamos la sala? | Señales aleatorias, densidad espectral $1/f$: energía pareja por octava | `generate_pink_noise` | [M1](especificacion/m1_generacion.md) |
| ¿Cómo separamos la sala de las distorsiones del parlante? | Frecuencia instantánea, filtro inverso | `generate_sine_sweep_pair` | [M1](especificacion/m1_generacion.md) |
| ¿Cómo emitimos y grabamos a la vez? | Muestreo, DAC/ADC, sistemas en cascada | `play_and_record` | [M1](especificacion/m1_generacion.md) |
| ¿Qué fuente usamos y a qué nivel? | Relación señal/ruido (+45 dB sobre el ruido de fondo) | — | Medición in situ (paso 2) |
| ¿Cómo leemos la grabación? | Señales discretas, cuantización | `load_audio` | [M2](especificacion/m2_procesamiento.md) |
| ¿Cómo validamos sin ir a medir? | Sistemas LTI: una RI sintética con $T_{60}$ conocido | `generate_synthetic_ir` | [M2](especificacion/m2_procesamiento.md) |
| ¿Cómo obtenemos $h(t)$ a partir de la grabación? | Convolución, delta, asociatividad | `get_impulse_response` | [M2](especificacion/m2_procesamiento.md) |
| ¿Cómo analizamos la sala por bandas? | Filtros LTI (Butterworth, IEC 61260) | `filter_single_band` | [M2](especificacion/m2_procesamiento.md) |
| ¿Cómo expresamos los niveles? | Escala logarítmica (dB) | `logarithmic_scale_conversion` | [M2](especificacion/m2_procesamiento.md) |
| ¿Cómo vemos cómo decae la energía? | Señal analítica, transformada de Hilbert (envolvente) | `apply_smoothing` | [M3](especificacion/m3_producto_final.md) |
| ¿Cómo obtenemos una curva de caída limpia? | Energía, integración (Schroeder) | `apply_schroeder_integral` | [M3](especificacion/m3_producto_final.md) |
| ¿Cómo afecta el ruido a la medición? | Estimación del piso de ruido y recorte de la integral | `apply_lundeby` (opcional) | [M3](especificacion/m3_producto_final.md) |
| ¿Cuánto tarda en caer 60 dB? | Mínimos cuadrados: pendiente de la curva (T30, T20, EDT) | `linear_regression` | [M3](especificacion/m3_producto_final.md) |
| ¿Qué parámetros entregamos? | Energía en ventanas temporales: EDT, T20, T30, D50, C80 | `calculate_parameters_from_ir` | [M3](especificacion/m3_producto_final.md) |
| ¿Cómo estandarizamos el procedimiento? | Repetibilidad y reproducibilidad (ISO 3382): posiciones y repeticiones | — | Medición in situ (paso 3) |
| ¿Cómo lo automatizamos? | El sistema completo, módulo por módulo | API REST: cada milestone expone lo suyo | [M1](especificacion/m1_generacion.md) → [M3](especificacion/m3_producto_final.md) |

## 8. Cómo se mide en una sala real

La medición in situ no forma parte del TP, pero da contexto a cada servicio que van a construir:

1. **Ruido de fondo.** Con un sonómetro clase 1 ajustado, medir el Leq en 2 puntos de la sala, 3 repeticiones por punto, ponderación Z, slow, integración de 30 s. *Cadena: sala → micrófono → sonómetro.*
2. **Nivel de la fuente.** Con ruido rosa, ajustar la fuente a +45 dB sobre el ruido de fondo, medido a 1 m. Ajustar los niveles de reproducción y adquisición para evitar saturación. *Cadena: PC (ruido rosa) → amplificador → fuente → sonómetro a 1 m.*
3. **Medición.** 3 posiciones de micrófono por posición de fuente, respetando las distancias mínimas de la norma; 5 repeticiones por punto con sine sweep + filtro inverso. *Cadena: PC (sine sweep) → amplificador → fuente → sala → micrófono → PC (grabación).*

## 9. Cómo se baja un problema complejo

1. **Observar** el fenómeno físico: la reverberación.
2. **Modelarlo** con Señales y Sistemas: la sala es un sistema LTI, $y = x * h$.
3. **Descomponer** la medición en módulos: una cadena de sistemas.
4. **Resolver cada módulo** con una técnica de procesamiento digital de señales.
5. **Encadenar** los módulos en un software.
6. **Automatizar** la medición para obtener datos según la norma (ISO 3382).

El TP es un caso de aplicación: el mismo método sirve para cualquier problema de ingeniería de sonido que se pueda modelar como señales que atraviesan sistemas.

<small>Audios: OpenAIR Library (grabación anecoica y Sports Centre, University of York). Criterio del piso de ruido: NTi Audio. Contenido basado en la presentación conceptual de la cátedra.</small>
