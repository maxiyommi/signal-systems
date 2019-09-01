function ejemplo_3()
% Script para calcular el logaritmo natural de un numero ingresado

    a = input('Ingrese un numero mayor de 0:');
    while a > 0 
        disp(['El logaritmo natural de ', num2str(a), ' es: ', num2str(log(a))]);
        a = input('Ingrese un valor mayor de 0:');
    end
    disp('Debe ingresar un numero positivo ');
    disp('Este programa terminara');

end