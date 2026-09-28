// Sala 3D: rayos por fuentes imagen, ecograma sincronizado y auralización con el T60 de la sala.
// Si no hay WebGL (o three.js no carga) cae a una planta 2D con los mismos controles.
import { fuentesImagen, llegadas, caminoPlegado, sabineT60, eyringT60, tiempoEcograma, riSintetica, edcDb, tiempoReverberacion } from '../_comun/acustica.js';
import { obtenerContexto, cargarBuffer, crearCanal } from '../_comun/audio.js';
import { FUENTE, prepararCanvas, dibujarLeyenda, paleta } from '../_comun/grafico.js';

const C = 343;
const LENTITUD = 0.05;             // a velocidad 1: 1 s real = 50 ms simulados
const MAX_RAYOS = 60;
const COL = paleta();             // colores del tema (oscuro como la landing, o claro si se eligió en el sitio)

const QUIETO = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function hayWebGL() {
  if (new URLSearchParams(location.search).has('sin3d')) return false;   // forzar la planta 2D
  try {
    const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
    if (gl) gl.getExtension('WEBGL_lose_context')?.loseContext();   // liberar el contexto de prueba
    return Boolean(gl);
  }
  catch { return false; }
}

export function crearSala3D(seccion, {
  sala: salaInicial = { lx: 10, ly: 8, lz: 4 }, fuente: fuenteInicial = [2.5, 4, 1.6], mic = [7.5, 3, 1.6],
  audios = { canto: 'audio/seco_canto.mp3', bateria: 'audio/seco_bateria.mp3' }, riReal = 'audio/sala_ri.mp3',
} = {}) {
  const raiz = seccion.querySelector('.sala');
  const sala = { ...salaInicial };                          // se modifica con los controles (mismo objeto)
  const fuente = [...fuenteInicial];
  const estado = {
    alpha: 0.3, modo: 'simulada', mic: [...mic], ts: 0, pausa: 0, activa: false,
    ordenMax: 3, velocidad: 1, pausado: false, audio: 'canto',
  };
  let tMax = tiempoEcograma(sala);                          // s de ecograma (crece con la sala)
  const canal = crearCanal();
  let ui = null, vista = null, rayos = [], ecoLlegadas = [], riRealInfo = null, ultimo = 0, rafId = 0, preparando = null;

  // ---------- Datos acústicos ----------

  function recalcular() {
    const alpha = estado.modo === 'libre' ? 1 : estado.alpha;
    rayos = llegadas(fuentesImagen(sala, fuente, 3), estado.mic, alpha)
      .filter((l) => l.amp > 0 && l.orden <= estado.ordenMax)
      .sort((a, b) => b.amp - a.amp)
      .slice(0, MAX_RAYOS)
      .map((l) => {
        const camino = caminoPlegado(sala, l.pos, estado.mic);
        const tramos = [];
        let acum = 0;
        for (let i = 1; i < camino.length; i++) {
          const d = Math.hypot(...camino[i].map((v, k) => v - camino[i - 1][k]));
          tramos.push({ desde: camino[i - 1], hasta: camino[i], ini: acum, largo: d });
          acum += d;
        }
        return { ...l, camino, tramos, largo: acum };
      });
    // Orden de reflexiones suficiente para cubrir todo el ecograma (acotado para que no se ponga lento).
    const ordenEco = Math.min(18, Math.ceil((tMax * C) / Math.min(sala.lx, sala.ly, sala.lz)) + 1);
    ecoLlegadas = llegadas(fuentesImagen(sala, fuente, estado.modo === 'libre' ? 0 : ordenEco), estado.mic, alpha)
      .filter((l) => l.amp > 0 && l.t <= tMax);
    estado.ts = 0; estado.pausa = 0;
    actualizarTexto();
    if (vista) vista.reconstruir();
  }

  function actualizarTexto() {
    if (!ui) return;
    ui.alphaOut.textContent = estado.alpha.toFixed(2);
    ui.alpha.disabled = estado.modo !== 'simulada';
    if (estado.modo === 'simulada') ui.t60.textContent = `T60 ≈ ${sabineT60(sala, estado.alpha).toFixed(2)} s (Sabine) · ${eyringT60(sala, estado.alpha).toFixed(2)} s (Eyring)`;
    else if (estado.modo === 'real') ui.t60.textContent = !riRealInfo ? 'Cargando la RI medida…' : riRealInfo.t30 == null ? 'RI medida (T30 no calculable)' : `T60 medido ≈ ${riRealInfo.t30.toFixed(2)} s (RI de OpenAIR)`;
    else ui.t60.textContent = 'Sin paredes: solo sonido directo';
    ui.modos.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modo === estado.modo)));
    ui.audios.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.audio === estado.audio)));
    ui.pausa.textContent = estado.pausado ? 'Reanudar' : 'Pausar';
    ui.pausa.setAttribute('aria-pressed', String(estado.pausado));
    for (const k of ['lx', 'ly', 'lz']) { ui.dim[k].value = String(sala[k]); ui.dimOut[k].textContent = `${sala[k]} m`; ui.dim[k].disabled = estado.modo !== 'simulada'; }
    ui.ordenOut.textContent = estado.ordenMax === 0 ? 'solo directo' : `hasta orden ${estado.ordenMax}`;
    ui.velOut.textContent = `×${estado.velocidad}`;
    // Datos de la geometría: sonido directo y primera reflexión
    const directo = ecoLlegadas.find((l) => l.orden === 0), primera = ecoLlegadas.find((l) => l.orden > 0);
    const d = Math.hypot(...fuente.map((v, k) => v - estado.mic[k]));
    ui.datos.innerHTML = `Volumen <strong>${(sala.lx * sala.ly * sala.lz).toFixed(0)} m³</strong> · distancia fuente–micrófono <strong>${d.toFixed(1)} m</strong>`
      + (directo ? ` · directo a <strong>${(directo.t * 1000).toFixed(1)} ms</strong>` : '')
      + (primera && estado.modo !== 'libre' ? ` · primera reflexión <strong>${((primera.t - directo.t) * 1000).toFixed(1)} ms</strong> después, a ${(20 * Math.log10(primera.amp)).toFixed(1)} dB` : '')
      + ` · ecograma de ${Math.round(tMax * 1000)} ms`;
  }

  // Cambió el tamaño de la sala: fuente y micrófono quedan adentro, y se rehace la vista.
  function cambiarSala() {
    const L = [sala.lx, sala.ly, sala.lz];
    for (const p of [fuente, estado.mic]) for (let k = 0; k < 2; k++) p[k] = Math.min(L[k] - 0.3, Math.max(0.3, p[k]));
    for (const p of [fuente, estado.mic]) p[2] = Math.min(L[2] - 0.3, p[2]);
    tMax = tiempoEcograma(sala);
    if (vista?.reconstruirSala) vista.reconstruirSala();
    recalcular();
  }

  async function prepararRiReal() {
    if (riRealInfo) return riRealInfo;
    const buf = await cargarBuffer(riReal);
    const datos = buf.getChannelData(0);
    riRealInfo = { buf, datos, fs: buf.sampleRate, t30: tiempoReverberacion(edcDb(datos), buf.sampleRate) };
    return riRealInfo;
  }

  // ---------- Audio ----------

  function botonEscuchar(texto) { if (ui) ui.escuchar.textContent = texto; }

  async function escuchar() {
    if (canal.sonando || ui.escuchar.dataset.cargando) {
      canal.detener(); delete ui.escuchar.dataset.cargando; botonEscuchar('Escuchar'); return;
    }
    ui.escuchar.dataset.cargando = '1';
    botonEscuchar('Detener');
    let riBuffer = null;
    if (estado.modo === 'real') riBuffer = async () => (await prepararRiReal()).buf;
    else if (estado.modo === 'simulada') {
      riBuffer = () => {
        const ctx = obtenerContexto();
        const t60 = sabineT60(sala, estado.alpha);
        const ri = riSintetica({ fs: ctx.sampleRate, t60, duracion: Math.min(t60 * 1.2, 6) });
        const b = ctx.createBuffer(1, ri.length, ctx.sampleRate);
        b.copyToChannel(ri, 0);
        return b;
      };
    }
    try {
      await canal.reproducir(audios[estado.audio], { riBuffer, alTerminar: () => botonEscuchar('Escuchar') });
    } catch (e) {
      ui.t60.textContent = e.message;
    } finally {
      delete ui.escuchar.dataset.cargando;
      if (!canal.sonando) botonEscuchar('Escuchar');
    }
  }

  // ---------- Interfaz ----------

  function construirUI() {
    const rango = (clave, texto, min, max, paso, valor) =>
      `<label>${texto} <input type="range" data-p="${clave}" min="${min}" max="${max}" step="${paso}" value="${valor}"><output data-o="${clave}"></output></label>`;
    raiz.innerHTML = `
      <div class="escena sala-escena"></div>
      <div class="controles">
        <div class="segmentado" role="group" aria-label="Qué se escucha y se ve">
          <button type="button" data-modo="simulada">Sala simulada</button>
          <button type="button" data-modo="real">Sala real (Sports Centre)</button>
          <button type="button" data-modo="libre">Aire libre</button>
        </div>
        <div class="segmentado" role="group" aria-label="Animación">
          <button type="button" data-accion="pausa">Pausar</button>
          <button type="button" data-accion="reiniciar">Reiniciar</button>
        </div>
      </div>
      <div class="controles">
        <button type="button" data-accion="escuchar">Escuchar</button>
        <div class="segmentado" role="group" aria-label="Fuente sonora">
          <button type="button" data-audio="canto">Canto</button>
          <button type="button" data-audio="bateria">Batería</button>
        </div>
        <span class="t60" aria-live="polite"></span>
      </div>
      <p class="small datos"></p>
      <canvas class="ecograma" role="img" aria-label="Ecograma: llegadas al micrófono en el tiempo"></canvas>
      <div class="parametros">
        <fieldset>
          <legend>Sala simulada</legend>
          ${rango('lx', 'Largo', 4, 30, 0.5, sala.lx)}
          ${rango('ly', 'Ancho', 3, 25, 0.5, sala.ly)}
          ${rango('lz', 'Alto', 2.5, 12, 0.5, sala.lz)}
          ${rango('alpha', 'Absorción de las paredes (α)', 0.05, 0.95, 0.05, estado.alpha)}
        </fieldset>
        <fieldset>
          <legend>Visualización</legend>
          ${rango('orden', 'Reflexiones que se dibujan', 0, 3, 1, estado.ordenMax)}
          ${rango('velocidad', 'Velocidad de la animación', 0, 4, 1, 2)}
          <p class="small">El micrófono se arrastra sobre la escena. Orden 1: rebota en una pared; orden 2: en dos; y así.</p>
        </fieldset>
      </div>
      <p class="small aviso" hidden></p>`;
    const $ = (sel) => raiz.querySelector(sel);
    ui = {
      escena: $('.sala-escena'),
      modos: [...raiz.querySelectorAll('button[data-modo]')],
      audios: [...raiz.querySelectorAll('button[data-audio]')],
      escuchar: $('[data-accion="escuchar"]'),
      pausa: $('[data-accion="pausa"]'),
      alpha: $('input[data-p="alpha"]'),
      alphaOut: $('output[data-o="alpha"]'),
      dim: { lx: $('input[data-p="lx"]'), ly: $('input[data-p="ly"]'), lz: $('input[data-p="lz"]') },
      dimOut: { lx: $('output[data-o="lx"]'), ly: $('output[data-o="ly"]'), lz: $('output[data-o="lz"]') },
      ordenOut: $('output[data-o="orden"]'),
      velOut: $('output[data-o="velocidad"]'),
      t60: $('.t60'),
      datos: $('.datos'),
      eco: $('.ecograma'),
      aviso: $('.aviso'),
    };
    const VELOCIDADES = [0.25, 0.5, 1, 2, 4];
    ui.alpha.addEventListener('input', () => { estado.alpha = Number(ui.alpha.value); recalcular(); });
    for (const k of ['lx', 'ly', 'lz']) ui.dim[k].addEventListener('input', () => { sala[k] = Number(ui.dim[k].value); cambiarSala(); });
    $('input[data-p="orden"]').addEventListener('input', (e) => { estado.ordenMax = Number(e.target.value); recalcular(); });
    $('input[data-p="velocidad"]').addEventListener('input', (e) => { estado.velocidad = VELOCIDADES[Number(e.target.value)]; actualizarTexto(); });
    ui.pausa.addEventListener('click', () => { estado.pausado = !estado.pausado; actualizarTexto(); });
    $('[data-accion="reiniciar"]').addEventListener('click', () => { estado.ts = 0; estado.pausa = 0; });
    ui.audios.forEach((b) => b.addEventListener('click', () => {
      estado.audio = b.dataset.audio;
      if (canal.sonando) { canal.detener(); botonEscuchar('Escuchar'); }
      actualizarTexto();
    }));
    ui.modos.forEach((b) => b.addEventListener('click', async () => {
      estado.modo = b.dataset.modo;
      canal.detener(); botonEscuchar('Escuchar');
      recalcular();
      if (estado.modo === 'real') {
        try { await prepararRiReal(); actualizarTexto(); } catch (e) { ui.t60.textContent = e.message; }
      }
    }));
    ui.escuchar.addEventListener('click', () => escuchar().catch((e) => { ui.t60.textContent = e.message; }));
  }

  // ---------- Ecograma ----------

  let eco = null;                                         // contexto del ecograma (se rehace si cambia el ancho)
  function dibujarEcograma() {
    const ancho = ui.eco.parentElement.clientWidth;
    if (!eco || Math.abs(eco.anchoPadre - ancho) > 2) eco = { ...prepararCanvas(ui.eco, { aspecto: 0.3, min: 170, max: 240 }), anchoPadre: ancho };
    const { g, W, H, compacto } = eco;
    const tt = compacto ? 11 : 13;
    g.fillStyle = COL.papel; g.fillRect(0, 0, W, H);
    const leyenda = estado.modo === 'real' ? [[COL.violeta, 'RI medida (envolvente)']] : [[COL.senal, 'Sonido directo'], [COL.violeta, 'Reflexiones']];
    const altoLeyenda = dibujarLeyenda(g, leyenda, { x0: compacto ? 36 : 52, y0: tt + 6, maxAncho: W - 60, tamano: tt });
    const m = { l: compacto ? 36 : 52, r: 12, t: altoLeyenda + 12, b: compacto ? 36 : 42 }, dbMin = -60;
    const xt = (t) => m.l + (t / tMax) * (W - m.l - m.r);
    const yd = (d) => m.t + (Math.min(0, d) / dbMin) * (H - m.t - m.b);
    g.font = `500 ${tt}px ${FUENTE}`; g.fillStyle = COL.eje; g.strokeStyle = COL.grilla; g.lineWidth = 1;
    g.textAlign = 'center';
    for (let t = 0; t <= tMax + 1e-9; t += 0.05) { g.beginPath(); g.moveTo(xt(t), m.t); g.lineTo(xt(t), H - m.b); g.stroke(); g.fillText(`${Math.round(t * 1000)}`, xt(t), H - m.b + tt + 4); }
    g.textAlign = 'right';
    for (const d of [0, -30, -60]) g.fillText(`${d}`, m.l - 5, yd(d) + 4);
    g.textAlign = 'center'; g.font = `600 ${tt}px ${FUENTE}`;
    g.fillText('Tiempo desde la emisión (ms)', m.l + (W - m.l - m.r) / 2, H - 4);
    g.save(); g.translate(tt, m.t + (H - m.t - m.b) / 2); g.rotate(-Math.PI / 2); g.fillText('dB rel. directo', 0, 0); g.restore();
    g.textAlign = 'left';
    if (estado.modo === 'real' && riRealInfo) {
      const { datos, fs } = riRealInfo;
      let pico = 1e-9; for (let i = 0; i < Math.min(datos.length, fs * tMax); i++) pico = Math.max(pico, Math.abs(datos[i]));
      g.strokeStyle = COL.violeta; g.lineWidth = 1;
      const hasta = Math.min(estado.ts, tMax);
      for (let x = xt(0); x < xt(hasta); x++) {
        const t0 = ((x - m.l) / (W - m.l - m.r)) * tMax, i0 = Math.floor(t0 * fs), i1 = Math.floor((t0 + tMax / (W - m.l - m.r)) * fs);
        let v = 0; for (let i = i0; i < i1 && i < datos.length; i++) v = Math.max(v, Math.abs(datos[i]));
        const d = 20 * Math.log10(v / pico + 1e-12);
        if (d > dbMin) { g.beginPath(); g.moveTo(x, H - m.b); g.lineTo(x, yd(d)); g.stroke(); }
      }
      return;
    }
    for (const l of ecoLlegadas) {
      if (l.t > estado.ts) break;
      const d = 20 * Math.log10(l.amp);
      if (d < dbMin) continue;
      g.strokeStyle = l.orden === 0 ? COL.senal : COL.violeta;
      g.lineWidth = l.orden === 0 ? (compacto ? 2.5 : 3.5) : (compacto ? 1 : 1.5);
      g.beginPath(); g.moveTo(xt(l.t), H - m.b); g.lineTo(xt(l.t), yd(d)); g.stroke();
    }
  }

  // Posición de la "partícula" de un rayo tras recorrer s metros.
  function puntoEn(rayo, s) {
    for (const tr of rayo.tramos) {
      if (s <= tr.ini + tr.largo) {
        const f = Math.max(0, (s - tr.ini) / tr.largo);
        return { punto: tr.desde.map((v, k) => v + f * (tr.hasta[k] - v)), tramo: tr };
      }
    }
    return null;
  }

  // ---------- Vista 3D (three.js) ----------

  async function crearVista3D(control) {
    const THREE = await import('three');
    const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
    if (control.abandonado) throw new Error('three.js tardó demasiado');
    const aT = ([x, y, z]) => new THREE.Vector3(x - sala.lx / 2, z, y - sala.ly / 2);   // sala (x,y,z-altura) → three

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(COL.papel);
    ui.escena.appendChild(renderer.domElement);
    renderer.domElement.addEventListener('webglcontextlost', (ev) => {   // GPU débil: caer a la planta 2D
      ev.preventDefault();
      renderer.domElement.remove();
      vista = crearVista2D();
      ui.escena.dataset.vista = vista.tipo;
      ui.aviso.hidden = false; ui.aviso.textContent = 'Se perdió el contexto 3D; se muestra la planta.';
    });
    const escena = new THREE.Scene();
    const camara = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 400);
    const controles = new OrbitControls(camara, renderer.domElement);
    controles.enableDamping = true;

    const esfera = (color, r) => new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), new THREE.MeshBasicMaterial({ color }));
    const mFuente = esfera(COL.violeta, 0.22); escena.add(mFuente);
    const mMic = esfera(COL.tinta, 0.2); escena.add(mMic);
    const frente = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), new THREE.MeshBasicMaterial({ color: COL.senal, wireframe: true, transparent: true, opacity: 0.06 }));
    escena.add(frente);

    const plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), -estado.mic[2]);   // arrastre del micrófono a su altura

    // Paredes, piso y cámara según las dimensiones actuales (se rehacen al cambiar la sala).
    let paredes = null, piso = null;
    function reconstruirSala() {
      for (const o of [paredes, piso]) if (o) { escena.remove(o); o.traverse((x) => { x.geometry?.dispose(); x.material?.dispose(); }); }
      const caja = new THREE.BoxGeometry(sala.lx, sala.lz, sala.ly);
      paredes = new THREE.Group();
      paredes.add(new THREE.LineSegments(new THREE.EdgesGeometry(caja), new THREE.LineBasicMaterial({ color: COL.tinta, transparent: true, opacity: 0.55 })));
      paredes.add(new THREE.Mesh(caja, new THREE.MeshBasicMaterial({ color: COL.violeta, transparent: true, opacity: 0.04, side: THREE.BackSide, depthWrite: false })));
      paredes.position.y = sala.lz / 2;
      paredes.visible = estado.modo !== 'libre';
      escena.add(paredes);
      const lado = Math.ceil(Math.max(sala.lx, sala.ly));
      piso = new THREE.GridHelper(lado, lado, COL.grilla, COL.grilla);
      escena.add(piso);
      const e = Math.max(sala.lx, sala.ly, sala.lz * 2) / 10;            // encuadre proporcional al tamaño
      camara.position.set(10 * 0.95 * e, 4 * 2.6 * e, 8 * 1.35 * e);
      controles.target.set(0, sala.lz * 0.35, 0);
      mFuente.position.copy(aT(fuente)); frente.position.copy(aT(fuente)); mMic.position.copy(aT(estado.mic));
      plano.constant = -estado.mic[2];
    }

    let objetos = [];
    function reconstruir() {
      objetos.forEach(({ linea, bola }) => { escena.remove(linea); escena.remove(bola); linea.geometry.dispose(); });
      if (paredes) paredes.visible = estado.modo !== 'libre';
      mMic.position.copy(aT(estado.mic));
      objetos = rayos.map((r) => {
        const pos = new Float32Array((r.camino.length + 1) * 3);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setDrawRange(0, 0);
        const color = r.orden === 0 ? COL.senal : COL.violeta;
        const linea = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: Math.max(0.15, Math.min(1, r.amp * 1.4)) }));
        const bola = esfera(color, 0.07);
        escena.add(linea); escena.add(bola);
        return { r, linea, bola, pos };
      });
    }

    function actualizar() {
      const s = estado.ts * C;
      frente.scale.setScalar(Math.max(0.01, s));
      frente.visible = s < Math.max(sala.lx, sala.ly) * 0.75;      // solo mientras el frente está dentro de la sala
      for (const o of objetos) {
        const p = puntoEn(o.r, s);
        let n = 0;
        const push = (q) => { const v = aT(q); o.pos[n * 3] = v.x; o.pos[n * 3 + 1] = v.y; o.pos[n * 3 + 2] = v.z; n++; };
        push(o.r.camino[0]);
        if (p) {
          for (const tr of o.r.tramos) { if (tr === p.tramo) break; push(tr.hasta); }
          push(p.punto);
          o.bola.visible = true; o.bola.position.copy(aT(p.punto));
        } else {
          o.r.camino.slice(1).forEach(push);
          o.bola.visible = false;
        }
        o.linea.geometry.attributes.position.needsUpdate = true;
        o.linea.geometry.setDrawRange(0, n);
      }
      controles.update();
      renderer.render(escena, camara);
    }

    // Arrastre del micrófono sobre el plano horizontal a su altura
    const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
    let arrastrando = false;
    const aPuntero = (ev) => { const r = renderer.domElement.getBoundingClientRect(); ptr.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, camara); };
    renderer.domElement.addEventListener('pointerdown', (ev) => { aPuntero(ev); if (ray.intersectObject(mMic).length) { arrastrando = true; controles.enabled = false; renderer.domElement.setPointerCapture(ev.pointerId); } });
    renderer.domElement.addEventListener('pointermove', (ev) => {
      if (!arrastrando) return;
      aPuntero(ev);
      const q = new THREE.Vector3();
      if (ray.ray.intersectPlane(plano, q)) {
        estado.mic[0] = Math.min(sala.lx - 0.3, Math.max(0.3, q.x + sala.lx / 2));
        estado.mic[1] = Math.min(sala.ly - 0.3, Math.max(0.3, q.z + sala.ly / 2));
        mMic.position.copy(aT(estado.mic));
      }
    });
    const soltar3D = () => { if (arrastrando) { arrastrando = false; controles.enabled = true; recalcular(); } };
    for (const tipo of ['pointerup', 'pointercancel', 'lostpointercapture']) renderer.domElement.addEventListener(tipo, soltar3D);

    function ajustar() {
      const w = ui.escena.clientWidth, h = ui.escena.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
      camara.aspect = w / h; camara.updateProjectionMatrix();
    }
    new ResizeObserver(ajustar).observe(ui.escena);
    ajustar();
    reconstruirSala();
    reconstruir();
    return { reconstruir, reconstruirSala, actualizar, tipo: '3d' };
  }

  // ---------- Vista 2D (planta) ----------

  function crearVista2D() {
    const cv = document.createElement('canvas');
    cv.style.touchAction = 'none';                        // arrastrar el micrófono sin desplazar la página
    cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', 'Planta de la sala: fuente, micrófono y fuentes imagen');
    ui.escena.appendChild(cv);
    const g = cv.getContext('2d');
    let W = 0, H = 0, esc = 1, ox = 0, oy = 0;
    function medir() {                                     // canvas al tamaño visible (px CSS × densidad)
      const w = ui.escena.clientWidth, h = ui.escena.clientHeight;
      if (!w || !h || (w === W && h === H)) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = w; H = h; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      esc = Math.min((W - 40) / sala.lx, (H - 30) / sala.ly);
      ox = (W - sala.lx * esc) / 2; oy = (H - sala.ly * esc) / 2;
    }
    const P = ([x, y]) => [ox + x * esc, oy + y * esc];
    let arrastrando = false;
    const aSala = (ev) => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left - ox) / esc, (ev.clientY - r.top - oy) / esc]; };
    cv.addEventListener('pointerdown', (ev) => { const [x, y] = aSala(ev); if (Math.hypot(x - estado.mic[0], y - estado.mic[1]) < 0.8) { arrastrando = true; cv.setPointerCapture(ev.pointerId); } });
    cv.addEventListener('pointermove', (ev) => { if (!arrastrando) return; const [x, y] = aSala(ev); estado.mic[0] = Math.min(sala.lx - 0.3, Math.max(0.3, x)); estado.mic[1] = Math.min(sala.ly - 0.3, Math.max(0.3, y)); });
    const soltar2D = () => { if (arrastrando) { arrastrando = false; recalcular(); } };
    for (const tipo of ['pointerup', 'pointercancel', 'lostpointercapture']) cv.addEventListener(tipo, soltar2D);

    function actualizar() {
      medir();
      const s = estado.ts * C, tt = W < 520 ? 11 : 13;
      g.fillStyle = COL.papel; g.fillRect(0, 0, W, H);
      if (estado.modo !== 'libre') { g.strokeStyle = COL.tinta; g.lineWidth = 2; g.strokeRect(ox, oy, sala.lx * esc, sala.ly * esc); }
      for (const r of rayos) {
        const p = puntoEn(r, s);
        g.strokeStyle = r.orden === 0 ? COL.senal : COL.violeta;
        g.globalAlpha = Math.max(0.15, Math.min(1, r.amp * 1.4));
        g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(...P(r.camino[0]));
        if (p) { for (const tr of r.tramos) { if (tr === p.tramo) break; g.lineTo(...P(tr.hasta)); } g.lineTo(...P(p.punto)); }
        else r.camino.slice(1).forEach((q) => g.lineTo(...P(q)));
        g.stroke();
      }
      g.globalAlpha = 1;
      g.fillStyle = COL.violeta; g.beginPath(); g.arc(...P(fuente), 6, 0, 2 * Math.PI); g.fill();
      g.fillStyle = COL.tinta; g.beginPath(); g.arc(...P(estado.mic), 6, 0, 2 * Math.PI); g.fill();
      g.font = `600 ${tt}px ${FUENTE}`;
      g.fillText('Micrófono (arrastrable)', P(estado.mic)[0] + 10, P(estado.mic)[1] + 4);
      g.fillStyle = COL.violeta; g.fillText('Fuente', P(fuente)[0] + 10, P(fuente)[1] + 4);
    }
    return { reconstruir() {}, reconstruirSala() { W = 0; H = 0; }, actualizar, tipo: '2d' };
  }

  // ---------- Ciclo de vida ----------

  function cuadro(ahora) {
    const dt = ultimo ? Math.min(0.1, (ahora - ultimo) / 1000) : 0;
    ultimo = ahora;
    if (QUIETO) estado.ts = tMax;                              // sin animación: estado final
    else if (estado.pausado) { /* quieto donde quedó */ }
    else if (estado.ts < tMax) estado.ts = Math.min(tMax, estado.ts + dt * LENTITUD * estado.velocidad);
    else if ((estado.pausa += dt) > 1.5) { estado.ts = 0; estado.pausa = 0; }
    vista.actualizar();
    dibujarEcograma();
    rafId = requestAnimationFrame(cuadro);
  }

  async function preparar() {
    construirUI();
    recalcular();
    if (hayWebGL()) {
      const control = { abandonado: false };
      try {
        vista = await Promise.race([
          crearVista3D(control),
          new Promise((_, rechazar) => setTimeout(() => { control.abandonado = true; rechazar(new Error('three.js no cargó en 6 s')); }, 6000)),
        ]);
      } catch (e) {
        ui.aviso.hidden = false; ui.aviso.textContent = `Vista 3D no disponible (${e.message}); se muestra la planta.`;
      }
    }
    if (!vista) vista = crearVista2D();
    ui.escena.dataset.vista = vista.tipo;
  }

  return {
    async iniciar() {
      estado.activa = true;
      if (!preparando) preparando = preparar();
      await preparando;
      if (!estado.activa || rafId || !vista) return;           // se salió mientras cargaba, o ya está corriendo
      ultimo = 0;
      raiz.dataset.animando = '1';
      rafId = requestAnimationFrame(cuadro);
    },
    detener() {
      estado.activa = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      raiz.dataset.animando = '0';
      canal.detener();
      if (ui) { delete ui.escuchar.dataset.cargando; botonEscuchar('Escuchar'); }
    },
  };
}
