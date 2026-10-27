// Demos de los servicios de M1, M2 y M3 dentro de la página (generar, escuchar y ver): usan los mismos
// algoritmos que la API de referencia (trabajo_practico/interactivos/_comun/). Se montan en cada
// <div class="servicio-demo" data-servicio="..."> de la especificación (ver DEMOS al final).
const base = new URL('../trabajo_practico/interactivos/_comun/', import.meta.url);
const [gen, ac, gr, pr, an] = await Promise.all([
  import(new URL('generacion.js', base)), import(new URL('acustica.js', base)), import(new URL('grafico.js', base)),
  import(new URL('procesamiento.js', base)), import(new URL('analisis.js', base)),
]);
const { BANDAS_M3, applySmoothing, tramoYRecta, calculateParametersFromIr, d50, c80, lundeby, energiaPorBloques } = an;
const { generatePinkNoise, generateVossPinkNoise, generateSineSweepPair, frecuenciaInstantanea, convolucionFFT, pendienteDbPorOctava, rngGauss } = gen;
const { espectroPromedioDb, envolventeMinMax, fft, edcDb, riSintetica, riConRuido, puntoDeCorte } = ac;
const { OCTAVAS, bordesOctava, bandaValida, gananciaOctava, filtrarOctava, generateSyntheticIr, getImpulseResponse, logarithmicScaleConversion, t60Schroeder, correlacionAlineada, leerWav } = pr;
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
  return { g, W, H, tt, m, COL, compacto };
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
  const ventana = 0.005, i0 = Math.max(0, centro - Math.round(ventana * fs)), i1 = Math.min(y.length, centro + Math.round(ventana * fs));
  let pico = 1e-12; for (let i = i0; i < i1; i++) pico = Math.max(pico, Math.abs(y[i]));
  const dbMin = -80, xt = (i) => m.l + ((i - i0) / (i1 - i0)) * (W - m.l - m.r), yd = (d) => m.t + (Math.max(dbMin, d) / dbMin) * (H - m.t - m.b);
  g.strokeStyle = COL.grilla; g.fillStyle = COL.eje; g.font = `500 ${tt}px ${FUENTE}`; g.textAlign = 'right';
  for (let d = 0; d >= dbMin; d -= 20) { g.beginPath(); g.moveTo(m.l, yd(d)); g.lineTo(W - m.r, yd(d)); g.stroke(); g.fillText(`${d}`, m.l - 5, yd(d) + 4); }
  g.textAlign = 'center';
  for (let ms = -5; ms <= 5; ms += k.compacto ? 2.5 : 1) { const i = centro + Math.round((ms / 1000) * fs); g.beginPath(); g.moveTo(xt(i), m.t); g.lineTo(xt(i), H - m.b); g.stroke(); g.fillText(`${ms}`, xt(i), H - m.b + tt + 3); }
  g.textAlign = 'left';
  const cols = Math.round(W - m.l - m.r), porCol = (i1 - i0) / cols;
  g.strokeStyle = COL.violeta; g.lineWidth = 1.2; g.beginPath();
  for (let c = 0; c < cols; c++) {
    const a = Math.floor(i0 + c * porCol), b = Math.max(a + 1, Math.floor(i0 + (c + 1) * porCol));   // ±5 ms: menos muestras que columnas
    let v = 0; for (let i = a; i < b && i < i1; i++) v = Math.max(v, Math.abs(y[i]));
    const d = 20 * Math.log10(v / pico + 1e-12);
    c === 0 ? g.moveTo(m.l + c, yd(d)) : g.lineTo(m.l + c, yd(d));
  }
  g.stroke();
  rotulos(k, 'Tiempo respecto del pico (ms)', 'Nivel (dB)');
}

