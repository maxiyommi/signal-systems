// Servicios de generación de M1 portados de la API de referencia (RIR-API, app/services/):
// mismos algoritmos y nombres, para generar, escuchar y ver las señales en el navegador.
import { fft, espectroPromedioDb } from './acustica.js';

// Ruido gaussiano con semilla (Box-Muller sobre un generador congruencial).
export function rngGauss(semilla = 1) {
  let s = semilla;
  const u = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  return () => Math.sqrt(-2 * Math.log(u() + 1e-12)) * Math.cos(2 * Math.PI * u());
}

function normalizar90(x) {
  let max = 0; for (const v of x) max = Math.max(max, Math.abs(v));
  if (max > 0) for (let i = 0; i < x.length; i++) x[i] = (x[i] / max) * 0.9;
  return x;
}

// generate_pink_noise: ruido blanco filtrado con un IIR de 3.er orden que aproxima 1/f.
// Se descarta el transitorio del filtro: ln(1000) / (1 − |polo máximo|) ≈ 1430 muestras.
const B = [0.049922035, -0.095993537, 0.050612699, -0.004408786];
const A = [1, -2.494956002, 2.017265875, -0.522189400];
const TRANSITORIO = 1430;
export function generatePinkNoise(duration, fs, rng = rngGauss(Date.now() % 2147483647 || 1)) {
  const n = Math.round(duration * fs), total = n + TRANSITORIO;
  const y = new Float64Array(total), x = new Float64Array(total);
  for (let i = 0; i < total; i++) {
    x[i] = rng();
    let acc = 0;
    for (let k = 0; k < 4; k++) if (i - k >= 0) acc += B[k] * x[i - k];
    for (let k = 1; k < 4; k++) if (i - k >= 0) acc -= A[k] * y[i - k];
    y[i] = acc;
  }
  return normalizar90(Float32Array.from(y.subarray(TRANSITORIO)));
}

// generate_voss_pink_noise: suma de 16 generadores que se renuevan cada 1, 2, 4, 8… muestras.
export function generateVossPinkNoise(duration, fs, rng = rngGauss(Date.now() % 2147483647 || 1)) {
  const n = Math.round(duration * fs), filas = 16;
  const valores = Array.from({ length: filas }, () => rng());
  let suma = valores.reduce((a, b) => a + b, 0);
  const out = new Float32Array(n);
  let media = 0;
  for (let i = 0; i < n; i++) {
    const k = i === 0 ? 0 : Math.min(filas - 1, 31 - Math.clz32(i & -i));   // bit menos significativo que cambia
    suma -= valores[k]; valores[k] = rng(); suma += valores[k];
    out[i] = suma + rng();
    media += out[i];
  }
  media /= n;
  for (let i = 0; i < n; i++) out[i] -= media;
  return normalizar90(out);
}

// generate_sine_sweep_pair: sweep logarítmico de Farina y su filtro inverso
// (sweep invertido en el tiempo × modulación de amplitud que compensa la caída de 3 dB/octava).
export function generateSineSweepPair(duration, f1, f2, fs) {
  const n = Math.round(duration * fs);
  const w1 = 2 * Math.PI * f1, w2 = 2 * Math.PI * f2;
  const k = (duration * w1) / Math.log(w2 / w1), l = duration / Math.log(w2 / w1);
  const sweep = new Float32Array(n), inverseFilter = new Float32Array(n);
  for (let i = 0; i < n; i++) sweep[i] = Math.sin(k * (Math.exp((i * duration) / (n - 1) / l) - 1));
  for (let i = 0; i < n; i++) {
    const t = (i * duration) / (n - 1);
    const w = (k / l) * Math.exp(t / l);
    inverseFilter[i] = (w1 / w) * sweep[n - 1 - i];
  }
  return { sweep, inverseFilter: normalizar90(inverseFilter) };
}

// Frecuencia instantánea del sweep: f(t) = f1 · (f2/f1)^(t/T).
export const frecuenciaInstantanea = (t, duration, f1, f2) => f1 * Math.pow(f2 / f1, t / duration);

// Convolución lineal por FFT (lo que hace scipy.signal.fftconvolve).
export function convolucionFFT(a, b) {
  const largo = a.length + b.length - 1;
  let n = 1; while (n < largo) n <<= 1;
  const ar = new Float64Array(n), ai = new Float64Array(n), br = new Float64Array(n), bi = new Float64Array(n);
  ar.set(a); br.set(b);
  fft(ar, ai); fft(br, bi);
  for (let i = 0; i < n; i++) {                      // producto espectral, conjugado para antitransformar
    const r = ar[i] * br[i] - ai[i] * bi[i], im = ar[i] * bi[i] + ai[i] * br[i];
    ar[i] = r; ai[i] = -im;
  }
  fft(ar, ai);                                       // IFFT(x) = conj(FFT(conj(x))) / n
  const y = new Float32Array(largo);
  for (let i = 0; i < largo; i++) y[i] = ar[i] / n;
  return y;
}

// Pendiente de la densidad espectral en dB por octava (regresión sobre el promedio por octava).
export function pendienteDbPorOctava(x, fs, fmin, fmax) {
  const { frecuencias, db } = espectroPromedioDb(x, fs, 4096);
  const xs = [], ys = [];
  for (let fc = fmin; fc * Math.SQRT2 <= fmax * Math.SQRT2 + 1e-9 && fc <= fmax; fc *= 2) {
    let p = 0, cuenta = 0;
    for (let k = 0; k < frecuencias.length; k++) {
      if (frecuencias[k] >= fc / Math.SQRT2 && frecuencias[k] < fc * Math.SQRT2) { p += Math.pow(10, db[k] / 10); cuenta++; }
    }
    if (cuenta) { xs.push(Math.log2(fc)); ys.push(10 * Math.log10(p / cuenta)); }
  }
  const m = xs.length, sx = xs.reduce((a, b) => a + b, 0), sy = ys.reduce((a, b) => a + b, 0);
  const sxx = xs.reduce((a, b) => a + b * b, 0), sxy = xs.reduce((a, b, i) => a + b * ys[i], 0);
  return (m * sxy - sx * sy) / (m * sxx - sx * sx);
}
