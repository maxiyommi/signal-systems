// Figuras del material "El álgebra de la deconvolución" (M2). Cada <figure class="figura-deconv"
// data-figura="convolucion | apilado | distorsion | cadena"> se dibuja con los mismos algoritmos que
// las demos de M1 y M2 (trabajo_practico/interactivos/_comun/), con la paleta del sitio (claro/oscuro).
const base = new URL('../trabajo_practico/interactivos/_comun/', import.meta.url);
const [gen, ac, gr, pr] = await Promise.all([
  import(new URL('generacion.js', base)), import(new URL('acustica.js', base)),
  import(new URL('grafico.js', base)), import(new URL('procesamiento.js', base)),
]);
const { generateSineSweepPair, convolucionFFT, rngGauss, frecuenciaInstantanea } = gen;
const { riSintetica } = ac;
const { FUENTE, prepararCanvas, dibujarLeyenda, alCambiarAncho, paleta } = gr;
const { logarithmicScaleConversion, retardoArmonico } = pr;

const fmt = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');

// Marco común: fondo, leyenda arriba y márgenes. Devuelve el contexto para dibujar.
function marco(cv, opciones, leyenda) {
  const COL = paleta();
  const { g, W, H, compacto } = prepararCanvas(cv, opciones);
  const tt = compacto ? 11 : 12;
  g.fillStyle = COL.papel; g.fillRect(0, 0, W, H);
  const alto = leyenda ? dibujarLeyenda(g, leyenda, { x0: compacto ? 44 : 60, y0: tt + 6, maxAncho: W - 74, tamano: tt }) : 0;
  return { g, W, H, tt, COL, compacto, m: { l: compacto ? 44 : 60, r: 14, t: alto + 14, b: compacto ? 34 : 40 } };
}
function rotulos(k, x, y, { y0 = k.m.t, y1 = k.H - k.m.b } = {}) {
  const { g, W, H, tt, m, COL } = k;
  g.font = `600 ${tt}px ${FUENTE}`; g.fillStyle = COL.eje; g.textAlign = 'center';
  if (x) g.fillText(x, m.l + (W - m.l - m.r) / 2, H - 4);
  g.save(); g.translate(tt, (y0 + y1) / 2); g.rotate(-Math.PI / 2); g.fillText(y, 0, 0); g.restore();
  g.textAlign = 'left';
}
function etiqueta(k, texto, x, y, { color = k.COL.tinta, alinear = 'left', peso = 600 } = {}) {
  k.g.font = `${peso} ${k.tt}px ${FUENTE}`; k.g.fillStyle = color; k.g.textAlign = alinear; k.g.fillText(texto, x, y); k.g.textAlign = 'left';
}
function grillaX(k, t0, t1, paso, xt, { y0, y1, rotular = true, decimales = 1 }) {
  const { g, tt, COL } = k;
  g.strokeStyle = COL.grilla; g.fillStyle = COL.eje; g.font = `500 ${tt}px ${FUENTE}`; g.textAlign = 'center';
  for (let t = Math.ceil(t0 / paso - 1e-9) * paso; t <= t1 + 1e-9; t += paso) {
    g.beginPath(); g.moveTo(xt(t), y0); g.lineTo(xt(t), y1); g.stroke();
    if (rotular) g.fillText(fmt(t, decimales), xt(t), y1 + tt + 3);
  }
  g.textAlign = 'left';
}
// Señal por columnas (envolvente mín/máx): se lee igual con 100 o con 100 000 muestras.
function onda(k, x, i0, i1, xt0, xt1, yv, color, ancho = 1) {
  const { g } = k, cols = Math.max(1, Math.round(xt1 - xt0)), por = (i1 - i0) / cols;
  g.fillStyle = color;
  for (let c = 0; c < cols; c++) {
    let mn = Infinity, mx = -Infinity;
    for (let i = Math.floor(i0 + c * por); i < Math.max(Math.floor(i0 + c * por) + 1, Math.floor(i0 + (c + 1) * por)); i++) {
      const v = i >= 0 && i < x.length ? x[i] : 0; mn = Math.min(mn, v); mx = Math.max(mx, v);
    }
    g.fillRect(xt0 + c, yv(mx), ancho, Math.max(1, yv(mn) - yv(mx)));
  }
}
// Curva en dB por columnas (máximo de cada columna).
function curvaDb(k, d, i0, i1, xt0, xt1, yd, color, { ancho = 1.4, guiones = null } = {}) {
  const { g } = k, cols = Math.max(1, Math.round(xt1 - xt0)), por = (i1 - i0) / cols;
  g.strokeStyle = color; g.lineWidth = ancho; g.setLineDash(guiones || []); g.beginPath();
  for (let c = 0; c < cols; c++) {
    let v = -Infinity;
    for (let i = Math.floor(i0 + c * por); i < Math.max(Math.floor(i0 + c * por) + 1, Math.floor(i0 + (c + 1) * por)); i++) if (i >= 0 && i < d.length) v = Math.max(v, d[i]);
    if (v === -Infinity) continue;
    c ? g.lineTo(xt0 + c, yd(v)) : g.moveTo(xt0 + c, yd(v));
  }
  g.stroke(); g.setLineDash([]); g.lineWidth = 1;
}

