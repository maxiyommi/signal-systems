// Inicialización común de los decks y ciclo de vida de escenas interactivas.
import Reveal from 'https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.esm.js';
import Notes from 'https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/notes/notes.esm.js';
import Highlight from 'https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/highlight/highlight.esm.js';
import { htmlRuta, htmlSiguiente } from './ruta.js';

const escenas = new Map();          // idSlide -> { iniciar, detener, activa }

function sincronizar(actual) {
  for (const [id, e] of escenas) {
    const debeCorrer = Boolean(actual) && actual.id === id;
    if (debeCorrer && !e.activa) { e.activa = true; e.iniciar(actual); }
    else if (!debeCorrer && e.activa) { e.activa = false; e.detener(); }
  }
}

// La vista del orador (tecla S) carga el deck en iframes con ?receiver: ahí no se corren escenas.
const ES_VISTA_ORADOR = new URLSearchParams(location.search).has('receiver');

export function registrarEscena(idSlide, { iniciar, detener }) {
  if (ES_VISTA_ORADOR) return;
  escenas.set(idSlide, { iniciar, detener, activa: false });
  if (Reveal.isReady()) sincronizar(Reveal.getCurrentSlide());
}

// Completa las slides generadas (<section data-auto="ruta|siguiente">) a partir de ruta.js.
function completarNavegacion(deck) {
  if (!deck) return;
  document.querySelectorAll('section[data-auto="ruta"]').forEach((s) => { s.innerHTML = htmlRuta(deck); });
  document.querySelectorAll('section[data-auto="siguiente"]').forEach((s) => { s.innerHTML = htmlSiguiente(deck); });
}

// Visor de imágenes ampliadas: click en una figura la muestra a pantalla completa.
function activarVisor() {
  if (!document.querySelector('.figure img, .figure-hero img')) return;
  const lb = document.createElement('div');
  lb.className = 'lightbox-overlay';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-hidden', 'true');
  lb.innerHTML = '<img alt="">';
  document.body.appendChild(lb);
  const img = lb.querySelector('img');
  const cerrar = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); img.src = ''; };
  document.addEventListener('click', (e) => {
    const f = e.target.closest('.figure img, .figure-hero img');
    if (f && !lb.classList.contains('open')) { e.stopPropagation(); e.preventDefault(); img.src = f.src; img.alt = f.alt || ''; lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); return; }
    if (lb.classList.contains('open') && lb.contains(e.target)) { e.stopPropagation(); cerrar(); }
  }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lb.classList.contains('open')) { e.stopPropagation(); cerrar(); } }, true);
}

export async function initDeck({ deck = document.body.dataset.deck, ...opciones } = {}) {
  completarNavegacion(deck);
  activarVisor();
  // Tras usar un botón de una escena, Espacio no debe volver a activarlo: devolver el foco al deck.
  document.addEventListener('click', (e) => { const b = e.target.closest('.controles button'); if (b) setTimeout(() => b.blur(), 0); });
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
