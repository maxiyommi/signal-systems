// Lógica acústica pura para las presentaciones (sin DOM). Unidades SI.

export function sabineT60({ lx, ly, lz }, alpha) {
  const V = lx * ly * lz;
  const S = 2 * (lx * ly + lx * lz + ly * lz);
  return (0.161 * V) / (alpha * S);
}

// Eyring: corrige a Sabine cuando la absorción es alta (−ln(1−α) en lugar de α).
export function eyringT60({ lx, ly, lz }, alpha) {
  const V = lx * ly * lz;
  const S = 2 * (lx * ly + lx * lz + ly * lz);
  return (0.161 * V) / (-S * Math.log(1 - alpha));
}

// Cuánto tiempo mostrar en el ecograma: 0,2 s para la sala de referencia (diagonal ≈ 13,4 m),
// proporcional a la diagonal para salas más grandes, hasta 0,5 s.
export function tiempoEcograma({ lx, ly, lz }) {
  const t = 0.2 * Math.hypot(lx, ly, lz) / Math.hypot(10, 8, 4);
  return Math.round(Math.min(0.5, Math.max(0.2, t)) * 100) / 100;
}

const ruidoUniforme = () => 2 * Math.random() - 1;   // uniforme en [−1, 1], media 0

export function riSintetica({ fs, t60, duracion, rng = ruidoUniforme }) {
  const n = Math.round(fs * duracion);
  const ri = new Float32Array(n);
  const k = -3 / (t60 * fs);                // 10^(-3 t / t60) → -60 dB en t60
  for (let i = 0; i < n; i++) ri[i] = rng() * Math.pow(10, k * i);
  ri[0] = 1;
  return ri;
}

export function edcDb(ri) {
  const n = ri.length;
  const e = new Float64Array(n);
  let acc = 0;
  for (let i = n - 1; i >= 0; i--) { acc += ri[i] * ri[i]; e[i] = acc; }
  const out = new Float32Array(n);
  const e0 = e[0] || 1;
  for (let i = 0; i < n; i++) out[i] = Math.max(10 * Math.log10(e[i] / e0), -200);
  return out;
}

export function regresionLineal(x, y) {
  const n = x.length;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) { sx += x[i]; sy += y[i]; sxx += x[i] * x[i]; sxy += x[i] * y[i]; }
  const pendiente = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  return { pendiente, ordenada: (sy - pendiente * sx) / n };
}

export function tiempoReverberacion(edc, fs, { desdeDb = -5, hastaDb = -35 } = {}) {
  let i0 = -1, i1 = -1;
  for (let i = 0; i < edc.length; i++) {
    if (i0 < 0 && edc[i] <= desdeDb) i0 = i;
    if (edc[i] <= hastaDb) { i1 = i; break; }
  }
  if (i0 < 0 || i1 < 0 || i1 - i0 < 2) return null;
  const x = [], y = [];
  for (let i = i0; i <= i1; i++) { x.push(i / fs); y.push(edc[i]); }
  const { pendiente } = regresionLineal(x, y);
  return -60 / pendiente;
}

// Método de fuentes imagen para sala rectangular: incluye la fuente real (orden 0).
export function fuentesImagen({ lx, ly, lz }, [sx, sy, sz], orden) {
  const L = [lx, ly, lz], s = [sx, sy, sz];
  const coord = (eje, n) => (n % 2 === 0 ? n * L[eje] + s[eje] : (n + 1) * L[eje] - s[eje]);
  const out = [];
  for (let nx = -orden; nx <= orden; nx++)
    for (let ny = -orden; ny <= orden; ny++)
      for (let nz = -orden; nz <= orden; nz++) {
        const o = Math.abs(nx) + Math.abs(ny) + Math.abs(nz);
        if (o > orden) continue;
        out.push({ pos: [coord(0, nx), coord(1, ny), coord(2, nz)], orden: o });
      }
  return out;
}

// Llegadas al micrófono ordenadas por tiempo, amplitud relativa al sonido directo.
export function llegadas(imagenes, [mx, my, mz], alpha, c = 343) {
  const lista = imagenes.map(({ pos, orden }) => {
    const d = Math.hypot(pos[0] - mx, pos[1] - my, pos[2] - mz);
    return { t: d / c, amp: Math.pow(1 - alpha, orden / 2) / d, orden, pos };   // α es de energía: presión × √(1−α)
  });
  lista.sort((a, b) => a.t - b.t);
  const ref = lista.find(l => l.orden === 0).amp;
  return lista.map(({ t, amp, orden, pos }) => ({ t, amp: amp / ref, orden, pos }));
}