// ── 1 · La convolución como suma de copias de h ───────────────────────────────────────────────────
// x tiene tres impulsos; cada uno dispara una copia de h corrida y escalada; y es la suma.
// h es una oscilación amortiguada (un sistema LTI simple) para que las copias se distingan.
function figConvolucion(cv) {
  const fs = 4000, dur = 0.4, n = Math.round(dur * fs);
  const impulsos = [[0.03, 1], [0.08, 0.6], [0.16, -0.8]];   // cerca: las copias de h se superponen y suman
  const h = Float32Array.from({ length: Math.round(0.25 * fs) }, (_, i) => Math.exp(-i / fs / 0.045) * Math.sin((2 * Math.PI * 22 * i) / fs + Math.PI / 2));
  const copias = impulsos.map(([t, a]) => { const c = new Float32Array(n), i0 = Math.round(t * fs); for (let i = 0; i < h.length && i0 + i < n; i++) c[i0 + i] = a * h[i]; return c; });
  const y = Float32Array.from({ length: n }, (_, i) => copias.reduce((s, c) => s + c[i], 0));
  const linea = (k, s, yv, color, ancho, xt) => { k.g.strokeStyle = color; k.g.lineWidth = ancho; k.g.beginPath(); for (let i = 0; i < n; i++) i ? k.g.lineTo(xt(i / fs), yv(s[i] ?? 0)) : k.g.moveTo(xt(0), yv(s[0] ?? 0)); k.g.stroke(); k.g.lineWidth = 1; };
  return () => {
    const COL = paleta();
    const k = marco(cv, { aspecto: 0.72, min: 420, max: 540 }, [[COL.senal, 'x(t) y una copia de h por impulso'], [COL.eje, 'h(t): el sistema'], [COL.violeta, 'y(t) = (x ∗ h)(t): la suma de las copias']]);
    const { g, W, H, m } = k, filas = 4, sep = 14, altoFila = (H - m.t - m.b - sep * (filas - 1)) / filas;
    const xt = (t) => m.l + (t / dur) * (W - m.l - m.r);
    let pico = 0; for (const v of y) pico = Math.max(pico, Math.abs(v));
    const fila = (j, escala = 1) => { const y0 = m.t + j * (altoFila + sep); return { y0, y1: y0 + altoFila, yv: (v) => y0 + altoFila / 2 - (v / escala) * (altoFila / 2 - 4) }; };
    const nombres = ['x(t)', 'h(t)', 'copias', 'y(t)'];
    for (let j = 0; j < filas; j++) {
      const f = fila(j);
      grillaX(k, 0, dur, 0.1, xt, { y0: f.y0, y1: f.y1, rotular: j === filas - 1 });
      g.strokeStyle = COL.grilla; g.beginPath(); g.moveTo(m.l, f.yv(0)); g.lineTo(W - m.r, f.yv(0)); g.stroke();
      etiqueta(k, nombres[j], m.l - 8, f.yv(0) + 4, { color: COL.eje, alinear: 'right' });
    }
    // x(t): impulsos (palitos con punta)
    let f = fila(0);
    for (const [t, a] of impulsos) {
      g.strokeStyle = COL.senal; g.lineWidth = 2.5; g.beginPath(); g.moveTo(xt(t), f.yv(0)); g.lineTo(xt(t), f.yv(a)); g.stroke(); g.lineWidth = 1;
      g.fillStyle = COL.senal; g.beginPath(); g.arc(xt(t), f.yv(a), 4, 0, 2 * Math.PI); g.fill();
      etiqueta(k, fmt(a, 1), xt(t) + 7, f.yv(a) + (a > 0 ? 4 : 4), { color: COL.tinta });
    }
    // h(t)
    f = fila(1);
    linea(k, h, f.yv, COL.eje, 2, xt);
    etiqueta(k, 'lo que devuelve el sistema ante un impulso en t = 0', xt(0.2), f.yv(0) - 10, { color: COL.eje, peso: 500 });
    // Las tres copias, cada una corrida y escalada (se pisan entre sí)...
    f = fila(2, pico);
    for (const c of copias) linea(k, c, f.yv, COL.senal, 1.6, xt);
    impulsos.forEach(([t, a], j) => etiqueta(k, `${fmt(a, 1)}·h(t − ${fmt(t, 2)})`, xt(t) + 4, f.y0 + 11 + j * (k.tt + 3), { color: COL.tinta, peso: 500 }));
    // ...y su suma.
    f = fila(3, pico);
    linea(k, y, f.yv, COL.violeta, 2.2, xt);
    rotulos(k, 'Tiempo (s)', 'Amplitud');
  };
}

