// Escucha a ciegas: A/B entre audio seco y en sala; después se revelan forma de onda o espectro.
import { espectroPromedioDb, envolventeMinMax } from '../_comun/acustica.js';
import { cargarBuffer, crearCanal } from '../_comun/audio.js';
import { FUENTE, prepararCanvas, dibujarLeyenda, alCambiarAncho, paleta } from '../_comun/grafico.js';

const P = paleta();             // colores del tema (oscuro como la landing, o claro si se eligió en el sitio)
const COLOR = { seco: P.tinta, sala: P.violeta, eje: P.eje, grilla: P.grilla, fondo: P.papel };

function dibujarOnda(canvas, datos, fs, segundos, color, etiqueta) {
  const { g, W, H, compacto } = prepararCanvas(canvas, { aspecto: 0.12, min: 84, max: 120 });
  const tt = compacto ? 11 : 13, mid = (H - tt - 4) / 2;
  g.fillStyle = COLOR.fondo; g.fillRect(0, 0, W, H);
  g.strokeStyle = COLOR.grilla; g.lineWidth = 1;
  g.beginPath(); g.moveTo(0, mid); g.lineTo(W, mid); g.stroke();
  g.font = `500 ${tt}px ${FUENTE}`; g.fillStyle = COLOR.eje;
  for (let t = 0; t <= segundos; t += 5) {                 // marcas de tiempo compartidas
    const x = (t / segundos) * (W - 1);
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H - tt - 4); g.stroke();
    g.textAlign = t === 0 ? 'left' : t === segundos ? 'right' : 'center';
    g.fillText(`${t} s`, x, H - 3);
  }
  g.textAlign = 'left';
  const columnas = Math.max(1, Math.round(W * Math.min(1, datos.length / (fs * segundos))));
  const { min, max } = envolventeMinMax(datos, columnas);
  let pico = 1e-9;
  for (let i = 0; i < columnas; i++) pico = Math.max(pico, Math.abs(min[i]), Math.abs(max[i]));
  g.fillStyle = color;
  for (let x = 0; x < columnas; x++) {
    const y0 = mid - (max[x] / pico) * (mid - 3), y1 = mid - (min[x] / pico) * (mid - 3);
    g.fillRect(x, y0, 1, Math.max(1, y1 - y0));
  }
  g.font = `600 ${tt + 1}px ${FUENTE}`;
  g.fillStyle = COLOR.fondo; g.globalAlpha = 0.9;
  g.fillRect(3, 3, g.measureText(etiqueta).width + 10, tt + 8);
  g.globalAlpha = 1;
  g.fillStyle = color;
  g.fillText(etiqueta, 8, tt + 6);
}

