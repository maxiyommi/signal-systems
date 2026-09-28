import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gananciasMezcla } from '../mezcla.js';

test('mezcla de igual potencia: 0 = solo directo, 1 = solo reverberado', () => {
  const a = gananciasMezcla(0), b = gananciasMezcla(1);
  assert.ok(Math.abs(a.seco - 1) < 1e-9 && Math.abs(a.humedo) < 1e-9);
  assert.ok(Math.abs(b.seco) < 1e-9 && Math.abs(b.humedo - 1) < 1e-9);
});

test('mezcla de igual potencia: la suma de potencias es 1 en todo el recorrido', () => {
  for (const m of [0.1, 0.25, 0.5, 0.8]) {
    const { seco, humedo } = gananciasMezcla(m);
    assert.ok(Math.abs(seco * seco + humedo * humedo - 1) < 1e-9, `m = ${m}`);
  }
});

test('valores fuera de rango se acotan a [0, 1]', () => {
  assert.deepEqual({ ...gananciasMezcla(-1) }, { ...gananciasMezcla(0) });
  assert.deepEqual({ ...gananciasMezcla(2) }, { ...gananciasMezcla(1) });
});
