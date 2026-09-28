// Curva de caída interactiva: nivel instantáneo, integral de Schroeder, tramo −5…−35 dB,
// recta de regresión y piso de ruido ajustable (muestra cuándo T30 deja de ser válido).
import { riConRuido, evaluarT30, regresionLineal } from '../_comun/acustica.js';
import { FUENTE, prepararCanvas, dibujarLeyenda, alCambiarAncho } from '../_comun/grafico.js';

const COL = { tinta: '#1B1830', violeta: '#6B2FA3', senal: '#1E88C9', grilla: '#C9D6E2', papel: '#F7FAFC', tenue: '#9A98AE', mal: '#B3261E' };

export function crearCaida(seccion, { fs = 8000, t60 = 1.2, duracion = 2.5 } = {}) {
  const raiz = seccion.querySelector('.curva');
  let ui = null, pisoDb = -60;

  function construir() {
    raiz.innerHTML = `
      <canvas aria-label="Curva de caída con integral de Schroeder"></canvas>
      <div class="controles">
        <label>Ruido de fondo
          <input type="range" min="-80" max="-20" step="5" value="${pisoDb}" aria-label="Nivel del ruido de fondo">
        </label>
        <output></output>
        <span class="resultado" aria-live="polite"></span>
      </div>`;
    ui = { cv: raiz.querySelector('canvas'), piso: raiz.querySelector('input'), out: raiz.querySelector('output'), res: raiz.querySelector('.resultado') };
    ui.piso.addEventListener('input', () => { pisoDb = Number(ui.piso.value); dibujar(); });
    alCambiarAncho(ui.cv, dibujar);
  }

  function dibujar() {
    const ri = riConRuido({ fs, t60, duracion, pisoDb, rng: semilla(11) });
    const r = evaluarT30(ri, fs);
    const { edc } = r;
    const pisoRms = pisoDb - 10 * Math.log10(3);          // ruido uniforme: rms = pico / √3
    const { g, W, H, compacto } = prepararCanvas(ui.cv, { aspecto: 0.55, min: 280, max: 460 });
    const tt = compacto ? 11 : 13;                                   // tamaño de texto en px reales
    g.fillStyle = COL.papel; g.fillRect(0, 0, W, H);
    const altoLeyenda = dibujarLeyenda(g, [[COL.tenue, 'Nivel instantáneo'], [COL.violeta, 'Integral de Schroeder'], [COL.tinta, 'Regresión −5…−35 dB'], [COL.senal, 'Ruido de fondo']],
      { x0: compacto ? 36 : 56, y0: tt + 6, maxAncho: W - (compacto ? 44 : 70), tamano: tt });
    const m = { l: compacto ? 36 : 56, r: 10, t: altoLeyenda + 14, b: compacto ? 38 : 44 }, dbMin = -80;
    const xt = (t) => m.l + (t / duracion) * (W - m.l - m.r);
    const yd = (d) => m.t + (Math.max(dbMin, Math.min(0, d)) / dbMin) * (H - m.t - m.b);
    g.font = `500 ${tt}px ${FUENTE}`; g.fillStyle = COL.tenue; g.strokeStyle = COL.grilla; g.lineWidth = 1;
    g.textAlign = 'center';
    for (let t = 0; t <= duracion + 1e-9; t += 0.5) { g.beginPath(); g.moveTo(xt(t), m.t); g.lineTo(xt(t), H - m.b); g.stroke(); g.fillText(`${t}`, xt(t), H - m.b + tt + 4); }
    g.textAlign = 'right';
    for (let d = 0; d >= dbMin; d -= 20) { g.beginPath(); g.moveTo(m.l, yd(d)); g.lineTo(W - m.r, yd(d)); g.stroke(); g.fillText(`${d}`, m.l - 5, yd(d) + 4); }
    g.textAlign = 'center';
    g.font = `600 ${tt}px ${FUENTE}`;
    g.fillText('Tiempo (s)', m.l + (W - m.l - m.r) / 2, H - 4);
    g.save(); g.translate(tt, m.t + (H - m.t - m.b) / 2); g.rotate(-Math.PI / 2); g.fillText('Nivel (dB)', 0, 0); g.restore();
    g.textAlign = 'left';

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
    g.setLineDash([6, 6]); g.strokeStyle = COL.senal; g.lineWidth = 2;
    g.beginPath(); g.moveTo(m.l, yd(pisoRms)); g.lineTo(W - m.r, yd(pisoRms)); g.stroke();

    // referencias −5 y −35 dB
    g.strokeStyle = COL.tenue; g.lineWidth = 1;
    for (const d of [-5, -35]) { g.beginPath(); g.moveTo(m.l, yd(d)); g.lineTo(W - m.r, yd(d)); g.stroke(); }
    g.setLineDash([]);

    // integral de Schroeder
    g.strokeStyle = COL.violeta; g.lineWidth = compacto ? 2.5 : 3.5; g.beginPath();
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

    ui.out.textContent = `${Math.round(pisoRms)} dB`;
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