function dibujarEspectros(canvas, curvas) {
  const { g, W, H, compacto } = prepararCanvas(canvas, { aspecto: 0.5, min: 240, max: 380 });
  const tt = compacto ? 11 : 13;
  g.fillStyle = COLOR.fondo; g.fillRect(0, 0, W, H);
  const altoLeyenda = dibujarLeyenda(g, curvas.map(({ color, etiqueta }) => [color, etiqueta]),
    { x0: compacto ? 40 : 56, y0: tt + 6, maxAncho: W - 60, tamano: tt });
  const m = { l: compacto ? 40 : 56, r: 10, t: altoLeyenda + 12, b: compacto ? 38 : 44 };
  const fmin = 50, fmax = 20000, dbmin = -90;
  const xf = (f) => m.l + (Math.log10(f / fmin) / Math.log10(fmax / fmin)) * (W - m.l - m.r);
  const yd = (d) => m.t + (d / dbmin) * (H - m.t - m.b);
  g.font = `500 ${tt}px ${FUENTE}`; g.fillStyle = COLOR.eje; g.strokeStyle = COLOR.grilla; g.lineWidth = 1;
  g.textAlign = 'center';
  for (const f of [100, 1000, 10000]) { g.beginPath(); g.moveTo(xf(f), m.t); g.lineTo(xf(f), H - m.b); g.stroke(); g.fillText(f >= 1000 ? `${f / 1000} kHz` : `${f} Hz`, xf(f), H - m.b + tt + 4); }
  g.textAlign = 'right';
  for (let d = 0; d >= dbmin; d -= 30) { g.beginPath(); g.moveTo(m.l, yd(d)); g.lineTo(W - m.r, yd(d)); g.stroke(); g.fillText(`${d}`, m.l - 5, yd(d) + 4); }
  g.textAlign = 'center'; g.font = `600 ${tt}px ${FUENTE}`;
  g.fillText('Frecuencia (escala logarítmica)', m.l + (W - m.l - m.r) / 2, H - 4);
  g.save(); g.translate(tt, m.t + (H - m.t - m.b) / 2); g.rotate(-Math.PI / 2); g.fillText('Nivel relativo (dB)', 0, 0); g.restore();
  g.textAlign = 'left';
  curvas.forEach(({ frecuencias, db, color }) => {
    g.strokeStyle = color; g.lineWidth = compacto ? 1.5 : 2; g.beginPath();
    let empezado = false;
    for (let k = 1; k < frecuencias.length; k++) {
      const f = frecuencias[k]; if (f < fmin || f > fmax) continue;
      const x = xf(f), y = yd(Math.max(db[k], dbmin));
      if (!empezado) { g.moveTo(x, y); empezado = true; } else g.lineTo(x, y);
    }
    g.stroke();
  });
}

export function crearEscucha(seccion, { pares, modo }) {
  const raiz = seccion.querySelector('.escucha');
  const canal = crearCanal();
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
        filas.forEach((f) => { f.querySelector('.estado').textContent = ''; });
        estado.textContent = 'Cargando…';
        try {
          await canal.reproducir(par[tipo], { alTerminar: () => { estado.textContent = ''; } });
          if (canal.sonando) estado.textContent = `Sonando ${b.dataset.cual}`;
        } catch (e) { estado.textContent = e.message; }
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
    if (modo === 'temporal' && i === 0) {
      const nota = document.createElement('p');
      nota.className = 'small';
      nota.textContent = 'Forma de onda (amplitud normalizada al pico) en función del tiempo; ambas con la misma escala de 0 a 15 s.';
      cont.appendChild(nota);
    }
    cont.hidden = false;                                  // visible antes de dibujar: se mide su ancho
    if (modo === 'temporal') {
      for (const [tipo, buf] of [['seco', seco], ['sala', sala]]) {
        const cv = document.createElement('canvas');
        cv.setAttribute('role', 'img');
        cv.setAttribute('aria-label', `Forma de onda: ${etiqueta(tipo)}`);
        cont.appendChild(cv);
        const dibujar = () => dibujarOnda(cv, buf.getChannelData(0), buf.sampleRate, 15, COLOR[tipo], etiqueta(tipo));
        dibujar(); alCambiarAncho(cv, dibujar);
      }
    } else {
      const cv = document.createElement('canvas');
      cv.setAttribute('role', 'img');
      cv.setAttribute('aria-label', 'Espectros promedio de las dos grabaciones, en dB');
      cont.appendChild(cv);
      const curvas = [['seco', seco], ['sala', sala]].map(([tipo, buf]) => ({
        ...espectroPromedioDb(buf.getChannelData(0), buf.sampleRate, 8192), color: COLOR[tipo], etiqueta: etiqueta(tipo),
      }));
      const dibujar = () => dibujarEspectros(cv, curvas);
      dibujar(); alCambiarAncho(cv, dibujar);
    }
    cont.hidden = false;
  }

  return {
    iniciar() {
      if (!construido) construir();
      asignacion = pares.map(() => (Math.random() < 0.5 ? { A: 'seco', B: 'sala' } : { A: 'sala', B: 'seco' }));
      filas.forEach((f) => { const c = f.querySelector('.graficos'); c.hidden = true; c.innerHTML = ''; f.querySelector('.estado').textContent = ''; });
    },
    detener() { canal.detener(); filas.forEach((f) => { f.querySelector('.estado').textContent = ''; }); },
  };
}
