// Servicios de procesamiento de M2 para las demos de la página: mismos modelos que la especificación
// (filtro de octava IEC 61260, RI sintética multibanda, deconvolución, escala logarítmica).
import { fft, edcDb, tiempoReverberacion } from './acustica.js';
import { rngGauss, convolucionFFT } from './generacion.js';

// Frecuencias centrales nominales de las bandas de octava (IEC 61260).
export const OCTAVAS = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

// Bordes de la banda: fc/√2 y fc·√2.
export const bordesOctava = (fc) => [fc / Math.SQRT2, fc * Math.SQRT2];

// La banda se puede diseñar si su borde superior queda por debajo de Nyquist (scipy.signal.butter lo exige).
export const bandaValida = (fc, fs) => bordesOctava(fc)[1] < fs / 2;

// |H(f)| de UNA pasada del Butterworth pasabanda digital que diseña
// scipy.signal.butter(order, [f_inf, f_sup], 'band', fs=fs): transformación bilineal con los bordes
// pre-distorsionados (Ω = tan(π f / fs)). Coincide con sosfreqz a la precisión de la máquina.
export function gananciaOctava(f, fc, fs, order = 4) {
  const [f1, f2] = bordesOctava(fc);
  const w = (x) => Math.tan((Math.PI * x) / fs);
  const o1 = w(f1), o2 = w(f2), o = w(f);
  if (o <= 0) return 0;
  const q = (o * o - o1 * o2) / (o * (o2 - o1));
  return 1 / Math.sqrt(1 + Math.pow(q * q, order));
}

// filter_single_band: filtrado de fase cero, como sosfiltfilt. Dos pasadas del mismo filtro = el
// espectro se multiplica por |H|² y la fase se cancela. Se hace en frecuencia (FFT con relleno de
// ceros para que la convolución no se "doble" sobre sí misma).
export function filtrarOctava(x, fs, fc, order = 4) {
  const extra = Math.ceil(fs * 0.25);
  let n = 1; while (n < x.length + extra) n <<= 1;
  const re = new Float64Array(n), im = new Float64Array(n);
  re.set(x);
  fft(re, im);
  for (let k = 0; k <= n / 2; k++) {
    const g = gananciaOctava((k * fs) / n, fc, fs, order) ** 2;
    re[k] *= g; im[k] *= g;
    if (k > 0 && k < n / 2) { re[n - k] *= g; im[n - k] *= g; }
  }
  for (let k = 0; k < n; k++) im[k] = -im[k];       // IFFT(X) = conj(FFT(conj(X))) / n
  fft(re, im);
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) y[i] = re[i] / n;
  return y;
}

function rms(x) { let s = 0; for (const v of x) s += v * v; return Math.sqrt(s / x.length); }
function normalizarPico(x, a = 1) {
  let m = 0; for (const v of x) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < x.length; i++) x[i] = (x[i] / m) * a;
  return x;
}

// generate_synthetic_ir: por banda, ruido blanco filtrado en la octava, normalizado por su RMS
// y multiplicado por e^(−α t), α = 3 ln(10) / T60; se suman las bandas y se normaliza al pico.
export function generateSyntheticIr(duration, t60Values, fs, rng = rngGauss(12345)) {
  const n = Math.round(duration * fs);
  const h = new Float32Array(n);
  for (const [fcTexto, t60] of Object.entries(t60Values)) {
    const fc = Number(fcTexto);
    if (!bandaValida(fc, fs)) continue;
    const ruido = new Float32Array(n);
    for (let i = 0; i < n; i++) ruido[i] = rng();
    const banda = filtrarOctava(ruido, fs, fc);
    const r = rms(banda) || 1, alfa = (3 * Math.LN10) / t60;
    for (let i = 0; i < n; i++) h[i] += (banda[i] / r) * Math.exp((-alfa * i) / fs);
  }
  return normalizarPico(h);
}

// get_impulse_response: grabación ∗ filtro inverso (fftconvolve), recorte un poco antes del pico
// y normalización al pico.
export function getImpulseResponse(recording, inverseFilter, fs, { antesMs = 1 } = {}) {
  const y = convolucionFFT(recording, inverseFilter);
  let iPico = 0; for (let i = 0; i < y.length; i++) if (Math.abs(y[i]) > Math.abs(y[iPico])) iPico = i;
  const desde = Math.max(0, iPico - Math.round((antesMs / 1000) * fs));
  return normalizarPico(Float32Array.from(y.subarray(desde)));
}

