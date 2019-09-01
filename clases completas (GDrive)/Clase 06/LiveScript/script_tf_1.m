function y = script_tf_1

%SCRIPT_TF_1 Calculo de Transformada de Fourier.
%   Este script contiene cuatro funciones relacionadas con el calculo de la
%   transformada de Fourier de una senal. Las mismas son llamadas mediante
%   handles. 
%
%   Con "funcion" se define la funcion a transformar, se utiliza el toolbox
%   symbolic math para definir a las mismas. Debajo hay ejemplos de como
%   ingresar funciones.
%   [f,t] = funcion()
%   Las salidas f y t son la funcion simbolica y la variable independiente
%   simbolica respectivamente.

%   Con "graficof" es posible graficar la funcion deseada.
%   graficof(f,t1,t2)
%   f es la funcion definida en funcion y t1 y t2 son el principio y final
%   del intervalo temporal en el cual se desea graficar a f.

%   Con "transformada" se calcula y se grafica la transformada de Fourier
%   de f. 
%   F = transformada(f,t,w1,w2)
%   F es la transformada de Fourier de f. Deben ingresarse f, t, w1 y w2,
%   estas ultimas son el principio y el final del intervalo de frecuencias
%   en el cual se graficara la funcion magnitud de la transformada.

%   Con "funangtran" se grafica la funcion angulo de la transformada.
%   funangtran(F,w1,w2)
%   F es la transformada de Fourier de f. w1 y w2 son el principio y el
%   final del intervalo de frecuencias en el que se graficara a angle(F).

%EJEMPLOS DE FUNCIONES:
%   Las funciones del ejercicio 1 son:
%   f = exp(-2*(t-1))*heaviside(t-1);
%   f = exp(-2*abs(t-1));
%   La funcion del ejercicio 2 es:
%   f = A*exp(-alfa*t)*heaviside(t);
%   Para este caso en particular, elegir valor de A y de alfa > 0.
    
    y.funcion = @funcion;
    y.graficof = @graficof;
    y.transformada = @transformada;
    y.funangtran = @funangtran;
    
end

function [f,t] = funcion

    syms t 
    f = input('Ingrese su funcion simbolica: ');
    
end

function F = transformada(f,t,w1,w2)
    
    syms w
    F = fourier(f,t,w);
    disp('Su transformada de Fourier es: ')
    disp(F)
    fplot(abs(F),[w1 w2])
    title('Magnitud de transformada de Fourier')
    xlabel('Frecuencia [w]')
    ylabel('|F(w)|')

end
    
function graficof(f,t1,t2)
        
    fplot(f,[t1 t2])
    title('Funcion temporal')
    xlabel('Tiempo [t]')
    ylabel('f(t)')
       
end

function funangtran(F,w1,w2)

    fplot(angle(F),[w1 w2])
    title('Angulo de transformada de Fourier')
    xlabel('Frecuencia [w]')
    ylabel('angle(F(w))')
end