// Pizarra para el modo presentación: dibujar con el Apple Pencil (o el mouse) sobre la página.
// Los trazos se guardan en coordenadas del documento, así acompañan al contenido al desplazar.
// Con el dedo se desplaza la página; con el lápiz se dibuja. Al cambiar de página se borra todo.
(function () {
  // ── Lógica pura (testeada en docs/javascripts/tests/pizarra.test.mjs) ──────────────────────
  function distanciaASegmento(px, py, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const largo2 = dx * dx + dy * dy;
    const t = largo2 ? Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / largo2)) : 0;
    return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
  }

  // La goma borra trazos enteros: más rápido en clase que borrar de a pedacitos.
  function borrarCerca(trazos, x, y, radio) {
    return trazos.filter((t) => {
      const p = t.puntos;
      if (p.length === 1) return Math.hypot(p[0].x - x, p[0].y - y) > radio + p[0].ancho / 2;
      for (let i = 1; i < p.length; i++) {
        if (distanciaASegmento(x, y, p[i - 1], p[i]) <= radio + p[i].ancho / 2) return false;
      }
      return true;
    });
  }

  const aPantalla = (p, { scrollY, origenX }) => ({ x: p.x + origenX, y: p.y - scrollY });
  const aDocumento = (x, y, { scrollY, origenX }) => ({ x: x - origenX, y: y + scrollY });

  function anchoTrazo(herramienta, presion) {
    const p = presion > 0 ? presion : 0.5;              // el mouse informa 0 o 0.5
    return herramienta === 'resaltador' ? 18 : 1.5 + 3.5 * p;
  }

  // En el sitio aparece con el modo presentación; en un interactivo abierto solo (data-pizarra="siempre"),
  // siempre. Embebido en un iframe nunca: ahí se dibuja con la pizarra de la página que lo contiene.
  const debeMostrar = ({ siempre, enIframe, enPresentacion }) => !enIframe && (siempre || enPresentacion);

  window.PizarraLogica = { borrarCerca, aPantalla, aDocumento, anchoTrazo, debeMostrar };
  if (typeof document === 'undefined') return;           // en los tests no hay DOM
  if (!location.pathname.includes('/trabajo_practico/')) return;

  // ── Interfaz ───────────────────────────────────────────────────────────────────────────────
  const COLORES = [
    { nombre: 'Violeta', valor: '#9B59D0' },
    { nombre: 'Rojo', valor: '#E5484D' },
    { nombre: 'Tinta', valor: null },                    // el color del texto (sirve en modo claro y oscuro)
  ];
  const RESALTADOR = 'rgba(255, 214, 0, 0.38)';

  function iniciar() {
    const siempre = document.documentElement.dataset.pizarra === 'siempre';
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
    let herramienta = 'lapiz', color = COLORES[0].valor;
    let dedoY = null;

    const colorTinta = () => getComputedStyle(document.body).color;
    const vista = () => {
      const cont = document.querySelector('.md-content__inner') || document.querySelector('main') || document.body;
      return { scrollY: window.scrollY, origenX: cont.getBoundingClientRect().left };
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
    const herramientas = [];
    for (const c of COLORES) {
      const b = boton(`<i style="background:${c.valor || 'currentColor'}"></i>`, `Lápiz ${c.nombre.toLowerCase()}`,
        () => elegir('lapiz', c.valor, b));
      herramientas.push(b);
    }
    const bResaltador = boton('<i class="pizarra-resaltador"></i>', 'Resaltador', () => elegir('resaltador', RESALTADOR, bResaltador));
    const bGoma = boton('⌫', 'Goma: tocá un trazo para borrarlo', () => elegir('goma', null, bGoma));
    herramientas.push(bResaltador, bGoma);
    boton('<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>', 'Borrar todo', () => { trazos = []; dibujarTodo(); }, 'pizarra-boton--borrar');

    function elegir(h, c, b) {
      herramienta = h; color = c;
      herramientas.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    }
    elegir('lapiz', COLORES[0].valor, herramientas[0]);

    function activar(v) {
      activo = v;
      document.body.classList.toggle('pizarra-activa', v);
      bLapiz.setAttribute('aria-pressed', String(v));
    }

    function mostrar(enPresentacion) {
      barra.hidden = !enPresentacion;
      lienzo.hidden = !enPresentacion;
      if (!enPresentacion) activar(false);
      else ajustar();
    }

    // ── Dibujo ───────────────────────────────────────────────────────────────────────────────
    // El tamaño en pantalla se fija en px igual a la zona visible. Con 100vh, Safari de iPad
    // estira el lienzo cuando se ve la barra del navegador y la tinta queda corrida del lápiz.
    function ajustar() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      lienzo.style.width = `${window.innerWidth}px`;
      lienzo.style.height = `${window.innerHeight}px`;
      lienzo.width = Math.round(window.innerWidth * dpr);
      lienzo.height = Math.round(window.innerHeight * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      dibujarTodo();
    }

    function trazar(t, v, desde = 1) {
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = t.color || colorTinta();
      const p = t.puntos;
      if (p.length === 1) {
        const q = aPantalla(p[0], v);
        g.fillStyle = g.strokeStyle;
        g.beginPath(); g.arc(q.x, q.y, p[0].ancho / 2, 0, 2 * Math.PI); g.fill();
        return;
      }
      for (let i = Math.max(1, desde); i < p.length; i++) {
        const a = aPantalla(p[i - 1], v), b = aPantalla(p[i], v);
        g.lineWidth = p[i].ancho;
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      }
    }

    function dibujarTodo() {
      g.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const v = vista();
      // El resaltador va debajo de los trazos de lápiz para no taparlos.
      for (const t of trazos) if (t.herramienta === 'resaltador') trazar(t, v);
      for (const t of trazos) if (t.herramienta !== 'resaltador') trazar(t, v);
    }

    let pendiente = false;
    const redibujar = () => {
      if (pendiente || lienzo.hidden) return;
      pendiente = true;
      requestAnimationFrame(() => { pendiente = false; dibujarTodo(); });
    };

    // ── Entrada: el lápiz y el mouse dibujan; el dedo desplaza la página ─────────────────────
    lienzo.addEventListener('pointerdown', (e) => {
      if (!activo) return;
      e.preventDefault();
      try { lienzo.setPointerCapture(e.pointerId); } catch { /* puntero ya liberado */ }
      if (e.pointerType === 'touch') { dedoY = e.clientY; return; }
      const v = vista();
      const p = aDocumento(e.clientX, e.clientY, v);
      if (herramienta === 'goma') { trazos = borrarCerca(trazos, p.x, p.y, 10); dibujarTodo(); actual = { goma: true }; return; }
      actual = { herramienta, color, puntos: [{ ...p, ancho: anchoTrazo(herramienta, e.pressure) }] };
      trazos.push(actual);
      trazar(actual, v);
    });

    lienzo.addEventListener('pointermove', (e) => {
      if (!activo) return;
      if (e.pointerType === 'touch') {
        if (dedoY !== null) { window.scrollBy({ top: dedoY - e.clientY, behavior: 'instant' }); dedoY = e.clientY; }
        return;
      }
      if (!actual) return;
      const v = vista();
      const juntos = e.getCoalescedEvents ? e.getCoalescedEvents() : [];   // trazo suave con el Pencil
      const eventos = juntos.length ? juntos : [e];
      for (const ev of eventos) {
        const p = aDocumento(ev.clientX, ev.clientY, v);
        if (actual.goma) { trazos = borrarCerca(trazos, p.x, p.y, 10); continue; }
        actual.puntos.push({ ...p, ancho: anchoTrazo(actual.herramienta, ev.pressure) });
      }
      if (actual.goma) dibujarTodo();
      else if (actual.herramienta === 'resaltador') dibujarTodo();       // semitransparente: se redibuja entero
      else trazar(actual, v, actual.puntos.length - eventos.length);
    });

    const soltar = () => { actual = null; dedoY = null; };
    for (const tipo of ['pointerup', 'pointercancel', 'lostpointercapture']) lienzo.addEventListener(tipo, soltar);

    window.addEventListener('scroll', redibujar, { passive: true });
    const reajustar = () => { if (!lienzo.hidden) ajustar(); };
    window.addEventListener('resize', reajustar);
    window.visualViewport?.addEventListener('resize', reajustar);   // aparece o se oculta la barra de Safari

    // Se muestra solo en modo presentación (lo maneja presentacion.js con una clase en el body).
    const actualizar = () => mostrar(debeMostrar({
      siempre, enIframe, enPresentacion: document.body.classList.contains('modo-presentacion'),
    }));
    new MutationObserver(actualizar).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    actualizar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
