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

test('paleta: lee los colores de los gráficos de las variables CSS (sin espacios)', async () => {
  const { paleta } = await import('../grafico.js');
  const vars = { '--g-fondo': ' #161b22', '--g-tinta': '#c9d1d9 ', '--g-violeta': '#818cf8', '--g-senal': '#4f8ff7',
    '--g-grilla': '#30363d', '--g-eje': '#8b949e', '--g-tenue': '#6e7681', '--g-mal': '#f85149' };
  const p = paleta({ getPropertyValue: (n) => vars[n] ?? '' });
  assert.equal(p.papel, '#161b22');
  assert.equal(p.tinta, '#c9d1d9');
  assert.equal(p.violeta, '#818cf8');
  assert.equal(p.senal, '#4f8ff7');
  assert.equal(p.mal, '#f85149');
});

test('paleta: si falta una variable usa el valor oscuro de la landing', async () => {
  const { paleta } = await import('../grafico.js');
  const p = paleta({ getPropertyValue: () => '' });
  assert.equal(p.papel, '#161b22');
  assert.equal(p.tinta, '#c9d1d9');
});
