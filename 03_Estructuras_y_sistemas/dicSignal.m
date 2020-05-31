function sig = dicSignal 
% eli = elipseElementos :: sin argumento de entrada
%
% Función para determinar caracteristicas de una elipse.
% 
% Argumentos =  n0: indice de la ubicación del valor 0 ; n1: inicio del intervalo; n2: final del intervalo
%
% .imp :: argIn (n0,n1,n2) ; arOut(x,n) -- (señal impulso) -- 
% .esc :: argIn (n0,n1,n2) ; arOut(x,n) -- (sñal escalon) --
% .ramp:: argIn (n0,n1,n2) ; arOut(x,n) -- (señal rampa) --
%
% Scrip 11 - Septiembre 2017

    sig.imp = @impulso;
    sig.esc = @escalon;
    sig.rampa = @rampa;
    sig.plot = @plot;
end

function [x, n] = impulso(n0,n1,n2)
    try
        n = [n1:n2]; x= [(n-n0) == 0];
    catch
        error('Los argumentos no son validos.')
    end
end

function [x, n] = escalon(n0,n1,n2)
    try
        n = [n1:n2]; x= [(n-n0) >= 0];
    catch
        error('Los argumentos no son validos.')
    end
end

function [x, n] = rampa(n0,n1,n2)
    try
        n = [n1:n2]; x = [zeros(1,find((n-n0) == 0)) 1:n2];
    catch
        error('Los argumentos no son validos.')
    end
end

function plot(x,n,titulo)
    try
        stem(n,x); title (titulo); ylabel ('x[n]'); xlabel ('Muestras [n]'); grid on;
    catch
        error('Los argumentos no son validos.')
    end      
end
