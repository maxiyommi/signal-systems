# -*- coding: utf-8 -*-

from math import math.pi

a = input("Ingrese un numero mayor de 0:")
a = float(a)
while a > 0:
    if a <= 0:
        print("Debe ingresar un número mayor a cero")
        print("Este programa terminara")
        break
    print(["El logaritmo natural de " + str(a) + " es: " + str(math.log(a))])
    a = input("Ingrese un valor mayor de 0:")
    a = float(a)
print("Debe ingresar un número mayor a cero")
print("Este programa terminara")


-----
import while
