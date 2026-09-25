# Rutina «Nombre Mates» (cada 15 minutos)

Objetivo: que el usuario nunca se quede sin nombres buenos que revisar en
<https://pacosql.github.io/Train/nombremates/>, y que cada tanda aprenda de
lo que ha marcado. Todo se hace desde la raíz del repo `Train`.

## Pasos

1. `python3 nombremates/tools/contexto.py --atender`
   - Si **PENDIENTES ≥ 200 y no hay sugerencias «●» sin atender → no hagas
     nada más** y termina. (Cuenta solo los buenos; la «reserva» de flojos
     no cuenta.) Si hay sugerencias sin atender, haz solo el paso 2.
   - Si no, sigue. Lee con atención los 👍/⭐, los comentarios (por nombre y
     generales) y los descartados: son la guía de gusto.
2. **Sugerencias del usuario = prioridad máxima.** Si contexto.py muestra
   comentarios generales marcados con «●» (sin atender), cada uno es una
   orden directa: escribe primero un fichero aparte `nombremates/tools/out/sugerencias.txt`
   con **30–60 variaciones por sugerencia** (el nombre tal cual si tiene
   sentido, y su familia: si dice «suma10», prueba `Suma10`, `Sumadiez`,
   `Resta10`, `Sumaal10`, `Suma100`, `Sumax10`…; si dice «gauss», prueba
   `Gauss` + variantes y otros matemáticos: `Euler`, `Hypatia`, `Fermat`,
   `Pascal`…; si pide «potenciamates», la familia de operaciones y
   potencias), bajo cabeceras `# familia: Sugerencia: <texto>`. Cárgalo
   con `--primero` para que salga el primero en la app:
   `python3 nombremates/tools/cribar.py nombremates/tools/out/sugerencias.txt --tanda <N> --max 200 --primero --modelo <tu modelo>`.
   Esto se hace SIEMPRE, aunque haya ≥ 200 pendientes.
3. **Genera candidatos nuevos** (la parte creativa la haces tú, no un
   script). Escribe `nombremates/tools/out/candidatos.txt` con líneas `Nombre|por qué evoca`
   bajo cabeceras `# familia: …`. Apunta a **~600 candidatos** para que
   queden ≥ 400 tras la criba (más o menos un tercio cae por .com ocupado o
   por marca parecida). **Los mejores primero**: el orden del fichero es el
   orden en que se le enseñarán.
4. `python3 nombremates/tools/cribar.py nombremates/tools/out/candidatos.txt --tanda <N> --max 400`
   con N = tanda máxima + 1 (la imprime contexto.py). Añade siempre
   `--modelo <tu modelo, p. ej. claude-fable-5-1>`: cada ejecución queda en
   `nombremates_rutina_log` y contexto.py enseña las últimas.
   Si la criba deja 0 cargados o falla, dilo en el resumen final con el error
   literal. El script comprueba
   el .com, criba marcas parecidas (YouTube, App Store, Google Play), salta
   repetidos y carga los que pasan. Tarda ~1 s por nombre.
5. Termina con un resumen de una línea: cuántos cargados, cuántos vetados y
   qué familias nuevas has probado. No hace falta tocar la app ni desplegar.

## Cómo generar bien (lo que ya sabemos del usuario)

- Le gustan los **cortos, modernos y con empuje**: `Matesgo`, `Matesflash`,
  `Rumboal10`, `Directoal10`. Sensación de dirección, meta, velocidad,
  logro; sonido de marca de app, 2–3 sílabas, ≤ 10–12 letras.
- Ha descartado en bloque: animal + mates (`Buhomates`), onomatopeyas
  (`Tachan10`, `Zipizapemates`), diminutivos (`Diecito`, `Cuadradin`), frases
  largas de cole (`Cuentasdelavieja`, `Matriculademates`), «X mola / X guay»,
  compuestos con suma/cuentas (`Fabulosuma`, `Pequecuentas`), mascotas
  (`Pulpocho`, `Sumasaurio`). No insistas en esos estilos salvo que un
  comentario nuevo diga lo contrario.
- **Cada tanda prueba 3–4 familias creativas nuevas** que no se hayan
  probado (mira las familias de las últimas ejecuciones en contexto.py) y repite las
  que estén dando 👍. Ideas de veta: raíces latinas/griegas
  (numerus, mathema, logos), palabras de otros idiomas que un español lee
  bien (nórdico, italiano, japonés corto), verbos en imperativo cortos,
  fusiones de dos palabras cortas con sílaba compartida (`Sumarte`), nombres
  con `go/up/pro/max/flash/turbo/click` tras una raíz de mates, palabras
  reales poco usadas con buen sonido (`Numen`, `Ábaco`→`Abak`), acrónimos
  pronunciables, nombres de estrellas y montañas, colores y minerales…
- **Cupo de compuestos**: como mucho 1 de cada 4 candidatos puede ser una
  palabra de mates pegada a otra (`…mates`, `…cifras`, `…suma`, `…cuenta`,
  `…calculo`, `…numeros`). El resto: nombres con entidad propia que no
  digan «mates» (inventados, palabras reales evocadoras, metáforas, raíces).
- Reglas duras: sin ñ ni tildes en el nombre, sin mezclar «mates» con
  «10/diez» (choca con la marca PROFESOR 10 DE MATES), sin marcas conocidas
  dentro (Smartick, Kumon, Pitagorín, Duolingo…), sin dobles sentidos feos,
  y que un niño de 7 años lo pueda decir y escribir.
- Explica cada nombre en la línea `por qué` en una frase corta y concreta,
  en español; es lo que ve el usuario al tocarlo.

## Registro obligatorio (aunque falle)

Cada ejecución tiene que dejar rastro en `nombremates_rutina_log`:
- Si llegas a `cribar.py`, ya lo deja él (con `--modelo`).
- Si terminas ANTES de cribar (umbral ≥ 200, error, permiso denegado, no
  encuentras el repo…), ejecuta al final, sin excepción:
  `python3 nombremates/tools/log.py --modelo <tu modelo> "<qué pasó, con el error literal si lo hubo>"`.
- Escribe los ficheros de candidatos con la herramienta Write, no con
  heredocs largos en Bash.

## Qué NO hacer

- No consultes TMview ni la OEPM en bucle: bloquean la IP. Las marcas
  registradas se miran a mano cuando el usuario elija finalistas.
- No cambies el estado de nada que el usuario haya decidido.
- No despliegues ni toques `main` desde la rutina.
