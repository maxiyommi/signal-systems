// Ajusta la altura de los interactivos embebidos (iframe) al contenido que informan.
window.addEventListener('message', (e) => {
  if (!e.data || e.data.tipo !== 'interactivo-altura') return;
  document.querySelectorAll('.interactivo iframe').forEach((f) => {
    if (f.contentWindow === e.source) f.style.height = `${Math.ceil(e.data.altura) + 4}px`;
  });
});
