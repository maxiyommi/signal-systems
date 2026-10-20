import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  OCTAVAS, bordesOctava, bandaValida, gananciaOctava, filtrarOctava, generateSyntheticIr,
  getImpulseResponse, logarithmicScaleConversion, t60Schroeder, correlacionAlineada, leerWav,
} from '../procesamiento.js';
import { generateSineSweepPair, convolucionFFT, rngGauss } from '../generacion.js';

const db = (g) => 20 * Math.log10(g);
const nivelDb = (y, x) => {
  const c = (s) => Math.sqrt(s.slice(s.length / 4, (3 * s.length) / 4).reduce((a, v) => a + v * v, 0));
  return db(c(y) / c(x));
};

test('bordes IEC 61260 y bandas por debajo de Nyquist', () => {
  const [a, b] = bordesOctava(1000);
  assert.ok(Math.abs(a - 707.1) < 0.1 && Math.abs(b - 1414.2) < 0.1);
  assert.equal(OCTAVAS.length, 10);
  assert.equal(bandaValida(16000, 44100), false);   // 22,6 kHz > 22,05 kHz
  assert.equal(bandaValida(16000, 48000), true);
});

test('gananciaOctava (una pasada, como sosfreqz): 0 dB en fc, −3 dB en los bordes, < −20 dB a una octava', () => {
  for (const fc of [31.5, 125, 1000, 8000]) {
    const [f1, f2] = bordesOctava(fc);
    assert.ok(Math.abs(db(gananciaOctava(fc, fc, 44100))) < 0.01, `fc ${fc}`);
    assert.ok(Math.abs(db(gananciaOctava(f1, fc, 44100)) + 3.01) < 0.01, `f_inf ${fc}`);
    assert.ok(Math.abs(db(gananciaOctava(f2, fc, 44100)) + 3.01) < 0.01, `f_sup ${fc}`);
    assert.ok(db(gananciaOctava(fc / 2, fc, 44100)) < -20 && db(gananciaOctava(2 * fc, fc, 44100)) < -20);
  }
  // Valores de referencia de scipy: sosfreqz de butter(4, [707.1, 1414.2], 'band', fs=44100).
  assert.ok(Math.abs(db(gananciaOctava(2000, 1000, 44100)) + 26.277) < 0.001);
  assert.ok(Math.abs(db(gananciaOctava(500, 1000, 44100)) + 26.105) < 0.001);
});

test('filtrarOctava (fase cero, como sosfiltfilt): un seno en fc pasa, a 4·fc queda < −20 dB, y en el borde −6 dB', () => {
  const fs = 48000, fc = 1000, n = fs;
  const seno = (f) => Float32Array.from({ length: n }, (_, i) => Math.sin((2 * Math.PI * f * i) / fs));
  assert.ok(Math.abs(nivelDb(filtrarOctava(seno(fc), fs, fc), seno(fc))) < 0.5);
  assert.ok(nivelDb(filtrarOctava(seno(4 * fc), fs, fc), seno(4 * fc)) < -20);
  const fb = bordesOctava(fc)[1];
  assert.ok(Math.abs(nivelDb(filtrarOctava(seno(fb), fs, fc), seno(fb)) + 6.02) < 0.5);
});

test('generateSyntheticIr: largo pedido, pico 1 y T60 en 1 kHz dentro del 10 % (como test_synthetic_ir_decay)', () => {
  const fs = 16000, t60 = 2;
  const ir = generateSyntheticIr(3 * t60, { 1000: t60 }, fs, rngGauss(7));
  assert.equal(ir.length, 3 * t60 * fs);
  assert.ok(Math.abs(Math.max(...ir.map(Math.abs)) - 1) < 1e-6);
  const medido = t60Schroeder(filtrarOctava(ir, fs, 1000), fs);
  assert.ok(Math.abs(medido - t60) <= 0.1 * t60, `T60 medido = ${medido}`);
});

test('generateSyntheticIr multibanda: cada banda conserva su T60', () => {
  const fs = 16000, t60s = { 250: 1.6, 1000: 1.0, 4000: 0.5 };
  const ir = generateSyntheticIr(3, t60s, fs, rngGauss(11));
  for (const [fc, t60] of Object.entries(t60s)) {
    const medido = t60Schroeder(filtrarOctava(ir, fs, Number(fc)), fs);
    assert.ok(Math.abs(medido - t60) <= 0.15 * t60, `${fc} Hz: ${medido} vs ${t60}`);
  }
});

test('getImpulseResponse: recupera una RI conocida (correlación > 0,9, como test_impulse_response_peak)', () => {
  const fs = 16000, r = rngGauss(3);
  const n = Math.round(0.5 * fs);
  const ir = Float32Array.from({ length: n }, (_, i) => 0.3 * r() * Math.exp((-3 * Math.LN10 * i) / (0.3 * fs)));
  ir[0] = 1;
  const { sweep, inverseFilter } = generateSineSweepPair(2, 20, 7000, fs);
  const recuperada = getImpulseResponse(convolucionFFT(sweep, ir), inverseFilter, fs);
  assert.ok(Math.abs(Math.max(...recuperada.map(Math.abs)) - 1) < 1e-6);
  const c = correlacionAlineada(recuperada, filtrarOctava(ir, fs, 1000));   // banda dentro del sweep
  const cTotal = correlacionAlineada(recuperada, ir);
  assert.ok(cTotal > 0.9 || c > 0.9, `correlación = ${cTotal.toFixed(3)} / ${c.toFixed(3)}`);
});

test('logarithmicScaleConversion: máximo 0 dB, mitad −6 dB, cero sin −inf', () => {
  const y = logarithmicScaleConversion(Float32Array.from([0.1, 1, 0.5, 0]), -120);
  assert.equal(y[1], 0);
  assert.ok(Math.abs(y[2] + 6.02) < 0.01);
  assert.equal(y[3], -120);
  assert.ok(Number.isFinite(logarithmicScaleConversion(Float32Array.from([1, 0]))[1]));
});

function wav({ fs = 8000, canales = 1, bits = 16, muestras }) {
  const bytes = bits / 8, datos = muestras.length * bytes;
  const b = new ArrayBuffer(44 + datos), v = new DataView(b);
  const esc = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  esc(0, 'RIFF'); v.setUint32(4, 36 + datos, true); esc(8, 'WAVE'); esc(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, canales, true); v.setUint32(24, fs, true);
  v.setUint32(28, fs * canales * bytes, true); v.setUint16(32, canales * bytes, true); v.setUint16(34, bits, true);
  esc(36, 'data'); v.setUint32(40, datos, true);
  muestras.forEach((m, i) => v.setInt16(44 + i * 2, m, true));
  return b;
}

test('leerWav: fs del encabezado, PCM 16 a [−1, 1] y estéreo promediado a mono', () => {
  const m = leerWav(wav({ fs: 48000, muestras: [32767, -32768, 16384, 0] }));
  assert.equal(m.fs, 48000);
  assert.equal(m.signal.length, 4);
  assert.ok(m.signal[0] > 0.99 && m.signal[1] === -1 && Math.abs(m.signal[2] - 0.5) < 1e-4);
  const e = leerWav(wav({ canales: 2, muestras: [16384, 0, 16384, 0] }));   // izq 0,5 · der 0
  assert.equal(e.canales, 2);
  assert.equal(e.signal.length, 2);
  assert.ok(Math.abs(e.signal[0] - 0.25) < 1e-4);
  assert.throws(() => leerWav(new TextEncoder().encode('esto no es un archivo de audio').buffer), /no es un archivo WAV/);
});
