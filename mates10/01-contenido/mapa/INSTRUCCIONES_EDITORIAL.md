# Instrucciones: mapa por editorial (Mates10, módulo 01)

Repo /home/user/Train; solo `mates10/`; sin git; BD solo lectura vía `python3 mates10/tools/db.py "SQL"`.

Entrada: `mates10/01-contenido/editoriales/<EDITORIAL>-<CURSO>[-N].json` (unidades y secciones del libro, trimestre si
consta) y la taxonomía (`select codigo, nombre, definicion, curso_ref, familia, nivel_familia from mates10_habilidad`).

Para cada editorial asignada y cada curso con índice, recorre las unidades EN ORDEN y decide qué habilidades de la
taxonomía introduce cada unidad/sección (solo las que el título o las secciones permiten afirmar; ante la duda, no).
Salida: `mates10/01-contenido/mapa/editorial_<EDITORIAL>.json`:

```json
{"editorial": "SM", "filas": [
  {"curso": "PRI3", "habilidad": "OPER.TABLA.02", "trimestre": 1, "mes": 11, "orden": 14, "estado": "introduce",
   "fuente": "ED-SM-PRI3", "fuente_ref": "Unidad 3, «Tablas del 2 y del 5»", "confianza": "media",
   "nota": "Trimestre deducido del índice (unidades 1–5 en el primer trimestre)"}]}
```

- `orden`: posición secuencial en el curso según el libro (1..n).
- `trimestre`: el que dé el índice; si no lo da, repartir las unidades en tres tercios (1.er trimestre ≈ primer tercio;
  si el libro tiene muchas unidades, septiembre cuenta medio mes). `mes` coherente con eso (sep–dic, ene–mar, abr–jun).
- `confianza`: 'alta' si el índice es completo y trae trimestres oficiales; 'media' si deducido; 'baja' si parcial.
- Para 4.º ESO usa el índice de Matemáticas B (-B es la variante sin sufijo); para bachillerato Matemáticas I/II
  (sin sufijo). Anota en `nota` si una habilidad solo sale en A o CCSS.
- Una habilidad aparece como mucho una vez por curso (la primera unidad que la introduce).
- Guarda el JSON al terminar cada curso (la sesión puede reiniciarse; si existe, continúa).

Informe final: filas por curso y editorial, habilidades de la taxonomía que la editorial sitúa en otro curso distinto
de `curso_ref` (las 15 más llamativas). Máximo 25 líneas.
