# Rutina «Nombre Mates» (cada 15 minutos)

Objetivo: que el usuario nunca se quede sin nombres buenos que revisar en
<https://pacosql.github.io/Train/nombremates/>, y que cada tanda aprenda de
lo que ha marcado. Todo se hace desde la raíz del repo `Train`.

## Pasos

1. `python3 nombremates/tools/contexto.py --atender`
   - Si **PENDIENTES ≥ 200 → no hagas nada más** y termina. (Cuenta solo
     los buenos; la «reserva» de flojos no cuenta.)
   - Si no, sigue. Lee con atención los 👍/⭐, los comentarios (por nombre y
     generales) y los descartados: son la guía de gusto.
2. **Genera candidatos nuevos** (la parte creativa la haces tú, no un
   script). Escribe `/tmp/candidatos.txt` con líneas `Nombre|por qué evoca`
   bajo cabeceras `# familia: …`. Apunta a **~600 candidatos** para que
   queden ≥ 400 tras la criba (más o menos un tercio cae por .com ocupado o
   por marca parecida). **Los mejores primero**: el orden del fichero es el
   orden en que se le enseñarán.
3. `python3 nombremates/tools/cribar.py /tmp/candidatos.txt --tanda <N> --max 400`
   con N = tanda máxima + 1 (la imprime contexto.py). El script comprueba
   el .com, criba marcas parecidas (YouTube, App Store, Google Play), salta
   repetidos y carga los que pasan. Tarda ~1 s por nombre.
4. Termina con un resumen de una línea: cuántos cargados, cuántos vetados y
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
  probado (mira `metodo` de tandas anteriores en contexto.py) y repite las
  que estén dando 👍. Ideas de veta: raíces latinas/griegas
  (numerus, mathema, logos), palabras de otros idiomas que un español lee
  bien (nórdico, italiano, japonés corto), verbos en imperativo cortos,
  fusiones de dos palabras cortas con sílaba compartida (`Sumarte`), nombres
  con `go/up/pro/max/flash/turbo/click` tras una raíz de mates, palabras
  reales poco usadas con buen sonido (`Numen`, `Ábaco`→`Abak`), acrónimos
  pronunciables, nombres de estrellas y montañas, colores y minerales…
- Reglas duras: sin ñ ni tildes en el nombre, sin mezclar «mates» con
  «10/diez» (choca con la marca PROFESOR 10 DE MATES), sin marcas conocidas
  dentro (Smartick, Kumon, Pitagorín, Duolingo…), sin dobles sentidos feos,
  y que un niño de 7 años lo pueda decir y escribir.
- Explica cada nombre en la línea `por qué` en una frase corta y concreta,
  en español; es lo que ve el usuario al tocarlo.

## Qué NO hacer

- No consultes TMview ni la OEPM en bucle: bloquean la IP. Las marcas
  registradas se miran a mano cuando el usuario elija finalistas.
- No cambies el estado de nada que el usuario haya decidido.
- No despliegues ni toques `main` desde la rutina.
