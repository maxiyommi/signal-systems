import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = { window: {} };
vm.runInNewContext(readFileSync(new URL('../sweep.js', import.meta.url), 'utf8'), ctx);
const S = ctx.window.SweepLogica;

test('la frecuencia instantánea va de f1 a f2', () => {
  assert.ok(Math.abs(S.frecInst(0, 1, 20, 20000) - 20) < 1e-9);
  assert.ok(Math.abs(S.frecInst(1, 1, 20, 20000) - 20000) < 1e-6);
});

test('cada octava dura lo mismo', () => {
  const c = S.crucesOctava(1, 2, 32);
  assert.deepEqual([...c.map((x) => x.f)], [2, 4, 8, 16, 32]);
  for (let k = 1; k < c.length; k++) assert.ok(Math.abs(c[k].t - c[k - 1].t - 0.25) < 1e-12);
  for (const x of c) assert.ok(Math.abs(S.frecInst(x.t, 1, 2, 32) - x.f) < 1e-9);
});

test('la señal arranca en cero y queda acotada', () => {
  assert.equal(S.senal(0, 1, 2, 32), 0);
  for (let t = 0; t <= 1; t += 0.01) assert.ok(Math.abs(S.senal(t, 1, 2, 32)) <= 1);
});
