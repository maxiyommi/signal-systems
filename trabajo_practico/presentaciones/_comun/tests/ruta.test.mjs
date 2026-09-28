import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RUTA, htmlRuta, htmlSiguiente } from '../ruta.js';

test('RUTA: orden de lectura conceptual → tp → m0 → m1 → m2 → m3', () => {
  assert.deepEqual(RUTA.map((d) => d.id), ['conceptual', 'tp', 'm0', 'm1', 'm2', 'm3']);
});

test('RUTA: sin fechas (las fechas viven en el cronograma)', () => {
  const texto = JSON.stringify(RUTA);
  assert.doesNotMatch(texto, /\b\d{1,2}\/\d{1,2}\b|\b(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b/i);
});

test('htmlRuta: marca la presentación actual sin link y enlaza las demás', () => {
  const h = htmlRuta('m1');
  assert.match(h, /4 de 6/);
  assert.match(h, /class="actual"[\s\S]*?<strong>M1 · Generación<\/strong>/);
  assert.match(h, /href="\.\.\/m0\/"/);
  assert.doesNotMatch(h, /href="\.\.\/m1\/"/);
  assert.match(h, /Clase 6/);
});

test('htmlSiguiente: apunta a la próxima y el último cierra el recorrido', () => {
  assert.match(htmlSiguiente('conceptual'), /href="\.\.\/tp\/"/);
  assert.match(htmlSiguiente('m3'), /Fin del recorrido/);
});

test('htmlRuta/htmlSiguiente: ningún link se repite en la misma slide', () => {
  for (const { id } of RUTA) {
    for (const h of [htmlRuta(id), htmlSiguiente(id)]) {
      const urls = [...h.matchAll(/href="(https:[^"]+)"/g)].map((m) => m[1]);
      assert.equal(new Set(urls).size, urls.length, `${id}: ${urls.join(' ')}`);
    }
  }
});
