function script_02_03 = script_02_03 (w0,dominio)
% script3 = script3  (w0,dominio)
%
% Funcion para determinar el periodo de funciones continuas o discretas("docstring"). 
%
% Input
% w0 = frecuencia angular (Ej. 2*pi*5/4)
% dominio = 'n' discreto; 't' continuo
%
% Output
% script3 = periodo
%
% Marzo, 2017

    if dominio == 't'
        k = 1:1:100; % Numero natural (sin el cero)
        T =(2*k*pi)/w0; 
        script_02_03 = min(T);
    elseif dominio =='n'
        k = 1:1:100; % Numero natural (sin el cero)
        N = 2*k*pi;
        k2 = find(rem(N,w0)==0,1);
        script_02_03 = 2*pi*k2/w0;
    else
        msgbox('Argumento no valido', 'Error','Error');
    end
    
end
