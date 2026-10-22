import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  envolventeHilbert, mediaMovilRms, applySmoothing, linearRegression, tramoYRecta, d50, c80,
  calculateParametersFromIr, applySchroederIntegral,
} from '../analisis.js';
import { rngGauss } from '../generacion.js';

// RI exponencial de banda ancha, como _exponential_ir de los tests del template.
const riExp = (t60, fs, dur, semilla = 1) => {
  const r = rngGauss(semilla);
  return Float32Array.from({ length: Math.round(dur * fs) }, (_, i) => r() * Math.exp((-3 * Math.LN10 * i) / fs / t60));
};

test('envolvente de Hilbert: sigue la amplitud de un seno modulado (como test_smoothing_hilbert_envelope)', () => {
  const fs = 8000;
  const amp = (i) => Math.exp((-3 * i) / fs);
  const x = Float32Array.from({ length: fs }, (_, i) => amp(i) * Math.sin((2 * Math.PI * 500 * i) / fs));
  const env = envolventeHilbert(x);
  assert.equal(env.length, x.length);
  for (let i = fs / 10; i < fs - fs / 10; i += 37) {
    assert.ok(env[i] >= 0);
    assert.ok(Math.abs(env[i] - amp(i)) <= 0.05 * amp(i), `i=${i}: ${env[i]} vs ${amp(i)}`);
  }
});

test('media móvil RMS: mismo largo, no negativa, y para un seno da su valor eficaz (1/√2)', () => {
  const fs = 10000;
  const x = Float32Array.from({ length: 5000 }, (_, i) => Math.sin((2 * Math.PI * 1000 * i) / fs));
  const env = mediaMovilRms(x, fs, 10);
  assert.equal(env.length, x.length);
  assert.ok(env.every((v) => v >= 0));
  assert.ok(Math.abs(env[2500] - Math.SQRT1_2) < 0.01);
  assert.throws(() => applySmoothing(x, fs, 'mediana'), /method/);
  assert.throws(() => applySmoothing(x, fs, 'moving_average', 0), /window_ms/);
});

test('regresión: datos exactos dan R² = 1 y recuperan m y b (como test_linear_regression_exact)', () => {
  const { slope, intercept, r2 } = linearRegression([0, 1, 2, 3, 4], [1, 3, 5, 7, 9]);
  assert.ok(Math.abs(slope - 2) < 1e-12 && Math.abs(intercept - 1) < 1e-12 && Math.abs(r2 - 1) < 1e-12);
});

test('Schroeder: 0 dB al inicio, decreciente, y pendiente −60/T60 entre −5 y −35 dB', () => {
  const fs = 8000, t60 = 1.5;
  const edc = applySchroederIntegral(riExp(t60, fs, 3 * t60));
  assert.ok(Math.abs(edc[0]) < 1e-6);
  for (let i = 1; i < edc.length; i++) assert.ok(edc[i] <= edc[i - 1] + 1e-9);
  const r = tramoYRecta(edc, fs, -5, -35);
  assert.ok(Math.abs(r.slope + 60 / t60) <= 0.1 * (60 / t60), `pendiente ${r.slope}`);
  assert.ok(r.r2 > 0.99);
});

test('D50 y C80 sobre una caída exponencial exacta coinciden con la fórmula cerrada', () => {
  const fs = 48000, t60 = 1;
  const ir = Float32Array.from({ length: 3 * fs }, (_, i) => Math.exp((-3 * Math.LN10 * i) / fs / t60));
  const a = (6 * Math.LN10) / t60;                       // energía ∝ e^(−a t)
  const esperadoD50 = 100 * (1 - Math.exp(-a * 0.05));
  const esperadoC80 = 10 * Math.log10((1 - Math.exp(-a * 0.08)) / Math.exp(-a * 0.08));
  assert.ok(Math.abs(d50(ir, fs) - esperadoD50) < 0.1, `D50 ${d50(ir, fs)} vs ${esperadoD50}`);
  assert.ok(Math.abs(c80(ir, fs) - esperadoC80) < 0.05, `C80 ${c80(ir, fs)} vs ${esperadoC80}`);
});

test('sin rango dinámico suficiente el tiempo es null (no un número inventado), y a 8 kHz se saltea la banda de 4 kHz', () => {
  const fs = 16000, r = rngGauss(9);
  const ir = riExp(1, fs, 2, 9).map((v) => v + 0.01 * r());   // ruido de fondo ≈ −40 dB: no alcanza para T30
  const p = calculateParametersFromIr(ir, fs);
  assert.equal(p.T30[1000], null);
  assert.ok(p.EDT[1000] > 0.7 && p.EDT[1000] < 1.3, `EDT = ${p.EDT[1000]}`);
  const q = calculateParametersFromIr(riExp(1, 8000, 2, 3), 8000);
  assert.ok(!(4000 in q.T30) && 1000 in q.T30);
});

test('parámetros por banda: T30 en 1 kHz ±10 % con T60 = 2 s; D50 en [0, 100]; C80 > 0 con T60 corto', () => {
  const fs = 16000;
  const p = calculateParametersFromIr(riExp(2, fs, 6, 3), fs);
  for (const clave of ['EDT', 'T20', 'T30', 'D50', 'C80']) assert.ok(clave in p);
  assert.ok(Math.abs(p.T30[1000] - 2) <= 0.2, `T30(1k) = ${p.T30[1000]}`);
  const q = calculateParametersFromIr(riExp(1, fs, 2, 5), fs);
  for (const v of Object.values(q.D50)) assert.ok(v >= 0 && v <= 100);
  const c = calculateParametersFromIr(riExp(0.3, fs, 1, 7), fs);
  for (const v of Object.values(c.C80)) assert.ok(v > 0, `C80 = ${v}`);
});
