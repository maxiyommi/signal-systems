import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sabineT60, riSintetica, edcDb, regresionLineal, tiempoReverberacion, fuentesImagen, llegadas } from '../acustica.js';

const sala = { lx: 10, ly: 8, lz: 4 };

function rngFijo(seed = 1) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s / 2147483647) * 2 - 1; }; }

test('sabine: sala 10x8x4, alpha 0.2 ≈ 0.161*320/(0.2*304)', () => {
  assert.ok(Math.abs(sabineT60(sala, 0.2) - 0.161 * 320 / (0.2 * 304)) < 1e-9);
});

test('sabine: más absorción → menos T60', () => {
  assert.ok(sabineT60(sala, 0.5) < sabineT60(sala, 0.1));
});

test('riSintetica: largo, directo y decaimiento', () => {
  const fs = 8000, ri = riSintetica({ fs, t60: 1.0, duracion: 1.5, rng: rngFijo() });
  assert.equal(ri.length, 12000);
  assert.equal(ri[0], 1);
  const rms = (a, b) => Math.sqrt(ri.slice(a, b).reduce((s, v) => s + v * v, 0) / (b - a));
  const caidaDb = 20 * Math.log10(rms(7000, 9000) / rms(1000, 3000));   // Δt = 0.75 s
  assert.ok(Math.abs(caidaDb - (-45)) < 3, `caída ${caidaDb}`);
});

test('edcDb: empieza en 0 dB y es no creciente', () => {
  const e = edcDb(riSintetica({ fs: 8000, t60: 0.8, duracion: 1, rng: rngFijo(3) }));
  assert.ok(Math.abs(e[0]) < 1e-6);
  for (let i = 1; i < e.length; i++) assert.ok(e[i] <= e[i - 1] + 1e-9);
});

test('regresionLineal: recta exacta', () => {
  const r = regresionLineal([0, 1, 2, 3], [1, 3, 5, 7]);
  assert.ok(Math.abs(r.pendiente - 2) < 1e-12 && Math.abs(r.ordenada - 1) < 1e-12);
});

test('tiempoReverberacion: recupera T60 de una RI sintética (±10%)', () => {
  const fs = 8000;
  for (const t60 of [0.5, 1.2, 2.0]) {
    const e = edcDb(riSintetica({ fs, t60, duracion: t60 * 1.6, rng: rngFijo(7) }));
    const t30 = tiempoReverberacion(e, fs);
    assert.ok(Math.abs(t30 - t60) / t60 < 0.1, `t60=${t60} t30=${t30}`);
  }
});

test('tiempoReverberacion: null si no llega a -35 dB', () => {
  const e = Float32Array.from({ length: 100 }, (_, i) => -i * 0.1);   // llega a -9.9 dB
  assert.equal(tiempoReverberacion(e, 100), null);
});

test('fuentesImagen: orden 0 es solo la fuente; orden 1 agrega 6 espejos', () => {
  assert.equal(fuentesImagen(sala, [2, 3, 1.5], 0).length, 1);
  const i1 = fuentesImagen(sala, [2, 3, 1.5], 1);
  assert.equal(i1.filter(i => i.orden === 1).length, 6);
  assert.ok(i1.some(i => i.pos[0] === -2 && i.pos[1] === 3));       // espejo en x=0
  assert.ok(i1.some(i => i.pos[0] === 18 && i.pos[1] === 3));       // espejo en x=10
});

test('llegadas: directo primero con amp 1; las demás más tarde y menores', () => {
  const ll = llegadas(fuentesImagen(sala, [2, 3, 1.5], 2), [7, 5, 1.5], 0.3);
  assert.ok(Math.abs(ll[0].amp - 1) < 1e-12);
  assert.ok(Math.abs(ll[0].t - Math.hypot(5, 2, 0) / 343) < 1e-12);
  for (const l of ll.slice(1)) assert.ok(l.t >= ll[0].t && l.amp < 1);
});

test('llegadas: alpha=1 (aire libre) deja solo energía del directo', () => {
  const ll = llegadas(fuentesImagen(sala, [2, 3, 1.5], 2), [7, 5, 1.5], 1);
  assert.equal(ll.filter(l => l.amp > 0).length, 1);
});

test('Eyring: para α chico se parece a Sabine; para α grande da menos', async () => {
  const { eyringT60, sabineT60 } = await import('../acustica.js');
  const sala = { lx: 10, ly: 8, lz: 4 };
  assert.ok(Math.abs(eyringT60(sala, 0.05) - sabineT60(sala, 0.05)) / sabineT60(sala, 0.05) < 0.03);
  assert.ok(eyringT60(sala, 0.6) < 0.7 * sabineT60(sala, 0.6));
});

test('tiempo que conviene mostrar en el ecograma: crece con la sala, entre 0,2 y 0,5 s', async () => {
  const { tiempoEcograma } = await import('../acustica.js');
  assert.equal(tiempoEcograma({ lx: 10, ly: 8, lz: 4 }), 0.2);
  assert.ok(tiempoEcograma({ lx: 25, ly: 20, lz: 10 }) > 0.3);
  assert.equal(tiempoEcograma({ lx: 60, ly: 60, lz: 30 }), 0.5);
});

test('envolvente de un ecograma: energía por ventanas, en dB respecto del directo', async () => {
  const { envolventeLlegadas } = await import('../acustica.js');
  // directo (amp 1) en 10 ms y una reflexión de amp 0.1 en 40 ms (−20 dB)
  const e = envolventeLlegadas([{ t: 0.010, amp: 1 }, { t: 0.040, amp: 0.1 }], 0.06, { paso: 0.002, ventana: 0.004 });
  const en = (t) => e.db[Math.round(t / 0.002)];
  assert.ok(Math.abs(en(0.010)) < 1, `en el directo ≈ 0 dB: ${en(0.010)}`);
  assert.ok(Math.abs(en(0.040) + 20) < 1, `en la reflexión ≈ −20 dB: ${en(0.040)}`);
  assert.ok(en(0.025) <= -60, `sin llegadas, piso: ${en(0.025)}`);
});

test('envolvente de llegadas que decaen exponencialmente: baja con el tiempo', async () => {
  const { envolventeLlegadas } = await import('../acustica.js');
  const ll = Array.from({ length: 200 }, (_, k) => ({ t: 0.005 + k * 0.001, amp: Math.pow(10, -3 * (k * 0.001) / 0.5) }));
  const e = envolventeLlegadas(ll, 0.2, { paso: 0.002, ventana: 0.01 });
  const en = (t) => e.db[Math.round(t / 0.002)];
  assert.ok(en(0.05) > en(0.15));
  // 60 dB en 0,5 s: entre 50 y 150 ms caen ≈ 12 dB
  assert.ok(Math.abs(en(0.05) - en(0.15) - 12) < 2, `caída = ${en(0.05) - en(0.15)}`);
});
