import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = { window: {}, URL };
vm.runInNewContext(readFileSync(new URL('../enlaces.js', import.meta.url), 'utf8'), ctx);
const E = ctx.window.EnlacesLogica;
const aqui = 'https://maxiyommi.github.io/signal-systems/trabajo_practico/ruta/';

test('los links externos se abren en pestaña nueva', () => {
  assert.equal(E.enPestanaNueva('https://rir-api.onrender.com/docs', aqui), true);
  assert.equal(E.enPestanaNueva('https://github.com/maxiyommi/signal-systems', aqui), true);
});

test('los links a interactivos se abren en pestaña nueva', () => {
  assert.equal(E.enPestanaNueva('../interactivos/sala.html', aqui), true);
  assert.equal(E.enPestanaNueva('https://maxiyommi.github.io/signal-systems/trabajo_practico/interactivos/caida.html?presentacion=1', aqui), true);
});

test('los links internos del sitio, las anclas y el correo quedan en la misma pestaña', () => {
  assert.equal(E.enPestanaNueva('../rubrica/', aqui), false);
  assert.equal(E.enPestanaNueva('#fechas', aqui), false);
  assert.equal(E.enPestanaNueva('mailto:alguien@ejemplo.com', aqui), false);
  assert.equal(E.enPestanaNueva('https://maxiyommi.github.io/signal-systems/cronograma/', aqui), false);
});
