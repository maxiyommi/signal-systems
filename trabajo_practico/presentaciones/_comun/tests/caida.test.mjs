import { test } from 'node:test';
import assert from 'node:assert/strict';
import { riConRuido, edcDb, evaluarT30 } from '../acustica.js';

function rngFijo(seed = 1) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s / 2147483647) * 2 - 1; }; }

test('evaluarT30: con ruido bajo (−70 dB) es válido y ≈ T60 (±10 %)', () => {
  const fs = 8000, t60 = 1.2;
  const r = evaluarT30(edcDb(riConRuido({ fs, t60, duracion: 2.5, pisoDb: -70, rng: rngFijo(5) })), fs, -70);
  assert.equal(r.valido, true);
  assert.ok(Math.abs(r.t30 - t60) / t60 < 0.1, `t30=${r.t30}`);
});

test('evaluarT30: con ruido alto (−30 dB) no es válido y explica por qué', () => {
  const fs = 8000;
  const r = evaluarT30(edcDb(riConRuido({ fs, t60: 1.2, duracion: 2.5, pisoDb: -30, rng: rngFijo(5) })), fs, -30);
  assert.equal(r.valido, false);
  assert.match(r.motivo, /10 dB/);
});

test('riConRuido: el piso de ruido queda en el nivel pedido respecto del pico', () => {
  const fs = 8000, ri = riConRuido({ fs, t60: 0.3, duracion: 3, pisoDb: -40, rng: rngFijo(9) });
  const cola = ri.slice(fs * 2);                  // ahí la RI ya decayó muchísimo
  const rms = Math.sqrt(cola.reduce((s, v) => s + v * v, 0) / cola.length);
  const nivel = 20 * Math.log10(rms * Math.sqrt(3));   // ruido uniforme: pico = rms·√3
  assert.ok(Math.abs(nivel - (-40)) < 1.5, `nivel ${nivel}`);
});
