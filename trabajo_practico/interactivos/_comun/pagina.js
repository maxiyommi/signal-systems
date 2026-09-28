// Monta una escena en una página interactiva: la inicia cuando es visible y la detiene cuando no
// (pestaña oculta o página cerrada), para no gastar audio ni GPU.
export function montar(escena) {
  let activa = false;
  const cambiar = (v) => {
    document.documentElement.dataset.visible = v ? '1' : '0';
    if (v && !activa) { activa = true; escena.iniciar(); }
    else if (!v && activa) { activa = false; escena.detener(); }
  };
  const main = document.querySelector('main');
  let enPantalla = false;
  new IntersectionObserver((es) => { enPantalla = es[es.length - 1].isIntersecting; cambiar(enPantalla && !document.hidden); }, { threshold: [0, 0.01] }).observe(main);
  document.addEventListener('visibilitychange', () => cambiar(enPantalla && !document.hidden));
  window.addEventListener('pagehide', () => cambiar(false));
}
