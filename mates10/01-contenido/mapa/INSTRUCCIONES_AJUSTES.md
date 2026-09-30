# Instrucciones: ajustes del mapa por comunidad (Mates10, módulo 01)

Repo /home/user/Train; solo `mates10/`; sin git. BD vía `python3 mates10/tools/db.py "SQL"` (solo lectura para ti).

## Contexto

`mates10/tools/cargar_mapa.py` crea, para cada comunidad, una fila `introduce` por habilidad en el curso de referencia
de la taxonomía (`mates10_habilidad.curso_ref`, tomado del decreto de Murcia y, donde Murcia reparte por ciclo, del
estatal + criterio). Pero cada comunidad puede situar un contenido en otro curso. Tu trabajo es encontrar esas
diferencias en SU decreto y escribirlas como ajustes.

## Qué haces, por cada comunidad asignada

1. Lee `mates10/01-contenido/decretos/<ES-XX>-{PRI,ESO,BAC}.json` (saberes por curso o ciclo, con referencia) y la
   taxonomía (`select codigo, nombre, definicion, curso_ref, familia from mates10_habilidad order by codigo`).
2. Solo importa cuando el decreto de la comunidad reparte POR CURSO (campo `reparto`). Si reparte por ciclo o etapa,
   el curso de referencia es compatible salvo que el saber caiga fuera del ciclo: compruébalo solo en ese sentido
   (p. ej. una habilidad con curso_ref PRI5 cuyo saber la comunidad pone en el 2.º ciclo → ajuste a PRI4).
3. Para cada habilidad cuyo contenido la comunidad introduce claramente en OTRO curso (antes o después), o que su
   decreto no incluye en absoluto en ninguna etapa (entonces `"excluir": true`), añade un ajuste. No inventes: cada
   ajuste cita el saber y su página/anexo. Ante la duda, no ajustes.
4. Escribe `mates10/01-contenido/mapa/ajustes_<ES-XX>.json`:

```json
[{"habilidad": "OPER.RAIZ.03", "curso": "ESO2", "fuente_ref": "Anexo II, Matemáticas 2.º ESO, A.3 (pág. 1234)",
  "nota": "Galicia introduce el algoritmo de la raíz en 2.º ESO; la referencia lo sitúa en 1.º."},
 {"habilidad": "EST.PROB.01", "excluir": true, "fuente_ref": "…", "nota": "No aparece en el decreto de primaria de …"}]
```

   (Opcional: `"trimestre"` y `"mes"` si el decreto temporaliza, que casi nunca ocurre.)
5. Escribe un fichero aunque no haya ajustes (`[]`), para que conste que se revisó.

## Informe final

Por comunidad: nº de ajustes (adelantos, retrasos, exclusiones) y los 3 más relevantes. Máximo 25 líneas.
