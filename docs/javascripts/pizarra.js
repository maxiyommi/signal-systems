// Pizarra del modo presentación: dibujar con el Apple Pencil (o el mouse) sobre las páginas del TP
// y sobre los interactivos (que también tienen modo presentación).
// Los trazos se guardan relativos al contenido, así lo acompañan al desplazar.
// Con el dedo se desplaza la página; con el lápiz se dibuja. Al cambiar de página se borra todo.
(function () {
  // ── Lógica pura (testeada en docs/javascripts/tests/pizarra.test.mjs) ──────────────────────
  function distanciaASegmento(px, py, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const largo2 = dx * dx + dy * dy;
    const t = largo2 ? Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / largo2)) : 0;
    return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
  }

  // La goma borra solo lo que toca: saca los puntos debajo de ella y parte el trazo ahí. Tampoco une
  // dos puntos que quedaron a ambos lados de la goma. Los trazos que no toca se devuelven tal cual.
  // Recuadro del trazo (con margen por su grosor), guardado en el propio trazo mientras no cambie.
  function caja(t) {
    if (t._caja && t._n === t.puntos.length) return t._caja;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, a = 0;
    for (const q of t.puntos) {
      if (q.x < x0) x0 = q.x; if (q.x > x1) x1 = q.x; if (q.y < y0) y0 = q.y; if (q.y > y1) y1 = q.y; if (q.ancho > a) a = q.ancho;
    }
    Object.defineProperty(t, '_caja', { value: { x0: x0 - a, y0: y0 - a, x1: x1 + a, y1: y1 + a }, writable: true, configurable: true });
    Object.defineProperty(t, '_n', { value: t.puntos.length, writable: true, configurable: true });
    return t._caja;
  }

  function borrarParcial(trazos, x, y, radio) {
    const out = [];
    for (const t of trazos) {
      const c = caja(t);
      if (x < c.x0 - radio || x > c.x1 + radio || y < c.y0 - radio || y > c.y1 + radio) { out.push(t); continue; }   // lejos: ni se mira
      const p = t.puntos;
      const alcance = (q) => radio + q.ancho / 2;
      const toca = (q) => Math.hypot(q.x - x, q.y - y) <= alcance(q);
      if (p.length === 1) { if (!toca(p[0])) out.push(t); continue; }
      let tocado = false;
      for (let i = 1; i < p.length && !tocado; i++) tocado = distanciaASegmento(x, y, p[i - 1], p[i]) <= alcance(p[i]);
      if (!tocado) { out.push(t); continue; }
      let tramo = [];
      for (const q of p) {
        if (toca(q)) { if (tramo.length) out.push({ ...t, puntos: tramo }); tramo = []; continue; }
        if (tramo.length && distanciaASegmento(x, y, tramo[tramo.length - 1], q) <= alcance(q)) { out.push({ ...t, puntos: tramo }); tramo = []; }
        tramo.push(q);
      }
      if (tramo.length) out.push({ ...t, puntos: tramo });
    }
    return out;
  }

  // Colores según el tema: en oscuro, fluorescentes (con brillo al dibujar); en claro, más profundos.
  // Los trazos guardan la clave, así al cambiar de tema se redibujan con la paleta que corresponde.
  const PALETA = {
    oscuro: { violeta: '#d17bff', rojo: '#ff4f7b', tinta: '#f5f7fa', resaltador: 'rgba(234, 255, 0, 0.22)' },
    claro: { violeta: '#6d28d9', rojo: '#dc2626', tinta: '#111827', resaltador: 'rgba(255, 200, 0, 0.30)' },
  };
  const colorDe = (clave, oscuro) => PALETA[oscuro ? 'oscuro' : 'claro'][clave];

  // Coordenadas relativas a la esquina del contenido: siguen al texto se desplace la ventana o un
  // contenedor (en modo presentación se desplaza el body, no la ventana).
  const aPantalla = (p, { origenX, origenY }) => ({ x: p.x + origenX, y: p.y + origenY });
  const aDocumento = (x, y, { origenX, origenY }) => ({ x: x - origenX, y: y - origenY });

  function anchoTrazo(herramienta, presion) {
    const p = presion > 0 ? presion : 0.5;              // el mouse informa 0 o 0.5
    return herramienta === 'resaltador' ? 18 : 1.5 + 3.5 * p;
  }

  // Solo en modo presentación, y nunca embebida en un iframe: ahí se dibuja con la pizarra de la página.
  const debeMostrar = ({ enIframe, enPresentacion }) => !enIframe && enPresentacion;

  // Se dibuja en coordenadas de pantalla (las mismas del lápiz) y la transformación las lleva al lienzo
  // según dónde está realmente en pantalla. Así no dependemos de innerWidth/innerHeight, que en Safari
  // de iPad pueden no coincidir con el lienzo (barra del navegador, zoom).
  const transformacion = (rect, dpr) => [dpr, 0, 0, dpr, -rect.left * dpr, -rect.top * dpr];

  window.PizarraLogica = { borrarParcial, colorDe, aPantalla, aDocumento, anchoTrazo, debeMostrar, transformacion };
  if (typeof document === 'undefined') return;           // en los tests no hay DOM
  if (!location.pathname.includes('/trabajo_practico/')) return;

  // ── Interfaz ───────────────────────────────────────────────────────────────────────────────
  const COLORES = [
    { nombre: 'Violeta', clave: 'violeta' },
    { nombre: 'Rojo', clave: 'rojo' },
    { nombre: 'Tinta', clave: 'tinta' },
  ];
  const RADIO_GOMA = 14;
  const ICONO_GOMA = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.4l10-10a1 1 0 0 1 1.4 0l5.6 5.6a1 1 0 0 1 0 1.4L13 19"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>';
  // Tema actual: el sitio lo marca en el body (Material) y los interactivos en <html data-tema>.
  const esOscuro = () => document.body.getAttribute('data-md-color-scheme') === 'slate'
    || document.documentElement.dataset.tema === 'oscuro';

  function iniciar() {
    let enIframe = true;
    try { enIframe = window.self !== window.top; } catch { /* iframe de otro origen */ }
    if (enIframe) return;
    const lienzo = document.createElement('canvas');
    lienzo.className = 'pizarra-lienzo';
    lienzo.setAttribute('aria-hidden', 'true');
    const g = lienzo.getContext('2d');

    const barra = document.createElement('div');
    barra.className = 'pizarra-barra';
    barra.setAttribute('role', 'toolbar');
    barra.setAttribute('aria-label', 'Pizarra');
    document.body.append(lienzo, barra);

    let trazos = [], actual = null, activo = false;
    let herramienta = 'lapiz', color = COLORES[0].clave;
    let dedoY = null, gomaEn = null;

    // Lo que se desplaza: el body en modo presentación (ver presentacion.css), si no la página.
    const desplazable = () => {
      const b = document.body;
      return /(auto|scroll)/.test(getComputedStyle(b).overflowY) && b.scrollHeight > b.clientHeight ? b : (document.scrollingElement || document.documentElement);
    };
    const vista = () => {
      const cont = document.querySelector('.md-content__inner') || document.querySelector('main') || document.body;
      const r = cont.getBoundingClientRect();
      return { origenX: r.left, origenY: r.top };
    };

    function boton(html, titulo, accion, clase = '') {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `pizarra-boton ${clase}`.trim();
      b.innerHTML = html;
      b.title = titulo;
      b.setAttribute('aria-label', titulo);
      b.addEventListener('click', accion);
      barra.appendChild(b);
      return b;
    }

    const bLapiz = boton('✎', 'Lápiz: dibujar sobre la página', () => activar(!activo), 'pizarra-boton--principal');
    const herramientas = [], muestras = [];
    for (const c of COLORES) {
      const b = boton('<i></i>', `Lápiz ${c.nombre.toLowerCase()}`, () => elegir('lapiz', c.clave, b));
      muestras.push([b.querySelector('i'), c.clave]);
      herramientas.push(b);
    }
    const bResaltador = boton('<i class="pizarra-resaltador"></i>', 'Resaltador', () => elegir('resaltador', 'resaltador', bResaltador));
    muestras.push([bResaltador.querySelector('i'), 'resaltador']);
    const bGoma = boton(ICONO_GOMA, 'Goma: frotá sobre lo que quieras borrar', () => elegir('goma', null, bGoma));
    herramientas.push(bResaltador, bGoma);
    // Las muestras de color siguen al tema (claro u oscuro).
    // (el resaltador se muestra casi opaco en el botón para que se distinga; al dibujar es translúcido)
    const pintarMuestras = () => muestras.forEach(([i, clave]) => {
      const c = colorDe(clave, esOscuro());
      i.style.background = clave === 'resaltador' ? c.replace(/[\d.]+\)$/, '0.85)') : c;
    });
    pintarMuestras();
    boton('<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>', 'Borrar todo', () => { trazos = []; dibujarTodo(); }, 'pizarra-boton--borrar');

    function elegir(h, c, b) {
      herramienta = h; color = c;
      herramientas.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    }
    elegir('lapiz', COLORES[0].clave, herramientas[0]);

    function activar(v) {
      activo = v;
      document.body.classList.toggle('pizarra-activa', v);
      bLapiz.setAttribute('aria-pressed', String(v));
    }

    function mostrar(visible) {
      barra.hidden = !visible;
      lienzo.hidden = !visible;
      if (!visible) activar(false);
      else ajustar();
    }

    // ── Dibujo ───────────────────────────────────────────────────────────────────────────────
    // El lienzo ocupa la zona visible por CSS; acá se mide cuánto ocupa de verdad y se ajusta la
    // resolución a eso, con la transformación que lleva coordenadas de pantalla al lienzo.
    let rect = { left: 0, top: 0, width: 0, height: 0 };
    function ajustar() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      rect = lienzo.getBoundingClientRect();
      lienzo.width = Math.round(rect.width * dpr);
      lienzo.height = Math.round(rect.height * dpr);
      g.setTransform(...transformacion(rect, dpr));
      dibujarTodo();
    }
    // Si el lienzo cambió de lugar o de tamaño (zoom, barra de Safari, rotación), se vuelve a medir.
    function verificarMedida() {
      const r = lienzo.getBoundingClientRect();
      if (r.left !== rect.left || r.top !== rect.top || r.width !== rect.width || r.height !== rect.height) ajustar();
    }

    function trazar(t, v, desde = 1) {
      const oscuro = esOscuro();
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = colorDe(t.color, oscuro) || colorDe('tinta', oscuro);
      const p = t.puntos;
      // En oscuro, el lápiz brilla como un marcador fluorescente: un halo ancho y translúcido, dibujado
      // una sola vez por trazo (una sombra difuminada por tramo era demasiado lenta en el iPad).
      if (oscuro && t.herramienta === 'lapiz' && desde <= 1 && p.length > 1) {
        g.globalAlpha = 0.22; g.lineWidth = p[p.length >> 1].ancho * 3.2; g.beginPath();
        p.forEach((q, i) => { const r = aPantalla(q, v); if (i) g.lineTo(r.x, r.y); else g.moveTo(r.x, r.y); });
        g.stroke(); g.globalAlpha = 1;
      }
      if (p.length === 1) {
        const q = aPantalla(p[0], v);
        g.fillStyle = g.strokeStyle;
        g.beginPath(); g.arc(q.x, q.y, p[0].ancho / 2, 0, 2 * Math.PI); g.fill();
        return;
      }
      if (t.herramienta === 'resaltador') {                  // un solo trazo: la transparencia no se acumula
        g.lineWidth = p[0].ancho; g.beginPath();
        p.forEach((q, i) => { const r = aPantalla(q, v); if (i) g.lineTo(r.x, r.y); else g.moveTo(r.x, r.y); });
        g.stroke();
        return;
      }
      for (let i = Math.max(1, desde); i < p.length; i++) {
        const a = aPantalla(p[i - 1], v), b = aPantalla(p[i], v);
        g.lineWidth = p[i].ancho;
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      }
    }

    function dibujarTodo() {
      g.clearRect(rect.left, rect.top, rect.width, rect.height);
      const v = vista();
      // El resaltador va debajo de los trazos de lápiz para no taparlos.
      for (const t of trazos) if (t.herramienta === 'resaltador') trazar(t, v);
      for (const t of trazos) if (t.herramienta !== 'resaltador') trazar(t, v);
      if (gomaEn) {                                            // dónde está borrando la goma
        g.strokeStyle = colorDe('tinta', esOscuro()); g.globalAlpha = 0.6; g.lineWidth = 1.5;
        g.beginPath(); g.arc(gomaEn.x, gomaEn.y, RADIO_GOMA, 0, 2 * Math.PI); g.stroke();
        g.globalAlpha = 1;
      }
    }

    let pendiente = false;
    const redibujar = () => {
      if (pendiente || lienzo.hidden) return;
      pendiente = true;
      requestAnimationFrame(() => { pendiente = false; verificarMedida(); dibujarTodo(); });
    };

    // ── Entrada: el lápiz y el mouse dibujan; el dedo desplaza la página ─────────────────────
    lienzo.addEventListener('pointerdown', (e) => {
      if (!activo) return;
      e.preventDefault();
      verificarMedida();
      try { lienzo.setPointerCapture(e.pointerId); } catch { /* puntero ya liberado */ }
      if (e.pointerType === 'touch') { dedoY = e.clientY; return; }
      const v = vista();
      const p = aDocumento(e.clientX, e.clientY, v);
      if (herramienta === 'goma') {
        trazos = borrarParcial(trazos, p.x, p.y, RADIO_GOMA); gomaEn = { x: e.clientX, y: e.clientY };
        actual = { goma: true, ultimo: p }; redibujar(); return;
      }
      actual = { herramienta, color, puntos: [{ ...p, ancho: anchoTrazo(herramienta, e.pressure) }] };
      trazos.push(actual);
      trazar(actual, v);
    });

    lienzo.addEventListener('pointermove', (e) => {
      if (!activo) return;
      if (e.pointerType === 'touch') {
        if (dedoY !== null) { desplazable().scrollBy({ top: dedoY - e.clientY, behavior: 'instant' }); dedoY = e.clientY; }
        return;
      }
      if (!actual) return;
      const v = vista();
      if (actual.goma) {
        // La goma recorre el camino desde su última posición en pasos de medio radio (sin mirar cada
        // evento del Pencil) y se redibuja como mucho una vez por cuadro.
        const p = aDocumento(e.clientX, e.clientY, v), a = actual.ultimo;
        const pasos = Math.max(1, Math.ceil(Math.hypot(p.x - a.x, p.y - a.y) / (RADIO_GOMA / 2)));
        for (let k = 1; k <= pasos; k++) {
          trazos = borrarParcial(trazos, a.x + ((p.x - a.x) * k) / pasos, a.y + ((p.y - a.y) * k) / pasos, RADIO_GOMA);
        }
        actual.ultimo = p; gomaEn = { x: e.clientX, y: e.clientY };
        redibujar();
        return;
      }
      const juntos = e.getCoalescedEvents ? e.getCoalescedEvents() : [];   // trazo suave con el Pencil
      const eventos = juntos.length ? juntos : [e];
      for (const ev of eventos) {
        const p = aDocumento(ev.clientX, ev.clientY, v);
        actual.puntos.push({ ...p, ancho: anchoTrazo(actual.herramienta, ev.pressure) });
      }
      if (actual.herramienta === 'resaltador') redibujar();   // translúcido: se redibuja entero, una vez por cuadro
      else trazar(actual, v, actual.puntos.length - eventos.length);   // de a tramos; el halo se agrega al soltar
    });

    const soltar = () => {
      const habia = actual !== null;
      actual = null; dedoY = null; gomaEn = null;
      if (habia) redibujar();                                   // saca el círculo de la goma y agrega el halo del trazo nuevo
    };
    for (const tipo of ['pointerup', 'pointercancel', 'lostpointercapture']) lienzo.addEventListener(tipo, soltar);

    // En captura: el evento scroll no burbujea, así se oye el de la ventana y el de cualquier contenedor.
    document.addEventListener('scroll', redibujar, { passive: true, capture: true });
    const reajustar = () => { if (!lienzo.hidden) ajustar(); };
    window.addEventListener('resize', reajustar);
    window.visualViewport?.addEventListener('resize', reajustar);   // aparece o se oculta la barra de Safari

    // Se muestra solo en modo presentación (lo maneja presentacion.js con una clase en el body).
    const actualizar = () => mostrar(debeMostrar({ enIframe, enPresentacion: document.body.classList.contains('modo-presentacion') }));
    new MutationObserver(actualizar).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    // Cambio de tema en el sitio: se repintan las muestras y los trazos con la otra paleta.
    new MutationObserver(() => { pintarMuestras(); if (!lienzo.hidden) dibujarTodo(); })
      .observe(document.body, { attributes: true, attributeFilter: ['data-md-color-scheme'] });
    actualizar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
