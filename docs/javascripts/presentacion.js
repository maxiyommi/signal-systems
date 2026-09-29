// Modo presentación para las páginas del Trabajo Práctico: pantalla completa, sin menús y con el texto
// a todo el ancho, para proyectar (iPad, notebook). Se activa con el botón o con la tecla P; Esc sale.
// Al cambiar de página el navegador sale de pantalla completa y no deja volver sin un toque: por eso,
// en modo presentación y fuera de pantalla completa, aparece un botón para reactivarla.
(function () {
  // Una pestaña abierta desde el modo presentación (un interactivo) llega con ?presentacion en la URL.
  const presentacionEnUrl = (search) => /[?&]presentacion(=|&|$)/.test(search);
  const ofrecerPantallaCompleta = ({ presentacion, pantallaCompleta, soportada }) =>
    presentacion && !pantallaCompleta && soportada;
  window.PresentacionLogica = { presentacionEnUrl, ofrecerPantallaCompleta };
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
  const ICONO_PANTALLA = svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>');

  // Pantalla completa (con prefijo webkit para Safari del iPad).
  const raiz = document.documentElement;
  const pantalla = {
    soportada: Boolean(raiz.requestFullscreen || raiz.webkitRequestFullscreen),
    activa: () => Boolean(document.fullscreenElement || document.webkitFullscreenElement),
    entrar() {
      if (this.activa()) return;
      try { const r = (raiz.requestFullscreen || raiz.webkitRequestFullscreen).call(raiz); r?.catch?.(() => {}); } catch { /* sin permiso */ }
    },
    salir() {
      if (!this.activa()) return;
      try { const r = (document.exitFullscreen || document.webkitExitFullscreen).call(document); r?.catch?.(() => {}); } catch { /* nada */ }
    },
  };

  function iniciar() {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'boton-presentacion';
    const botonPantalla = document.createElement('button');
    botonPantalla.type = 'button';
    botonPantalla.className = 'boton-pantalla-completa';
    botonPantalla.innerHTML = ICONO_PANTALLA;
    botonPantalla.title = 'Volver a pantalla completa';
    botonPantalla.setAttribute('aria-label', 'Volver a pantalla completa');
    document.body.append(boton, botonPantalla);
    const actualizarPantalla = () => {
      botonPantalla.hidden = !ofrecerPantallaCompleta({
        presentacion: document.body.classList.contains(CLAVE), pantallaCompleta: pantalla.activa(), soportada: pantalla.soportada,
      });
    };
    document.addEventListener('fullscreenchange', actualizarPantalla);
    document.addEventListener('webkitfullscreenchange', actualizarPantalla);
    botonPantalla.addEventListener('click', () => pantalla.entrar());
    // porUsuario: solo con un toque o una tecla el navegador permite entrar a pantalla completa.
    const aplicar = (activo, porUsuario = false) => {
      if (porUsuario) { if (activo) pantalla.entrar(); else pantalla.salir(); }
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
      actualizarPantalla();
    };
    aplicar(leer());
    boton.addEventListener('click', () => aplicar(!document.body.classList.contains(CLAVE), true));
    // En captura sobre window: Material usa la P para ir a la página anterior y hay que ganarle.
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]')) return;
      const activo = document.body.classList.contains(CLAVE);
      if (e.key === 'p' || e.key === 'P') aplicar(!activo, true);
      else if (e.key === 'Escape' && activo) aplicar(false, true);
      else return;
      e.preventDefault();
      e.stopImmediatePropagation();
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
