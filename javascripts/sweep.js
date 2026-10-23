// Gráfico del sine sweep logarítmico (M1 · servicio 2): la señal x(t) arriba y su frecuencia
// instantánea f(t) abajo, con el eje de frecuencia en escala logarítmica o lineal. Las líneas
// verticales marcan dónde el sweep cruza cada octava: quedan equiespaciadas. La lógica es pura y testeable.
(function () {
  // f(t) = f1 · e^(t·ln(f2/f1)/T)
  const frecInst = (t, T, f1, f2) => f1 * Math.exp((t * Math.log(f2 / f1)) / T);
  // x(t) = sin[2π f1 T / ln(f2/f1) · (e^(t·ln(f2/f1)/T) − 1)]
  const senal = (t, T, f1, f2) => {
    const L = Math.log(f2 / f1);
    return Math.sin(((2 * Math.PI * f1 * T) / L) * (Math.exp((t * L) / T) - 1));
  };
  // Instantes en que f(t) vale f1, 2·f1, 4·f1, … hasta f2: t_k = k·T·ln2 / ln(f2/f1).
  const crucesOctava = (T, f1, f2) => {
    const L = Math.log(f2 / f1), out = [];
    for (let k = 0; f1 * 2 ** k <= f2 * (1 + 1e-9); k++) out.push({ t: (k * T * Math.LN2) / L, f: f1 * 2 ** k });
    return out;
  };
  window.SweepLogica = { frecInst, senal, crucesOctava };
  if (typeof document === 'undefined') return;           // en los tests no hay DOM

  const T = 1, F1 = 2, F2 = 32;                          // escala didáctica: 4 octavas en 1 s
  const css = (v, def) => getComputedStyle(document.body || document.documentElement).getPropertyValue(v).trim() || def;

  function montar(fig) {
    fig.innerHTML = `
      <div class="sweep-fig__controles" role="group" aria-label="Escala del eje de frecuencia">
        <span>Eje de frecuencia:</span>
        <button type="button" data-escala="log" aria-pressed="true">logarítmico</button>
        <button type="button" data-escala="lin" aria-pressed="false">lineal</button>
      </div>
      <canvas aria-label="Sine sweep logarítmico: señal y frecuencia instantánea"></canvas>
      <p class="sweep-fig__texto" aria-live="polite"></p>`;
    const cv = fig.querySelector('canvas'), texto = fig.querySelector('.sweep-fig__texto');
    let escala = 'log', cursor = null;
    const cruces = crucesOctava(T, F1, F2);
    const base = `Escala didáctica: de ${F1} a ${F2} Hz en ${T} s (4 octavas) para que se vean los ciclos; el sweep real va de 20 Hz a 20 kHz. `;

    function dibujar() {
      const C = { papel: css('--g-fondo', '#161b22'), tinta: css('--g-tinta', '#c9d1d9'), eje: css('--g-eje', '#8b949e'),
        grilla: css('--g-grilla', '#30363d'), violeta: css('--g-violeta', '#818cf8'), senal: css('--g-senal', '#fbbf24'), tenue: css('--g-tenue', '#6e7681') };
      const W = Math.max(280, fig.clientWidth), compacto = W < 560;
      const l = compacto ? 46 : 58, r = 14, arriba = 26, hx = compacto ? 70 : 90, sep = 34, hf = compacto ? 150 : 190, abajo = 34;
      const H = arriba + hx + sep + hf + abajo;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = '100%'; cv.style.height = H + 'px';
      const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = C.papel; g.fillRect(0, 0, W, H);
      const fuente = 'Roboto, system-ui, sans-serif';
      const xt = (t) => l + (t / T) * (W - l - r);
      const yx0 = arriba + hx / 2, ax = hx / 2 - 4;
      const yf0 = arriba + hx + sep, yf1 = yf0 + hf;
      const yf = (f) => escala === 'log'
        ? yf1 - (Math.log(f / F1) / Math.log(F2 / F1)) * hf
        : yf1 - ((f - 0) / F2) * hf;

      // Octavas: franjas alternadas y líneas verticales en cada cruce (equiespaciadas en el tiempo).
      for (let k = 0; k < cruces.length - 1; k++) {
        if (k % 2) { g.fillStyle = C.grilla; g.globalAlpha = 0.35; g.fillRect(xt(cruces[k].t), arriba, xt(cruces[k + 1].t) - xt(cruces[k].t), yf1 - arriba); g.globalAlpha = 1; }
      }
      g.strokeStyle = C.grilla; g.setLineDash([3, 3]);
      for (const c of cruces) { g.beginPath(); g.moveTo(xt(c.t), arriba); g.lineTo(xt(c.t), yf1); g.stroke(); }
      g.setLineDash([]);

      // Panel superior: x(t).
      g.font = `600 ${compacto ? 11 : 12}px ${fuente}`; g.fillStyle = C.tinta; g.textBaseline = 'middle'; g.textAlign = 'left';
      g.fillText('x(t)', 8, yx0);
      g.strokeStyle = C.violeta; g.lineWidth = 1.5; g.beginPath();
      const pasos = Math.round((W - l - r) * 2);
      for (let p = 0; p <= pasos; p++) { const t = (p / pasos) * T, y = yx0 - senal(t, T, F1, F2) * ax; if (p) g.lineTo(xt(t), y); else g.moveTo(xt(t), y); }
      g.stroke();

      // Panel inferior: f(t), con las frecuencias de cada octava en el eje.
      g.fillStyle = C.tinta; g.fillText('f(t)', 8, yf0 - 14);
      g.font = `400 ${compacto ? 10 : 11}px ${fuente}`; g.textAlign = 'right';
      for (const c of cruces) {
        g.strokeStyle = C.grilla; g.beginPath(); g.moveTo(l, yf(c.f)); g.lineTo(W - r, yf(c.f)); g.stroke();
        g.fillStyle = C.eje; g.fillText(`${c.f} Hz`, l - 4, yf(c.f));
      }
      g.strokeStyle = C.senal; g.lineWidth = 2.5; g.beginPath();
      for (let p = 0; p <= pasos; p++) { const t = (p / pasos) * T, y = yf(frecInst(t, T, F1, F2)); if (p) g.lineTo(xt(t), y); else g.moveTo(xt(t), y); }
      g.stroke(); g.lineWidth = 1;

      // Eje de tiempo y duración de cada octava.
      g.textAlign = 'center'; g.fillStyle = C.eje;
      for (const c of cruces) g.fillText(`${+c.t.toFixed(2)} s`, xt(c.t), yf1 + 12);
      g.fillStyle = C.tenue;
      for (let k = 0; k < cruces.length - 1; k++) g.fillText(`${F1 * 2 ** k}–${F1 * 2 ** (k + 1)} Hz`, (xt(cruces[k].t) + xt(cruces[k + 1].t)) / 2, arriba - 12);
      g.fillText('tiempo', (l + W - r) / 2, H - 8);

      // Cursor: el instante que se señala, en los dos paneles.
      if (cursor !== null) {
        const f = frecInst(cursor, T, F1, F2);
        g.strokeStyle = C.tinta; g.globalAlpha = 0.6; g.beginPath(); g.moveTo(xt(cursor), arriba); g.lineTo(xt(cursor), yf1); g.stroke(); g.globalAlpha = 1;
        g.fillStyle = C.senal; g.beginPath(); g.arc(xt(cursor), yf(f), 4.5, 0, 2 * Math.PI); g.fill();
        texto.innerHTML = `t = ${cursor.toFixed(2)} s → f(t) = ${f.toFixed(1)} Hz. ` + base;
      } else {
        texto.innerHTML = (escala === 'log'
          ? 'En escala logarítmica f(t) es una recta: el sweep tarda <b>lo mismo en cada octava</b> (las franjas tienen el mismo ancho). '
          : 'En escala lineal se ve la exponencial: pasa mucho tiempo en los graves y recorre los agudos rápido, pero cada octava sigue durando lo mismo. ')
          + 'Pasá el dedo o el mouse por el gráfico para leer f(t). ' + base;
      }
      fig._xt = xt; fig._l = l; fig._r = r;
    }

    fig.addEventListener('click', (e) => {
      const b = e.target.closest('[data-escala]'); if (!b) return;
      escala = b.dataset.escala;
      fig.querySelectorAll('[data-escala]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      dibujar();
    });
    const mover = (e) => {
      const rect = cv.getBoundingClientRect(), x = e.clientX - rect.left;
      const t = ((x - fig._l) / (rect.width - fig._l - fig._r)) * T;
      cursor = t >= 0 && t <= T ? t : null; dibujar();
    };
    cv.addEventListener('pointermove', mover);
    cv.addEventListener('pointerdown', mover);
    cv.addEventListener('pointerleave', () => { cursor = null; dibujar(); });
    new ResizeObserver(dibujar).observe(fig);
    new MutationObserver(dibujar).observe(document.body, { attributes: true, attributeFilter: ['data-md-color-scheme'] });
    dibujar();
  }

  function iniciar() {
    document.querySelectorAll('.sweep-fig').forEach((fig) => {
      if (fig.dataset.listo) return;
      fig.dataset.listo = '1';
      montar(fig);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
