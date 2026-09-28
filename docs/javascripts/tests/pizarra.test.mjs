import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// pizarra.js es un script clásico (lo carga MkDocs); se evalúa en un contexto aislado sin DOM.
const ctx = { window: {} };
vm.runInNewContext(readFileSync(new URL('../pizarra.js', import.meta.url), 'utf8'), ctx);
const P = ctx.window.PizarraLogica;

const trazo = (puntos, herramienta = 'lapiz') => ({ herramienta, color: '#000', puntos: puntos.map(([x, y]) => ({ x, y, ancho: 3 })) });

test('la goma borra el trazo completo que toca y deja los demás', () => {
  const trazos = [trazo([[0, 0], [100, 0]]), trazo([[0, 200], [100, 200]])];
  const quedan = P.borrarCerca(trazos, 50, 5, 12);
  assert.equal(quedan.length, 1);
  assert.equal(quedan[0].puntos[0].y, 200);
});

test('la goma detecta el cruce entre dos puntos lejanos del trazo, no solo los vértices', () => {
  const quedan = P.borrarCerca([trazo([[0, 0], [400, 0]])], 200, 4, 10);
  assert.equal(quedan.length, 0);
});

test('lejos de todo trazo, la goma no borra nada', () => {
  const trazos = [trazo([[0, 0], [100, 0]])];
  assert.equal(P.borrarCerca(trazos, 50, 60, 12).length, 1);
});

test('documento → pantalla: el trazo se mueve con el scroll y con el origen del contenido', () => {
  assert.deepEqual({ ...P.aPantalla({ x: 10, y: 500 }, { scrollY: 300, origenX: 40 }) }, { x: 50, y: 200 });
  assert.deepEqual({ ...P.aDocumento(50, 200, { scrollY: 300, origenX: 40 }) }, { x: 10, y: 500 });
});

test('el grosor crece con la presión del lápiz y el resaltador es más ancho', () => {
  assert.ok(P.anchoTrazo('lapiz', 1) > P.anchoTrazo('lapiz', 0.2));
  assert.ok(P.anchoTrazo('resaltador', 0.5) > P.anchoTrazo('lapiz', 1));
  assert.ok(P.anchoTrazo('lapiz', 0) > 0);   // mouse sin presión: igual se ve
});
