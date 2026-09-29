import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = { window: {} };
vm.runInNewContext(readFileSync(new URL('../preguntas.js', import.meta.url), 'utf8'), ctx);
const P = ctx.window.PreguntasLogica;

test('fuera del modo presentación se ven todas las preguntas', () => {
  assert.equal(P.cuantasVisibles({ presentacion: false, reveladas: 1, total: 4 }), 4);
});

test('en modo presentación se ven solo las reveladas, entre 1 y el total', () => {
  assert.equal(P.cuantasVisibles({ presentacion: true, reveladas: 2, total: 4 }), 2);
  assert.equal(P.cuantasVisibles({ presentacion: true, reveladas: 0, total: 4 }), 1);
  assert.equal(P.cuantasVisibles({ presentacion: true, reveladas: 9, total: 4 }), 4);
});
