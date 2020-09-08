import math

input = float(input("Ingrese la longuitud del radio de un circulo = "))

print("La superficie del circulo es = ", math.pi*input**2)
print("El perimetro de la circunferencia es = ", math.pi*input*2)
print("La superficie de la esfera es = ", 4*math.pi*input**2)
print("El volumen de la esfera es = ", 4/3*math.pi*input**3)