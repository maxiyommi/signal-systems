// Animación del método de Voss-McCartney (M1 · ruido rosa): un contador n en binario, varios
// generadores de ruido blanco que se renuevan cuando cambia "su" bit de n y la suma de todos.
// Se despliega desde un link .voss-toggle hacia el panel .voss-anim. La lógica es pura y testeable.
(function () {
  // Bits que cambian al pasar de n-1 a n: el generador i se renueva cuando cambia el bit i.
  const bitsQueCambian = (n, generadores) => {
    if (n === 0) return Array.from({ length: generadores }, (_, i) => i);   // al empezar, todos
    const x = n ^ (n - 1);
    return Array.from({ length: generadores }, (_, i) => i).filter((i) => (x >> i) & 1);
  };
  // Simula N muestras con G generadores. rng() devuelve un valor en [-1, 1].
  function simular(N, G, rng) {
    const gens = Array.from({ length: G }, () => new Array(N).fill(0));
    const suma = new Array(N).fill(0), cambios = [];
    const actual = new Array(G).fill(0);
    for (let n = 0; n < N; n++) {
      const c = bitsQueCambian(n, G);
      for (const i of c) actual[i] = rng();
      for (let i = 0; i < G; i++) gens[i][n] = actual[i];
      suma[n] = actual.reduce((a, b) => a + b, 0);
      cambios.push(c);
    }
    return { gens, suma, cambios };
  }
  const binario = (n, bits) => n.toString(2).padStart(bits, '0');
  window.VossLogica = { bitsQueCambian, simular, binario };
  if (typeof document === 'undefined') return;           // en los tests no hay DOM

  const G = 4, N = 64, VENTANA = 32, PASO_MS = 420;
  const css = (v, def) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || def;

  function montar(panel, link) {
    const vista = panel.querySelector('.voss-anim__vista') || panel;
    vista.innerHTML = `
      <div class="voss-anim__controles">
        <button type="button" data-acc="play">▶ Reproducir</button>
        <button type="button" data-acc="paso">Paso</button>
        <button type="button" data-acc="reset">Reiniciar</button>
        <span class="voss-anim__nota">Versión didáctica con ${G} generadores; la API usa 16.</span>
      </div>
      <canvas aria-label="Animación del método de Voss-McCartney"></canvas>
      <p class="voss-anim__texto" aria-live="polite"></p>`;
    const cv = vista.querySelector('canvas'), texto = vista.querySelector('.voss-anim__texto');
    const bPlay = vista.querySelector('[data-acc="play"]');
    let sim, n, timer = null;
    const rng = () => Math.random() * 2 - 1;

    function reiniciar() { sim = simular(N, G, rng); n = 0; dibujar(); }
    function parar() { clearInterval(timer); timer = null; bPlay.textContent = '▶ Reproducir'; }
    function avanzar() { if (n < N - 1) { n++; dibujar(); } else parar(); }

    function dibujar() {
      const COL = { papel: css('--g-fondo', '#161b22'), tinta: css('--g-tinta', '#c9d1d9'), eje: css('--g-eje', '#8b949e'),
        grilla: css('--g-grilla', '#30363d'), violeta: css('--g-violeta', '#818cf8'), senal: css('--g-senal', '#fbbf24'), tenue: css('--g-tenue', '#6e7681') };
      const W = Math.max(260, vista.clientWidth), compacto = W < 560;
      const filaH = compacto ? 34 : 40, cab = 46, sumaH = compacto ? 70 : 90, H = cab + G * filaH + sumaH + 34;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = '100%'; cv.style.height = H + 'px';
      const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = COL.papel; g.fillRect(0, 0, W, H);
      const fuente = 'Roboto, system-ui, sans-serif', l = compacto ? 92 : 132, r = 12;
      const ini = Math.max(0, n - VENTANA + 1), xs = (k) => l + ((k - ini) / VENTANA) * (W - l - r), dx = (W - l - r) / VENTANA;
      const cambia = sim.cambios[n];

      // Contador en binario: los bits que cambiaron se pintan.
      g.font = `600 ${compacto ? 12 : 13}px ${fuente}`; g.fillStyle = COL.tinta; g.textBaseline = 'middle';
      g.fillText(`n = ${n}`, 10, 22);
      const bits = binario(n, G), bw = 22, bx = l;
      for (let b = 0; b < G; b++) {                       // se dibuja del bit más alto al 0
        const i = G - 1 - b, x = bx + b * (bw + 4), on = cambia.includes(i);
        g.fillStyle = on ? COL.senal : COL.grilla; g.fillRect(x, 10, bw, 24);
        g.fillStyle = on ? '#111' : COL.tinta; g.textAlign = 'center'; g.fillText(bits[b], x + bw / 2, 22);
        g.font = `500 10px ${fuente}`; g.fillStyle = COL.eje; g.fillText(`bit ${i}`, x + bw / 2, 42); g.font = `600 ${compacto ? 12 : 13}px ${fuente}`;
      }
      g.textAlign = 'left';

      // Un carril por generador: escalones que se renuevan cada 2^i muestras.
      for (let i = 0; i < G; i++) {
        const y0 = cab + i * filaH, ym = y0 + filaH / 2, a = filaH / 2 - 5, on = cambia.includes(i);
        g.fillStyle = on ? COL.senal : COL.tinta; g.font = `600 ${compacto ? 11 : 12}px ${fuente}`;
        g.fillText(`generador ${i}`, 10, ym - 6);
        g.font = `400 ${compacto ? 10 : 11}px ${fuente}`; g.fillStyle = COL.eje;
        g.fillText(`cada ${2 ** i} muestra${i ? 's' : ''}`, 10, ym + 8);
        g.strokeStyle = COL.grilla; g.beginPath(); g.moveTo(l, ym); g.lineTo(W - r, ym); g.stroke();
        g.strokeStyle = COL.violeta; g.lineWidth = 2; g.beginPath();
        for (let k = ini; k <= n; k++) { const y = ym - sim.gens[i][k] * a; if (k === ini) g.moveTo(xs(k), y); else g.lineTo(xs(k), y); g.lineTo(xs(k) + dx, y); }
        g.stroke(); g.lineWidth = 1;
        if (on) { g.fillStyle = COL.senal; g.beginPath(); g.arc(xs(n) + dx / 2, ym - sim.gens[i][n] * a, 4, 0, 2 * Math.PI); g.fill(); }
      }

      // La suma: el ruido rosa.
      const ys = cab + G * filaH + 8, ysm = ys + sumaH / 2, as = sumaH / 2 - 6;
      g.fillStyle = COL.senal; g.font = `700 ${compacto ? 11 : 12}px ${fuente}`; g.fillText('suma', 10, ysm - 6);
      g.font = `400 ${compacto ? 10 : 11}px ${fuente}`; g.fillStyle = COL.eje; g.fillText('= ruido rosa', 10, ysm + 8);
      g.strokeStyle = COL.grilla; g.beginPath(); g.moveTo(l, ysm); g.lineTo(W - r, ysm); g.stroke();
      g.strokeStyle = COL.senal; g.lineWidth = 2.5; g.beginPath();
      for (let k = ini; k <= n; k++) { const y = ysm - (sim.suma[k] / G) * as; if (k === ini) g.moveTo(xs(k), y); else g.lineTo(xs(k), y); g.lineTo(xs(k) + dx, y); }
      g.stroke(); g.lineWidth = 1;
      g.fillStyle = COL.tenue; g.font = `400 10px ${fuente}`; g.fillText(`muestras ${ini} a ${n}`, l, H - 10);

      const quedan = Array.from({ length: G }, (_, i) => i).filter((i) => !cambia.includes(i));
      texto.innerHTML = n === 0
        ? 'Al empezar se sortea un valor para cada generador. Tocá <b>Paso</b> o <b>Reproducir</b>.'
        : `n = ${n} → <code>${binario(n, G)}</code>: ${cambia.length === 1 ? 'cambia el bit' : 'cambian los bits'} ${cambia.join(', ')}, así que ${cambia.length === 1 ? 'se renueva el generador' : 'se renuevan los generadores'} ${cambia.join(', ')}${quedan.length ? ` y ${quedan.length === 1 ? 'el' : 'los'} ${quedan.join(', ')} ${quedan.length === 1 ? 'mantiene' : 'mantienen'} su valor` : ''}. Los que cambian rápido aportan los agudos; los lentos, los graves. Sumados, la energía queda pareja por octava.`;
    }

    vista.addEventListener('click', (e) => {
      const acc = e.target.closest('[data-acc]')?.dataset.acc;
      if (acc === 'play') { if (timer) parar(); else { if (n >= N - 1) reiniciar(); timer = setInterval(avanzar, PASO_MS); bPlay.textContent = '⏸ Pausa'; } }
      if (acc === 'paso') { parar(); avanzar(); }
      if (acc === 'reset') { parar(); reiniciar(); }
    });
    new ResizeObserver(() => sim && !panel.hidden && dibujar()).observe(vista);
    link.addEventListener('click', (e) => {
      e.preventDefault();
      panel.hidden = !panel.hidden;
      link.setAttribute('aria-expanded', String(!panel.hidden));
      link.textContent = panel.hidden ? 'Explicación' : 'Ocultar explicación';
      if (!panel.hidden && !sim) reiniciar();
      if (panel.hidden) parar();
    });
  }

  function iniciar() {
    document.querySelectorAll('.voss-toggle').forEach((link) => {
      if (link.dataset.listo) return;
      const panel = document.getElementById(link.getAttribute('aria-controls'));
      if (!panel) return;
      link.dataset.listo = '1';
      montar(panel, link);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