// ── 2 · Cada frecuencia se apila en el mismo instante ────────────────────────────────────────────
// La frecuencia f aparece en el sweep en t_f y en el filtro inverso en T − t_f: en la convolución
// llega en t_f + (T − t_f) = T, la misma para todas. Por eso sale un impulso.
function figApilado(cv) {
  const T = 1, f1 = 20, f2 = 20000, marcas = [100, 1000, 10000];
  const tDe = (f) => (T * Math.log(f / f1)) / Math.log(f2 / f1);
  return () => {
    const COL = paleta();
    const k = marco(cv, { aspecto: 0.48, min: 300, max: 400 }, [[COL.violeta, 'sweep x(t): sube de f₁ a f₂'], [COL.senal, 'filtro inverso x_inv(t): baja de f₂ a f₁'], [COL.tinta, 'x ∗ x_inv: todas las frecuencias en t = T']]);
    const { g, W, H, m, tt } = k, tMax = 1.4 * T;
    const xt = (t) => m.l + (t / tMax) * (W - m.l - m.r);
    const yf = (f) => H - m.b - (Math.log(f / f1) / Math.log(f2 / f1)) * (H - m.t - m.b);
    grillaX(k, 0, tMax, 0.2, xt, { y0: m.t, y1: H - m.b });
    g.fillStyle = COL.eje; g.strokeStyle = COL.grilla; g.font = `500 ${tt}px ${FUENTE}`; g.textAlign = 'right';
    for (const f of [20, 100, 1000, 10000, 20000]) { g.beginPath(); g.moveTo(m.l, yf(f)); g.lineTo(W - m.r, yf(f)); g.stroke(); g.fillText(f >= 1000 ? `${f / 1000}k` : `${f}`, m.l - 5, yf(f) + 4); }
    g.textAlign = 'left';
    const curva = (fn, color) => { g.strokeStyle = color; g.lineWidth = 2.5; g.beginPath(); for (let i = 0; i <= 200; i++) { const t = (i / 200) * T; i ? g.lineTo(xt(t), yf(fn(t))) : g.moveTo(xt(t), yf(fn(t))); } g.stroke(); g.lineWidth = 1; };
    curva((t) => frecuenciaInstantanea(t, T, f1, f2), COL.violeta);
    curva((t) => frecuenciaInstantanea(T - t, T, f1, f2), COL.senal);
    // El resultado: una línea vertical en t = T que cubre de f1 a f2.
    g.strokeStyle = COL.tinta; g.lineWidth = 4; g.beginPath(); g.moveTo(xt(T), yf(f1)); g.lineTo(xt(T), yf(f2)); g.stroke(); g.lineWidth = 1;
    // Una frecuencia de ejemplo: dónde está en cada señal y adónde llega.
    for (const f of marcas) {
      const tf = tDe(f);
      g.setLineDash([3, 4]); g.strokeStyle = COL.eje; g.beginPath(); g.moveTo(xt(tf), yf(f)); g.lineTo(xt(T), yf(f)); g.stroke(); g.setLineDash([]);
      for (const [t, c] of [[tf, COL.violeta], [T - tf, COL.senal], [T, COL.tinta]]) { g.fillStyle = c; g.beginPath(); g.arc(xt(t), yf(f), 5, 0, 2 * Math.PI); g.fill(); }
    }
    const f0 = 1000, tf = tDe(f0);
    etiqueta(k, `1 kHz: en t_f = ${fmt(tf, 2)} s del sweep`, xt(tf) - 6, yf(f0) - 10, { color: COL.tinta, alinear: 'right' });
    etiqueta(k, `y en T − t_f = ${fmt(T - tf, 2)} s del inverso`, xt(T - tf) - 6, yf(f0) + 20, { color: COL.tinta, alinear: 'right' });
    etiqueta(k, 't_f + (T − t_f) = T', xt(T) + 10, yf(f0) + 4, { color: COL.tinta });
    etiqueta(k, 'para toda f: el pico', xt(T) + 10, yf(f0) + 4 + tt + 4, { color: COL.eje, peso: 500 });
    rotulos(k, 'Tiempo (s) · sweep de T = 1 s, de 20 Hz a 20 kHz', 'Frecuencia (Hz)');
  };
}

