// "El viaje de un pedido" (M0): recorre paso a paso cómo un request atraviesa router, schema y service.
// Los pasos están escritos en la página (listas .viaje__pasos); sin JavaScript se leen como listas.
(function () {
  const mover = (i, delta, n) => Math.max(0, Math.min(n - 1, i + delta));
  const omitidos = (recorrido, actores) => actores.filter((a) => !recorrido.includes(a));
  window.ViajeLogica = { mover, omitidos };
  if (typeof document === 'undefined') return;           // en los tests no hay DOM

  function montar(viaje) {
    viaje.classList.add('viaje--js');
    const actores = [...viaje.querySelectorAll('.viaje__actores [data-actor]')];
    const panel = viaje.querySelector('.viaje__panel');
    const contador = viaje.querySelector('.viaje__contador');
    const [atras, adelante] = viaje.querySelectorAll('[data-mover]');
    let caso = 'valido', i = 0;
    const pasos = () => [...viaje.querySelectorAll(`.viaje__pasos[data-caso="${caso}"] > li`)];

    function mostrar() {
      const lista = pasos(), paso = lista[i];
      const recorrido = lista.map((p) => p.dataset.actor);
      const fuera = omitidos(recorrido, actores.map((a) => a.dataset.actor));
      actores.forEach((a) => {
        a.classList.toggle('activo', a.dataset.actor === paso.dataset.actor);
        a.classList.toggle('omitido', fuera.includes(a.dataset.actor) && i === lista.length - 1);
        a.dataset.sentido = a.dataset.actor === paso.dataset.actor ? paso.dataset.sentido : '';
      });
      panel.innerHTML = paso.innerHTML;
      panel.dataset.sentido = paso.dataset.sentido;
      contador.textContent = `Paso ${i + 1} de ${lista.length}`;
      atras.disabled = i === 0;
      adelante.disabled = i === lista.length - 1;
      adelante.textContent = i === lista.length - 1 ? 'Fin' : 'Siguiente';
    }

    viaje.querySelectorAll('[data-caso]').forEach((b) => {
      if (b.tagName !== 'BUTTON') return;
      b.addEventListener('click', () => {
        caso = b.dataset.caso; i = 0;
        viaje.querySelectorAll('button[data-caso]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        mostrar();
      });
    });
    [atras, adelante].forEach((b) => b.addEventListener('click', () => { i = mover(i, Number(b.dataset.mover), pasos().length); mostrar(); }));
    mostrar();
  }

  const iniciar = () => document.querySelectorAll('.viaje').forEach(montar);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
