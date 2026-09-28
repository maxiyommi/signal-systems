import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = { window: {} };
vm.runInNewContext(readFileSync(new URL('../agenda.js', import.meta.url), 'utf8'), ctx);
const A = ctx.window.AgendaLogica;

const S = [{ fecha: '2026-09-30' }, { fecha: '2026-10-07' }, { fecha: '2026-10-14' }];
const dia = (iso) => new Date(`${iso}T12:00:00`);

test('sesión actual: la última cuya fecha ya llegó; antes del inicio, la primera', () => {
  assert.equal(A.sesionActual(S, dia('2026-09-01')), 0);
  assert.equal(A.sesionActual(S, dia('2026-09-30')), 0);
  assert.equal(A.sesionActual(S, dia('2026-10-06')), 0);
  assert.equal(A.sesionActual(S, dia('2026-10-07')), 1);
  assert.equal(A.sesionActual(S, dia('2026-12-01')), 2);
});

test('clave de una sección: ruta de la página relativa al sitio + ancla', () => {
  assert.equal(A.clave('trabajo_practico/marco_conceptual/', 'la-sala-es-un-sistema'), 'trabajo_practico/marco_conceptual/#la-sala-es-un-sistema');
  assert.equal(A.clave('trabajo_practico/marco_conceptual/', ''), 'trabajo_practico/marco_conceptual/');
});

test('ruta relativa al sitio a partir del pathname y la raíz', () => {
  assert.equal(A.rutaRelativa('/signal-systems/trabajo_practico/ruta/', '/signal-systems/'), 'trabajo_practico/ruta/');
  assert.equal(A.rutaRelativa('/trabajo_practico/', '/'), 'trabajo_practico/');
  assert.equal(A.rutaRelativa('/signal-systems/trabajo_practico/index.html', '/signal-systems/'), 'trabajo_practico/');
});

test('progreso: cuenta secciones vistas; una página sin secciones cuenta como un ítem', () => {
  const paginas = [
    { ruta: 'a/', secciones: [{ id: 'x' }, { id: 'y' }] },
    { ruta: 'b/', secciones: [] },
  ];
  assert.deepEqual({ ...A.progreso(paginas, new Set()) }, { hechos: 0, total: 3, porcentaje: 0 });
  assert.deepEqual({ ...A.progreso(paginas, new Set(['a/#x', 'b/'])) }, { hechos: 2, total: 3, porcentaje: 67 });
  assert.deepEqual({ ...A.progreso(paginas, new Set(['a/#x', 'a/#y', 'b/'])) }, { hechos: 3, total: 3, porcentaje: 100 });
});

test('las sesiones del cronograma están ordenadas y cada una tiene páginas del TP', () => {
  const ses = A.SESIONES;
  assert.ok(ses.length >= 7);
  for (let i = 1; i < ses.length; i++) assert.ok(ses[i - 1].fecha < ses[i].fecha);
  for (const s of ses) {
    assert.ok(s.paginas.length > 0, s.titulo);
    for (const p of s.paginas) assert.match(p.ruta, /^trabajo_practico\/.*\/$|^trabajo_practico\/$/);
  }
});
