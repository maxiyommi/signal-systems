# Rúbrica de evaluación: RIR-API

> **2.º cuatrimestre 2026.** El TP pesa el **20 %** de la nota de la materia y se evalúa con un esquema simple: solo llevan nota el **producto final (M3)** y la **presentación oral**.

## Distribución de la nota del TP

| Componente | Peso | Fecha |
|------------|------|-------|
| **M3**: Producto final | **60%** | Mie 18/11/2026 (tag `v1.0.0`) |
| **Presentación oral** (Demo Day) | **40%** | Mie 18/11/2026 |
| M0, M1, M2 | Sin nota | Seguimiento con feedback por Slack |

```
Nota del TP = 0.60 * M3 + 0.40 * Presentación oral
```

**Nota mínima de aprobación**: 4/10 en M3 y 4/10 en la nota del TP.

### Milestones de seguimiento (M0, M1, M2)

M0, M1 y M2 **no llevan nota**. M0 se entrega por Slack; en las entregas de M1 y M2 el grupo muestra su avance en clase (~15 minutos). En todos los casos la devolución llega por Slack. Son la mejor oportunidad para detectar problemas antes de la entrega final: aprovéchenlas.

### Requisitos para que M3 se considere completo

- Tag `v1.0.0` en `main` en la fecha de entrega.
- Repositorio accesible por los docentes (@maxiyommi y @jero-scafati) como colaboradores.
- **`AI_LOG.md`** en la raíz del repositorio, actualizado durante todo el proyecto (obligatorio, sin nota propia; ver la [consigna](README.md#log-de-desarrollo-con-ia)).

---

## Rúbrica de M3: producto final (60%)

M3 se evalúa en 5 criterios. Cada criterio se valora con un nivel (Insuficiente / Regular / Bueno / Excelente). Las funciones opcionales (Lundeby, función extra) se valoran dentro de Funcionalidad.

### Funcionalidad (30%)

| Nivel | Puntos | Descripción |
|-------|--------|-------------|
| **Insuficiente** | 0-3 | Las funciones no ejecutan o producen resultados incorrectos. Faltan funciones requeridas. Los errores no se manejan. |
| **Regular** | 4-5 | Algunas funciones operan correctamente pero hay errores significativos en otras. Los resultados son parcialmente correctos. Manejo de errores básico. |
| **Bueno** | 6-7 | Todas las funciones requeridas están implementadas y operan correctamente en los casos típicos. Los resultados son correctos para la mayoría de las entradas. Manejo de errores adecuado. |
| **Excelente** | 8-10 | Todas las funciones operan correctamente en casos típicos y extremos. Los resultados son precisos y coinciden con los valores de referencia. Manejo de errores robusto con mensajes informativos. Implementación eficiente. |

### Calidad de código (20%)

| Nivel | Puntos | Descripción |
|-------|--------|-------------|
| **Insuficiente** | 0-3 | Código desordenado, sin estructura. Sin docstrings ni type hints. No sigue PEP 8. Variables con nombres no descriptivos. Código duplicado. |
| **Regular** | 4-5 | Estructura básica del proyecto. Algunos docstrings y type hints. Cumplimiento parcial de PEP 8. Nombres de variables aceptables. |
| **Bueno** | 6-7 | Proyecto bien estructurado en módulos. Docstrings en la mayoría de funciones públicas. Type hints presentes. PEP 8 cumplido (pasa `ruff check`). Nombres claros y descriptivos. |
| **Excelente** | 8-10 | Estructura modular excelente. Docstrings completos en formato NumPy en todas las funciones públicas. Type hints completos. PEP 8 impecable. Código limpio, legible y bien organizado. Sin código muerto ni duplicado. Uso apropiado de constantes y configuración. |

### Testing (20%)

| Nivel | Puntos | Descripción |
|-------|--------|-------------|
| **Insuficiente** | 0-3 | Sin tests o con tests que no ejecutan. No se verifica el comportamiento de las funciones. |
| **Regular** | 4-5 | Algunos tests básicos que pasan. Cobertura baja (< 50%). Los tests verifican solo el "happy path". |
| **Bueno** | 6-7 | Tests para todas las funciones requeridas. Cobertura razonable (50-80%). Tests verifican tanto casos exitosos como casos de error. Nombres de tests descriptivos. |
| **Excelente** | 8-10 | Tests exhaustivos con cobertura > 80%. Incluye tests de casos extremos y de borde. Tests parametrizados donde corresponde. Fixtures bien organizados. Validación numérica con tolerancias adecuadas. Tests ejecutan en CI. |

### Documentación (15%)

| Nivel | Puntos | Descripción |
|-------|--------|-------------|
| **Insuficiente** | 0-3 | Sin README o README vacio. Sin documentación de funciones. Sin instrucciones de uso. |
| **Regular** | 4-5 | README básico con descripción del proyecto. Instrucciones de instalación incompletas. Documentación parcial. |
| **Bueno** | 6-7 | README completo con descripción, instalación y uso. Docstrings en funciones principales. Ejemplos de uso básicos. |
| **Excelente** | 8-10 | README completo y profesional. Documentación exhaustiva con ejemplos. Diagramas de arquitectura actualizados. Instrucciones de uso claras y reproducibles. Changelog mantenido. |

### Prácticas Git (15%)

| Nivel | Puntos | Descripción |
|-------|--------|-------------|
| **Insuficiente** | 0-3 | Todos los cambios en un solo commit o en la rama main. Sin uso de ramas. Mensajes de commit no descriptivos ("fix", "update", "cambios"). |
| **Regular** | 4-5 | Algunos commits con mensajes descriptivos. Uso básico de ramas. Push directo a main con algunos PRs. |
| **Bueno** | 6-7 | Commits frecuentes con mensajes descriptivos. Uso de ramas de feature. Pull requests con revisiones. Tags de versión creados. |
| **Excelente** | 8-10 | Historial de Git limpio y profesional. Conventional Commits o convención consistente. Todas las funciones desarrolladas en ramas separadas con PRs revisados. Issues vinculados a PRs. Tags y releases creados correctamente. Branching strategy respetada. |

---

## Rúbrica de presentación oral (40%)

Duración: 20 minutos de presentación + 5 minutos de preguntas, con demo en vivo de la API (sesión virtual del 18/11).

### Aspectos técnicos (40%)

| Nivel | Puntos | Descripción |
|-------|--------|-------------|
| **Insuficiente** | 0-3 | Comprensión superficial del proyecto. No puede explicar las decisiones de diseño. Demo no funciona. Resultados no validados. |
| **Regular** | 4-5 | Comprensión básica del proyecto. Explica algunas decisiones de diseño. Demo parcialmente funcional. Validación limitada. |
| **Bueno** | 6-7 | Buena comprensión del proyecto y las decisiones de diseño. Demo funcional. Resultados validados y presentados con claridad. |
| **Excelente** | 8-10 | Comprensión profunda de todos los aspectos técnicos. Justificación sólida de decisiones de diseño. Demo impecable. Validación exhaustiva con análisis crítico de resultados. Capacidad de responder preguntas técnicas con precisión. |

### Comunicación (35%)

| Nivel | Puntos | Descripción |
|-------|--------|-------------|
| **Insuficiente** | 0-3 | Presentación desordenada. No se entiende el contenido. Mal manejo del tiempo (muy corta o muy larga). Material visual pobre o inexistente. |
| **Regular** | 4-5 | Estructura básica de presentación. Contenido parcialmente claro. Manejo del tiempo aceptable. Material visual básico. |
| **Bueno** | 6-7 | Presentación bien estructurada. Contenido claro y organizado. Buen manejo del tiempo. Material visual adecuado con gráficas y diagramas. |
| **Excelente** | 8-10 | Presentación profesional y fluida. Explicaciones claras usando terminología técnica precisa. Manejo del tiempo impecable. Material visual excelente. Todos los integrantes participan de manera equilibrada. Respuestas claras y concisas a las preguntas. |

### Análisis crítico (25%)

| Nivel | Puntos | Descripción |
|-------|--------|-------------|
| **Insuficiente** | 0-3 | Sin reflexión sobre limitaciones o dificultades. No identifica posibles mejoras. No conecta con la teoría vista en clase. |
| **Regular** | 4-5 | Reflexión superficial sobre algunas dificultades. Identifica pocas mejoras. Conexión limitada con la teoría. |
| **Bueno** | 6-7 | Reflexión honesta sobre dificultades y cómo se resolvieron. Identifica mejoras concretas. Conecta resultados con la teoría. |
| **Excelente** | 8-10 | Análisis crítico profundo y honesto. Identifica limitaciones con precisión y propone mejoras concretas y viables. Conecta resultados con teoría y con aplicaciones profesionales reales. Reflexión madura sobre el proceso de aprendizaje. |

**Nota sobre contribuciones individuales:** se revisará el historial de Git y la participación en la oral para verificar que todos los integrantes contribuyen. Diferencias significativas pueden resultar en notas individuales diferentes dentro del mismo grupo.

---

## Política de entregas tardías

- Si M3 no se entrega en la fecha indicada, pasa a instancia de **recuperatorio** (una semana adicional de plazo, nota máxima **7/10**).

## Política de integridad académica

- El código debe ser original del grupo. Se permite (y se fomenta) el uso de herramientas de IA, pero debe documentarse en `AI_LOG.md`.
- Copiar código de otro grupo sin atribución se considera plagio y resulta en la desaprobación del TP completo para ambos grupos.
- El uso de librerías externas está permitido siempre que se documenten en las dependencias del proyecto y se justifique su uso.
- Las funciones especificadas en los milestones deben implementarse, no reemplazarse por llamadas a librerías de alto nivel que oculten la lógica (por ejemplo, no usar una función `calcular_t60()` de una librería externa).
