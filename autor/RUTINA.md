# Rutina «Nombre Autor» (cada hora)

Objetivo: que Paco nunca se quede sin nombres que revisar en
<https://pacosql.github.io/Train/autor/> y que cada tanda aprenda de lo que
marca. Todo desde la raíz del repo `Train`.

## Qué busca Paco

- Nombre para una **app de vocabulario y ortografía**, sacado de **autores**
  (Nebrija, Quevedo, Góngora, Cervantes…), **variantes de sus nombres**
  (Lebrija, Villegas, Argote, Saavedra…) y **sus personajes, lugares y obras**
  (Dulcinea, Sancho, Macondo, Juan de Mairena…).
- **Presentación** (regla de Paco): si `base.com` está libre, tal cual
  («Quevedo»); si no, «Proyecto Quevedo»; si tampoco, «Estudio Quevedo». Si
  los tres están ocupados, no entra. Lo hace `tools/cargar.py`.
- En la ficha lo que más le importa es la **relación con la ortografía**:
  que el autor escribiera sobre ortografía o que en sus libros se hable de
  ortografía, de aprender a leer y escribir o del vocabulario. Nivel 0-3
  (✍️). Los de nivel 3 salen primero.
- Misma estructura que Nombre Empresa: ⭐ / 👍 / 💚 (me gusta, descartado) /
  👎 / 🙅, comentarios por nombre y generales.

## Pasos

1. **Cerrojo**: `pgrep -f "[c]argar.py"`. Si hay una carga en marcha, termina.
2. `python3 autor/tools/contexto.py --atender` y léelo entero:
   - **Comentarios generales «●»** = órdenes directas, prioridad máxima.
   - **⭐/👍/💚** suben el peso de ese estilo (mismo autor, misma obra, mismo
     tipo, mismo nivel); **👎** lo baja un poco; **🙅** lo baja mucho.
     Mira las tablas «Por tipo», «Por autor / obra», «Por nivel» y «Por forma».
   - **🔍 Pedidos del buscador**: escríbeles su línea en la tanda (misma
     base); `cargar.py` les completa la ficha y el dominio.
3. ¿Hace falta tanda? **Sí si quedan < 200 pendientes** (contexto.py lo dice),
   o hay comentarios / pedidos nuevos. Si no, `python3 autor/tools/log.py
   --modelo <modelo> "sin tanda: N pendientes"` y termina.
4. **Generar** `autor/tools/tandas/tandaN.txt` (N = tanda máxima + 1) con
   Write, con el formato de `tanda1.txt`:
   `Base|tipo|de quién / obra|época|nivel 0-3|ficha|relación con la ortografía`.
   - ~150 líneas nuevas (unas 9 de cada 10 entran como «Proyecto …»).
   - **No repitas** ninguna base de «Bases ya probadas».
   - Datos **verídicos**: si no estás seguro de un dato, no lo pongas; en
     «relación con la ortografía» escribe «Ninguna directa conocida» antes
     que inventar. Nivel 3 solo si de verdad escribió sobre ortografía o la
     ortografía / aprender a escribir es parte de la historia.
   - Por dónde seguir: más gramáticos, ortógrafos, lexicógrafos y maestros
     de escribir (siglos XV-XX, España y América); personajes que aprenden a
     leer o escriben cartas; variantes y apodos de los autores que gusten;
     personajes secundarios de las obras que gusten; palabras inventadas por
     autores (nivola, cronopio, esperpento…). Tildes bien puestas en la base.
5. `python3 autor/tools/cargar.py autor/tools/tandas/tandaN.txt --tanda N`
6. `python3 autor/tools/comprobar_com.py` (como mínimo una vez al día).
7. `python3 autor/tools/log.py --modelo <modelo> "<resumen de una línea>"`,
   haz commit de la tanda en tu rama y súbela; **no** toques `main`
   (los datos viven en Supabase, no hace falta desplegar).

## Lo que ya sabemos de Paco (actualiza esta lista)

- (15/10) Le gusta la estructura de Nombre Empresa. Ejemplos que dio:
  Góngora, Quevedo, Cervantes, Nebrija, Dulcinea. En Nombre Empresa ya le
  gustaron QuevedoStudios y GaudiStudios (figura con nombre propio).
- Le encantaría que tuviera que ver con la ortografía.
- (15/10, 05:50) 👎 a los 267 de la tanda 1 en dos minutos, sin ningún 👍 ni
  comentario: autores españoles, variantes y personajes (sobre todo como
  «Proyecto …») no le convencen tal cual. Tanda 2 (103 cargados) explora otras
  vías: creadores de alfabetos (Cadmo, Sequoyah, Sejong, Braille), gramáticos
  clásicos hispanos (Quintiliano, Isidoro, Casiodoro), impresores (Manucio,
  Ibarra), lexicógrafos (Webster, Larousse), pedagogos (Comenio, Montessori)
  y autores/personajes universales con letras (Rodari, Perec, Pinocho, Matilda).
  Si esta tanda tampoco gusta, prueba otra forma de presentar («Taller …»,
  «… Lab», el nombre solo aunque el .com esté ocupado) y pregúntale con un
  comentario en el log.

## Qué NO hacer

- No cambies el estado de nada que Paco haya decidido.
- No despliegues ni toques `main` desde la rutina.
