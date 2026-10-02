// Demos de los servicios de M1 dentro de la página (generar, escuchar y ver): usan los mismos algoritmos
// que la API de referencia (trabajo_practico/interactivos/_comun/generacion.js). Se montan en cada
// <div class="servicio-demo" data-servicio="pink-noise | sine-sweep"> de la especificación.
const base = new URL('../trabajo_practico/interactivos/_comun/', import.meta.url);
const [gen, ac, gr] = await Promise.all([
  import(new URL('generacion.js', base)), import(new URL('acustica.js', base)), import(new URL('grafico.js', base)),
]);
const { generatePinkNoise, generateVossPinkNoise, generateSineSweepPair, frecuenciaInstantanea, convolucionFFT, pendienteDbPorOctava } = gen;
const { espectroPromedioDb, envolventeMinMax, fft } = ac;
const { FUENTE, prepararCanvas, dibujarLeyenda, alCambiarAncho, paleta } = gr;

// ── Audio: una sola señal sonando en toda la página ─────────────────────────────────────────────
let ctx = null, sonando = null;
const contexto = () => (ctx ??= new (window.AudioContext || window.webkitAudioContext)());
function detener() { if (sonando) { try { sonando.src.stop(); } catch { /* ya terminó */ } sonando.alTerminar?.(); sonando = null; } }
async function reproducir(datos, fs, alTerminar) {
  detener();
  const c = contexto(); await c.resume();
  const b = c.createBuffer(1, datos.length, fs); b.copyToChannel(datos, 0);
  const src = c.createBufferSource(), g = c.createGain();
  g.gain.value = 0.3;                                   // volumen moderado: el sweep y el ruido cansan
  src.buffer = b; src.connect(g); g.connect(c.destination);
  const este = { src, alTerminar };
  src.onended = () => { if (sonando === este) { sonando = null; alTerminar?.(); } };
  sonando = este; src.start();
}

// ── Gráficos ─────────────────────────────────────────────────────────────────────────────────────
function marco(cv, { aspecto, min, max }, leyenda) {
  const COL = paleta();
  const { g, W, H, compacto } = prepararCanvas(cv, { aspecto, min, max });
  const tt = compacto ? 11 : 12;
  g.fillStyle = COL.papel; g.fillRect(0, 0, W, H);
  const alto = leyenda ? dibujarLeyenda(g, leyenda, { x0: compacto ? 40 : 56, y0: tt + 6, maxAncho: W - 70, tamano: tt }) : 0;
  const m = { l: compacto ? 40 : 56, r: 12, t: alto + 12, b: compacto ? 34 : 40 };
  return { g, W, H, tt, m, COL };
}
function rotulos(k, x, y) {
  const { g, W, H, tt, m, COL } = k;
  g.font = `600 ${tt}px ${FUENTE}`; g.fillStyle = COL.eje; g.textAlign = 'center';
  g.fillText(x, m.l + (W - m.l - m.r) / 2, H - 4);
  g.save(); g.translate(tt, m.t + (H - m.t - m.b) / 2); g.rotate(-Math.PI / 2); g.fillText(y, 0, 0); g.restore();
  g.textAlign = 'left';
}
const FRECS = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
const rotuloF = (f) => (f >= 1000 ? `${f / 1000}k` : `${f}`);

function dibujarOnda(cv, x, fs, color, titulo) {
  const k = marco(cv, { aspecto: 0.16, min: 110, max: 150 }, [[color, titulo]]);
  const { g, W, H, m, tt, COL } = k;
  const dur = x.length / fs, xt = (t) => m.l + (t / dur) * (W - m.l - m.r), y0 = (m.t + H - m.b) / 2, a = (H - m.b - m.t) / 2 - 2;
  g.strokeStyle = COL.grilla; g.fillStyle = COL.eje; g.font = `500 ${tt}px ${FUENTE}`; g.textAlign = 'center';
  const paso = dur > 6 ? 2 : dur > 2 ? 1 : 0.5;
  for (let t = 0; t <= dur + 1e-9; t += paso) { g.beginPath(); g.moveTo(xt(t), m.t); g.lineTo(xt(t), H - m.b); g.stroke(); g.fillText(`${t}`, xt(t), H - m.b + tt + 3); }
  g.textAlign = 'left';
  const cols = Math.max(1, Math.round(W - m.l - m.r)), { min, max } = envolventeMinMax(x, cols);
  g.fillStyle = color;
  for (let c = 0; c < cols; c++) g.fillRect(m.l + c, y0 - max[c] * a, 1, Math.max(1, (max[c] - min[c]) * a));
  rotulos(k, 'Tiempo (s)', 'Amplitud');
}

