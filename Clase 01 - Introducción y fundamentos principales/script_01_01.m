clc
clear all

%% Ejercicio 1)
    display('Ejecicio 1')
    a1 = 1i*(1-sqrt(3))*(sqrt(3)+1i)
    b1 = (5i)/(1+1i)
    c1 = (1-1i*sqrt(2))^3

%% Ejercicio 2)
    display('Ejecicio 2')
    a2 = (2 + 1i*sqrt(3))
    b2 = (2 + 1i*sqrt(3))^2

    mod_a2 = abs(a2) 
    mod_b2 = abs(b2)
    ang_a2 = angle(a2)*180/pi 
    ang_b2 = angle(b2)*180/pi
    compass(a2,'r');title('Representacion fasorial de un numero complejo'); hold on; compass(b2,'-g'); hold off;

% Ejercicio 3)
    display('Ejecicio 3')
    numerador = (1+1i);
    denominador = (sqrt(3)+1i);
    a3 = numerador/denominador
    mod1 = abs(numerador);
    mod2 = abs(denominador);
    ang1 = angle(numerador);
    ang2 = angle (denominador);
    b3 = (mod1*exp(1i*ang1))/(mod2*exp(1i*ang2))

% Ejercicio 4)
    display('Ejecicio 4')
    a4 = 1*exp(1i)+ 1*exp(3i)
    mod_a4 = abs(a4)
    ang_a4 = angle(a4)