# Señales y Sistemas

<img src="LogoPractica.png" class="center" width="300"/>

Contenido práctico de la asignatura Señales y Sistemas de la carrera [Ingeniería de Sonido](https://www.untref.edu.ar/carrera/ingenieria-de-sonido), en la [Universidad Nacional de Tres de Febrero](https://www.untref.edu.ar), Buenos Aires - Argentina.

## Fechas importantes
Las presentaciones se realizan en el dia y horario de las prácticas de la asignatura. **Todas las actividades son obligatorias**.

| Actividad | Fecha limite | Link | Observaciones
| ---------- | ---- | ---- | --------- |
| 1er entrega TP | 05/05/2020 | - | Enviar por mail el link de [**Gist**](https://gist.github.com/) con todas las **funciones** que correspondan a la entrega. Agregar en el cuerpo del mail los integrantes del grupo. Los comentarios se realizaran por **Gist** |
| 2da entrega TP | 19/05/2020 | [Subir](https://www.dropbox.com/request/9YcAGMs2enpmEgz4JwPF)| Subir [**informe preliminar**](TP/readme.md) en .pdf con los apellidos de los integrantes separados por guion bajo. Las correcciones del informe van a estar disponibles en el GDrive (/Práctica/TPN1/Correcciones). Los comentarios de las funciones se realizaran por **Gist** |
| 3er entrega TP | 02/06/2020 | - | Usar el mismo link de **Gist** de la 1er entrega, deben figurar todas las **funciones** que correspondan a la entrega. Las correcciones se realizaran por **Gist** |
| Parcialito MATLAB | 09/06/2020 | [Formulario](https://forms.gle/FhRTqopTm7CvU4uk7)| **Multiple choice** domiciliario|
| 4ta entrega TP + defensa | 16/06/2020 |[Subir](https://www.dropbox.com/request/HL7I2C9RxEPRcj8X8d1I) | Subir **código final** e [**informe final**](TP/readme.md) en una carpeta con los apellidos de los integrantes separados por guion bajo. La correcciones van a estar disponibles en el GDrive (/Práctica/TPN1/Correcciones)|
| Recuperatorios TP-MATLAB  | 23/06/2020 |[Subir](https://www.dropbox.com/request/HL7I2C9RxEPRcj8X8d1I) | Subir **código final** e [**informe final**](TP/readme.md)  en una carpeta con los apellidos de los integrantes separados por guion bajo. La correcciones van a estar disponibles en el GDrive (/Práctica/TPN1/Correcciones)|

> [**Gist**](https://help.github.com/es/github/writing-on-github/editing-and-sharing-content-with-gists), es un plataforma para snippets, o lo que es lo mismo, pequeños pedazos de código reusables con una funcionalidad concreta. Estos snippets serían ideales tenerlos en un sitio donde se puedan compartir, almacenar y evitar que se pierdan en el olvido, pero donde crear un repositorio git, parece ser excesivo y sería matar moscas con una escopeta. Para eso existe Gist, ademas de ser ideal para que se comenten los códigos subidos. **Procurar mantener el mismo link a lo largo de toda la cursada**.

## Evaluación
Nota final parte práctica = Nota TP x 0.7 + Nota Parcialito MATLAB x 0.3

> **Recordar**: el desglose de la nota del TP se encuentra en la consigna del mismo.

## Contenidos del curso

> Todas las clases fueron desarrolladas en [Live Script](https://www.mathworks.com/help/matlab/matlab_prog/what-is-a-live-script-or-function.html). Se recomienda ejecutarlas en Matlab R2018b o posterior.

* Trabajo práctico
    * [Consigna del trabajo práctico](TP/consigna_TP.pdf)
    * [Informe técnico](TP/readme.md)
* [Guía de ejercicios](GUIA_DE_EJERCICIOS.pdf)
* [Introducción](https://docs.google.com/presentation/d/1gEb5sLCnzbIypZ-_O4A_d9vsVgYbpxo3E62I9krsjjM/edit?usp=sharing)
    * Organización.
    * Bibliografía.
    * Introducción al curso.
* [Introducción y fundamentos principales - I](Introduccion_y_fundamentos_principales/clase_01_a.pdf)
    * Conceptos básicos de programación.
    * MATLAB.
    * Estrategia de aprendizaje.
* [Introducción y fundamentos principales - II](Introduccion_y_fundamentos_principales/clase_01_b.pdf)
    * Entorno de trabajo y ventanas.
    * Ayuda y documentación.
    * Datos (built-in).
    * Variables primitivas.
    * Inicialización e indexación de variables matriciales.
    * Scripts.
    * Introducción a estructuras de control (o sentencias).
    * Funciones predefinidas.
    * Números complejos.
* [Trabajando con señales - I](Trabajando_con_señales/clase_02_a.pdf)
    * Representación númerica.
    * Energía y potencia.
    * Matrices.
    * Secuencias.
    * Señales discretas básicas.
    * Señales continuas básicas.
* [Trabajando con señales - II](Trabajando_con_señales/clase_02_b.pdf)
    * Funciones (I).
    * Debugging.
    * Transformaciones de la variable independiente.
    * Operaciones entre señales discretas.
    * Figure, plot, stem, stairs y subplot.
    * Title, xlabel, ylabel, legend y text.
    * Dibujo de curvas en el pano.
    * Visualización de matrices.
    * Comentarios sobre los gráficos.
    * Señales reales.
* [Estructuras y sistemas - I](Estructuras_y_sistemas/clase_03_a.pdf)
    * Clasificación de sistemas.
    * Estructuras de control (o sentencias) (II).
    * Menejo de errores.
    * Estructura de datos avanzada.
    * uiControl.
* [Estructuras y sistemas - II](Estructuras_y_sistemas/clase_03_b.pdf)
    * Funciones (II).
    * Funciones anónimas.
    * Funciones principales y subfunciones.
    * Funciones anidadas.
    * Encapsulado de funciones.
    * Ejercicio propuesto.
* Material extra
    * [Audio en MATLAB.](Material_extra/Audio/LiveScript/ClaseEspecial_Audio.pdf)
    * [Interfaz gráfica - GUI](Material_extra/Gui/LiveScript/ClaseEspecial_UI.pdf).
    * [Game of Life](https://github.com/maxiyommi/signal-systems/blob/master/Material%20extra/GameOfLife/gameOfLife.ipynb)
    * [Introducción a Python](https://github.com/infiniemlabs-acustica/python_introduccion).
    * [Introducción a filtros](https://github.com/maxiyommi/signal-systems/blob/master/Material%20extra/Filtros/intro_filtros.ipynb).

## Consultas
Las consultas sobre el material y/o consigna del TP estan centralizadas en la sección de [**Issues**](https://github.com/maxiyommi/signal-systems/issues).

## Contenido teórico
Ingresar con el usuario personal al [**Aula virtual**](https://untrefpresencial.educativa.org/).

## Docentes

* **Lic. Miriam Sassano** - miryam.sassano@gmail.com
* **Ing. Antonio Greco** - antogreco2015@gmail.com
* **Ing. Maximiliano Yommi** - maximilianoyommi@gmail.com
* **Tec. Agustín Morelli** - agustinmorelli88@gmail.com

