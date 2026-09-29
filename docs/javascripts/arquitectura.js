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
  window.ArquitecturaLogica = { estado, estadoArchivo, ordenRecorrido, caminoOrtogonal, tiemposDeLlegada };
  if (typeof document === 'undefined') return;           // en los tests no hay DOM

  function montar(arq) {
    arq.classList.add('arq--js');
    const items = [...arq.querySelectorAll('.arq-chip[data-m]')];   // solo los recuadros (no la leyenda de colores)
    const archivos = [...arq.querySelectorAll('.arq-archivo')];
    const leyenda = arq.querySelector('.arq-leyenda');
    const pasos = arq.querySelector('.arq-pasos');
    const botones = [...arq.querySelectorAll('.arq-controles button')];
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let actual = 3, animacion = null, relojes = [];

    // Capa SVG sobre el diagrama para la línea que va encendiendo los recuadros.
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'arq-linea');
    svg.setAttribute('aria-hidden', 'true');
    arq.appendChild(svg);

    function limpiarLinea() {
      animacion?.cancel(); animacion = null;
      relojes.forEach(clearTimeout); relojes = [];
      svg.replaceChildren();
      items.forEach((el) => el.classList.remove('encendido'));
    }

    // Dibuja la línea que recorre los elementos en orden y enciende cada uno cuando llega.
    function encender(elementos) {
      limpiarLinea();
      if (!elementos.length) return;
      const base = arq.getBoundingClientRect();
      svg.setAttribute('width', base.width); svg.setAttribute('height', base.height);
      svg.setAttribute('viewBox', `0 0 ${base.width} ${base.height}`);
      const centros = elementos.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.left - base.left + r.width / 2), y: Math.round(r.top - base.top + r.height / 2) };
      });
      const puntos = caminoOrtogonal(centros);
      const camino = document.createElementNS(NS, 'path');
      camino.setAttribute('d', puntos.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' '));
      svg.appendChild(camino);
      if (quieto) { elementos.forEach((el) => el.classList.add('encendido')); return; }
      const duracion = Math.min(3500, 450 * elementos.length);
      const largo = camino.getTotalLength();
      camino.style.strokeDasharray = `${largo}`;
      animacion = camino.animate([{ strokeDashoffset: largo }, { strokeDashoffset: 0 }], { duration: duracion, easing: 'linear', fill: 'forwards' });
      tiemposDeLlegada(centros, duracion).forEach((t, i) => {
        relojes.push(setTimeout(() => elementos[i].classList.add('encendido'), t));
      });
    }

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
      leyenda.textContent = 'El recorrido de un análisis: los números marcan por dónde pasa el pedido, de arriba hacia abajo y de vuelta.';
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
