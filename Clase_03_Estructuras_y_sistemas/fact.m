function res = fact(n)
    if n == 0
        res = 1;
    else
        res = n*fact(n-1); % llamada recursiva
    end
end