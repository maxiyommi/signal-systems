function s = script_05_01
%SF_1 Ejercicios de la gu?a de Series de Fourier. 
%   Script_sf_1 es una funci?n que resuelve los ejercicios 1, 4 y 5 de la
%   gu?a de Series de Fourier de la materia Se?ales y Sistemas de
%   ingenier?a de sonido, UNTREF.
%   Cuenta con tres funciones locales las cuales se corresponden con cada
%   uno de los 3 ejercicios correspondientes. 
%   Las mismas son llamadas como funciones handle por la funci?n principal.
%   
%   Abril, 2018.

    s.ejercicio_1 = @ejercicio_1;
    s.ejercicio_4 = @ejercicio_4;
    s.ejercicio_5 = @ejercicio_5;

end

function ejercicio_1

% a) grafica de la funci?n.
    t1 = -2:0.001:2;
    f1 = exp(-4.*t1);

    plot(t1,f1,'k'); 
    title('Grafica de la funcion f(t)'); 
    xlabel('t [s]'); 
    ylabel ('f(t)'); 
    grid on;

% b) obtenci?n del desarrollo en series de Fourier. 

    T = 4;
    w = 2*sym(pi)/T;
    syms t n 
    f(t) = exp(sym(-4)*t);
    ao = int(f(t),'t',-2,2)*(2/T);
    an = int(f(t)*cos(n*w*t),'t',-2,2)*(2/T);
    bn = int(f(t)*sin(n*w*t),'t',-2,2)*(2/T);

    disp('Los coeficientes del desarrollo en series de Fourier de f(t) son:')
    disp('ao = ')
    disp(ao)
    disp('an = ')
    disp(an)
    disp('bn = ')
    disp(bn)
    disp('Recordar que sin(n*pi) = 0 para cualquier valor de n y que cos(n*pi) = (-1)^n. MATLAB no simplifica esas expresiones.')

end 

function ejercicio_4

    syms t n 
    T = 2*sym(pi);
    w = 2*sym(pi)/T;
    f = [5*sin(t) 0];
    A = [0 sym(pi) 2*sym(pi)];
    ao = 0;
        for i = 1:length(f)
            ao = ao + int(f(i),'t',A(i),A(i+1));
        end

    ao = ao*2/T;
    an = 0;
        for i = 1:length(f)
            an = an + int(f(i)*cos(n*w*t),'t',A(i),A(i+1));
        end

    an = an*2/T;
    an = simplify(an);
    bn = 0;
        for i = 1:length(f)
            bn = bn + int(f(i)*sin(n*w*t),'t',A(i),A(i+1));
        end

    bn = bn*2/T;
    bn = simplify(bn);
    
    disp('Los coeficientes del desarrollo en series de Fourier de f(t) son:')
    disp('ao = ')
    disp(ao)
    disp('an = ')
    disp(an)
    disp('bn = ')
    disp(bn)

end

function ejercicio_5

% a) gr?fico de f(t)

    t = -pi:0.001:pi;
    f = [pi*ones(1,length(t)/2),0:0.001:pi];
    t1 = pi:0.001:3*pi;
    t2 = -3*pi:0.001:-pi;
    t3 = -4*pi:0.001:-3*pi;
    t4 = 3*pi:0.001:4*pi;
    plot(t,f,'k'); title('Gr?fica de f(t)'); xlabel('t [s]'); ylabel('f(t)'); 
    hold on;
    plot(t1,f,'k')
    plot(t2,f,'k')
    plot(t3,f(1,length(f)/2:end-1),'k')
    plot(t4,f(1,1:length(f)/2),'k')
    xlim([-4*pi 4*pi])

% b) Desarrollo en series de Fourier.

    syms t n 
    T = 2*sym(pi);
    w = 2*sym(pi)/T;
    f = [sym(pi), t];
    f = sym(f);
    A = [-sym(pi) 0 sym(pi)];
    ao = 0;
    for i = 1:length(f)
        ao = ao + int(f(i),'t',A(i),A(i+1));
    end
    ao = ao*2/T;
    ao = simplify(ao);

    an = 0;
    for i = 1:length(f)
        an = an + int(f(i)*cos(n*w*t),'t',A(i),A(i+1));
    end
    an = an*2/T;
    an = simplify(an);

    bn = 0;
    for i = 1:length(f)
        bn = bn + int(f(i)*sin(n*w*t),'t',A(i),A(i+1));
    end
    bn = bn*2/T;
    bn = simplify(bn);
    
    disp('Los coeficientes del desarrollo en series de Fourier de f(t) son:')
    disp('ao = ')
    disp(ao)
    disp('an = ')
    disp(an)
    disp('bn = ')
    disp(bn)

end