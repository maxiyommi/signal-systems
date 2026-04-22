# Rubrica de evaluacion - RIR-API

## Distribucion de notas

| Componente | Peso | Fecha de entrega |
|------------|------|-----------------|
| **M0**: El Plano (arquitectura) | 5% | Semana 5 - 28/04/2026 |
| **M1**: Generacion de senales | 15% | Semana 8 - 19/05/2026 |
| **M2**: Procesamiento de la RI | 20% | Semana 12 - 16/06/2026 |
| **M3**: Producto final | 30% | Semana 15 - 07/07/2026 |
| **Presentacion oral** | 15% | Semana 15 - 07/07/2026 |
| **Participacion y proceso** | 10% | Continuo |
| **Log de desarrollo con IA** | 5% | Con cada milestone |
| **Total** | **100%** | |

**Nota minima de aprobacion**: 4/10 en cada milestone y 4/10 en el total ponderado.

---

## Rubrica por milestone (M1, M2, M3)

Cada milestone se evalua en 5 criterios. La nota del milestone es el promedio ponderado de estos criterios.

### Funcionalidad (30%)

| Nivel | Puntos | Descripcion |
|-------|--------|-------------|
| **Insuficiente** | 0-3 | Las funciones no ejecutan o producen resultados incorrectos. Faltan funciones requeridas. Los errores no se manejan. |
| **Regular** | 4-5 | Algunas funciones operan correctamente pero hay errores significativos en otras. Los resultados son parcialmente correctos. Manejo de errores basico. |
| **Bueno** | 6-7 | Todas las funciones requeridas estan implementadas y operan correctamente en los casos tipicos. Los resultados son correctos para la mayoria de las entradas. Manejo de errores adecuado. |
| **Excelente** | 8-10 | Todas las funciones operan correctamente en casos tipicos y extremos. Los resultados son precisos y coinciden con los valores de referencia. Manejo de errores robusto con mensajes informativos. Implementacion eficiente. |

### Calidad de codigo (20%)

| Nivel | Puntos | Descripcion |
|-------|--------|-------------|
| **Insuficiente** | 0-3 | Codigo desordenado, sin estructura. Sin docstrings ni type hints. No sigue PEP 8. Variables con nombres no descriptivos. Codigo duplicado. |
| **Regular** | 4-5 | Estructura basica del proyecto. Algunos docstrings y type hints. Cumplimiento parcial de PEP 8. Nombres de variables aceptables. |
| **Bueno** | 6-7 | Proyecto bien estructurado en modulos. Docstrings en la mayoria de funciones publicas. Type hints presentes. PEP 8 cumplido (pasa `ruff check`). Nombres claros y descriptivos. |
| **Excelente** | 8-10 | Estructura modular excelente. Docstrings completos en formato NumPy en todas las funciones publicas. Type hints completos. PEP 8 impecable. Codigo limpio, legible y bien organizado. Sin codigo muerto ni duplicado. Uso apropiado de constantes y configuracion. |

### Testing (20%)

| Nivel | Puntos | Descripcion |
|-------|--------|-------------|
| **Insuficiente** | 0-3 | Sin tests o con tests que no ejecutan. No se verifica el comportamiento de las funciones. |
| **Regular** | 4-5 | Algunos tests basicos que pasan. Cobertura baja (< 50%). Los tests verifican solo el "happy path". |
| **Bueno** | 6-7 | Tests para todas las funciones requeridas. Cobertura razonable (50-80%). Tests verifican tanto casos exitosos como casos de error. Nombres de tests descriptivos. |
| **Excelente** | 8-10 | Tests exhaustivos con cobertura > 80%. Incluye tests de casos extremos y de borde. Tests parametrizados donde corresponde. Fixtures bien organizados. Validacion numerica con tolerancias adecuadas. Tests ejecutan en CI. |

### Documentacion (15%)

| Nivel | Puntos | Descripcion |
|-------|--------|-------------|
| **Insuficiente** | 0-3 | Sin README o README vacio. Sin documentacion de funciones. Sin instrucciones de uso. |
| **Regular** | 4-5 | README basico con descripcion del proyecto. Instrucciones de instalacion incompletas. Documentacion parcial. |
| **Bueno** | 6-7 | README completo con descripcion, instalacion y uso. Docstrings en funciones principales. Ejemplos de uso basicos. |
| **Excelente** | 8-10 | README completo y profesional. Documentacion exhaustiva con ejemplos. Diagramas de arquitectura actualizados. Instrucciones de uso claras y reproducibles. Changelog mantenido. |