function dibujarPSD(cv, x, fs, pendiente) {
  const COL = paleta();
  const k = marco(cv, { aspecto: 0.42, min: 230, max: 340 }, [[COL.violeta, 'Densidad espectral medida (Welch)'], [COL.senal, 'Referencia −3 dB/octava (1/f)']]);
  const { g, W, H, m, tt } = k;
  const { frecuencias, db } = espectroPromedioDb(x, fs, 4096);
  const fmin = 20, fmax = Math.min(20000, fs / 2), dbMin = -60;
  const xf = (f) => m.l + (Math.log10(f / fmin) / Math.log10(fmax / fmin)) * (W - m.l - m.r);
  const yd = (d) => m.t + (Math.max(dbMin, Math.min(0, d)) / dbMin) * (H - m.t - m.b);
  g.strokeStyle = COL.grilla; g.fillStyle = COL.eje; g.font = `500 ${tt}px ${FUENTE}`; g.textAlign = 'center';
  for (const f of FRECS) if (f <= fmax) { g.beginPath(); g.moveTo(xf(f), m.t); g.lineTo(xf(f), H - m.b); g.stroke(); g.fillText(rotuloF(f), xf(f), H - m.b + tt + 3); }
  g.textAlign = 'right';
  for (let d = 0; d >= dbMin; d -= 10) { g.beginPath(); g.moveTo(m.l, yd(d)); g.lineTo(W - m.r, yd(d)); g.stroke(); g.fillText(`${d}`, m.l - 5, yd(d) + 4); }
  g.textAlign = 'left';
  g.strokeStyle = COL.violeta; g.lineWidth = 1.5; g.beginPath();
  let empezado = false;
  for (let i = 1; i < frecuencias.length; i++) {
    const f = frecuencias[i]; if (f < fmin || f > fmax) continue;
    empezado ? g.lineTo(xf(f), yd(db[i])) : g.moveTo(xf(f), yd(db[i])); empezado = true;
  }
  g.stroke();
  // referencia 1/f anclada en 100 Hz al nivel medido
  const i100 = frecuencias.findIndex((f) => f >= 100), ref = db[i100];
  g.setLineDash([6, 5]); g.strokeStyle = COL.senal; g.lineWidth = 2; g.beginPath();
  g.moveTo(xf(fmin), yd(ref + 10 * Math.log10(100 / fmin))); g.lineTo(xf(fmax), yd(ref - 10 * Math.log10(fmax / 100))); g.stroke(); g.setLineDash([]);
  g.font = `700 ${tt + 1}px ${FUENTE}`; g.fillStyle = COL.tinta;
  g.fillText(`Pendiente medida (100 Hz – 5 kHz): ${pendiente.toFixed(1)} dB/octava`, m.l + 8, H - m.b - 10);
  rotulos(k, 'Frecuencia (Hz, escala logarítmica)', 'Nivel (dB)');
}

