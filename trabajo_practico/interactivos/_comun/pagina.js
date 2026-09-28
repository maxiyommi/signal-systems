// Monta una escena en una página interactiva: la inicia cuando es visible y la detiene cuando no,
// marca si está embebida en el sitio y le informa su altura a la página que la contiene.
export function montar(escena) {
  const embebido = window.self !== window.top;
  if (embebido) document.documentElement.classList.add('embebido');

  let activa = false;
  const cambiar = (visible) => {
    if (visible && !activa) { activa = true; escena.iniciar(); }
    else if (!visible && activa) { activa = false; escena.detener(); }
  };
  new IntersectionObserver((e) => cambiar(e[0].isIntersecting), { threshold: 0.15 }).observe(document.querySelector('main'));
  document.addEventListener('visibilitychange', () => { if (document.hidden) cambiar(false); });
  window.addEventListener('pagehide', () => cambiar(false));

  if (embebido) {
    const informar = () => window.parent.postMessage({ tipo: 'interactivo-altura', altura: document.documentElement.scrollHeight }, '*');
    new ResizeObserver(informar).observe(document.body);
    informar();
  }
}
