// Links externos y links a interactivos: se abren en una pestaña nueva (en el sitio y en los interactivos).
// El resto (páginas del sitio, anclas) sigue en la misma pestaña.
(function () {
  function enPestanaNueva(href, base) {
    let url;
    try { url = new URL(href, base); } catch { return false; }
    if (!/^https?:$/.test(url.protocol)) return false;                 // mailto:, tel:, javascript:
    if (url.origin !== new URL(base).origin) return true;               // externo
    return url.pathname.includes('/interactivos/');                     // interactivo del TP
  }
  window.EnlacesLogica = { enPestanaNueva };
  if (typeof document === 'undefined') return;           // en los tests no hay DOM

  function marcar(raiz = document) {
    raiz.querySelectorAll('a[href]').forEach((a) => {
      if (a.target || !enPestanaNueva(a.getAttribute('href'), location.href)) return;
      a.target = '_blank';
      a.rel = `${a.rel} noopener`.trim();
    });
  }
  // También los links que se agregan después (panel de la agenda, resultados de los interactivos).
  new MutationObserver((cambios) => cambios.forEach((c) => c.addedNodes.forEach((n) => { if (n.querySelectorAll) marcar(n); })))
    .observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => marcar()); else marcar();
})();