// ── 3 · La distorsión armónica queda antes del pico ──────────────────────────────────────────────
function figDistorsion(cv) {
  const fs = 44100, T = 2, f1 = 20, f2 = 20000;
  const { sweep, inverseFilter } = generateSineSweepPair(T, f1, f2, fs);
  const distorsionado = sweep.map((v) => v + 0.2 * v ** 2 + 0.12 * v ** 3 + 0.06 * v ** 4);   // parlante no lineal: armónicos 2.º a 4.º
  const y = convolucionFFT(distorsionado, inverseFilter);
  let iPico = 0; for (let i = 0; i < y.length; i++) if (Math.abs(y[i]) > Math.abs(y[iPico])) iPico = i;
  const d = logarithmicScaleConversion(y, -120);
  const t0 = -0.45, t1 = 0.1;
  return () => {
    const COL = paleta();
    const k = marco(cv, { aspecto: 0.4, min: 260, max: 340 }, [[COL.violeta, 'grabación con distorsión ∗ x_inv (dB respecto del pico)'], [COL.eje, 'Δtₙ = −T · ln(n) / ln(f₂/f₁)']]);
    const { g, W, H, m } = k, dbMin = -100;
    const xt = (t) => m.l + ((t - t0) / (t1 - t0)) * (W - m.l - m.r);
    const yd = (v) => m.t + (Math.max(dbMin, Math.min(0, v)) / dbMin) * (H - m.t - m.b);
    grillaX(k, t0, t1, 0.1, xt, { y0: m.t, y1: H - m.b });
    g.strokeStyle = COL.grilla; g.fillStyle = COL.eje; g.textAlign = 'right';
    for (let v = 0; v >= dbMin; v -= 20) { g.beginPath(); g.moveTo(m.l, yd(v)); g.lineTo(W - m.r, yd(v)); g.stroke(); g.fillText(`${v}`, m.l - 5, yd(v) + 4); }
    g.textAlign = 'left';
    curvaDb(k, d, iPico + Math.round(t0 * fs), iPico + Math.round(t1 * fs), m.l, W - m.r, yd, COL.violeta, { ancho: 1.2 });
    for (let n = 2; n <= 4; n++) {
      const t = retardoArmonico(n, T, f1, f2);
      g.setLineDash([4, 4]); g.strokeStyle = COL.eje; g.beginPath(); g.moveTo(xt(t), m.t); g.lineTo(xt(t), H - m.b); g.stroke(); g.setLineDash([]);
      etiqueta(k, `${n}.º armónico`, xt(t) + 4, m.t + 12 + (n - 2) * (k.tt + 4), { color: COL.tinta });
      etiqueta(k, `${fmt(t * 1000, 0)} ms`, xt(t) + 4, m.t + 12 + (n - 2) * (k.tt + 4) + k.tt + 2, { color: COL.eje, peso: 500 });
    }
    etiqueta(k, 'respuesta lineal: la que se usa', xt(0) + 6, m.t + 12, { color: COL.tinta });
    rotulos(k, 'Tiempo respecto del pico (s) · sweep de 2 s, 20 Hz a 20 kHz', 'Nivel (dB)');
  };
}

