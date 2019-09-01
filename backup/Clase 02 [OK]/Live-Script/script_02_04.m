function script_02_04
    t = -1:0.01:5;  % inicializo la variable independiente't'. Tamaño de t = 5-(-1)/0.01

    % definición de la funcion por tramos
    x1 = zeros(1,100);  % x(t) = 0 si -1 < t <0
    x2 = ones(1,200);  % x(t) = 1 si  0 < t <2
    x3 = 2-((1/2)*t(300:500));  % x(t) = 2-(t/2) si 2 < t < 4
    x4 = zeros(1,100);  % x(t) = 0 si 4 < t < 5

    Xt = [x1 x2 x3 x4];

    tX = (t-1)/-2;  % tener cuidado con el orden de las operaciones

    figure

    plot(t,Xt); 
    hold on
    plot(tX,Xt); title ('\it Trasnformacion de la variable independiente'); ylabel ('Amplitud'); xlabel ('t'); grid on;
    legend('Señal original','Señal transformada')
    hold off
end
