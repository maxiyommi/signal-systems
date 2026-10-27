// Servicios de análisis de M3 para las demos de la página: los mismos cálculos que pide la
// especificación (envolvente, integral de Schroeder, regresión con R², parámetros ISO 3382 por banda).
import { fft, edcDb, evaluarDecaimiento, RANGOS } from './acustica.js';
import { filtrarOctava, bandaValida } from './procesamiento.js';

// Bandas de la tabla de validación del TP.
export const BANDAS_M3 = [125, 250, 500, 1000, 2000, 4000];

// Envolvente de Hilbert: |señal analítica|. En frecuencia: se anulan las frecuencias negativas y se
// duplican las positivas (lo que hace scipy.signal.hilbert), y se toma el módulo de la inversa.
export function envolventeHilbert(x) {
  let n = 1; while (n < x.length) n <<= 1;
  const re = new Float64Array(n), im = new Float64Array(n);
  re.set(x);
  fft(re, im);
  for (let k = 1; k < n / 2; k++) { re[k] *= 2; im[k] *= 2; }
  for (let k = n / 2 + 1; k < n; k++) { re[k] = 0; im[k] = 0; }
  for (let k = 0; k < n; k++) im[k] = -im[k];       // IFFT(X) = conj(FFT(conj(X))) / n
  fft(re, im);
  const env = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) env[i] = Math.hypot(re[i], im[i]) / n;
  return env;
}

// Envolvente RMS: raíz de la media móvil (centrada) de x², con una ventana de windowMs milisegundos.
export function mediaMovilRms(x, fs, windowMs = 10) {
  const m = Math.max(1, Math.round((windowMs * fs) / 1000)), mitad = Math.floor(m / 2);
  const acum = new Float64Array(x.length + 1);
  for (let i = 0; i < x.length; i++) acum[i + 1] = acum[i] + x[i] * x[i];
  const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) {
    const a = Math.max(0, i - mitad), b = Math.min(x.length, a + m);
    out[i] = Math.sqrt((acum[b] - acum[a]) / (b - a));
  }
  return out;
}

// apply_smoothing(signal, fs, method, window_ms): envolvente en amplitud.
export function applySmoothing(x, fs, method = 'hilbert', windowMs = 10) {
  if (method === 'hilbert') return envolventeHilbert(x);
  if (method === 'moving_average') {
    if (!(windowMs > 0)) throw new Error('window_ms tiene que ser positivo');
    return mediaMovilRms(x, fs, windowMs);
  }
  throw new Error(`method desconocido: ${method}`);
}

// linear_regression(x, y) → { slope, intercept, r2 } por mínimos cuadrados.
export function linearRegression(x, y) {
  const n = x.length;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) { sx += x[i]; sy += y[i]; sxx += x[i] * x[i]; sxy += x[i] * y[i]; }
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const intercept = (sy - slope * sx) / n;
  const media = sy / n;
  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < n; i++) { const e = y[i] - (slope * x[i] + intercept); ssRes += e * e; ssTot += (y[i] - media) ** 2; }
  return { slope, intercept, r2: ssTot > 0 ? 1 - ssRes / ssTot : 1 };
}

// Tramo de la curva de Schroeder entre desdeDb y hastaDb y su recta (para EDT, T10, T20, T30).
export function tramoYRecta(edc, fs, desdeDb, hastaDb) {
  const x = [], y = [];
  for (let i = 0; i < edc.length; i++) if (edc[i] <= desdeDb && edc[i] >= hastaDb) { x.push(i / fs); y.push(edc[i]); }
  if (x.length < 3 || !edc.some((d) => d <= hastaDb)) return null;
  const r = linearRegression(x, y);
  return { ...r, t0: x[0], t1: x[x.length - 1], tr: -60 / r.slope };
}

// D50 (%): energía de los primeros 50 ms sobre la total. C80 (dB): primeros 80 ms contra el resto.
export function d50(ir, fs) {
  const n50 = Math.floor(0.05 * fs);
  let temprana = 0, total = 0;
  for (let i = 0; i < ir.length; i++) { const e = ir[i] * ir[i]; total += e; if (i < n50) temprana += e; }
  return (100 * temprana) / total;
}
export function c80(ir, fs) {
  const n80 = Math.floor(0.08 * fs);
  let temprana = 0, tardia = 0;
  for (let i = 0; i < ir.length; i++) { const e = ir[i] * ir[i]; if (i < n80) temprana += e; else tardia += e; }
  return 10 * Math.log10(temprana / tardia);
}

