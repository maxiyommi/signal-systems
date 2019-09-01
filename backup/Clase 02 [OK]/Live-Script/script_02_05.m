clc
clear all

% Ejercicio 1
    display('Ejecicio 1')
    n = -6:1:7;
    x_1 = [0 0 0 0 0 0 1 2 3 0 0 2 2 0];
    x_2 = [0 0 0 0 -2 -2 2 2 0 -2 0 0 0 0];
    y_a = x_1 + x_2;
    
    figure('Name','Primer ejercicio del punto 4 de la guia 2','NumberTitle','off','WindowStyle','modal','Color',[1 1 1])
    stem(n,x_1,'r',':diamondr'); title ('Operaciones entre señales'); ylabel ('Amplitud'); xlabel ('n'); grid on; ylim([-5 5]), xlim([-6 7]);   
    hold on
    stem(n,x_2,'b'); 
    stem(n,y_a,'d','filled'); legend('\it x_1 [n]','\it x_2 [n]', '\it x_1 [n] + x_2 [n]')