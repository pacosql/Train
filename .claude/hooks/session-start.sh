#!/bin/bash
# Se ejecuta al arrancar cualquier chat de Claude Code sobre este repo.
# No instala dependencias (no hay ninguna: es HTML/CSS/JS estático) —
# su trabajo es comprobar, ANTES de que se empiece a trabajar en una app
# nueva, que el entorno está listo para crear tablas en Supabase, en vez
# de descubrirlo a medio camino (que es justo lo que nos pasó la primera
# vez). Ver CLAUDE.md para la convención completa de este hosting.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "== Train hosting: comprobación de arranque =="

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "⚠️  SUPABASE_ACCESS_TOKEN no está configurado como variable de"
  echo "    entorno. Sin él no se pueden crear ni alterar tablas en"
  echo "    Supabase (DDL) — solo leer/escribir con la anon key."
  echo "    Pide el token sbp_... al usuario en el chat, o dile que lo"
  echo "    añada como variable de entorno en la configuración de este"
  echo "    entorno (así queda disponible para todos los chats futuros)."
else
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
    "https://api.supabase.com/v1/projects/dzlhsdpgyxnjwudmrnul" \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    echo "✅ SUPABASE_ACCESS_TOKEN configurado y la Management API responde (HTTP 200)."
  else
    echo "⚠️  SUPABASE_ACCESS_TOKEN está configurado pero la llamada de prueba"
    echo "    devolvió HTTP ${STATUS}. Puede ser un token inválido, o que la"
    echo "    política de red de este entorno bloquee api.supabase.com"
    echo "    (típico si ves 000 o 403). Antes de crear tablas, resuélvelo"
    echo "    con el usuario siguiendo el procedimiento de CLAUDE.md."
  fi
fi

echo "Antes de crear una app nueva en este hosting, sigue la convención de CLAUDE.md."
