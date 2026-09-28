# Marco conceptual: la reverberación

Esta página explica el **fenómeno** que mide el TP y cómo se lo **modela con Señales y Sistemas**. Está pensada como una dinámica de preguntas: antes de leer cada respuesta, intentá responderla.

## 1. Escuchemos y observemos

Tenemos dos grabaciones de la misma fuente: una **anecoica** (sin sala) y otra en una **sala polideportiva**. Escuchalas sin mirar y después revelá la forma de onda; cambiá a *Dominio espectral* para comparar los espectros.

<div class="interactivo">
<div class="interactivo__barra"><strong>Interactivo · Escucha a ciegas</strong><a href="../interactivos/escucha.html" target="_blank" rel="noopener">Abrir en pantalla completa</a></div>
<iframe src="../interactivos/escucha.html" loading="lazy" title="Escucha a ciegas" allow="autoplay"></iframe>
</div>

!!! question "Para pensar"
    - ¿Qué diferencias escuchamos? ¿Y qué diferencias vemos en la forma de onda? ¿Cuánto dura cada señal?
    - ¿En qué bandas difieren los espectros?
    - ¿Qué sentido nos da más información, el oído o la vista? ¿Qué dominio, el tiempo o la frecuencia?
    - ¿Qué fenómeno físico estamos escuchando?

## 2. La reverberación: directo, reflexiones y cola

La **reverberación** es la suma del **sonido directo** y de las **reflexiones** en las superficies del recinto. El micrófono no recibe un único evento, sino una sucesión de llegadas: primero el sonido directo, después las primeras reflexiones y finalmente una cola densa que decae. Esa sucesión en el tiempo es el **ecograma**.

<div class="interactivo">
<div class="interactivo__barra"><strong>Interactivo · La sala: directo, reflexiones y cola</strong><a href="../interactivos/sala.html" target="_blank" rel="noopener">Abrir en pantalla completa</a></div>
<iframe src="../interactivos/sala.html" loading="lazy" title="La sala: directo, reflexiones y cola" allow="autoplay"></iframe>
</div>

Arrastrá el micrófono, cambiá la absorción de las paredes y escuchá el resultado. Compará la sala simulada con la **sala real** (respuesta medida) y con el **aire libre** (sin paredes: solo sonido directo).

!!! question "Para pensar"
    - ¿En qué tipo de recintos se da el fenómeno? ¿Qué pasa al aire libre?
    - ¿Cómo afectan los materiales, las personas y los objetos del recinto?
    - ¿Cómo adquirimos esta señal para estudiarla?

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
| **Linealidad** | Vale la superposición | No saturar ningún elemento de la cadena: por eso se ajustan los niveles |
| **Invariancia en el tiempo** | La sala no cambia durante la medición | Se puede repetir la medición y promediar |
| **Causalidad** | $h(t) = 0$ para $t < 0$ | Ninguna reflexión llega antes que el sonido directo |
| **Estabilidad** | $h(t)$ decae: las superficies absorben energía | Cómo decae es el **tiempo de reverberación** |

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

<div class="interactivo">
<div class="interactivo__barra"><strong>Interactivo · De la curva de caída a T30</strong><a href="../interactivos/caida.html" target="_blank" rel="noopener">Abrir en pantalla completa</a></div>
<iframe src="../interactivos/caida.html" loading="lazy" title="De la curva de caída a T30"></iframe>
</div>

Subí el ruido de fondo: si el piso de ruido no queda al menos 10 dB por debajo del punto de −35 dB de la curva, la integral de Schroeder se "levanta" y **T30 deja de ser válido**. En M3 lo controlan recortando la RI antes de integrar; el método de Lundeby, que estima ese punto de corte automáticamente, es opcional.

## 7. Qué hay que decidir para medir, y dónde lo resuelve el TP

| Pregunta | Dónde se resuelve |
|----------|-------------------|
| ¿Qué señal reproducimos? | M1: ruido rosa y sine sweep |
| ¿Los transductores son ideales? ¿Qué pasa con sus distorsiones? | M1: sine sweep + filtro inverso |
| ¿Qué fuente usamos y a qué nivel de SPL? | Medición in situ (paso 2) |
| ¿Cómo procesamos la señal? | M2: deconvolución y bandas de octava |
| ¿Cómo afecta el ruido a nuestras mediciones? | M3: Schroeder y recorte de la RI (Lundeby, opcional) |
| ¿Cómo estandarizamos el procedimiento (repetibilidad y reproducibilidad)? | ISO 3382: posiciones y repeticiones |

