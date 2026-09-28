// Tema de colores de los interactivos: el mismo que eligió la persona en el sitio (Material guarda
// el esquema en localStorage), oscuro por defecto como la landing. Va en el <head>, antes de pintar.
(function () {
  const clavePaleta = (raiz) => `${raiz}.__palette`;
  function temaDesdePaleta(texto) {
    try { return JSON.parse(texto)?.color?.scheme === 'default' ? 'claro' : 'oscuro'; } catch { return 'oscuro'; }
  }
  window.TemaLogica = { clavePaleta, temaDesdePaleta };
  if (typeof document === 'undefined') return;           // en los tests no hay DOM

  let guardado = null;
  try { guardado = localStorage.getItem(clavePaleta(new URL('../../', location.href).pathname)); } catch { /* sin almacenamiento */ }
  document.documentElement.dataset.tema = temaDesdePaleta(guardado);
})();
