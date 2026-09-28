// Escucha a ciegas: A/B entre audio seco y en sala; después se revelan forma de onda o espectro.
import { espectroPromedioDb, envolventeMinMax } from '../../_comun/acustica.js';
import { cargarBuffer, crearCanal } from '../../_comun/audio.js';

const COLOR = { seco: '#1B1830', sala: '#6B2FA3', eje: '#9A98AE', grilla: '#C9D6E2' };

function dibujarOnda(canvas, datos, fs, segundos, color, etiqueta) {
  const g = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height, mid = H / 2;
  g.clearRect(0, 0, W, H);
  g.strokeStyle = COLOR.grilla; g.lineWidth = 1;
  g.beginPath(); g.moveTo(0, mid); g.lineTo(W, mid); g.stroke();
  g.font = '500 16px Archivo, sans-serif'; g.fillStyle = COLOR.eje;
  for (let t = 0; t <= segundos; t += 5) {                 // marcas de tiempo compartidas
    const x = (t / segundos) * (W - 1);
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke();
    g.fillText(`${t} s`, Math.min(x + 4, W - 34), H - 6);
  }
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
  const W = canvas.width, H = canvas.height, m = { l: 96, r: 20, t: 20, b: 70 };
  const fmin = 50, fmax = 20000, dbmin = -90;
  const xf = (f) => m.l + (Math.log10(f / fmin) / Math.log10(fmax / fmin)) * (W - m.l - m.r);
  const yd = (d) => m.t + (d / dbmin) * (H - m.t - m.b);
  g.clearRect(0, 0, W, H);
  g.font = '500 20px Archivo, sans-serif'; g.fillStyle = COLOR.eje; g.strokeStyle = COLOR.grilla; g.lineWidth = 1;
  for (const f of [100, 1000, 10000]) { g.beginPath(); g.moveTo(xf(f), m.t); g.lineTo(xf(f), H - m.b); g.stroke(); g.fillText(f >= 1000 ? `${f / 1000} kHz` : `${f} Hz`, xf(f) - 24, H - m.b + 26); }
  for (let d = 0; d >= dbmin; d -= 30) { g.beginPath(); g.moveTo(m.l, yd(d)); g.lineTo(W - m.r, yd(d)); g.stroke(); g.fillText(`${d}`, m.l - 44, yd(d) + 6); }
  g.fillStyle = COLOR.eje; g.font = '600 20px Archivo, sans-serif';
  g.fillText('Frecuencia (Hz, escala logarítmica)', m.l + (W - m.l - m.r) / 2 - 170, H - 8);
  g.save(); g.translate(20, m.t + (H - m.t - m.b) / 2 + 90); g.rotate(-Math.PI / 2); g.fillText('Nivel relativo (dB)', 0, 0); g.restore();
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
    if (modo === 'temporal') {
      const nota = document.createElement('p');
      nota.className = 'small';
      nota.textContent = 'Forma de onda (amplitud normalizada al pico) en función del tiempo; ambas con la misma escala de 0 a 15 s.';
      cont.appendChild(nota);
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
    detener() { canal.detener(); filas.forEach((f) => { f.querySelector('.estado').textContent = ''; }); },
  };
}
