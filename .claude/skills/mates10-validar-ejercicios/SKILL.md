---
name: mates10-validar-ejercicios
description: Valida ejercicios de Mates10 en cascada (esquema, corrección recalculada, copia por n-gramas contra el archivo de fuentes, duplicados, frontera) y revisa la calidad pedagógica de una muestra. Úsala antes de cargar ejercicios nuevos o para auditar un lote ya cargado (módulo 02).
---

# Validar ejercicios de Mates10

El validador mecánico es `mates10/tools/validador.py` (función `validar(ej, indice, huellas, habilidad)`):

1. **Esquema**: enunciado y respuesta presentes, sin HTML, exactamente 3 distractores distintos entre sí y de la
   respuesta, dificultad 1–3, explicación para el niño.
2. **Corrección recalculada**: si el ejercicio trae `parametros.op`, se recalcula la respuesta con una
   implementación independiente del generador (`recalcular`); si trae `expresion_calculo`, se evalúa con aritmética
   exacta. También se comprueba que ningún distractor sea correcto.
3. **Copia**: índice de 7-gramas de todo `mates10/fuentes/text/`; cualquier coincidencia rechaza, salvo ejercicios
   "comunes" (operaciones puras, tablas, definiciones estándar), que se reconocen por su enunciado estándar.
4. **Duplicados**: huella del enunciado normalizado + respuesta, contra el lote y contra la BD (`ejercicio.huella`).
5. **Frontera**: parámetros declarados de la habilidad (p. ej. `max_resultado`).

Cada rechazo se guarda en `mates10_rechazo_validador (lote, habilidad_codigo, etapa, motivo, ejercicio)`.

## Revisión de calidad (la etapa "calidad con Opus" del módulo 02)

Para cada lote, toma una muestra de 10 ejercicios por habilidad y comprueba a mano (tú, el modelo):
- ¿Evalúa exactamente la habilidad principal y nada de `ejemplo_fuera`?
- ¿Cada distractor delata el error al que apunta? ¿Hay alguno ambiguo o también defendible?
- ¿La explicación para el niño es correcta, sigue el método principal y está en el registro del ciclo?
- ¿El enunciado es natural en castellano de España y adecuado para menores?
Registra lo que falle como rechazo con etapa `calidad` y un motivo concreto, y corrige el generador o la skill.

## Consultas útiles

```sql
select etapa, motivo, count(*) from mates10_rechazo_validador group by 1,2 order by 3 desc;
select lote, count(*) filter (where true) from mates10_rechazo_validador group by 1;
```
