# -*- coding: utf-8 -*-

def fib2(n):
    """Devuelve una lista conteniendo la serie de Fibonacci hasta n."""
    
    resultado = []  # inicializo la lista 
    a, b = 0, 1  # asignacion multiple
    while a < n:
        resultado.append(a)  
        a, b = b, a + b
    return resultado

# Invocamos la función definida.    

fib2000 = fib2(2000)
print(fib2000)