// Espectro de potencia de toda la señal (una FFT con ceros hasta potencia de 2).
function potencia(x) {
  let N = 1; while (N < x.length) N *= 2;
  const re = new Float64Array(N), im = new Float64Array(N); re.set(x);
  fft(re, im);
  return Float64Array.from({ length: N / 2 }, (_, k) => re[k] * re[k] + im[k] * im[k]);
}
// Sweep (−3 dB/octava), filtro inverso (+3 dB/octava) y su producto (plano entre f1 y f2), en dB respecto
// de su valor en la frecuencia central sqrt(f1·f2), con eje de frecuencia logarítmico.
function dibujarEspectros(cv, pSweep, pInv, fs, f1, f2) {
  const COL = paleta();
  const k = marco(cv, { aspecto: 0.4, min: 230, max: 330 }, [[COL.violeta, 'Sweep (−3 dB/octava)'], [COL.senal, 'Filtro inverso (+3 dB/octava)'], [COL.tinta, 'Producto: sweep × filtro inverso (plano)']]);
  const { g, W, H, m, tt } = k;
  const fmin = 20, fmax = Math.min(20000, fs / 2), dMax = 20, dMin = -20, N = pSweep.length * 2;
  const cols = Math.round(W - m.l - m.r);
  const xf = (f) => m.l + (Math.log10(f / fmin) / Math.log10(fmax / fmin)) * cols;
  const yd = (d) => m.t + ((dMax - Math.max(dMin, Math.min(dMax, d))) / (dMax - dMin)) * (H - m.t - m.b);
  g.strokeStyle = COL.grilla; g.fillStyle = COL.eje; g.font = `500 ${tt}px ${FUENTE}`; g.textAlign = 'center';
  for (const f of FRECS) if (f <= fmax) { g.beginPath(); g.moveTo(xf(f), m.t); g.lineTo(xf(f), H - m.b); g.stroke(); g.fillText(rotuloF(f), xf(f), H - m.b + tt + 3); }
  g.textAlign = 'right';
  for (let d = dMax; d >= dMin; d -= 10) { g.beginPath(); g.moveTo(m.l, yd(d)); g.lineTo(W - m.r, yd(d)); g.stroke(); g.fillText(`${d > 0 ? '+' : ''}${d}`, m.l - 5, yd(d) + 4); }
  g.textAlign = 'left';
  g.setLineDash([3, 4]); g.strokeStyle = COL.eje;                       // límites del barrido
  for (const f of [f1, f2]) if (f >= fmin && f <= fmax) { g.beginPath(); g.moveTo(xf(f), m.t); g.lineTo(xf(f), H - m.b); g.stroke(); }
  g.setLineDash([]);
  // Potencia promedio de los bins de cada columna (eje logarítmico: muchas más bins por columna en agudos).
  const porColumna = (p) => Float64Array.from({ length: cols }, (_, c) => {
    const fa = fmin * Math.pow(fmax / fmin, c / cols), fb = fmin * Math.pow(fmax / fmin, (c + 1) / cols);
    const a = Math.round((fa / fs) * N), b = Math.max(a + 1, Math.round((fb / fs) * N));
    let s = 0; for (let i = a; i < b; i++) s += p[Math.min(i, p.length - 1)];
    return 10 * Math.log10(s / (b - a) + 1e-30);
  });
  const ds = porColumna(pSweep), di = porColumna(pInv), dp = ds.map((v, c) => v + di[c]);
  const cRef = Math.min(cols - 1, Math.max(0, Math.round(xf(Math.sqrt(f1 * f2)) - m.l)));
  const curva = (d, color, ancho) => {
    const ref = d[cRef];
    g.strokeStyle = color; g.lineWidth = ancho; g.beginPath();
    for (let c = 0; c < cols; c++) { const y = yd(d[c] - ref); c ? g.lineTo(m.l + c, y) : g.moveTo(m.l + c, y); }
    g.stroke(); g.lineWidth = 1;
  };
  curva(ds, COL.violeta, 1.6); curva(di, COL.senal, 1.6); curva(dp, COL.tinta, 2.4);
  rotulos(k, 'Frecuencia (Hz, escala logarítmica)', 'Nivel (dB)');
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
    <canvas role="img" aria-label="Espectros del sweep, del filtro inverso y de su producto"></canvas>
    <canvas role="img" aria-label="Convolución del sweep con su filtro inverso: un impulso"></canvas>
    <p class="servicio-demo__dato" aria-live="polite"></p>
    <details class="servicio-demo__respuesta"><summary>Respuesta de la API (JSON)</summary><pre><code></code></pre></details>`;
  const [cvEsp, cvInv, cvSpec, cvImp] = el.querySelectorAll('canvas');
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
    par.pSweep = potencia(par.sweep); par.pInv = potencia(par.inverseFilter);
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
    dibujarEspectros(cvSpec, par.pSweep, par.pInv, fs, estado.f1, estado.f2);
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

// ── M2 · procesamiento ───────────────────────────────────────────────────────────────────────────
const fmt = (v, d = 1) => v.toFixed(d).replace('.', ',');
const rotuloBanda = (fc) => (fc >= 1000 ? `${fmt(fc / 1000, fc % 1000 ? 1 : 0)} kHz` : `${fmt(fc, fc % 1 ? 1 : 0)} Hz`);
const COLORES_BANDA = ['#f472b6', '#fb923c', '#fbbf24', '#a3e635', '#34d399', '#22d3ee', '#60a5fa', '#818cf8', '#c084fc', '#e879f9'];
const colorBanda = (fc) => COLORES_BANDA[Math.max(0, OCTAVAS.indexOf(Number(fc)))];

// Grilla de tiempo (s) y de nivel (dB); devuelve las funciones de escala.
function grillaTiempoDb(k, dur, dbMin, pasoDb = 10) {
  const { g, W, H, m, tt, COL } = k;
  const xt = (t) => m.l + (t / dur) * (W - m.l - m.r);
  const yd = (d) => m.t + (Math.max(dbMin, Math.min(0, d)) / dbMin) * (H - m.t - m.b);
  g.strokeStyle = COL.grilla; g.fillStyle = COL.eje; g.font = `500 ${tt}px ${FUENTE}`; g.textAlign = 'center';
  const paso = dur > 4 ? 1 : dur > 1.5 ? 0.5 : dur > 0.6 ? 0.2 : 0.1;
  for (let t = 0; t <= dur + 1e-9; t += paso) { g.beginPath(); g.moveTo(xt(t), m.t); g.lineTo(xt(t), H - m.b); g.stroke(); g.fillText(fmt(t, paso < 0.5 ? 1 : paso < 1 ? 1 : 0), xt(t), H - m.b + tt + 3); }
  g.textAlign = 'right';
  for (let d = 0; d >= dbMin; d -= pasoDb) { g.beginPath(); g.moveTo(m.l, yd(d)); g.lineTo(W - m.r, yd(d)); g.stroke(); g.fillText(`${d}`, m.l - 5, yd(d) + 4); }
  g.textAlign = 'left';
  return { xt, yd };
}
// Curva en dB dibujada por columnas: el máximo de cada columna (envolvente) o una muestra (curvas suaves).
function curvaDb(k, d, fs, dur, esc, color, { ancho = 1.4, envolvente = true, guiones = null } = {}) {
  const { g, W, m } = k, cols = Math.round(W - m.l - m.r), porCol = (dur * fs) / cols;
  g.strokeStyle = color; g.lineWidth = ancho; if (guiones) g.setLineDash(guiones); g.beginPath();
  let empezado = false;
  for (let c = 0; c < cols; c++) {
    const a = Math.floor(c * porCol); if (a >= d.length) break;
    let v = d[a];
    if (envolvente) for (let i = a + 1; i < Math.min(d.length, Math.floor((c + 1) * porCol)); i++) v = Math.max(v, d[i]);
    empezado ? g.lineTo(m.l + c, esc.yd(v)) : g.moveTo(m.l + c, esc.yd(v)); empezado = true;
  }
  g.stroke(); g.setLineDash([]); g.lineWidth = 1;
}
function botonEscuchar(b, obtener, fs) {
  const texto = b.textContent;
  b.addEventListener('click', () => {
    if (sonando) { detener(); if (b.dataset.sonando) return; }
    const x = obtener(); if (!x) return;
    b.dataset.sonando = '1'; b.textContent = 'Detener';
    reproducir(x, fs(), () => { delete b.dataset.sonando; b.textContent = texto; });
  });
}
const cabecera = (verbo, ruta, nota = 'Mismo modelo que la especificación, calculado en tu navegador.') =>
  `<div class="servicio-demo__cabecera"><span class="servicio-demo__verbo">${verbo}</span><code>${ruta}</code><span class="servicio-demo__nota">${nota}</span></div>`;

// Servicio 1 · load_audio: leer un WAV propio (o el de ejemplo) como lo haría el service.
function demoCargarAudio(el) {
  el.innerHTML = `
    ${cabecera('service', 'load_audio(path)', 'El archivo se lee en tu navegador: no se sube a ningún lado.')}
    <div class="servicio-demo__controles">
      <label class="servicio-demo__archivo">Elegí un WAV <input type="file" accept=".wav,audio/wav,audio/x-wav"></label>
      <button type="button" data-accion="ejemplo">Usar la grabación de ejemplo</button>
      <button type="button" data-accion="escuchar">Escuchar</button>
    </div>
    <canvas role="img" aria-label="Forma de onda del audio cargado, en mono"></canvas>
    <p class="servicio-demo__dato" aria-live="polite"></p>`;
  const [cv] = el.querySelectorAll('canvas'), dato = el.querySelector('.servicio-demo__dato');
  let r = null, nombre = '';
  function cargar(buffer, n) {
    nombre = n;
    try { r = leerWav(buffer); } catch (e) { r = null; dato.innerHTML = `<strong>ValueError</strong>: <code>${n}</code>: ${e.message}. Es lo que tiene que lanzar <code>load_audio</code> (y el router lo convierte en un 422).`; dibujar(); return; }
    const pico = r.signal.reduce((a, v) => Math.max(a, Math.abs(v)), 0);
    dato.innerHTML = `<code>signal, fs = load_audio("${n}")</code> → <strong>fs = ${r.fs} Hz</strong> (del encabezado) · ${r.canales === 1 ? 'mono' : `${r.canales} canales → <strong>mono</strong> (promedio)`} · ${r.flotante ? 'float' : 'PCM'} ${r.bits} bits → <strong>float64 en [−1, 1]</strong> · ${fmt(r.signal.length / r.fs, 2)} s (${r.signal.length} muestras) · pico ${fmt(pico, 2)}.`;
    dibujar();
  }
  function dibujar() {
    if (!r) { const k = marco(cv, { aspecto: 0.16, min: 110, max: 150 }); k.g.fillStyle = k.COL.tenue; k.g.font = `500 ${k.tt}px ${FUENTE}`; k.g.fillText('Sin audio cargado', k.m.l, k.H / 2); return; }
    dibujarOnda(cv, Float32Array.from(r.signal), r.fs, paleta().violeta, `${nombre} · mono · fs = ${r.fs} Hz`);
  }
  el.querySelector('input[type="file"]').addEventListener('change', async (e) => { const f = e.target.files[0]; if (f) cargar(await f.arrayBuffer(), f.name); });
  const ejemplo = async () => cargar(await (await fetch(new URL('../trabajo_practico/audio/m2/grabacion_recinto.wav', import.meta.url))).arrayBuffer(), 'grabacion_recinto.wav');
  el.querySelector('[data-accion="ejemplo"]').addEventListener('click', ejemplo);
  botonEscuchar(el.querySelector('[data-accion="escuchar"]'), () => r && Float32Array.from(r.signal), () => r.fs);
  alCambiarAncho(cv, dibujar);
  return { iniciar: ejemplo, redibujar: dibujar };
}

// Servicio 2 · filter_single_band: respuesta en frecuencia (una y dos pasadas) y el filtro aplicado a ruido rosa.
function demoFiltroOctava(el) {
  const estado = { fc: 1000, order: 4 };
  el.innerHTML = `
    ${cabecera('POST', '/api/v1/filters/single-band')}
    <div class="servicio-demo__controles">
      <div class="servicio-demo__grupo servicio-demo__bandas" role="group" aria-label="Banda de octava">${OCTAVAS.map((fc) => `<button type="button" data-fc="${fc}" aria-pressed="${fc === estado.fc}">${rotuloBanda(fc)}</button>`).join('')}</div>
      ${rango('order', 'order', 1, 8, 1, estado.order)}
      <button type="button" data-escuchar="entrada">Escuchar el ruido rosa</button>
      <button type="button" data-escuchar="salida">Escuchar la banda</button>
    </div>
    <canvas role="img" aria-label="Respuesta en frecuencia del filtro de octava con una y con dos pasadas"></canvas>
    <canvas role="img" aria-label="Espectro del ruido rosa antes y después del filtro"></canvas>
    <p class="servicio-demo__dato" aria-live="polite"></p>
    <details class="servicio-demo__respuesta"><summary>Pedido (multipart/form-data)</summary><pre><code></code></pre></details>`;
  const [cvH, cvP] = el.querySelectorAll('canvas');
  let fs = 0, x = null, y = null;
  function calcular() {
    fs = contexto().sampleRate;
    x ??= generatePinkNoise(3, fs, rngGauss(21));
    el.querySelectorAll('[data-fc]').forEach((b) => { b.disabled = !bandaValida(Number(b.dataset.fc), fs); });
    if (!bandaValida(estado.fc, fs)) estado.fc = 8000;
    y = filtrarOctava(x, fs, estado.fc, estado.order);
    const [f1, f2] = bordesOctava(estado.fc), g = (f) => 20 * Math.log10(gananciaOctava(f, estado.fc, fs, estado.order));
    el.querySelector('.servicio-demo__dato').innerHTML = `Bordes ${fmt(f1, 0)} y ${fmt(f2, 0)} Hz: <strong>${fmt(g(f1))} dB</strong> con una pasada y <strong>${fmt(2 * g(f1))} dB</strong> con <code>sosfiltfilt</code> (dos pasadas). A una octava de fc: ${fmt(2 * g(estado.fc / 2), 0)} y ${fmt(2 * g(2 * estado.fc), 0)} dB. El test pide 0 dB en fc, entre −2 y −7 dB en los bordes y menos de −20 dB a una octava.`;
    el.querySelector('pre code').textContent = `file=@ruido_rosa.wav\ncenter_freq=${estado.fc}\norder=${estado.order}`;
    dibujar();
  }
  function ejeFrec(k) {
    const { g, W, H, m, tt, COL } = k, fmin = 20, fmax = Math.min(20000, fs / 2);
    const xf = (f) => m.l + (Math.log10(f / fmin) / Math.log10(fmax / fmin)) * (W - m.l - m.r);
    g.strokeStyle = COL.grilla; g.fillStyle = COL.eje; g.font = `500 ${tt}px ${FUENTE}`; g.textAlign = 'center';
    for (const f of FRECS) if (f <= fmax) { g.beginPath(); g.moveTo(xf(f), m.t); g.lineTo(xf(f), H - m.b); g.stroke(); g.fillText(rotuloF(f), xf(f), H - m.b + tt + 3); }
    g.textAlign = 'left';
    return { xf, fmin, fmax };
  }
  function dibujar() {
    if (!y) return;
    const COL = paleta(), dbMin = -60;
    // Respuesta en frecuencia: el banco completo de fondo, la banda elegida con una y con dos pasadas.
    let k = marco(cvH, { aspecto: 0.4, min: 230, max: 330 }, [[COL.tenue, 'Una pasada (sosfilt): −3 dB en los bordes'], [COL.violeta, 'Dos pasadas (sosfiltfilt): −6 dB en los bordes'], [COL.grilla, 'Las otras bandas']]);
    const { xf, fmin, fmax } = ejeFrec(k), { g, W, H, m, tt } = k;
    const yd = (d) => m.t + (Math.max(dbMin, Math.min(0, d)) / dbMin) * (H - m.t - m.b);
    g.textAlign = 'right'; g.fillStyle = COL.eje; g.strokeStyle = COL.grilla;
    for (let d = 0; d >= dbMin; d -= 10) { g.beginPath(); g.moveTo(m.l, yd(d)); g.lineTo(W - m.r, yd(d)); g.stroke(); g.fillText(`${d}`, m.l - 5, yd(d) + 4); }
    g.textAlign = 'left';
    const cols = Math.round(W - m.l - m.r), fCol = (c) => fmin * Math.pow(fmax / fmin, c / cols);
    const curva = (fc, potencia, color, ancho, guiones) => {
      g.strokeStyle = color; g.lineWidth = ancho; g.setLineDash(guiones || []); g.beginPath();
      for (let c = 0; c <= cols; c++) { const d = potencia * 20 * Math.log10(gananciaOctava(fCol(c), fc, fs, estado.order) + 1e-12); c ? g.lineTo(m.l + c, yd(d)) : g.moveTo(m.l + c, yd(d)); }
      g.stroke(); g.setLineDash([]); g.lineWidth = 1;
    };
    for (const fc of OCTAVAS) if (fc !== estado.fc && bandaValida(fc, fs)) curva(fc, 2, COL.grilla, 1.2);
    g.setLineDash([3, 4]); g.strokeStyle = COL.eje;
    for (const f of bordesOctava(estado.fc)) { g.beginPath(); g.moveTo(xf(f), m.t); g.lineTo(xf(f), H - m.b); g.stroke(); }
    for (const d of [-3, -6]) { g.beginPath(); g.moveTo(m.l, yd(d)); g.lineTo(W - m.r, yd(d)); g.stroke(); }
    g.setLineDash([]);
    curva(estado.fc, 1, COL.tenue, 1.6, [6, 4]); curva(estado.fc, 2, COL.violeta, 2.2);
    g.font = `600 ${tt}px ${FUENTE}`; g.fillStyle = COL.eje;
    g.fillText('f_inf', xf(bordesOctava(estado.fc)[0]) + 3, H - m.b - 6); g.fillText('f_sup', xf(bordesOctava(estado.fc)[1]) + 3, H - m.b - 6);
    rotulos(k, 'Frecuencia (Hz, escala logarítmica)', 'Ganancia (dB)');
    // Espectro del ruido rosa antes y después.
    k = marco(cvP, { aspecto: 0.34, min: 200, max: 290 }, [[COL.senal, 'Ruido rosa (entrada)'], [COL.violeta, `filter_single_band(signal, fs, ${estado.fc}, order=${estado.order})`]]);
    const e2 = ejeFrec(k), yd2 = (d) => k.m.t + (Math.max(-80, Math.min(0, d)) / -80) * (k.H - k.m.t - k.m.b);
    k.g.textAlign = 'right'; k.g.fillStyle = COL.eje; k.g.strokeStyle = COL.grilla; k.g.font = `500 ${k.tt}px ${FUENTE}`;
    for (let d = 0; d >= -80; d -= 20) { k.g.beginPath(); k.g.moveTo(k.m.l, yd2(d)); k.g.lineTo(k.W - k.m.r, yd2(d)); k.g.stroke(); k.g.fillText(`${d}`, k.m.l - 5, yd2(d) + 4); }
    k.g.textAlign = 'left';
    // espectroPromedioDb normaliza cada espectro a su máximo: se le devuelve la escala absoluta por
    // Parseval (energía de la señal / suma del espectro normalizado), así entrada y salida se comparan.
    const absoluto = (e, s) => {
      let energia = 0; for (const v of s) energia += v * v;
      let suma = 0; for (const d of e.db) suma += Math.pow(10, d / 10);
      return 10 * Math.log10(energia / suma);
    };
    const ex = espectroPromedioDb(x, fs, 4096), ey = espectroPromedioDb(y, fs, 4096);
    const ox = absoluto(ex, x), oy = absoluto(ey, y);
    let ref = -Infinity; for (const v of ex.db) ref = Math.max(ref, v + ox);
    for (const [e, o, color] of [[ex, ox, COL.senal], [ey, oy, COL.violeta]]) {
      k.g.strokeStyle = color; k.g.lineWidth = 1.5; k.g.beginPath(); let emp = false;
      for (let i = 1; i < e.frecuencias.length; i++) { const f = e.frecuencias[i]; if (f < e2.fmin || f > e2.fmax) continue; const yy = yd2(e.db[i] + o - ref); emp ? k.g.lineTo(e2.xf(f), yy) : k.g.moveTo(e2.xf(f), yy); emp = true; }
      k.g.stroke();
    }
    rotulos(k, 'Frecuencia (Hz, escala logarítmica)', 'Nivel (dB)');
  }
  el.querySelectorAll('[data-fc]').forEach((b) => b.addEventListener('click', () => {
    estado.fc = Number(b.dataset.fc); el.querySelectorAll('[data-fc]').forEach((o) => o.setAttribute('aria-pressed', String(o === b))); calcular();
  }));
  const inp = el.querySelector('[data-p="order"]'), out = el.querySelector('[data-o="order"]');
  inp.addEventListener('input', () => { estado.order = Number(inp.value); out.textContent = estado.order; });
  inp.addEventListener('change', calcular); out.textContent = estado.order;
  el.querySelectorAll('[data-escuchar]').forEach((b) => botonEscuchar(b, () => (b.dataset.escuchar === 'entrada' ? x : y), () => fs));
  alCambiarAncho(cvH, dibujar);
  return { iniciar: calcular, redibujar: dibujar };
}

// Servicio 3 · generate_synthetic_ir: la RI, su caída por banda (Schroeder) y el T60 medido contra el pedido.
const SALAS = {
  seca: { nombre: 'Estudio seco', t60: { 125: 0.6, 250: 0.5, 500: 0.45, 1000: 0.4, 2000: 0.35, 4000: 0.3 } },
  aula: { nombre: 'Aula', t60: { 125: 1.4, 250: 1.2, 500: 1.0, 1000: 0.9, 2000: 0.8, 4000: 0.6 } },
  iglesia: { nombre: 'Iglesia', t60: { 125: 3.6, 250: 3.4, 500: 3.0, 1000: 2.6, 2000: 2.0, 4000: 1.4 } },
};
function demoRiSintetica(el) {
  const estado = { sala: 'aula' };
  el.innerHTML = `
    ${cabecera('POST', '/api/v1/signals/synthetic-ir')}
    <div class="servicio-demo__controles">
      <div class="servicio-demo__grupo" role="group" aria-label="T60 por banda">${Object.entries(SALAS).map(([c, s]) => `<button type="button" data-sala="${c}" aria-pressed="${c === estado.sala}">${s.nombre}</button>`).join('')}</div>
      <button type="button" data-accion="generar">Generar otra</button>
      <button type="button" data-accion="escuchar">Escuchar la RI</button>
    </div>
    <canvas role="img" aria-label="Respuesta al impulso sintética"></canvas>
    <canvas role="img" aria-label="Curvas de caída por banda (Schroeder) y la caída pedida"></canvas>
    <div class="servicio-demo__dato" aria-live="polite"></div>
    <details class="servicio-demo__respuesta"><summary>Pedido (JSON)</summary><pre><code></code></pre></details>`;
  const [cvOnda, cvCaida] = el.querySelectorAll('canvas');
  let fs = 0, h = null, curvas = [], dur = 0, semilla = 5;
  function generar() {
    fs = contexto().sampleRate;
    const { t60 } = SALAS[estado.sala];
    dur = Math.ceil(Math.max(...Object.values(t60)) * 1.3 * 2) / 2;
    h = generateSyntheticIr(dur, t60, fs, rngGauss(semilla++));
    curvas = Object.entries(t60).map(([fc, objetivo]) => {
      const banda = filtrarOctava(h, fs, Number(fc));
      return { fc: Number(fc), objetivo, medido: t60Schroeder(banda, fs), edc: edcDb(banda) };
    });
    const filas = curvas.map((c) => {
      const d = c.medido ? (100 * (c.medido - c.objetivo)) / c.objetivo : NaN;
      return `<tr><td>${rotuloBanda(c.fc)}</td><td>${fmt(c.objetivo, 2)} s</td><td>${c.medido ? fmt(c.medido, 2) : '—'} s</td><td>${Number.isNaN(d) ? '—' : `${Math.round(d) === 0 ? '' : d > 0 ? '+' : '−'}${fmt(Math.abs(d), 0)} %${Math.abs(d) <= 10 ? ' ✓' : ''}`}</td></tr>`;
    }).join('');
    el.querySelector('.servicio-demo__dato').innerHTML = `<table class="servicio-demo__tabla"><thead><tr><th>Banda</th><th>T60 pedido</th><th>T60 medido (T20, Schroeder)</th><th>Diferencia</th></tr></thead><tbody>${filas}</tbody></table><p>Es lo que hace <code>test_synthetic_ir_decay</code>: filtra la RI en la banda, calcula la curva de Schroeder y mide la pendiente entre −5 y −25 dB (✓: dentro del 10 %). Generá otra varias veces: la RI es ruido, y el T60 medido varía. Varía más en los graves y con T60 cortos, donde entran pocas oscilaciones en ese tramo. Por eso el test mide en 1 kHz con T60 = 2 s.</p>`;
    el.querySelector('pre code').textContent = json({ duration: dur, t60_values: Object.fromEntries(Object.entries(t60).map(([k, v]) => [String(k), v])), sample_rate: fs });
    dibujar();
  }
  function dibujar() {
    if (!h) return;
    const COL = paleta();
    dibujarOnda(cvOnda, h, fs, COL.violeta, `generate_synthetic_ir(${dur}, t60_values, ${fs})`);
    const k = marco(cvCaida, { aspecto: 0.42, min: 240, max: 340 }, curvas.map((c) => [colorBanda(c.fc), rotuloBanda(c.fc)]).concat([[COL.eje, 'Caída pedida (−60 dB en T60)']]));
    const esc = grillaTiempoDb(k, dur, -70);
    for (const c of curvas) {
      k.g.setLineDash([4, 4]); k.g.strokeStyle = colorBanda(c.fc); k.g.globalAlpha = 0.6; k.g.beginPath();
      k.g.moveTo(esc.xt(0), esc.yd(0)); k.g.lineTo(esc.xt(Math.min(dur, (c.objetivo * 70) / 60)), esc.yd((-60 * Math.min(dur, (c.objetivo * 70) / 60)) / c.objetivo)); k.g.stroke();
      k.g.setLineDash([]); k.g.globalAlpha = 1;
      curvaDb(k, c.edc, fs, dur, esc, colorBanda(c.fc), { ancho: 1.8, envolvente: false });
    }
    rotulos(k, 'Tiempo (s)', 'Energía restante (dB)');
  }
  el.querySelectorAll('[data-sala]').forEach((b) => b.addEventListener('click', () => {
    estado.sala = b.dataset.sala; el.querySelectorAll('[data-sala]').forEach((o) => o.setAttribute('aria-pressed', String(o === b))); generar();
  }));
  el.querySelector('[data-accion="generar"]').addEventListener('click', generar);
  botonEscuchar(el.querySelector('[data-accion="escuchar"]'), () => h, () => fs);
  alCambiarAncho(cvCaida, dibujar);
  return { iniciar: generar, redibujar: dibujar };
}

// Servicio 4 · get_impulse_response: sala simulada, grabación con ruido de fondo y RI recuperada.
function demoRespuestaImpulso(el) {
  const estado = { t60: 0.8, duration: 2, ruido: -60 };
  el.innerHTML = `
    ${cabecera('service', 'get_impulse_response(recording, inverse_filter)')}
    <div class="servicio-demo__controles">
      ${rango('t60', 'T60 de la sala', 0.2, 2.5, 0.1, estado.t60)}
      ${rango('duration', 'duración del sweep', 1, 5, 0.5, estado.duration)}
      ${rango('ruido', 'ruido de fondo', -90, -20, 5, estado.ruido)}
      <button type="button" data-escuchar="sweep">Escuchar el sweep</button>
      <button type="button" data-escuchar="grabacion">Escuchar la grabación</button>
      <button type="button" data-escuchar="ri">Escuchar la RI recuperada</button>
    </div>
    <canvas role="img" aria-label="Grabación simulada del sweep en la sala"></canvas>
    <canvas role="img" aria-label="RI original y RI recuperada por deconvolución, en dB"></canvas>
    <p class="servicio-demo__dato" aria-live="polite"></p>`;
  const [cvRec, cvRi] = el.querySelectorAll('canvas');
  let fs = 0, par = null, h = null, rec = null, ri = null, durRi = 0;
  function calcular() {
    fs = contexto().sampleRate;
    durRi = Math.min(3, estado.t60 * 1.2 + 0.1);
    h = riSintetica({ fs, t60: estado.t60, duracion: durRi, rng: (() => { const r = rngGauss(17); return () => 0.3 * r(); })() });
    par = generateSineSweepPair(estado.duration, 20, Math.min(20000, fs / 2 - 1000), fs);
    const r = rngGauss(29), seco = convolucionFFT(par.sweep, h);
    let pico = 0; for (const v of seco) pico = Math.max(pico, Math.abs(v));
    const a = pico * Math.pow(10, estado.ruido / 20);
    rec = Float32Array.from(seco, (v) => v + a * r());
    let m = 0; for (const v of rec) m = Math.max(m, Math.abs(v));
    for (let i = 0; i < rec.length; i++) rec[i] = (rec[i] / m) * 0.9;
    ri = getImpulseResponse(rec, par.inverseFilter, fs).subarray(0, h.length);
    const c = correlacionAlineada(ri, h);
    el.querySelector('.servicio-demo__dato').innerHTML = `Correlación entre la RI recuperada y la de la sala: <strong>${fmt(c, 3)}</strong> (el test pide más de 0,9). Subí el ruido de fondo o acortá el sweep: el piso de la RI recuperada sube. Cada vez que se duplica la duración del sweep, el piso baja unos 3 dB.`;
    dibujar();
  }
  function dibujar() {
    if (!ri) return;
    const COL = paleta();
    dibujarOnda(cvRec, rec, fs, COL.senal, 'recording: el sweep, sonando en la sala (y = x ∗ h + ruido)');
    const k = marco(cvRi, { aspecto: 0.38, min: 220, max: 320 }, [[COL.eje, 'RI de la sala, h (la que no conocemos)'], [COL.violeta, 'get_impulse_response(recording, inverse_filter)']]);
    const esc = grillaTiempoDb(k, durRi, -100, 20);
    curvaDb(k, logarithmicScaleConversion(h, -100), fs, durRi, esc, COL.eje, { ancho: 1.4 });
    curvaDb(k, logarithmicScaleConversion(ri, -100), fs, durRi, esc, COL.violeta, { ancho: 1.2 });
    rotulos(k, 'Tiempo desde el pico (s)', 'Nivel (dB)');
  }
  for (const c of ['t60', 'duration', 'ruido']) {
    const inp = el.querySelector(`[data-p="${c}"]`), out = el.querySelector(`[data-o="${c}"]`);
    const mostrar = () => { out.textContent = c === 'ruido' ? `${estado[c]} dB` : `${fmt(estado[c])} s`; };
    inp.addEventListener('input', () => { estado[c] = Number(inp.value); mostrar(); });
    inp.addEventListener('change', calcular); mostrar();
  }
  el.querySelectorAll('[data-escuchar]').forEach((b) => botonEscuchar(b, () => ({ sweep: par?.sweep, grabacion: rec, ri })[b.dataset.escuchar], () => fs));
  alCambiarAncho(cvRi, dibujar);
  return { iniciar: calcular, redibujar: dibujar };
}

// Servicio 5 · logarithmic_scale_conversion: la misma RI en lineal y en dB.
function demoEscalaLog(el) {
  const estado = { piso: -120 };
  el.innerHTML = `
    ${cabecera('service', 'logarithmic_scale_conversion(signal)')}
    <div class="servicio-demo__controles">
      ${rango('piso', 'piso (opcional)', -140, -40, 10, estado.piso)}
      <button type="button" data-accion="nueva">Otra RI</button>
    </div>
    <canvas role="img" aria-label="Respuesta al impulso en escala lineal"></canvas>
    <canvas role="img" aria-label="La misma respuesta al impulso en dB"></canvas>
    <p class="servicio-demo__dato" aria-live="polite"></p>`;
  const [cvLin, cvDb] = el.querySelectorAll('canvas');
  let fs = 0, h = null, semilla = 3;
  const dur = 1.6, t60 = 1, pisoRuido = -75;
  function nueva() {
    fs = contexto().sampleRate;
    const r = rngGauss(semilla++);
    h = riConRuido({ fs, t60, duracion: dur, pisoDb: pisoRuido, rng: () => 0.5 * r() });
    let pico = 0; for (const v of h) pico = Math.max(pico, Math.abs(v));
    let i1 = 0; for (let i = 0; i < h.length; i++) if (Math.abs(h[i]) > 0.01 * pico) i1 = i;
    el.querySelector('.servicio-demo__dato').innerHTML = `En lineal, después de los ${fmt((i1 / fs) * 1000, 0)} ms la RI ya está por debajo del 1 % del pico: parece que no pasa nada. En dB se ve la caída como una <strong>recta</strong> (−60 dB en T60 = ${fmt(t60)} s) hasta el ruido de fondo, cerca de ${pisoRuido} dB.`;
    dibujar();
  }
  function dibujar() {
    if (!h) return;
    const COL = paleta();
    dibujarOnda(cvLin, h, fs, COL.senal, 'signal (lineal)');
    const k = marco(cvDb, { aspecto: 0.34, min: 200, max: 290 }, [[COL.violeta, `logarithmic_scale_conversion(signal) · piso ${estado.piso} dB`], [COL.eje, 'Caída de 60 dB en T60']]);
    const dbMin = Math.min(-80, estado.piso - 10), esc = grillaTiempoDb(k, dur, dbMin, 20);
    curvaDb(k, logarithmicScaleConversion(h, estado.piso), fs, dur, esc, COL.violeta, { ancho: 1.1 });
    k.g.setLineDash([5, 4]); k.g.strokeStyle = COL.eje; k.g.lineWidth = 1.5; k.g.beginPath(); k.g.moveTo(esc.xt(0), esc.yd(0)); k.g.lineTo(esc.xt(t60), esc.yd(-60)); k.g.stroke(); k.g.setLineDash([]); k.g.lineWidth = 1;
    rotulos(k, 'Tiempo (s)', 'Nivel (dB)');
  }
  const inp = el.querySelector('[data-p="piso"]'), out = el.querySelector('[data-o="piso"]');
  inp.addEventListener('input', () => { estado.piso = Number(inp.value); out.textContent = `${estado.piso} dB`; dibujar(); });
  out.textContent = `${estado.piso} dB`;
  el.querySelector('[data-accion="nueva"]').addEventListener('click', nueva);
  alCambiarAncho(cvDb, dibujar);
  return { iniciar: nueva, redibujar: dibujar };
}

// ── M3 · análisis ────────────────────────────────────────────────────────────────────────────────
// RI de una sala de ejemplo con ruido de fondo (dB respecto del pico): la base de las demos de M3.
function riDeSala(sala, fs, semilla, ruidoDb = -80) {
  const { t60 } = SALAS[sala];
  const dur = Math.ceil(Math.max(...Object.values(t60)) * 1.3 * 2) / 2;
  const h = generateSyntheticIr(dur, t60, fs, rngGauss(semilla));
  const r = rngGauss(semilla + 101), a = Math.pow(10, ruidoDb / 20) * 0.3;
  for (let i = 0; i < h.length; i++) h[i] += a * r();
  return { h, dur };
}
const aDb = (x) => logarithmicScaleConversion(x, -140);
function botonesBanda(bandas, actual) {
  return `<div class="servicio-demo__grupo" role="group" aria-label="Banda de octava">${bandas.map((fc) => `<button type="button" data-fc="${fc}" aria-pressed="${fc === actual}">${rotuloBanda(fc)}</button>`).join('')}</div>`;
}
function enlazarBandas(el, estado, alCambiar) {
  el.querySelectorAll('[data-fc]').forEach((b) => b.addEventListener('click', () => {
    estado.fc = Number(b.dataset.fc); el.querySelectorAll('[data-fc]').forEach((o) => o.setAttribute('aria-pressed', String(o === b))); alCambiar();
  }));
}

// Servicio 1 · apply_smoothing: la RI de una banda en dB, cruda, con Hilbert y con media móvil.
function demoSuavizado(el) {
  const estado = { fc: 1000, window: 10 };
  el.innerHTML = `
    ${cabecera('service', 'apply_smoothing(signal, fs, method, window_ms)')}
    <div class="servicio-demo__controles">
      ${botonesBanda([125, 1000, 4000], estado.fc)}
      ${rango('window', 'window_ms (media móvil)', 1, 50, 1, estado.window)}
    </div>
    <canvas role="img" aria-label="RI de una banda en dB: cruda, envolvente de Hilbert y media móvil"></canvas>
    <p class="servicio-demo__dato" aria-live="polite"></p>`;
  const [cv] = el.querySelectorAll('canvas');
  let fs = 0, base = null, banda = null, hil = null, mm = null;
  const dur = 1.2;
  function calcular() {
    fs = contexto().sampleRate;
    base ??= riDeSala('aula', fs, 7).h;
    banda = filtrarOctava(base, fs, estado.fc);
    hil = applySmoothing(banda, fs, 'hilbert');
    suavizar();
  }
  function suavizar() {
    mm = applySmoothing(banda, fs, 'moving_average', estado.window);
    el.querySelector('.servicio-demo__dato').innerHTML = `La señal cruda (franja gris) oscila entre picos y ceros, que en dB se van muy abajo: así no se ve cómo cae. La envolvente de Hilbert sigue la amplitud instante a instante, sin elegir nada; como la RI de una sala es ruido, la envolvente también fluctúa. La media móvil de ${estado.window} ms promedia esas fluctuaciones y queda más lisa, pero con ventanas largas redondea el comienzo de la caída (probá 50 ms).`;
    dibujar();
  }
  function dibujar() {
    if (!mm) return;
    const COL = paleta();
    const k = marco(cv, { aspecto: 0.4, min: 250, max: 340 }, [[COL.tenue, `RI filtrada en ${rotuloBanda(estado.fc)} (|h|, de cada pico a cada cero)`], [COL.violeta, 'method="hilbert"'], [COL.senal, `method="moving_average", window_ms=${estado.window}`]]);
    const esc = grillaTiempoDb(k, dur, -80, 20);
    // La señal cruda como franja: de su mínimo a su máximo en cada columna.
    const crudo = aDb(banda), cols = Math.round(k.W - k.m.l - k.m.r), porCol = (dur * fs) / cols;
    k.g.fillStyle = COL.tenue; k.g.globalAlpha = 0.45;
    for (let c = 0; c < cols; c++) {
      let mn = Infinity, mx = -Infinity;
      for (let i = Math.floor(c * porCol); i < Math.floor((c + 1) * porCol) && i < crudo.length; i++) { mn = Math.min(mn, crudo[i]); mx = Math.max(mx, crudo[i]); }
      if (mx > -Infinity) k.g.fillRect(k.m.l + c, esc.yd(mx), 1, Math.max(1, esc.yd(mn) - esc.yd(mx)));
    }
    k.g.globalAlpha = 1;
    curvaDb(k, aDb(hil), fs, dur, esc, COL.violeta, { ancho: 1.6, envolvente: false });
    curvaDb(k, aDb(mm), fs, dur, esc, COL.senal, { ancho: 2, envolvente: false });
    rotulos(k, 'Tiempo (s)', 'Nivel (dB, 20·log10)');
  }
  enlazarBandas(el, estado, calcular);
  const inp = el.querySelector('[data-p="window"]'), out = el.querySelector('[data-o="window"]');
  inp.addEventListener('input', () => { estado.window = Number(inp.value); out.textContent = `${estado.window} ms`; suavizar(); });
  out.textContent = `${estado.window} ms`;
  alCambiarAncho(cv, dibujar);
  return { iniciar: calcular, redibujar: dibujar };
}

// Servicio 2 · apply_schroeder_integral: la curva de caída, con y sin truncar en el ruido de fondo.
function demoSchroeder(el) {
  const estado = { t60: 1, ruido: -45 };   // con este ruido la curva completa ya se dobla antes de −35 dB
  el.innerHTML = `
    ${cabecera('service', 'apply_schroeder_integral(ir)')}
    <div class="servicio-demo__controles">
      ${rango('t60', 'T60 de la sala', 0.3, 2.5, 0.1, estado.t60)}
      ${rango('ruido', 'ruido de fondo', -90, -30, 5, estado.ruido)}
    </div>
    <canvas role="img" aria-label="Energía de la RI en dB y curvas de Schroeder completa y truncada"></canvas>
    <p class="servicio-demo__dato" aria-live="polite"></p>`;
  const [cv] = el.querySelectorAll('canvas');
  let fs = 0, h = null, completa = null, truncada = null, corte = 0, dur = 0;
  function calcular() {
    fs = contexto().sampleRate;
    dur = Math.max(1.5, 2 * estado.t60);
    const r = rngGauss(13);
    h = riConRuido({ fs, t60: estado.t60, duracion: dur, pisoDb: estado.ruido, rng: () => 0.3 * r() });
    completa = edcDb(h);
    corte = puntoDeCorte(h, fs);
    truncada = edcDb(h.subarray(0, corte));
    const t30 = (edc) => tramoYRecta(edc, fs, -5, -35)?.tr;
    const [a, b] = [t30(completa), t30(truncada)];
    const txt = (v) => (v ? `<strong>${fmt(v, 2)} s</strong>` : '<strong>—</strong> (no llega a −35 dB)');
    el.querySelector('.servicio-demo__dato').innerHTML = `T30 con la curva completa: ${txt(a)} · truncada en el cruce con el ruido (${fmt(corte / fs, 2)} s): ${txt(b)} · T60 de la sala: <strong>${fmt(estado.t60, 1)} s</strong>. Sin truncar, el ruido del final suma energía que la sala no tiene: la curva se "dobla" hacia arriba y después cae a pique, y el T30 sale mal. Bajá el ruido de fondo a −80 dB: con suficiente rango dinámico, las dos curvas coinciden.`;
    dibujar();
  }
  function dibujar() {
    if (!h) return;
    const COL = paleta();
    const k = marco(cv, { aspecto: 0.42, min: 260, max: 350 }, [[COL.grilla, 'energía h²(t) (dB)'], [COL.violeta, 'Schroeder sobre toda la RI'], [COL.senal, 'Schroeder truncada en el cruce con el ruido'], [COL.eje, 'caída real: −60 dB en T60']]);
    const esc = grillaTiempoDb(k, dur, -100, 20);
    curvaDb(k, aDb(h), fs, dur, esc, COL.grilla, { ancho: 1 });
    k.g.setLineDash([5, 4]); k.g.strokeStyle = COL.eje; k.g.lineWidth = 1.5; k.g.beginPath(); k.g.moveTo(esc.xt(0), esc.yd(0)); k.g.lineTo(esc.xt(Math.min(dur, (100 / 60) * estado.t60)), esc.yd(-100 * Math.min(1, (dur * 60) / (100 * estado.t60)))); k.g.stroke(); k.g.setLineDash([]); k.g.lineWidth = 1;
    curvaDb(k, completa, fs, dur, esc, COL.violeta, { ancho: 2.2, envolvente: false });
    curvaDb(k, truncada, fs, dur, esc, COL.senal, { ancho: 2.2, envolvente: false, guiones: [7, 4] });
    k.g.setLineDash([3, 4]); k.g.strokeStyle = COL.tinta; k.g.beginPath(); k.g.moveTo(esc.xt(corte / fs), k.m.t); k.g.lineTo(esc.xt(corte / fs), k.H - k.m.b); k.g.stroke(); k.g.setLineDash([]);
    k.g.font = `600 ${k.tt}px ${FUENTE}`; k.g.fillStyle = COL.tinta; k.g.fillText('cruce con el ruido', esc.xt(corte / fs) + 5, k.m.t + 14);
    rotulos(k, 'Tiempo (s)', 'Nivel (dB)');
  }
  for (const c of ['t60', 'ruido']) {
    const inp = el.querySelector(`[data-p="${c}"]`), out = el.querySelector(`[data-o="${c}"]`);
    const mostrar = () => { out.textContent = c === 'ruido' ? `${estado[c]} dB` : `${fmt(estado[c])} s`; };
    inp.addEventListener('input', () => { estado[c] = Number(inp.value); mostrar(); });
    inp.addEventListener('change', calcular); mostrar();
  }
  alCambiarAncho(cv, dibujar);
  return { iniciar: calcular, redibujar: dibujar };
}

// Servicio 3 · linear_regression: la recta de cada tramo sobre la curva de Schroeder y su extrapolación.
const TRAMOS = { EDT: [0, -10], T10: [-5, -15], T20: [-5, -25], T30: [-5, -35] };
function demoRegresion(el) {
  const estado = { tramo: 'T30' };
  el.innerHTML = `
    ${cabecera('service', 'linear_regression(x, y)')}
    <div class="servicio-demo__controles">
      <div class="servicio-demo__grupo" role="group" aria-label="Parámetro">${Object.keys(TRAMOS).map((t) => `<button type="button" data-tramo="${t}" aria-pressed="${t === estado.tramo}">${t}</button>`).join('')}</div>
    </div>
    <canvas role="img" aria-label="Curva de Schroeder con la recta de regresión del tramo elegido extrapolada a −60 dB"></canvas>
    <p class="servicio-demo__dato" aria-live="polite"></p>
    <details class="servicio-demo__respuesta"><summary>Lo que devuelve (Python)</summary><pre><code></code></pre></details>`;
  const [cv] = el.querySelectorAll('canvas');
  let fs = 0, edc = null, r = null;
  const dur = 1.6;
  function calcular() {
    fs = contexto().sampleRate;
    if (!edc) edc = edcDb(filtrarOctava(riDeSala('aula', fs, 21).h, fs, 1000));
    const [desde, hasta] = TRAMOS[estado.tramo];
    r = tramoYRecta(edc, fs, desde, hasta);
    el.querySelector('.servicio-demo__dato').innerHTML = r
      ? `Tramo de ${desde} a ${hasta} dB · pendiente <strong>m = ${fmt(r.slope, 1)} dB/s</strong> · <strong>R² = ${fmt(r.r2, 4)}</strong> · ${estado.tramo} = −60 / m = <strong>${fmt(r.tr, 2)} s</strong>. La recta se mide en un tramo corto y se <em>extrapola</em> hasta −60 dB: nunca se mide una caída de 60 dB entera.`
      : 'La curva no llega al final del tramo.';
    el.querySelector('pre code').textContent = r ? `slope, intercept, r2 = linear_regression(t[tramo], edc[tramo])\n# slope = ${r.slope.toFixed(2)}   intercept = ${r.intercept.toFixed(2)}   r2 = ${r.r2.toFixed(4)}\n${estado.tramo.padEnd(3)} = -60 / slope = ${r.tr.toFixed(3)} s` : '';
    dibujar();
  }
  function dibujar() {
    if (!edc) return;
    const COL = paleta();
    const k = marco(cv, { aspecto: 0.42, min: 260, max: 350 }, [[COL.violeta, 'Schroeder (banda de 1 kHz)'], [COL.senal, `tramo de ${estado.tramo}`], [COL.tinta, 'recta extrapolada a −60 dB']]);
    const esc = grillaTiempoDb(k, dur, -70, 10);
    curvaDb(k, edc, fs, dur, esc, COL.violeta, { ancho: 1.6, envolvente: false });
    if (!r) return;
    const { g } = k;
    g.strokeStyle = COL.grilla; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(k.m.l, esc.yd(-60)); g.lineTo(k.W - k.m.r, esc.yd(-60)); g.stroke(); g.setLineDash([]);
    g.strokeStyle = COL.senal; g.lineWidth = 6; g.globalAlpha = 0.7; g.beginPath(); g.moveTo(esc.xt(r.t0), esc.yd(r.slope * r.t0 + r.intercept)); g.lineTo(esc.xt(r.t1), esc.yd(r.slope * r.t1 + r.intercept)); g.stroke(); g.globalAlpha = 1; g.lineWidth = 1;
    const t60 = (-60 - r.intercept) / r.slope;
    g.strokeStyle = COL.tinta; g.lineWidth = 1.6; g.setLineDash([6, 4]); g.beginPath(); g.moveTo(esc.xt(0), esc.yd(r.intercept)); g.lineTo(esc.xt(Math.min(dur, t60)), esc.yd(r.slope * Math.min(dur, t60) + r.intercept)); g.stroke(); g.setLineDash([]); g.lineWidth = 1;
    if (t60 <= dur) {
      g.fillStyle = COL.tinta; g.beginPath(); g.arc(esc.xt(t60), esc.yd(-60), 5, 0, 2 * Math.PI); g.fill();
      g.font = `600 ${k.tt}px ${FUENTE}`; g.textAlign = 'center'; g.fillText(`−60 dB en ${fmt(t60, 2)} s`, esc.xt(t60), esc.yd(-60) - 10); g.textAlign = 'left';
    }
    rotulos(k, 'Tiempo (s)', 'Nivel (dB)');
  }
  el.querySelectorAll('[data-tramo]').forEach((b) => b.addEventListener('click', () => {
    estado.tramo = b.dataset.tramo; el.querySelectorAll('[data-tramo]').forEach((o) => o.setAttribute('aria-pressed', String(o === b))); calcular();
  }));
  alCambiarAncho(cv, dibujar);
  return { iniciar: calcular, redibujar: dibujar };
}

