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