## 8. Cómo se mide en una sala real

La medición in situ no forma parte del TP, pero da contexto a cada función que van a construir:

1. **Ruido de fondo.** Con un sonómetro clase 1 ajustado, medir el Leq en 2 puntos de la sala, 3 repeticiones por punto, ponderación Z, slow, integración de 30 s. *Cadena: sala → micrófono → sonómetro.*
2. **Nivel de la fuente.** Con ruido rosa, ajustar la fuente a +45 dB sobre el ruido de fondo, medido a 1 m. Ajustar los niveles de reproducción y adquisición para evitar saturación. *Cadena: PC (ruido rosa) → amplificador → fuente → sonómetro a 1 m.*
3. **Medición.** 3 posiciones de micrófono por posición de fuente, respetando las distancias mínimas de la norma; 5 repeticiones por punto con sine sweep + filtro inverso. *Cadena: PC (sine sweep) → amplificador → fuente → sala → micrófono → PC (grabación).*

## 9. Cada módulo, una técnica de Señales y Sistemas

| Concepto de la materia | Qué resuelve en la medición | Función del TP | Milestone |
|------------------------|-----------------------------|----------------|-----------|
| Señales aleatorias, densidad espectral $1/f$ | Excitar todas las bandas con energía pareja por octava | `generar_ruido_rosa` | [M1](especificacion/m1_generacion.md) |
| Frecuencia instantánea, filtro inverso | Una excitación que separa la respuesta lineal de la distorsión | `generar_sine_sweep` | [M1](especificacion/m1_generacion.md) |
| Muestreo, DAC/ADC, sistemas en cascada | Emitir y grabar a la vez | `reproducir_y_grabar` | [M1](especificacion/m1_generacion.md) |
| Señales discretas, cuantización | Leer una grabación como un arreglo normalizado | `cargar_audio` | [M2](especificacion/m2_procesamiento.md) |
| Sistemas LTI, respuesta al impulso | Una RI sintética con $T_{60}$ conocido para validar | `sintetizar_ri` | [M2](especificacion/m2_procesamiento.md) |
| Convolución, delta, asociatividad | Recuperar $h(t)$ a partir de la grabación | `obtener_ri_desde_sweep` | [M2](especificacion/m2_procesamiento.md) |
| Filtros LTI (Butterworth, IEC 61260) | Analizar la sala por bandas de octava | `filtro_octava` | [M2](especificacion/m2_procesamiento.md) |
| Escala logarítmica | Expresar niveles en dB | `a_escala_log` | [M2](especificacion/m2_procesamiento.md) |
| Señal analítica, transformada de Hilbert | Envolvente de $h(t)$ | `suavizar_signal` | [M3](especificacion/m3_producto_final.md) |
| Energía, integración | Curva de decaimiento (Schroeder) | `integral_schroeder` | [M3](especificacion/m3_producto_final.md) |
| Mínimos cuadrados | Pendiente de la curva: T30, T20, EDT | `regresion_lineal` | [M3](especificacion/m3_producto_final.md) |
| Energía en ventanas temporales | Parámetros por banda: EDT, T20, T30, D50, C80 | `calcular_parametros_acusticos` | [M3](especificacion/m3_producto_final.md) |
| El sistema completo | Automatizar la medición y obtener datos | API REST | [M3](especificacion/m3_producto_final.md) |

## 10. Cómo se baja un problema complejo

1. **Observar** el fenómeno físico: la reverberación.
2. **Modelarlo** con Señales y Sistemas: la sala es un sistema LTI, $y = x * h$.
3. **Descomponer** la medición en módulos: una cadena de sistemas.
4. **Resolver cada módulo** con una técnica de procesamiento digital de señales.
5. **Encadenar** los módulos en un software.
6. **Automatizar** la medición para obtener datos según la norma (ISO 3382).

El TP es un caso de aplicación: el mismo método sirve para cualquier problema de ingeniería de sonido que se pueda modelar como señales que atraviesan sistemas.

<small>Audios: OpenAIR Library (grabación anecoica y Sports Centre, University of York). Criterio del piso de ruido: NTi Audio. Contenido basado en la presentación conceptual de la cátedra.</small>
