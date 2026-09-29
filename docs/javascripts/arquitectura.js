// Diagrama de arquitectura de M0: botones para ver cómo crece la API milestone a milestone
// (lo que viene después queda punteado) y para seguir el recorrido numerado de un análisis.
// El contenido está escrito en la página (.arq); sin JavaScript se ve el diagrama completo.
(function () {
  const estado = (mItem, mElegido) => (mItem <= mElegido ? 'hecho' : 'pendiente');
  const estadoArchivo = (ms, mElegido) => (ms.some((m) => m <= mElegido) ? 'hecho' : 'pendiente');
  const ordenRecorrido = (items) => [...items].sort((a, b) => a.paso - b.paso);
  window.ArquitecturaLogica = { estado, estadoArchivo, ordenRecorrido };
  if (typeof document === 'undefined') return;           // en los tests no hay DOM

  function montar(arq) {
    arq.classList.add('arq--js');
    const items = [...arq.querySelectorAll('[data-m]')];
    const archivos = [...arq.querySelectorAll('.arq-archivo')];
    const leyenda = arq.querySelector('.arq-leyenda');
    const pasos = arq.querySelector('.arq-pasos');
    const botones = [...arq.querySelectorAll('.arq-controles button')];

    function mostrarMilestone(m) {
      arq.classList.remove('arq--recorrido');
      items.forEach((el) => el.classList.toggle('pendiente', estado(Number(el.dataset.m), m) === 'pendiente'));
      archivos.forEach((a) => {
        const ms = [...a.querySelectorAll('[data-m]')].map((el) => Number(el.dataset.m));
        a.classList.toggle('pendiente', estadoArchivo(ms, m) === 'pendiente');
      });
      leyenda.textContent = m === 3
        ? 'La API completa al final de M3. Tocá M0, M1 o M2 para ver cómo se va armando: lo punteado es lo que viene después.'
        : `Así queda la API al terminar M${m}. Lo punteado todavía no existe: se agrega en los milestones siguientes, en las mismas carpetas.`;
      pasos.hidden = true;
    }

    function mostrarRecorrido() {
      items.forEach((el) => el.classList.remove('pendiente'));
      archivos.forEach((a) => a.classList.remove('pendiente'));
      arq.classList.add('arq--recorrido');
      const lista = ordenRecorrido([...arq.querySelectorAll('[data-paso]')].map((el) => ({ paso: Number(el.dataset.paso), texto: el.dataset.explica })));
      pasos.innerHTML = lista.map((p) => `<li>${p.texto}</li>`).join('');
      pasos.hidden = false;
      leyenda.textContent = 'El recorrido de un análisis: los números marcan por dónde pasa el pedido, de arriba hacia abajo y de vuelta.';
    }

    botones.forEach((b) => b.addEventListener('click', () => {
      botones.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      if (b.dataset.ver === 'recorrido') mostrarRecorrido(); else mostrarMilestone(Number(b.dataset.ver));
    }));
    mostrarMilestone(3);
  }

  const iniciar = () => document.querySelectorAll('.arq').forEach(montar);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
