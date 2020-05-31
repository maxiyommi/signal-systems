function script_02_02_b
% script_02_02_b 
%
% Funci�n para representar se�ales con pulso y escalones unitarios. 
%
% Marzo, 2017

    ini = -3;
    fin = 4;
    n = (ini:fin);
    X = -1*pulsoUni(1,ini,fin) + 2*pulsoUni(-1,ini,fin)+ -1*pulsoUni(-2,ini,fin);
    
    Y = -1*(escUni(1,ini,fin)-escUni(0,ini,fin))+2*(escUni(-1,ini,fin)-escUni(-2,ini,fin))+-1*(escUni(-2,ini,fin)-escUni(-3,ini,fin));

    subplot(2,1,1)
    stem(n,X); title ('Representaci�n de se�al en impulso unitario'); ylabel ('X[n]'); xlabel ('Muestras [n]'); grid on;
    subplot(2,1,2)
    stem(n,Y); title ('Representaci�n de se�al en escal�n unitario'); ylabel ('U[n]'); xlabel ('Muestras [n]'); grid on; 
end


function delta = pulsoUni (mov, ini, fin)
% delta = pulsoUni (mov, ini, fin)
%
% Genera un array pulso unitario 
%
% Input
% mov = traslaci�n 
% ini = inicio 
% fin = final
%
% Output
% delta = aray 
%
% Marzo, 2017

    delta = [ zeros( 1 ,abs(ini)- mov), 1 , zeros( 1 ,fin + mov)];    
end

function U = escUni (mov, ini, fin)
% U = escUni (mov, ini, fin)
%
% Genera un array escal�n unitario 
%
% Input
% mov = traslaci�n 
% ini = inicio 
% fin = final
%
% Output
% delta = aray 
%
% Marzo, 2017

    U = [zeros( 1, abs(ini) - mov), 1, ones( 1, fin + mov)]; 
end












