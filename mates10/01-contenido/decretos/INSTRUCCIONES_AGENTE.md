# Instrucciones para agentes que archivan decretos (Mates10, módulo 01 + 07)

Trabajas en /home/user/Train (repo). NO toques nada fuera de `mates10/`. NO hagas git commit/push.
Base de datos: solo tablas `mates10_*`, vía `python3 mates10/tools/db.py "SQL"` (usa $SUPABASE_ACCESS_TOKEN; nunca lo imprimas ni lo escribas).

## Qué hacer para cada comunidad asignada

Para cada etapa (primaria, ESO, bachillerato) localiza la disposición OFICIAL vigente (LOMLOE, 2022–2023) que establece el
currículo, y si el reparto de matemáticas por curso está en una orden aparte (p. ej. Andalucía usa órdenes de desarrollo;
Madrid decreto + anexos), archiva también esa orden. Fuente preferida: el boletín oficial (BOE, BORM, BOCM, BOJA, DOGV,
DOGC, BOIB, BOA, BON, BOPV, DOG, BOPA, BOC, BOCYL, BOR, DOCM, DOE, BOC Canarias) en PDF de la disposición concreta
(no el boletín entero). Ceuta y Melilla: no tienen decreto propio; busca la orden del Ministerio (MEFP) que establece el
currículo en su ámbito de gestión.

Archiva cada documento así (descarga, hash, texto extraído, fila en mates10_fuente y mates10_fuente_archivo):

```bash
cd /home/user/Train/mates10/tools && python3 -c "
from archivar import archivar
print(archivar(codigo='DEC-ES-MC-PRI', url='https://…pdf', tipo='decreto',
  titulo='Decreto 209/2022, de 17 de noviembre, currículo de Educación Primaria en la Región de Murcia',
  origen='descarga_oficial', confianza='alta', modulos=['01'], anio=2022, sistema='ES-MC'))"
```

Códigos: `DEC-<ES-XX>-PRI`, `DEC-<ES-XX>-ESO`, `DEC-<ES-XX>-BAC`; órdenes extra `ORD-<ES-XX>-<ETAPA>[-N]`.
Si el PDF supera 25 MB, archiva la versión HTML de la disposición (la del boletín) en su lugar. Si un documento no se
encuentra, NO lo inventes: anótalo en el informe como "no encontrado" con lo que buscaste.
Después comprueba que `mates10/fuentes/text/<id>/texto.txt` tiene texto legible (si está vacío, es un PDF escaneado:
dilo). Si el texto está en catalán/gallego/euskera, está bien: lo lees igual.

## Extracción (lo más importante)

Para cada documento, localiza la parte de MATEMÁTICAS (en bachillerato: Matemáticas I y II y Matemáticas Aplicadas a las
CCSS I y II) y escribe `mates10/01-contenido/decretos/<ES-XX>-<ETAPA>.json` (ETAPA = PRI, ESO, BAC) con:

```json
{
  "sistema": "ES-MC", "etapa": "PRI", "fuente_codigo": "DEC-ES-MC-PRI", "fuente_id": "<uuid>",
  "reparto": "curso" | "ciclo" | "etapa" | "mixto",
  "nota_reparto": "cómo organiza los saberes básicos de matemáticas (por curso, por ciclo…) y dónde (anexo, páginas)",
  "idioma_texto": "es|ca|gl|eu",
  "saberes": [
    {"curso_o_ciclo": "PRI1" | "CICLO1" | "ESO1" | "ESO1-3" | "BAC1-MAT_I" | "BAC2-MAT_CCSS_II" ...,
     "sentido": "numerico|medida|espacial|algebraico|estocastico|socioafectivo",
     "bloque_texto": "encabezado tal cual (traducido al castellano si no lo está)",
     "saber": "el saber básico, resumido en castellano en una línea, fiel al texto",
     "ref": "pág. N / anexo II"}
  ],
  "diferencias_con_estatal": "lo que este decreto añade, quita o mueve de curso respecto al Real Decreto estatal",
  "observaciones": "cualquier cosa útil: temporalización propia, orden, método (ABN…), etc."
}
```

Sé exhaustivo con los saberes de matemáticas (todos, no una muestra). Resume cada saber en una línea sin copiar párrafos.

## Informe final (tu respuesta)

Tabla por comunidad y etapa: código de fuente, uuid, título, URL, reparto (curso/ciclo), nº de saberes extraídos,
problemas. Máximo 40 líneas.
