// Modo presentación para las páginas del Trabajo Práctico: oculta menús y agranda el contenido
// para proyectar (iPad, notebook). Se activa con el botón o con la tecla P; Esc sale.
(function () {
  // Una pestaña abierta desde el modo presentación (un interactivo) llega con ?presentacion en la URL.
  const presentacionEnUrl = (search) => /[?&]presentacion(=|&|$)/.test(search);
  window.PresentacionLogica = { presentacionEnUrl };
  if (typeof document === 'undefined') return;           // en los tests no hay DOM
  if (!location.pathname.includes('/trabajo_practico/')) return;
  const CLAVE = 'modo-presentacion';
  const leer = () => {
    if (presentacionEnUrl(location.search)) return true;
    try { return sessionStorage.getItem(CLAVE) === '1'; } catch { return false; }
  };
  const guardar = (v) => { try { sessionStorage.setItem(CLAVE, v ? '1' : '0'); } catch { /* sin almacenamiento */ } };

  const svg = (d) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICONO_ENTRAR = svg('<path d="M3 4h18v12H3z"/><path d="M8 20h8M12 16v4"/>');        // pantalla / proyector
  const ICONO_SALIR = svg('<path d="M18 6 6 18M6 6l12 12"/>');

  function iniciar() {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'boton-presentacion';
    document.body.appendChild(boton);
    const aplicar = (activo) => {
      document.body.classList.toggle(CLAVE, activo);
      boton.setAttribute('aria-pressed', String(activo));
      boton.innerHTML = activo ? ICONO_SALIR : ICONO_ENTRAR;
      boton.title = activo ? 'Salir del modo presentación (Esc)' : 'Modo presentación (P)';
      boton.setAttribute('aria-label', activo ? 'Salir del modo presentación' : 'Modo presentación');
      guardar(activo);
      // Los interactivos abiertos en pantalla completa heredan el modo (para mostrar la pizarra).
      document.querySelectorAll('a[href*="interactivos/"]').forEach((a) => {
        const url = new URL(a.getAttribute('href'), location.href);
        if (activo) url.searchParams.set('presentacion', '1'); else url.searchParams.delete('presentacion');
        a.href = url.href;
      });
    };
    aplicar(leer());
    boton.addEventListener('click', () => aplicar(!document.body.classList.contains(CLAVE)));
    // En captura sobre window: Material usa la P para ir a la página anterior y hay que ganarle.
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]')) return;
      const activo = document.body.classList.contains(CLAVE);
      if (e.key === 'p' || e.key === 'P') aplicar(!activo);
      else if (e.key === 'Escape' && activo) aplicar(false);
      else return;
      e.preventDefault();
      e.stopImmediatePropagation();
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
