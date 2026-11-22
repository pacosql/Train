#!/usr/bin/env bash
# Estado rápido para la rutina de Ortologo: ¿hay algo que hacer?
#   bash ortologo/tools/estado.sh
# Imprime una línea JSON y termina con código 0 si HAY trabajo, 1 si no.
#  - por_decidir: diseños sin decisión (de rellenar la cola se ocupa la rutina del proceso creativo)
#  - comentarios: comentarios sin usar que ya se pueden leer (texto, o audio con transcripción)
#  - revisar: diseños marcados «🔁 Otra»
#  - en_curso: otra ejecución empezó hace < 12 min y no ha terminado → no hacer nada
set -euo pipefail
SB="bash $(dirname "${BASH_SOURCE[0]}")/sb.sh"
KEY="$(grep -o 'eyJ[^"]*' "$(dirname "${BASH_SOURCE[0]}")/../config.js" | head -1)"
URL="$(grep -o 'https://[a-z0-9]*\.supabase\.co' "$(dirname "${BASH_SOURCE[0]}")/../config.js" | head -1)"
# count exacto: la API corta las listas en 1000 filas, así que no vale contar filas
POR=$(curl -sS -I "$URL/rest/v1/ortologo_disenos?select=id&decision=is.null" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" -H "Prefer: count=exact" | tr -d '\r' | grep -i '^content-range:' | sed 's#.*/##')
COM=$($SB GET 'ortologo_comentarios?select=id,tipo,transcripcion&estado=neq.procesado' | python3 -c 'import json,sys;print(sum(1 for c in json.load(sys.stdin) if c["tipo"]=="texto" or c.get("transcripcion")))')
REV=$($SB GET 'ortologo_disenos?select=id&decision=eq.revisar' | python3 -c 'import json,sys;print(len(json.load(sys.stdin)))')
DESDE=$(date -u -d '-12 min' +%Y-%m-%dT%H:%M:%SZ)
ULT=$($SB GET "ortologo_rutinas?select=rutina,ejecutada_en&rutina=in.(en-curso,hecho)&ejecutada_en=gte.$DESDE&order=ejecutada_en.desc&limit=1" | python3 -c 'import json,sys;d=json.load(sys.stdin);print(d[0]["rutina"] if d else "")')
EN_CURSO=$([ "$ULT" = "en-curso" ] && echo true || echo false)
echo "{\"por_decidir\":$POR,\"comentarios\":$COM,\"revisar\":$REV,\"en_curso\":$EN_CURSO}"
if [ "$EN_CURSO" = true ]; then exit 1; fi
if [ "$COM" -gt 0 ] || [ "$REV" -gt 0 ]; then exit 0; fi
exit 1
