function sig = discSignal 
% sig = discSignal  :: sin argumento de entrada
%
% Función para crear señales discretas basicas.
% 
% Argumentos 
%   n0: indice de la ubicacion del valor 0 (o el centro de la señal en algunos casos).
%   n1: inicio del intervalo.
%   n2: final del intervalo.
%   w: ancho de la señal. 
%   a: base.
%   --------
%   y: vector de amplitudes.
%   n: vector de posiciones.
%
% Funciones locales:
% .imp :: argIn (n0,n1,n2) ; arOut(y,n) -- (señal impulso)  
% .esc :: argIn (n0,n1,n2) ; arOut(y,n) -- (señal escalon) 
% .pul :: argIn (n0,n1,n2,w) ; arOut(y,n) -- (señal pulso) 
% .tri :: argIn (n0,w) ; arOut(y,n) -- (señal triangular) 
% .ram :: argIn (n0,w) ; arOut(y,n) -- (señal rampa) 
% .exp :: argIn (a,n0,w) ; arOut(y,n) -- (señal exponencial) 
% .ale :: argIn (n0,w) ; arOut(y,n) -- (señal aleatoria) 
% .eval (funcion para evualar el script) 
%
% Autor: Maxi
% Fecha: Septiembre 2017

    sig.imp = @impulso;
    sig.esc = @escalon;
    sig.pul = @pulso;
    sig.tri = @triangular;
    sig.ram = @rampa;
    sig.exp = @exponencial;
    sig.sin = @senoidal;
    sig.ale = @aleatoria;
    
    sig.eval = @evaluacion;
end

function [y, n] = impulso(n0,n1,n2)
    try
        n = [n1:n2]; 
        y = [(n-n0) == 0];
    catch
        error('Los argumentos no son validos.')
    end
end

function [y, n] = escalon(n0,n1,n2)
    try
        n = [n1:n2]; 
        y = [(n-n0) >= 0];
    catch
        error('Los argumentos no son validos.')
    end
end

function [y, n] = pulso(n0,n1,n2,w)
    try
        n = [n1:n2]; 
        y = [abs(n-n0) <= w];
    catch
        error('Los argumentos no son validos.')
    end
end

function [y, n] = triangular(n0,w)
    try
        y = pulso(n0,n0-w/2,n0+w/2,w/2);
        y = [0 conv(y*1,y*1) 0];
        n = [n0-w-1:n0+w+1];
    catch
        error('Los argumentos no son validos.')
    end
end

function [y, n] = rampa(n0,w)
    try
        n = [n0-w:n0+w]; 
        y = [zeros(1,find((n-n0) == 0)) 1:w];
    catch
        error('Los argumentos no son validos.')
    end
end

function [y, n] = exponencial(a,n0,w)
    try
        n = [n0-w:n0+w]; 
        y = [zeros(1,w) a.^[n0:n0+w]];
    catch
        error('Los argumentos no son validos.')
    end
end

function [y, n] = aleatoria(n0,w)
    try
        n = [n0-w:n0+w];
        y = [zeros(1,w) rand(1,w+1)];
    catch
        error('Los argumentos no son validos.')
    end
end

function evaluacion()
    try
        n0 = 1;
        n1 = -5;
        n2 = 8;
        w = 4;
        a = 2;
        
%         [y,n] = impulso(n0,n1,n2);
%         [y,n] = escalon(n0,n1,n2);
%         [y,n] = pulso(n0,n1,n2,w);
%         [y,n] = triangular(n0,w);
%         [y,n] = rampa(n0,w);
%         [y,n] = exponencial(a,n0,w);
%         [y,n] = aleatoria(n0,w);
        
        stem(n,y)
        grid on
    catch
        error('Error en el script')
    end
end