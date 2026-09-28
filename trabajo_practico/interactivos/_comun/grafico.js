// Ayudantes para gráficos en canvas que se leen igual en un celular que en un proyector:
// el canvas se dibuja al tamaño en que se muestra (en px CSS, con la densidad de la pantalla),
// así los textos tienen tamaño real y no se achican.

export const FUENTE = 'Archivo, system-ui, sans-serif';

export function altoCanvas(ancho, { aspecto, min, max }) {
  return Math.round(Math.min(max, Math.max(min, ancho * aspecto)));
}

// Posiciones de los ítems de una leyenda que fluye en varias filas si no entra en maxAncho.
export function distribuirLeyenda(anchos, maxAncho, { x0 = 0, y0 = 0, sep = 16, alto = 18 } = {}) {
  const pos = [];
  let x = x0, y = y0;
  anchos.forEach((w, i) => {
    if (i > 0 && x + w > x0 + maxAncho) { x = x0; y += alto; }
    pos.push({ x, y });
    x += w + sep;
  });
  return pos;
}

// Ajusta el canvas a su ancho visible y devuelve el contexto escalado a px CSS.
export function prepararCanvas(canvas, opciones) {
  const ancho = Math.max(240, Math.round(canvas.parentElement.clientWidth || canvas.clientWidth || 600));
  const alto = altoCanvas(ancho, opciones);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(ancho * dpr);
  canvas.height = Math.round(alto * dpr);
  canvas.style.width = '100%';
  canvas.style.height = `${alto}px`;
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { g, W: ancho, H: alto, compacto: ancho < 520 };
}

// Dibuja una leyenda (cuadradito de color + texto) que se acomoda en filas. Devuelve el alto usado.
export function dibujarLeyenda(g, items, { x0, y0, maxAncho, tamano = 12, color = '#1B1830' }) {
  g.font = `600 ${tamano}px ${FUENTE}`;
  const anchos = items.map(([, t]) => 20 + g.measureText(t).width);
  const pos = distribuirLeyenda(anchos, maxAncho, { x0, y0, sep: 14, alto: tamano + 6 });
  items.forEach(([c, t], i) => {
    g.fillStyle = c; g.fillRect(pos[i].x, pos[i].y - tamano + 2, 14, tamano - 3);
    g.fillStyle = color; g.fillText(t, pos[i].x + 20, pos[i].y);
  });
  return pos.length ? pos[pos.length - 1].y - y0 + tamano + 6 : 0;
}

// Redibuja cuando cambia el ancho del contenedor (rotar el celular, redimensionar la ventana).
export function alCambiarAncho(canvas, redibujar) {
  let ultimo = 0;
  new ResizeObserver(() => {
    const w = canvas.parentElement.clientWidth;
    if (w && Math.abs(w - ultimo) > 2) { ultimo = w; redibujar(); }
  }).observe(canvas.parentElement);
}
