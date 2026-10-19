# Rutina de Gastos — leer los archivos nuevos

Se ejecuta cada hora (Routine de Claude Code, sesión nueva). Si no hay
archivos `pendiente`, registra la pasada y termina en un minuto.

Todo pasa por `python3 gastos/tools/db.py` (Management API con
`$SUPABASE_ACCESS_TOKEN`; nunca escribas ese token en un fichero).

## Pasos

1. `python3 gastos/tools/db.py pendientes --bajar /tmp/gastos` → lista
   JSON de archivos por leer, ya descargados (`local`), con la
   `nota_usuario` (pista del usuario: mándala) y las `cuentas_conocidas`
   de ese mismo usuario (`room`). Si la lista está vacía, salta al paso 5.
2. Para cada archivo, **léelo de verdad** (PDF con la herramienta Read o
   `pdftotext -layout`; CSV/XLSX/OFX/QIF con Python; imágenes con Read)
   y averigua:
   - Qué **cuenta(s) o tarjeta(s)** trae: `banco` (nombre corto y
     estable: "BBVA", "Santander", "American Express", "Revolut"…),
     `tipo` (`cuenta` · `tarjeta` · `ahorro` · `inversion` · `otro`),
     `numero` tal como aparece (IBAN completo si lo hay; de tarjeta,
     lo visible, p. ej. `****1005`), `divisa` (ISO: EUR, USD, GBP…) y
     `titular` si sale.
     **Reutiliza exactamente** banco/numero/divisa de `cuentas_conocidas`
     cuando sea la misma cuenta (la clave es banco + número sin espacios
     + divisa): si no, saldrán cuentas repetidas. Una cuenta
     multidivisa son varias cuentas (una por divisa).
   - El **periodo** que cubre (`desde`/`hasta`, YYYY-MM-DD): el del
     extracto si lo indica; si solo hay movimientos, del día 1 del mes
     del primero al último día del mes del último (salvo que el fichero
     diga otra cosa). Esto es lo que pinta los cuadritos azules: sé
     preciso.
   - `saldo_inicial` / `saldo_final` si aparecen (o se deducen con
     seguridad de la columna de saldo). Sirven para detectar extractos
     que faltan; no los inventes.
   - Los **movimientos**: `fecha`, `fecha_valor` (opcional),
     `concepto`, `importe` (negativo = gasto/cargo, positivo = ingreso;
     en tarjetas, las compras van en negativo y los abonos/pagos en
     positivo), `divisa` (si difiere de la cuenta) y `saldo` (si lo hay).
     Para ficheros largos, escribe un parser pequeño en Python que genere
     el JSON; no lo copies a mano.
3. Escribe un JSON por archivo y aplícalo:

   ```json
   {"archivo_id": "<id>", "estado": "procesado", "tipo_doc": "extracto",
    "resumen": "Extracto mensual de marzo 2025 de la cuenta BBVA ··3456.",
    "cuentas": [{"banco": "BBVA", "tipo": "cuenta", "numero": "ES12 0182 1234 5678 9012 3456",
                 "divisa": "EUR", "titular": "…", "desde": "2025-03-01", "hasta": "2025-03-31",
                 "saldo_inicial": 3600.00, "saldo_final": 5667.01,
                 "movimientos": [{"fecha": "2025-03-03", "concepto": "AMAZON", "importe": -32.99, "saldo": 3567.01}]}]}
   ```

   `python3 gastos/tools/db.py aplicar /tmp/gastos/res-<id>.json`

   - `tipo_doc`: `extracto` · `movimientos` · `resumen_tarjeta` · `otro`.
   - Si no es un documento financiero (una foto cualquiera…):
     `"estado": "ignorado"` y en `resumen` qué es.
   - Si no se puede leer (PDF con contraseña, escaneo ilegible…):
     `"estado": "error"` y en `resumen` qué le pasa y qué debería subir
     el usuario en su lugar. Nunca lo dejes en `pendiente`.
   - Volver a aplicar un archivo borra antes lo que se sacó de él, así
     que se puede repetir sin duplicar.
4. **Notas para el usuario** (lo que el calendario no dice solo). Por
   cada usuario (`room`) que hayas tocado:
   `python3 gastos/tools/db.py huecos --room <room>` muestra los meses
   que faltan con su pista de saldo (la app ya los pinta). Con eso y lo
   que has leído, borra sus notas anteriores
   (`db.py limpiar-avisos <room>`) y deja como mucho 3-5 notas útiles
   con `db.py aviso <room> <cuenta_id|-> "texto"`, p. ej.:
   - una tarjeta cuyo cargo aparece en la cuenta pero de la que no hay
     ningún extracto ("Veo pagos a la Visa ··1234 desde la cuenta BBVA,
     pero no tengo ningún extracto de esa tarjeta");
   - transferencias a una cuenta propia que no está en el archivo;
   - qué contiene el hueco, si lo deduces de otros extractos (cargos de
     la tarjeta de ese mes en la cuenta, recibos que se repiten…).
   No repitas lo que ya dice "te falta tal mes".
5. `python3 gastos/tools/db.py log <N> "<una frase>"` con N = archivos
   procesados (0 si no había nada). La app muestra esa frase como
   "Última revisión".

No hagas commits salvo que arregles `db.py` o la app. No toques tablas
de otras apps.
