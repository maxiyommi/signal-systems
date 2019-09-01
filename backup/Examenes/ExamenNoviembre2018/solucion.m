% LINEARFADE
% This script creates linear fades. Then,
% the "fade–in" is applied to the beginning of
% a sine wave signal. The "fade–out" is applied
% to the end.
%

% See also EXPONENTIALFADE
clc;clear;close all;
Fs = 48000;
Ts = (1/Fs);
t = 0:Ts:3;
t = t(:);
f = 100; phi = 0;
in = sin(2*pi*f.*t + phi);
figure(1)
plot(t,in);
xlabel('Tiempo [s]','Interpreter','latex')
ylabel('Amplitud normalizada','Interpreter','latex')


numOfSamples = 1*Fs; % 1 second fade–in/out
a = linspace(0,1,numOfSamples);
a = a(:);
fadeIn = a;
fadeOut = 1-a; % Equivalent = linspace(1,0,numOfSamples);
figure(2);
plot(a,fadeIn,a,fadeOut);
legend('Fade–in','Fade–out');
xlabel('Tiempo [s]','Interpreter','latex')
ylabel('Amplitud normalizada','Interpreter','latex')

% Fade–in
% Index samples just at the start of the signal
temp = in;
temp(1:numOfSamples) = fadeIn .* in(1:numOfSamples);
figure(3);
plot(t,temp);
xlabel('Tiempo [s]','Interpreter','latex')
ylabel('Amplitud normalizada','Interpreter','latex')

% Fade–out
% Index samples just at the end of the signal
out = in;
out(end-numOfSamples+1:end) = fadeOut.*temp(end-numOfSamples+1:end);
figure(4);
plot(t,out);
xlabel('Tiempo [s]','Interpreter','latex')
ylabel('Amplitud normalizada','Interpreter','latex')