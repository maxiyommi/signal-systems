# coding: utf-8

"""Juego de la vida de Conway.
Autor: Juan Luis Cano <juanlu001@gmail.com>
Adaptado para la ser usado por la asignatura por Maximiliano Yommi.
El tablero es un array de NumPy, donde 0 significa célula muerta y 1 célula
viva. Se muestra una animación con matplotlib.
"""

from time import sleep

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.cm as cm
from matplotlib import animation
from new_function import vecindario, paso


# Parámetros del problema
N = 100
M = 100

# Construimos el tablero
tablero = np.zeros((N, M), dtype=int)

nave = [[1, 0, 0],
          [0, 1, 1],
          [1, 1, 0]]

# Patrones iniciales
#np.random.seed(0)
r = np.random.random((10, 20))
tablero[10:20, 10:30] = (r > 0.75)
#tablero[15, 13:16] = 1
#tablero[16, 12:15] = 1
#tablero[:3, :3] = nave

# Creamos la figura
fig = plt.figure(figsize=(4, 4))
ax = fig.add_subplot(111)
ax.axis('off')

b = tablero
imagen = ax.imshow(b, interpolation="none", cmap=cm.gray_r)

def animate(i):
    global b
    b = paso(b)
    imagen.set_data(b)
    return imagen,

anim = animation.FuncAnimation(fig, animate, frames=32, interval=100)
plt.show()