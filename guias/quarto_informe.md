# Guía de Quarto — Documentos técnicos

!!! warning "2.º cuatrimestre 2026"
    Este cuatrimestre **no hay informe escrito**. La validación y los resultados del TP van en el README del repositorio del grupo (ver [Validación y resultados en el README](../trabajo_practico/especificacion/m3_producto_final.md#validacion-y-resultados-en-el-readme)). Esta guía queda como **referencia opcional** por si querés usar Quarto para documentar resultados o notebooks.

## ¿Qué es Quarto?

Quarto es un sistema de publicación científica que permite escribir documentos técnicos en Markdown con soporte completo de LaTeX math, bloques de código, y múltiples formatos de salida (PDF, HTML, Word).

Es una herramienta **opcional**: sirve, por ejemplo, para documentar resultados de mediciones, armar un reporte a partir de un notebook o publicar un análisis en HTML. No es un entregable del TP.

---

## Instalación

Descargar desde [quarto.org/docs/get-started](https://quarto.org/docs/get-started/)

```bash
# Verificar
quarto --version

# Necesitás también una distribución LaTeX para PDF:
quarto install tinytex
```

---

## Estructura básica de un documento

Crear un archivo `resultados.qmd` (ejemplo de documento técnico):

```markdown
---
title: "AcoustiPy: Software para Cálculo de Parámetros Acústicos ISO 3382"
author:
  - name: "Nombre Apellido"
    affiliation: "UNTREF — Ingeniería de Sonido"
  - name: "Nombre Apellido"
    affiliation: "UNTREF — Ingeniería de Sonido"
date: today
format:
  pdf:
    documentclass: article
    geometry:
      - margin=2.5cm
    fontsize: 11pt
    number-sections: true
    toc: true
    toc-depth: 2
    bibliography: referencias.bib
    csl: ieee.csl
lang: es
abstract: |
  Este trabajo presenta el desarrollo de AcoustiPy, un software modular
  en Python para el cálculo de parámetros acústicos según la norma ISO 3382.
  Se implementaron funciones para generación de señales de excitación,
  procesamiento de respuestas al impulso y cálculo de tiempos de reverberación...
---

## Introducción

El análisis acústico de recintos cerrados requiere la medición y procesamiento
de respuestas al impulso (RI) para determinar parámetros como el tiempo de
reverberación ($T_{60}$), la claridad ($C_{80}$) y la definición ($D_{50}$).

## Marco Teórico

### Respuesta al Impulso

Un sistema LTI queda completamente caracterizado por su respuesta al impulso
$h(t)$. La salida del sistema ante una entrada $x(t)$ se obtiene mediante
la convolución:

$$y(t) = x(t) * h(t) = \int_{-\infty}^{\infty} x(\tau) h(t - \tau) d\tau$$

### Integral de Schroeder

La curva de decaimiento energético se calcula mediante la integral de Schroeder
[@schroeder1965]:

$$EDC(t) = \int_{t}^{\infty} h^2(\tau) d\tau$$

## Desarrollo Experimental

### Generación de Señales

Se implementó la generación de ruido rosa mediante el algoritmo
Voss-McCartney y sine sweep logarítmico:

```{python}
#| label: fig-sweep
#| fig-cap: "Sine sweep logarítmico de 20 Hz a 20 kHz"
import numpy as np
import matplotlib.pyplot as plt

fs = 44100
duracion = 5
t = np.linspace(0, duracion, fs * duracion)
f1, f2 = 20, 20000
sweep = np.sin(2 * np.pi * f1 * duracion / np.log(f2/f1) * (np.exp(t/duracion * np.log(f2/f1)) - 1))

fig, ax = plt.subplots(figsize=(8, 3))
ax.plot(t[:4410], sweep[:4410])
ax.set_xlabel("Tiempo [s]")
ax.set_ylabel("Amplitud")
ax.grid(True)
plt.tight_layout()
plt.show()
```

### Resultados

| Recinto | $T_{60}$ (medido) | $T_{60}$ (REW) | Error |
|---------|-------------------|-----------------|-------|
| Aula A  | 1.23 s            | 1.21 s          | 0.02 s |
| Sala B  | 2.45 s            | 2.48 s          | 0.03 s |

: Comparación de resultados con software comercial {#tbl-resultados}

## Conclusiones

El software desarrollado permite calcular parámetros acústicos con un error
inferior a ±0.5 s respecto al software comercial de referencia...

## Referencias

::: {#refs}
:::
```

---

## Compilar el documento

```bash
# Generar PDF
quarto render resultados.qmd --to pdf

# Generar HTML
quarto render resultados.qmd --to html

# Preview en vivo (se actualiza al guardar)
quarto preview resultados.qmd
```

---

## Fórmulas LaTeX

### Inline
```markdown
El tiempo de reverberación $T_{60}$ se define como...
```

### Bloque
```markdown
$$T_{60} = \frac{-60}{\text{pendiente (dB/s)}}$$
```

### Fórmulas comunes del TP

```markdown
Sine sweep logarítmico:
$$x(t) = \sin\left(\frac{2\pi f_1 T}{\ln(f_2/f_1)} \left(e^{t \ln(f_2/f_1)/T} - 1\right)\right)$$

Integral de Schroeder:
$$EDC(t) = \int_{t}^{\infty} h^2(\tau) d\tau \approx \sum_{n=N_t}^{N} h^2[n]$$

Tiempo de reverberación:
$$T_{60} = \frac{-60}{m}$$

donde $m$ es la pendiente de la regresión lineal sobre la EDC en dB.

Claridad ($C_{80}$):
$$C_{80} = 10 \log_{10} \frac{\int_0^{80\text{ms}} h^2(t) dt}{\int_{80\text{ms}}^{\infty} h^2(t) dt} \text{ [dB]}$$

Definición ($D_{50}$):
$$D_{50} = \frac{\int_0^{50\text{ms}} h^2(t) dt}{\int_0^{\infty} h^2(t) dt} \times 100 \text{ [\%]}$$
```

---

## Código embebido

### Ejecutar y mostrar código + resultado
```markdown
​```{python}
#| label: fig-ejemplo
#| fig-cap: "Respuesta al impulso"
import numpy as np
import matplotlib.pyplot as plt

# Tu código aquí
plt.show()
​```
```

### Solo mostrar código (sin ejecutar)
```markdown
​```python
def mi_funcion():
    pass
​```
```

### Ejecutar sin mostrar código
```markdown
​```{python}
#| echo: false
resultado = calcular_algo()
​```
```

---

## Referencias bibliográficas

### Crear archivo `referencias.bib`
```bibtex
@article{schroeder1965,
  title={New method of measuring reverberation time},
  author={Schroeder, Manfred R},
  journal={The Journal of the Acoustical Society of America},
  volume={37},
  number={3},
  pages={409--412},
  year={1965}
}

@standard{iso3382,
  title={Acoustics -- Measurement of room acoustic parameters},
  organization={International Organization for Standardization},
  number={ISO 3382-1:2009},
  year={2009}
}
```

### Citar en el texto
```markdown
Según Schroeder [@schroeder1965], la integral de decaimiento...
La norma ISO 3382 [@iso3382] establece...
```

---

## Figuras con referencias cruzadas

```markdown
Como se observa en la @fig-sweep, el sine sweep cubre...
Los resultados se resumen en la @tbl-resultados.
```

---

## Estructura sugerida (uso opcional)

Si querés documentar resultados o notebooks con Quarto, una organización posible es:

```
docs_quarto/
├── resultados.qmd       # Documento principal
├── referencias.bib      # Bibliografía
├── figuras/             # Imágenes exportadas
│   ├── arquitectura.png
│   ├── espectro_rosa.png
│   └── comparacion_rew.png
└── _quarto.yml          # Configuración (opcional)
```

---

## Comparación con LaTeX puro

| Aspecto | Quarto | LaTeX puro |
|---------|--------|------------|
| Sintaxis | Markdown (simple) | LaTeX (verboso) |
| Curva de aprendizaje | Baja | Alta |
| Fórmulas | Mismo LaTeX | Nativo |
| Código ejecutable | Sí (Python, R, Julia) | No (solo mostrar) |
| Output | PDF, HTML, Word, slides | PDF |
| Editor | Cualquier editor de texto | Overleaf, Texmaker |
| Calidad PDF | Alta (usa LaTeX internamente) | Alta |

Ambas herramientas sirven para documentos técnicos (por ejemplo, informes de otras materias o de un proyecto final). Quarto suele ser más simple para empezar; si ya tenés experiencia con LaTeX, usarlo directamente es igual de válido.

---

## Recursos

- [Documentación oficial de Quarto](https://quarto.org/docs/guide/)
- [Quarto para PDF](https://quarto.org/docs/output-formats/pdf-basics.html)
- [Gallery de ejemplos](https://quarto.org/docs/gallery/)
- [Tutorial en español](https://quarto.org/docs/get-started/hello/text-editor.html)
