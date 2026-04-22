# /// script
# requires-python = ">=3.13"
# dependencies = [
#     "marimo>=0.22.4",
# ]
# ///

import marimo

__generated_with = "0.22.4"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo

    return (mo,)


@app.cell
def _(mo):
    mo.md(r"""
    # Senales y Sistemas - Practica 2026
    ## Clase 1: El Punto de Partida

    Bienvenidos a la practica de **Senales y Sistemas**. Este curso se estructura en torno a **3 pilares**:

    | Pilar | Nombre | Descripcion |
    |-------|--------|-------------|
    | **P1** | Programacion | Python desde cero hasta procesamiento de senales |
    | **P2** | Vibecoding & IA | Uso de inteligencia artificial como asistente de codigo |
    | **P3** | Desarrollo de software | Git, testing, arquitectura de proyectos |

    Hoy nos enfocamos en **P1** (fundamentos de Python), con una introduccion a **P3** (Git) y un teaser de **P2** (vibecoding).
    """)
    return


@app.cell
def _(mo):
    mo.md(r"""
    ## Que es un MVP?

    **MVP** = *Minimum Viable Product* (Producto Minimo Viable)

    En el contexto de software de audio, un MVP es la version mas simple de tu programa que **funciona y es util**. Por ejemplo:

    - Un ecualizador MVP: solo ajusta graves y agudos (2 bandas), sin interfaz grafica.
    - Un reproductor MVP: abre un archivo WAV y lo reproduce, nada mas.
    - Un analizador MVP: calcula el nivel RMS de una senal y lo imprime.

    La idea es **construir algo que funcione rapido**, y despues iterar y mejorar. En este curso, cada trabajo practico arranca con un MVP.
    """)
    return


@app.cell
def _(mo):
    mo.md(r"""
    ---
    ## Variables en Python

    Una variable es un **nombre** que apunta a un **valor** en memoria. En el contexto de audio, usamos variables todo el tiempo:
    """)
    return


@app.cell
def _():
    # Variables fundamentales en audio digital
    sample_rate = 44100          # Frecuencia de muestreo en Hz (int)
    nombre_canal = "Left"        # Nombre del canal (str)
    amplitud = 0.8               # Amplitud normalizada (float)
    es_estereo = True            # Si el audio es estereo (bool)

    print(f"Sample rate: {sample_rate} Hz")
    print(f"Canal: {nombre_canal}")
    print(f"Amplitud: {amplitud}")
    print(f"Estereo: {es_estereo}")
    return


@app.cell
def _(mo):
    mo.md(r"""
    ---
    ## Tipos de datos

    Python tiene varios tipos de datos fundamentales. Usamos `type()` para verificar el tipo de una variable:
    """)
    return


@app.cell
def _():
    # Tipos de datos fundamentales
    frecuencia = 440           # int - numero entero
    duracion = 2.5             # float - numero con decimales
    formato = "WAV"            # str - cadena de texto
    grabando = False           # bool - verdadero o falso

    print(f"frecuencia = {frecuencia} -> tipo: {type(frecuencia).__name__}")
    print(f"duracion = {duracion} -> tipo: {type(duracion).__name__}")
    print(f"formato = {formato!r} -> tipo: {type(formato).__name__}")
    print(f"grabando = {grabando} -> tipo: {type(grabando).__name__}")
    return


@app.cell
def _(mo):
    mo.md(r"""
    ### Conversion de tipos

    A veces necesitamos convertir entre tipos. Esto se llama *casting*:
    """)
    return


@app.cell
def _():
    # Conversion de tipos
    sr_texto = "48000"
    sr_numero = int(sr_texto)       # str -> int
    print(f"'{sr_texto}' convertido a int: {sr_numero}, tipo: {type(sr_numero).__name__}")

    muestras = 132300
    muestras_float = float(muestras)  # int -> float
    print(f"{muestras} convertido a float: {muestras_float}")

    nivel_db = -6.2
    nivel_str = str(nivel_db)         # float -> str
    print(f"{nivel_db} convertido a str: {nivel_str!r}")

    # bool se puede convertir a int: True=1, False=0
    print(f"int(True) = {int(True)}, int(False) = {int(False)}")
    return