### Practicas Git (15%)

| Nivel | Puntos | Descripcion |
|-------|--------|-------------|
| **Insuficiente** | 0-3 | Todos los cambios en un solo commit o en la rama main. Sin uso de ramas. Mensajes de commit no descriptivos ("fix", "update", "cambios"). |
| **Regular** | 4-5 | Algunos commits con mensajes descriptivos. Uso basico de ramas. Push directo a main con algunos PRs. |
| **Bueno** | 6-7 | Commits frecuentes con mensajes descriptivos. Uso de ramas de feature. Pull requests con revisiones. Tags de version creados. |
| **Excelente** | 8-10 | Historial de Git limpio y profesional. Conventional Commits o convencion consistente. Todas las funciones desarrolladas en ramas separadas con PRs revisados. Issues vinculados a PRs. Tags y releases creados correctamente. Branching strategy respetada. |

---

## Rubrica de M0: El Plano (5%)

M0 se evalua como aprobado/desaprobado con los siguientes criterios:

| Criterio | Requerido | Puntos |
|----------|-----------|--------|
| Repositorio accesible por docentes | Si | 1 |
| README completo (nombre, integrantes, instalacion, estructura) | Si | 2 |
| Diagrama de arquitectura con todos los modulos | Si | 2 |
| Al menos 10 issues con labels y asignaciones | Si | 2 |
| Proyecto ejecutable con `uvicorn` (endpoint `/health` funcional) | Si | 2 |
| Branching strategy documentada | Si | 1 |
| **Total** | | **10** |

**Nota**: M0 se aprueba con 4/10 o mas.

---

## Rubrica de presentacion oral (15%)

### Aspectos tecnicos (40%)

| Nivel | Puntos | Descripcion |
|-------|--------|-------------|
| **Insuficiente** | 0-3 | Comprension superficial del proyecto. No puede explicar las decisiones de diseno. Demo no funciona. Resultados no validados. |
| **Regular** | 4-5 | Comprension basica del proyecto. Explica algunas decisiones de diseno. Demo parcialmente funcional. Validacion limitada. |
| **Bueno** | 6-7 | Buena comprension del proyecto y las decisiones de diseno. Demo funcional. Resultados validados y presentados con claridad. |
| **Excelente** | 8-10 | Comprension profunda de todos los aspectos tecnicos. Justificacion solida de decisiones de diseno. Demo impecable. Validacion exhaustiva con analisis critico de resultados. Capacidad de responder preguntas tecnicas con precision. |

### Comunicacion (35%)

| Nivel | Puntos | Descripcion |
|-------|--------|-------------|
| **Insuficiente** | 0-3 | Presentacion desordenada. No se entiende el contenido. Mal manejo del tiempo (muy corta o muy larga). Material visual pobre o inexistente. |
| **Regular** | 4-5 | Estructura basica de presentacion. Contenido parcialmente claro. Manejo del tiempo aceptable. Material visual basico. |
| **Bueno** | 6-7 | Presentacion bien estructurada. Contenido claro y organizado. Buen manejo del tiempo. Material visual adecuado con graficas y diagramas. |
| **Excelente** | 8-10 | Presentacion profesional y fluida. Explicaciones claras usando terminologia tecnica precisa. Manejo del tiempo impecable. Material visual excelente. Todos los integrantes participan de manera equilibrada. Respuestas claras y concisas a las preguntas. |

### Analisis critico (25%)

| Nivel | Puntos | Descripcion |
|-------|--------|-------------|
| **Insuficiente** | 0-3 | Sin reflexion sobre limitaciones o dificultades. No identifica posibles mejoras. No conecta con la teoria vista en clase. |
| **Regular** | 4-5 | Reflexion superficial sobre algunas dificultades. Identifica pocas mejoras. Conexion limitada con la teoria. |
| **Bueno** | 6-7 | Reflexion honesta sobre dificultades y como se resolvieron. Identifica mejoras concretas. Conecta resultados con la teoria. |
| **Excelente** | 8-10 | Analisis critico profundo y honesto. Identifica limitaciones con precision y propone mejoras concretas y viables. Conecta resultados con teoria y con aplicaciones profesionales reales. Reflexion madura sobre el proceso de aprendizaje. |

---

## Rubrica de participacion y proceso (10%)

