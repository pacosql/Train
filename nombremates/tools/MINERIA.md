# Minería de nombres para Mates10 (rutina)

Objetivo: en **cada ejecución**, cargar en la cola de Paco **al menos 5
nombres nuevos con total ≥ 80** (.com libre, sin marcas parecidas). No
terminar hasta conseguirlo (máximo ~6 rondas; si no se llega, dejar
escrito por qué en la nota final).

## Cómo se puntúa

La metodología de «📐 Buen nombre»: seis medidas de 0 a 10 (corto, fácil,
memorable, sugiere, distintivo, búsqueda) con el porqué de cada nota. El
total es la media ponderada × 10 y **distintivo pesa la mitad**
(`tools/medidas.py`). Público: alumnos de 7 a 18 años en España; el mensaje
es mates. Referencias: Netflix y Chupa Chups 88, PayPal 87, YouTube y
Red Bull 86, Duolingo 85, Mates10 77. Puntúa con honestidad: un 80 es un
nombre que pondrías al lado de BlaBlaCar o Nike.

## Proceso de cada ejecución

1. `git pull origin main`. Lee `tools/fichas.json` (lo ya cargado y cómo
   se puntuó) y las decisiones recientes de Paco:
   `nombremates_ideas` con `decidido_at` de los últimos días (status
   me_gusta / favorito / no_me_gusta). **Aprende de ellas**: más de lo que
   le gusta, menos de lo que descarta en bloque; apunta la lección al final
   de este fichero («Lecciones»).
2. Escribe 150-300 candidatos NUEVOS en `tools/out/cand.json` con su ficha
   completa (formato de `fichas.json`: nombre, tipo, por_que, medidas con
   [nota, porqué] para las seis). Solo los que de verdad creas ≥ 80.
3. `python3 nombremates/tools/minar.py nombremates/tools/out/cand.json`
   (filtra probados, comprueba .com, criba marcas, carga y pone la ficha).
4. Lee el RESULTADO. Si lleva menos de 5 nuevos ≥ 80 en esta ejecución,
   vuelve al paso 2 con familias nuevas y con lo aprendido de los vetos
   y .com ocupados. Repite hasta 5.
5. Commit y push a main (y a la rama de trabajo si existe) de
   `tools/fichas.json` y de este fichero si añadiste lecciones.
6. Resumen final: cuántos nuevos ≥ 80, los 5 mejores con su nota y
   cuántos ≥ 80 hay pendientes en la cola.

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