// FFT radix-2 in place (re, im de largo potencia de 2).
export function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        [cr, ci] = [cr * wr - ci * wi, cr * wi + ci * wr];
      }
    }
  }
}

// Espectro de magnitud promedio (Welch: Hann, 50 % de solapamiento), normalizado a 0 dB en el máximo.
export function espectroPromedioDb(senal, fs, n = 8192) {
  const mitad = n / 2 + 1;
  const acc = new Float64Array(mitad);
  const hann = Float64Array.from({ length: n }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1)));
  const re = new Float64Array(n), im = new Float64Array(n);
  let frames = 0;
  for (let ini = 0; ini === 0 || ini + n <= senal.length; ini += n / 2) {
    for (let i = 0; i < n; i++) { re[i] = (senal[ini + i] || 0) * hann[i]; im[i] = 0; }
    fft(re, im);
    for (let k = 0; k < mitad; k++) acc[k] += re[k] * re[k] + im[k] * im[k];
    frames++;
  }
  let max = 0;
  for (let k = 0; k < mitad; k++) max = Math.max(max, acc[k]);
  const db = new Float32Array(mitad);
  for (let k = 0; k < mitad; k++) db[k] = max > 0 ? Math.max(10 * Math.log10(acc[k] / max), -120) : -120;
  const frecuencias = Float32Array.from({ length: mitad }, (_, k) => k * fs / n);
  return { frecuencias, db, frames };
}

// Envolvente mínimo/máximo por columna (para dibujar formas de onda largas).
export function envolventeMinMax(senal, columnas) {
  const min = new Float32Array(columnas), max = new Float32Array(columnas);
  const paso = senal.length / columnas;
  for (let c = 0; c < columnas; c++) {
    let lo = Infinity, hi = -Infinity;
    const a = Math.floor(c * paso), b = Math.max(a + 1, Math.floor((c + 1) * paso));
    for (let i = a; i < b && i < senal.length; i++) { if (senal[i] < lo) lo = senal[i]; if (senal[i] > hi) hi = senal[i]; }
    min[c] = lo === Infinity ? 0 : lo; max[c] = hi === -Infinity ? 0 : hi;
  }
  return { min, max };
}

// Recorrido físico (dentro de la sala) de una reflexión: la recta imagen → mic "plegada" en las paredes.
// Devuelve la polilínea [fuente, rebote1, …, mic].
export function caminoPlegado({ lx, ly, lz }, imagen, mic) {
  const L = [lx, ly, lz];
  const plegar = (v, l) => { const m = ((v % (2 * l)) + 2 * l) % (2 * l); return m > l ? 2 * l - m : m; };
  const ts = new Set([0, 1]);
  for (let k = 0; k < 3; k++) {
    const a = imagen[k], b = mic[k];
    if (a === b) continue;
    const lo = Math.min(a, b), hi = Math.max(a, b);
    for (let n = Math.ceil(lo / L[k]); n * L[k] <= hi; n++) {
      const t = (n * L[k] - a) / (b - a);
      if (t > 1e-12 && t < 1 - 1e-12) ts.add(t);
    }
  }
  return [...ts].sort((p, q) => p - q).map((t) =>
    [0, 1, 2].map((k) => plegar(imagen[k] + t * (mic[k] - imagen[k]), L[k])));
}

// RI sintética + ruido de fondo uniforme con pico en pisoDb (dB respecto del sonido directo).
export function riConRuido({ fs, t60, duracion, pisoDb, rng = ruidoUniforme }) {
  const ri = riSintetica({ fs, t60, duracion, rng });
  const a = Math.pow(10, pisoDb / 20);
  for (let i = 0; i < ri.length; i++) ri[i] += rng() * a;
  return ri;
}

// T30 sobre la integral de Schroeder, con control de validez frente al ruido de fondo:
// el ruido (estimado en el último 10 % de la RI) debe quedar al menos 10 dB por debajo
// de la energía de la curva en el tramo de −35 dB (criterio de la figura de NTi Audio).
export function evaluarT30(ri, fs) {
  const n = ri.length;
  const edc = edcDb(ri);
  const cola = Math.floor(n * 0.9);
  let ms = 0;
  for (let i = cola; i < n; i++) ms += ri[i] * ri[i];
  ms /= n - cola;
  let total = 0;
  for (let i = 0; i < n; i++) total += ri[i] * ri[i];
  const i35 = edc.findIndex((d) => d <= -35);
  if (i35 < 0) return { t30: null, valido: false, edc, motivo: 'T30 no válido: la curva no llega a −35 dB' };
  const energiaCurva = total * Math.pow(10, edc[i35] / 10);
  const energiaRuido = ms * (n - i35);
  if (10 * Math.log10(energiaCurva / energiaRuido) < 10) {
    return { t30: null, valido: false, edc, motivo: 'T30 no válido: en −35 dB el ruido de fondo está a menos de 10 dB de la curva' };
  }
  return { t30: tiempoReverberacion(edc, fs), valido: true, edc, motivo: '' };
}

