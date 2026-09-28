// Escucha a ciegas: A/B entre audio seco y en sala; después se revelan forma de onda o espectro.
import { espectroPromedioDb, envolventeMinMax } from '../../_comun/acustica.js';

let ctx = null;
let fuenteActual = null;
const buffers = new Map();

export function obtenerContexto() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

export async function cargarBuffer(url) {
  if (!buffers.has(url)) {
    buffers.set(url, fetch(url)
      .then((r) => { if (!r.ok) throw new Error(`No se pudo cargar ${url} (${r.status})`); return r.arrayBuffer(); })
      .then((ab) => obtenerContexto().decodeAudioData(ab)));
  }
  return buffers.get(url);
}

export function detenerAudio() {
  if (fuenteActual) { try { fuenteActual.stop(); } catch { /* ya detenida */ } fuenteActual = null; }
}

export async function reproducir(url, destino = null) {
  const c = obtenerContexto();
  await c.resume();                       // el navegador exige un gesto del usuario
  detenerAudio();
  const buf = await cargarBuffer(url);
  const src = c.createBufferSource();
  src.buffer = buf;
  src.connect(destino || c.destination);
  src.onended = () => { if (fuenteActual === src) fuenteActual = null; };
  src.start();
  fuenteActual = src;
  return src;
}

const COLOR = { seco: '#1B1830', sala: '#6B2FA3', eje: '#9A98AE', grilla: '#C9D6E2' };

function dibujarOnda(canvas, datos, fs, segundos, color, etiqueta) {
  const g = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height, mid = H / 2;
  g.clearRect(0, 0, W, H);
  g.strokeStyle = COLOR.grilla; g.lineWidth = 1;
  g.beginPath(); g.moveTo(0, mid); g.lineTo(W, mid); g.stroke();
  const columnas = Math.round(W * Math.min(1, datos.length / (fs * segundos)));
  const { min, max } = envolventeMinMax(datos, columnas);
  let pico = 1e-9;
  for (let i = 0; i < columnas; i++) pico = Math.max(pico, Math.abs(min[i]), Math.abs(max[i]));
  g.fillStyle = color;
  for (let x = 0; x < columnas; x++) {
    const y0 = mid - (max[x] / pico) * (mid - 4), y1 = mid - (min[x] / pico) * (mid - 4);
    g.fillRect(x, y0, 1, Math.max(1, y1 - y0));
  }
  g.font = '600 22px Archivo, sans-serif';
  g.fillStyle = 'rgba(247, 250, 252, 0.9)';
  g.fillRect(4, 4, g.measureText(etiqueta).width + 12, 30);
  g.fillStyle = color;
  g.fillText(etiqueta, 10, 26);
}

function dibujarEspectros(canvas, curvas) {
  const g = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height, m = { l: 70, r: 20, t: 20, b: 50 };
  const fmin = 50, fmax = 20000, dbmin = -90;
  const xf = (f) => m.l + (Math.log10(f / fmin) / Math.log10(fmax / fmin)) * (W - m.l - m.r);
  const yd = (d) => m.t + (d / dbmin) * (H - m.t - m.b);
  g.clearRect(0, 0, W, H);
  g.font = '500 20px Archivo, sans-serif'; g.fillStyle = COLOR.eje; g.strokeStyle = COLOR.grilla; g.lineWidth = 1;
  for (const f of [100, 1000, 10000]) { g.beginPath(); g.moveTo(xf(f), m.t); g.lineTo(xf(f), H - m.b); g.stroke(); g.fillText(f >= 1000 ? `${f / 1000} kHz` : `${f} Hz`, xf(f) - 24, H - 18); }
  for (let d = 0; d >= dbmin; d -= 30) { g.beginPath(); g.moveTo(m.l, yd(d)); g.lineTo(W - m.r, yd(d)); g.stroke(); g.fillText(`${d} dB`, 4, yd(d) + 6); }
  curvas.forEach(({ frecuencias, db, color, etiqueta }, i) => {
    g.strokeStyle = color; g.lineWidth = 3; g.beginPath();
    let empezado = false;
    for (let k = 1; k < frecuencias.length; k++) {
      const f = frecuencias[k]; if (f < fmin || f > fmax) continue;
      const x = xf(f), y = yd(Math.max(db[k], dbmin));
      if (!empezado) { g.moveTo(x, y); empezado = true; } else g.lineTo(x, y);
    }
    g.stroke();
    g.fillStyle = color; g.font = '600 22px Archivo, sans-serif';
    g.fillText(etiqueta, W - m.r - 260, m.t + 30 + i * 30);
  });
}

