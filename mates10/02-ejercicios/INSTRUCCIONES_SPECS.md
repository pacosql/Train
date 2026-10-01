# Instrucciones para agentes de specs de generación (Mates10, mina 2)

Repo /home/user/Train; trabaja solo en `mates10/`; sin git. BD vía `python3 mates10/tools/db.py "SQL"`.

## Objetivo

Para CADA habilidad de tu grupo con `generador = 'codigo'` en la BD (las calculables), escribir su spec en
`mates10/02-ejercicios/specs/<GRUPO>.json` para que `mates10/tools/generar.py` produzca ≥ 40 ejercicios correctos,
dentro de la frontera, con los tres niveles de dificultad y con los distractores enlazados a sus errores típicos.

Lee: `mates10/02-ejercicios/GENERADORES.md` (catálogo; mira también el código de `mates10/tools/gen/*.py`, sobre todo los
docstrings con las claves de error), la docstring de `mates10/tools/generar.py` (formato de spec) y, por habilidad:
`select codigo, nombre, definicion, parametros, ejemplo_frontera, ejemplo_fuera, curso_ref from mates10_habilidad where codigo like '…'`
y sus errores `select codigo, nombre, descripcion, funcion from mates10_error_tipico where habilidad_id = …`.

## Reglas

1. La spec debe respetar la DEFINICIÓN y la frontera: ni un ejercicio de `ejemplo_fuera`. Usa `kw_por_dificultad`
   para que la dificultad 1 sea lo más sencillo de la habilidad y la 3 se acerque a `ejemplo_frontera`.
2. `errores`: enlaza cada clave de error del generador con el sufijo (`E01`…) del error típico que representa. Solo
   si representan de verdad el mismo error. Si un error típico importante no tiene clave en el generador, puedes
   ampliar el generador (ver 4).
3. Comprueba SIEMPRE con `python3 mates10/tools/generar.py --seco CODIGO` y lee los ejemplos: enunciado natural en
   castellano, respuesta correcta, distractores plausibles y distintos. Corrige hasta que todos estén bien.
4. Si ningún generador existente cubre bien una habilidad calculable, escribe uno nuevo en
   `mates10/tools/gen/extra_<GRUPO>.py` (mismo patrón: `@generador("<grupo>_<nombre>")`, devuelve `Ejercicio` con
   `parametros` que incluyan `"op"`, distractores con clave de error, `pasos`, `explicacion_nino` y
   `explicacion_adulto`). No modifiques los ficheros de generadores existentes (otros agentes los usan): si necesitas
   una variante, cópiala en tu fichero extra con otro nombre. Registra en tu informe lo que añades.
5. Si una habilidad marcada calculable en realidad necesita texto o contexto (problemas, reconocimiento de formas),
   no fuerces un generador: apúntala en `mates10/02-ejercicios/specs/<GRUPO>_a_ia.txt` (una por línea con el motivo).
6. Cuando tengas todas las specs, carga con `python3 mates10/tools/generar.py --grupo <GRUPO> --n 40 --provisional 5`
   y revisa la salida: si una habilidad tiene rechazos, mira `select etapa, motivo, count(*) from mates10_rechazo_validador
   where habilidad_codigo = '…' group by 1,2` y corrige la spec o el generador (no el ejercicio). Si hay que regenerar
   una habilidad, borra antes sus ejercicios no revisados:
   `delete from mates10_ejercicio where revisado_por is null and id in (select ejercicio_id from mates10_ejercicio_habilidad eh join mates10_habilidad h on h.id = eh.habilidad_id where h.codigo = '…' and eh.rol = 'principal');`

## Informe final (tu respuesta)

Nº de habilidades con spec, ejercicios cargados y rechazados, habilidades pasadas a IA, generadores nuevos, dudas.
Máximo 25 líneas.