// Tramos de evaluación de la ISO 3382-1 (dB por debajo del nivel inicial de la curva de Schroeder).
export const RANGOS = {
  EDT: { desde: 0, hasta: -10 },
  T10: { desde: -5, hasta: -15 },
  T20: { desde: -5, hasta: -25 },
  T30: { desde: -5, hasta: -35 },
};

// Nivel en dB (energía media en bloques de 10 ms) con el tiempo del centro de cada bloque.
function nivelesPorBloque(ri, fs, ms = 0.01) {
  const largo = Math.max(1, Math.round(fs * ms));
  const t = [], db = [];
  for (let i = 0; i + largo <= ri.length; i += largo) {
    let e = 0;
    for (let k = i; k < i + largo; k++) e += ri[k] * ri[k];
    t.push((i + largo / 2) / fs); db.push(10 * Math.log10(e / largo + 1e-20));
  }
  return { t, db };
}

// Ruido de fondo (dB) estimado en el último 10 % de la RI, y nivel inicial (máximo de los bloques).
function ruidoYPico(ri, fs) {
  const cola = Math.floor(ri.length * 0.9);
  let ms = 0;
  for (let i = cola; i < ri.length; i++) ms += ri[i] * ri[i];
  const ruido = 10 * Math.log10(ms / (ri.length - cola) + 1e-20);
  return { ruido, pico: Math.max(...nivelesPorBloque(ri, fs).db) };
}

// Punto de corte (muestra) donde el decaimiento se cruza con el ruido de fondo. Versión de una sola
// pasada de la idea de Lundeby: recta de regresión del nivel entre el máximo y 10 dB por encima
// del ruido, prolongada hasta el nivel del ruido.
export function puntoDeCorte(ri, fs) {
  const { t, db } = nivelesPorBloque(ri, fs);
  const { ruido } = ruidoYPico(ri, fs);
  const iMax = db.indexOf(Math.max(...db));
  let iFin = db.findIndex((d, i) => i > iMax && d <= ruido + 10);
  if (iFin < 0) iFin = db.length - 1;
  if (iFin - iMax < 3) return ri.length;
  const { pendiente, ordenada } = regresionLineal(t.slice(iMax, iFin), db.slice(iMax, iFin));
  if (!(pendiente < 0)) return ri.length;
  const tCruce = (ruido - ordenada) / pendiente;
  return Math.max(2, Math.min(ri.length, Math.round(tCruce * fs)));
}

// Tiempo de reverberación sobre la integral de Schroeder en el tramo [desdeDb, hastaDb], con la
// integral recortada en `corte` (muestras) si se indica. Validez según la ISO 3382-1: el ruido de
// fondo tiene que quedar al menos 10 dB por debajo del final del tramo (rango dinámico ≥ |hasta| + 10).
export function evaluarDecaimiento(ri, fs, { desdeDb = -5, hastaDb = -35, corte = null } = {}) {
  const n = corte ? Math.max(2, Math.min(ri.length, Math.round(corte))) : ri.length;
  const edc = edcDb(ri.subarray(0, n));
  const { ruido, pico } = ruidoYPico(ri, fs);
  const rangoDinamico = pico - ruido;
  const requerido = -hastaDb + 10;
  const base = { edc, rangoDinamico, requerido, tr: null, pendiente: null, ordenada: null };
  const x = [], y = [];
  for (let i = 0; i < edc.length; i++) if (edc[i] <= desdeDb && edc[i] >= hastaDb) { x.push(i / fs); y.push(edc[i]); }
  if (x.length < 3 || !edc.some((d) => d <= hastaDb)) {
    return { ...base, valido: false, motivo: `La curva no llega a ${hastaDb} dB: no se puede calcular.` };
  }
  const { pendiente, ordenada } = regresionLineal(x, y);
  const tr = -60 / pendiente;
  const valido = rangoDinamico >= requerido;
  const motivo = valido ? '' : `No válido: rango dinámico de ${Math.round(rangoDinamico)} dB; este tramo pide al menos ${requerido} dB (ISO 3382-1).`;
  return { ...base, tr, pendiente, ordenada, valido, motivo };
}
