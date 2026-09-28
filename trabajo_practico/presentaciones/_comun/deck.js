// Inicialización común de los decks y ciclo de vida de escenas interactivas.
import Reveal from 'https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.esm.js';
import Notes from 'https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/notes/notes.esm.js';
import Highlight from 'https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/highlight/highlight.esm.js';

const escenas = new Map();          // idSlide -> { iniciar, detener, activa }

function sincronizar(actual) {
  for (const [id, e] of escenas) {
    const debeCorrer = Boolean(actual) && actual.id === id;
    if (debeCorrer && !e.activa) { e.activa = true; e.iniciar(actual); }
    else if (!debeCorrer && e.activa) { e.activa = false; e.detener(); }
  }
}

export function registrarEscena(idSlide, { iniciar, detener }) {
  escenas.set(idSlide, { iniciar, detener, activa: false });
  if (Reveal.isReady()) sincronizar(Reveal.getCurrentSlide());
}

export async function initDeck(opciones = {}) {
  await Reveal.initialize({
    width: 1920, height: 1080, margin: 0.03, minScale: 0.2, maxScale: 2.0,
    hash: true, center: false,
    controls: true, controlsLayout: 'edges', controlsBackArrows: 'visible',
    progress: true, slideNumber: 'c/t',
    transition: 'fade', transitionSpeed: 'fast',
    plugins: [Notes, Highlight], ...opciones,
  });
  Reveal.on('slidechanged', (ev) => sincronizar(ev.currentSlide));
  sincronizar(Reveal.getCurrentSlide());
  return Reveal;
}
