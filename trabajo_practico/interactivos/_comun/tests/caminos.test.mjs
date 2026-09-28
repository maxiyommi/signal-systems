import { test } from 'node:test';
import assert from 'node:assert/strict';
import { caminoPlegado, fuentesImagen } from '../acustica.js';

const sala = { lx: 10, ly: 8, lz: 4 };
const fuente = [2, 3, 1.5], mic = [7, 5, 1.5];
const cerca = (a, b, tol = 1e-9) => a.every((v, i) => Math.abs(v - b[i]) < tol);

test('caminoPlegado: orden 0 es el segmento fuente → mic', () => {
  const c = caminoPlegado(sala, [2, 3, 1.5], mic);
  assert.equal(c.length, 2);
  assert.ok(cerca(c[0], fuente) && cerca(c[1], mic));
});

test('caminoPlegado: espejo en la pared x=0 rebota una vez sobre esa pared', () => {
  const c = caminoPlegado(sala, [-2, 3, 1.5], mic);
  assert.equal(c.length, 3);
  assert.ok(cerca(c[0], fuente), `inicio ${c[0]}`);
  assert.ok(Math.abs(c[1][0]) < 1e-9, `rebote en x=0: ${c[1]}`);
  assert.ok(cerca(c[2], mic));
});

test('caminoPlegado: todos los puntos quedan dentro de la sala y el largo total es la distancia a la imagen', () => {
  for (const { pos } of fuentesImagen(sala, fuente, 3)) {
    const c = caminoPlegado(sala, pos, mic);
    for (const p of c) {
      assert.ok(p[0] >= -1e-9 && p[0] <= 10 + 1e-9 && p[1] >= -1e-9 && p[1] <= 8 + 1e-9 && p[2] >= -1e-9 && p[2] <= 4 + 1e-9);
    }
    let largo = 0;
    for (let i = 1; i < c.length; i++) largo += Math.hypot(...c[i].map((v, k) => v - c[i - 1][k]));
    const d = Math.hypot(...pos.map((v, k) => v - mic[k]));
    assert.ok(Math.abs(largo - d) < 1e-6, `largo ${largo} vs ${d}`);
  }
});
