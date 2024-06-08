import matplotlib.pyplot as plt
import numpy as np

# Definimos la función seno
def sin(n,f):
  return np.sin(2*np.pi*f*n)

# Definición de los periodos de muestreo [s]
t_final = 2;
F = 80; # 0.5
T1 = 1/F;

# Definicion de la cantindad de muestras en funcion de T
n = np.arange(0, t_final,T1)
print(len(n))

# Definición de la frecuencia [Hz], Amplitud y fase
f = 2; #1/12

# Calculamos seno, módulo del seno y módulo del seno al cuadrado
y_sin = sin(n,f)
y_abs_sin = np.abs(y_sin)
y_abs_sin_cuadrado = y_abs_sin**2

# Creamos la subparcela
fig, axs = plt.subplots(3, 1, sharex=True, figsize=(8, 6))

# Gráfica del seno
axs[0].plot(n, y_sin, color='r', label='sin(x)')  # r para raw string y comillas simples para código LaTeX
axs[0].set_ylabel('sin(x)',fontsize=12)  # Tamaño de fuente para el label del eje Y
axs[0].legend(fontsize=10)  # Tamaño de fuente para la leyenda

# Gráfica del módulo del seno
axs[1].plot(n, y_abs_sin, color='g', label='abs(sin(x))')
axs[1].set_ylabel('abs(sin(x))',fontsize=12)
axs[1].legend(fontsize=10)

# Gráfica del módulo del seno al cuadrado
axs[2].plot(n, y_abs_sin_cuadrado, color='b', label='abs(sin(x))^2')  # Comillas simples para código LaTeX
axs[2].set_ylabel('abs(sin(x))^2',fontsize=12)
axs[2].set_xlabel('X',fontsize=12)  # Etiqueta del eje X con $ para letra cursiva
axs[2].legend(fontsize=10)

# Ajustamos los límites de los ejes y la visualización
for ax in axs:
  ax.grid(True)
  ax.set_xlim(min(n), max(n))

plt.show()