% Importante: hemos considerado que el primer elemento es el n = 1

    clear
    close all

% Generamos 5 secuencia para estudiar el sistema
    N = 100;
    alfa = 3; beta = 1;
    
    x1 = 0:N-1;                     % secuencia arbitraria n°1, para el estudio de la linealidad.
    x2 = sin(2*pi*0.3*(1:N));       % secuencia arbitraria n°2, para el estudio de la linealidad.
    x3 = alfa*x1 + beta*x2;         % combinacion lineas de las secuencias n°1 y n°2, para el estudio de la linealidad.
    x4 = [1 zeros(1,N-1)];          % secuencia para estudiar la estabilidad.
    x5 = [zeros(1,5) x1(1:N-5)];    % secuencia para estudiar la invarianza temporal, retardando 5 muestras.
 
% Para n=1
    n = 1;
    y1(n) = x1(2)-2*x1(1);
    y2(n) = x2(2)-2*x2(1);
    y3(n) = x3(2)-2*x3(1);
    y4(n) = x4(2)-2*x4(1);
    y5(n) = x5(2)-2*x5(1);
      
% Realizamos los calculos para n > 1
for n = 2:N-1
    y1(n) = 1/3*(x1(n+1)+x1(n)-x1(n-1));
    y2(n) = 1/3*(x2(n+1)+x2(n)-x2(n-1));
    y3(n) = 1/3*(x3(n+1)+x3(n)-x3(n-1));
    y4(n) = 1/3*(x4(n+1)+x4(n)-x4(n-1));
    y5(n) = 1/3*(x5(n+1)+x5(n)-x5(n-1));
end

% Dibujamos las salidas
    plot(y3,'ro')
    hold on
    plot(alfa*y1+beta*y2,'g*');
    title('Linealidad del sistema')
    xlabel('n')
    legend('y_3(n)','\alphay_1(n)+\betay_2(n)')
    
    figure
    stem(y4,'r')
    title('Estabilidad del sistema')
    xlabel('n')
    
    figure 
    stem(y5,'ro')
    title('Invarianza temporal del sistema')
    xlabel('n')
    hold on
    plot([zeros(1,5) y1(1:N-5)],'g*');
    xlabel('n')