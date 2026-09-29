// Diagrama de arquitectura de M0: botones para ver cómo crece la API milestone a milestone
// (lo que viene después queda punteado) y para seguir el recorrido numerado de un análisis.
// El contenido está escrito en la página (.arq); sin JavaScript se ve el diagrama completo.
(function () {
  const estado = (mItem, mElegido) => (mItem <= mElegido ? 'hecho' : 'pendiente');
  const estadoArchivo = (ms, mElegido) => (ms.some((m) => m <= mElegido) ? 'hecho' : 'pendiente');
  const ordenRecorrido = (items) => [...items].sort((a, b) => a.paso - b.paso);

  // Camino de la línea "de circuito": entre dos recuadros baja hasta la mitad, cruza y vuelve a bajar;
  // si están en la misma fila, va derecho.
  function caminoOrtogonal(centros) {
    const out = centros.length ? [{ ...centros[0] }] : [];
    for (let i = 1; i < centros.length; i++) {
      const a = centros[i - 1], b = centros[i];
      if (a.y !== b.y) { const ym = (a.y + b.y) / 2; out.push({ x: a.x, y: ym }, { x: b.x, y: ym }); }
      out.push({ ...b });
    }
    return out;
  }
  // Cuándo llega la línea a cada recuadro (ms), proporcional al largo del camino en ángulo recto.
  function tiemposDeLlegada(centros, duracion) {
    const acum = [0];
    for (let i = 1; i < centros.length; i++) acum.push(acum[i - 1] + Math.abs(centros[i].x - centros[i - 1].x) + Math.abs(centros[i].y - centros[i - 1].y));
    const total = acum[acum.length - 1] || 1;
    return acum.map((d) => (d / total) * duracion);
  }
  // El recorrido se parte en ida (hasta el último paso antes de la vuelta) y vuelta, que arranca en ese
  // mismo punto para que la línea quede continua.
  function tramosIdaVuelta(elementos, sentidos) {
    const k = sentidos.findIndex((s) => s === 'vuelta');
    if (k <= 0) return [{ sentido: 'ida', elementos: [...elementos] }];
    return [{ sentido: 'ida', elementos: elementos.slice(0, k) }, { sentido: 'vuelta', elementos: elementos.slice(k - 1) }];
  }
  window.ArquitecturaLogica = { estado, estadoArchivo, ordenRecorrido, caminoOrtogonal, tiemposDeLlegada, tramosIdaVuelta };
  if (typeof document === 'undefined') return;           // en los tests no hay DOM

  function montar(arq) {
    arq.classList.add('arq--js');
    const items = [...arq.querySelectorAll('.arq-chip[data-m]')];   // solo los recuadros (no la leyenda de colores)
    const archivos = [...arq.querySelectorAll('.arq-archivo')];
    const leyenda = arq.querySelector('.arq-leyenda');
    const pasos = arq.querySelector('.arq-pasos');
    const botones = [...arq.querySelectorAll('.arq-controles button')];
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let actual = 3, animaciones = [], relojes = [];

    // Capa SVG sobre el diagrama para la línea que va encendiendo los recuadros.
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'arq-linea');
    svg.setAttribute('aria-hidden', 'true');
    arq.appendChild(svg);

    function limpiarLinea() {
      animaciones.forEach((a) => a.cancel()); animaciones = [];
      relojes.forEach(clearTimeout); relojes = [];
      svg.replaceChildren();
      items.forEach((el) => el.classList.remove('encendido'));
    }

    // Dibuja la línea que recorre los elementos en orden y enciende cada uno cuando llega. Si hay
    // pasos de vuelta (data-sentido="vuelta"), la vuelta se dibuja después y de otro color.
    function encender(elementos) {
      limpiarLinea();
      if (!elementos.length) return;
      const base = arq.getBoundingClientRect();
      svg.setAttribute('width', base.width); svg.setAttribute('height', base.height);
      svg.setAttribute('viewBox', `0 0 ${base.width} ${base.height}`);
      const centro = (el) => {
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.left - base.left + r.width / 2), y: Math.round(r.top - base.top + r.height / 2) };
      };
      let inicio = 0;
      for (const [n, tramo] of tramosIdaVuelta(elementos, elementos.map((el) => el.dataset.sentido)).entries()) {
        const centros = tramo.elementos.map(centro);
        const camino = document.createElementNS(NS, 'path');
        camino.setAttribute('class', tramo.sentido);
        camino.setAttribute('d', caminoOrtogonal(centros).map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' '));
        svg.appendChild(camino);
        if (quieto) { tramo.elementos.forEach((el) => el.classList.add('encendido')); continue; }
        const duracion = Math.min(3500, 450 * tramo.elementos.length);
        const largo = camino.getTotalLength();
        camino.style.strokeDasharray = `${largo}`;
        animaciones.push(camino.animate([{ strokeDashoffset: largo }, { strokeDashoffset: 0 }],
          { duration: duracion, delay: inicio, easing: 'linear', fill: 'both' }));
        tiemposDeLlegada(centros, duracion).forEach((t, i) => {
          if (n > 0 && i === 0) return;                      // el primero de la vuelta ya se encendió en la ida
          relojes.push(setTimeout(() => tramo.elementos[i].classList.add('encendido'), inicio + t));
        });
        inicio += duracion;
      }
    }

    // ── Estructura básica de cada recuadro (sin la implementación) ───────────────────────────
    const detalle = document.createElement('div');
    detalle.className = 'definicion arq-detalle';
    detalle.setAttribute('popover', 'auto');
    arq.appendChild(detalle);
    const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const NOMBRE_M = ['M0 · El plano', 'M1 · Generación', 'M2 · Procesamiento', 'M3 · Producto final'];
    function abrirDetalle(chip) {
      const clave = chip.textContent.trim();
      const d = (window.ARQ_ESQUELETOS || {})[clave];
      if (!d || !detalle.showPopover) return;
      const m = Number(chip.dataset.m);
      detalle.innerHTML = `
        <p class="definicion__titulo">${esc(clave)}</p>
        <p class="arq-detalle__meta"><span class="arq-detalle__m" data-m="${m}">${NOMBRE_M[m]}</span><code>${esc(d.archivo)}</code></p>
        <p>${esc(d.que)}</p>
        <pre><code>${esc(d.codigo)}</code></pre>
        <p class="arq-detalle__nota">Es la estructura, no la solución: lo que va adentro lo escriben ustedes.${d.spec ? ` <a href="${d.spec}">Ver la especificación de M${m}</a>.` : ''}</p>
        <button type="button" class="definicion__cerrar">Cerrar</button>`;
      detalle.querySelector('.definicion__cerrar').addEventListener('click', () => detalle.hidePopover());
      detalle.showPopover();
    }
    items.forEach((chip) => {
      if (!(window.ARQ_ESQUELETOS || {})[chip.textContent.trim()]) return;
      chip.setAttribute('role', 'button'); chip.tabIndex = 0;
      chip.setAttribute('aria-haspopup', 'dialog');
      chip.title = 'Ver la estructura';
      chip.addEventListener('click', () => abrirDetalle(chip));
      chip.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirDetalle(chip); } });
    });

    // Elementos en orden de lectura: capa por capa (de arriba abajo) y de izquierda a derecha.
    const enOrden = (lista) => lista
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .sort((a, b) => (Math.abs(a.r.top - b.r.top) > 8 ? a.r.top - b.r.top : a.r.left - b.r.left))
      .map((x) => x.el);

    function mostrarMilestone(m, animar = true) {
      const anterior = actual; actual = m;
      arq.classList.remove('arq--recorrido');
      items.forEach((el) => el.classList.toggle('pendiente', estado(Number(el.dataset.m), m) === 'pendiente'));
      archivos.forEach((a) => {
        const ms = [...a.querySelectorAll('[data-m]')].map((el) => Number(el.dataset.m));
        a.classList.toggle('pendiente', estadoArchivo(ms, m) === 'pendiente');
      });
      leyenda.textContent = m === 3
        ? 'La API completa al final de M3. Tocá M0, M1 o M2 para ver cómo se va armando: lo punteado es lo que viene después.'
        : `Así queda la API al terminar M${m}. Lo punteado todavía no existe: se agrega en los milestones siguientes, en las mismas carpetas.`;
      pasos.hidden = true;
      // La línea recorre lo que se suma en ese milestone (al volver atrás, solo se apaga).
      if (animar && m >= anterior) encender(enOrden(items.filter((el) => Number(el.dataset.m) === m)));
      else limpiarLinea();
    }

    function mostrarRecorrido() {
      items.forEach((el) => el.classList.remove('pendiente'));
      archivos.forEach((a) => a.classList.remove('pendiente'));
      arq.classList.add('arq--recorrido');
      const lista = ordenRecorrido([...arq.querySelectorAll('[data-paso]')].map((el) => ({ paso: Number(el.dataset.paso), texto: el.dataset.explica })));
      pasos.innerHTML = lista.map((p) => `<li>${p.texto}</li>`).join('');
      pasos.hidden = false;
      leyenda.innerHTML = 'El recorrido de un análisis: la línea <strong class="arq-ida">violeta</strong> es la ida del pedido (pasos 1 a 8) y la <strong class="arq-vuelta">ámbar</strong>, la vuelta con la respuesta (pasos 9 y 10).';
      encender(ordenRecorrido([...arq.querySelectorAll('[data-paso]')].map((el) => ({ paso: Number(el.dataset.paso), el }))).map((x) => x.el));
      actual = 3;
    }

    botones.forEach((b) => b.addEventListener('click', () => {
      botones.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      if (b.dataset.ver === 'recorrido') mostrarRecorrido();
      else { if (b.dataset.ver === '0') actual = -1; mostrarMilestone(Number(b.dataset.ver)); }
    }));
    // Si cambia el ancho (rotar el iPad), la línea dibujada ya no coincide con los recuadros.
    let ancho = arq.clientWidth;
    window.addEventListener('resize', () => { if (arq.clientWidth !== ancho) { ancho = arq.clientWidth; limpiarLinea(); } });
    mostrarMilestone(3, false);
  }

  const iniciar = () => document.querySelectorAll('.arq').forEach(montar);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
