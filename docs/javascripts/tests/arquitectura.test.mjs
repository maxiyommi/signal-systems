import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = { window: {} };
vm.runInNewContext(readFileSync(new URL('../arquitectura.js', import.meta.url), 'utf8'), ctx);
const A = ctx.window.ArquitecturaLogica;

test('al elegir un milestone, lo de ese milestone y los anteriores está hecho y lo siguiente queda pendiente', () => {
  assert.equal(A.estado(0, 1), 'hecho');
  assert.equal(A.estado(1, 1), 'hecho');
  assert.equal(A.estado(2, 1), 'pendiente');
  assert.equal(A.estado(3, 3), 'hecho');
});

test('un archivo queda pendiente solo si todo lo que tiene es de milestones posteriores', () => {
  assert.equal(A.estadoArchivo([1, 2], 1), 'hecho');       // signals.py: ya tiene algo de M1
  assert.equal(A.estadoArchivo([2, 2], 1), 'pendiente');
  assert.equal(A.estadoArchivo([3], 3), 'hecho');
});

test('el recorrido de un análisis se muestra en orden de pasos', () => {
  assert.deepEqual([...A.ordenRecorrido([{ paso: 3, t: 'c' }, { paso: 1, t: 'a' }, { paso: 2, t: 'b' }])].map((x) => x.t), ['a', 'b', 'c']);
});

test('la línea une los recuadros con tramos en ángulo recto, como un circuito', () => {
  const pts = A.caminoOrtogonal([{ x: 0, y: 0 }, { x: 100, y: 80 }, { x: 160, y: 80 }]);
  // de (0,0) baja a mitad de camino, cruza y baja; en la misma fila va recto
  assert.deepEqual([...pts].map((p) => [p.x, p.y]), [[0, 0], [0, 40], [100, 40], [100, 80], [160, 80]]);
});

test('cada recuadro se enciende cuando la línea llega a él (proporcional al largo recorrido)', () => {
  const t = A.tiemposDeLlegada([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 300 }], 1000);
  assert.deepEqual([...t].map((v) => Math.round(v)), [0, 250, 1000]);
});

test('el recorrido se parte en ida y vuelta: la vuelta arranca en el último punto de la ida', () => {
  const tramos = A.tramosIdaVuelta(['a', 'b', 'c', 'd'], ['ida', 'ida', 'vuelta', 'vuelta']);
  assert.deepEqual([...tramos].map((t) => [t.sentido, [...t.elementos].join('')]), [['ida', 'ab'], ['vuelta', 'bcd']]);
});

test('sin pasos de vuelta, un solo tramo', () => {
  const tramos = A.tramosIdaVuelta(['a', 'b'], [undefined, undefined]);
  assert.equal(tramos.length, 1);
  assert.equal(tramos[0].sentido, 'ida');
});

test('el paquete lleva la etiqueta del último recuadro por el que pasó', () => {
  const hitos = [{ d: 0, etiqueta: 'WAV' }, { d: 100, etiqueta: 'np.ndarray' }, { d: 250, etiqueta: 'bandas' }];
  assert.equal(A.etiquetaEn(0, hitos), 'WAV');
  assert.equal(A.etiquetaEn(99, hitos), 'WAV');
  assert.equal(A.etiquetaEn(100, hitos), 'np.ndarray');
  assert.equal(A.etiquetaEn(400, hitos), 'bandas');
});

test('distancias de los recuadros sobre el camino en ángulo recto', () => {
  assert.deepEqual([...A.distanciasAcumuladas([{ x: 0, y: 0 }, { x: 30, y: 40 }, { x: 30, y: 100 }])], [0, 70, 130]);
});

test('el diagrama arranca en el milestone de la página (o en la API completa si no se indica)', () => {
  assert.equal(A.milestoneInicial('1'), 1);
  assert.equal(A.milestoneInicial('2'), 2);
  assert.equal(A.milestoneInicial('recorrido'), 'recorrido');
  assert.equal(A.milestoneInicial(undefined), 3);
  assert.equal(A.milestoneInicial('7'), 3);
});
