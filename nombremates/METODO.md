# Cómo se generan y criban los nombres en Nombre Mates

App hermana de [Nombra](../nombra/METODO.md), aplicada a una app de
matemáticas para niños en España (la idea original era `mates10.com`).

## 1. Generación por familias

Los candidatos no salen de un mezclador raíz + sufijo: se escriben a mano
por familias, cada uno con una línea de "por qué" que se ve en la app.

| Familia | Idea | Ejemplos |
|---|---|---|
| De diez | Hereda la idea de mates10: "de diez" = excelente | matesdediez, sacaundiez |
| Me llevo una | Léxico real del cole español | mellevouna, cantatablas, pruebadelnueve |
| Personajes y mascotas | Un personaje da imagen y recorrido | sumasaurio, piratapi, pulpocho |
| Aventura y mundos | Un lugar al que ir a jugar | numerolandia, numeronauta |
| Símbolos y conceptos | Signos, geometría, material escolar | ochotumbado, regletas |
| Cerebro y agilidad | Cálculo mental, trucos, ingenio | cocomates, rompecocos |
| Fusiones | Dos palabras en una | sumagia, divertimates |
| Expresiones | Lo que dice un niño cuando le sale | mesalio, alastres, eresun10 |
| Crecimiento | Subir, llegar, camino | rumboal10, escalones10 |

Reglas: nada de ñ ni tildes en el dominio, que se escriba como se oye
y que un niño de 7 años lo pueda decir.

## 2. Cribado (scripts en el scratchpad del chat, no se despliegan)

1. **.com libre**: RDAP de Verisign (`404` = no registrado). Todo
   resultado se guarda en `nombremates_comprobados` para no repetir.
2. **Marcas iguales o PARECIDAS**, no solo idénticas. El caso que lo
   motivó: `mates10` parecía libre, pero existe la marca registrada
   «PROFESOR 10 DE MATES» (OEPM, clases 16 y 41) y el canal
   `profesor10demates` (689.000 suscriptores).
   - El nombre se trocea en palabras con un diccionario español
     (`matesdediez` → `mates de diez`) y se normalizan números
     (`diez` → `10`), plurales y sinónimos (`matemáticas` → `mates`).
   - **TMview** (marcas de España, UE y WIPO): búsqueda fuzzy por
     palabras. TMview bloquea la IP si se le pregunta deprisa: una
     consulta cada 4 s como mínimo.
   - **YouTube**: canales que salen al buscar esas palabras, con sus
     suscriptores. **App Store España** y **Google Play**: nombre de la app
     (lo que va antes de «:» o «-»).
   - Lista fija de marcas fuertes del sector (Smartick, Kumon, Pitagorín,
     Lingokids, Photomath…): contenerla o parecerse ≥ 88 % es choque.
3. **Regla de choque** (lo que miraría un examinador de marcas):
   - Nombre casi igual (similitud ≥ 88 %, ≥ 92 % si es palabra común), o
     marca viva con el nombre exacto en cualquier clase.
   - Todas las palabras del candidato están en la marca (y la marca no
     añade más de dos), o todas las de la marca en el candidato, con al
     menos una palabra con carácter (no vale solo «mates» o «10»).
   - Una palabra inventada (no de diccionario) compartida que ocupa la
     mayor parte del nombre.
   - Marcas: vivas y en clases 9, 16, 28 o 41. Canales: ≥ 1.000
     suscriptores; con ≥ 50.000 se tratan como una marca registrada.
   - Compartir solo palabras comunes (pulpo, robot, galaxia) es «leve»:
     se enseña pero no veta.
4. Los que chocan quedan con `status = 'vetado'` y `veto_motivo`, visibles
   en la sección «Vetados por marca» de la app (se pueden rescatar).

## 3. Tablas

- `nombremates_ideas`: nombre, status (pendiente / me_gusta /
  no_me_gusta / favorito / vetado), veto_motivo, tanda, metodo, porque, com_libre,
  otros_tld, notoriedad, colision_detalle, nota (comentario del
  usuario), decidido_at.
- `nombremates_sugerencias`: comentarios generales (texto o dictados).
- `nombremates_comprobados`: histórico de dominios comprobados.

## 4. Revisión y siguiente tanda

La app enseña lotes de 10: lo marcado 👍/⭐ se guarda y el resto pasa a
descartados al pulsar «Siguiente 10».


Antes de generar otra tanda se leen las notas y sugerencias sin atender,
se marcan como `atendida` y se generan nombres parecidos a los
`me_gusta`/`favorito`, evitando el estilo de los descartados.

## 5. Lo que el cribado NO es

No es un certificado legal. Antes de registrar: búsqueda de marca en
OEPM y EUIPO (TMview) en clases 9, 16, 28 y 41.
