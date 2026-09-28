// Orden de lectura de las presentaciones del TP (fuente única para la navegación entre decks).
// Sin fechas: las fechas viven en cronograma.md.
const SITIO = 'https://maxiyommi.github.io/signal-systems/';
const REPO = 'https://github.com/maxiyommi/signal-systems/tree/master/';
const clase = (n, tema) => [`Clase ${n} · ${tema}`, `${REPO}clases/clase_${String(n).padStart(2, '0')}`];

export const DOCS = {
  cronograma: ['Cronograma de la cursada (fechas)', `${SITIO}cronograma/`],
  consigna: ['Consigna del TP', `${SITIO}trabajo_practico/`],
  rubrica: ['Rúbrica de evaluación', `${SITIO}trabajo_practico/rubrica/`],
  indice: ['Índice de presentaciones', `${SITIO}trabajo_practico/presentaciones/`],
  slack: ['Consultas en Slack', 'https://senalesysistemas.slack.com'],
};

export const RUTA = [
  {
    id: 'conceptual', titulo: 'Conceptual', tema: 'El fenómeno: reverberación y tiempo de reverberación',
    antes: [],
    docs: [DOCS.consigna],
  },
  {
    id: 'tp', titulo: 'Trabajo práctico', tema: 'Consigna, milestones y evaluación',
    antes: [],
    docs: [DOCS.consigna, DOCS.rubrica, DOCS.cronograma],
  },
  {
    id: 'm0', titulo: 'M0 · El plano', tema: 'Arquitectura, repositorio, issues y /health',
    antes: [clase(1, 'entorno, Git y GitHub'), clase(3, 'módulos y testing'), clase(7, 'sistemas y respuesta al impulso')],
    docs: [['Especificación de M0', `${SITIO}trabajo_practico/especificacion/m0_arquitectura/`], ['Template del repositorio', `${REPO}trabajo_practico/template_repo`], DOCS.rubrica],
  },
  {
    id: 'm1', titulo: 'M1 · Generación', tema: 'Ruido rosa, sine sweep y grabación',
    antes: [clase(6, 'audio digital, ruido y sweep'), clase(4, 'generación de señales con NumPy')],
    docs: [['Especificación de M1', `${SITIO}trabajo_practico/especificacion/m1_generacion/`], DOCS.rubrica],
  },
  {
    id: 'm2', titulo: 'M2 · Procesamiento', tema: 'Deconvolución, bandas de octava y escala en dB',
    antes: [clase(8, 'convolución y deconvolución'), clase(9, 'FFT, filtros y bandas de octava')],
    docs: [['Especificación de M2', `${SITIO}trabajo_practico/especificacion/m2_procesamiento/`], DOCS.rubrica],
  },
  {
    id: 'm3', titulo: 'M3 · Producto', tema: 'Schroeder, parámetros ISO 3382 y API REST',
    antes: [clase(10, 'envolvente, Schroeder y parámetros'), clase(13, 'API REST'), clase(11, 'calidad y CI'), clase(12, 'documentación'), clase(14, 'pulido')],
    docs: [['Especificación de M3', `${SITIO}trabajo_practico/especificacion/m3_producto_final/`], DOCS.rubrica],
  },
];

const sinRepetir = (lista) => lista.filter(([, u], i) => lista.findIndex(([, v]) => v === u) === i);
const enlace = ([texto, url]) => `<li><a href="${url}" target="_blank" rel="noopener">${texto}</a></li>`;

// Slide "Ruta de lectura": dónde está esta presentación y qué conviene leer antes.
export function htmlRuta(id) {
  const i = RUTA.findIndex((d) => d.id === id);
  const d = RUTA[i];
  const pasos = RUTA.map((r, k) => `
      <li class="${k === i ? 'actual' : ''}">
        ${k === i ? `<strong>${r.titulo}</strong>` : `<a href="../${r.id}/">${r.titulo}</a>`}
        <span class="tema">${r.tema}</span>
      </li>`).join('');
  const antes = d.antes.length
    ? `<h3>Material de apoyo (leer antes)</h3><ul class="small">${d.antes.map(enlace).join('')}</ul>`
    : '<h3>Material de apoyo</h3><p class="small">Esta presentación no requiere lectura previa.</p>';
  return `
    <div class="kicker">Ruta de lectura · ${i + 1} de ${RUTA.length}</div>
    <h2>Dónde estamos</h2>
    <div class="split">
      <ol class="ruta">${pasos}</ol>
      <div>
        ${antes}
        <h3>Para consultar durante el trabajo</h3>
        <ul class="small">${sinRepetir([...d.docs, DOCS.cronograma]).map(enlace).join('')}</ul>
      </div>
    </div>`;
}

// Slide final: qué sigue y dónde buscar.
export function htmlSiguiente(id) {
  const i = RUTA.findIndex((d) => d.id === id);
  const sig = RUTA[i + 1];
  const proximo = sig
    ? `<p class="lead">Próxima presentación:</p><p><a class="siguiente" href="../${sig.id}/">${sig.titulo}</a></p><p class="small">${sig.tema}</p>`
    : '<p class="lead">Fin del recorrido. Lo que queda es construir, validar y presentar.</p>';
  return `
    <div class="kicker">Qué sigue</div>
    <h2>${sig ? 'Seguimos con' : 'Cierre'}</h2>
    <div class="grid-2">
      <div>${proximo}</div>
      <div>
        <h3>Dónde buscar</h3>
        <ul class="small">${sinRepetir([...RUTA[i].docs, DOCS.cronograma, DOCS.indice, DOCS.slack]).map(enlace).join('')}</ul>
      </div>
    </div>`;
}
