# Cómo se buscan y criban los nombres en Nombre Ortografía

App hermana de [Nombre Empresa](../empresa/METODO.md) y
[Nombre Mates](../nombremates/METODO.md), con la misma estructura. Aquí se
busca la **marca de la app de ortografía**:

- ejercicios de ortografía para quien se presenta a la **EBAU** (selectividad)
  o a una **oposición**: que no tengan ni una falta el día del examen (en la
  EBAU y en muchas oposiciones cada falta resta nota);
- sale en **App Store y Google Play** y tiene su web;
- público: 17-18 años y adultos opositores → nada infantil.

## Qué es un buen nombre aquí

- **.com libre** con el nombre exacto (RDAP de Verisign). «ortografia.com» y
  «ortografia.es» están cogidos: hay que buscar algo con más personalidad.
- **Poca competencia**: que no haya apps, desarrolladores ni canales con un
  nombre igual o muy parecido.
- **Sugiere** cero faltas / escribir bien / aprobar, sin ser una descripción
  aburrida («Ortografía Práctica»).
- Se lee y se escribe bien en **español** (el público es hispanohablante);
  que funcione en inglés es un extra, no un requisito.
- Ojo con la **ñ** y las tildes: no caben en un .com, así que el nombre de la
  marca tiene que vivir bien sin ellas.

## Cribado ([`tools/cribar.py`](./tools/cribar.py))

1. **.com libre** (RDAP; `404` = no registrado), más .net y .org a título
   informativo. Todo queda en `nombreortografia_comprobados`.
2. **Competencia parecida, no solo idéntica**, troceando el nombre en
   palabras (diccionario español + palabras inglesas habituales):
   - **App Store España**: nombre de la app y del desarrollador.
   - **Google Play**: nombre de la app y del desarrollador.
   - **YouTube**: canales y suscriptores.
   - Marcas conocidas del sector (Fundéu, WordReference, OpositaTest,
     Rubio…) en la lista `FUERTES`.
3. Los que chocan quedan como `vetado` con su motivo (se pueden rescatar).

No es un certificado legal: con los finalistas, a mano, OEPM / EUIPO.

## Ranking

Seis medidas de 0 a 10 (corto, fácil, memorable, sugiere, distintivo,
búsqueda; distintivo pesa la mitad) como en Nombre Mates
([`tools/medidas.py`](./tools/medidas.py)). Las notas van en el tercer campo
de `candidatos.txt` y las carga `tools/notas.py`. Fichas a mano opcionales en
[`tools/fichas.json`](./tools/fichas.json) (`python3 nombreortografia/tools/fichas.py`).
«Sugiere» mide si suena a no tener faltas / escribir bien / aprobar;
«búsqueda» si buscar el nombre lleva solo a ti.

## Tablas

- `nombreortografia_ideas`: nombre, status (pendiente / me_gusta / no_me_gusta /
  favorito / nada / vetado), veto_motivo, tanda, metodo, porque, com_libre,
  otros_tld, notoriedad, colision_detalle, nota, score, medidas…
- `nombreortografia_sugerencias`: comentarios generales (texto o dictados).
- `nombreortografia_comprobados`: histórico de dominios comprobados.
- `nombreortografia_referencias`: las «🏛️ Otras marcas» (apps y webs reales de
  ortografía, idiomas y oposiciones; [`tools/marcas.py`](./tools/marcas.py)).
- `nombreortografia_rutina_log`: registro de cada criba.

## Siguiente tanda

`python3 nombreortografia/tools/contexto.py` enseña lo marcado y los
comentarios; se generan candidatos parecidos a los 👍/⭐ en
`nombreortografia/tools/out/candidatos.txt` y se criban con
`python3 nombreortografia/tools/cribar.py nombreortografia/tools/out/candidatos.txt --tanda N --modelo <modelo>`.