// Servicio 4 · calculate_parameters_from_ir: EDT/T20/T30 por banda, D50 y C80, y la respuesta JSON.
function demoParametros(el) {
  const estado = { sala: 'aula', fc: 1000 };
  el.innerHTML = `
    ${cabecera('POST', '/api/v1/acoustics/parameters')}
    <div class="servicio-demo__controles">
      <div class="servicio-demo__grupo" role="group" aria-label="Sala">${Object.entries(SALAS).map(([c, s]) => `<button type="button" data-sala="${c}" aria-pressed="${c === estado.sala}">${s.nombre}</button>`).join('')}</div>
      <button type="button" data-accion="generar">Generar otra</button>
      <button type="button" data-accion="escuchar">Escuchar la RI</button>
    </div>
    <canvas role="img" aria-label="EDT, T20 y T30 por banda de octava junto con el T60 de la sala"></canvas>
    <div class="servicio-demo__controles">${botonesBanda(BANDAS_M3, estado.fc)}</div>
    <canvas role="img" aria-label="Energía de la RI de una banda en dB con los primeros 50 y 80 ms marcados"></canvas>
    <div class="servicio-demo__dato" aria-live="polite"></div>
    <details class="servicio-demo__respuesta"><summary>Respuesta de la API (JSON)</summary><pre><code></code></pre></details>`;
  const [cvT, cvE] = el.querySelectorAll('canvas');
  let fs = 0, h = null, dur = 0, p = null, semilla = 31;
  function calcular() {
    fs = contexto().sampleRate;
    ({ h, dur } = riDeSala(estado.sala, fs, semilla++));
    p = calculateParametersFromIr(h, fs);
    const filas = BANDAS_M3.map((fc) => `<tr><td>${rotuloBanda(fc)}</td><td>${fmt(SALAS[estado.sala].t60[fc], 2)}</td>${['EDT', 'T20', 'T30'].map((c) => `<td>${p[c][fc] ? fmt(p[c][fc], 2) : '—'}</td>`).join('')}<td>${fmt(p.D50[fc], 0)} %</td><td>${fmt(p.C80[fc], 1)} dB</td></tr>`).join('');
    el.querySelector('.servicio-demo__dato').innerHTML = `<table class="servicio-demo__tabla"><thead><tr><th>Banda</th><th>T60 de la sala (s)</th><th>EDT (s)</th><th>T20 (s)</th><th>T30 (s)</th><th>D50</th><th>C80</th></tr></thead><tbody>${filas}</tbody></table><p>En una RI sintética la caída de cada banda es una sola exponencial: T20 y T30 quedan cerca del T60 pedido. El EDT usa solo los primeros 10 dB, y como la RI es ruido varía más de una RI a otra (probá <em>Generar otra</em>). En una sala real los tres se separan por la acústica, no por azar, y esa diferencia es información (ver <em>El output final</em>).</p>`;
    // Como lo serializa FastAPI: claves de float como texto ("125.0") y null para lo que no se pudo calcular.
    const r2 = (o) => Object.fromEntries(Object.entries(o).map(([fc, v]) => [Number(fc).toFixed(1), v === null ? null : Math.round(v * 100) / 100]));
    const texto = json({ sample_rate: fs, duration: Math.round(dur * 100) / 100, center_frequencies: BANDAS_M3.map((f) => f.toFixed(1)), parameters: { EDT: r2(p.EDT), T10: r2(p.T10), T20: r2(p.T20), T30: r2(p.T30), D50: r2(p.D50), C80: r2(p.C80) } });
    el.querySelector('pre code').textContent = texto.replace(/"center_frequencies": \[[^\]]*\]/, (s) => s.replace(/"/g, '').replace('center_frequencies:', '"center_frequencies":'));
    dibujar();
  }
  function dibujar() {
    if (!p) return;
    const COL = paleta();
    // Tiempos por banda (una sola unidad: segundos).
    let k = marco(cvT, { aspecto: 0.36, min: 230, max: 320 }, [[COL.violeta, 'EDT'], [COL.senal, 'T20'], [COL.tinta, 'T30'], [COL.eje, 'T60 de la sala']]);
    const { g, W, H, m, tt } = k, n = BANDAS_M3.length;
    const tMax = Math.ceil(Math.max(...Object.values(SALAS[estado.sala].t60)) * 1.25 * 2) / 2;
    const xb = (i) => m.l + ((i + 0.5) / n) * (W - m.l - m.r), ys = (v) => H - m.b - (v / tMax) * (H - m.t - m.b);
    g.strokeStyle = COL.grilla; g.fillStyle = COL.eje; g.font = `500 ${tt}px ${FUENTE}`; g.textAlign = 'right';
    const paso = tMax > 3 ? 1 : 0.5;
    for (let v = 0; v <= tMax + 1e-9; v += paso) { g.beginPath(); g.moveTo(m.l, ys(v)); g.lineTo(W - m.r, ys(v)); g.stroke(); g.fillText(fmt(v, 1), m.l - 5, ys(v) + 4); }
    g.textAlign = 'center'; BANDAS_M3.forEach((fc, i) => g.fillText(rotuloBanda(fc), xb(i), H - m.b + tt + 3)); g.textAlign = 'left';
    const serie = (valores, color, ancho, guiones) => {
      g.strokeStyle = color; g.fillStyle = color; g.lineWidth = ancho; g.setLineDash(guiones || []); g.beginPath();
      let emp = false; BANDAS_M3.forEach((fc, i) => { const v = valores[fc]; if (v == null) { emp = false; return; } emp ? g.lineTo(xb(i), ys(v)) : g.moveTo(xb(i), ys(v)); emp = true; });
      g.stroke(); g.setLineDash([]); g.lineWidth = 1;
      if (!guiones) BANDAS_M3.forEach((fc, i) => { const v = valores[fc]; if (v != null) { g.beginPath(); g.arc(xb(i), ys(v), 4.5, 0, 2 * Math.PI); g.fill(); } });
    };
    serie(SALAS[estado.sala].t60, COL.eje, 1.5, [5, 4]);
    serie(p.EDT, COL.violeta, 2); serie(p.T20, COL.senal, 2); serie(p.T30, COL.tinta, 2);
    rotulos(k, 'Banda de octava', 'Tiempo (s)');
    // Energía de una banda con los primeros 50 y 80 ms marcados.
    const banda = filtrarOctava(h, fs, estado.fc);
    k = marco(cvE, { aspecto: 0.3, min: 200, max: 280 }, [[COL.violeta, `h²(t) en ${rotuloBanda(estado.fc)} (dB)`], [COL.senal, 'primeros 50 ms (D50)'], [COL.tinta, 'primeros 80 ms (C80)']]);
    const durE = 0.4, esc = grillaTiempoDb(k, durE, -60, 20);
    k.g.fillStyle = COL.senal; k.g.globalAlpha = 0.18; k.g.fillRect(esc.xt(0), k.m.t, esc.xt(0.05) - esc.xt(0), k.H - k.m.t - k.m.b);
    k.g.fillStyle = COL.tinta; k.g.globalAlpha = 0.08; k.g.fillRect(esc.xt(0), k.m.t, esc.xt(0.08) - esc.xt(0), k.H - k.m.t - k.m.b); k.g.globalAlpha = 1;
    for (const [t, c] of [[0.05, COL.senal], [0.08, COL.tinta]]) { k.g.strokeStyle = c; k.g.setLineDash([4, 3]); k.g.beginPath(); k.g.moveTo(esc.xt(t), k.m.t); k.g.lineTo(esc.xt(t), k.H - k.m.b); k.g.stroke(); k.g.setLineDash([]); }
    curvaDb(k, aDb(banda), fs, durE, esc, COL.violeta, { ancho: 1.2 });
    k.g.font = `600 ${k.tt}px ${FUENTE}`; k.g.fillStyle = COL.tinta;
    k.g.fillText(`D50 = ${fmt(d50(banda, fs), 0)} % · C80 = ${fmt(c80(banda, fs), 1)} dB`, esc.xt(0.1), k.m.t + 14);
    rotulos(k, 'Tiempo (s)', 'Nivel (dB)');
  }
  el.querySelectorAll('[data-sala]').forEach((b) => b.addEventListener('click', () => {
    estado.sala = b.dataset.sala; el.querySelectorAll('[data-sala]').forEach((o) => o.setAttribute('aria-pressed', String(o === b))); calcular();
  }));
  enlazarBandas(el, estado, dibujar);
  el.querySelector('[data-accion="generar"]').addEventListener('click', calcular);
  botonEscuchar(el.querySelector('[data-accion="escuchar"]'), () => h, () => fs);
  alCambiarAncho(cvT, dibujar);
  return { iniciar: calcular, redibujar: dibujar };
}

// Extra opcional · apply_lundeby: el procedimiento animado, etapa por etapa y en cada iteración.
const PASOS_LUNDEBY = ['Energía en bloques', 'Ruido de fondo', 'Recta de la caída', 'Cruce con el ruido', 'Iterar', 'Resultado'];
function demoLundeby(el) {
  const estado = { t60: 1, ruido: -45 };
  el.innerHTML = `
    ${cabecera('service', 'apply_lundeby(ir, fs)', 'Animación del algoritmo, calculado en tu navegador.')}
    <div class="servicio-demo__controles">
      <div class="servicio-demo__grupo" role="group" aria-label="Animación">
        <button type="button" data-accion="play">Pausa</button>
        <button type="button" data-accion="atras" aria-label="Paso anterior">◀</button>
        <button type="button" data-accion="adelante" aria-label="Paso siguiente">▶</button>
        <button type="button" data-accion="reiniciar">Reiniciar</button>
      </div>
      ${rango('t60', 'T60 de la sala', 0.5, 2, 0.1, estado.t60)}
      ${rango('ruido', 'ruido de fondo', -65, -30, 5, estado.ruido)}
    </div>
    <ol class="servicio-demo__pasos">${PASOS_LUNDEBY.map((p, i) => `<li data-paso="${i}">${i < 5 ? `${i + 1}. ` : ''}${p}</li>`).join('')}</ol>
    <canvas role="img" aria-label="Algoritmo de Lundeby sobre la energía de una RI con ruido de fondo"></canvas>
    <p class="servicio-demo__dato" aria-live="polite"></p>`;
  const [cv] = el.querySelectorAll('canvas');
  const botonPlay = el.querySelector('[data-accion="play"]');
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ANIM = 1400, PAUSA = 2600;                    // ms de animación y de lectura por fotograma
  let fs = 0, h = null, dur = 0, res = null, fondo = null, ref = 0, cuadros = [], completa = null, truncada = null;
  let cuadro = 0, p = 1, tocando = false, raf = 0, t0 = 0;

  function calcular() {
    fs = contexto().sampleRate;
    dur = Math.max(1.5, 2 * estado.t60);
    const r = rngGauss(13);
    h = riConRuido({ fs, t60: estado.t60, duracion: dur, pisoDb: estado.ruido, rng: () => 0.3 * r() });
    res = lundeby(h, fs);
    ref = Math.max(...(res.iteraciones[0]?.db ?? [0]));  // 0 dB = el bloque más alto de la primera pasada
    fondo = energiaPorBloques(h, fs, 0.002);
    completa = edcDb(h); truncada = edcDb(h.subarray(0, res.index));
    // Fotogramas: las cuatro etapas de cada iteración (la 5 es "iterar") y el resultado.
    cuadros = [];
    res.iteraciones.forEach((it, k) => ['bloques', 'ruido', 'recta', 'cruce'].forEach((etapa) => cuadros.push({ k, etapa })));
    cuadros.push({ k: res.iteraciones.length - 1, etapa: 'resultado' });
    ir(0); reproducir(true);
  }
  const dbRel = (d) => d - ref;
  function texto({ k, etapa }) {
    const it = res.iteraciones[k], ant = res.iteraciones[k - 1], n = res.iteraciones.length;
    const iter = `<strong>Iteración ${k + 1} de ${n}.</strong> `;
    if (etapa === 'bloques') return iter + (k === 0
      ? 'Se promedia la energía de la RI en bloques de <strong>10 ms</strong> y se pasa a dB: la caída queda como una escalera, sin la oscilación de cada muestra.'
      : `Se vuelve a promediar con bloques de <strong>${fmt(it.bloqueS * 1000, 0)} ms</strong>, más o menos un quinto de lo que la recta anterior tardaba en caer 10 dB: con bloques más largos la escalera fluctúa menos.`);
    if (etapa === 'ruido') return iter + (k === 0
      ? `El ruido de fondo se estima con el <strong>último 10 %</strong> de la RI, donde se supone que la sala ya se apagó: <strong>${fmt(dbRel(it.ruido))} dB</strong>.`
      : `Ahora el ruido se estima desde <strong>10 dB por debajo del cruce anterior</strong> (${fmt(it.desdeRuido, 2)} s) hasta el final: más muestras de ruido puro. Nivel: <strong>${fmt(dbRel(it.ruido))} dB</strong>.`);
    if (etapa === 'recta') return iter + `Regresión lineal sobre los bloques que van <strong>desde el máximo hasta 10 dB por encima del ruido</strong> (resaltados): ahí la caída de la sala domina. Pendiente: <strong>${fmt(it.slope)} dB/s</strong> (T ≈ ${fmt(-60 / it.slope, 2)} s).`;
    if (etapa === 'cruce') return iter + `La recta se prolonga hasta el nivel del ruido: se cruzan en <strong>${fmt(it.tCruce, 3)} s</strong>.` + (ant
      ? ` El cruce anterior estaba en ${fmt(ant.tCruce, 3)} s: se movió ${fmt(Math.abs(it.tCruce - ant.tCruce) * 1000, 0)} ms. ${k === n - 1 ? '<strong>Ya no cambia: convergió.</strong>' : 'Todavía cambia: se repite.'}`
      : ' Con ese punto se repiten los pasos (paso 5) hasta que el cruce deje de moverse.');
    const t30 = (edc) => tramoYRecta(edc, fs, -5, -35)?.tr;
    const [a, b] = [t30(completa), t30(truncada)];
    const v = (x) => (x ? `<strong>${fmt(x, 2)} s</strong>` : '<strong>—</strong>');
    return `<strong>Resultado:</strong> <code>index</code> = ${res.index} (${fmt(res.index / fs, 3)} s) y <code>noise_level_db</code> = ${fmt(dbRel(res.noiseLevelDb))} dB. La integral de Schroeder hasta ese punto da T30 = ${v(b)}; sobre toda la RI, ${v(a)}. T60 de la sala: <strong>${fmt(estado.t60, 1)} s</strong>.`;
  }
  function dibujar() {
    if (!res) return;
    const COL = paleta(), c = cuadros[cuadro], it = res.iteraciones[c.k];
    const etapas = ['bloques', 'ruido', 'recta', 'cruce'], e = c.etapa === 'resultado' ? 4 : etapas.indexOf(c.etapa);
    const ley = c.etapa === 'resultado'
      ? [[COL.tenue, 'energía (2 ms)'], [COL.violeta, 'Schroeder sobre toda la RI'], [COL.senal, 'Schroeder hasta el cruce']]
      : [[COL.tenue, 'energía (2 ms)'], [COL.violeta, `bloques de ${fmt(it.bloqueS * 1000, 0)} ms`], [COL.mal, 'ruido de fondo'], [COL.senal, 'recta de la caída']];
    const k = marco(cv, { aspecto: 0.45, min: 270, max: 380 }, ley);
    const esc = grillaTiempoDb(k, dur, -80, 10), g = k.g;
    const linea = (x0, y0, x1, y1) => { g.beginPath(); g.moveTo(esc.xt(x0), esc.yd(y0)); g.lineTo(esc.xt(x1), esc.yd(y1)); g.stroke(); };
    // Fondo: la energía en ventanas de 2 ms.
    g.strokeStyle = COL.tenue; g.globalAlpha = 0.5; g.beginPath();
    fondo.t.forEach((t, i) => (i ? g.lineTo : g.moveTo).call(g, esc.xt(t), esc.yd(dbRel(fondo.db[i])))); g.stroke(); g.globalAlpha = 1;
    // Cruces de las iteraciones anteriores, tenues.
    for (let j = 0; j < c.k; j++) { g.setLineDash([2, 4]); g.strokeStyle = COL.eje; linea(res.iteraciones[j].tCruce, 0, res.iteraciones[j].tCruce, -80); g.setLineDash([]); }
    if (c.etapa === 'resultado') {
      curvaDb(k, completa, fs, dur, esc, COL.violeta, { ancho: 2.2, envolvente: false });
      const tr = Float32Array.from({ length: Math.round(res.index * Math.min(1, p)) }, (_, i) => truncada[i]);
      curvaDb(k, tr, fs, dur, esc, COL.senal, { ancho: 2.6, envolvente: false });
      g.setLineDash([4, 4]); g.strokeStyle = COL.tinta; linea(res.index / fs, 0, res.index / fs, -80); g.setLineDash([]);
    } else {
      // 1 · Bloques (escalera), que aparecen de izquierda a derecha en su etapa.
      const nVis = e === 0 ? Math.ceil(it.t.length * p) : it.t.length, mitad = it.bloqueS / 2;
      g.lineWidth = 2;
      for (let i = 0; i < nVis; i++) {
        const resaltado = e >= 2 && i >= it.iMax && i < it.iFin;
        g.strokeStyle = COL.violeta; g.globalAlpha = e >= 2 && !resaltado ? 0.35 : 1;
        linea(it.t[i] - mitad, dbRel(it.db[i]), it.t[i] + mitad, dbRel(it.db[i]));
      }
      g.globalAlpha = 1; g.lineWidth = 1;
      // 2 · Ruido: la zona donde se estima y su nivel, que crece desde la derecha.
      if (e >= 1) {
        const pr = e === 1 ? p : 1, nr = dbRel(it.ruido);
        g.fillStyle = COL.mal; g.globalAlpha = 0.1 * pr; g.fillRect(esc.xt(it.desdeRuido), k.m.t, esc.xt(dur) - esc.xt(it.desdeRuido), k.H - k.m.t - k.m.b); g.globalAlpha = 1;
        g.strokeStyle = COL.mal; g.lineWidth = 2; linea(dur - pr * dur, nr, dur, nr); g.lineWidth = 1;
        g.font = `600 ${k.tt}px ${FUENTE}`; g.fillStyle = COL.mal; g.textAlign = 'right';
        g.fillText(`ruido ${fmt(nr)} dB`, esc.xt(dur) - 4, esc.yd(nr) - 6);
        if (e >= 2) { g.setLineDash([5, 4]); g.strokeStyle = COL.mal; g.globalAlpha = 0.7; linea(0, nr + 10, dur, nr + 10); g.setLineDash([]); g.globalAlpha = 1; g.fillText('ruido + 10 dB', esc.xt(dur) - 4, esc.yd(nr + 10) - 6); }
        g.textAlign = 'left';
      }
      // 3 · La recta, que se dibuja sobre el tramo; 4 · su prolongación hasta el ruido.
      const recta = (t) => dbRel(it.slope * t + it.intercept);
      const ta = it.t[it.iMax], tb = it.t[Math.max(it.iMax, it.iFin - 1)];
      if (e >= 2) { g.strokeStyle = COL.senal; g.lineWidth = 3; const fin = e === 2 ? ta + (tb - ta) * p : tb; linea(ta, recta(ta), fin, recta(fin)); g.lineWidth = 1; }
      if (e >= 3) {
        const fin = e === 3 ? tb + (it.tCruce - tb) * p : it.tCruce;
        g.strokeStyle = COL.senal; g.lineWidth = 2; g.setLineDash([6, 4]); linea(tb, recta(tb), fin, recta(fin)); g.setLineDash([]); g.lineWidth = 1;
        if (e > 3 || p >= 1) {
          g.strokeStyle = COL.tinta; g.setLineDash([3, 4]); linea(it.tCruce, 0, it.tCruce, -80); g.setLineDash([]);
          g.beginPath(); g.arc(esc.xt(it.tCruce), esc.yd(dbRel(it.ruido)), 5, 0, 2 * Math.PI); g.fillStyle = COL.tinta; g.fill();
          g.font = `600 ${k.tt}px ${FUENTE}`; g.fillText(`cruce: ${fmt(it.tCruce, 3)} s`, esc.xt(it.tCruce) + 7, k.m.t + 14);
        }
      }
    }
    rotulos(k, 'Tiempo (s)', 'Nivel (dB)');
  }
  function ir(n) {
    cuadro = Math.max(0, Math.min(cuadros.length - 1, n)); p = quieto ? 1 : 0; t0 = performance.now();
    const c = cuadros[cuadro], paso = c.etapa === 'resultado' ? 5 : ['bloques', 'ruido', 'recta', 'cruce'].indexOf(c.etapa);
    el.querySelectorAll('[data-paso]').forEach((li) => {
      const i = Number(li.dataset.paso);
      li.toggleAttribute('aria-current', i === paso || (c.etapa === 'bloques' && c.k > 0 && i === 4));
    });
    el.querySelector('.servicio-demo__dato').innerHTML = texto(c);
    dibujar();
  }
  function cuadroAnimado(ahora) {
    const t = ahora - t0;
    p = quieto ? 1 : Math.min(1, t / ANIM);
    dibujar();
    if (t >= ANIM + PAUSA) { if (cuadro === cuadros.length - 1) { reproducir(false); return; } ir(cuadro + 1); }
    raf = requestAnimationFrame(cuadroAnimado);
  }
  function reproducir(si) {
    tocando = si; cancelAnimationFrame(raf);
    botonPlay.textContent = si ? 'Pausa' : 'Reproducir';
    if (si) { t0 = performance.now() - p * ANIM; raf = requestAnimationFrame(cuadroAnimado); }
  }
  botonPlay.addEventListener('click', () => {
    if (!tocando && cuadro === cuadros.length - 1) ir(0);
    reproducir(!tocando);
  });
  el.querySelector('[data-accion="atras"]').addEventListener('click', () => { reproducir(false); ir(cuadro - 1); p = 1; dibujar(); });
  el.querySelector('[data-accion="adelante"]').addEventListener('click', () => { reproducir(false); ir(cuadro + 1); p = 1; dibujar(); });
  el.querySelector('[data-accion="reiniciar"]').addEventListener('click', () => { ir(0); reproducir(true); });
  for (const c of ['t60', 'ruido']) {
    const inp = el.querySelector(`[data-p="${c}"]`), out = el.querySelector(`[data-o="${c}"]`);
    const mostrar = () => { out.textContent = c === 'ruido' ? `${estado[c]} dB` : `${fmt(estado[c])} s`; };
    inp.addEventListener('input', () => { estado[c] = Number(inp.value); mostrar(); });
    inp.addEventListener('change', calcular); mostrar();
  }
  alCambiarAncho(cv, dibujar);
  return { iniciar: calcular, redibujar: dibujar };
}

const DEMOS = {
  'pink-noise': demoRuidoRosa, 'sine-sweep': demoSweep,
  smoothing: demoSuavizado, schroeder: demoSchroeder, regression: demoRegresion, parameters: demoParametros, lundeby: demoLundeby,
  'load-audio': demoCargarAudio, 'filter-single-band': demoFiltroOctava, 'synthetic-ir': demoRiSintetica,
  'impulse-response': demoRespuestaImpulso, 'log-scale': demoEscalaLog,
};
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
