// Monta una escena en una página interactiva: la inicia cuando es visible y la detiene cuando no,
// marca si está embebida en el sitio y le informa su altura a la página que la contiene.
export function montar(escena) {
  const embebido = window.self !== window.top;
  if (embebido) document.documentElement.classList.add('embebido');

  let activa = false;
  const cambiar = (v) => {
    document.documentElement.dataset.visible = v ? '1' : '0';
    if (v && !activa) { activa = true; escena.iniciar(); }
    else if (!v && activa) { activa = false; escena.detener(); }
  };
  // Cualquier fracción visible cuenta (umbrales bajos): así un cambio de altura del iframe
  // no deja la escena detenida por no volver a cruzar un umbral alto.
  const main = document.querySelector('main');
  let enPantalla = false;
  new IntersectionObserver((es) => { enPantalla = es[es.length - 1].isIntersecting; cambiar(enPantalla && !document.hidden); }, { threshold: [0, 0.01] }).observe(main);
  document.addEventListener('visibilitychange', () => cambiar(enPantalla && !document.hidden));
  window.addEventListener('pagehide', () => cambiar(false));

  if (embebido) {
    // Altura del contenido (no del documento: scrollHeight nunca baja del alto actual del iframe).
    const informar = () => window.parent.postMessage({ tipo: 'interactivo-altura', altura: Math.ceil(main.getBoundingClientRect().height) }, '*');
    new ResizeObserver(informar).observe(main);
    informar();
  }
}
