# Cómo se buscan y criban los nombres en Nombre Empresa

App hermana de [Nombre Mates](../nombremates/METODO.md). Aquí no se busca la
marca de una app, sino el nombre de la **SL matriz** que:

- sale como **desarrollador** debajo de Mates10 (y de las próximas apps de
  vocabulario y ortografía) en App Store y Google Play;
- aparece en las **facturas de consultoría** (y en la línea de nombre de
  empresa de los formularios fiscales de los clientes de EE. UU.);
- no se va a promocionar: vive por debajo de otras marcas.

## Qué es un buen nombre aquí

- **.com libre** con el nombre exacto (RDAP de Verisign).
- **Poca competencia**: que no haya desarrolladores, apps ni canales con un
  nombre igual o muy parecido.
- Paraguas: **neutro** (no dice «mates»), vale para educación en general.
- Se lee y se dice bien en **español e inglés** (facturas a EE. UU.).
- Serio para una factura, amable para una ficha de app infantil.
- Que pueda ser denominación de SL: el Registro Mercantil Central rechaza
  nombres idénticos a otra sociedad, así que mejor algo poco común.

## Cribado ([`tools/cribar.py`](./tools/cribar.py))

1. **.com libre** (RDAP; `404` = no registrado), más .net y .org a título
   informativo. Todo queda en `empresa_comprobados`.
2. **Competencia parecida, no solo idéntica**, troceando el nombre en
   palabras (diccionario español + palabras inglesas típicas de empresa):
   - **App Store España**: nombre de la app **y del desarrollador /
     vendedor**. Apple corta con 403 si se pregunta deprisa: una consulta
     cada 3 s. (La tienda de EE. UU. responde 403 desde este entorno.)
   - **Google Play**: nombre de la app y del desarrollador.
   - **YouTube**: canales y suscriptores.
   - Se quitan los sufijos societarios (S.L., Inc., LLC…) antes de comparar.
3. Los que chocan quedan como `vetado` con su motivo (se pueden rescatar).

No es un certificado legal. Con los finalistas, a mano: certificación
negativa de denominación en el **RMC** (www.rmc.es), y si se quiere marca,
OEPM / EUIPO / USPTO. Hay enlaces en la ficha de cada nombre.

## Ranking

Seis medidas de 0 a 10 (corto, fácil, memorable, sugiere, distintivo,
búsqueda; distintivo pesa la mitad) como en Nombre Mates
([`tools/medidas.py`](./tools/medidas.py)). Las fichas a mano están en
[`tools/fichas.json`](./tools/fichas.json) y se cargan con
`python3 empresa/tools/fichas.py`. Para una empresa paraguas, «sugiere»
mide si suena a estudio que hace apps educativas sin atarse a una
asignatura, y «búsqueda» si buscar el nombre lleva solo a ti.

## Tablas

- `empresa_ideas`: nombre, status (pendiente / me_gusta / no_me_gusta /
  favorito / vetado), veto_motivo, tanda, metodo, porque, com_libre,
  otros_tld, notoriedad, colision_detalle, nota, score, medidas…
- `empresa_sugerencias`: comentarios generales (texto o dictados).
- `empresa_comprobados`: histórico de dominios comprobados.
- `empresa_referencias`: las 25 marcas de «📐 Buen nombre».
- `empresa_rutina_log`: registro de cada criba.

## Siguiente tanda

`python3 empresa/tools/contexto.py` enseña lo marcado y los comentarios;
se generan candidatos parecidos a los 👍/⭐ en
`empresa/tools/out/candidatos.txt` y se criban con
`python3 empresa/tools/cribar.py empresa/tools/out/candidatos.txt --tanda N --modelo <modelo>`.
