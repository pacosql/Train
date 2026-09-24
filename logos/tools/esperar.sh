#!/usr/bin/env bash
# Espera a que haya trabajo para la rutina de Logos, comprobando cada minuto.
#   bash logos/tools/esperar.sh <fin ISO-8601 UTC>
# Termina con 0 en cuanto estado.sh dice que hay trabajo (faltan diseños por
# decidir, hay comentarios nuevos o 🔁) y con 1 al llegar a la hora de fin.
# Así una sesión horaria actúa en ~1-5 min tras cada cambio del usuario.
set -uo pipefail
FIN=$(date -u -d "${1:?hora de fin ISO, p. ej. 2026-09-24T10:55:00Z}" +%s)
DIR="$(dirname "${BASH_SOURCE[0]}")"
while [ "$(date -u +%s)" -lt "$FIN" ]; do
  if bash "$DIR/estado.sh"; then exit 0; fi
  sleep 60
done
exit 1
