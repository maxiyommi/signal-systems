deviceReader = audioDeviceReader;
    deviceReader.SamplesPerFrame = 512;
    deviceReader.SampleRate = 44100;
    deviceReader.BitDepth = '32-bit float';
setup(deviceReader) ;% Función de MATLAB para autoconfigurar objetos y dismunir la carga computacional

fileWriter = dsp.AudioFileWriter('test.wav', 'FileFormat', 'WAV') % Utilizo AudioFileWriter, objeto de la clase

scope = dsp.TimeScope('SampleRate',44100,'TimeSpan',16,'BufferLength',1.5e6,'YLimits',[-1,1]);


disp('Adquisición iniciada ...')
tic;
while toc < 10 % Bucle de frame
    audioFromDevice = deviceReader();
    scope(audioFromDevice)
    fileWriter(audioFromDevice);
end
disp('Adquisición finalizada.')

release(deviceReader)
release(fileWriter) 