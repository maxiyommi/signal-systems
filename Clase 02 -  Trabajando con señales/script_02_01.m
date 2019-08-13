clc
clear all

%% Ejercicio a)
    display('Ejecicio a')
    syms t
    x = sym(3*exp(-2*t))
    
    figure ()
    fplot(x,[0 10])
    ylabel('x(t)')
    xlabel('t')
    grid on
    
    E = int(x^2,'t',0,inf);
    En = simplify(E)
    
    Pot = limit((1/(2*T))*(int(x^2,'t',0,2*T)),T,inf);
    Pot = simplify(Pot)

%% Ejercicio b)
    display('Ejecicio b')
    syms t
    w0 = 2*pi*1;
    x = sym(2*cos(w0*t+pi))
    
    figure ()
    fplot(x)
    ylabel('x(t)')
    xlabel('t')
    grid on
    
    E = int(x^2,'t',-inf,inf);
    En = simplify(E)
    
    Pot = limit((1/(2*T))*(int(x^2,'t',0,2*T)),T,inf);
    Pot = simplify(Pot)
    
%% Ejercicio c)
    display('Ejecicio c')
    syms t
    x = sym(2)
    
    figure ()
    fplot(x)
    ylabel('x(t)')
    xlabel('t')
    grid on
    
    E = int(x^2,'t',0,inf);
    En = simplify(E)
    
    Pot = limit((1/(2*T))*(int(x^2,'t',0,2*T)),T,inf);
    Pot = simplify(Pot)