// Espectrograma (STFT con ventana de Hann) con la frecuencia instantánea teórica encima.
function dibujarEspectrograma(cv, x, fs, teoria) {
  const COL = paleta();
  const k = marco(cv, { aspecto: 0.38, min: 220, max: 320 }, [[COL.violeta, 'Energía (más claro = más energía)'], [COL.senal, 'f(t) = f₁·(f₂/f₁)^(t/T)']]);
  const { g, W, H, m, tt } = k;
  const n = 4096, hop = 512, dur = x.length / fs, fmin = 20, fmax = Math.min(20000, fs / 2);   // ventana larga: resolución en graves
  const cols = Math.round(W - m.l - m.r), filas = Math.round(H - m.t - m.b);
  const hann = Float64Array.from({ length: n }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)));
  const tramas = Math.max(1, Math.floor((x.length - n) / hop) + 1), mag = [];
  const re = new Float64Array(n), im = new Float64Array(n);
  for (let t = 0; t < tramas; t++) {
    for (let i = 0; i < n; i++) { re[i] = (x[t * hop + i] || 0) * hann[i]; im[i] = 0; }
    fft(re, im);
    mag.push(Float32Array.from({ length: n / 2 }, (_, b) => 10 * Math.log10(re[b] * re[b] + im[b] * im[b] + 1e-12)));
  }
  let max = -Infinity; for (const f of mag) for (const v of f) max = Math.max(max, v);
  const img = g.createImageData(cols, filas);
  const fondo = hex(COL.papel), alto = hex(COL.violeta), pico = [255, 255, 255];
  for (let c = 0; c < cols; c++) {
    const trama = mag[Math.min(tramas - 1, Math.floor((c / cols) * tramas))];
    for (let r = 0; r < filas; r++) {
      const f = fmin * Math.pow(fmax / fmin, 1 - r / (filas - 1)), bin = Math.min(n / 2 - 1, Math.round((f / fs) * n));
      const v = Math.max(0, Math.min(1, (trama[bin] - max + 60) / 60));
      const col = v < 0.7 ? mezclar(fondo, alto, v / 0.7) : mezclar(alto, pico, (v - 0.7) / 0.3);
      const p = (r * cols + c) * 4; img.data[p] = col[0]; img.data[p + 1] = col[1]; img.data[p + 2] = col[2]; img.data[p + 3] = 255;
    }
  }
  // putImageData ignora la transformación: se arma aparte y se dibuja escalado
  const tmp = document.createElement('canvas'); tmp.width = cols; tmp.height = filas; tmp.getContext('2d').putImageData(img, 0, 0);
  g.imageSmoothingEnabled = true; g.drawImage(tmp, m.l, m.t, cols, filas);
  const xt = (t) => m.l + (t / dur) * cols, yf = (f) => m.t + (1 - Math.log10(f / fmin) / Math.log10(fmax / fmin)) * filas;
  g.strokeStyle = COL.senal; g.lineWidth = 2; g.setLineDash([6, 5]); g.beginPath();
  for (let c = 0; c <= cols; c += 3) { const t = (c / cols) * dur, f = Math.min(fmax, teoria(t)); c === 0 ? g.moveTo(xt(t), yf(f)) : g.lineTo(xt(t), yf(f)); }
  g.stroke(); g.setLineDash([]);
  g.font = `500 ${tt}px ${FUENTE}`; g.fillStyle = COL.eje; g.textAlign = 'right';
  for (const f of FRECS) if (f >= fmin && f <= fmax) g.fillText(rotuloF(f), m.l - 5, yf(f) + 4);
  g.textAlign = 'center'; const paso = dur > 6 ? 2 : dur > 2 ? 1 : 0.5;
  for (let t = 0; t <= dur + 1e-9; t += paso) g.fillText(`${t}`, xt(t), H - m.b + tt + 3);
  g.textAlign = 'left';
  rotulos(k, 'Tiempo (s)', 'Frecuencia (Hz)');
}

function dibujarImpulso(cv, y, fs, centro) {
  const COL = paleta();
  const k = marco(cv, { aspecto: 0.34, min: 200, max: 290 }, [[COL.violeta, 'sweep ∗ filtro inverso (dB respecto del pico)']]);
  const { g, W, H, m, tt } = k;
  const ventana = 0.05, i0 = Math.max(0, centro - Math.round(ventana * fs)), i1 = Math.min(y.length, centro + Math.round(ventana * fs));
  let pico = 1e-12; for (let i = i0; i < i1; i++) pico = Math.max(pico, Math.abs(y[i]));
  const dbMin = -80, xt = (i) => m.l + ((i - i0) / (i1 - i0)) * (W - m.l - m.r), yd = (d) => m.t + (Math.max(dbMin, d) / dbMin) * (H - m.t - m.b);
  g.strokeStyle = COL.grilla; g.fillStyle = COL.eje; g.font = `500 ${tt}px ${FUENTE}`; g.textAlign = 'right';
  for (let d = 0; d >= dbMin; d -= 20) { g.beginPath(); g.moveTo(m.l, yd(d)); g.lineTo(W - m.r, yd(d)); g.stroke(); g.fillText(`${d}`, m.l - 5, yd(d) + 4); }
  g.textAlign = 'center';
  for (let ms = -50; ms <= 50; ms += 25) { const i = centro + Math.round((ms / 1000) * fs); g.beginPath(); g.moveTo(xt(i), m.t); g.lineTo(xt(i), H - m.b); g.stroke(); g.fillText(`${ms}`, xt(i), H - m.b + tt + 3); }
  g.textAlign = 'left';
  const cols = Math.round(W - m.l - m.r), porCol = (i1 - i0) / cols;
  g.strokeStyle = COL.violeta; g.lineWidth = 1.2; g.beginPath();
  for (let c = 0; c < cols; c++) {
    let v = 0; for (let i = Math.floor(i0 + c * porCol); i < Math.floor(i0 + (c + 1) * porCol) && i < i1; i++) v = Math.max(v, Math.abs(y[i]));
    const d = 20 * Math.log10(v / pico + 1e-12);
    c === 0 ? g.moveTo(m.l + c, yd(d)) : g.lineTo(m.l + c, yd(d));
  }
  g.stroke();
  rotulos(k, 'Tiempo respecto del pico (ms)', 'Nivel (dB)');
}