// ── 4 · La cadena en el tiempo: lo que devuelve fftconvolve y qué se recorta ──────────────────────
function figCadena(cv) {
  const fs = 44100, T = 2, durH = 0.8;
  const r = rngGauss(8);
  const h = riSintetica({ fs, t60: 0.6, duracion: durH, rng: () => 0.3 * r() });
  const { sweep, inverseFilter } = generateSineSweepPair(T, 20, 20000, fs);
  const seco = convolucionFFT(sweep, h);
  let mx = 0; for (const v of seco) mx = Math.max(mx, Math.abs(v));
  const rr = rngGauss(31), rec = Float32Array.from(seco, (v) => v + mx * 1e-3 * rr());   // ruido de fondo −60 dB
  const full = convolucionFFT(rec, inverseFilter);
  let iPico = 0; for (let i = 0; i < full.length; i++) if (Math.abs(full[i]) > Math.abs(full[iPico])) iPico = i;
  const dFull = logarithmicScaleConversion(full, -120), dH = logarithmicScaleConversion(h, -120);
  const total = full.length / fs, recorte = durH;
  return () => {
    const COL = paleta();
    const k = marco(cv, { aspecto: 0.42, min: 270, max: 350 }, [[COL.violeta, 'fftconvolve(recording, inverse_filter, mode="full")'], [COL.eje, 'h(t) de la sala, ubicada en el pico']]);
    const { g, W, H, m } = k, dbMin = -100;
    const xt = (t) => m.l + (t / total) * (W - m.l - m.r);
    const yd = (v) => m.t + (Math.max(dbMin, Math.min(0, v)) / dbMin) * (H - m.t - m.b);
    const tPico = iPico / fs;
    // Zonas: lo que se descarta antes del pico y la ventana que se conserva.
    g.fillStyle = COL.grilla; g.globalAlpha = 0.45; g.fillRect(xt(0), m.t, xt(tPico) - xt(0), H - m.t - m.b); g.globalAlpha = 1;
    g.strokeStyle = COL.tinta; g.lineWidth = 1.5; g.strokeRect(xt(tPico), m.t + 1, xt(tPico + recorte) - xt(tPico), H - m.t - m.b - 2); g.lineWidth = 1;
    grillaX(k, 0, total, 0.5, xt, { y0: m.t, y1: H - m.b });
    g.strokeStyle = COL.grilla; g.fillStyle = COL.eje; g.textAlign = 'right';
    for (let v = 0; v >= dbMin; v -= 20) { g.beginPath(); g.moveTo(m.l, yd(v)); g.lineTo(W - m.r, yd(v)); g.stroke(); g.fillText(`${v}`, m.l - 5, yd(v) + 4); }
    g.textAlign = 'left';
    curvaDb(k, dFull, 0, full.length, m.l, W - m.r, yd, COL.violeta, { ancho: 1.1 });
    curvaDb(k, dH, 0, Math.round(recorte * fs), xt(tPico), xt(tPico + recorte), yd, COL.eje, { ancho: 1.4, guiones: [4, 3] });
    etiqueta(k, 'antes del pico: se descarta', xt(0.15), m.t + 14, { color: COL.tinta });
    etiqueta(k, `pico: argmax(|·|) en t ≈ ${fmt(tPico, 2)} s`, xt(tPico) - 6, yd(-14), { color: COL.tinta, alinear: 'right' });
    etiqueta(k, `se conserva: ${fmt(recorte, 1)} s desde el pico`, xt(tPico) + 6, yd(-94), { color: COL.tinta });
    etiqueta(k, 'después: ruido de fondo de la grabación', xt(tPico + recorte) + 6, yd(-62), { color: COL.eje, peso: 500 });
    rotulos(k, `Tiempo (s) · la salida completa dura N + M − 1 muestras (${fmt(total, 2)} s)`, 'Nivel (dB)');
  };
}

// Las figuras salen de la columna de texto y usan todo el ancho de la ventana (menos un margen);
// el epígrafe queda alineado con el texto. En pantallas angostas la columna ya ocupa todo.
const MARGEN = 24;
function ensanchar() {
  for (const fig of document.querySelectorAll('figure.figura-deconv')) {
    const cap = fig.querySelector('figcaption');
    fig.style.width = ''; fig.style.marginLeft = ''; if (cap) { cap.style.marginLeft = ''; cap.style.width = ''; }
    const vw = document.documentElement.clientWidth, col = fig.parentElement.getBoundingClientRect();
    if (vw < 960 || vw - col.width < 4 * MARGEN) continue;
    fig.style.width = `${vw - 2 * MARGEN}px`;
    fig.style.marginLeft = `${MARGEN - col.left}px`;
    if (cap) { cap.style.marginLeft = `${col.left - MARGEN}px`; cap.style.width = `${col.width}px`; }
  }
}
ensanchar();
window.addEventListener('resize', ensanchar);

const FIGURAS = { convolucion: figConvolucion, apilado: figApilado, distorsion: figDistorsion, cadena: figCadena };
const montadas = [];
for (const fig of document.querySelectorAll('figure.figura-deconv[data-figura]')) {
  const crear = FIGURAS[fig.dataset.figura];
  const cv = fig.querySelector('canvas');
  if (!crear || !cv) continue;
  const io = new IntersectionObserver((es) => {
    if (!es.some((e) => e.isIntersecting)) return;
    io.disconnect();
    const dibujar = crear(cv);
    dibujar(); montadas.push(dibujar); alCambiarAncho(cv, dibujar);
  }, { rootMargin: '300px' });
  io.observe(fig);
}
new MutationObserver(() => montadas.forEach((d) => d())).observe(document.body, { attributes: true, attributeFilter: ['data-md-color-scheme'] });
