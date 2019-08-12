function avg = promedio(varargin)
% avg = promedio(v) :: v es un vector
%
% Calcula la media de los elementos de un vector 

    avg = 0; %
    if (length(varargin)~=1)
        error ('promedio (vector)');
    else
        v = varargin{1};
    end
    if (isnumeric(v))
        avg = sum(v) / length(v);
    else
        error ('promedio: espera un unico vector como argumento de entrada');
    end
end