@app.cell
def _(mo):
    mo.md(r"""
    ---
    ## Operadores aritmeticos

    Python soporta todos los operadores matematicos que necesitamos para calculos de audio:
    """)
    return


@app.cell
def _():
    # Operadores aritmeticos
    print("=== Operadores Aritmeticos ===")
    print(f"Suma:           10 + 3  = {10 + 3}")
    print(f"Resta:          10 - 3  = {10 - 3}")
    print(f"Multiplicacion: 10 * 3  = {10 * 3}")
    print(f"Division:       10 / 3  = {10 / 3:.4f}")
    print(f"Division entera:10 // 3 = {10 // 3}")
    print(f"Modulo:         10 % 3  = {10 % 3}")
    print(f"Potencia:       2 ** 10 = {2 ** 10}")
    return


@app.cell
def _(mo):
    mo.md(r"""
    ### Ejemplo practico: calculos de audio digital
    """)
    return


@app.cell
def _():
    # Calculos de audio digital
    sr = 44100       # sample rate en Hz
    dur = 3.0        # duracion en segundos
    canales = 2      # estereo
    bit_depth = 16   # bits por muestra

    total_muestras = int(sr * dur)
    total_muestras_estereo = total_muestras * canales
    bytes_por_muestra = bit_depth // 8
    tamano_bytes = total_muestras_estereo * bytes_por_muestra
    tamano_mb = tamano_bytes / (1024 * 1024)

    print(f"Sample rate:      {sr} Hz")
    print(f"Duracion:         {dur} s")
    print(f"Canales:          {canales}")
    print(f"Bit depth:        {bit_depth} bits")
    print(f"---")
    print(f"Total muestras:   {total_muestras:,}")
    print(f"Muestras estereo: {total_muestras_estereo:,}")
    print(f"Bytes por muestra:{bytes_por_muestra}")
    print(f"Tamano total:     {tamano_bytes:,} bytes")
    print(f"Tamano en MB:     {tamano_mb:.2f} MB")
    return


@app.cell
def _(mo):
    mo.md(r"""
    ---
    ## Operadores de comparacion y logicos
    """)
    return


@app.cell
def _():
    # Operadores de comparacion
    sr_actual = 44100
    sr_minimo = 22050

    print("=== Comparacion ===")
    print(f"{sr_actual} == 44100:  {sr_actual == 44100}")
    print(f"{sr_actual} != 48000:  {sr_actual != 48000}")
    print(f"{sr_actual} > {sr_minimo}:  {sr_actual > sr_minimo}")
    print(f"{sr_actual} >= 44100: {sr_actual >= 44100}")
    print(f"{sr_actual} < 96000:  {sr_actual < 96000}")

    print()

    # Operadores logicos
    es_cd_quality = sr_actual >= 44100
    es_profesional = sr_actual >= 48000
    bit_depth_ok = 16 >= 16

    print("=== Logicos ===")
    print(f"CD quality AND bit depth OK: {es_cd_quality and bit_depth_ok}")
    print(f"Profesional OR CD quality:   {es_profesional or es_cd_quality}")
    print(f"NOT profesional:             {not es_profesional}")
    return


@app.cell
def _(mo):
    mo.md(r"""
    ---
    ## Strings (cadenas de texto)

    Los strings son fundamentales para manejar nombres de archivos, metadatos, y mensajes. Python tiene herramientas muy poderosas para trabajar con texto:
    """)
    return


@app.cell
def _():
    # Strings basicos
    archivo = "WAV_recording_01.wav"

    # Metodos utiles
    print(f"Original:     {archivo}")
    print(f"Mayusculas:   {archivo.upper()}")
    print(f"Minusculas:   {archivo.lower()}")
    print(f"Split por _:  {archivo.split('_')}")
    print(f"Empieza con WAV: {archivo.startswith('WAV')}")
    print(f"Termina con .wav: {archivo.endswith('.wav')}")
    print(f"Reemplazar:   {archivo.replace('.wav', '.mp3')}")
    print(f"Longitud:     {len(archivo)} caracteres")
    return


