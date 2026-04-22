# Guía de Configuración del Entorno de Desarrollo

## Requisitos previos

- Sistema operativo: Windows 10+, macOS 12+, o Linux (Ubuntu 22.04+)
- Conexión a internet
- Cuenta de GitHub (crear en [github.com](https://github.com))

---

## 1. Instalar Python 3.12+

### Windows
1. Descargar desde [python.org/downloads](https://www.python.org/downloads/)
2. **IMPORTANTE**: Marcar "Add Python to PATH" durante la instalación
3. Verificar en terminal: `python --version`

### macOS
```bash
# Con Homebrew (recomendado)
brew install python@3.12
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install python3.12 python3.12-venv python3.12-dev
```

### Verificar instalación
```bash
python3 --version   # Debe mostrar 3.12.x o superior
```

---

## 2. Instalar uv (gestor de paquetes moderno)

`uv` es un gestor de paquetes Python ultrarrápido que reemplaza a pip + venv.

### Instalación
```bash
# Linux/macOS
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### Verificar
```bash
uv --version
```

### Uso básico
```bash
# Crear un nuevo proyecto
uv init mi-proyecto
cd mi-proyecto

# Agregar dependencias
uv add numpy scipy matplotlib

# Crear entorno virtual e instalar
uv sync

# Ejecutar un script
uv run python mi_script.py

# Ejecutar tests
uv run pytest
```

---

## 3. Instalar VS Code

1. Descargar desde [code.visualstudio.com](https://code.visualstudio.com/)
2. Instalar las siguientes extensiones:
    - **Python** (Microsoft) — soporte Python
    - **Pylance** (Microsoft) — autocompletado inteligente
    - **Marimo** (marimo-team) — soporte para notebooks Marimo

### Configuración recomendada de VS Code
Agregar en `settings.json` (Ctrl+Shift+P → "Preferences: Open User Settings (JSON)"):

```json
{
    "editor.formatOnSave": true,
    "python.defaultInterpreterPath": "python3",
    "[python]": {
        "editor.defaultFormatter": "charliermarsh.ruff",
        "editor.codeActionsOnSave": {
            "source.fixAll": "explicit",
            "source.organizeImports": "explicit"
        }
    },
    "python.analysis.typeCheckingMode": "basic"
}
```

---

## 4. Instalar Git

### Windows
Descargar desde [git-scm.com](https://git-scm.com/download/win)

### macOS
```bash
brew install git
# o simplemente ejecutar `git` — macOS ofrece instalarlo automáticamente
```

### Linux
```bash
sudo apt install git
```

### Configuración inicial
```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu_email@ejemplo.com"
git config --global init.defaultBranch main
```

---

## 5. Instalar Marimo

Marimo es el notebook interactivo que usamos en la cursada (reemplaza a Jupyter).

```bash
uv tool install marimo
# o con pip
pip install marimo
```

### Verificar
```bash
marimo --version
```

### Uso básico
```bash
# Abrir un notebook existente en modo edición
marimo edit contenido.py

# Ejecutar un notebook (modo solo lectura)
marimo run contenido.py

# Crear un notebook nuevo
marimo edit nuevo_notebook.py

# Convertir un Jupyter notebook a Marimo
marimo convert notebook.ipynb > notebook.py
```

---

## 6. Instalar Quarto (opcional, para informes)

Quarto permite escribir informes técnicos en Markdown con LaTeX math.

### Instalación
Descargar desde [quarto.org/docs/get-started](https://quarto.org/docs/get-started/)

### Verificar
```bash
quarto --version
```

---

## 7. Herramientas de IA (gratuitas)

### Claude.ai
- Registrarse en [claude.ai](https://claude.ai) (plan gratuito)
- Útil para: generar código, explicar conceptos, debugging

### ChatGPT
- Registrarse en [chat.openai.com](https://chat.openai.com) (plan gratuito)
- Útil para: generación de código, explicaciones

### Ollama (modelos locales, opcional)
```bash
# Instalar Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Descargar un modelo para código
ollama pull qwen2.5-coder:7b

# Usar
ollama run qwen2.5-coder:7b "Escribí una función Python que genere una senoidal"
```

---

## Verificación final

Ejecutar estos comandos para verificar que todo está instalado:

```bash
python3 --version          # Python 3.12+
uv --version               # uv instalado
git --version               # Git instalado
marimo --version            # Marimo instalado
code --version              # VS Code instalado (opcional desde terminal)
```

### Test rápido
```bash
# Crear un proyecto de prueba
mkdir test-setup && cd test-setup
uv init
uv add numpy
uv run python -c "import numpy; print(f'NumPy {numpy.__version__} funcionando!')"
```

Si todo funciona, estás listo para la cursada.

---

## Problemas comunes

| Problema | Solución |
|----------|----------|
| `python` no se encuentra | Agregar Python al PATH. En Windows, reinstalar marcando "Add to PATH" |
| `uv` no se encuentra | Cerrar y reabrir la terminal después de instalar |
| Permisos en Linux/macOS | Usar `chmod +x` o `sudo` según corresponda |
| VS Code no detecta Python | Seleccionar intérprete: Ctrl+Shift+P → "Python: Select Interpreter" |
| Git pide credenciales cada vez | Configurar SSH keys o credential helper: `git config --global credential.helper store` |

## Soporte
- Canal de Slack del curso
- Consultas en clase (martes 15-18h)
- Issues en el repo del curso
