% Declaraci�n e inicializaci�n de variables que intervienen
    M_mol = 28.8*10^-3;
    k = 1.4;
    R = 8.314;
    
% Ingresar un intervalo de temperaturas (en grados cent�grados)
    t = 0:1:25;
    
% Convertir temperatura de grados cent�grados [C] a grados Kelvin [K]
    T = t + 273.5;
    
% Obtener los valores de velocidad correspondientes a la temperatura
    c = sqrt(k*R*T/M_mol);
    
% Combinar valores de temperatura y velocidad en una matriz
    tabla = [t;c];
    
% Crear un t�tulo de tabla
    disp('Tabla de velocidad del sonido en el aire en funci�n de la temperatura')

% Crear encabezados de columna
    disp('Temperatura [C�] Velocidad [m/s]')
    
% Desplegar la tabla
    fprintf('%8.0f %18.2f \n',tabla)
    
% Ploteo de los resultados
    plot(t,c)
    grid on
    axis([min(t) max(t) min(c) inf])
    xlabel('Temperatura [�c]')
    ylabel('Velocidad de prograci�n [c]')
    title('velocidad de propagaci�n del sonido')