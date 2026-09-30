---
name: mates10-generar-ejercicios
description: Genera ejercicios de opción múltiple (4 opciones, una correcta) para una habilidad de la taxonomía de Mates10, con distractores ligados a errores típicos y explicaciones para niño y adulto. Úsala al producir ejercicios de problemas, geometría descriptiva o cualquier habilidad no calculable por código (módulo 02).
---

# Generar ejercicios de Mates10 (mina 2, generador IA)

Esta skill se usa para las habilidades que no se generan por código (`mates10_habilidad.generador` nulo):
problemas de enunciado, geometría descriptiva, lenguaje algebraico, lectura de gráficos, azar, etc.
Lo calculable lo generan los generadores de `mates10/tools/gen/` (no uses esta skill para eso).

## Entrada

Para cada habilidad, lee de la BD (`python3 mates10/tools/db.py "…"`): `codigo, nombre, definicion, parametros,
ejemplo_frontera, ejemplo_fuera, curso_ref` y sus `mates10_error_tipico` (código, nombre, descripción).

## Reglas que no se negocian

1. **No reproducción** (módulo 02): nunca copies un enunciado de un libro, web o app. Inventa contexto, nombres,
   cantidades y estructura. No uses nombres ni situaciones de libros de texto que recuerdes. El validador rechaza
   cualquier coincidencia de 7 palabras seguidas con los textos archivados en `mates10/fuentes/text/`.
2. **Dentro de la frontera**: el ejercicio debe exigir exactamente lo que dice `definicion`; nada de `ejemplo_fuera`.
   Una sola habilidad principal; si usa otras, decláralas como secundarias (códigos existentes y de cursos anteriores).
3. **Cuatro opciones, una correcta.** Los tres distractores son las respuestas que daría un niño que comete un
   error típico concreto de la habilidad (indica el sufijo, p. ej. `E02`); si no hay error aplicable, un distractor
   plausible con `error: null`. Nunca dos opciones equivalentes ("1/2" y "0,5"), nunca "todas las anteriores".
4. **Registro por ciclo**: 1º–2º de primaria frases de ≤ 12 palabras, números pequeños, contextos cotidianos (casa,
   cole, parque, animales); 3º–4º ≤ 20 palabras; 5º–6º y ESO normal; bachillerato técnico. Sin HTML (texto plano o
   Markdown mínimo). Moneda en euros, unidades del SI, nombres diversos y habituales en España.
5. **Dificultad** 1 (directo, números fáciles), 2 (estándar), 3 (cerca de `ejemplo_frontera`). Reparto aproximado
   40 % / 35 % / 25 %.
6. **Explicaciones**: `explicacion_nino` (cómo se resuelve, con el método principal: en problemas, entender → datos →
   operación → resolver → comprobar; en primaria puedes usar el modelo de barras), `explicacion_adulto` (qué está
   aprendiendo, por qué falla, cómo ayudarle sin hacerlo por él), `explicacion_pasos` (lista de pasos
   `{"paso", "operacion", "resultado", "texto"}`), y si la respuesta es numérica, `expresion_calculo`: la expresión
   aritmética en notación española que da la respuesta (`"36 × 2 + 40 × 4"`), que el validador recalcula.
7. Nada de sesgos ni estereotipos; variedad de nombres y situaciones; nada de contenido inapropiado para menores.

## Salida

Un fichero JSON por habilidad en `mates10/02-ejercicios/ia/<CODIGO>.json`:

```json
{"habilidad": "PROB.UNA.03", "generado_por": "claude (skill mates10-generar-ejercicios v1)", "ejercicios": [
  {"dificultad": 1, "enunciado": "…", "respuesta": "12",
   "distractores": [{"valor": "4", "error": "E01"}, {"valor": "32", "error": "E02"}, {"valor": "13", "error": null}],
   "expresion_calculo": "8 + 4", "secundarias": ["OPER.SUMA.02"],
   "explicacion_nino": "…", "explicacion_adulto": "…",
   "explicacion_pasos": [{"paso": 1, "operacion": "8 + 4", "resultado": "12", "texto": "…"}],
   "plantilla": "P01"}
]}
```

`plantilla` agrupa los ejercicios que comparten estructura (la misma situación con otros números): define 3–6
plantillas por habilidad y reparte los ejercicios entre ellas. Genera al menos 30 ejercicios por habilidad.

Después ejecuta `python3 mates10/tools/cargar_ejercicios_ia.py mates10/02-ejercicios/ia/<CODIGO>.json`, que valida
en cascada (esquema, recálculo, copia, duplicados, frontera) y carga lo que pasa; los rechazos quedan en
`mates10_rechazo_validador` con su motivo. Si más del 15 % se rechaza, corrige tu forma de generar (no el ejercicio
suelto) y regenera los que faltan.
