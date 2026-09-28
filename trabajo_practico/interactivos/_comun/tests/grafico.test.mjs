import { test } from 'node:test';
import assert from 'node:assert/strict';
import { distribuirLeyenda, altoCanvas } from '../grafico.js';

test('distribuirLeyenda: en una sola fila si entra', () => {
  const p = distribuirLeyenda([100, 120], 400, { x0: 10, y0: 20, sep: 16, alto: 18 });
  assert.deepEqual(p, [{ x: 10, y: 20 }, { x: 126, y: 20 }]);
});

test('distribuirLeyenda: pasa a la fila siguiente cuando no entra', () => {
  const p = distribuirLeyenda([150, 150, 150], 330, { x0: 10, y0: 20, sep: 16, alto: 18 });
  assert.deepEqual(p.map((q) => q.y), [20, 20, 38]);
  assert.equal(p[2].x, 10);
});

test('distribuirLeyenda: un ítem más ancho que el máximo igual ocupa su propia fila', () => {
  const p = distribuirLeyenda([500, 50], 300, { x0: 0, y0: 0, sep: 10, alto: 20 });
  assert.deepEqual(p, [{ x: 0, y: 0 }, { x: 0, y: 20 }]);
});

test('altoCanvas: proporcional al ancho y acotado', () => {
  assert.equal(altoCanvas(1000, { aspecto: 0.5, min: 200, max: 360 }), 360);
  assert.equal(altoCanvas(300, { aspecto: 0.5, min: 200, max: 360 }), 200);
  assert.equal(altoCanvas(600, { aspecto: 0.5, min: 200, max: 360 }), 300);
});
