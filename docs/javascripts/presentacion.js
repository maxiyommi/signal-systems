// Modo presentación para las páginas del Trabajo Práctico: oculta menús y agranda el contenido
// para proyectar (iPad, notebook). Se activa con el botón o con la tecla P; Esc sale.
(function () {
  if (!location.pathname.includes('/trabajo_practico/')) return;
  const CLAVE = 'modo-presentacion';
  const leer = () => { try { return sessionStorage.getItem(CLAVE) === '1'; } catch { return false; } };
  const guardar = (v) => { try { sessionStorage.setItem(CLAVE, v ? '1' : '0'); } catch { /* sin almacenamiento */ } };

  function iniciar() {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'boton-presentacion';
    document.body.appendChild(boton);
    const aplicar = (activo) => {
      document.body.classList.toggle(CLAVE, activo);
      boton.setAttribute('aria-pressed', String(activo));
      boton.innerHTML = activo ? '✕ <span>Salir de presentación</span>' : '⛶ <span>Modo presentación</span>';
      boton.title = activo ? 'Salir del modo presentación (Esc)' : 'Modo presentación (P)';
      guardar(activo);
    };
    aplicar(leer());
    boton.addEventListener('click', () => aplicar(!document.body.classList.contains(CLAVE)));
    document.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea, [contenteditable]')) return;
      if (e.key === 'p' || e.key === 'P') aplicar(!document.body.classList.contains(CLAVE));
      if (e.key === 'Escape' && document.body.classList.contains(CLAVE)) aplicar(false);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
