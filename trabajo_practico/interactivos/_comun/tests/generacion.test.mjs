import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generatePinkNoise, generateVossPinkNoise, generateSineSweepPair, pendienteDbPorOctava, convolucionFFT, rngGauss } from '../generacion.js';

const fs = 16000;

test('generatePinkNoise (filtro IIR de la referencia): largo, normalización al 90 % y −3 dB/octava', () => {
  const x = generatePinkNoise(4, fs, rngGauss(3));
  assert.equal(x.length, 4 * fs);
  assert.ok(Math.abs(Math.max(...x.map(Math.abs)) - 0.9) < 1e-6);
  const p = pendienteDbPorOctava(x, fs, 100, 4000);
  assert.ok(Math.abs(p + 3) < 1, `pendiente = ${p}`);
});

test('generateVossPinkNoise (Voss-McCartney): también cae ≈ 3 dB por octava', () => {
  const x = generateVossPinkNoise(4, fs, rngGauss(5));
  assert.equal(x.length, 4 * fs);
  const p = pendienteDbPorOctava(x, fs, 100, 2000);
  assert.ok(Math.abs(p + 3) < 1.5, `pendiente = ${p}`);
});

test('el ruido blanco no tiene pendiente (control del medidor)', () => {
  const r = rngGauss(9);
  const x = Float32Array.from({ length: 4 * fs }, () => r());
  assert.ok(Math.abs(pendienteDbPorOctava(x, fs, 100, 4000)) < 0.7);
});

test('generateSineSweepPair: dos señales del mismo largo, sin superar 1', () => {
  const { sweep, inverseFilter } = generateSineSweepPair(2, 50, 5000, fs);
  assert.equal(sweep.length, 2 * fs);
  assert.equal(inverseFilter.length, 2 * fs);
  assert.ok(Math.max(...sweep.map(Math.abs)) <= 1);
  assert.ok(Math.max(...inverseFilter.map(Math.abs)) <= 0.9 + 1e-6);
});

test('sweep ∗ filtro inverso ≈ impulso: pico en el centro y > 30 dB sobre el resto', () => {
  const { sweep, inverseFilter } = generateSineSweepPair(1, 50, 5000, fs);
  const y = convolucionFFT(sweep, inverseFilter);
  let iPico = 0; for (let i = 0; i < y.length; i++) if (Math.abs(y[i]) > Math.abs(y[iPico])) iPico = i;
  assert.ok(Math.abs(iPico - (sweep.length - 1)) < 5, `pico en ${iPico}`);
  let e = 0, n = 0;
  for (let i = 0; i < y.length; i++) if (Math.abs(i - iPico) > fs * 0.01) { e += y[i] * y[i]; n++; }
  const relacion = 20 * Math.log10(Math.abs(y[iPico]) / Math.sqrt(e / n));
  assert.ok(relacion > 30, `pico/resto = ${relacion} dB`);
});

test('convolucionFFT coincide con la convolución directa', () => {
  const a = Float32Array.from([1, 2, 3]), b = Float32Array.from([0, 1, 0.5]);
  const y = convolucionFFT(a, b), esperado = [0, 1, 2.5, 4, 1.5];
  assert.equal(y.length, esperado.length);
  esperado.forEach((v, i) => assert.ok(Math.abs(y[i] - v) < 1e-6, `y[${i}] = ${y[i]}`));
});
