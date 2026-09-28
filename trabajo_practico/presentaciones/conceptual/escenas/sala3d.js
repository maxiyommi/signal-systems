// Sala 3D: rayos por fuentes imagen, ecograma sincronizado y auralización con el T60 de la sala.
// Si no hay WebGL (o three.js no carga) cae a una planta 2D con los mismos controles.
import { fuentesImagen, llegadas, caminoPlegado, sabineT60, riSintetica, edcDb, tiempoReverberacion } from '../../_comun/acustica.js';
import { obtenerContexto, cargarBuffer, crearCanal } from '../../_comun/audio.js';

const C = 343;
const T_MAX = 0.2;                 // s simulados: con orden 16 el ecograma está completo hasta ~190 ms en esta sala
const LENTITUD = 0.05;             // 1 s real = 50 ms simulados
const MAX_RAYOS = 60;
const COL = { tinta: '#1B1830', violeta: '#6B2FA3', senal: '#1E88C9', grilla: '#C9D6E2', papel: '#F7FAFC', tenue: '#9A98AE' };

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
  sala = { lx: 10, ly: 8, lz: 4 }, fuente = [2.5, 4, 1.6], mic = [7.5, 3, 1.6],
  audioSeco = 'audio/seco_canto.mp3', riReal = 'audio/sala_ri.mp3',
} = {}) {
  const raiz = seccion.querySelector('.sala');
  const estado = { alpha: 0.3, modo: 'simulada', mic: [...mic], ts: 0, pausa: 0, activa: false };
  const canal = crearCanal();
  let ui = null, vista = null, rayos = [], ecoLlegadas = [], riRealInfo = null, ultimo = 0, rafId = 0, preparando = null;

  // ---------- Datos acústicos ----------

  function recalcular() {
    const alpha = estado.modo === 'libre' ? 1 : estado.alpha;
    rayos = llegadas(fuentesImagen(sala, fuente, 3), estado.mic, alpha)
      .filter((l) => l.amp > 0)
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
    ecoLlegadas = llegadas(fuentesImagen(sala, fuente, estado.modo === 'libre' ? 0 : 16), estado.mic, alpha)
      .filter((l) => l.amp > 0 && l.t <= T_MAX);
    estado.ts = 0; estado.pausa = 0;
    actualizarTexto();
    if (vista) vista.reconstruir();
  }

  function actualizarTexto() {
    if (!ui) return;
    ui.alphaOut.textContent = estado.alpha.toFixed(2);
    ui.alpha.disabled = estado.modo !== 'simulada';
    if (estado.modo === 'simulada') ui.t60.textContent = `T60 ≈ ${sabineT60(sala, estado.alpha).toFixed(2)} s (Sabine)`;
    else if (estado.modo === 'real') ui.t60.textContent = riRealInfo ? `T60 medido ≈ ${riRealInfo.t30.toFixed(2)} s (RI de OpenAIR)` : 'Cargando la RI medida…';
    else ui.t60.textContent = 'Sin paredes: solo sonido directo';
    ui.modos.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modo === estado.modo)));
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
      await canal.reproducir(audioSeco, { riBuffer, alTerminar: () => botonEscuchar('Escuchar') });
    } catch (e) {
      ui.t60.textContent = e.message;
    } finally {
      delete ui.escuchar.dataset.cargando;
      if (!canal.sonando) botonEscuchar('Escuchar');
    }
  }

  // ---------- Interfaz ----------

  function construirUI() {
    raiz.innerHTML = `
      <div class="escena sala-escena" style="height: 430px;"></div>
      <div class="controles">
        <button type="button" data-modo="simulada">Sala simulada</button>
        <button type="button" data-modo="real">Sala real (Sports Centre)</button>
        <button type="button" data-modo="libre">Aire libre</button>
        <button type="button" data-accion="escuchar">Escuchar</button>
      </div>
      <div class="controles">
        <label>Absorción de las paredes (α)
          <input type="range" min="0.05" max="0.95" step="0.05" value="${estado.alpha}">
        </label>
        <output></output>
        <span class="t60" aria-live="polite"></span>
      </div>
      <canvas class="ecograma" width="1100" height="230" aria-label="Ecograma: llegadas al micrófono en el tiempo"></canvas>
      <p class="small aviso" hidden></p>`;
    ui = {
      escena: raiz.querySelector('.sala-escena'),
      modos: [...raiz.querySelectorAll('button[data-modo]')],
      escuchar: raiz.querySelector('[data-accion="escuchar"]'),
      alpha: raiz.querySelector('input[type="range"]'),
      alphaOut: raiz.querySelector('output'),
      t60: raiz.querySelector('.t60'),
      eco: raiz.querySelector('.ecograma'),
      aviso: raiz.querySelector('.aviso'),
    };
    ui.alpha.addEventListener('input', () => { estado.alpha = Number(ui.alpha.value); recalcular(); });
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

  function dibujarEcograma() {
    const cv = ui.eco, g = cv.getContext('2d');
    const W = cv.width, H = cv.height, m = { l: 84, r: 40, t: 40, b: 56 }, dbMin = -60;
    const xt = (t) => m.l + (t / T_MAX) * (W - m.l - m.r);
    const yd = (d) => m.t + (Math.min(0, d) / dbMin) * (H - m.t - m.b);
    g.clearRect(0, 0, W, H);
    g.fillStyle = COL.papel; g.fillRect(0, 0, W, H);
    g.font = '500 18px Archivo, sans-serif'; g.fillStyle = COL.tenue; g.strokeStyle = COL.grilla; g.lineWidth = 1;
    for (let t = 0; t <= T_MAX + 1e-9; t += 0.05) { g.beginPath(); g.moveTo(xt(t), m.t); g.lineTo(xt(t), H - m.b); g.stroke(); g.fillText(`${Math.round(t * 1000)}`, xt(t) - 12, H - m.b + 22); }
    for (const d of [0, -30, -60]) g.fillText(`${d}`, m.l - 36, yd(d) + 6);
    g.font = '600 18px Archivo, sans-serif';
    g.fillText('Tiempo desde la emisión (ms)', m.l + (W - m.l - m.r) / 2 - 120, H - 6);
    g.save(); g.translate(18, H - m.b + 4); g.rotate(-Math.PI / 2); g.fillText('dB rel. directo', 0, 0); g.restore();
    const leyenda = estado.modo === 'real' ? [[COL.violeta, 'RI medida (envolvente)']] : [[COL.senal, 'Sonido directo'], [COL.violeta, 'Reflexiones']];
    leyenda.forEach(([c, t], i) => { const x = m.l + 10 + i * 220; g.fillStyle = c; g.fillRect(x, 12, 26, 12); g.fillStyle = COL.tinta; g.fillText(t, x + 34, 24); });
    g.font = '500 18px Archivo, sans-serif';
    if (estado.modo === 'real' && riRealInfo) {
      const { datos, fs } = riRealInfo;
      let pico = 1e-9; for (let i = 0; i < Math.min(datos.length, fs * T_MAX); i++) pico = Math.max(pico, Math.abs(datos[i]));
      g.strokeStyle = COL.violeta; g.lineWidth = 1;
      const hasta = Math.min(estado.ts, T_MAX);
      for (let x = xt(0); x < xt(hasta); x++) {
        const t0 = ((x - m.l) / (W - m.l - m.r)) * T_MAX, i0 = Math.floor(t0 * fs), i1 = Math.floor((t0 + T_MAX / (W - m.l - m.r)) * fs);
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
      g.lineWidth = l.orden === 0 ? 4 : 2;
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
    const camara = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 200);
    camara.position.set(sala.lx * 0.95, sala.lz * 2.6, sala.ly * 1.35);
    const controles = new OrbitControls(camara, renderer.domElement);
    controles.target.set(0, sala.lz * 0.35, 0);
    controles.enableDamping = true;

    const caja = new THREE.BoxGeometry(sala.lx, sala.lz, sala.ly);
    const paredes = new THREE.Group();
    paredes.add(new THREE.LineSegments(new THREE.EdgesGeometry(caja), new THREE.LineBasicMaterial({ color: COL.tinta, transparent: true, opacity: 0.55 })));
    paredes.add(new THREE.Mesh(caja, new THREE.MeshBasicMaterial({ color: COL.violeta, transparent: true, opacity: 0.04, side: THREE.BackSide, depthWrite: false })));
    paredes.position.y = sala.lz / 2;
    escena.add(paredes);
    const piso = new THREE.GridHelper(Math.max(sala.lx, sala.ly), Math.max(sala.lx, sala.ly), COL.grilla, COL.grilla);
    escena.add(piso);

    const esfera = (color, r) => new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), new THREE.MeshBasicMaterial({ color }));
    const mFuente = esfera(COL.violeta, 0.22); mFuente.position.copy(aT(fuente)); escena.add(mFuente);
    const mMic = esfera(COL.tinta, 0.2); mMic.position.copy(aT(estado.mic)); escena.add(mMic);
    const frente = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), new THREE.MeshBasicMaterial({ color: COL.senal, wireframe: true, transparent: true, opacity: 0.06 }));
    frente.position.copy(aT(fuente)); escena.add(frente);

    let objetos = [];
    function reconstruir() {
      objetos.forEach(({ linea, bola }) => { escena.remove(linea); escena.remove(bola); linea.geometry.dispose(); });
      paredes.visible = estado.modo !== 'libre';
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
    const plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), -estado.mic[2]);
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
    renderer.domElement.addEventListener('pointerup', () => { if (arrastrando) { arrastrando = false; controles.enabled = true; recalcular(); } });

    function ajustar() {
      const w = ui.escena.clientWidth, h = ui.escena.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
      camara.aspect = w / h; camara.updateProjectionMatrix();
    }
    new ResizeObserver(ajustar).observe(ui.escena);
    ajustar();
    reconstruir();
    return { reconstruir, actualizar, tipo: '3d' };
  }

  // ---------- Vista 2D (planta) ----------

  function crearVista2D() {
    const cv = document.createElement('canvas');
    cv.width = 1100; cv.height = 470;
    ui.escena.appendChild(cv);
    const g = cv.getContext('2d');
    const esc = Math.min((cv.width - 80) / sala.lx, (cv.height - 60) / sala.ly);
    const ox = (cv.width - sala.lx * esc) / 2, oy = (cv.height - sala.ly * esc) / 2;
    const P = ([x, y]) => [ox + x * esc, oy + y * esc];
    let arrastrando = false;
    const aSala = (ev) => { const r = cv.getBoundingClientRect(); return [((ev.clientX - r.left) * cv.width / r.width - ox) / esc, ((ev.clientY - r.top) * cv.height / r.height - oy) / esc]; };
    cv.addEventListener('pointerdown', (ev) => { const [x, y] = aSala(ev); if (Math.hypot(x - estado.mic[0], y - estado.mic[1]) < 0.6) { arrastrando = true; cv.setPointerCapture(ev.pointerId); } });
    cv.addEventListener('pointermove', (ev) => { if (!arrastrando) return; const [x, y] = aSala(ev); estado.mic[0] = Math.min(sala.lx - 0.3, Math.max(0.3, x)); estado.mic[1] = Math.min(sala.ly - 0.3, Math.max(0.3, y)); });
    cv.addEventListener('pointerup', () => { if (arrastrando) { arrastrando = false; recalcular(); } });

    function actualizar() {
      const s = estado.ts * C;
      g.clearRect(0, 0, cv.width, cv.height);
      g.fillStyle = COL.papel; g.fillRect(0, 0, cv.width, cv.height);
      if (estado.modo !== 'libre') { g.strokeStyle = COL.tinta; g.lineWidth = 2; g.strokeRect(ox, oy, sala.lx * esc, sala.ly * esc); }
      for (const r of rayos) {
        const p = puntoEn(r, s);
        g.strokeStyle = r.orden === 0 ? COL.senal : COL.violeta;
        g.globalAlpha = Math.max(0.15, Math.min(1, r.amp * 1.4));
        g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(...P(r.camino[0]));
        if (p) { for (const tr of r.tramos) { if (tr === p.tramo) break; g.lineTo(...P(tr.hasta)); } g.lineTo(...P(p.punto)); }
        else r.camino.slice(1).forEach((q) => g.lineTo(...P(q)));
        g.stroke();
      }
      g.globalAlpha = 1;
      g.fillStyle = COL.violeta; g.beginPath(); g.arc(...P(fuente), 9, 0, 2 * Math.PI); g.fill();
      g.fillStyle = COL.tinta; g.beginPath(); g.arc(...P(estado.mic), 9, 0, 2 * Math.PI); g.fill();
      g.font = '600 18px Archivo, sans-serif';
      g.fillText('Micrófono (arrastrable)', P(estado.mic)[0] + 14, P(estado.mic)[1] + 6);
      g.fillStyle = COL.violeta; g.fillText('Fuente', P(fuente)[0] + 14, P(fuente)[1] + 6);
    }
    return { reconstruir() {}, actualizar, tipo: '2d' };
  }

  // ---------- Ciclo de vida ----------

  function cuadro(ahora) {
    const dt = ultimo ? Math.min(0.1, (ahora - ultimo) / 1000) : 0;
    ultimo = ahora;
    if (QUIETO) estado.ts = T_MAX;                              // sin animación: estado final
    else if (estado.ts < T_MAX) estado.ts = Math.min(T_MAX, estado.ts + dt * LENTITUD);
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
