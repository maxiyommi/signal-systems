clc;
clear all;

cantAlumnos = 30;
cantExamenes = 3;

for i = 1:1:cantAlumnos
    for j = 1:1:cantExamenes
       a(i,j) = round(rand(1)*100);
    end
end
b = [1:cantAlumnos]';
notas = [b a];

save -ascii notas.dat notas
clear all
load notas.dat -ascii
    