const hex = (c) => { const h = c.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const mezclar = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

// ── Demos ────────────────────────────────────────────────────────────────────────────────────────
const json = (o) => JSON.stringify(o, null, 2);
const rango = (clave, texto, min, max, paso, valor) =>
  `<label>${texto} <input type="range" data-p="${clave}" min="${min}" max="${max}" step="${paso}" value="${valor}"><output data-o="${clave}"></output></label>`;

function demoRuidoRosa(el) {
  const estado = { duration: 2, method: 'iir' };
  el.innerHTML = `
    <div class="servicio-demo__cabecera"><span class="servicio-demo__verbo">POST</span><code data-endpoint></code><span class="servicio-demo__nota">Mismo algoritmo que la API de referencia, calculado en tu navegador.</span></div>
    <div class="servicio-demo__controles">
      ${rango('duration', 'duration', 0.5, 5, 0.5, estado.duration)}
      <div class="servicio-demo__grupo" role="group" aria-label="Método">
        <button type="button" data-method="iir" aria-pressed="true">Filtro IIR</button>
        <button type="button" data-method="voss" aria-pressed="false">Voss-McCartney</button>
      </div>
      <button type="button" data-accion="generar">Generar</button>
      <button type="button" data-accion="escuchar">Escuchar</button>
    </div>
    <canvas role="img" aria-label="Forma de onda del ruido rosa"></canvas>
    <canvas role="img" aria-label="Densidad espectral del ruido rosa con la referencia de −3 dB por octava"></canvas>
    <details class="servicio-demo__respuesta"><summary>Respuesta de la API (JSON)</summary><pre><code></code></pre></details>`;
  const [cvOnda, cvPsd] = el.querySelectorAll('canvas');
  let x = null, fs = 0, pendiente = 0;
  const bEsc = el.querySelector('[data-accion="escuchar"]');
  function generar() {
    fs = contexto().sampleRate;
    x = (estado.method === 'iir' ? generatePinkNoise : generateVossPinkNoise)(estado.duration, fs);
    pendiente = pendienteDbPorOctava(x, fs, 100, 5000);
    el.querySelector('[data-endpoint]').textContent = '/api/v1/signals/pink-noise';   // el endpoint de M1 (el método es interno del service)
    el.querySelector('pre code').textContent = json({ duration: estado.duration, sample_rate: fs, num_samples: x.length, max_amplitude: 0.9, method: estado.method === 'iir' ? 'iir_filter' : 'voss' });
    dibujar();
  }
  const dibujar = () => { if (!x) return; dibujarOnda(cvOnda, x, fs, paleta().violeta, `generate_pink_noise(duration=${estado.duration}, fs=${fs})`); dibujarPSD(cvPsd, x, fs, pendiente); };
  el.querySelector('[data-p="duration"]').addEventListener('input', (e) => { estado.duration = Number(e.target.value); el.querySelector('[data-o="duration"]').textContent = `${estado.duration} s`; });
  el.querySelector('[data-p="duration"]').addEventListener('change', generar);
  el.querySelectorAll('[data-method]').forEach((b) => b.addEventListener('click', () => {
    estado.method = b.dataset.method; el.querySelectorAll('[data-method]').forEach((o) => o.setAttribute('aria-pressed', String(o === b))); generar();
  }));
  el.querySelector('[data-accion="generar"]').addEventListener('click', generar);
  bEsc.addEventListener('click', () => {
    if (sonando) { detener(); return; }
    bEsc.textContent = 'Detener'; reproducir(x, fs, () => { bEsc.textContent = 'Escuchar'; });
  });
  el.querySelector('[data-o="duration"]').textContent = `${estado.duration} s`;
  alCambiarAncho(cvPsd, dibujar);
  return { iniciar: generar, redibujar: dibujar };
}

function demoSweep(el) {
  const estado = { duration: 3, f1: 20, f2: 20000 };
  el.innerHTML = `
    <div class="servicio-demo__cabecera"><span class="servicio-demo__verbo">POST</span><code>/api/v1/signals/sine-sweep</code><span class="servicio-demo__nota">Mismo algoritmo que la API de referencia, calculado en tu navegador.</span></div>
    <div class="servicio-demo__controles">
      ${rango('duration', 'duration', 0.5, 10, 0.5, estado.duration)}
      ${rango('f1', 'f1', 20, 1000, 10, estado.f1)}
      ${rango('f2', 'f2', 2000, 20000, 500, estado.f2)}
      <button type="button" data-escuchar="sweep">Escuchar el sweep</button>
      <button type="button" data-escuchar="inverso">Escuchar el filtro inverso</button>
    </div>
    <canvas role="img" aria-label="Espectrograma del sine sweep con la frecuencia instantánea teórica"></canvas>
    <canvas role="img" aria-label="Forma de onda del filtro inverso"></canvas>
    <canvas role="img" aria-label="Convolución del sweep con su filtro inverso: un impulso"></canvas>
    <p class="servicio-demo__dato" aria-live="polite"></p>
    <details class="servicio-demo__respuesta"><summary>Respuesta de la API (JSON)</summary><pre><code></code></pre></details>`;
  const [cvEsp, cvInv, cvImp] = el.querySelectorAll('canvas');
  let par = null, y = null, fs = 0;
  function generar() {
    fs = contexto().sampleRate;
    estado.f2 = Math.min(estado.f2, fs / 2);
    par = generateSineSweepPair(estado.duration, estado.f1, estado.f2, fs);
    y = convolucionFFT(par.sweep, par.inverseFilter);
    let iPico = 0; for (let i = 0; i < y.length; i++) if (Math.abs(y[i]) > Math.abs(y[iPico])) iPico = i;
    let e = 0, n = 0; for (let i = 0; i < y.length; i += 7) if (Math.abs(i - iPico) > fs * 0.01) { e += y[i] * y[i]; n++; }
    el.querySelector('.servicio-demo__dato').innerHTML = `El pico del impulso queda <strong>${(20 * Math.log10(Math.abs(y[iPico]) / Math.sqrt(e / n))).toFixed(0)} dB</strong> por encima del resto: eso es lo que verifica el test de la convolución.`;
    par.centro = iPico;
    el.querySelector('pre code').textContent = json({
      sine_sweep: { duration: estado.duration, sample_rate: fs, num_samples: par.sweep.length, start_freq: estado.f1, end_freq: estado.f2, is_inverse: false },
      inverse_filter: { duration: estado.duration, sample_rate: fs, num_samples: par.inverseFilter.length, start_freq: estado.f1, end_freq: estado.f2, is_inverse: true, max_amplitude: 0.9 },
    });
    dibujar();
  }
  function dibujar() {
    if (!par) return;
    dibujarEspectrograma(cvEsp, par.sweep, fs, (t) => frecuenciaInstantanea(t, estado.duration, estado.f1, estado.f2));
    dibujarOnda(cvInv, par.inverseFilter, fs, paleta().senal, 'Filtro inverso: el sweep invertido en el tiempo; su amplitud baja 6 dB por octava hacia los graves');
    dibujarImpulso(cvImp, y, fs, par.centro);
  }
  for (const k of ['duration', 'f1', 'f2']) {
    const inp = el.querySelector(`[data-p="${k}"]`), out = el.querySelector(`[data-o="${k}"]`);
    const mostrar = () => { out.textContent = k === 'duration' ? `${estado[k]} s` : `${estado[k]} Hz`; };
    inp.addEventListener('input', () => { estado[k] = Number(inp.value); mostrar(); });
    inp.addEventListener('change', generar);
    mostrar();
  }
  el.querySelectorAll('[data-escuchar]').forEach((b) => b.addEventListener('click', () => {
    const texto = b.textContent;
    if (sonando) { detener(); if (b.dataset.sonando) return; }
    b.dataset.sonando = '1'; b.textContent = 'Detener';
    reproducir(b.dataset.escuchar === 'sweep' ? par.sweep : par.inverseFilter, fs, () => { delete b.dataset.sonando; b.textContent = texto; });
  }));
  alCambiarAncho(cvEsp, dibujar);
  return { iniciar: generar, redibujar: dibujar };
}

const DEMOS = { 'pink-noise': demoRuidoRosa, 'sine-sweep': demoSweep };
const montadas = [];
for (const el of document.querySelectorAll('.servicio-demo[data-servicio]')) {
  const crear = DEMOS[el.dataset.servicio];
  if (!crear) continue;
  const demo = crear(el);
  montadas.push(demo);
  // Se calcula recién cuando la demo entra en pantalla (no frena la carga de la página).
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); demo.iniciar(); } }, { rootMargin: '200px' });
  io.observe(el);
}
// Al cambiar el tema del sitio (claro/oscuro) se redibuja con la paleta nueva.
new MutationObserver(() => montadas.forEach((d) => d.redibujar())).observe(document.body, { attributes: true, attributeFilter: ['data-md-color-scheme'] });
window.addEventListener('pagehide', detener);
