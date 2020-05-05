function delay (wav, msec, amplitud)
% docstring

    [x1, fs] = audioread(wav);   
    
    msec = msec/1000;
    muestras = round(msec * fs);
    x2 = -[zeros(muestras,1); x1(1:end)]*amplitud;
    x1 = [x1 ; zeros(muestras,1)];
    mix = x2 + x1;
    
%% pruebas (5/5)
     graficos(x1,x2,fs,amplitud,msec,mix) % grafico para evaluar el desplazamiento
     record(mix,fs) % audio para escuchar el resultado
%% pruebas (5/6)

end

function graficos(x1,x2,fs,amplitud,msec,mix)

    t = 0:seconds(1/fs):seconds(numel(x2)/fs) ;
    t = t(1:end-1);
    
    figure()
    subplot(2,1,1)
    plot(t,x1,'b'); xlabel('Tiempo'); ylabel('Señal de audio'); grid on; ylim([-1 1])
    hold on
    plot(t,x2,'r'); legend ('x[n]',[num2str(amplitud),' x[n-',num2str(msec),']'])
    hold off
    subplot(2,1,2)
    plot(t,mix,'b');xlabel('Tiempo'); ylabel('Señal mix'); ylim([-1 1]); grid on
end

function record (x,fs)
    norm = x/abs(max(x));
    sound(norm,fs)
    
    t = 0:seconds(1/fs):seconds(numel(x)/fs) ;
    t = t(1:end-1);
    figure()
    plot(t,norm,'b');xlabel('Tiempo'); ylabel('Señal mix'); ylim([-1 1]); grid on
    
end