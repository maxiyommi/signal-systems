function script7 (wav, msec, amplitud)
    
    [x1, fs] = audioread(wav);   
    
    msec = msec/1000;
    muestras = round(msec * fs);
%     x2 = flip([zeros(muestras,1); x1(1:end)]*amplitud/2);
    x2 = -[zeros(muestras,1); x1(1:end)]*amplitud/2;
%     x2 = [zeros(muestras,1); x1(1:end)]*amplitud/2;
    x1 = [x1 ; zeros(muestras,1)]/2;
    mix = x2 + 0.5*x1;
    t = 0:seconds(1/fs):seconds(numel(x2)/fs) ;
    t = t(1:end-1);
    
    subplot(2,1,1)
    plot(t,x1,'b'); xlabel('Tiempo'); ylabel('Señal de audio'); grid on; ylim([-0.5 0.5])
    hold on
    plot(t,x2,'r'); legend ('x[n]',[num2str(amplitud),' x[n-',num2str(msec),']'])
    hold off
    subplot(2,1,2)
    plot(t,mix,'b');xlabel('Tiempo'); ylabel('Señal mix'); ylim([-1 1]); grid on
    sound(mix,fs)
end