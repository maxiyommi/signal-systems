import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = { window: {} };
vm.runInNewContext(readFileSync(new URL('../voss.js', import.meta.url), 'utf8'), ctx);
const V = ctx.window.VossLogica;

test('el generador i se renueva cuando cambia el bit i del contador', () => {
  assert.deepEqual([...V.bitsQueCambian(0, 4)], [0, 1, 2, 3]);   // al empezar, todos
  assert.deepEqual([...V.bitsQueCambian(1, 4)], [0]);            // 0000 → 0001
  assert.deepEqual([...V.bitsQueCambian(2, 4)], [0, 1]);         // 0001 → 0010
  assert.deepEqual([...V.bitsQueCambian(8, 4)], [0, 1, 2, 3]);   // 0111 → 1000
});

test('el generador i se renueva cada 2^i muestras', () => {
  const { cambios } = V.simular(64, 4, () => 0.5);
  for (let i = 0; i < 4; i++) {
    const veces = cambios.slice(1).filter((c) => c.includes(i)).length;
    assert.equal(veces, Math.floor(63 / 2 ** i));   // en n = 1..63, cada 2^i muestras
  }
});

test('la suma es la suma de los generadores en cada muestra', () => {
  let k = 0;
  const { gens, suma } = V.simular(16, 3, () => (k++ % 5) / 5 - 0.4);
  for (let n = 0; n < 16; n++) assert.ok(Math.abs(suma[n] - (gens[0][n] + gens[1][n] + gens[2][n])) < 1e-12);
});

test('contador en binario con ceros a la izquierda', () => {
  assert.equal(V.binario(5, 4), '0101');
  assert.equal(V.binario(12, 4), '1100');
});
