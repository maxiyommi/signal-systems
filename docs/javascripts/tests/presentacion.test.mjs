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

test('se ofrece volver a pantalla completa solo en modo presentación, fuera de ella y si el navegador puede', () => {
  assert.equal(P.ofrecerPantallaCompleta({ presentacion: true, pantallaCompleta: false, soportada: true }), true);
  assert.equal(P.ofrecerPantallaCompleta({ presentacion: true, pantallaCompleta: true, soportada: true }), false);
  assert.equal(P.ofrecerPantallaCompleta({ presentacion: false, pantallaCompleta: false, soportada: true }), false);
  assert.equal(P.ofrecerPantallaCompleta({ presentacion: true, pantallaCompleta: false, soportada: false }), false);
});
