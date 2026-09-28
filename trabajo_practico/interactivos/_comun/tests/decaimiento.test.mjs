import { test } from 'node:test';
import assert from 'node:assert/strict';
import { riConRuido, evaluarDecaimiento, puntoDeCorte, RANGOS } from '../acustica.js';

function rngFijo(seed = 1) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s / 2147483647) * 2 - 1; }; }
const fs = 8000, t60 = 1.2;
const ri = (pisoDb, seed = 5) => riConRuido({ fs, t60, duracion: 2.5, pisoDb, rng: rngFijo(seed) });

test('rangos de evaluación de la ISO 3382: EDT, T10, T20 y T30', () => {
  assert.deepEqual({ ...RANGOS.EDT }, { desde: 0, hasta: -10 });
  assert.deepEqual({ ...RANGOS.T20 }, { desde: -5, hasta: -25 });
  assert.deepEqual({ ...RANGOS.T30 }, { desde: -5, hasta: -35 });
});

test('con ruido muy bajo, EDT, T20 y T30 dan ≈ T60 (±8 %) y son válidos', () => {
  const r = ri(-80);
  for (const nombre of ['EDT', 'T20', 'T30']) {
    const { desde, hasta } = RANGOS[nombre];
    const e = evaluarDecaimiento(r, fs, { desdeDb: desde, hastaDb: hasta });
    assert.equal(e.valido, true, nombre);
    assert.ok(Math.abs(e.tr - t60) / t60 < 0.08, `${nombre} = ${e.tr}`);
  }
});

test('rango dinámico ≈ distancia entre el nivel inicial y el ruido de fondo (±3 dB)', () => {
  const e = evaluarDecaimiento(ri(-50), fs, { desdeDb: -5, hastaDb: -25 });
  assert.ok(Math.abs(e.rangoDinamico - 50) < 3, `rango = ${e.rangoDinamico}`);
});

test('criterio ISO: el ruido tiene que estar 10 dB por debajo del final del tramo', () => {
  const r = ri(-40);                                  // rango dinámico ≈ 40 dB
  const t20 = evaluarDecaimiento(r, fs, { desdeDb: -5, hastaDb: -25 });   // pide 35 dB
  const t30 = evaluarDecaimiento(r, fs, { desdeDb: -5, hastaDb: -35 });   // pide 45 dB
  assert.equal(t20.valido, true);
  assert.equal(t30.valido, false);
  assert.equal(t30.requerido, 45);
  assert.match(t30.motivo, /45 dB/);
});

test('el punto de corte cae donde el decaimiento se cruza con el ruido (±0,15 s)', () => {
  // 50 dB/s de caída y ruido 40 dB por debajo del nivel inicial: cruce en ≈ 0,8 s.
  const corte = puntoDeCorte(ri(-40), fs);
  assert.ok(Math.abs(corte / fs - 0.8) < 0.15, `corte = ${corte / fs} s`);
});

test('recortar la integral en el punto de corte corrige el sesgo del ruido', () => {
  const r = ri(-45);
  const sin = evaluarDecaimiento(r, fs, { desdeDb: -5, hastaDb: -25 });
  const con = evaluarDecaimiento(r, fs, { desdeDb: -5, hastaDb: -25, corte: puntoDeCorte(r, fs) });
  assert.ok(Math.abs(con.tr - t60) < Math.abs(sin.tr - t60), `sin = ${sin.tr}, con = ${con.tr}`);
  assert.ok(Math.abs(con.tr - t60) / t60 < 0.1, `con = ${con.tr}`);
});

test('cortar la integral demasiado temprano subestima el tiempo de reverberación', () => {
  // La integral recortada se desploma al final: la pendiente del tramo se hace más empinada.
  const r = ri(-80);
  const e = evaluarDecaimiento(r, fs, { desdeDb: -5, hastaDb: -25, corte: Math.round(0.3 * fs) });
  assert.ok(e.tr < 0.9 * t60, `tr = ${e.tr}`);
});
