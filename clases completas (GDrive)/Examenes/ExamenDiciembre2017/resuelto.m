% Importante: se considera el primer elemento como n = 1 y no n = 0

    clear
    close all

% Generamos 5 secuencia para estudiar el sistema
    N = 100;
    alfa = 3; beta = 0.5;
    
    x1 = 0:N-1;                         % secuencia arbitraria n°1, para el estudio de la LINEALIDAD.
    x2 = sin(2*pi*0.3*(1:N));           % secuencia arbitraria n°2, para el estudio de la LINEALIDAD.
    x3 = alfa*x1 + beta*x2;             % combinacion lineas de las secuencias n°1 y n°2, para el estudio de la LINEALIDAD.
    x4 = [1 zeros(1,N-1)];              % secuencia para estudiar la ESTABILIDAD.
    x5 = [zeros(1,5) x1(1:N-5)];        % secuencia para estudiar la INVARIANZA TEMPORAL, retardando 5 muestras.

% Consideramos las siguientes condiciones iniciales y[-1] = 0.5; y[0] = 2
%     y_1 = 0.5; 
    y_0 = 1;
    
% Debemos calcular las salidas para las entradas anteriores y1[n],y2[n], y3[n], y4[n], por ultimo y5[n]   
% Determinamos fuera del bucle la salida para índices problemáticos n = 1 y n = 2

% Para n = 1
    n = 1;
    y1(n) = ((n-1)/n) * y_0 + (1/n) * x1(n);
    y2(n) = ((n-1)/n) * y_0 + (1/n) * x2(n);
    y3(n) = ((n-1)/n) * y_0 + (1/n) * x3(n);
    y4(n) = ((n-1)/n) * y_0 + (1/n) * x4(n);
    y5(n) = ((n-1)/n) * y_0 + (1/n) * x5(n);
    
%     y1(n) = x1(1)-2*0-y_1;
%     y2(n) = x2(1)-2*0-y_1;
%     y3(n) = x3(1)-2*0-y_1;
%     y4(n) = x4(1)-2*0-y_1;
%     y5(n) = x5(1)-2*0-y_1;
    
% % Para n = 2
%     n = 2;
%     y1(n) = x1(2)-2*x1(2-1)-y0;
%     y2(n) = x2(2)-2*x2(2-1)-y0;
%     y3(n) = x3(2)-2*x3(2-1)-y0;
%     y4(n) = x4(2)-2*x4(2-1)-y0;
%     y5(n) = x5(2)-2*x5(2-1)-y0;
    
% Realizamos los cálculos para n > 2
for n = 2:N
    y1(n) = ((n-1)/n) * y1(n-1) + (1/n) * x1(n);
    y2(n) = ((n-1)/n) * y2(n-1) + (1/n) * x2(n);
    y3(n) = ((n-1)/n) * y3(n-1) + (1/n) * x3(n);
    y4(n) = ((n-1)/n) * y4(n-1) + (1/n)* x4(n);
    y5(n) = ((n-1)/n) * y5(n-1) + (1/n) * x5(n);
end

% Dibujamos las salidas
    figure(1)
    plot(y3,'ro')
    hold on
    plot(alfa*y1+beta*y2,'g*');
    title('Linealidad del sistema')
    xlabel('n')
    legend('y_3(n)','\alphay_1(n)+\betay_2(n)')
    
    figure (2)
    stem(y4,'r')
    title('Estabilidad del sistema')
    xlabel('n')
    
    figure(3)
    stem(y5,'ro')
    title('Invarianza temporal del sistema')
    xlabel('n')
    hold on
    plot([zeros(1,5) y1(1:N-5)],'g*');
    xlabel('n')