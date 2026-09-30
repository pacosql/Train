# Colegios (`mates10_colegio`)

Centros que imparten **Educación Primaria, ESO o Bachillerato** (públicos,
concertados y privados), por comunidad autónoma.

## Fuente

Registro Estatal de Centros Docentes no Universitarios (RCD) del Ministerio
de Educación: <https://www.educacion.gob.es/centros/>. No tiene descarga
masiva en datos.gob.es; se usa el propio buscador:

| Paso | Petición (POST) | Qué da |
|---|---|---|
| 1 | `verBuscadorComunidad` `idComunidad=NN` | abre la sesión del buscador |
| 2 | `buscarCentros` con `nivel=121/131/133` | listado HTML (Primaria / ESO / Bachillerato), sin paginar |
| 3 | `exportarListadoCentrosExcel` (mismos filtros) | `.xls` oficial con columna NATURALEZA (público / concertado / privado) |
| 4 | `detalleCentro` `codCentro=XXXXXXXX` | ficha: **municipio** (el listado solo da la localidad), Concertado Sí/No, enseñanzas |

`idComunidad` del RCD: AN 01, AR 02, AS 03, IB 04, CN 05, CB 06, CL 07,
CM 08, CT 09, EX 10, GA 11, RI 12, MD 13, MC 14, NC 15, VC 16, PV 17, CE 18,
ML 19 (tabla `RCD_COMUNIDAD` del script).

## Cargar una comunidad

```bash
pip install xlrd requests beautifulsoup4   # xlrd: el RCD exporta .xls BIFF
python3 mates10/tools/cargar_colegios.py ES-MC          # Murcia
python3 mates10/tools/cargar_colegios.py ES-RI --seco   # prueba sin escribir en la BD
```

El script archiva todo como fuente `RCD-<ES-XX>-<fecha>` (`registro_oficial`,
`descarga_oficial`, confianza alta, módulo 01): listados HTML de los tres
niveles, los tres `.xls`, las fichas (`fichas_detalleCentro.json`) y el
resultado normalizado (`centros_normalizados.json`). Después hace upsert
`on conflict (sistema_id, codigo_oficial)`; volver a ejecutarlo actualiza.

## Reglas de normalización

- `nombre` = denominación genérica + específica (p. ej. «Colegio de Educación
  Infantil y Primaria DIONISIO BUENO»).
- `municipio` = Municipio de la ficha; el artículo pospuesto se antepone
  («Alcázares, Los» → «Los Alcázares»).
- `tipo`: naturaleza pública → `publico`; privada con Concertado = Sí →
  `concertado`; privada no concertada → `privado`. Coincide con la columna
  NATURALEZA del Excel (el script avisa si no).
- `ensenanzas`: niveles en cuyo listado aparece el centro.
- Se descartan centros de otra comunidad que el buscador añade siempre (el
  CIDEAD de Madrid, 28700519, enseñanza a distancia estatal).
- Se mantienen tal cual los que el RCD registra con Primaria aunque no sean
  colegios ordinarios: centros de Educación Especial y aulas hospitalarias.

## Cargas hechas

| Comunidad | Fecha | Total | Público | Concertado | Privado | Primaria | ESO | Bach. |
|---|---|---|---|---|---|---|---|---|
| ES-MC | 2026-09-30 | 636 | 508 | 116 | 12 | 526 | 250 | 158 |
