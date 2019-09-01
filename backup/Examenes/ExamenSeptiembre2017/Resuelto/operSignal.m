function oper = operSignal
% oper = operSignal  :: sin argumento de entrada
%
% Función para operar con señales discretas basicas.
% 
% Argumentos 
%   signal: vector de amplitudes.
%   n: vector de posiciones.
%   n0: posiciones de traslacion.
%   y0: valor de DC offset. 
%   factor: valor |factor|>1 comprime & |factor|<1 expande.
%
% Funciones locales:
% .tra_tem :: argIn (signal,n,n0) ; arOut(y,n) -- (trasladar temporalmente)  
% .tra_amp :: argIn (signal,n,y0) ; arOut(y,n) -- (trasladar amplitud "DC OFFSET") 
% .inv_tem :: argIn (signal,n) ; arOut(y,n) -- (inversion temporal, sobre el eje de las ordenadas) 
% .inv_amp :: argIn (signal,n) ; arOut(y,n) -- (invesion amplitud, sobre el eje de las abcisas) 
% .comExp_tem :: argIn (signal,n,factor) ; arOut(y,n) -- (comprir/expande temporalmente) 
% .mod_amp :: argIn (signal,n,mod) ; arOut(y,n) -- (modular amplitud) 
% .sum :: argIn (signal_1,n_1,signal_2,n_2) ; arOut(y,n) -- (sumar señales, dos señales como maximo) 
% .mul :: argIn (signal_1,n_1,signal_2,n_2) ; arOut(y,n) -- (multiplicar señales) 
% .conv :: argIn (signal_1,n_1,signal_2,n_2) ; arOut(y,n) -- (convolucionar señales)
% .eval (funcion para evualar el script) 
%
% Autor: Maxi
% Fecha: Septiembre 2017

    oper.tra_tem = @trasladarTemporal;
    oper.tra_amp = @trasladarAmplitud;
    oper.inv_tem = @inversionTemporal;
    oper.inv_amp = @inversionAmplitud;
    oper.comExp_tem = @comprimirExpandirTemporal;
    oper.mod_amp = @modularAmplitud;
    oper.sum = @sumarSignals;
    oper.mul = @multiplicarSignals;
    oper.conv = @convolucionarSignals;
    
    oper.eval = @evaluacion;
end

function [y, n] = trasladarTemporal(signal,n,n0)
    try
        y = signal;
        n = n-(n0);
    catch
        error('Los argumentos no son validos.')
    end
end

function [y, n] = trasladarAmplitud(signal,n,y0)
    try
        y = signal+(y0);
        n = n;
    catch
        error('Los argumentos no son validos.')
    end
end

function [y, n] = inversionTemporal(signal,n)
    try
        y = signal;
        n = -n;
    catch
        error('Los argumentos no son validos.')
    end
end

function [y, n] = inversionAmplitud(signal,n)
    try
        y = -signal;
        n = n;
    catch
        error('Los argumentos no son validos.')
    end
end

function [y, n] = comprimirExpandirTemporal(signal,n,factor)
    try
        y = signal;
        n = n*abs(factor);
    catch
        error('Los argumentos no son validos.')
    end
end

function [y, n] = modularAmplitud(signal,n,mod)
    try
        y = mod.*signal;
        n = n;
    catch
        error('Los argumentos no son validos.')
    end
end

function [y, n] = sumarSignals(signal_1,n_1,signal_2,n_2)
    try
        y = signal_1+signal_2;
        n = n_1;
    catch
        error('Los argumentos no son validos.')
    end
end

function [y, n] = multiplicarSignals(signal_1,n_1,signal_2,n_2)
    try
        y = signal_1*signal_2;
        n = n_1;
    catch
        error('Los argumentos no son validos.')
    end
end

function [y, n] = convolucionarSignals(signal_1,n_1,signal_2,n_2)
    try
        y = conv (signal_1*signal_2);
        n = 1;
    catch
        error('Los argumentos no son validos.')
    end
end

function evaluacion()
    try
        n0 = 4;
        n1 = -5;
        n2 = 8;
        w = 2;
        a = 2;
        y0 = 3;
        factor = 0.5;  
        
        signal = discSignal();
%         [signal,n] = signal.imp(n0,n1,n2);
%         [signal,n] = signal.esc(n0,n1,n2);
        [signal_1,n_1] = signal.pul(n0,n1,n2,w);
%         [signal,n] = signal.tri(n0,w);
        [signal_2,n_2] = signal.ram(n0,w);
%         [signal,n] = signal.exp(a,n0,w);
%         [signal,n] = signal.ale(n0,w);
        
        subplot (3,1,1) 
        stem(n_1,signal_1)
        grid on
        subplot (3,1,2)
        stem(n_2,signal_2)
        
%         mod = 2.^(n);
        
%         [signal,n] = trasladarTemporal(signal,n,2);
%         [signal,n] = trasladarAmplitud(signal,n,y0);
%         [signal,n] = inversionTemporal(signal,n);
%         [signal,n] = inversionAmplitud(signal,n);
%         [signal,n] = comprimirExpandirTemporal(signal,n,factor);
%         [signal,n] = modularAmplitud(signal,n,mod);
%         [signal,n] = sumarSignals(signal_1,n_1,signal_2,n_2);
%         [signal,n] = multiplicarSignals(signal_1,n_1,signal_2,n_2);
%         [signal,n] = convolucionarSignals(signal_1,n_1,signal_2,n_2);
        
        subplot (3,1,3)
        stem(n,signal)
        grid on
        
    catch
        error('Error en el script')
    end
end