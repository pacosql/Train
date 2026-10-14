# Minería de nombres para Mates10 (rutina)

**Objetivo: nombres que le gusten a Paco**, no nombres con nota alta. Con
~2.900 decisiones (12/10) la nota de las 6 medidas **no predice su gusto**:
le gusta el 3 % de lo que ve, igual con nota 76 que con 86, y cada vez
menos (las últimas tandas, 0-1 %). Por eso descartaba sin parar. La nota
de 6 medidas queda como filtro mínimo (≥ 70); lo que decide es el gusto.

**La cola, como mucho 150.** Lo que no entra se guarda con status
`reserva` (no se borra; puede volver a la cola si un día encaja).
Cuándo se mina (`tools/turno.py`): a la **1 h de Madrid** se rellena
hasta 150; el resto de horas, solo si quedan **menos de 30** por decidir.

## Qué le gusta a Paco (12/10, 83 👍 de 2.881)

- Lo que más le gusta: palabras con **energía o actitud**, cortas y
  conocidas, pegadas a «mates»: Matesrock, Matesninja, Punkmates,
  Heavymates, Rompemates, Surfeamates, Pateamates, Patinamates, Lasermates,
  Rayomates, Matesrush, Matesmoto, Matesraptor, Kiaimates, Triplemates.
- **Rompe-** (Rompemates, Rompenumeros, Rompeceros) y **-nauta**
  (Matenauta, Numerauta, Cifronauta, Calculonauta, Matinauta).
- **Cosas del cole**: Tizamates, Lapizmates, Libretamates, Pupitremates,
  Tintamates, Colemates (pero no Borrador ni Pizarra).
- **Tecnología y juego**: Matesgeek, Matescoder, Matesdev, Cibermates,
  Matesclick, Matesgo, Matestic.
- Ánimo y colegueo: Vamosmates, Aupamates, Molamates, Matesbro, Matesliga,
  Matesprimo, Tomamates, Tiramates, Lanzamates, Retamates.
- Infinito, potencia, factor: Matesinfinito, Infinitomates, Matepotencia,
  Factormates, Maximates.

**Qué descarta casi siempre** (0 de 100 o más): terminaciones en
**-tablas, -cuentas, -cifras** (0/55, 0/45, 0/34), **Mate + sustantivo
cualquiera** (Matehelado, Matetrebol: 2 %), letras griegas (Theta, Kappa,
Lambda, Iota), mitología y espacio (Odín, Olimpo, Andrómeda, astral,
orbital), comida, jerga en inglés de redes (drip, dope, slay, pog, rizz),
animales (0/94), y las variantes de algo que ya le gustó en cuanto se
repite (rock: 3 de 13; ninja: 2 de 15): **una palabra que gustó vale como
pista, pero no la exprimas** (máximo 2 nombres nuevos con la misma pieza).

## Proceso de cada ejecución

0. `python3 nombremates/tools/turno.py tomar <id de sesión>`. Si sale con
   código 3 (OCUPADO) o 4 (NO HACE FALTA MINAR), **termina sin hacer
   nada**. Si lo toma, dice cuántos caben en la cola. Renueva con
   `turno.py renovar` cada ~30 min y al acabar `turno.py soltar "<resumen>"`.
1. `git pull origin main`. Lee esto entero, las lecciones
   (`python3 nombremates/tools/lecciones.py leer`), **todos los 👍 de Paco**
   y sus **300 últimos 👎** (`nombremates_ideas` por `decidido_at`), y
   `python3 nombremates/tools/gusto.py --resumen`.
2. **Antes de inventar, mira la reserva**: `status = 'reserva'`. Si alguno
   encaja claramente con lo que le gusta, devuélvelo a la cola
   (`status = 'pendiente'`, `orden` bajo).
3. Escribe candidatos nuevos con ficha (formato de `fichas.json`) en
   `tools/out/cand.json`. Para cada uno pregúntate con honestidad:
   **«viendo sus 👍 y sus 👎, ¿le daría Paco un 👍?»**. Pasa la lista por
   `python3 nombremates/tools/gusto.py --json tools/out/cand.json` como
   pista (con la evidencia de cada pieza) y **quédate solo con los que
   apostarías a que tienen 1 de cada 5 o más**. Mejor 40 buenos que 150
   flojos. Variedad: palabras distintas, como mucho 2 por pieza.
