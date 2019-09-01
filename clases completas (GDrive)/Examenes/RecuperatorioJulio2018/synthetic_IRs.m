function ir = synthetic_IRs

    ir.self.RT = [2.02 2.07 2.34 1.39 1 1.17 1 0.76]; % tiempo de reverberacion T60 [s]
    a = [-8.51 -5.02 -3.53 -2.78 0 2.79 2.51 2.38]; % amplitud RMS [dB]
    ir.self.A = 10.^(a./20); % amplitud RMS
    ir.self.fs = 44100; % frecuencia de muestreo [Hz]
    ir.self.tiempo = max(ir.self.RT); % tiempo del archivo [s]
    coef = 30; % relacion S/N deseada entre el impulso y el ruido [dB]
    
    t = 0:1/ir.self.fs:ir.self.tiempo;
    ir.self.t = t(1:end-1); % vector tiempo
   
    ir.self.f = [62.5 125 250 500 1000 2000 4000 8000]; % 8 bandas de octava IEC [Hz]

    audio_impulso = impulso(ir);
    audiowrite('audio_impulso.wav',audio_impulso,ir.self.fs);
    rms_impulso = rms(audio_impulso);
     
    audio_noise = noise(ir);
    audiowrite('audio_noise.wav',audio_noise,ir.self.fs);
    rms_noise = rms(audio_noise);
    
    SNR_original = 20*log10(rms_impulso/rms_noise); % relacion S/N original
      
    fact = 10^(coef/20)*(rms_noise/rms_impulso);
    audio_impulso = (audio_impulso*fact);
    rms_impulso = rms(audio_impulso);
    
    SNR_final = 20*log10(rms_impulso/rms_noise);
    
    
    audio_impulsoNoise = (audio_impulso + audio_noise); 
    audio_impulsoNoise  = audio_impulsoNoise / max(abs(audio_impulsoNoise));
    audiowrite('audio_impulsoNoise.wav',audio_impulsoNoise,ir.self.fs);
    
    audio_anec = audioread('clarinete.wav');

    audio_reverb = conv(audio_anec,audio_impulsoNoise); 
    audio_reverb = audio_reverb / max(abs(audio_reverb));
    audiowrite('audio_reverb.wav',audio_reverb,ir.self.fs)
end

function audio = impulso (ir)
% audio = impulso (ir)
%
% Funcion para generar un audio de una respuesta al impulso sintetizada.
%
% Argumentos de la funcion
% - ir:     estructura con las caracteristicas de la respuesta al impulso.
%
% Retorno
% - audio:  es la señal de audio normalizada.
%
% Ultima modificacion 6 de julio de 2018
   
    tao = -log(10^-3)./ir.self.RT ;
    y = zeros(length(ir.self.RT ),length(ir.self.t));

    for i=1:length(ir.self.RT)
        y(i,:) = ir.self.A(i)*exp(-tao(i).*ir.self.t).*cos(2*pi*ir.self.f(i).*ir.self.t);
    end

    audio = sum(y);
    audio = audio/max(abs(audio)); % normalizar
end

function audio = noise (ir)
% audio = ruido_rosa(ir)
%
% Funcion para generar un audio de ruido rosa.
%
% Argumentos de la funcion
% - t:     es el tiempo de duracion del ruido.
% - fs:    es la frecuencia de muestreo.
%
% Retorno
% - audio:  es la señal de audio del ruido rosa generado.
%
% Ultima modificacion 6 de julio de 2018

    Nx = length(ir.self.t); % número de muestras
    Nx = int64(Nx); % transformación del numero real a entero (64 bits)
    B = [0.049922035 -0.095993537 0.050612699 -0.004408786];
    A = [1 -2.494956002 2.017265875 -0.522189400]; % A y B son los coeficientes del filtro 1/f (asociado a la función de transferencia)
    nT60 = round(log(1000)/(1-max(abs(roots(A))))); % estimación del período transitorio del filtro
    v = randn(1,Nx+nT60);  % generación del ruido blanco
    p = filter(B,A,v); % se aplica el filtro 1/f
    audio = p(nT60+1:end); % eliminación del período transitorio del filtro
    audio = audio/max(abs(audio));
end