| Nivel | Puntos | Descripcion |
|-------|--------|-------------|
| **Insuficiente** | 0-3 | Contribucion minima o nula al proyecto. Sin participacion en clase. Sin evidencia de trabajo en equipo en el historial de Git. |
| **Regular** | 4-5 | Participacion basica. Algunos commits y PRs. Asistencia regular a clase. |
| **Bueno** | 6-7 | Participacion activa. Contribuciones regulares y significativas al codigo. Revisiones de PRs de companeros. Asistencia y participacion en clase. |
| **Excelente** | 8-10 | Participacion destacada. Contribuciones frecuentes y de alta calidad. Revisiones detalladas de PRs. Ayuda a companeros. Participacion activa en clase y consultas. Liderazgo positivo en el equipo. |

**Nota sobre contribuciones individuales:** Se evaluara el historial de Git para verificar que todos los integrantes del grupo contribuyen de manera equitativa. Diferencias significativas en la cantidad y calidad de contribuciones pueden resultar en notas individuales diferentes dentro del mismo grupo.

---

## Rubrica del log de desarrollo con IA (5%)

Cada grupo debe mantener un **log de desarrollo con IA** que documente como se utilizaron herramientas de inteligencia artificial (ChatGPT, Claude, Copilot, etc.) durante el proyecto.

### Formato del log

El log debe ser un archivo `AI_LOG.md` en la raiz del repositorio, actualizado con cada milestone. Cada entrada debe contener:

1. **Fecha y milestone**.
2. **Herramienta utilizada** (nombre y version si corresponde).
3. **Prompt o consulta realizada** (resumido).
4. **Resultado obtenido** (resumido).
5. **Evaluacion**: fue util? que se modifico del resultado? que se aprendio?

### Criterios de evaluacion

| Criterio | Peso | Descripcion |
|----------|------|-------------|
| **Honestidad** | 40% | Transparencia en el uso de herramientas de IA. Se documenta sin omisiones. No se presenta codigo generado por IA como propio sin mencion. |
| **Reflexion** | 35% | Se reflexiona sobre la calidad de las respuestas de la IA. Se identifican errores o limitaciones. Se comparan las sugerencias con el conocimiento adquirido en clase. |
| **Aplicacion** | 25% | Se demuestra que la IA se uso como herramienta de aprendizaje, no como reemplazo del pensamiento critico. Se modificaron y adaptaron las sugerencias al contexto especifico del proyecto. |

| Nivel | Puntos | Descripcion |
|-------|--------|-------------|
| **Insuficiente** | 0-3 | Sin log o log vacio. Evidencia de uso de IA sin documentar. |
| **Regular** | 4-5 | Log basico con pocas entradas. Documentacion superficial de interacciones. Poca reflexion. |
| **Bueno** | 6-7 | Log completo con entradas para cada milestone. Documentacion clara de prompts y resultados. Reflexion honesta sobre utilidad y limitaciones. |
| **Excelente** | 8-10 | Log detallado y reflexivo. Analisis critico de cada interaccion con IA. Identificacion clara de lo que funciono y lo que no. Reflexion sobre el aprendizaje obtenido. Ejemplos concretos de como se mejoraron las sugerencias de la IA. |

---

## Politica de entregas tardias

- Entregas hasta **48 horas despues** de la fecha limite: penalizacion de **-2 puntos** sobre la nota del milestone.
- Entregas despues de **48 horas**: no se aceptan. El milestone se califica con **0** y pasa a instancia de **recuperatorio**.
- El recuperatorio consiste en entregar el milestone con una semana adicional de plazo, con nota maxima de **7/10**.

## Politica de integridad academica

- El codigo debe ser original del grupo. Se permite (y se fomenta) el uso de herramientas de IA, pero debe documentarse en el log.
- Copiar codigo de otro grupo sin atribucion se considera plagio y resulta en la desaprobacion del TP completo para ambos grupos.
- El uso de librerias externas esta permitido siempre que se documenten en las dependencias del proyecto y se justifique su uso.
- Las funciones especificadas en los milestones deben implementarse, no reemplazarse por llamadas a librerias de alto nivel que oculten la logica (por ejemplo, no usar una funcion `calcular_t60()` de una libreria externa).

---

## Resumen visual

```
Nota final = 0.05 * M0 + 0.15 * M1 + 0.20 * M2 + 0.30 * M3
           + 0.15 * Presentacion + 0.10 * Participacion + 0.05 * Log_IA
```

Cada componente se evalua en escala 0-10. La nota final se calcula como el promedio ponderado. Se requiere un minimo de 4/10 en cada milestone individual para aprobar la materia.
