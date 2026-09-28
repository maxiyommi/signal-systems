// Curva de caída interactiva: nivel instantáneo, integral de Schroeder, tramo −5…−35 dB,
// recta de regresión y piso de ruido ajustable (muestra cuándo T30 deja de ser válido).
import { riConRuido, edcDb, evaluarT30, regresionLineal } from '../../_comun/acustica.js';

const COL = { tinta: '#1B1830', violeta: '#6B2FA3', senal: '#1E88C9', grilla: '#C9D6E2', papel: '#F7FAFC', tenue: '#9A98AE', mal: '#B3261E' };

export function crearCaida(seccion, { fs = 8000, t60 = 1.2, duracion = 2.5 } = {}) {
  const raiz = seccion.querySelector('.curva');
  let ui = null, pisoDb = -60;

  function construir() {
    raiz.innerHTML = `
      <canvas width="1100" height="500" aria-label="Curva de caída con integral de Schroeder"></canvas>
      <div class="controles">
        <label>Ruido de fondo
          <input type="range" min="-80" max="-20" step="5" value="${pisoDb}">
        </label>
        <output></output>
        <span class="resultado" aria-live="polite"></span>
      </div>`;
    ui = { cv: raiz.querySelector('canvas'), piso: raiz.querySelector('input'), out: raiz.querySelector('output'), res: raiz.querySelector('.resultado') };
    ui.piso.addEventListener('input', () => { pisoDb = Number(ui.piso.value); dibujar(); });
  }

  function dibujar() {
    const ri = riConRuido({ fs, t60, duracion, pisoDb, rng: semilla(11) });
    const edc = edcDb(ri);
    const r = evaluarT30(edc, fs, pisoDb);
    const cv = ui.cv, g = cv.getContext('2d');
    const W = cv.width, H = cv.height, m = { l: 90, r: 20, t: 44, b: 66 }, dbMin = -80;
    const xt = (t) => m.l + (t / duracion) * (W - m.l - m.r);
    const yd = (d) => m.t + (Math.max(dbMin, Math.min(0, d)) / dbMin) * (H - m.t - m.b);
    g.clearRect(0, 0, W, H);
    g.fillStyle = COL.papel; g.fillRect(0, 0, W, H);
    g.font = '500 18px Archivo, sans-serif'; g.fillStyle = COL.tenue; g.strokeStyle = COL.grilla; g.lineWidth = 1;
    for (let t = 0; t <= duracion + 1e-9; t += 0.5) { g.beginPath(); g.moveTo(xt(t), m.t); g.lineTo(xt(t), H - m.b); g.stroke(); g.fillText(`${t}`, xt(t) - 8, H - m.b + 22); }
    for (let d = 0; d >= dbMin; d -= 20) { g.beginPath(); g.moveTo(m.l, yd(d)); g.lineTo(W - m.r, yd(d)); g.stroke(); g.fillText(`${d}`, m.l - 40, yd(d) + 6); }
    g.font = '600 18px Archivo, sans-serif';
    g.fillText('Tiempo (s)', m.l + (W - m.l - m.r) / 2 - 40, H - 8);
    g.save(); g.translate(20, m.t + (H - m.t - m.b) / 2 + 60); g.rotate(-Math.PI / 2); g.fillText('Nivel (dB)', 0, 0); g.restore();
    [[COL.tenue, 'Nivel instantáneo'], [COL.violeta, 'Integral de Schroeder'], [COL.tinta, 'Regresión −5…−35 dB'], [COL.senal, 'Ruido de fondo']]
      .forEach(([c, t], i) => { const x = m.l + 8 + i * 245; g.fillStyle = c; g.fillRect(x, 16, 26, 10); g.fillStyle = COL.tinta; g.fillText(t, x + 34, 27); });
    g.font = '500 18px Archivo, sans-serif';

    // nivel instantáneo suavizado (10 ms)
    const ventana = Math.round(fs * 0.01);
    g.strokeStyle = COL.tenue; g.lineWidth = 1; g.beginPath();
    let acc = 0;
    for (let i = 0; i < ri.length; i++) {
      acc += ri[i] * ri[i];
      if (i >= ventana) acc -= ri[i - ventana] * ri[i - ventana];
      if (i % 20 === 0) { const d = 10 * Math.log10(acc / ventana + 1e-20); i === 0 ? g.moveTo(xt(i / fs), yd(d)) : g.lineTo(xt(i / fs), yd(d)); }
    }
    g.stroke();

    // piso de ruido
    g.setLineDash([8, 8]); g.strokeStyle = COL.senal; g.lineWidth = 2;
    g.beginPath(); g.moveTo(m.l, yd(pisoDb)); g.lineTo(W - m.r, yd(pisoDb)); g.stroke();

    // referencias −5 y −35 dB
    g.strokeStyle = COL.tenue; g.lineWidth = 1;
    for (const d of [-5, -35]) { g.beginPath(); g.moveTo(m.l, yd(d)); g.lineTo(W - m.r, yd(d)); g.stroke(); }
    g.setLineDash([]);

    // integral de Schroeder
    g.strokeStyle = COL.violeta; g.lineWidth = 4; g.beginPath();
    for (let i = 0; i < edc.length; i += 10) { i === 0 ? g.moveTo(xt(i / fs), yd(edc[i])) : g.lineTo(xt(i / fs), yd(edc[i])); }
    g.stroke();

    // recta de regresión del tramo −5…−35 dB extendida a −60 dB
    if (r.valido) {
      const x = [], y = [];
      for (let i = 0; i < edc.length; i++) if (edc[i] <= -5 && edc[i] >= -35) { x.push(i / fs); y.push(edc[i]); }
      const { pendiente, ordenada } = regresionLineal(x, y);
      const tFin = (-60 - ordenada) / pendiente;
      g.strokeStyle = COL.tinta; g.lineWidth = 2;
      g.beginPath(); g.moveTo(xt(0), yd(ordenada)); g.lineTo(xt(Math.min(tFin, duracion)), yd(ordenada + pendiente * Math.min(tFin, duracion))); g.stroke();
    }

    ui.out.textContent = `${pisoDb} dB`;
    ui.res.textContent = r.valido ? `T30 = ${r.t30.toFixed(2)} s (la sala simulada tiene T60 = ${t60.toFixed(1)} s)` : r.motivo;
    ui.res.style.color = r.valido ? COL.tinta : COL.mal;
  }

  return {
    iniciar() { if (!ui) construir(); dibujar(); },
    detener() {},
  };
}

// Generador pseudoaleatorio con semilla: la curva no "tiembla" al mover el control.
function semilla(s) { return () => { s = (s * 16807) % 2147483647; return (s / 2147483647) * 2 - 1; }; }
