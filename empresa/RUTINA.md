# Rutina «Nombre Empresa» (cada 15 minutos)

Objetivo: que Paco nunca se quede sin nombres buenos que revisar en
<https://pacosql.github.io/Train/empresa/> y que cada tanda aprenda de lo
que ha marcado. Todo desde la raíz del repo `Train`.

## Pasos

1. **Cerrojo**: `pgrep -f "[c]ribar.py"`. Si hay una criba en marcha, no
   arranques otra: termina (como mucho, ejecuta `notas.py`).
2. `python3 empresa/tools/contexto.py --atender` y léelo entero:
   - **Comentarios generales «●»** (sin atender) = órdenes directas, la
     prioridad máxima. Cada uno cambia el gusto de la tanda siguiente.
   - **Pesos, no vetos** (regla de Paco, 12/10). Cada estilo (familia,
     sufijo, tipo de palabra) tiene un peso que decide cuántos candidatos
     de ese estilo entran en la tanda:
     - **👍 / ⭐** suben el peso: genera parecidos (misma idea, mismo
       sonido, mismo tipo de palabra), no copias. ⭐ cuenta doble.
     - **👎** baja el peso un poco: ese estilo sale menos, pero sigue
       saliendo.
     - **🙅 Nada de esto** lo baja mucho: solo alguno de vez en cuando.
     - **Acumulan**: cada 👎/🙅 más sobre el mismo estilo lo baja otra vez
       (dos 🙅 → casi nunca; tres → solo como rareza muy de tarde en tarde).
       Un 👍 posterior lo vuelve a subir.
     - Generaliza el estilo: 🙅 a «OcreApps» pesa sobre «todo lo que acaba
       en Apps», no solo sobre ese nombre.
3. ¿Hace falta tanda? Sí si hay comentarios nuevos, o 👍/⭐/🙅 nuevos
   desde la última ejecución, o quedan **< 60 pendientes con score ≥ 70**.
   Si no hace falta, registra con `log.py` y termina.
4. **Genera** `empresa/tools/out/candidatos.txt` (con Write) con líneas
   `Nombre|por qué|c f m s d b` bajo cabeceras `# familia: …`, donde las
   seis notas 0-10 son tu opinión honesta: corto, fácil (en español Y en
   inglés), memorable, sugiere (estudio que crea productos educativos y
   negocios, sin atarse a una asignatura ni decir «consultoría»),
   distintivo, búsqueda. ~300 candidatos: dos de cada tres caen por .com
   ocupado. Las familias que funcionan primero; prueba 2-3 nuevas.
5. `python3 empresa/tools/cribar.py empresa/tools/out/candidatos.txt --tanda <N> --modelo <tu modelo>`
   (N = tanda máxima + 1, la imprime contexto.py). Tarda ~1 s por nombre
   (App Store va despacio a propósito).
6. `python3 empresa/tools/notas.py empresa/tools/out/candidatos.txt`:
   ranking de todo (6 medidas, score y cola ordenada por score).
7. Resumen de una línea: cuántos cargados, vetados, familias nuevas, y qué
   has aprendido de sus marcas. No hace falta desplegar.

## Lo que ya sabemos de Paco (actualiza esta lista)

- Busca el nombre de una **SL paraguas** (venture studio): desarrollador
  de Mates10 y de apps de vocabulario/ortografía en App Store y Google
  Play, y nombre en facturas de consultoría a EE. UU.
- Tiene que **sonar bien en inglés y en español** y tener sentido.
- Le gusta **«Blue»** (p. ej. «Blue Studio»); propuso «azul studio» y
  «studiolab».
- Lo que termina en **«Apps»**: 🙅 (12/10, «eso no me interesa»): peso
  muy bajo, como mucho alguno suelto.
- 👎 a los 30 primeros de la tanda 1: objeto del cole + lab (TizaLab,
  PupitreLabs, Estuchelab…), juguetes (Peonza, Canica), colores + lab.
  Peso bajado, no a cero.

## Qué NO hacer

- No cambies el estado de nada que Paco haya decidido.
- No consultes TMview/OEPM/RMC en bucle.
- No despliegues ni toques `main` desde la rutina.
