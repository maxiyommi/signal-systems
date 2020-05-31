ponderacion = menu('Ingrese la ponderacion que desea aplicar:', 'Ponderacion A', 'Ponderacion C', 'Ponderacion Z');

switch ponderacion
    case 1
        disp('Ponderacion A')
    case 2
        disp('Ponderacion C')
    case 3
        disp('Ponderacion Z')
    otherwise
        disp('No es una ponderacion permitida')
end
