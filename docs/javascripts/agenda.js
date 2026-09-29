// Agenda de la sesión (modo presentación): qué páginas y secciones del TP tocan en la clase del día,
// en verde lo que ya se recorrió y en gris lo que falta, con una barra de progreso.
// Una sección cuenta como vista cuando pasa por la pantalla en modo presentación (el repaso previo,
// fuera de ese modo, no la marca). Lo visto se guarda en este navegador, por sesión.
(function () {
  // Sesiones de la cursada actual (mismas fechas que cronograma.md y la landing).
  const TP = 'trabajo_practico/';
  const PAG = {
    ruta: { titulo: 'Ruta del TP', ruta: `${TP}ruta/` },
    marco: { titulo: 'Marco conceptual', ruta: `${TP}marco_conceptual/` },
    consigna: { titulo: 'Consigna', ruta: TP },
    m0: { titulo: 'M0 · El plano (arquitectura)', ruta: `${TP}especificacion/m0_arquitectura/` },
    m1: { titulo: 'M1 · Generación de señales', ruta: `${TP}especificacion/m1_generacion/` },
    m2: { titulo: 'M2 · Procesamiento de la RI', ruta: `${TP}especificacion/m2_procesamiento/` },
    algebra: { titulo: 'El álgebra de la deconvolución', ruta: `${TP}especificacion/m2_algebra_deconvolucion/` },
    m3: { titulo: 'M3 · Producto final', ruta: `${TP}especificacion/m3_producto_final/` },
    rubrica: { titulo: 'Rúbrica', ruta: `${TP}rubrica/` },
  };
  const SESIONES = [
    { fecha: '2026-09-30', numero: '1', dia: 'Mié 30/9', titulo: 'Introducción al TP + presentación M0', paginas: [PAG.marco, PAG.consigna, PAG.m0] },
    { fecha: '2026-10-07', numero: '·', dia: 'Mié 7/10', titulo: 'Entrega M0 (asincrónica, sin clase)', paginas: [PAG.m0] },
    { fecha: '2026-10-14', numero: '2', dia: 'Mié 14/10', titulo: 'Presentación M1', paginas: [PAG.m1] },
    { fecha: '2026-10-21', numero: '3', dia: 'Mié 21/10', titulo: 'Presentación M2 + taller M1', paginas: [PAG.m2, PAG.algebra] },
    { fecha: '2026-10-28', numero: '4', dia: 'Mié 28/10', titulo: 'Entrega M1 + presentación M3', paginas: [PAG.m3] },
    { fecha: '2026-11-04', numero: '5', dia: 'Mié 4/11', titulo: 'Entrega M2 + taller del producto', paginas: [PAG.m3, PAG.rubrica] },
    { fecha: '2026-11-11', numero: '6', dia: 'Mié 11/11', titulo: 'Taller de cierre + consultas', paginas: [PAG.rubrica, PAG.ruta] },
    { fecha: '2026-11-18', numero: '7', dia: 'Mié 18/11', titulo: 'Entrega final M3 + presentación oral', paginas: [PAG.rubrica] },
  ];

  // ── Lógica pura (testeada en docs/javascripts/tests/agenda.test.mjs) ───────────────────────
  const aFecha = (iso) => new Date(`${iso}T00:00:00`);

  function sesionActual(sesiones, hoy) {
    let actual = 0;
    sesiones.forEach((s, i) => { if (aFecha(s.fecha) <= hoy) actual = i; });
    return actual;
  }

  const clave = (ruta, id) => (id ? `${ruta}#${id}` : ruta);

  function rutaRelativa(pathname, raiz) {
    const r = pathname.startsWith(raiz) ? pathname.slice(raiz.length) : pathname.replace(/^\//, '');
    return r.replace(/index\.html$/, '');
  }

  function progreso(paginas, vistos) {
    let hechos = 0, total = 0;
    for (const p of paginas) {
      const claves = p.secciones.length ? p.secciones.map((s) => clave(p.ruta, s.id)) : [clave(p.ruta, '')];
      total += claves.length;
      hechos += claves.filter((k) => vistos.has(k)).length;
    }
    return { hechos, total, porcentaje: total ? Math.round((100 * hechos) / total) : 0 };
  }

  window.AgendaLogica = { SESIONES, sesionActual, clave, rutaRelativa, progreso };
  if (typeof document === 'undefined') return;           // en los tests no hay DOM

  // La raíz del sitio sale de la URL de este script (…/javascripts/agenda.js).
  const RAIZ = new URL('..', document.currentScript.src).pathname;
  const AQUI = rutaRelativa(location.pathname, RAIZ);
  if (!AQUI.startsWith(TP)) return;

  // ── Estado guardado ───────────────────────────────────────────────────────────────────────
  const hoy = sesionActual(SESIONES, new Date());
  const claveVistos = (i) => `agenda-vistos:${SESIONES[i].fecha}`;
  function leerVistos(i) {
    try { return new Set(JSON.parse(localStorage.getItem(claveVistos(i)) || '[]')); } catch { return new Set(); }
  }
  function guardarVistos(i, vistos) {
    try { localStorage.setItem(claveVistos(i), JSON.stringify([...vistos])); } catch { /* sin almacenamiento */ }
  }
  const panelAbierto = {
    leer: () => { try { return sessionStorage.getItem('agenda-abierta') === '1'; } catch { return false; } },
    guardar: (v) => { try { sessionStorage.setItem('agenda-abierta', v ? '1' : '0'); } catch { /* nada */ } },
  };

  // ── Secciones de cada página (h2 con ancla) ───────────────────────────────────────────────
  const secciones = new Map();
  const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const leerSecciones = (doc) => [...doc.querySelectorAll('.md-content h2[id]')]
    .map((h) => ({ id: h.id, texto: h.textContent.replace('¶', '').trim() }));
  secciones.set(AQUI, leerSecciones(document));
  async function cargarSecciones(ruta) {
    if (secciones.has(ruta)) return secciones.get(ruta);
    try {
      const html = await (await fetch(RAIZ + ruta)).text();
      secciones.set(ruta, leerSecciones(new DOMParser().parseFromString(html, 'text/html')));
    } catch { secciones.set(ruta, []); }
    return secciones.get(ruta);
  }

  function iniciar() {
    const barra = document.createElement('div');
    barra.className = 'agenda-barra';
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'agenda-boton';
    boton.title = 'Contenido de la sesión';
    boton.setAttribute('aria-label', 'Contenido de la sesión');
    boton.setAttribute('aria-expanded', 'false');
    boton.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>';
    barra.appendChild(boton);

    const panel = document.createElement('section');
    panel.className = 'agenda-panel';
    panel.setAttribute('aria-label', 'Contenido de la sesión');
    panel.hidden = true;
    // Botonera común del modo presentación (la comparten presentacion.js, agenda.js y pizarra.js).
    const columna = document.querySelector('.botonera-presentacion') || document.body.appendChild(Object.assign(document.createElement('div'), { className: 'botonera-presentacion' }));
    columna.append(barra);
    document.body.append(panel);

    let indice = hoy;

    async function render() {
      const s = SESIONES[indice];
      const paginas = await Promise.all(s.paginas.map(async (p) => ({ ...p, secciones: await cargarSecciones(p.ruta) })));
      const vistos = leerVistos(indice);
      const { hechos, total, porcentaje } = progreso(paginas, vistos);
      const item = (k, href, texto, clase = '') =>
        `<li class="${clase}${vistos.has(k) ? ' vista' : ''}"><a href="${href}">${texto}</a></li>`;
      panel.innerHTML = `
        <header class="agenda-panel__cabecera">
          <button type="button" class="agenda-flecha" data-mover="-1" aria-label="Sesión anterior" ${indice === 0 ? 'disabled' : ''}>‹</button>
          <div><strong>Sesión ${s.numero} · ${s.dia}${indice === hoy ? ' · hoy' : ''}</strong><span>${s.titulo}</span></div>
          <button type="button" class="agenda-flecha" data-mover="1" aria-label="Sesión siguiente" ${indice === SESIONES.length - 1 ? 'disabled' : ''}>›</button>
        </header>
        <div class="agenda-progreso" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${hechos}"
             aria-label="Secciones vistas"><div style="width:${porcentaje}%"></div></div>
        <p class="agenda-progreso__texto">${hechos} de ${total} secciones vistas (${porcentaje} %)</p>
        <ol class="agenda-lista">
          ${paginas.map((p) => `
            <li class="agenda-pagina${p.ruta === AQUI ? ' actual' : ''}">
              <a href="${RAIZ}${p.ruta}">${p.titulo}</a>
              <ol>${p.secciones.length
                ? p.secciones.map((x) => item(clave(p.ruta, x.id), `${RAIZ}${p.ruta}#${x.id}`, esc(x.texto))).join('')
                : item(clave(p.ruta, ''), `${RAIZ}${p.ruta}`, 'Página completa')}</ol>
            </li>`).join('')}
        </ol>
        <button type="button" class="agenda-reiniciar">Reiniciar esta sesión</button>`;
    }

    panel.addEventListener('click', (e) => {
      const mover = e.target.closest('[data-mover]');
      if (mover) { indice = Math.max(0, Math.min(SESIONES.length - 1, indice + Number(mover.dataset.mover))); render(); }
      if (e.target.closest('.agenda-reiniciar')) { guardarVistos(indice, new Set()); render(); }
    });

    function abrir(v) {
      panel.hidden = !v;
      document.body.classList.toggle('agenda-abierta', v);          // el texto se corre para dejarle lugar
      boton.setAttribute('aria-expanded', String(v));
      panelAbierto.guardar(v);
      if (v) render();
    }
    boton.addEventListener('click', () => abrir(panel.hidden));

    // ── Registro de lo visto (solo en modo presentación) ─────────────────────────────────────
    const enPresentacion = () => document.body.classList.contains('modo-presentacion');
    function marcar(k) {
      if (!enPresentacion()) return;
      const vistos = leerVistos(hoy);
      if (vistos.has(k)) return;
      vistos.add(k);
      guardarVistos(hoy, vistos);
      if (!panel.hidden && indice === hoy) render();
    }
    // Una sección está vista cuando su título entra en los dos tercios superiores de la pantalla.
    const io = new IntersectionObserver((entradas) => {
      for (const e of entradas) if (e.isIntersecting) marcar(clave(AQUI, e.target.id));
    }, { rootMargin: '0px 0px -33% 0px' });
    document.querySelectorAll('.md-content h2[id]').forEach((h) => io.observe(h));

    function actualizar() {
      const activo = enPresentacion();
      barra.hidden = !activo;
      if (!activo) {
        panel.hidden = true; boton.setAttribute('aria-expanded', 'false');
        // toggle(…, false) no toca el atributo si la clase no está; remove() sí, y como este código corre
        // cuando cambia la clase del body, eso generaba un bucle infinito que colgaba la página.
        document.body.classList.toggle('agenda-abierta', false);
        return;
      }
      marcar(clave(AQUI, ''));
      // Lo que ya está en pantalla al entrar al modo presentación también cuenta.
      document.querySelectorAll('.md-content h2[id]').forEach((h) => {
        const r = h.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight * 0.67) marcar(clave(AQUI, h.id));
      });
      if (panelAbierto.leer() && panel.hidden) abrir(true);
    }
    new MutationObserver(actualizar).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    actualizar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
