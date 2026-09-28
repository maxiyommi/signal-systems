import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// tema.js es un script clásico (va en el <head> para que no haya destello de colores).
const ctx = { window: {} };
vm.runInNewContext(readFileSync(new URL('../tema.js', import.meta.url), 'utf8'), ctx);
const T = ctx.window.TemaLogica;

test('tema: sigue la elección del sitio (Material guarda el esquema de colores)', () => {
  assert.equal(T.temaDesdePaleta('{"index":1,"color":{"scheme":"default"}}'), 'claro');
  assert.equal(T.temaDesdePaleta('{"index":0,"color":{"scheme":"slate"}}'), 'oscuro');
});

test('tema: sin elección guardada, o ilegible, oscuro como la landing', () => {
  assert.equal(T.temaDesdePaleta(null), 'oscuro');
  assert.equal(T.temaDesdePaleta('no es json'), 'oscuro');
});

test('clave de Material: raíz del sitio + ".__palette"', () => {
  assert.equal(T.clavePaleta('/signal-systems/'), '/signal-systems/.__palette');
});
