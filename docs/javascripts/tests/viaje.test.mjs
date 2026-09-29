import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = { window: {} };
vm.runInNewContext(readFileSync(new URL('../viaje.js', import.meta.url), 'utf8'), ctx);
const V = ctx.window.ViajeLogica;

test('avanzar y retroceder un paso sin salirse del recorrido', () => {
  assert.equal(V.mover(0, 1, 6), 1);
  assert.equal(V.mover(5, 1, 6), 5);
  assert.equal(V.mover(0, -1, 6), 0);
  assert.equal(V.mover(3, -1, 6), 2);
});

test('actores que el pedido no llega a visitar (el service, si el schema lo frena)', () => {
  assert.deepEqual([...V.omitidos(['cliente', 'router', 'schema', 'cliente'], ['cliente', 'router', 'schema', 'service'])], ['service']);
  assert.deepEqual([...V.omitidos(['cliente', 'router', 'schema', 'service', 'router', 'cliente'], ['cliente', 'router', 'schema', 'service'])], []);
});
