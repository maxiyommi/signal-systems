function main
    ejercicio3()
end

function ejercicio1 ()
% Funcion que resuelve el ejercicio 1

    clc
    clear all
    
    t1 = 0:0.0001:30;
    A = exp(-0.1*t1).*sin(2/3*t1);
    figure('Name','Ejercicio 2 - A','NumberTitle','off')
    plot(t1,A);ylabel ('A(t)'); xlabel ('Tiempo [s]'); grid on; 
    
    t2 = -1:0.0001:5;
    u1 = ones(1,length(t2));
    u2 = ones(1,length(t2)); u2(1:find(t2==1))=0;
    u3 = 2*ones(1,length(t2)); u3(1:find(t2==3))=0;
    B = u1-u2+u3;
    figure('Name','Ejercicio 2 - B','NumberTitle','off')
    plot(t2,B); ylabel ('B(t)'); xlabel ('Tiempo [s]'); grid on; 
    
    n = -1:1:5;
    d1 = zeros(1,length(n)); d1(find(n==-1))=1;
    d2 = zeros(1,length(n)); d2(find(n==0))=1;
    u1 = ones(1,length(n));
    u2 = ones(1,length(n)); u2(1:find(n==1))=0;
    C = d1-d2+u1-u2;
    figure('Name','Ejercicio 2 - B','NumberTitle','off')
    stem(n,C); ylabel ('C[n]'); xlabel ('Muestras [n]'); grid on; 

end

function ejercicio3 ()
% Funcion que resuelve el ejercicio 3

    % Definicion de los periodos de muestreo [s]
    t_final = 0.01;
    F = 8000;
    % Definicion de la cantindad de muestras en funcion de T
    n1 = 0:1/F:t_final;
    % Definicion de la frecuencia [Hz]
    f = 200;
    % Definicion de las funciones discretas (Digital)
    x1 = 2*sin(2*pi*f*n1);
    % Ploteo de los resultados
    figure('Name','Ejercicio 2 - B','NumberTitle','off')
    stem(n1,x1);title (['Se�al discreta muestreada a ',num2str(1/F), 's']); ylabel ('x1[n]'); xlabel ('Muestras [nT]'); grid on; 
    
    % Definicion de los periodos de muestreo [s]
    F = 1000;
    % Definicion de la cantindad de muestras en funcion de T
    n2 = 0:1/F:t_final;
    % Definicion de la frecuencia [Hz]
    f = 200;
    % Definicion de las funciones discretas (Digital)
    x2 = 2*sin(2*pi*f*n2);
    % Ploteo de los resultados
    figure('Name','Ejercicio 2 - B','NumberTitle','off')
    stem(n2,x2);title (['Se�al discreta muestreada a ',num2str(1/F), 's']); ylabel ('x2[n]'); xlabel ('Muestras [nT]'); grid on; 
    
    figure('Name','Ejercicio 2 - B','NumberTitle','off')
    stem(n1,x1);ylabel ('x1[n] & x2[n]'); xlabel ('Muestras [n]'); grid on
    hold on
    stem(n2,x2)
    
end

function ejercicio4 ()
% Funcion que resuelve el ejercicio 3  
    
    fact2(2)
    
    function output = fact2(x)
        if(length(x)>1 || x<0)
            output = 'La entrada debe ser un entero positivo';
        else
            a = 1;
            k = 1;
            while k < x
                k = k+1;
                a = a*k;
            end
            output = a;
        end        
    end
end

function ejercicio5 ()

    n = linspace(0,68,68);
    x = 5*sin(pi*n/10+pi/4);
    x1 = 5*sin(pi*(n-1)/10+pi/4);
    x2 = 5*sin(pi*(n-2)/10+pi/4);
    x3 = 5*sin(pi*(n-3)/10+pi/4);
    x4 = 5*sin(pi*(n-4)/10+pi/4);
    x5 = 5*sin(pi*(n-5)/10+pi/4);
    
    figure
    y = (32/63)*(x+(1/2)*x1+(1/4)*x2+(1/8)*x3+(1/16)*x4+(1/16)*x5);
    stem (n,x2l);

end
