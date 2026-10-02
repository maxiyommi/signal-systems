// "Para pensar" dentro de los interactivos: fuera del modo presentación se ven todas las preguntas;
// en modo presentación se revelan de a una (como en la presentación conceptual original).
(function () {
  const cuantasVisibles = ({ presentacion, reveladas, total }) =>
    (presentacion ? Math.max(1, Math.min(total, reveladas)) : total);
  window.PreguntasLogica = { cuantasVisibles };
  if (typeof document === 'undefined') return;           // en los tests no hay DOM

  function montar(bloque) {
    const items = [...bloque.querySelectorAll('ol > li')];
    const nav = bloque.querySelector('.para-pensar__nav');
    const [atras, adelante] = nav.querySelectorAll('button');
    const contador = nav.querySelector('span');
    let reveladas = 1;
    function mostrar() {
      const presentacion = document.body.classList.contains('modo-presentacion');
      const n = cuantasVisibles({ presentacion, reveladas, total: items.length });
      items.forEach((li, i) => { li.hidden = i >= n; li.classList.toggle('ultima', presentacion && i === n - 1); });
      nav.hidden = !presentacion;
      contador.textContent = `${n} de ${items.length}`;
      atras.disabled = n <= 1;
      adelante.disabled = n >= items.length;
    }
    atras.addEventListener('click', () => { reveladas = Math.max(1, reveladas - 1); mostrar(); });
    adelante.addEventListener('click', () => { reveladas = Math.min(items.length, reveladas + 1); mostrar(); });
    new MutationObserver(mostrar).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    mostrar();
  }
  const iniciar = () => document.querySelectorAll('.para-pensar').forEach(montar);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
