function eli = elipseElementos 
% eli = elipseElementos :: sin argumento de entrada
%
% Función para determinar caracteristicas de una elipse.
% 
% Argumentos =  a: semieje mayor ; b: semieje menor
%
% .foco :: arg (a,b) -- (foco de la elipse) -- 
% .excentricidadb :: arg (a,b) -- (excentricidad de la elipse) --
% .area :: arg (a,b) -- (area de la elipse) --
%
% Septiembre 2017

    eli.foco = @calculoFoco;
    eli.excentricidad = @calculoExcentricidad;
    eli.area = @calculoArea;
end

function f = calculoFoco(a,b)
    f = sqrt(a^2-b^2);
end

function e = calculoExcentricidad(a,b)
    f = calculoFoco(a,b);
    e = f/a;
end

function ae = calculoArea(a,b)
    ae = pi*a*b;
end