# Minería de nombres para Mates10 (rutina continua)

**Objetivo: encontrar un nombre de 90.** La rutina trabaja sin parar: se
dispara cada hora y, si nadie está minando, toma el turno y se pone a
trabajar (`tools/turno.py`). Cada ejecución apunta alto (≥ 88, ideal 90+)
pero no tira nada bueno: todo lo que llegue a **65** con .com libre entra
en la cola, ordenado por nota (Paco ve primero los mejores).

Mínimo por ejecución: **5 nombres nuevos ≥ 80**. Lo que se busca de verdad:
**alguno ≥ 88**, que dispute el título a Netflix (88) y a Mates10.

## Cómo se puntúa

La metodología de «📐 Buen nombre»: seis medidas de 0 a 10 (corto, fácil,
memorable, sugiere, distintivo, búsqueda) con el porqué de cada nota. El
total es la media ponderada × 10 y **distintivo pesa la mitad**
(`tools/medidas.py`). Público: alumnos de 7 a 18 años en España; el mensaje
es mates. Referencias: Netflix y Chupa Chups 88, PayPal 87, YouTube y
Red Bull 86, Duolingo 85, Mates10 77. Puntúa con honestidad: un 80 es un
nombre que pondrías al lado de BlaBlaCar o Nike; un 90 es **mejor que
Netflix** para su público. Un 90 necesita algo como 9-10 en todo menos
quizá distintivo (p. ej. 9/9/9/10/8/9): corto (≤ 2 sílabas fuertes), se lee
a la primera, se recuerda tras oírlo una vez, dice «mates» sin explicarlo,
no se confunde con nada y en Google sale solo él.

## Proceso de cada ejecución (≈ 50 min)

0. `python3 nombremates/tools/turno.py tomar <id de sesión>`. Si sale con
   código 3 (OCUPADO), **termina sin hacer nada**. Durante el trabajo,
   `turno.py renovar` cada ~30 min; al acabar, `turno.py soltar "<resumen>"`
   (también si algo falla).
1. `git pull origin main`. Lee `tools/fichas.json`, este fichero entero y
   las decisiones de Paco (`nombremates_ideas` con `decidido_at` reciente;
   me_gusta / favorito / no_me_gusta). **Aprende de ellas** y apunta la
   lección en «Lecciones».
2. **Ronda de exploración**: 150-300 candidatos NUEVOS con ficha completa en
   `tools/out/cand.json` (formato de `fichas.json`), repartidos en familias
   distintas, incluidas familias que nadie ha probado aún (ver «Ideas para
   llegar a 90»). `python3 nombremates/tools/minar.py nombremates/tools/out/cand.json`.
3. **Rondas de afinado** (el proceso creativo): coge los mejores que tengas
   —los de esta ejecución, los ≥ 84 de la cola y los que le gustan a
   Paco— y pregúntate qué medida les quita puntos. Genera variantes que
   arreglen justo eso: acortar, quitar una letra que se lee mal, cambiar
   el orden, otra grafía, una palabra con más gancho, un sonido que se
   repita… Cada ronda: 50-150 variantes, `minar.py`, mira qué sube y
   vuelve a mutar lo que subió. Alterna exploración y afinado hasta que se
   acabe el tiempo (~45 min) o encuentres un ≥ 90.
4. **Segunda opinión para los altos**: todo candidato que tú pongas ≥ 88
   pásalo, antes de cargarlo, a un subagente que lo puntúe a ciegas con las
   6 medidas contra las referencias (Netflix 88, PayPal 87, Duolingo 85,
   Mates10 77) buscando por qué NO merece esa nota. Quédate con la media
   de ambas notas en cada medida. Un 90 inflado no sirve de nada.
5. Commit y push a main de `tools/fichas.json` y de este fichero si
   añadiste lecciones (si el push falla no es bloqueante: las fichas ya
   están en la base de datos, que es lo que ve la app).
6. `turno.py soltar "<resumen corto>"` y resumen final: nuevos ≥ 80, los
   ≥ 88 si hay, los 5 mejores con nota y qué medida les falta para el 90,
   familias probadas.

## Ideas para llegar a 90

- Lo que tienen los 88 (Netflix, Chupa Chups, PayPal): dos piezas cortas
  con ritmo o rima, se dice solo, y cuenta lo que es. Buscar ese ritmo con
  mates: aliteración (M-M, P-P), rima interna, sílabas que rebotan.
- Palabras de mates que suenan a marca por sí solas (cifra, suma, pi, cero,
  cubo, eje, raíz…) con un giro corto; nombres de 2 sílabas.
- Lo que le gustó a Paco (Matesrock, Matesninja): mates + palabra corta con
  actitud. Buscar la versión de 90 de esa idea, no más de lo mismo.
- Evitar lo que ya se sabe que se queda en 80-85 (animal + mates): es
  seguro pero no llega a 90.

## Qué funciona (familias con .com libre y ≥ 80)

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
