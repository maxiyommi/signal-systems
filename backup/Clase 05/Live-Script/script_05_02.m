function s = script_05_02
%SF_2 Ejercicios de la gu?a de Series de Fourier. 
%   Script_sf_2 es una funci?n que resuelve los ejercicios 6, 7 y 8 de la
%   gu?a de Series de Fourier de la materia Se?ales y Sistemas de
%   ingenier?a de sonido, UNTREF.
%   Cuenta con tres funciones locales las cuales se corresponden con cada
%   uno de los 3 ejercicios correspondientes. 
%   Las mismas son llamadas como funciones handle por la funci?n principal.
%   
%   Abril, 2018.

    s.ejercicio_6 = @ejercicio_6;
    s.ejercicio_7 = @ejercicio_7;
    s.ejercicio_8 = @ejercicio_8;
    
end

function ejercicio_6
    
% Desarrollo en series de Fourier.    
    T = 2*sym(pi);
    omega = 2*sym(pi)/T;
    syms t n
    f(t) = sym(1);
    ao = int(f,'t',-sym(pi)/2,sym(pi)/2)*(2/T);
    an = int(f*cos(n*omega*t),'t',-pi/2,pi/2)*(2/T);
    an = simplify(an);
    bn = int(f*sin(n*omega*t),'t',-pi/2,pi/2)*(2/T);
    bn = simplify(bn);
    
    disp('Los coeficientes del desarrollo en series de Fourier de f(t) son:')
    disp('ao = ')
    disp(ao)
    disp('an = ')
    disp(an)
    disp('bn = ')
    disp(bn)
    
% Espectros de l?nea y fase.
    h(n) = an;
    for n = 1:10;
        a_n(n) = h(n);
    end
    a_n = double(a_n);    
    h2(n) = bn;
    for n = 1:10;
    b_n(n) = h2(n);
    end
    b_n = double(b_n);
    An = sqrt(a_n.^2 + b_n.^2);
    omega = double(omega);
    n = 1:10;
    omega_n = omega*n;
    figure(1)
    stem(omega_n,An); title('Espectro de l?nea'); xlabel('Frecuencia [rad/s]'); ylabel('Amplitud');
    xlim([0 10]);   
    phi = atan(-b_n./a_n);
    figure(2)
    stem(omega_n,phi); title('Espectro de fase'); xlabel('Frecuencia [rad/s]'); ylabel('Fase');
    xlim([0 10]);
end    

function ejercicio_7
% Desarrollo en serie de Fourier.
    A = [-0.5 0.5 1.5];
    T = max(A)-min(A);
    w = 2*sym(pi)/T;
    syms t n
    f = [2*t -2*t+2];
    Ao = 0;
    for i=1:length(f)
        Ao = Ao + int(f(i),'t',A(i),A(i+1));
    end
    Ao = simplify(Ao/T);
    An = 0;
    for i=1:length(f)
        An = An + int(f(i)*cos(n*w*t),'t',A(i),A(i+1));
    end
    An = simplify(An*2/T);
    Bn = 0;
    for i=1:length(f)
        Bn = Bn + int(f(i)*sin(n*w*t),'t',A(i),A(i+1));
    end
    Bn = simplify(Bn*2/T);
    
    disp('Los coeficientes del desarrollo en series de Fourier de f(t) son:')
    disp('ao = ')
    disp(Ao)
    disp('an = ')
    disp(An)
    disp('bn = ')
    disp(Bn)
    
% Espectros de l?nea y de fase.

    h(n) = An;
    for n = 1:10;
        a_n(n) = h(n);
    end
    a_n = double(a_n); 
    syms n
    h2(n) = Bn;
    for n = 1:10;
        b_n(n) = h2(n);
    end
    b_n = double(b_n);
    A_n = sqrt(a_n.^2 + b_n.^2);
    omega = double(w);
    n = 1:10;
    omega_n = omega*n;
    figure(1)
    stem(omega_n,A_n); title('Espectro de l?nea'); xlabel('Frecuencia [rad/s]'); ylabel('Amplitud');
    xlim([0 max(omega_n)]);   
    phi = atan(-b_n./a_n);
    figure(2)
    stem(omega_n,phi); title('Espectro de fase'); xlabel('Frecuencia [rad/s]'); ylabel('Fase');
    xlim([0 max(omega_n)]);

end

function ejercicio_8

% Primera funci?n:

    syms t n
    f(t) = t^2;

    T = sym(2);
    wo = 2*sym(pi)/T;

    ao = int(f,'t',-1,1)*(2/T);
    an = int(f*cos(n*wo*t),'t',-1,1)*(2/T);
    an = simplify(an);
    bn = int(f*sin(n*wo*t),'t',-1,1)*(2/T);
    bn = simplify(bn);
    
    disp('Los coeficientes del desarrollo en series de Fourier de la primer f(t) son:')
    disp('ao = ')
    disp(ao)
    disp('an = ')
    disp(an)
    disp('bn = ')
    disp(bn)
    
    % Espectros de l?nea y de fase de la primera funci?n.

    h(n) = an;
    for n = 1:10;
        a_n(n) = h(n);
    end
    a_n = double(a_n); 
    syms n
    h2(n) = bn;
    for n = 1:10;
        b_n(n) = h2(n);
    end
    b_n = double(b_n);
    A_n = sqrt(a_n.^2 + b_n.^2);
    omega = double(wo);
    n = 1:10;
    omega_n = omega*n;
    figure(1)
    stem(omega_n,A_n); title('Espectro de l?nea (Primera funcion)'); xlabel('Frecuencia [rad/s]'); ylabel('Amplitud');
    xlim([0 max(omega_n)]);   
    phi = atan(-b_n./a_n);
    figure(2)
    stem(omega_n,phi); title('Espectro de fase (Primera funcion)'); xlabel('Frecuencia [rad/s]'); ylabel('Fase');
    xlim([0 max(omega_n)]);
    
% Segunda funci?n.

    syms t n 
    A = 1;
    f(t) = A*t;
    T = sym(2);
    wo = 2*sym(pi)/T;
    ao = int(f,'t',-1,1)*(2/T);
    an = int(f*cos(n*wo*t),'t',-1,1)*(2/T);
    an = simplify(an);
    bn = int(f*sin(n*wo*t),'t',-1,1)*(2/T);
    bn = simplify(bn);
    
    disp('Mientras que, ')
    disp('los coeficientes del desarrollo en series de Fourier de la primer f(t) son:')
    disp('ao = ')
    disp(ao)
    disp('an = ')
    disp(an)
    disp('bn = ')
    disp(bn)

% Espectros de l?nea y de fase de la segunda funci?n.

    h(n) = an;
    for n = 1:10;
        a_n(n) = h(n);
    end
    a_n = double(a_n); 
    syms n
    h2(n) = bn;
    for n = 1:10;
        b_n(n) = h2(n);
    end
    b_n = double(b_n);
    A_n = sqrt(a_n.^2 + b_n.^2);
    omega = double(wo);
    n = 1:10;
    omega_n = omega*n;
    figure(3)
    stem(omega_n,A_n); title('Espectro de l?nea (Segunda funcion)'); xlabel('Frecuencia [rad/s]'); ylabel('Amplitud');
    xlim([0 max(omega_n)]);   
    phi = atan(-b_n./a_n);
    figure(4)
    stem(omega_n,phi); title('Espectro de fase (Segunda funci?n)'); xlabel('Frecuencia [rad/s]'); ylabel('Fase');
    xlim([0 max(omega_n)]);
end
