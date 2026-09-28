// Curva de caída interactiva: nivel instantáneo, integral de Schroeder, tramo de evaluación y recta de
// regresión. Se ajustan el T60 de la sala, el ruido de fondo, el parámetro (EDT, T10, T20, T30) y dónde
// se corta la integral (sin cortar, automático estilo Lundeby o a mano, arrastrando sobre el gráfico).
import { riConRuido, evaluarDecaimiento, puntoDeCorte, RANGOS } from '../_comun/acustica.js';
import { FUENTE, prepararCanvas, dibujarLeyenda, alCambiarAncho, paleta } from '../_comun/grafico.js';

const COL = paleta();           // colores del tema (oscuro como la landing, o claro si se eligió en el sitio)
const FS = 8000;

export function crearCaida(seccion) {
  const raiz = seccion.querySelector('.curva');
  const estado = { t60: 1.2, pisoDb: -60, parametro: 'T30', corte: 'ninguno', corteManual: 1.0, semilla: 11, verNivel: true };
  let ui = null, datos = null, geo = null;

  const segmentado = (nombre, opciones, actual) => `
    <div class="segmentado" role="group" aria-label="${nombre}">
      ${opciones.map(([v, t]) => `<button type="button" data-${nombre}="${v}" aria-pressed="${v === actual}">${t}</button>`).join('')}
    </div>`;

  function construir() {
    raiz.innerHTML = `
      <canvas role="img" aria-label="Curva de caída con integral de Schroeder"></canvas>
      <div class="parametros">
        <fieldset>
          <legend>La sala</legend>
          <label>T60 de la sala <input type="range" data-p="t60" min="0.3" max="3" step="0.1" value="${estado.t60}"><output data-o="t60"></output></label>
          <label>Ruido de fondo <input type="range" data-p="pisoDb" min="-90" max="-20" step="1" value="${estado.pisoDb}"><output data-o="pisoDb"></output></label>
          <button type="button" class="boton-chico" data-accion="realizacion">Otra realización del ruido</button>
        </fieldset>
        <fieldset>
          <legend>Qué se calcula</legend>
          ${segmentado('parametro', Object.keys(RANGOS).map((k) => [k, k]), estado.parametro)}
          <p class="small" data-o="tramo"></p>
        </fieldset>
        <fieldset>
          <legend>Dónde se corta la integral</legend>
          ${segmentado('corte', [['ninguno', 'Sin cortar'], ['auto', 'Automático'], ['manual', 'A mano']], estado.corte)}
          <label data-manual>Cortar en <input type="range" data-p="corteManual" min="0.1" max="5" step="0.05" value="${estado.corteManual}"><output data-o="corteManual"></output></label>
          <p class="small" data-manual>También podés arrastrar la línea de corte sobre el gráfico.</p>
        </fieldset>
        <fieldset>
          <legend>Mostrar</legend>
          <label class="casilla"><input type="checkbox" data-ver="verNivel" checked> Nivel instantáneo</label>
        </fieldset>
      </div>
      <div class="resultados" aria-live="polite"></div>`;
    ui = {
      cv: raiz.querySelector('canvas'),
      res: raiz.querySelector('.resultados'),
      out: (k) => raiz.querySelector(`[data-o="${k}"]`),
    };
    raiz.querySelectorAll('input[type="range"][data-p]').forEach((inp) => inp.addEventListener('input', () => {
      estado[inp.dataset.p] = Number(inp.value);
      if (inp.dataset.p === 'corteManual') estado.corte = 'manual';
      calcular(inp.dataset.p !== 'corteManual');
    }));
    raiz.querySelectorAll('[data-parametro]').forEach((b) => b.addEventListener('click', () => { estado.parametro = b.dataset.parametro; calcular(false); }));
    raiz.querySelectorAll('[data-corte]').forEach((b) => b.addEventListener('click', () => { estado.corte = b.dataset.corte; calcular(false); }));
    raiz.querySelector('[data-accion="realizacion"]').addEventListener('click', () => { estado.semilla = ((estado.semilla * 7 + 3) % 9973) + 1; calcular(true); });
    raiz.querySelector('[data-ver="verNivel"]').addEventListener('change', (e) => { estado.verNivel = e.target.checked; dibujar(); });

    // Arrastrar la línea de corte sobre el gráfico (pasa a modo "a mano").
    let arrastrando = false;
    const aTiempo = (ev) => {
      if (!geo) return null;
      const r = ui.cv.getBoundingClientRect();
      return Math.max(0.05, Math.min(geo.duracion, geo.tDeX(ev.clientX - r.left)));
    };
    ui.cv.style.touchAction = 'pan-y';
    ui.cv.addEventListener('pointerdown', (ev) => {
      const t = aTiempo(ev); if (t == null) return;
      const cerca = Math.abs(geo.xt(corteActual() / FS) - (ev.clientX - ui.cv.getBoundingClientRect().left)) < 24;
      if (estado.corte !== 'manual' && !cerca) return;
      arrastrando = true; ui.cv.setPointerCapture(ev.pointerId);
      estado.corte = 'manual'; estado.corteManual = t; calcular(false);
    });
    ui.cv.addEventListener('pointermove', (ev) => {
      if (!arrastrando) return;
      const t = aTiempo(ev); if (t == null) return;
      estado.corteManual = t; calcular(false);
    });
    for (const tipo of ['pointerup', 'pointercancel', 'lostpointercapture']) ui.cv.addEventListener(tipo, () => { arrastrando = false; });
    alCambiarAncho(ui.cv, dibujar);
  }

  const duracion = () => Math.max(2.5, Math.ceil(estado.t60 * 2 * 2) / 2);
  function corteActual() {
    if (!datos) return null;
    if (estado.corte === 'auto') return datos.corteAuto;
    if (estado.corte === 'manual') return Math.round(Math.min(estado.corteManual, duracion()) * FS);
    return null;
  }

  // nuevaRI: hay que regenerar la RI (cambió la sala o el ruido); si no, solo se recalcula la evaluación.
  function calcular(nuevaRI) {
    if (nuevaRI || !datos) {
      const ri = riConRuido({ fs: FS, t60: estado.t60, duracion: duracion(), pisoDb: estado.pisoDb, rng: semilla(estado.semilla) });
      datos = { ri, corteAuto: puntoDeCorte(ri, FS) };
    }
    const corte = corteActual();
    datos.evals = Object.fromEntries(Object.entries(RANGOS).map(([k, { desde, hasta }]) =>
      [k, evaluarDecaimiento(datos.ri, FS, { desdeDb: desde, hastaDb: hasta, corte })]));
    const { desde, hasta } = RANGOS[estado.parametro];
    datos.sinCorte = corte ? evaluarDecaimiento(datos.ri, FS, { desdeDb: desde, hastaDb: hasta }) : null;   // para comparar
    actualizarControles();
    dibujar();
  }

  // Porcentaje con signo, sin "-0 %".
  const pct = (v) => { const r = Math.round(v); return `${r > 0 ? '+' : ''}${r === 0 ? 0 : r} %`; };

  function actualizarControles() {
    const pisoRms = estado.pisoDb - 10 * Math.log10(3);          // ruido uniforme: rms = pico / √3
    ui.out('t60').textContent = `${estado.t60.toFixed(1)} s`;
    ui.out('pisoDb').textContent = `${Math.round(pisoRms)} dB`;
    ui.out('corteManual').textContent = `${Math.min(estado.corteManual, duracion()).toFixed(2)} s`;
    raiz.querySelector('input[data-p="corteManual"]').max = String(duracion());
    raiz.querySelector('input[data-p="corteManual"]').value = String(estado.corteManual);
    const { desde, hasta } = RANGOS[estado.parametro];
    ui.out('tramo').textContent = `Tramo de ${desde} a ${hasta} dB de la integral de Schroeder; la pendiente se extrapola a −60 dB.`;
    raiz.querySelectorAll('[data-parametro]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.parametro === estado.parametro)));
    raiz.querySelectorAll('[data-corte]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.corte === estado.corte)));
    raiz.querySelectorAll('[data-manual]').forEach((el) => { el.hidden = estado.corte !== 'manual'; });

    const e = datos.evals[estado.parametro];
    const error = e.tr != null ? (100 * (e.tr - estado.t60)) / estado.t60 : null;
    const fila = ([k, v]) => `<tr class="${k === estado.parametro ? 'actual' : ''}">
        <th scope="row">${k}</th><td>${v.tr != null ? `${v.tr.toFixed(2)} s` : '—'}</td>
        <td>${v.tr != null ? pct((100 * (v.tr - estado.t60)) / estado.t60) : '—'}</td>
        <td>${v.requerido} dB</td><td class="${v.valido ? 'ok' : 'mal'}">${v.valido ? 'Válido' : 'No válido'}</td></tr>`;
    const corte = corteActual();
    ui.res.innerHTML = `
      <p class="resultado ${e.valido ? '' : 'mal'}"><strong>${estado.parametro} = ${e.tr != null ? `${e.tr.toFixed(2)} s` : '—'}</strong>
        ${error != null ? ` · error ${pct(error)} respecto del T60 de la sala (${estado.t60.toFixed(1)} s)` : ''}
        ${e.valido ? '' : `<br><span class="small">${e.motivo}</span>`}</p>
      <p class="small">Rango dinámico: <strong>${Math.round(e.rangoDinamico)} dB</strong>${corte ? ` · integral cortada en ${(corte / FS).toFixed(2)} s` : ' · integral sin cortar'}${datos.sinCorte?.tr != null ? ` (sin cortar daría ${datos.sinCorte.tr.toFixed(2)} s)` : ''}.</p>
      <table class="tabla-resultados">
        <thead><tr><th>Parámetro</th><th>Valor</th><th>Error</th><th>Rango pedido</th><th>ISO 3382</th></tr></thead>
        <tbody>${Object.entries(datos.evals).map(fila).join('')}</tbody>
      </table>`;
  }

  function dibujar() {
    if (!datos) return;
    const dur = duracion();
    const { ri } = datos;
    const e = datos.evals[estado.parametro];
    const { desde, hasta } = RANGOS[estado.parametro];
    const corte = corteActual();
    const pisoRms = estado.pisoDb - 10 * Math.log10(3);
    const { g, W, H, compacto } = prepararCanvas(ui.cv, { aspecto: 0.5, min: 280, max: 440 });
    const tt = compacto ? 11 : 13;
    g.fillStyle = COL.papel; g.fillRect(0, 0, W, H);
    const leyenda = [[COL.violeta, 'Integral de Schroeder'], [COL.tinta, `Regresión (${estado.parametro})`], [COL.senal, 'Ruido de fondo']];
    if (estado.verNivel) leyenda.unshift([COL.tenue, 'Nivel instantáneo']);
    if (corte) leyenda.push([COL.eje, 'Sin cortar (comparación)']);
    const altoLeyenda = dibujarLeyenda(g, leyenda, { x0: compacto ? 36 : 56, y0: tt + 6, maxAncho: W - (compacto ? 44 : 70), tamano: tt });
    const m = { l: compacto ? 36 : 56, r: 12, t: altoLeyenda + 14, b: compacto ? 38 : 44 }, dbMin = -90;
    const xt = (t) => m.l + (t / dur) * (W - m.l - m.r);
    const yd = (d) => m.t + (Math.max(dbMin, Math.min(0, d)) / dbMin) * (H - m.t - m.b);
    geo = { xt, duracion: dur, tDeX: (x) => ((x - m.l) / (W - m.l - m.r)) * dur };

    // tramo de evaluación sombreado
    g.fillStyle = COL.violeta; g.globalAlpha = 0.1;
    g.fillRect(m.l, yd(desde), W - m.l - m.r, yd(hasta) - yd(desde));
    g.globalAlpha = 1;

    g.font = `500 ${tt}px ${FUENTE}`; g.fillStyle = COL.eje; g.strokeStyle = COL.grilla; g.lineWidth = 1;
    g.textAlign = 'center';
    const paso = dur > 4 ? 1 : 0.5;
    for (let t = 0; t <= dur + 1e-9; t += paso) { g.beginPath(); g.moveTo(xt(t), m.t); g.lineTo(xt(t), H - m.b); g.stroke(); g.fillText(`${t}`, xt(t), H - m.b + tt + 4); }
    g.textAlign = 'right';
    for (let d = 0; d >= dbMin; d -= 15) { g.beginPath(); g.moveTo(m.l, yd(d)); g.lineTo(W - m.r, yd(d)); g.stroke(); g.fillText(`${d}`, m.l - 5, yd(d) + 4); }
    g.textAlign = 'center';
    g.font = `600 ${tt}px ${FUENTE}`;
    g.fillText('Tiempo (s)', m.l + (W - m.l - m.r) / 2, H - 4);
    g.save(); g.translate(tt, m.t + (H - m.t - m.b) / 2); g.rotate(-Math.PI / 2); g.fillText('Nivel (dB)', 0, 0); g.restore();
    g.textAlign = 'left';

    if (estado.verNivel) {                                     // nivel instantáneo suavizado (10 ms)
      const ventana = Math.round(FS * 0.01);
      g.strokeStyle = COL.tenue; g.lineWidth = 1; g.beginPath();
      let acc = 0;
      for (let i = 0; i < ri.length; i++) {
        acc += ri[i] * ri[i];
        if (i >= ventana) acc -= ri[i - ventana] * ri[i - ventana];
        if (i % 20 === 0) { const d = 10 * Math.log10(acc / ventana + 1e-20); i === 0 ? g.moveTo(xt(i / FS), yd(d)) : g.lineTo(xt(i / FS), yd(d)); }
      }
      g.stroke();
    }

    g.setLineDash([6, 6]); g.strokeStyle = COL.senal; g.lineWidth = 2;   // piso de ruido
    g.beginPath(); g.moveTo(m.l, yd(pisoRms)); g.lineTo(W - m.r, yd(pisoRms)); g.stroke();
    g.setLineDash([]);

    const curva = (edc, color, ancho, guiones = []) => {
      g.setLineDash(guiones); g.strokeStyle = color; g.lineWidth = ancho; g.beginPath();
      for (let i = 0; i < edc.length; i += 10) { i === 0 ? g.moveTo(xt(i / FS), yd(edc[i])) : g.lineTo(xt(i / FS), yd(edc[i])); }
      g.stroke(); g.setLineDash([]);
    };
    if (corte && datos.sinCorte) curva(datos.sinCorte.edc, COL.eje, 1.5, [4, 4]);
    curva(e.edc, COL.violeta, compacto ? 2.5 : 3.5);

    if (e.tr != null) {                                         // recta de regresión extendida a −60 dB
      const tFin = Math.min((-60 - e.ordenada) / e.pendiente, dur);
      g.strokeStyle = COL.tinta; g.lineWidth = 2;
      g.beginPath(); g.moveTo(xt(0), yd(e.ordenada)); g.lineTo(xt(tFin), yd(e.ordenada + e.pendiente * tFin)); g.stroke();
      const tr = e.tr;
      if (tr <= dur) {                                           // marca del tiempo a −60 dB
        g.fillStyle = COL.tinta; g.beginPath(); g.arc(xt(tr), yd(-60), 4, 0, 2 * Math.PI); g.fill();
        g.font = `600 ${tt}px ${FUENTE}`; g.fillText(`${estado.parametro} = ${tr.toFixed(2)} s`, Math.min(xt(tr) + 8, W - 130), yd(-60) - 8);
      }
    }

    if (corte) {                                                // línea de corte (arrastrable)
      const x = xt(corte / FS);
      g.strokeStyle = COL.senal; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x, m.t); g.lineTo(x, H - m.b); g.stroke();
      g.fillStyle = COL.senal; g.beginPath(); g.arc(x, m.t + 8, 6, 0, 2 * Math.PI); g.fill();
      g.font = `600 ${tt}px ${FUENTE}`; g.textAlign = x > W - 120 ? 'right' : 'left';
      g.fillText(estado.corte === 'auto' ? 'Corte automático' : 'Corte', x + (x > W - 120 ? -10 : 10), m.t + 12);
      g.textAlign = 'left';
    }
  }

  return {
    iniciar() { if (!ui) construir(); calcular(!datos); },
    detener() {},
  };
}

// Generador pseudoaleatorio con semilla: la curva no "tiembla" al mover los controles.
function semilla(s) { return () => { s = (s * 16807) % 2147483647; return (s / 2147483647) * 2 - 1; }; }
