// Lógica acústica pura para las presentaciones (sin DOM). Unidades SI.

export function sabineT60({ lx, ly, lz }, alpha) {
  const V = lx * ly * lz;
  const S = 2 * (lx * ly + lx * lz + ly * lz);
  return (0.161 * V) / (alpha * S);
}

export function riSintetica({ fs, t60, duracion, rng = Math.random }) {
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
    return { t: d / c, amp: Math.pow(1 - alpha, orden) / d, orden, pos };
  });
  lista.sort((a, b) => a.t - b.t);
  const ref = lista.find(l => l.orden === 0).amp;
  return lista.map(({ t, amp, orden, pos }) => ({ t, amp: amp / ref, orden, pos }));
}

// FFT radix-2 in place (re, im de largo potencia de 2).
function fft(re, im) {
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