// calculate_parameters_from_ir(ir, fs) → { EDT: {fc: s}, T10, T20, T30, D50: {fc: %}, C80: {fc: dB} }.
// Cada banda: filtro de octava (fase cero) → Schroeder → regresión en el tramo de cada parámetro.
// Un tiempo cuyo tramo no tiene rango dinámico suficiente (ISO 3382-1: el ruido de fondo tiene que
// quedar al menos 10 dB por debajo del final del tramo) queda en null. Las bandas cuyo borde superior
// pasa Nyquist se saltean. D50 y C80 se cuentan desde el pico de cada banda (la llegada del directo).
export function calculateParametersFromIr(ir, fs, bandas = BANDAS_M3) {
  const out = { EDT: {}, T10: {}, T20: {}, T30: {}, D50: {}, C80: {} };
  for (const fc of bandas) {
    if (!bandaValida(fc, fs)) continue;
    const banda = filtrarOctava(ir, fs, fc);
    for (const [clave, { desde, hasta }] of Object.entries(RANGOS)) {
      const r = evaluarDecaimiento(banda, fs, { desdeDb: desde, hastaDb: hasta });
      out[clave][fc] = r.valido ? r.tr : null;
    }
    let iPico = 0; for (let i = 0; i < banda.length; i++) if (Math.abs(banda[i]) > Math.abs(banda[iPico])) iPico = i;
    const desdePico = banda.subarray(iPico);
    out.D50[fc] = d50(desdePico, fs);
    out.C80[fc] = c80(desdePico, fs);
  }
  return out;
}

// Energía media en bloques consecutivos de `bloqueS` segundos, en dB (el paso 1 de Lundeby).
export function energiaPorBloques(x, fs, bloqueS) {
  const largo = Math.max(1, Math.round(bloqueS * fs));
  const t = [], db = [];
  for (let i = 0; i + largo <= x.length; i += largo) {
    let e = 0;
    for (let k = i; k < i + largo; k++) e += x[k] * x[k];
    t.push((i + largo / 2) / fs); db.push(10 * Math.log10(e / largo + 1e-20));
  }
  return { t, db };
}

// apply_lundeby(ir, fs): punto donde la caída de la RI se cruza con el ruido de fondo (Lundeby et al.,
// 1995), con los pasos de la especificación. Devuelve el índice de corte, el nivel del ruido y cada
// iteración ({ bloqueS, t, db, ruido, desdeRuido, iMax, iFin, slope, intercept, tCruce }) para mostrarla.
// 1. energía en bloques (10 ms la primera vez); 2. ruido en el último 10 % (después, desde 10 dB por
// debajo del cruce anterior); 3. recta desde el máximo hasta 10 dB por encima del ruido; 4. cruce de la
// recta con el ruido; 5. repetir con bloques de ~1/5 de lo que tarda en caer 10 dB (entre 10 y 30 ms)
// hasta que el cruce se mueva menos de `tolS`.
export function lundeby(ir, fs, { maxIter = 6, tolS = 0.005 } = {}) {
  const dur = ir.length / fs;
  const iteraciones = [];
  let bloqueS = 0.01, tCruce = null;
  for (let k = 0; k < maxIter; k++) {
    const { t, db } = energiaPorBloques(ir, fs, bloqueS);
    // Ruido: la primera vez, el último 10 %; después, desde 10 dB por debajo del cruce (al menos el 10 %).
    let desdeRuido = 0.9 * dur;
    if (tCruce !== null) desdeRuido = Math.min(0.9 * dur, tCruce + 10 / Math.abs(iteraciones[k - 1].slope));
    let s = 0, n = 0;
    for (let i = Math.floor(desdeRuido * fs); i < ir.length; i++) { s += ir[i] * ir[i]; n++; }
    const ruido = 10 * Math.log10(s / Math.max(1, n) + 1e-20);
    const iMax = db.indexOf(Math.max(...db));
    let iFin = db.findIndex((d, i) => i > iMax && d <= ruido + 10);
    if (iFin < 0) iFin = db.length - 1;
    if (iFin - iMax < 3) break;                         // no hay caída medible por encima del ruido
    const { slope, intercept } = linearRegression(t.slice(iMax, iFin), db.slice(iMax, iFin));
    if (!(slope < 0)) break;
    const nuevo = Math.min(dur, Math.max(0, (ruido - intercept) / slope));
    iteraciones.push({ bloqueS, t, db, ruido, desdeRuido, iMax, iFin, slope, intercept, tCruce: nuevo });
    const convergio = tCruce !== null && Math.abs(nuevo - tCruce) < tolS;
    tCruce = nuevo;
    if (convergio) break;
    bloqueS = Math.min(0.03, Math.max(0.01, 10 / Math.abs(slope) / 5));
  }
  const ultima = iteraciones[iteraciones.length - 1];
  if (!ultima) return { index: ir.length, noiseLevelDb: null, iteraciones };
  return { index: Math.max(2, Math.min(ir.length, Math.round(ultima.tCruce * fs))), noiseLevelDb: ultima.ruido, iteraciones };
}

export { edcDb as applySchroederIntegral };