export function crearEscucha(seccion, { pares, modo }) {
  const raiz = seccion.querySelector('.escucha');
  let construido = false;
  let asignacion = [];                    // por par: { A: 'seco'|'sala', B: ... }
  const filas = [];

  function construir() {
    pares.forEach((par, i) => {
      const fila = document.createElement('div');
      fila.className = 'escucha-fila';
      fila.innerHTML = `
        <div class="controles">
          <strong>${par.nombre}</strong>
          <button type="button" data-cual="A">Escuchar A</button>
          <button type="button" data-cual="B">Escuchar B</button>
          <button type="button" data-accion="revelar">Revelar</button>
          <span class="estado small" aria-live="polite"></span>
        </div>
        <div class="graficos" hidden></div>`;
      raiz.appendChild(fila);
      const estado = fila.querySelector('.estado');
      fila.querySelectorAll('button[data-cual]').forEach((b) => b.addEventListener('click', async () => {
        const tipo = asignacion[i][b.dataset.cual];
        estado.textContent = 'Cargando…';
        try { await reproducir(par[tipo]); estado.textContent = `Sonando ${b.dataset.cual}`; }
        catch (e) { estado.textContent = e.message; }
      }));
      fila.querySelector('[data-accion="revelar"]').addEventListener('click', () => revelar(i).catch((e) => { estado.textContent = e.message; }));
      filas.push(fila);
    });
    construido = true;
  }

  async function revelar(i) {
    const par = pares[i], fila = filas[i], cont = fila.querySelector('.graficos');
    const [seco, sala] = await Promise.all([cargarBuffer(par.seco), cargarBuffer(par.sala)]);
    const etiqueta = (tipo) => `${Object.keys(asignacion[i]).find((k) => asignacion[i][k] === tipo)} · ${tipo === 'seco' ? 'sin sala (anecoica)' : 'en la sala'}`;
    cont.innerHTML = '';
    if (modo === 'temporal') {
      for (const [tipo, buf] of [['seco', seco], ['sala', sala]]) {
        const cv = document.createElement('canvas'); cv.width = 1000; cv.height = 110;
        cont.appendChild(cv);
        dibujarOnda(cv, buf.getChannelData(0), buf.sampleRate, 15, COLOR[tipo], etiqueta(tipo));
      }
    } else {
      const cv = document.createElement('canvas'); cv.width = 1000; cv.height = 460;
      cont.appendChild(cv);
      dibujarEspectros(cv, [['seco', seco], ['sala', sala]].map(([tipo, buf]) => ({
        ...espectroPromedioDb(buf.getChannelData(0), buf.sampleRate, 8192), color: COLOR[tipo], etiqueta: etiqueta(tipo),
      })));
    }
    cont.hidden = false;
  }

  return {
    iniciar() {
      if (!construido) construir();
      asignacion = pares.map(() => (Math.random() < 0.5 ? { A: 'seco', B: 'sala' } : { A: 'sala', B: 'seco' }));
      filas.forEach((f) => { const c = f.querySelector('.graficos'); c.hidden = true; c.innerHTML = ''; f.querySelector('.estado').textContent = ''; });
    },
    detener() { detenerAudio(); },
  };
}
