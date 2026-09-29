import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = { window: {} };
vm.runInNewContext(readFileSync(new URL('../presentacion.js', import.meta.url), 'utf8'), ctx);
const P = ctx.window.PresentacionLogica;

test('una pestaña abierta desde el modo presentación trae ?presentacion en la URL', () => {
  assert.equal(P.presentacionEnUrl('?presentacion=1'), true);
  assert.equal(P.presentacionEnUrl('?sin3d&presentacion=1'), true);
  assert.equal(P.presentacionEnUrl(''), false);
  assert.equal(P.presentacionEnUrl('?sin3d'), false);
});

test('el botón de pantalla completa es una herramienta del modo presentación (si el navegador puede)', () => {
  assert.equal(P.mostrarBotonPantalla({ presentacion: true, soportada: true }), true);
  assert.equal(P.mostrarBotonPantalla({ presentacion: false, soportada: true }), false);
  assert.equal(P.mostrarBotonPantalla({ presentacion: true, soportada: false }), false);
});
