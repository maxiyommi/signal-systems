# Rubrica de evaluacion - RIR-API

> **2.º cuatrimestre 2026.** El TP pesa el **20 %** de la nota de la materia y se evalua con un esquema simple: solo llevan nota el **producto final (M3)** y la **presentacion oral**.

## Distribucion de la nota del TP

| Componente | Peso | Fecha |
|------------|------|-------|
| **M3**: Producto final | **60%** | Mie 18/11/2026 (tag `v1.0.0`) |
| **Presentacion oral** (Demo Day) | **40%** | Mie 18/11/2026 |
| M0, M1, M2 | Sin nota | Seguimiento con feedback por Slack |

```
Nota del TP = 0.60 * M3 + 0.40 * Presentacion oral
```

**Nota minima de aprobacion**: 4/10 en M3 y 4/10 en la nota del TP.

### Milestones de seguimiento (M0, M1, M2)

M0, M1 y M2 **no llevan nota**. En cada entrega el grupo muestra su avance (~15 minutos) y recibe una devolucion por Slack. Son la mejor oportunidad para detectar problemas antes de la entrega final: aprovechenlas.

### Requisitos para que M3 se considere completo

- Tag `v1.0.0` en `main` en la fecha de entrega.
- Repositorio accesible por los docentes como colaboradores.
- **`AI_LOG.md`** en la raiz del repositorio, actualizado durante todo el proyecto (obligatorio, sin nota propia — ver la [consigna](README.md#log-de-desarrollo-con-ia)).

---

## Rubrica de M3: producto final (60%)

M3 se evalua en 5 criterios. Cada criterio se valora con un nivel cualitativo (Insuficiente / Regular / Bueno / Excelente).

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

## Rubrica de presentacion oral (40%)

Duracion: 20 minutos de presentacion + 5 minutos de preguntas, con demo en vivo de la API.

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

**Nota sobre contribuciones individuales:** se revisara el historial de Git y la participacion en la oral para verificar que todos los integrantes contribuyen. Diferencias significativas pueden resultar en notas individuales diferentes dentro del mismo grupo.

---

## Politica de entregas tardias

- Si M3 no se entrega en la fecha indicada, pasa a instancia de **recuperatorio** (una semana adicional de plazo, nota maxima **7/10**).

## Politica de integridad academica

- El codigo debe ser original del grupo. Se permite (y se fomenta) el uso de herramientas de IA, pero debe documentarse en el log.
- Copiar codigo de otro grupo sin atribucion se considera plagio y resulta en la desaprobacion del TP completo para ambos grupos.
- El uso de librerias externas esta permitido siempre que se documenten en las dependencias del proyecto y se justifique su uso.
- Las funciones especificadas en los milestones deben implementarse, no reemplazarse por llamadas a librerias de alto nivel que oculten la logica (por ejemplo, no usar una funcion `calcular_t60()` de una libreria externa).