// logarithmic_scale_conversion: 20·log10(|x| / max|x|), sin log(0) y con un piso opcional.
export function logarithmicScaleConversion(x, pisoDb = -Infinity) {
  let m = 0; for (const v of x) m = Math.max(m, Math.abs(v));
  const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) {
    const a = Math.max(Math.abs(x[i]), Number.EPSILON);
    out[i] = Math.max(20 * Math.log10(a / (m || 1)), pisoDb);
  }
  return out;
}

// T60 extrapolado de la pendiente de Schroeder entre −5 y −25 dB (T20): lo mismo que mide el test.
export const t60Schroeder = (ri, fs) => tiempoReverberacion(edcDb(ri), fs, { desdeDb: -5, hastaDb: -25 });

// Correlación de Pearson entre la RI recuperada y la original, alineadas por correlación cruzada
// (el procedimiento de test_impulse_response_peak).
export function correlacionAlineada(recuperada, original) {
  const rev = Float32Array.from(original).reverse();
  const xc = convolucionFFT(recuperada, rev);
  let iMax = 0; for (let i = 0; i < xc.length; i++) if (Math.abs(xc[i]) > Math.abs(xc[iMax])) iMax = i;
  const d = iMax - (original.length - 1);
  const a = [], b = [];
  for (let i = 0; i < original.length; i++) {
    const j = i + d;
    if (j >= 0 && j < recuperada.length) { a.push(recuperada[j]); b.push(original[i]); }
  }
  const ma = a.reduce((s, v) => s + v, 0) / a.length, mb = b.reduce((s, v) => s + v, 0) / b.length;
  let sab = 0, saa = 0, sbb = 0;
  for (let i = 0; i < a.length; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) ** 2; sbb += (b[i] - mb) ** 2; }
  return Math.abs(sab / Math.sqrt(saa * sbb));
}

// load_audio, la parte de leer el archivo: un WAV PCM (16/24/32 bits) o float (32/64) a float64 en
// [−1, 1], con fs y canales leídos del encabezado y los canales promediados a mono.
// Lanza Error con un mensaje claro si no es un WAV válido (en Python sería ValueError).
export function leerWav(buffer) {
  const v = new DataView(buffer);
  const texto = (o, n) => String.fromCharCode(...new Uint8Array(buffer, o, n));
  if (buffer.byteLength < 12 || texto(0, 4) !== 'RIFF' || texto(8, 4) !== 'WAVE') throw new Error('no es un archivo WAV (falta el encabezado RIFF/WAVE)');
  let o = 12, fmt = null, datos = null;
  while (o + 8 <= buffer.byteLength) {
    const id = texto(o, 4), largo = v.getUint32(o + 4, true);
    if (id === 'fmt ') fmt = { formato: v.getUint16(o + 8, true), canales: v.getUint16(o + 10, true), fs: v.getUint32(o + 12, true), bits: v.getUint16(o + 22, true) };
    if (id === 'data') datos = { desde: o + 8, largo: Math.min(largo, buffer.byteLength - o - 8) };
    o += 8 + largo + (largo % 2);
  }
  if (!fmt || !datos) throw new Error('el WAV no tiene los bloques "fmt" y "data"');
  let { formato } = fmt;
  if (formato === 0xfffe) formato = fmt.bits >= 32 && fmt.bits !== 24 ? 0 : 1;   // WAVE_FORMAT_EXTENSIBLE: se infiere
  const bytes = fmt.bits / 8, cuadro = bytes * fmt.canales;
  const n = Math.floor(datos.largo / cuadro);
  let leer;
  if (formato === 1 && fmt.bits === 16) leer = (p) => v.getInt16(p, true) / 32768;
  else if (formato === 1 && fmt.bits === 24) leer = (p) => ((v.getUint8(p) | (v.getUint8(p + 1) << 8) | (v.getInt8(p + 2) << 16))) / 8388608;
  else if (formato === 1 && fmt.bits === 32) leer = (p) => v.getInt32(p, true) / 2147483648;
  else if ((formato === 3 || formato === 0) && fmt.bits === 32) leer = (p) => v.getFloat32(p, true);
  else if ((formato === 3 || formato === 0) && fmt.bits === 64) leer = (p) => v.getFloat64(p, true);
  else throw new Error(`formato no soportado (código ${fmt.formato}, ${fmt.bits} bits)`);
  const mono = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let c = 0; c < fmt.canales; c++) s += leer(datos.desde + i * cuadro + c * bytes);
    mono[i] = Math.max(-1, Math.min(1, s / fmt.canales));
  }
  return { signal: mono, fs: fmt.fs, canales: fmt.canales, bits: fmt.bits, flotante: formato !== 1 };
}
