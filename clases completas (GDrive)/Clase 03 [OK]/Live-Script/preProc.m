function pre = preProc
% pre = preProc :: sin argumento de entrada
%
% funcion para realizar el pre procesamiento de la señal
% 
% .audioRead :: argIn (path) ; arOut(signal, fs) -- (lectura de audio) -- 
%
% Scrip 11 - Septiembre 2017

    pre.audioRead = @audioRead;
    pre.audioWrite = @audioWrite;
    pre.chunks = @chunks;
    pre.umbralH = @umbralH;
    pre.umbralV = @umbralV;
end

function [signal, fs] = audioRead(varargin)

    path = varargin{1};
    formato = '*.wav';
    filename = strcat(path, formato);
    
    try
        [signal, fs] = audioread(filename);
    catch
        error('Los argumentos no son validos.')
    end
end

function audioWrite(varargin)
    try
       
    catch
        error('Los argumentos no son validos.')
    end
end

function [x, n] = rampa(n0,n1,n2)
    try
       
    catch
        error('Los argumentos no son validos.')
    end
end

function plot(x,n,titulo)
    try
        
    catch
        error('Los argumentos no son validos.')
    end      
end
