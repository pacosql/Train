#!/usr/bin/env bash
# Estado rápido para la rutina de Logos: ¿hay algo que hacer?
#   bash logos/tools/estado.sh
# Imprime una línea JSON y termina con código 0 si HAY trabajo, 1 si no.
#  - por_decidir: diseños sin decisión (objetivo: 50)
#  - comentarios: comentarios sin usar que ya se pueden leer (texto, o audio con transcripción)
#  - revisar: diseños marcados «🔁 Otra»
#  - en_curso: otra ejecución empezó hace < 12 min y no ha terminado → no hacer nada
set -euo pipefail
SB="bash $(dirname "${BASH_SOURCE[0]}")/sb.sh"
POR=$($SB GET 'logos_disenos?select=id&decision=is.null' | python3 -c 'import json,sys;print(len(json.load(sys.stdin)))')
COM=$($SB GET 'logos_comentarios?select=id,tipo,transcripcion&estado=neq.procesado' | python3 -c 'import json,sys;print(sum(1 for c in json.load(sys.stdin) if c["tipo"]=="texto" or c.get("transcripcion")))')
REV=$($SB GET 'logos_disenos?select=id&decision=eq.revisar' | python3 -c 'import json,sys;print(len(json.load(sys.stdin)))')
DESDE=$(date -u -d '-12 min' +%Y-%m-%dT%H:%M:%SZ)
ULT=$($SB GET "logos_rutinas?select=rutina,ejecutada_en&rutina=in.(en-curso,hecho)&ejecutada_en=gte.$DESDE&order=ejecutada_en.desc&limit=1" | python3 -c 'import json,sys;d=json.load(sys.stdin);print(d[0]["rutina"] if d else "")')
EN_CURSO=$([ "$ULT" = "en-curso" ] && echo true || echo false)
echo "{\"por_decidir\":$POR,\"comentarios\":$COM,\"revisar\":$REV,\"en_curso\":$EN_CURSO}"
if [ "$EN_CURSO" = true ]; then exit 1; fi
if [ "$POR" -lt 50 ] || [ "$COM" -gt 0 ] || [ "$REV" -gt 0 ]; then exit 0; fi
exit 1
