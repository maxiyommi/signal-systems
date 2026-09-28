import { test } from 'node:test';
import assert from 'node:assert/strict';
import { espectroPromedioDb, envolventeMinMax } from '../acustica.js';

test('espectroPromedioDb: un seno de 1 kHz tiene su pico en ~1 kHz', () => {
  const fs = 8000, f0 = 1000;
  const x = Float32Array.from({ length: 16000 }, (_, i) => Math.sin(2 * Math.PI * f0 * i / fs));
  const { frecuencias, db } = espectroPromedioDb(x, fs, 1024);
  assert.equal(frecuencias.length, 513);
  assert.equal(db.length, 513);
  let k = 0; for (let i = 1; i < db.length; i++) if (db[i] > db[k]) k = i;
  assert.ok(Math.abs(frecuencias[k] - f0) <= fs / 1024, `pico en ${frecuencias[k]}`);
  assert.ok(Math.abs(db[k]) < 1e-6, 'normalizado a 0 dB en el máximo');
});

test('espectroPromedioDb: señal más corta que la ventana no rompe', () => {
  const { db } = espectroPromedioDb(new Float32Array(100).fill(0.5), 8000, 1024);
  assert.equal(db.length, 513);
  assert.ok(db.every(Number.isFinite));
});

test('envolventeMinMax: una columna por píxel con min ≤ max y el pico capturado', () => {
  const x = new Float32Array(1000); x[500] = 0.9; x[501] = -0.7;
  const { min, max } = envolventeMinMax(x, 100);
  assert.equal(min.length, 100); assert.equal(max.length, 100);
  for (let i = 0; i < 100; i++) assert.ok(min[i] <= max[i]);
  assert.ok(Math.abs(max[50] - 0.9) < 1e-6 && Math.abs(min[50] + 0.7) < 1e-6);
});
