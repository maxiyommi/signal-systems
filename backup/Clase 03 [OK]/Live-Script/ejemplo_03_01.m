function ejemplo_2(f1,f2,varargin)
% Script para plotear la señal senoidal de frecuencia definida por el argumento de la funcion.

    figure
    if nargin == 1
        x1=linspace(0,2*pi,f1*16+1);
        plot(x1,sin(f1*x1));title ('\it sin(x)'); ylabel ('Amplitud'); xlabel ('t [radianes]'); grid on; ylim([-2 2]); xlim([0 2*pi]);
        legend (['Sin (2\pi',num2str(f1),')']) 
    elseif  nargin == 2
        x1=linspace(0,2*pi,f1*16+1);
        plot(x1,sin(f1*x1));title ('\it sin (x)'); ylabel ('Amplitud'); xlabel ('t [radianes]'); grid on; ylim([-2 2]); xlim([0 2*pi]);
        x2=linspace(0,2*pi,f2*16+1);
        hold on
        plot(x2, sin(f2*x2),'r'); legend (['Sin (2\pi',num2str(f1),')'],['Sin (2\pi',num2str(f2),')']); 
    else
        error ('Cantidad de argumentos incorrecto.')
    end    
end