// Audio compartido por las escenas: un AudioContext por página y "canales" por escena.
// Cada canal reproduce una sola cosa a la vez; detener() cancela también las cargas en curso
// (contador de generación), así nunca quedan dos fuentes sonando ni audio fuera de su slide.

let ctx = null;
const buffers = new Map();
let vivas = 0;

function marcarVivas(delta) {
  vivas += delta;
  document.documentElement.dataset.audioVivas = String(vivas);   // visible para verificación
}

export function obtenerContexto() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

export function cargarBuffer(url) {
  if (!buffers.has(url)) {
    const p = fetch(url)
      .then((r) => { if (!r.ok) throw new Error(`No se pudo cargar ${url} (${r.status})`); return r.arrayBuffer(); })
      .then((ab) => obtenerContexto().decodeAudioData(ab))
      .catch((e) => { buffers.delete(url); throw e; });   // un fallo transitorio no queda cacheado
    buffers.set(url, p);
  }
  return buffers.get(url);
}

export function crearCanal() {
  let gen = 0;
  let actual = null;           // { src, nodos: [...], salida }

  function limpiar(n) {
    if (!n) return;
    try { n.src.stop(); } catch { /* ya detenida */ }
    const c = obtenerContexto();
    n.salida.gain.setTargetAtTime(0, c.currentTime, 0.05);   // corta también la cola del convolver
    setTimeout(() => n.nodos.forEach((x) => { try { x.disconnect(); } catch { /* nada */ } }), 400);
    if (n.viva) { n.viva = false; marcarVivas(-1); }
  }

  return {
    get sonando() { return Boolean(actual); },

    // Reproduce url; si se pasa riBuffer, la convoluciona con esa respuesta al impulso.
    // Devuelve una promesa que resuelve al terminar (o al detenerse). Rechaza si el navegador bloquea el audio.
    async reproducir(url, { riBuffer = null, alTerminar = null } = {}) {
      const mio = ++gen;
      limpiar(actual); actual = null;
      const c = obtenerContexto();
      await c.resume();
      if (c.state !== 'running') throw new Error('El navegador bloqueó el audio: tocá el botón de nuevo.');
      const buf = await cargarBuffer(url);
      const ri = typeof riBuffer === 'function' ? await riBuffer() : riBuffer;
      if (mio !== gen) return;                                   // se detuvo o se pidió otra cosa mientras cargaba
      const src = c.createBufferSource();
      src.buffer = buf;
      const salida = c.createGain();
      const nodos = [src, salida];
      if (ri) {
        const conv = c.createConvolver();
        conv.normalize = true;
        conv.buffer = ri;
        src.connect(conv); conv.connect(salida); nodos.push(conv);
      } else {
        src.connect(salida);
      }
      salida.connect(c.destination);
      const n = { src, nodos, salida, viva: true };
      actual = n;
      marcarVivas(1);
      src.onended = () => {
        if (actual === n) { actual = null; if (n.viva) { n.viva = false; marcarVivas(-1); } if (alTerminar) alTerminar(); }
        const cola = ri ? ri.duration * 1000 : 0;   // dejar sonar la cola y liberar los nodos
        setTimeout(() => nodos.forEach((x) => { try { x.disconnect(); } catch { /* nada */ } }), cola + 300);
      };
      src.start();
    },

    detener() {
      gen++;
      limpiar(actual);
      actual = null;
    },
  };
}
