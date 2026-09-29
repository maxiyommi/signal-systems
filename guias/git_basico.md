# Git Básico — Cheatsheet para la Cursada

## Conceptos clave

```
Working Directory  →  Staging Area  →  Local Repository  →  Remote Repository
     (editar)        (git add)         (git commit)          (git push)
```

- **Working Directory**: tus archivos en disco
- **Staging Area**: archivos listos para el próximo commit
- **Commit**: una "foto" del estado del proyecto
- **Branch**: una línea de desarrollo independiente
- **Remote**: el repositorio en GitHub

---

## Configuración inicial (una sola vez)

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu_email@ejemplo.com"
git config --global init.defaultBranch main
```

---

## Flujo de trabajo diario

### 1. Ver el estado actual
```bash
git status              # ¿Qué cambió?
git diff                # Ver cambios en detalle
git log --oneline -10   # Últimos 10 commits
```

### 2. Guardar cambios (commit)
```bash
git add archivo.py          # Agregar un archivo al staging
git add app/                # Agregar un directorio completo
git add .                   # Agregar TODO (usar con cuidado)

git commit -m "Agregar función de ruido rosa"   # Crear commit
```

### 3. Subir a GitHub
```bash
git push                    # Subir commits al remoto
git push -u origin feature/ruido-rosa   # Primera vez: establecer tracking de tu rama
```

### 4. Traer cambios de GitHub
```bash
git pull                    # Descargar y fusionar cambios
git fetch                   # Solo descargar (sin fusionar)
```

---

## Branches (ramas)

### Estrategia para el TP
```
main (protegida)             ← código estable, tags de entrega (v0.1.0, v0.2.0, v1.0.0)
  ├── feature/ruido-rosa     ← cada cambio en su rama feature/nombre-descriptivo
  ├── feature/sine-sweep
  └── feature/filtros-iec
```

- **`main` está protegida**: nadie hace push directo. Todo entra por **pull request** (PR) a `main`.
- Cada tarea se trabaja en una rama `feature/nombre-descriptivo` que sale de `main` actualizada.
- Una rama `develop` intermedia es **opcional**; con `main` + `feature/*` + PR alcanza para el TP.

!!! tip "Proteger `main` en GitHub"
    Repo → Settings → Branches → Add branch protection rule → `main` → marcar *Require a pull request before merging*.

### Comandos
```bash
# Crear y cambiar a una nueva rama
git checkout -b feature/ruido-rosa

# Ver ramas
git branch              # Locales
git branch -r           # Remotas

# Cambiar de rama
git checkout main
git checkout feature/ruido-rosa

# Subir una rama nueva a GitHub (después se abre el PR a main desde la web)
git push -u origin feature/ruido-rosa

# Traer a tu rama lo último de main (si main avanzó mientras trabajabas)
git checkout feature/ruido-rosa
git pull origin main

# Eliminar rama local (después de que el PR se mergeó)
git checkout main
git pull
git branch -d feature/ruido-rosa
```

---

## Tags (para entregas)

Cada entrega se marca con un **tag anotado** sobre `main`, con todo ya mergeado:

| Milestone | Tag |
|-----------|-----|
| M1 | `v0.1.0` |
| M2 | `v0.2.0` |
| M3 | `v1.0.0` |

```bash
# Pararse en main actualizada
git checkout main
git pull

# Crear el tag anotado de la entrega y subirlo
git tag -a v0.1.0 -m "M1: generación de señales" && git push origin v0.1.0

# Ver tags
git tag -l
```

---

## Mensajes de commit

### Formato recomendado (Conventional Commits)
```
<tipo>: <descripción breve>

<descripción detallada opcional>
```

### Tipos comunes
| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Cambios en documentación |
| `test` | Agregar o modificar tests |
| `refactor` | Reestructurar sin cambiar funcionalidad |
| `style` | Formato, espacios, puntos y comas |

### Ejemplos buenos
```
feat: agregar generación de ruido rosa con Voss-McCartney
fix: corregir cálculo de frecuencias en filtro de octava
test: agregar tests para integral de Schroeder
docs: actualizar README con instrucciones de instalación
refactor: extraer cálculo de espectro a función separada
```

### Ejemplos malos
```
cambios                    # ¿Qué cambios?
arreglos varios            # ¿Qué arreglos?
wip                        # No commitear trabajo incompleto
asdasd                     # ...
```

---

## Resolver conflictos

Cuando dos personas modifican el mismo archivo:

```bash
git pull                    # Puede generar conflicto

# Git marca los conflictos así:
# <<<<<<< HEAD
# tu código
# =======
# código del compañero
# >>>>>>> origin/main

# 1. Editar el archivo y elegir qué mantener
# 2. Quitar las marcas de conflicto
# 3. git add archivo_resuelto.py
# 4. git commit -m "fix: resolver conflicto en generacion.py"
```

---

## .gitignore

Archivo que dice a Git qué ignorar. Crear en la raíz del proyecto:

```gitignore
# Python
__pycache__/
*.pyc
*.pyo
.venv/
*.egg-info/
dist/
build/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Datos
*.wav
*.mp3
*.flac
datos/

# Jupyter (si se usa)
.ipynb_checkpoints/

# Env
.env
```

---

## GitHub Issues (para el TP)

### Crear un issue desde la web
1. Ir al repo → Issues → New Issue
2. Título descriptivo: "Implementar función generate_pink_noise"
3. Descripción con checklist:
   ```markdown
   ## Descripción
   Implementar la generación de ruido rosa usando el algoritmo Voss-McCartney.

   ## Criterios de aceptación
   - [ ] Función genera array de la duración correcta
   - [ ] Espectro es aproximadamente -3dB/octava
   - [ ] Docstring completo (estilo NumPy)
   - [ ] Type hints
   - [ ] Al menos 2 tests con pytest
   ```
4. Asignar a un integrante
5. Agregar label: `milestone-1`

### Cerrar un issue con un commit
```bash
git commit -m "feat: implementar ruido rosa (closes #3)"
```
El `closes #3` cierra automáticamente el issue #3 cuando se mergea.

---

## Comandos de emergencia

```bash
# Deshacer cambios en un archivo (no commiteados)
git checkout -- archivo.py

# Deshacer el último commit (manteniendo los cambios)
git reset --soft HEAD~1

# Ver quién cambió cada línea de un archivo
git blame archivo.py

# Buscar un texto en todo el historial
git log --all -S "pink_noise"

# Ver el diff de un commit específico
git show abc1234
```

---

## Flujo completo de ejemplo

```bash
# 1. Empezar a trabajar en una nueva función
git checkout main
git pull
git checkout -b feature/ruido-rosa

# 2. Escribir código y tests
# ... editar app/services/generacion.py
# ... editar tests/test_generacion.py

# 3. Verificar
uv run pytest
uv run ruff check .

# 4. Commit
git add app/services/generacion.py tests/test_generacion.py
git commit -m "feat: implementar generación de ruido rosa (closes #3)"

# 5. Subir
git push -u origin feature/ruido-rosa

# 6. Crear Pull Request a main en GitHub
# 7. Pedir review a un compañero
# 8. Mergear a main después del review (main está protegida: siempre por PR)
```
