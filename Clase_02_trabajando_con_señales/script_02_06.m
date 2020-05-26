clc
clear all

% Ejercicio 1
    display('Ejecicio 1')
    n = -5:1:5;
    x = [0 0 0 1 2 3 2 2 1 0 0];
    y_a  = x/2+(((-1).^n)/2).*x;
    
    figure('Name','Primer ejercicio del punto 8 de la guia 2','NumberTitle','off','WindowStyle','modal','Color',[1 1 1])
    stem(n,y_a,'b','diamondr'); title ('Operaciones entre señales'); ylabel ('Amplitud'); xlabel ('n'); grid on; ylim([-4 4]), xlim([-5 5]);   
