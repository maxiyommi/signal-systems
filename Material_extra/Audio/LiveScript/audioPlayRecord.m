fileReader = dsp.AudioFileReader('sinesweep.wav');

deviceWriter = audioDeviceWriter();
    deviceWriter.SampleRate = 44100;
    deviceWriter.BitDepth = '16-bit integer';
fileInfo = audioinfo('sinesweep.wav')

setup(deviceWriter,zeros(fileReader.SamplesPerFrame,fileInfo.NumChannels));

    
deviceReader = audioDeviceReader;
%     deviceReader.SamplesPerFrame = 256;
    deviceReader.SampleRate = 44100;
    deviceReader.BitDepth = '32-bit float';

setup(deviceReader) ;% Función de MATLAB para autoconfigurar objetos y dismunir la carga computacional

fileWriter = dsp.AudioFileWriter('sinesweep_mod.wav', 'FileFormat', 'WAV'); % Utilizo AudioFileWriter, objeto de la clase
    

while ~isDone(fileReader)
    audioData = fileReader();
    audioFromDevice = deviceReader();
    deviceWriter(audioData);
    fileWriter(audioFromDevice);
end

release(fileReader);
release(deviceWriter); 
release(deviceReader)
release(fileWriter)
close all
clear all