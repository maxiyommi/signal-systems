function [avg, med] = descriptores(x)
% [avg, med] = descriptores(x) :: x es un vector de números
%
% Función para calcular la media (avg) y la mediana (med)

    n = length(x);
    avg = media(x,n);
    med = mediana(x,n);
end

function a = media(v,n)
% Cálculo de la media

    a = sum(v)/n;
end

function m = mediana(v,n)
% Cálculo de la mediana.

    w = sort(v);
    if rem(n,2) == 1
        m = w((n + 1)/2);
    else
        m = (w(n/2) + w(n/2 + 1))/2;
    end
end