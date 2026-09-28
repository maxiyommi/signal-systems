import { test } from 'node:test';
import assert from 'node:assert/strict';
import { riSintetica, riConRuido, edcDb, evaluarT30, fuentesImagen, llegadas, sabineT60 } from '../acustica.js';

function rngFijo(seed = 1) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s / 2147483647) * 2 - 1; }; }

test('riSintetica con el rng por defecto no tiene componente de continua (media ≈ 0)', () => {
  const ri = riSintetica({ fs: 8000, t60: 1, duracion: 1 });
  let suma = 0, energia = 0;
  for (let i = 1; i < ri.length; i++) { suma += ri[i]; energia += Math.abs(ri[i]); }
  assert.ok(Math.abs(suma / energia) < 0.05, `media relativa ${suma / energia}`);
});

test('evaluarT30: no declara válido un T30 que se aparta más de 10 % del real (pisos −45 y −50 dB)', () => {
  const fs = 8000, t60 = 1.2;
  for (const piso of [-45, -50]) {
    for (const seed of [11, 3, 7]) {
      const r = evaluarT30(riConRuido({ fs, t60, duracion: 2.5, pisoDb: piso, rng: rngFijo(seed) }), fs);
      if (r.valido) assert.ok(Math.abs(r.t30 - t60) / t60 <= 0.1, `piso ${piso}, semilla ${seed}: T30 = ${r.t30}`);
    }
  }
});

test('ecograma: la envolvente de las llegadas decae al ritmo de Sabine (±35 %)', () => {
  const sala = { lx: 10, ly: 8, lz: 4 }, alpha = 0.3;
  const ll = llegadas(fuentesImagen(sala, [2.5, 4, 1.6], 16), [7.5, 3, 1.6], alpha).filter((l) => l.t > 0.02 && l.t < 0.18);
  // energía por ventana de 20 ms
  const ventanas = new Map();
  for (const l of ll) { const k = Math.floor(l.t / 0.02); ventanas.set(k, (ventanas.get(k) || 0) + l.amp * l.amp); }
  const xs = [], ys = [];
  for (const [k, e] of [...ventanas].sort((a, b) => a[0] - b[0])) { xs.push((k + 0.5) * 0.02); ys.push(10 * Math.log10(e)); }
  const n = xs.length, mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
  const pend = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  const t60Eco = -60 / pend, t60Sab = sabineT60(sala, alpha);
  assert.ok(Math.abs(t60Eco - t60Sab) / t60Sab < 0.35, `ecograma ${t60Eco.toFixed(2)} s vs Sabine ${t60Sab.toFixed(2)} s`);
});
