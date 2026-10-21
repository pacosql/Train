# 💶 Gastos

PWA (sin build) para **reunir todos tus extractos** de cuentas y
tarjetas, en cualquier divisa, y saber qué te falta para tener el
histórico completo.

- **Subes** lo que te descargas del banco (PDF, CSV, Excel, OFX…), en
  bloque o de uno en uno, con una pista opcional ("Visa de Ana"). Los
  ficheros repetidos se detectan por su huella (SHA-256) y no se suben.
- **Una rutina** (cada hora) lee los archivos nuevos: detecta de qué
  cuenta o tarjeta son, qué fechas cubren, saldos y movimientos. Ver
  [`RUTINA.md`](./RUTINA.md).
- **Calendario por cuenta**: una fila por año y un cuadrito por mes:
  azul = lo tienes, medio azul = en parte, blanco = falta, rayado =
  "no hubo extracto" (lo marcas tú), borde discontinuo = mes en curso.
  En cada cuenta puedes decir desde cuándo quieres histórico y si está
  cerrada.
- **Lo que te falta**: lista de huecos, con la pista del saldo ("pasa de
  3.976 € a 3.600 €: −376 € en movimientos que no tengo"), saldos que no
  cuadran entre extractos seguidos y notas de la rutina.
- **⬇️ .zip** con todo lo subido:
  `Gastos <fecha>/<Banco> - <Tipo> - <número> (<divisa>)/<año>/<YYYY-MM> <nombre original>`,
  un `movimientos.csv` por cuenta (sin duplicados entre extractos que
  se solapan), `Sin clasificar/` para lo aún no leído y un `LEEME.txt`
  con la cobertura y los huecos.

URL: `https://pacosql.github.io/Train/gastos/`

## Privacidad

La app pide una **contraseña** (la misma en todos tus dispositivos). Tu
archivo es el SHA-256 de esa contraseña; las tablas no tienen políticas
RLS para anon y todo pasa por funciones `gastos_*` que exigen esa clave.
Los ficheros van al bucket `gastos` dentro de una carpeta con esa clave
(lectura por URL, sin listado). Si olvidas la contraseña no hay forma de
recuperarlos desde la app.

## Datos

Ver [`tools/schema.sql`](./tools/schema.sql).

| Tabla | Qué guarda |
|---|---|
| `gastos_archivos` | cada fichero subido: ruta, huella, pista, `estado` (`pendiente` · `procesado` · `error` · `ignorado`), resumen de la rutina |
| `gastos_cuentas` | cada cuenta/tarjeta: banco, tipo, número, divisa, alias, histórico desde, cerrada en, meses sin extracto a propósito |
| `gastos_periodos` | qué fechas de qué cuenta cubre cada archivo (con saldos) — de aquí salen los cuadritos |
| `gastos_movimientos` | movimientos leídos (para el `movimientos.csv` y los totales por mes) |
| `gastos_avisos` | notas de la rutina para el usuario |
| `gastos_rutinas` | registro de cada pasada de la rutina |

Herramienta de la rutina: `python3 gastos/tools/db.py` (Management API).
