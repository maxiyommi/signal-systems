// Convolución en vivo: una fuente seca x(t), una respuesta al impulso h(t) que se diseña con su T60,
// y la salida y(t) = x(t) ∗ h(t) para escuchar y comparar. La mezcla reparte entre el sonido directo
// y el convolucionado (como acercarse o alejarse de la fuente en una sala).
import { riSintetica, envolventeMinMax } from '../_comun/acustica.js';
import { obtenerContexto, cargarBuffer, crearCanal } from '../_comun/audio.js';
import { gananciasMezcla } from '../_comun/mezcla.js';
import { FUENTE, prepararCanvas, dibujarLeyenda, alCambiarAncho, paleta } from '../_comun/grafico.js';

const COL = paleta();           // colores del tema (oscuro como la landing, o claro si se eligió en el sitio)

// Ruido con semilla: h(t) no cambia de forma al mover el T60, solo su decaimiento.
function conSemilla(s) { return () => { s = (s * 16807) % 2147483647; return (s / 2147483647) * 2 - 1; }; }

export function crearConvolucion(seccion, { audios }) {
  const raiz = seccion.querySelector('.convolucion');
  const estado = { t60: 1.5, mezcla: 0.7, audio: 'canto', sonando: null };
  const canal = crearCanal();
  let ui = null, h = null, salida = null, turno = 0;

  function construir() {
    raiz.innerHTML = `
      <div class="controles">
        <button type="button" data-escuchar="x">Escuchar x(t) seca</button>
        <button type="button" data-escuchar="y">Escuchar y(t) = x ∗ h</button>
        <div class="segmentado" role="group" aria-label="Fuente seca">
          <button type="button" data-audio="canto">Canto</button>
          <button type="button" data-audio="bateria">Batería</button>
        </div>
        <span class="estado small" aria-live="polite"></span>
      </div>
      <div class="parametros">
        <fieldset>
          <legend>La sala h(t)</legend>
          <label>T60 <input type="range" data-p="t60" min="0.1" max="4" step="0.1" value="${estado.t60}"><output data-o="t60"></output></label>
          <label>Sonido reverberado en la mezcla <input type="range" data-p="mezcla" min="0" max="1" step="0.05" value="${estado.mezcla}"><output data-o="mezcla"></output></label>
          <p class="small">h(t) = ruido × envolvente exponencial, que cae 60 dB en T60: el mismo modelo que <code>generate_synthetic_ir</code> de M2.</p>
        </fieldset>
      </div>
      <canvas class="grafico-h" role="img" aria-label="Respuesta al impulso h(t) diseñada"></canvas>
      <canvas class="grafico-xy" role="img" aria-label="Envolventes de la entrada x(t) y la salida y(t)"></canvas>`;
    const $ = (sel) => raiz.querySelector(sel);
    ui = { estado: $('.estado'), h: $('.grafico-h'), xy: $('.grafico-xy'), out: (k) => $(`[data-o="${k}"]`) };

    raiz.querySelectorAll('[data-escuchar]').forEach((b) => b.addEventListener('click', () => escuchar(b.dataset.escuchar)));
    raiz.querySelectorAll('[data-audio]').forEach((b) => b.addEventListener('click', () => {
      estado.audio = b.dataset.audio; detenerAudio(); actualizarTexto(); calcularSalida();
    }));
    const t60 = $('input[data-p="t60"]'), mezcla = $('input[data-p="mezcla"]');
    t60.addEventListener('input', () => { estado.t60 = Number(t60.value); generarH(); actualizarTexto(); dibujarH(); });
    t60.addEventListener('change', () => { calcularSalida(); if (estado.sonando === 'y') escuchar('y', true); });
    mezcla.addEventListener('input', () => { estado.mezcla = Number(mezcla.value); canal.ajustarMezcla(estado.mezcla); actualizarTexto(); });
    mezcla.addEventListener('change', () => calcularSalida());
    alCambiarAncho(ui.h, dibujarH);
    alCambiarAncho(ui.xy, dibujarXY);
  }

  function actualizarTexto() {
    ui.out('t60').textContent = `${estado.t60.toFixed(1)} s`;
    ui.out('mezcla').textContent = `${Math.round(estado.mezcla * 100)} %`;
    raiz.querySelectorAll('[data-audio]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.audio === estado.audio)));
    raiz.querySelectorAll('[data-escuchar]').forEach((b) => {
      const activo = estado.sonando === b.dataset.escuchar;
      b.setAttribute('aria-pressed', String(activo));
      b.textContent = activo ? 'Detener' : (b.dataset.escuchar === 'x' ? 'Escuchar x(t) seca' : 'Escuchar y(t) = x ∗ h');
    });
  }

  function generarH() {
    const fs = obtenerContexto().sampleRate;
    h = { datos: riSintetica({ fs, t60: estado.t60, duracion: Math.min(estado.t60 * 1.3, 6), rng: conSemilla(7) }), fs };
  }

  function bufferH(ctx) {
    const b = ctx.createBuffer(1, h.datos.length, h.fs);
    b.copyToChannel(h.datos, 0);
    return b;
  }

  function detenerAudio() { canal.detener(); estado.sonando = null; actualizarTexto(); }

  async function escuchar(cual, reiniciar = false) {
    if (estado.sonando === cual && !reiniciar) { detenerAudio(); return; }
    estado.sonando = cual; actualizarTexto();
    ui.estado.textContent = 'Cargando…';
    try {
      const opciones = { alTerminar: () => { estado.sonando = null; actualizarTexto(); } };
      if (cual === 'y') Object.assign(opciones, { riBuffer: () => bufferH(obtenerContexto()), mezcla: estado.mezcla });
      const p = canal.reproducir(audios[estado.audio], opciones);
      ui.estado.textContent = '';
      await p;
    } catch (e) { ui.estado.textContent = e.message; estado.sonando = null; actualizarTexto(); }
  }

  // Calcula y(t) completa (sin reproducir) con un OfflineAudioContext, para graficarla.
  async function calcularSalida() {
    const mio = ++turno;
    try {
      const x = await cargarBuffer(audios[estado.audio]);
      if (!h || h.fs !== x.sampleRate) generarH();
      const off = new OfflineAudioContext(1, x.length + h.datos.length, x.sampleRate);
      const src = off.createBufferSource(); src.buffer = x;
      const conv = off.createConvolver(); conv.normalize = true; conv.buffer = bufferH(off);
      const g = gananciasMezcla(estado.mezcla), seco = off.createGain(), humedo = off.createGain();
      seco.gain.value = g.seco; humedo.gain.value = g.humedo;
      src.connect(seco); seco.connect(off.destination);
      src.connect(conv); conv.connect(humedo); humedo.connect(off.destination);
      src.start();
      const y = await off.startRendering();
      if (mio !== turno) return;                           // se pidió otro cálculo mientras tanto
      salida = { x: x.getChannelData(0), y: y.getChannelData(0), fs: x.sampleRate };
      dibujarXY();
    } catch (e) { ui.estado.textContent = e.message; }
  }

  function ejes(g, W, H, m, tt, dur, rotuloY) {
    const xt = (t) => m.l + (t / dur) * (W - m.l - m.r);
    g.font = `500 ${tt}px ${FUENTE}`; g.fillStyle = COL.eje; g.strokeStyle = COL.grilla; g.lineWidth = 1;
    g.textAlign = 'center';
    const paso = dur > 8 ? 2 : dur > 3 ? 1 : dur > 1.2 ? 0.5 : 0.25;
    for (let t = 0; t <= dur + 1e-9; t += paso) { g.beginPath(); g.moveTo(xt(t), m.t); g.lineTo(xt(t), H - m.b); g.stroke(); g.fillText(`${+t.toFixed(2)}`, xt(t), H - m.b + tt + 4); }
    g.font = `600 ${tt}px ${FUENTE}`;
    g.fillText('Tiempo (s)', m.l + (W - m.l - m.r) / 2, H - 4);
    g.save(); g.translate(tt, m.t + (H - m.t - m.b) / 2); g.rotate(-Math.PI / 2); g.fillText(rotuloY, 0, 0); g.restore();
    g.textAlign = 'left';
    return xt;
  }

  function envolvente(g, datos, fs, xt, y0, alto, color, dur) {
    const n = Math.min(datos.length, Math.round(dur * fs));
    const columnas = Math.max(1, Math.round(xt(n / fs) - xt(0)));
    const { min, max } = envolventeMinMax(datos.subarray(0, n), columnas);
    let pico = 1e-9; for (let i = 0; i < columnas; i++) pico = Math.max(pico, Math.abs(min[i]), Math.abs(max[i]));
    g.fillStyle = color;
    for (let c = 0; c < columnas; c++) {
      const a = y0 - (max[c] / pico) * alto, b = y0 - (min[c] / pico) * alto;
      g.fillRect(xt(0) + c, a, 1, Math.max(1, b - a));
    }
  }

  function dibujarH() {
    if (!h) return;
    const { g, W, H, compacto } = prepararCanvas(ui.h, { aspecto: 0.22, min: 150, max: 220 });
    const tt = compacto ? 11 : 13;
    g.fillStyle = COL.papel; g.fillRect(0, 0, W, H);
    const altoLeyenda = dibujarLeyenda(g, [[COL.violeta, 'h(t)'], [COL.senal, `Envolvente: cae 60 dB en T60 = ${estado.t60.toFixed(1)} s`]],
      { x0: compacto ? 36 : 52, y0: tt + 6, maxAncho: W - 60, tamano: tt });
    const m = { l: compacto ? 36 : 52, r: 12, t: altoLeyenda + 10, b: compacto ? 36 : 40 };
    const dur = h.datos.length / h.fs;
    const xt = ejes(g, W, H, m, tt, dur, 'h(t)');
    const y0 = (m.t + H - m.b) / 2, alto = (H - m.b - m.t) / 2 - 2;
    envolvente(g, h.datos, h.fs, xt, y0, alto, COL.violeta, dur);
    g.strokeStyle = COL.senal; g.lineWidth = 2; g.setLineDash([5, 4]);
    for (const signo of [1, -1]) {
      g.beginPath();
      for (let x = xt(0); x <= xt(dur); x += 2) {
        const t = ((x - m.l) / (W - m.l - m.r)) * dur, e = Math.pow(10, (-3 * t) / estado.t60);
        const y = y0 - signo * e * alto;
        x === xt(0) ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.stroke();
    }
    g.setLineDash([]);
  }

  function dibujarXY() {
    if (!salida) return;
    const { g, W, H, compacto } = prepararCanvas(ui.xy, { aspecto: 0.3, min: 180, max: 280 });
    const tt = compacto ? 11 : 13;
    g.fillStyle = COL.papel; g.fillRect(0, 0, W, H);
    const altoLeyenda = dibujarLeyenda(g, [[COL.tinta, 'x(t): seca'], [COL.violeta, 'y(t) = x ∗ h (con la mezcla elegida)']],
      { x0: compacto ? 36 : 52, y0: tt + 6, maxAncho: W - 60, tamano: tt });
    const m = { l: compacto ? 36 : 52, r: 12, t: altoLeyenda + 10, b: compacto ? 36 : 40 };
    const dur = salida.y.length / salida.fs;
    const xt = ejes(g, W, H, m, tt, dur, 'Amplitud');
    const alto = (H - m.b - m.t) / 4 - 2;
    envolvente(g, salida.x, salida.fs, xt, m.t + alto + 2, alto, COL.tinta, dur);
    envolvente(g, salida.y, salida.fs, xt, m.t + 3 * alto + 6, alto, COL.violeta, dur);
  }

  return {
    iniciar() {
      if (!ui) { construir(); generarH(); actualizarTexto(); dibujarH(); calcularSalida(); }
    },
    detener() { detenerAudio(); },
  };
}
