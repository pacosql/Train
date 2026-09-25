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

## 2. Cribado automático (`scratchpad` del chat, no se despliega)

1. **.com libre**: RDAP de Verisign (`404` = no registrado). Todo
   resultado se guarda en `nombremates_comprobados` para no repetir.
2. **Notoriedad**:
   - App Store España: ¿hay alguna app cuyo nombre contenga el término?
   - Wikipedia es/en: ¿hay un artículo con ese título?
   - `.net` y `.org`: si ambos están cogidos, alguien lo usa como marca.
   - Búsqueda web del término entre comillas (marcas, apps, academias).
3. Pasa si el .com está libre y no hay una marca/app activa con ese
   nombre en educación o infantil. El detalle queda en
   `colision_detalle`.

## 3. Tablas

- `nombremates_ideas`: nombre, status (pendiente / me_gusta /
  no_me_gusta / favorito), tanda, metodo, porque, com_libre,
  otros_tld, notoriedad, colision_detalle, nota (comentario del
  usuario), decidido_at.
- `nombremates_sugerencias`: comentarios generales (texto o dictados).
- `nombremates_comprobados`: histórico de dominios comprobados.

## 4. Siguiente tanda

Antes de generar otra tanda se leen las notas y sugerencias sin atender,
se marcan como `atendida` y se generan nombres parecidos a los
`me_gusta`/`favorito`, evitando el estilo de los descartados.

## 5. Lo que el cribado NO es

No es un certificado legal. Antes de registrar: búsqueda de marca en
OEPM y EUIPO (TMview) en clases 9, 16, 28 y 41.