@app.cell
def _():
    # Slicing de strings
    nombre_archivo = "grabacion_estudio_2026.wav"

    print(f"Archivo: {nombre_archivo}")
    print(f"Primeros 9 caracteres: {nombre_archivo[:9]}")
    print(f"Ultimos 4 caracteres:  {nombre_archivo[-4:]}")
    print(f"Extension:             {nombre_archivo.split('.')[-1]}")
    print(f"Sin extension:         {nombre_archivo[:-4]}")
    print(f"Caracter 10 al 17:     {nombre_archivo[10:17]}")
    return


@app.cell
def _():
    # f-strings: la forma mas comoda de formatear texto
    artista = "Pink Floyd"
    album = "Dark Side of the Moon"
    duracion_seg = 2580
    sr_info = 44100

    minutos = duracion_seg // 60
    segundos = duracion_seg % 60

    info = f"""
    === Informacion del Album ===
    Artista:    {artista}
    Album:      {album}
    Duracion:   {minutos}:{segundos:02d}
    Sample Rate:{sr_info:,} Hz
    Muestras:   {sr_info * duracion_seg:,}
    """
    print(info)
    return


@app.cell
def _(mo):
    mo.md(r"""
    ---
    ## Input y Output

    La funcion `print()` permite mostrar informacion formateada. La funcion `input()` permite leer datos del usuario (aunque en notebooks no la usamos tanto).
    """)
    return


@app.cell
def _():
    # Print con formato
    notas = ["A4", "B4", "C5", "D5"]
    frecuencias = [440.0, 493.88, 523.25, 587.33]

    print("Nota | Frecuencia (Hz)")
    print("-----|----------------")
    for nota, freq in zip(notas, frecuencias):
        print(f"{nota:4s} | {freq:>10.2f} Hz")
    return


@app.cell
def _(mo):
    mo.md(r"""
    ---
    ## Que es el Vibecoding?

    **Vibecoding** es un enfoque de programacion donde usas **inteligencia artificial** (como Claude, ChatGPT, etc.) para generar codigo a partir de descripciones en lenguaje natural.

    ### Ejemplo hipotetico

    **Prompt:**
    > "Escribi una funcion en Python que convierta un numero de nota MIDI a su frecuencia en Hz.
    > La formula es: f = 440 * 2^((midi - 69) / 12). Agrega docstring y type hints."

    **Resultado generado por la IA:**

    ```python
    def midi_a_hz(nota_midi: int) -> float:
        '''Convierte un numero de nota MIDI a frecuencia en Hz.

        Parameters
        ----------
        nota_midi : int
            Numero de nota MIDI (0-127).

        Returns
        -------
        float
            Frecuencia en Hz.
        '''
        return 440.0 * (2.0 ** ((nota_midi - 69) / 12.0))
    ```

    ### Claves del vibecoding
    - **No reemplaza saber programar**: necesitas entender el codigo para verificar que es correcto.
    - **Es una herramienta**: como una calculadora, te ayuda a ser mas productivo.
    - **Ser especifico en el prompt**: cuanto mas claro seas, mejor resultado obtenes.
    - **Siempre revisar**: la IA puede generar codigo con errores sutiles.

    En las proximas clases vamos a ir incorporando IA como asistente de forma gradual.
    """)
    return


@app.cell
def _(mo):
    mo.md(r"""
    ---
    ## Resumen de la clase

    Hoy aprendimos:

    - **Variables**: nombres que apuntan a valores (`sample_rate = 44100`)
    - **Tipos**: `int`, `float`, `str`, `bool` y conversion entre ellos
    - **Operadores**: aritmeticos (`+`, `-`, `*`, `/`, `//`, `%`, `**`), comparacion, logicos
    - **Strings**: f-strings, slicing, metodos utiles
    - **Vibecoding**: concepto de usar IA para generar codigo

    ### Para la proxima clase
    - Tener Python 3.12+ instalado
    - Tener un editor de codigo (VS Code recomendado)
    - Crear un repositorio en GitHub y hacer push de un README.md
    """)
    return


if __name__ == "__main__":
    app.run()