4. `python3 nombremates/tools/minar.py nombremates/tools/out/cand.json`
   (filtra probados, comprueba .com, criba marcas, carga, ordena la cola por
   gusto previsto y manda a reserva lo que pase de 150).
5. Repite 3-4 hasta llenar el hueco o hasta ~45 min.
6. Guarda lo aprendido (`lecciones.py anotar`), commit y push a main de
   `tools/fichas.json` y tus arreglos (si el push falla, dilo; los datos ya
   están en la base de datos), suelta el turno y resume: cuántos cargados,
   cuántos devueltos de reserva, los 10 que más crees que le gustarán.

## Mejorar las herramientas

La rutina puede y debe arreglar lo que le estorbe (scripts de `tools/`,
este fichero, fallos de la app): hazlo, prueba (`node nombremates/test/smoke.js`
si tocas la app) y haz commit y push a main. Nunca cambies decisiones de
Paco, ni borres nombres, ni toques tablas o carpetas de otras apps.

## Nota alta (secundario)

Si además sale algo de 88-90 que le pueda gustar, mejor; pero no a costa
de su gusto. Ideas antiguas para subir la nota:

- Lo que tienen los 88 (Netflix, Chupa Chups, PayPal): dos piezas cortas
  con ritmo o rima, se dice solo, y cuenta lo que es. Buscar ese ritmo con
  mates: aliteración (M-M, P-P), rima interna, sílabas que rebotan.
- Palabras de mates que suenan a marca por sí solas (cifra, suma, pi, cero,
  cubo, eje, raíz…) con un giro corto; nombres de 2 sílabas.
- Lo que le gustó a Paco (Matesrock, Matesninja): mates + palabra corta con
  actitud. Buscar la versión de 90 de esa idea, no más de lo mismo.
- Evitar lo que ya se sabe que se queda en 80-85 (animal + mates): es
  seguro pero no llega a 90.

## Histórico: familias que sacaban buena NOTA (no buen gusto: ver arriba)

- Animal + mates o cifra/suma, como Red Bull: Pulpomates, Buhomates,
  Zorromates (84), Tigremates, Lobomates, Torocifra.
- Mates + palabra coloquial española: Matesguay, Matesmola (82).
- Repetición o sonido con gracia: Tictacmates (82), Tablatabla, Sumasigue.
- Palabra de mates + palabra corta con gancho: Cifrazoo, Matesninja,
  Matesrock, Matesflash.

## Qué no

- Nunca «mates» + «10/diez» juntos: la criba lo veta por la marca
  PROFESOR 10 DE MATES.
- Los compuestos cortos obvios (Matespop, Cifrapop, Sumapop…) suelen
  chocar con apps que ya existen.
- Nada infantil que rechace un chaval de 16 ni inventados sin sentido.
- No consultes TMview/OEPM (bloquean la IP). No cambies decisiones de Paco.

## Lecciones

- 29/9: en la primera tanda con este método, 8 de 59 cayeron por apps o
  canales parecidos (Matespal, Matespop, Matesfest, Matesbeat…).
- 29/9 (primera ejecución de la rutina): animal + mates/cifra/suma/cuenta da muchos ≥ 80 con .com libre (Loromates, Leonmates 85; Aguilamates, Cuervomates, Lincemates 84). Vetados por parecidos: Grillomates, Ratonmates, Patomates, Matesturbo, Matessquad, Matesrun, Pingpongmates… Ojo con animales infantiles (Dino): bajan a 76.
- Hay ya muchos animal + palabra de mates en la cola: en las próximas rondas busca familias nuevas para no repetir el mismo patrón.
- 29/9: de los 51 primeros (animales, coloquiales, repeticiones) Paco descartó 49 y solo le gustaron Matesrock y Matesninja: «Mates» delante + palabra corta con actitud en inglés (rock, ninja). Priorizar esa familia (Mates + palabra con carácter) y no insistir en animal + palabra de mates hasta ver qué opina de los que ya hay en cola.
- 29/9: la rutina funciona en sesión nueva (cargó 14 ≥ 80: Punkmates 84, Piratamates 83, Zeusmates 83…), pero allí el push puede fallar: las fichas quedan igualmente en la base de datos.
