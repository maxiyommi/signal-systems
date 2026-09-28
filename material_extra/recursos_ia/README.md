# Recursos de IA para la Cursada

## Herramientas gratuitas que usamos

### Claude.ai (Anthropic)
- **URL**: [claude.ai](https://claude.ai)
- **Plan gratuito**: Sí, con límite de mensajes diarios
- **Fortalezas**: Excelente para código Python, explicaciones técnicas, análisis de errores
- **Modelo recomendado**: Claude Sonnet (disponible en plan gratuito)

### ChatGPT (OpenAI)
- **URL**: [chat.openai.com](https://chat.openai.com)
- **Plan gratuito**: Sí, con límite de mensajes
- **Fortalezas**: Amplio conocimiento general, bueno para código y documentación

### Ollama (Modelos locales)
- **URL**: [ollama.com](https://ollama.com)
- **Costo**: Gratuito, corre en tu máquina
- **Modelos recomendados para código**:
  - `qwen2.5-coder:7b` — Bueno para generación de código
  - `codellama:7b` — Especializado en código
  - `llama3.2:3b` — Ligero, para máquinas con poca RAM

---

## Prompting efectivo para código

### Principios básicos

1. **Sé específico**: "Escribí una función Python que genere ruido rosa de N segundos a fs Hz usando Voss-McCartney" es mejor que "haceme ruido rosa"

2. **Incluí contexto**: "Estoy trabajando en un proyecto de acústica de salas. Necesito una función que calcule T60 a partir de la integral de Schroeder"

3. **Especificá formato**: "La función debe tener docstring estilo NumPy, type hints, y retornar np.ndarray"

4. **Pedí tests**: "Incluí al menos 2 tests con pytest para la función"

### Template de prompt para funciones

```
Necesito una función Python con las siguientes características:

Nombre: nombre_funcion
Propósito: [qué hace]
Parámetros:
  - param1 (tipo): descripción
  - param2 (tipo): descripción
Retorna: tipo — descripción
Dependencias: numpy, scipy (las que necesite)

Requisitos:
- Docstring estilo NumPy
- Type hints
- Manejo de errores para inputs inválidos

Contexto: [para qué se usa en el proyecto más grande]
```

### Template de prompt para debugging

```
Tengo el siguiente error al ejecutar mi código:

Código:
[pegar código relevante]

Error completo:
[pegar traceback]

¿Qué está causando el error y cómo lo corrijo?
```

### Template de prompt para explicación

```
Explicame el siguiente código paso a paso. Soy estudiante de
Ingeniería de Sonido y estoy aprendiendo procesamiento de señales:

[pegar código]

En particular no entiendo [la parte específica].
```

---

## Evaluación crítica del código IA

### Checklist para revisar código generado por IA

- [ ] **¿Funciona?** Ejecutar el código y verificar
- [ ] **¿Entiendo cada línea?** Si no entendés algo, preguntá
- [ ] **¿Los nombres son descriptivos?** `x`, `y`, `z` no son aceptables
- [ ] **¿Maneja edge cases?** ¿Qué pasa con arrays vacíos, frecuencias negativas, etc.?
- [ ] **¿Es eficiente?** Para señales de audio (miles/millones de muestras)
- [ ] **¿Usa las librerías correctamente?** Verificar documentación oficial
- [ ] **¿Los valores numéricos son correctos?** Especialmente importante para normas (IEC 61260, ISO 3382)
- [ ] **¿Tiene tests?** Si no los generó, escribilos vos

### Errores comunes de la IA en código de audio/señales

| Error | Ejemplo | Cómo detectarlo |
|-------|---------|-----------------|
| APIs inventadas | `scipy.signal.pink_noise()` (no existe) | Verificar en documentación oficial |
| Fórmulas incorrectas | Factor 2π faltante o duplicado | Comparar con libro/norma |
| Confusión de unidades | Mezclar Hz con rad/s, dB con lineal | Verificar dimensionalmente |
| Off-by-one en muestras | `int(fs * duracion)` vs `int(fs * duracion) + 1` | Verificar longitud de arrays |
| Normalización incorrecta | Dividir por N vs N/2 en FFT | Comparar con señal conocida |

---

## Log de desarrollo con IA

### Requisito del TP

Cada grupo mantiene un archivo **`AI_LOG.md` en la raíz del repositorio del TP**. Es **obligatorio y sin nota**: sin `AI_LOG.md`, M3 no se considera completo (ver la [consigna](../../trabajo_practico/README.md#log-de-desarrollo-con-ia)). Conviene ir completándolo durante todo el proyecto y documentar:

1. **Qué herramientas se usaron** (Claude, ChatGPT, Ollama, etc.)
2. **Para qué tareas** (generación, debugging, documentación, explicación)
3. **Qué funcionó bien** (ejemplo de prompt exitoso)
4. **Qué falló** (código incorrecto generado, cómo se detectó y corrigió)
5. **Reflexión**: ¿Cómo cambió tu flujo de trabajo?

### Formato sugerido para `AI_LOG.md`

```markdown
# Log de Desarrollo con IA

### Herramientas utilizadas
- Claude.ai: generación de funciones, debugging
- ChatGPT: explicación de conceptos

### Uso por milestone

#### Milestone 1
- **Tarea**: Generación de ruido rosa
- **Prompt**: "Implementar generación de ruido rosa con Voss-McCartney en Python..."
- **Resultado**: Código funcional pero con normalización incorrecta
- **Corrección**: Ajustamos manualmente la normalización comparando con Audacity

#### Milestone 2
- [...]

### Reflexión
[2-3 párrafos sobre la experiencia]
```

---

## Ética y límites

### Está bien usar IA para:
- Generar código boilerplate (imports, estructura básica)
- Debugging (encontrar errores)
- Entender conceptos y documentación
- Generar tests
- Mejorar documentación y docstrings
- Explorar alternativas de implementación

### No está bien:
- Copiar código IA sin entenderlo
- No registrar el uso de IA en el `AI_LOG.md`
- Depender 100% de IA sin aprender los conceptos
- Usar IA para generar el README o el `AI_LOG.md` completos sin revisión

### Regla de oro
> Si no podés explicar cada línea del código que entregás, no es tu código.
