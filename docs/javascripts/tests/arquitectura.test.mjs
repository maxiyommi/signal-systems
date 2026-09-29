import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = { window: {} };
vm.runInNewContext(readFileSync(new URL('../arquitectura.js', import.meta.url), 'utf8'), ctx);
const A = ctx.window.ArquitecturaLogica;

test('al elegir un milestone, lo de ese milestone y los anteriores está hecho y lo siguiente queda pendiente', () => {
  assert.equal(A.estado(0, 1), 'hecho');
  assert.equal(A.estado(1, 1), 'hecho');
  assert.equal(A.estado(2, 1), 'pendiente');
  assert.equal(A.estado(3, 3), 'hecho');
});

test('un archivo queda pendiente solo si todo lo que tiene es de milestones posteriores', () => {
  assert.equal(A.estadoArchivo([1, 2], 1), 'hecho');       // signals.py: ya tiene algo de M1
  assert.equal(A.estadoArchivo([2, 2], 1), 'pendiente');
  assert.equal(A.estadoArchivo([3], 3), 'hecho');
});

test('el recorrido de un análisis se muestra en orden de pasos', () => {
  assert.deepEqual([...A.ordenRecorrido([{ paso: 3, t: 'c' }, { paso: 1, t: 'a' }, { paso: 2, t: 'b' }])].map((x) => x.t), ['a', 'b', 'c']);
});
