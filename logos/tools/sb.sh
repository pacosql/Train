#!/usr/bin/env bash
# Llamadas REST a Supabase para la app Logos sin escribir la anon key en
# la línea de comandos (la lee de logos/config.js). Pensado para las
# rutinas, que corren sin nadie que apruebe comandos.
#
#   bash logos/tools/sb.sh GET  'logos_ideas?select=nombre,decision&order=created_at'
#   bash logos/tools/sb.sh POST  logos_ideas            /tmp/ficha.json
#   bash logos/tools/sb.sh PATCH 'logos_ideas?id=eq.<uuid>' /tmp/cambios.json
#
# Imprime el cuerpo de la respuesta (JSON) y devuelve código 1 si HTTP >= 400.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEY="$(grep -o 'eyJ[^"]*' "$DIR/config.js" | head -1)"
URL="$(grep -o 'https://[a-z0-9]*\.supabase\.co' "$DIR/config.js" | head -1)"
METHOD="${1:?GET|POST|PATCH}"; PATHQ="${2:?ruta REST, p. ej. logos_ideas?select=*}"; BODY="${3:-}"
ARGS=(-sS -X "$METHOD" "$URL/rest/v1/$PATHQ" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -H "Prefer: return=representation" -w '\n%{http_code}')
if [ -n "$BODY" ]; then ARGS+=(--data-binary "@$BODY"); fi
OUT="$(curl "${ARGS[@]}")"
CODE="${OUT##*$'\n'}"; RESP="${OUT%$'\n'*}"
printf '%s\n' "$RESP"
[ "$CODE" -lt 400 ]
