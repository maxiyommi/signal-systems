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


def vecindario(b):
    """Array de células vivas en el vecindario."""
    vecindario = (
        np.roll(np.roll(b, 1, 1), 1, 0) +  # Abajo-derecha
        np.roll(b, 1, 0) +  # Abajo
        np.roll(np.roll(b, -1, 1), 1, 0) +  # Abajo-izquierda
        np.roll(b, -1, 1) +  # Izquierda
        np.roll(np.roll(b, -1, 1), -1, 0) +  # Arriba-izquierda
        np.roll(b, -1, 0) +  # Arriba
        np.roll(np.roll(b, 1, 1), -1, 0) +  # Arriba-derecha
        np.roll(b, 1, 1)  # Derecha
    )
    return vecindario


def paso(b):
    """Paso en el juego de la vida de Conway."""
    v = vecindario(b)
    buffer_b = b.copy()  # Hacemos una copia de la matriz
    for i in range(buffer_b.shape[0]):
        for j in range(buffer_b.shape[1]):
            if v[i, j] == 3 or (v[i, j] == 2 and buffer_b[i, j]):
                buffer_b[i, j] = 1
            else:
                buffer_b[i, j] = 0
    return buffer_b


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