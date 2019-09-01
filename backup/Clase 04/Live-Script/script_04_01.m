clc
clear all

[x, fsX] = audioread('clarinete.mp3');
[h, fsH] = audioread('Mono.wav');
y = conv(0.1*x,h); % Modificar la amplitud para que no sature.

aux = length(y)-length(x);
x2 = [x', zeros(1,aux)];
ysum = 0.5*x2 + 0.5*y';

tX = 0:seconds(1/fsX):seconds(numel(x)/fsX);
tX = tX(1:end-1);
tH = 0:seconds(1/fsH):seconds(numel(h)/fsH); 
tH = tH(1:end-1);
tY = 0:seconds(1/fsX):seconds(numel(y)/fsX); 
tY = tY(1:end-1);
tYsum = 0:seconds(1/fsX):seconds(numel(ysum)/fsX); 
tYsum = tYsum(1:end-1);

% sound(x,fsX)
% pause()
% sound(h,fsH)
% pause()
% sound(y,fsX)
% pause()
% sound(ysum,fsX)

subplot(4,1,1)
plot(tX,0.5*x,'b'); xlabel('Tiempo'); ylabel('Señal anecoica - x(t)'); grid on; ylim([-0.5 0.5])
subplot(4,1,2)
plot(tH,h,'r'); xlabel('Tiempo'); ylabel('Respuesta al impulso - h(t)'); grid on; ylim([-0.5 0.5])
subplot(4,1,3)
plot(tY,y,'r'); xlabel('Tiempo'); ylabel('Salida del sistema - y(t)'); grid on; ylim([-0.5 0.5])
subplot(4,1,4)
plot(tYsum,ysum,'r'); xlabel('Tiempo'); ylabel('Salida del sistema + señal anecoica- y(t)'); grid on; ylim([-0.5 0.5])

audiowrite('vocalMod.wav',y,fsX)