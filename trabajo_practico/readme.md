# Trabajo práctico - Desarrollo de software para el cálculo de parámetros acústicos ISO 3382

## Objetivo general
El siguiente trabajo propone realizar un software modular que permita el cálculo de parámetros acústicos propuestos en la normativa ISO 3382 (UNE-EN ISO 3382, 2010). Un sistema íntegro que contemple todos los elementos necesarios para una medición in-situ.

## Objetivos particulares
Los alumnos adquirirán las siguientes habilidades:

* Desarrollo de funciones para:
    * Generación y reproducción de ruido rosa.
    * Generación y reproducción de sine sweep.
    * Adquisición de la RI.
    * Procesamiento de las RI.
* Adquirir las capacidades de interpretar los lineamientos de una normativa.
* Autonomía en la lectura del material dispuesto por los docentes.
* Autoevaluación de todo el material desarrollado.
* Presentación de avances.
* **Los resultados optenidos no deben diferir en más de ±0.5 s de los arrojados por algún software comercial.**
* Documentar (en [LaTeX](https://www.latex-project.org/)) el procedimiento de medición y diseño de scripts.

## Consigna
La siguiente [presentación](https://docs.google.com/presentation/d/1XJAI0wFRRS6IaVops3jCAcfdRxvMJyQs_mIetzehh1c/edit?usp=sharing) tiene el detalle de la consigna del TP.

## Material
Todo el material necesario para elaborar el TP se encuentra en la siguiente [carpeta](https://drive.google.com/drive/folders/1unNETr7js3hWZtuxa7-5uV9wns9KdTdT?usp=share_link).

## Entregas
Realizar un trabajo práctico que cumpla con las tres etapas de entrega resumidas en la siguiente tabla, en **grupos reducidos de 3 a 4 integrantes (excluyente). Los envios se realizan por mail/slack y se deben presentar antes del dia definido para las entregas (como figura en el calendario)**.

<table>
	<tr>
		<th>N° de entrega</th>
		<th>Función</th>
		<th>Uso</th>
        <th>Test</th>
 	</tr>
 	<tr>
  		<td rowspan="3"><a href="noteboks/primer_entrega.ipynb">1° entrega</a></td>
   		<td>Función de sintetización de ruido rosa</td>
		<td>Se utiliza para ajustar el nivel de la fuente al menos a 45 dB por encima del nivel de ruido de fondo en la banda de frecuencia correspondiente</td>
   		<td rowspan="3" style="text-align:left"><ul><li>Corroborar que ambas funciones (Ruido rosa - Sine sweep logarítmico + Filtro
            inverso) se comportan adecuadamente utilizando, por ejemplo el software Audacity, para ver sus respectivos espectros.
        </li><li>Convolucionar un sine sweep logarítmico generado y su respectivo filtro inverso y estudiar resultados.</li><li>Reproducir y grabar de manera simultánea.</li></ul>
        </td>
 	</tr>
	<tr>
  		<td>Función de generación de sine sweep logarítmico + filtro inverso</td>
   		<td>Se utiliza para obtener la respuesta al impulso a partir del sine sweep logarítmico</td>
 	</tr>
	<tr>
  		<td>Adquisición y reproducción</td>
   		<td>Se utiliza para adquirir y reproducir las señales durante una medición in-situ.</td>
 	</tr>
    <tr>
  		<td rowspan="5"><a href="noteboks/segunda_entrega.ipynb">2° entrega</a></td>
   		<td>Función de carga de archivos de audio (dataset)</td>
		<td>Se utiliza para administrar información al software y evaluar los parámetros acústicos ISO 3382 de dichos audios</td>
   		<td rowspan="5" style="text-align:left"><ul><li>Verificar el espectro de los filtros generados, utilizando scipy.</li><li>Obtener respuesta al impulso a partir de los 
            sine sweep y el filtro inverso descargados (dataset).</li>
            <li>Evaluar las respuestas al impulso sintetizadas, las respuesta al impulso generadas y sine sweep, con algún programa comercial</li></ul>
        </td>	
 	</tr>
	<tr>
  		<td>Función de sintetización de respuesta al impulso</td>
   		<td>Se utiliza evaluar el algoritmo con una señal conocida</td>
 	</tr>
    <tr>
  		<td>Función obtener respuesta al impulso</td>
   		<td>Se utiliza para obtener la respuesta al impulso a partir del sine sweep logarítmico</td>
 	</tr>
	<tr>
  		<td>Función filtros norma IEC 61260</td>
   		<td>La función filtros norma IEC 61260 es útil para filtrar la respuesta al impulso y calcular los parámetros acústicos por frecuencia</td>
 	</tr>
    <tr>
        <td>Función conversión a escala logarítmica normalizada</td>
		<td>Se utiliza para visualizar la señal en una escala más acorde al fenómeno que se estudia</td>
    </tr>
    <tr>
  		<td rowspan="5"><a href="noteboks/tercer_entrega.ipynb">3° entrega</a></td>
   		<td>Función suavizado de señal</td>
   		<td>Se utiliza para las fluctuaciones producto del ruido intrínseco en la respuesta al impulso.</td>
   		<td rowspan="5" style="text-align:left">
            <ul>
                <li>Graficar en escala logarítmica la señales de interés.</li>
                <li>Probar con las respuestas al impulso sintetizadas y las muestras descargadas. En caso de utilizar más de una toma por recinto, calcular el valor medio y la desviación estándar.</li>
                <li>Graficar los resultados.</li>
                <li>Establecer la integración de todas las funciones usando un archivo de programa “main”.</li>
                <li>Compara los resultados con software específico para el análisis de señales o plugins del mercado.</li>
            </ul>
        </td>	
 	</tr>	
	<tr>
  		<td>Función integral de Schroeder</td>
   		<td>La función integral de Schroeder representa la curva de decaimiento de la energía acústica.</td>
 	</tr>
    <tr>
  		<td>Función regresión lineal por mínimos cuadrados </td>
   		<td>La función regresión lineal por mínimos cuadrados permite evaluar el tiempo de reverberación.</td>
 	</tr>
    <tr>
  		<td>Función cálculo de parámetros acústicos </td>
   		<td>Se utiliza para determinar las características acústicas de recintos cerrados</td>
 	</tr>
    <tr>
  		<td>Informe final</td>
   		<td>Realizar informe final usando LaTex y respetando el formato dado</td>
 	</tr>
    <tr>
  		<td rowspan="1">Extra</td>
   		<td>Función Lundeby</td>
		<td>Se utiliza para encontrar los extremos de integración más precisos.</td>
   		<td rowspan="1" style="text-align:left"><ul><li>Probar con las respuestas muestras descargadas nuevamente y cuantificar la diferencia respecto a no utilizar 
            Lundeby.</li></ul>
        </td>	
 	</tr>
</table>

> 👮 La columna *test* indica las pruebas que tienen que superar las funciones para considerarse aprobadas. Recomendamos atenderlas para probar el código presentado.

## Informe técnico
El trabajo práctico consta de un informe técnico que refleja los resultados y el código desarrollado, el mismo se realiza íntegramente en [Latex](https://www.latex-project.org/).

> **LaTeX** es un sistema de composición de texto, donde prevalece el contenido sobre el formato y esto es gracias a que la escritura es en texto plano (sin formato). El formato es ingresado con una serie de comandos propios del sistema. Incluye características diseñadas para la producción de documentación técnica y científica, que hacen fácil la producción de documentación estructurada. Ademas y no menos importante, es libre y gratuito.

* Editor online de LaTeX - [Overleaf](https://www.overleaf.com/)
* Editor offline de LaTeX - [Texmaker](https://www.xm1math.net/texmaker/) + [MiKTeX](https://miktex.org/)

En cualquiera de los casos el template para confeccionar el informe se utiliza el formato de la UNTREF para [memorias cuatrimestrales](https://drive.google.com/file/d/1YwtmfM1YYl1k_J5mDwJ6zEJEetitKask/view?usp=share_link). Los archivos .tex, se encuentran en la siguiente [carpeta](https://drive.google.com/drive/folders/1giSkdwsGBNFW-aSAB3JxaDxZ5dRmKU3x?usp=share_link). El mismo consta de un [main.tex](https://drive.google.com/file/d/1aGV3BoehQocyW0AbcdslqzODplwIqpKT/view?usp=share_link) con la estructura base del template y en la carpeta secciones las distintas partes del documento.

> 🌈 Para la elaboración del informe recomendamos la lectura del documento [Curso introductorio a escritura en LaTeX](https://drive.google.com/file/d/1yaJD1QCCDyI8oMFzS0ZVzFg-8cyGPZCA/view?usp=share_link). Desarrollado por [Nahuel Passano](https://www.linkedin.com/in/nahuelpassano) - [Paula Ortega Riera](https://www.linkedin.com/in/paulaortegariera) de [Infiniem Labs](https://www.infiniemlabs.com.ar/).

## Informe preliminar (opcional)
Respetar las siguientes pautas:

* Mencionar los detalles en el diseño de los scripts (con ayuda de diagramas de flujo o pseudocódigo), sin agregar código propiamente dicho.
* Describir el dataset seleccionado para probar el software.
* El informe debe reflejar la arquitectura del software desarrollado y los avances en la producción del mismo. Los datos que se informan tiene que ser relevantes y garantizar la reproducibilidad de los mismos. No ahondar en muchos detalles teóricos y definiciones (hacer uso de referencias), hacer más bien foco en la producción del software, su evaluación y su validación.
* El informe preliminar no debe exceder las 3 páginas. 
* Respetar fecha de entrega.

## Informe final (obligatorio)
Respetar las siguientes pautas:

* Realizar un informe final, con el mismo formato establecido en el informe preliminar (atendiendo a las observaciones marcadas en la entrega del informe preliminar), pero en este caso no debe exceder las 5 página. 
* Remitir solamente a detalles relevantes.
* En el informe debe figurar claramente cómo se unen todas las funciones definidas y la interacción entre ellas. Utilizar algún diagrama para visualizar dicha relación.
* Mencionar detalladamente el procedimiento.
* Mostrar curvas de filtros, plot del procesamiento de la señal.
* Validación del algoritmo con software comercial.
* Los informes finales entregados fuera de fecha no serán evaluados (pasan directamente a recuperatorio).

> A modo de ejemplo dejamos dos informes modelos: [Dylan Kaplan - Franco Rebora - Santiago Salinas](https://drive.google.com/file/d/1Xum3AZLTr6sm2q462rsJaoRpM00sgSNk/view?usp=share_link) y [Castelli Corina - Espindola Agustin - Lareo Matıas Federico - Passano Nahuel](https://drive.google.com/file/d/1HSazrH4OWhI8_3VEaoks2ZMtf0E63aEA/view?usp=share_link)


## Distribución de contenidos del informe 
A modo ilustrativo se muestra los porcentajes del contenido en los informes:

| Resumen | Introducción | Marco teórico | Desarrollo experimental | Resultados | Conclusiones |
| -- | -- | -- | -- | -- | --  |
| 5% | 10% | 10% | 25% | 30% | 20% |

## + Info
* [Documentación oficial de overleaf](https://www.overleaf.com/learn)
* [Generador de tablas en LaTeX](https://www.tablesgenerator.com/)
* [Base de datos de RI](https://www.openairlib.net/)
* [How to read a paper](https://web.stanford.edu/class/ee384m/Handouts/HowtoReadPaper.pdf)
* [Consigna de TP versión Matlab](consigna_TP_matlab.pdf)
