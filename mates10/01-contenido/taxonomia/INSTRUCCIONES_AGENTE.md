# Instrucciones para agentes de taxonomía (Mates10, módulo 01, mina 1)

Repo /home/user/Train. Trabaja SOLO en `mates10/`. Sin git commit/push. BD solo lectura (no cargues nada: lo carga
`mates10/tools/cargar_taxonomia.py`), vía `python3 mates10/tools/db.py "SQL"` ($SUPABASE_ACCESS_TOKEN, nunca lo imprimas).

## Lee antes de empezar

1. `mates10/fuentes/raw/a43b4b89-d7ad-4ebf-9247-c3824becb7ad/mates10-documento-unificado.md`: módulo 01 entero (tabla
   5.1 habilidad, 5.2 prerrequisitos, 5.3 error_tipico, enseñanza concéntrica, problemas como habilidad) y el ANEXO (la
   fila completa de OPER.JERARQ.02 es el listón de calidad: definición con fronteras exactas, parámetros, ejemplo
   frontera, ejemplo fuera, errores con explicación al niño e indicación al padre).
2. `mates10/01-contenido/taxonomia/familias.md`: familias, grupos y códigos fijados.
3. Las fuentes legales (texto extraído en `mates10/fuentes/text/<fuente_id>/texto.txt`; ids con
   `select codigo, id from mates10_fuente where codigo like 'DEC-%' or codigo like 'ORD-%'`) y los resúmenes JSON de
   `mates10/01-contenido/decretos/` (ES-PRI.json, ES-ESO.json, ES-BAC.json = estatal; ES-MC-*.json = Murcia).
   La referencia para el curso de cada habilidad (`curso_ref`) es el decreto de MURCIA; donde Murcia no reparte por
   curso, el estatal por ciclo + tu criterio (anótalo en `nota_curso`).

## Qué produces

`mates10/01-contenido/taxonomia/<GRUPO>.json` (tu grupo: T1…T6) con TODAS las habilidades de tus familias, de 1º de
primaria a 2º de bachillerato:

```json
{"grupo": "T1", "habilidades": [{
  "codigo": "OPER.SUMA.03", "familia": "OPER.SUMA", "nivel_familia": 3, "bloque": "OPER",
  "curso_ref": "PRI1", "trimestre_ref": 2, "orden_ref": 14,
  "nota_curso": "El decreto de Murcia lo sitúa en 1º (pág. N); el estatal en primer ciclo.",
  "nombre": "Suma de dos números de una cifra con resultado hasta 18 (con paso de la decena)",
  "nombre_padres": "Sumas de números pequeños pasando del 10",
  "definicion": "Qué se pide exactamente y qué NO entra: aquí viven las fronteras.",
  "parametros": {"sumandos": 2, "cifras": 1, "llevada": true, "max_resultado": 18},
  "ejemplo_frontera": "9 + 9 = 18", "ejemplo_fuera": "12 + 9 (un sumando de 2 cifras → OPER.SUMA.05)",
  "importancia": 5, "carga_alumno": 2,
  "calculable": true,
  "fuente": "DEC-ES-MC-PRI", "fuente_ref": "Anexo II, Matemáticas, 1º, A. Sentido numérico, 2. Cantidad…",
  "fuentes_extra": [{"fuente": "DEC-ES-PRI", "ref": "…", "rol": "define|situa|afina|contradice", "nota": "obligatoria si contradice"}],
  "prerrequisitos": [{"codigo": "OPER.SUMA.02", "peso": "imprescindible"}, {"codigo": "NUM.DESC.01", "peso": "recomendable"}],
  "errores": [{"sufijo": "E01", "nombre": "Cuenta el primer sumando", "descripcion": "8 + 5 = 12 (cuenta desde 8 incluyéndolo)",
               "explicacion_nino": "…", "indicacion_padres": "…",
               "regla": "descripción operativa de cómo se obtiene la respuesta errónea a partir de los datos (p. ej. 'a + b − 1')"}]
}]}
```

Reglas de contenido:
- Granularidad fina en primaria (una habilidad = un conocimiento distinto: si dos ejercicios exigen conocimientos
  distintos, son dos habilidades). En ESO y bachillerato, algo más gruesa si hace falta, pero cada habilidad debe seguir
  siendo evaluable con ejercicios de opción múltiple de 4 opciones.
- Cubre TODO lo que el decreto pide para tus familias en todos los cursos. Si el decreto tiene algo que no encaja en
  ninguna familia de tu grupo, créalo en la familia más cercana y dilo en el informe.
- `curso_ref` = curso en que se INTRODUCE esa habilidad; `trimestre_ref` (1–3) y `orden_ref` (1..n dentro del curso,
  para tu grupo) = secuencia didáctica de referencia dentro del curso (lo que haría un libro típico: primero la decena y
  luego la suma con llevada). Es criterio: se contrastará con los índices de editoriales.
- `importancia` y `carga_alumno` 1–5 según el módulo 01 (tablas y problemas = importancia 5; problemas = carga 5).
- `nombre_padres`: sin jerga ("restas llevándose", no "sustracción con reagrupación").
- Errores típicos: 2–5 por habilidad, los REALES y frecuentes (la literatura de errores en matemáticas escolares los
  describe bien: el del anexo es el modelo). Cada error con una `regla` operativa (para calcular distractores por
  código cuando la habilidad es calculable). `explicacion_nino` en el registro de la edad del curso (frases cortas en
  1º–2º). `indicacion_padres`: cómo reconocerlo en casa y qué decirle.
- Prerrequisitos: dentro de tu grupo con código exacto; de otros grupos, usa los códigos de familia de familias.md con
  el nivel que estimes (se revisan en una segunda pasada). Sin ciclos.
- `calculable`: true si los ejercicios se pueden generar por código (operaciones, comparaciones, conversiones de
  unidades, lecturas de números…); false si necesitan texto/contexto/figura (problemas, geometría descriptiva…).
- `fuente`: el código de la fuente archivada que justifica la habilidad (normalmente el decreto de Murcia o el estatal).
  Los errores típicos y prerrequisitos son criterio (se les asigna la fuente de criterio del grupo al cargar), salvo
  que los saques de una fuente concreta (entonces pon `"fuente": "<codigo>"` dentro del error).
- NO copies frases del decreto en `definicion`: redacta con tus palabras. No inventes páginas: si no sabes la página,
  cita la sección.
- Respeta los códigos y definiciones fijados por el anexo (ver familias.md).

## Informe final (tu respuesta)

Nº de habilidades por curso, familias cubiertas, saberes del decreto que no has sabido encajar, dudas de frontera que
Paco o un maestro deberían decidir. Máximo 30 líneas.
