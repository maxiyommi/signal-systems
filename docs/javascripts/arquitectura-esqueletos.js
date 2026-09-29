// Estructura básica de cada recuadro del diagrama de arquitectura de M0: dónde va y cómo se ve por
// fuera (firma, docstring, campos), sin la implementación que tiene que escribir cada grupo.
// Los services coinciden con los stubs de trabajo_practico/template_repo/app/services/.
(function () {
  const NI = '    raise NotImplementedError  # ← lo implementan ustedes';
  const service = (firma, doc, extra = '') => `${firma}\n    """${doc}"""\n${extra}${NI}`;
  const M1 = '../m1_generacion/', M2 = '../m2_procesamiento/', M3 = '../m3_producto_final/';

  window.ARQ_ESQUELETOS = {
    // ── Cliente ─────────────────────────────────────────────────────────────────────────────
    'Swagger (/docs)': {
      archivo: 'lo genera FastAPI solo', que: 'Documentación interactiva de todos los endpoints: se prueba la API desde el navegador, sin escribir código.',
      codigo: '# No se programa: FastAPI arma /docs a partir de los routers y schemas.\n# Con la API corriendo:\n#   uv run uvicorn app.main:app --reload\n# abrir http://localhost:8000/docs',
    },
    'frontend o script': {
      archivo: 'fuera de la API', que: 'Cualquier programa que le habla a la API por HTTP: el frontend de la cátedra, un script de Python o curl.',
      codigo: 'import requests\n\nr = requests.get("http://localhost:8000/health")\nprint(r.status_code, r.json())',
    },
    'sube un WAV': {
      archivo: 'cliente', que: 'El pedido de un análisis: se sube la respuesta al impulso grabada como archivo (multipart/form-data).',
      codigo: 'curl -X POST http://localhost:8000/api/v1/acoustics/parameters \\\n     -F "file=@ri_aula.wav"',
    },
    'recibe el JSON': {
      archivo: 'cliente', que: 'La respuesta: parámetros acústicos por banda de octava, en JSON.',
      codigo: '{\n  "center_frequencies": [125, 250, 500, 1000, 2000, 4000],\n  "parameters": {\n    "T30": {"125": ..., "250": ...},\n    "EDT": {...}\n  }\n}',
    },

    // ── Routers ─────────────────────────────────────────────────────────────────────────────
    'GET /health': {
      archivo: 'app/routers/health.py', que: 'Dice "estoy vivo". Ya viene hecho en el template: es el endpoint de M0.',
      codigo: 'router = APIRouter(tags=["health"])\n\n\n@router.get("/health", response_model=HealthResponse)\nasync def health() -> HealthResponse:\n    return HealthResponse(status="healthy", version=settings.version)',
    },
    'POST /signals/pink-noise': {
      archivo: 'app/routers/signals.py', que: 'Expone el service de ruido rosa. El router no calcula: recibe, llama y responde.', spec: M3,
      codigo: 'router = APIRouter(prefix="/signals", tags=["signals"])\n\n\n@router.post("/pink-noise", response_model=PinkNoiseResponse)\nasync def pink_noise(req: PinkNoiseRequest) -> PinkNoiseResponse:\n    audio = generate_pink_noise(req.duration, req.sample_rate)\n    ...  # guardar el WAV y armar la respuesta\n    return PinkNoiseResponse(...)',
    },
    'POST /signals/sine-sweep/pair': {
      archivo: 'app/routers/signals.py', que: 'Devuelve el sweep y su filtro inverso.', spec: M3,
      codigo: '@router.post("/sine-sweep/pair")\nasync def sine_sweep_pair(req: SineSweepRequest):\n    sweep, inverse_filter = generate_sine_sweep_pair(\n        req.duration, req.start_freq, req.end_freq, req.sample_rate\n    )\n    ...  # guardar los dos WAV y armar la respuesta',
    },
    'POST /signals/synthetic-ir': {
      archivo: 'app/routers/signals.py', que: 'Genera una RI sintética con T60 conocidos, para validar el análisis.', spec: M3,
      codigo: '@router.post("/synthetic-ir", response_model=SyntheticIRResponse)\nasync def synthetic_ir(req: SyntheticIRRequest) -> SyntheticIRResponse:\n    ir = generate_synthetic_ir(req.duration, ..., req.sample_rate)\n    ...',
    },
    'POST /signals/convolve': {
      archivo: 'app/routers/signals.py', que: 'Recibe la grabación del sweep y el filtro inverso, y devuelve la respuesta al impulso.', spec: M3,
      codigo: '@router.post("/convolve", response_model=ConvolveResponse)\nasync def convolve(recording: UploadFile, inverse_filter: UploadFile):\n    ...  # leer los dos archivos\n    ir = get_impulse_response(...)\n    ...',
    },
    'POST /filters/single-band': {
      archivo: 'app/routers/filters.py', que: 'Filtra un audio en una banda de octava.', spec: M3,
      codigo: 'router = APIRouter(prefix="/filters", tags=["filters"])\n\n\n@router.post("/single-band")\nasync def single_band(file: UploadFile, center_freq: float):\n    signal, fs = ...  # leer el archivo\n    filtered = filter_single_band(signal, fs, center_freq)\n    ...',
    },
    'POST /utils/log-scale': {
      archivo: 'app/routers/utils.py', que: 'Pasa una señal a escala logarítmica (dB).', spec: M3,
      codigo: 'router = APIRouter(prefix="/utils", tags=["utils"])\n\n\n@router.post("/log-scale", response_model=LogScaleResponse)\nasync def log_scale(file: UploadFile) -> LogScaleResponse:\n    ...',
    },
    'POST /utils/smoothing': {
      archivo: 'app/routers/utils.py', que: 'Devuelve la envolvente de una señal.', spec: M3,
      codigo: '@router.post("/smoothing", response_model=SmoothingResponse)\nasync def smoothing(file: UploadFile, method: SmoothingMethod = SmoothingMethod.HILBERT):\n    ...',
    },
    'POST /utils/schroeder': {
      archivo: 'app/routers/utils.py', que: 'Devuelve la curva de caída (integral de Schroeder).', spec: M3,
      codigo: '@router.post("/schroeder", response_model=SchroederResponse)\nasync def schroeder(file: UploadFile) -> SchroederResponse:\n    ...',
    },
    'POST /utils/lundeby': {
      archivo: 'app/routers/utils.py', que: 'Estima dónde cortar la integral por el ruido de fondo (opcional).', spec: M3,
      codigo: '@router.post("/lundeby", response_model=LundebyResponse)\nasync def lundeby(file: UploadFile) -> LundebyResponse:\n    ...',
    },
    'POST /acoustics/parameters': {
      archivo: 'app/routers/acoustics.py', que: 'El endpoint principal: recibe la RI y devuelve los parámetros ISO 3382. Encadena services, no calcula.', spec: M3,
      codigo: 'router = APIRouter(prefix="/acoustics", tags=["acoustics"])\n\n\n@router.post("/parameters", response_model=BandAnalysisResponse)\nasync def parameters(file: UploadFile) -> BandAnalysisResponse:\n    ...  # guardar el archivo en una carpeta temporal\n    ir, fs = load_audio(...)\n    resultados = calculate_parameters_from_ir(ir, fs)\n    return BandAnalysisResponse(...)',
    },

    // ── Schemas ─────────────────────────────────────────────────────────────────────────────
    HealthResponse: {
      archivo: 'app/schemas/responses.py', que: 'La forma de la respuesta de /health.',
      codigo: 'class HealthResponse(BaseModel):\n    status: str\n    version: str\n    timestamp: datetime',
    },
    BandAnalysisResponse: {
      archivo: 'app/schemas/responses.py', que: 'La respuesta del análisis: parámetros por banda.', spec: M3,
      codigo: 'class BandResult(BaseModel):\n    T30: float | None = None\n    T20: float | None = None\n    EDT: float | None = None\n\n\nclass BandAnalysisResponse(BaseModel):\n    center_frequencies: list[float]\n    band_results: dict[str, BandResult]\n    ...',
    },
    PinkNoiseRequest: {
      archivo: 'app/schemas/signals.py', que: 'Lo que tiene que venir en el pedido de ruido rosa. Si no cumple, FastAPI responde 422 solo.', spec: M3,
      codigo: 'class PinkNoiseRequest(BaseModel):\n    duration: float = Field(..., gt=0, le=60)          # segundos\n    sample_rate: int = Field(default=44100, ge=8000, le=192000)',
    },
    SineSweepRequest: {
      archivo: 'app/schemas/signals.py', que: 'El pedido del sweep: duración y rango de frecuencias.', spec: M3,
      codigo: 'class SineSweepRequest(BaseModel):\n    duration: float = Field(..., gt=0, le=60)\n    start_freq: float = Field(default=20, ge=1, le=20000)\n    end_freq: float = Field(default=20000, ge=1, le=22050)\n    sample_rate: int = Field(default=44100, ge=8000, le=192000)',
    },
    SyntheticIRRequest: {
      archivo: 'app/schemas/signals.py', que: 'El pedido de una RI sintética: duración y T60 por banda.', spec: M3,
      codigo: 'class SyntheticIRRequest(BaseModel):\n    duration: float = Field(..., gt=0, le=10)\n    t60_values: list[float]             # un T60 por banda de octava\n    sample_rate: int = Field(default=44100, ge=8000, le=192000)',
    },
    ConvolveRequest: {
      archivo: 'app/schemas/signals.py', que: 'Opciones de la convolución.', spec: M3,
      codigo: 'class ConvolveRequest(BaseModel):\n    mode: str = "full"          # full, same o valid\n    normalize: bool = True',
    },
    LogScaleResponse: {
      archivo: 'app/schemas/utils.py', que: 'La respuesta de la conversión a dB.', spec: M3,
      codigo: 'class LogScaleResponse(BaseModel):\n    num_samples: int\n    min_db: float\n    max_db: float',
    },
    SmoothingRequest: {
      archivo: 'app/schemas/utils.py', que: 'Qué método de suavizado usar.', spec: M3,
      codigo: 'class SmoothingRequest(BaseModel):\n    method: SmoothingMethod = SmoothingMethod.HILBERT   # hilbert o moving_average\n    window_ms: float = Field(default=10.0, ge=1.0, le=100.0)',
    },
    SchroederResponse: {
      archivo: 'app/schemas/utils.py', que: 'La respuesta de la curva de caída.', spec: M3,
      codigo: 'class SchroederResponse(BaseModel):\n    num_samples: int\n    lundeby_applied: bool',
    },
    LundebyResponse: {
      archivo: 'app/schemas/utils.py', que: 'El punto de corte estimado.', spec: M3,
      codigo: 'class LundebyResponse(BaseModel):\n    crossover_time: float       # segundos\n    crossover_samples: int\n    sample_rate: int',
    },

    // ── Services (los mismos stubs del template) ───────────────────────────────────────────
    generate_pink_noise: {
      archivo: 'app/services/pink_noise.py', que: 'Genera ruido rosa (−3 dB/octava).', spec: M1,
      codigo: service('def generate_pink_noise(duration: float, fs: int) -> np.ndarray:', 'Genera ruido rosa.\n\n    Returns: arreglo de largo int(duration * fs), normalizado entre -1 y 1.\n    '),
    },
    generate_sine_sweep_pair: {
      archivo: 'app/services/sine_sweep.py', que: 'Genera el sine sweep logarítmico y su filtro inverso.', spec: M1,
      codigo: service('def generate_sine_sweep_pair(\n    duration: float, f1: float, f2: float, fs: int\n) -> tuple[np.ndarray, np.ndarray]:', 'Genera el sweep y su filtro inverso.\n\n    Returns: (sweep, inverse_filter), ambos de largo int(duration * fs).\n    '),
    },
    play_and_record: {
      archivo: 'app/services/audio_io.py', que: 'Reproduce una señal y graba al mismo tiempo con la placa de audio.', spec: M1,
      codigo: service('def play_and_record(signal: np.ndarray, fs: int, record_duration: float) -> np.ndarray:', 'Reproduce y graba en simultáneo.\n\n    Raises: RuntimeError si no hay dispositivo de audio.\n    '),
    },
    load_audio: {
      archivo: 'app/services/signal_utils.py', que: 'Lee un WAV o FLAC y lo devuelve como arreglo (mono, normalizado) y su fs.', spec: M2,
      codigo: service('def load_audio(path: str | Path) -> tuple[np.ndarray, int]:', 'Carga un archivo de audio.\n\n    Returns: (signal, fs); signal mono, float64 en [-1, 1].\n    Raises: FileNotFoundError, ValueError.\n    '),
    },
    generate_synthetic_ir: {
      archivo: 'app/services/signal_utils.py', que: 'Sintetiza una RI con T60 conocidos por banda, para validar.', spec: M2,
      codigo: service('def generate_synthetic_ir(duration: float, t60_values: dict[float, float], fs: int) -> np.ndarray:', 'Sintetiza una respuesta al impulso con T60 conocidos.\n\n    t60_values: {frecuencia_central: T60}.\n    '),
    },
    get_impulse_response: {
      archivo: 'app/services/signal_utils.py', que: 'Obtiene la RI convolucionando la grabación con el filtro inverso.', spec: M2,
      codigo: service('def get_impulse_response(recording: np.ndarray, inverse_filter: np.ndarray) -> np.ndarray:', 'Obtiene la respuesta al impulso por deconvolución.'),
    },
    logarithmic_scale_conversion: {
      archivo: 'app/services/signal_utils.py', que: 'Pasa una señal a dB, con el máximo en 0 dB.', spec: M2,
      codigo: service('def logarithmic_scale_conversion(signal: np.ndarray) -> np.ndarray:', 'Convierte a escala logarítmica normalizada (dB).'),
    },
    filter_single_band: {
      archivo: 'app/services/filter.py', que: 'Filtro pasabanda de una octava (IEC 61260).', spec: M2,
      codigo: service('def filter_single_band(\n    signal: np.ndarray, fs: int, center_freq: float, order: int = 4\n) -> np.ndarray:', 'Filtra la señal en la banda de octava de center_freq.'),
    },
    apply_smoothing: {
      archivo: 'app/services/acoustic_parameters.py', que: 'Envolvente de la señal: Hilbert o media móvil.', spec: M3,
      codigo: service('def apply_smoothing(\n    signal: np.ndarray, fs: int, method: str = "hilbert", window_ms: float = 10\n) -> np.ndarray:', 'Devuelve la envolvente en amplitud.'),
    },
    apply_schroeder_integral: {
      archivo: 'app/services/acoustic_parameters.py', que: 'Curva de caída de energía (Schroeder), en dB.', spec: M3,
      codigo: service('def apply_schroeder_integral(ir: np.ndarray) -> np.ndarray:', 'Calcula la integral de Schroeder en dB (0 dB en la primera muestra).'),
    },
    linear_regression: {
      archivo: 'app/services/acoustic_parameters.py', que: 'Recta por mínimos cuadrados: de su pendiente salen EDT, T20 y T30.', spec: M3,
      codigo: service('def linear_regression(x: np.ndarray, y: np.ndarray) -> tuple[float, float, float]:', 'Regresión lineal por mínimos cuadrados.\n\n    Returns: (slope, intercept, r2).\n    '),
    },
    calculate_parameters_from_ir: {
      archivo: 'app/services/acoustic_parameters.py', que: 'Junta todo: parámetros ISO 3382 por banda.', spec: M3,
      codigo: service('def calculate_parameters_from_ir(ir: np.ndarray, fs: int) -> dict[str, dict[float, float]]:', 'Calcula EDT, T20, T30, D50 y C80 por banda de octava.\n\n    Returns: {"T30": {125: ..., 250: ...}, "EDT": {...}, ...}\n    '),
    },
    apply_lundeby: {
      archivo: 'app/services/acoustic_parameters.py', que: 'Punto de corte por ruido de fondo (opcional).', spec: M3,
      codigo: service('def apply_lundeby(ir: np.ndarray, fs: int) -> tuple[int, float]:', 'Estima dónde truncar la RI (método de Lundeby).\n\n    Returns: (index, noise_level_db).\n    '),
    },

    // ── Librerías ───────────────────────────────────────────────────────────────────────────
    FastAPI: { archivo: 'pyproject.toml', que: 'El framework de la API: routers, endpoints y /docs.', codigo: 'from fastapi import APIRouter, FastAPI, UploadFile\n\napp = FastAPI(title="RIR-API")\napp.include_router(health.router)' },
    Pydantic: { archivo: 'pyproject.toml', que: 'Valida los datos que entran y salen (los schemas).', codigo: 'from pydantic import BaseModel, Field' },
    NumPy: { archivo: 'pyproject.toml', que: 'Arreglos y cálculo numérico: todas las señales son np.ndarray.', codigo: 'import numpy as np' },
    SciPy: { archivo: 'pyproject.toml', que: 'Procesamiento de señales: filtros, convolución, Hilbert, Welch.', codigo: 'from scipy import signal\n# signal.butter, signal.sosfiltfilt, signal.fftconvolve, signal.hilbert' },
    sounddevice: { archivo: 'pyproject.toml', que: 'Reproducir y grabar con la placa de audio (solo play_and_record).', codigo: 'import sounddevice as sd\n# sd.playrec(...)' },
    soundfile: { archivo: 'pyproject.toml', que: 'Leer y escribir archivos WAV y FLAC.', codigo: 'import soundfile as sf\n# sf.read(...), sf.write(...)' },
  };
})();
