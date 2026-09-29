import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// pizarra.js es un script clásico (lo carga MkDocs); se evalúa en un contexto aislado sin DOM.
const ctx = { window: {} };
vm.runInNewContext(readFileSync(new URL('../pizarra.js', import.meta.url), 'utf8'), ctx);
const P = ctx.window.PizarraLogica;

const trazo = (puntos, herramienta = 'lapiz') => ({ herramienta, color: '#000', puntos: puntos.map(([x, y]) => ({ x, y, ancho: 3 })) });

// Trazo denso (un punto cada 2 px), como los que genera el lápiz.
const linea = (x0, x1, y) => trazo(Array.from({ length: (x1 - x0) / 2 + 1 }, (_, k) => [x0 + 2 * k, y]));

test('la goma borra solo lo que toca: frotar en el medio parte el trazo en dos', () => {
  const quedan = P.borrarParcial([linea(0, 200, 0)], 100, 0, 10);
  assert.equal(quedan.length, 2);
  assert.ok(Math.max(...quedan[0].puntos.map((p) => p.x)) < 100 - 10);
  assert.ok(Math.min(...quedan[1].puntos.map((p) => p.x)) > 100 + 10);
});

test('la goma en la punta acorta el trazo sin partirlo', () => {
  const quedan = P.borrarParcial([linea(0, 200, 0)], 200, 0, 10);
  assert.equal(quedan.length, 1);
  assert.ok(Math.max(...quedan[0].puntos.map((p) => p.x)) < 200 - 10);
});

test('la goma no une puntos que quedaron a ambos lados de ella', () => {
  // Dos puntos lejanos, sin puntos intermedios: el segmento cruza la goma y se corta.
  const quedan = P.borrarParcial([trazo([[0, 0], [400, 0]])], 200, 0, 10);
  assert.equal(quedan.length, 2);
  assert.equal(quedan[0].puntos.length, 1);
  assert.equal(quedan[1].puntos.length, 1);
});

test('lejos de todo trazo, la goma no cambia nada; encima de un punto suelto, lo borra', () => {
  const t = linea(0, 100, 0);
  assert.equal(P.borrarParcial([t], 50, 60, 10)[0], t);
  assert.equal(P.borrarParcial([trazo([[5, 5]])], 5, 5, 10).length, 0);
});

test('los trazos conservan herramienta y color al partirse', () => {
  const t = { ...linea(0, 200, 0), herramienta: 'resaltador', color: 'violeta' };
  for (const q of P.borrarParcial([t], 100, 0, 10)) { assert.equal(q.herramienta, 'resaltador'); assert.equal(q.color, 'violeta'); }
});

test('colores según el tema: en oscuro más brillantes que en claro, el resaltador translúcido', () => {
  const brillo = (hex) => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255); };
  for (const c of ['violeta', 'rojo']) assert.ok(brillo(P.colorDe(c, true)) > brillo(P.colorDe(c, false)), c);
  const alfa = (rgba) => Number(rgba.match(/[\d.]+\)$/)[0].replace(')', ''));
  assert.ok(alfa(P.colorDe('resaltador', true)) <= 0.25);
  assert.ok(alfa(P.colorDe('resaltador', false)) <= 0.35);
});

test('contenido → pantalla: el trazo sigue al contenido, se desplace la ventana o un contenedor', () => {
  // origen = esquina del contenido en pantalla (cambia al hacer scroll, sea cual sea el elemento que se desplaza)
  assert.deepEqual({ ...P.aPantalla({ x: 10, y: 500 }, { origenX: 40, origenY: -300 }) }, { x: 50, y: 200 });
  assert.deepEqual({ ...P.aDocumento(50, 200, { origenX: 40, origenY: -300 }) }, { x: 10, y: 500 });
});

test('el grosor crece con la presión del lápiz y el resaltador es más ancho', () => {
  assert.ok(P.anchoTrazo('lapiz', 1) > P.anchoTrazo('lapiz', 0.2));
  assert.ok(P.anchoTrazo('resaltador', 0.5) > P.anchoTrazo('lapiz', 1));
  assert.ok(P.anchoTrazo('lapiz', 0) > 0);   // mouse sin presión: igual se ve
});

test('visibilidad: solo en modo presentación y nunca embebida en un iframe', () => {
  assert.equal(P.debeMostrar({ enIframe: false, enPresentacion: false }), false);
  assert.equal(P.debeMostrar({ enIframe: false, enPresentacion: true }), true);
  assert.equal(P.debeMostrar({ enIframe: true, enPresentacion: true }), false);
});

test('transformación del lienzo: dibuja en coordenadas de pantalla aunque el lienzo esté corrido', () => {
  // Lienzo que empieza en (10, 20) de la pantalla, con densidad 2: un punto de pantalla (10, 20)
  // tiene que caer en el píxel (0, 0) del lienzo.
  const [a, b, c, d, e, f] = P.transformacion({ left: 10, top: 20 }, 2);
  assert.deepEqual([a, b, c, d], [2, 0, 0, 2]);
  assert.equal(a * 10 + e, 0);
  assert.equal(d * 20 + f, 0);
});
