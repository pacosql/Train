# Rutina «Nombre Ortografía» (cada 15 minutos)

Objetivo: buscar la marca de la app de ejercicios de ortografía para EBAU y
oposiciones, aprendiendo de lo que Paco marca en
<https://pacosql.github.io/Train/nombreortografia/>. Todo desde la raíz del
repo `Train`.

**Ritmo:** se empezó con 50 (12/10). Paco revisa rápido y la cola se le
quedó vacía, así que ahora cada tanda carga hasta **70** (`--max 70`) y se
rellena siempre que queden < 40 pendientes buenos.

## Pasos

1. **Cerrojo**: `pgrep -af "[c]ribar.py"` **en un comando aparte** (si va en
   el mismo comando que lanza cribar.py, se encuentra a sí mismo). Si hay una
   criba en marcha, no arranques otra: termina.
2. `python3 nombreortografia/tools/contexto.py --atender` y léelo entero:
   - **Comentarios generales «●»** (sin atender) = órdenes directas, la
     prioridad máxima. Cada uno cambia el gusto de la tanda siguiente.
   - **Pesos, no vetos** (igual que en Nombre Empresa). Cada estilo
     (familia, tipo de palabra) tiene un peso que decide cuántos candidatos
     de ese estilo entran en la tanda:
     - **👍 / ⭐** suben el peso: genera parecidos, no copias. ⭐ cuenta doble.
     - **👎** baja el peso un poco; **🙅 Nada de esto** lo baja mucho.
       Acumulan; un 👍 posterior lo vuelve a subir. Generaliza el estilo.
   - **🏛️ Otras marcas** marcadas 👍/👎: inspiración (tipo de nombre,
     sonido, longitud). Para añadir más: `tools/marcas.py`.
3. ¿Hace falta tanda? **Sí siempre que queden < 40 pendientes buenos**,
   haya o no feedback nuevo (regla de Paco 12/10: «está vacío, asegúrate de
   que la rutina ejecuta»; revisa 50 en minutos). Si no, registra con
   `log.py` y termina.
4. **Genera** `nombreortografia/tools/out/candidatos.txt` (con Write) con
   líneas `Nombre|por qué|c f m s d b` bajo cabeceras `# familia: …`. Las
   seis notas 0-10 son tu opinión honesta: corto, fácil (se escribe como
   suena en español), memorable, sugiere (cero faltas / escribir bien /
   aprobar la EBAU o la oposición), distintivo, búsqueda. ~150 candidatos
   para que pasen ~50: muchos caen por .com ocupado. Sin ñ ni tildes en el
   nombre (no caben en el .com). Las familias que funcionan primero; prueba
   2-3 nuevas.
5. `python3 nombreortografia/tools/cribar.py nombreortografia/tools/out/candidatos.txt --tanda <N> --max 70 --modelo <tu modelo>`
   (N = tanda máxima + 1, la imprime contexto.py).
6. `python3 nombreortografia/tools/notas.py nombreortografia/tools/out/candidatos.txt`:
   ranking (6 medidas, score y cola ordenada por score).
7. Actualiza «Lo que ya sabemos de Paco», commit y push a la rama. Resumen
   de una línea. No hace falta desplegar.

## Lo que ya sabemos de Paco (actualiza esta lista)

- La app: ejercicios de ortografía para alumnos de **EBAU** y
  **opositores**, para que no tengan faltas en el examen. Público joven y
  adulto: nada infantil.
- Él mismo dudó de «ortografía» a secas («bastante vacío»; ortografia.com y
  .es cogidos) y propuso ideas tipo **«faltas de ortografía»**, **«no más
  faltas»**: le atrae el ángulo de **quitar las faltas**, no solo la palabra
  «ortografía».
- Tanda 1 (12/10): 50 nombres repartidos entre muchas familias para ver qué
  le gusta: cero faltas, sin faltas, tilde, palabra con ortografía dentro,
  examen/aprobar, fusiones inventadas, metáforas (lápiz rojo, corrector),
  inglés corto.
- Tanda 1 revisada entera en minutos (12/10): 25 👍, 1 🙅 (Ortografiko),
  sin ⭐. Suben: **Orto + palabra** (OrtoTest, OrtoReto, OrtoDiaria,
  OrtoRacha, Ortografix), **retos/rachas/duelos diarios** (DueloDeTildes,
  RetoTilde, TildeDiaria, FaltaDiaria), **corrector** (SinTachones,
  PapelLimpio), **examen** (EbauSinFaltas, OpoTilde, OpoOrto, NotaLimpia).
  «Sin faltas» va a medias (NoMasFaltas, NiUnaFalta, FaltasFuera,
  Antifaltas 👍; muchos otros 👎). Bajan: letras que dudan (BeVeHache,
  GeOJota 👎), fusiones inventadas (🙅 Ortografiko), inglés, palabras con
  historia, RAE.
- **Comentario ● (12/10): «quiero ver la palabra ortografía continuamente»**,
  y que pruebe sinónimos y escritores relacionados con la ortografía. →
  Tanda 2: 50 «Ortografía + palabra» (reto, racha, duelo, liga, EBAU, opos,
  aprobada, sin faltas, entreno…) + 12 sinónimos/escritores (RectaEscritura
  —el significado literal de orto-grafía—, BuenaGrafia, Nebrija…).
  «Ortografía + Test/Fit/Gym/Pro/Plus/Fix» chocan con apps que ya existen.
  Pendientes de probar en la tanda 3 si sigue el gusto: Orto + palabra
  (OrtoDuelo, OrtoLiga, OrtoSprint…), corrector (FolioLimpio, CeroTachones,
  NiUnTachon), CazaFaltas, Ortografista, Mateo Alemán / Correas / Bello.

- **Petición (12/10, chat): «busca en la Academia, en los autores, bromas o
  chistes de ortografía; ¿habla el Quijote de ortografía?; sinónimos;
  esfuérzate al máximo»**. Tanda 3 (70 cargados, delante de la cola), con
  fuentes verificadas:
  - Quijote (texto de Gutenberg): no dice «ortografía», pero sí II-62 en la
    imprenta («corregir en otra, componer en ésta, enmendar en aquélla»),
    I-25 «de buena letra», II-19 «la discreción es la gramática del buen
    lenguaje», Sancho que no sabe escribir, la carta a Dulcinea.
  - RAE: lema «Limpia, fija y da esplendor» y el crisol del emblema.
  - Nebrija «Reglas de orthographía» (1517); Gabo «Jubilemos la ortografía,
    terror del ser humano desde la cuna» (1997); Juan Ramón y su jota
    «hijiénica» («intelijencia»).
  - Chistes: hay/ahí/ay, haber/a ver, hecho/echo, vaca/baca; los
    «vengadores» de Acción Ortográfica que corrigen grafitis.
  - Ocupados: orthographia.com, olakase, hoygan, botellaalmar. Vetados:
    OrtografiaCervantes, DesocupadoLector, HolaQueHaces (canales/marcas).
  - Si gustan, seguir con más chistes de homófonos y más citas literarias.

- **Tanda 3 revisada (12/10): 👎 a TODO** lo «cultural»: Quijote (0/15),
  chistes y homófonos (0/12), vengadores (0/10), sinónimos (0/10), RAE y
  crisol, escritores, Nebrija, «faltas de ortografía» entero, ortografía
  repetida. → Peso casi a cero: no más citas, chistes ni frases largas.
- Lo que SÍ gusta (tanda 2, 18 👍): **«Ortografía» + UNA palabra corta,
  sencilla y positiva**: Diez, DiezEnOrtografia, Sobresaliente, Aprobada,
  Ok, Bien, Top, Max, Rápida, CeroFaltas, Entreno, Gimnasio, Práctica,
  Diaria, Duelo, Copa, Ebau, Opos. 👎 a Reto, Racha, Liga, Al día, Quiz,
  Opositor, Selectividad, SinTachones, Perfecta, Impecable…
- Tanda 4 (12/10): 50 de «Ortografía + palabra corta» (nota: Nueve,
  Matrícula, Apto, Plaza, Medalla; adjetivo: Genial, Segura, Veloz, Turbo;
  entrenar: Rutina, Repaso, Sprint, Aula; juego: Torneo, Ronda, Récord).
  Se quedaron sin cargar por el tope (siguiente tanda si sigue el gusto):
  Orto + palabra (OrtoDiez, OrtoCopa, OrtoApto…) y Tilde + palabra.

- Tanda 4 revisada (12/10): 15 👍 de 50. **Nota máxima** arrasa: Diez
  (DiezDeOrtografia, OrtografiaDeDiez), Cien (OrtografiaCien,
  CienOrtografia), MatriculaOrtografia, OrtografiaSobresaliente, Apto/Apta.
  Adjetivos simples: Clara, Sencilla, Super, Prime, Mejor. Entrenar:
  OrtografiaGimnasio, OrtografiaForma. 👎 a lo competitivo (Medalla, Oro,
  Podio, Campeón, Ganadora, Victoria), a la velocidad (Veloz, Turbo,
  Exprés), a Notable/Nueve (no es la máxima) y a Genial/Guay/Crack/Vip.
- Tanda 5 (12/10): **Ortografia10** (gemela de Mates10; .com libre, puesto
  el primero de la cola junto a Lengua10 y Tildes10), Ortografia100, más
  nota máxima (CienPorCien, Pleno, Matrícula de Honor), adjetivos simples
  (Simple, Exacta, Precisa, Lista), palabra + Ortografía y Orto + palabra.
  orto10.com ocupado.

- Tanda 5 revisada (12/10): **primera ⭐: Ortografia100**. La familia
  **ortografía + número** va 4 de 4 (⭐ Ortografia100, 👍 Ortografia10,
  Tildes10, Lengua10). También 👍 OrtoDiez, OrtoCien, OrtoApto,
  OrtografiaPleno, OrtografiaSimple, OrtografiaPura. Es la línea buena:
  número (10/100) como en Mates10 → marca de familia.
- Tanda 6 (12/10): 45 de números (Ortografia365, 1000, 101, 360, 30;
  Lengua100, Tildes100, Acentos10/100, Gramatica10/100, Escritura10/100,
  Redaccion10/100, Dictado10/100, Opos10/100, Ebau10/100, Faltas0; Orto100,
  Orto365, OrtoMil, OrtoPleno) y adjetivos simples (Llana, Neta, Limpia).
  Ortografia + una cifra (0, 1, 5, 7) queda vetado por la app «Ortografía».

- Tanda 6 revisada (12/10): ⭐ **Ortografia365**, 👍 Ortografia360 y
  Ortografia101; 👎 a todo lo demás (otras materias: Gramatica, Acentos,
  Redaccion, Dictado, Escritura, Opos/Ebau + número; números sin sentido:
  1000, 99, 24, 30; Orto + número; adjetivos). Además ha subido a ⭐
  Ortografia10, Lengua10 y OrtografiaDiez.
- **Finalistas (5 ⭐): Ortografia10, Ortografia100, OrtografiaDiez,
  Lengua10, Ortografia365.** Converge: «Ortografía»/«Lengua» + número con
  significado. Tandas cortas y afinadas a partir de aquí (tanda 7: 27).
  Con los finalistas, a mano: OEPM/EUIPO y el .es.

- Tanda 7 (27, números con significado): 👎 a todo. Los números están
  agotados: los 5 ⭐ ya son los buenos. Tanda 8 (61): Lengua + palabra que
  gusta (LenguaTop, LenguaApto, LenguaPleno…), Tildes + palabra (TildesDiez,
  TildesApto…) y Ortografía + palabras nuevas (Llana, Sobresale, Logro, Faro…).

- Tanda 8 (61): 👎 a todo en minutos (Lengua/Tildes + palabra, Ortografía +
  palabras nuevas). Van **dos tandas seguidas a 0 👍 (88 nombres)**: lo de
  alrededor de los 5 ⭐ está agotado. Tanda 9 (46) prueba direcciones
  nuevas: «X de ortografía» (HoraDeOrtografia), Tu/Mi + Ortografía10,
  Ortografía + verbo (Clava, Suma, Acierta), + emoción (Zen, SinMiedo), +
  tiempo (Junio, Anual) y número-palabra (Decena, Nota10). Si esta también
  va a 0, proponer a Paco cerrar entre los 5 ⭐ (OEPM, .es, redes).

- Tanda 9 (46): solo 👍 **Orthografia10** y **Ortografia10App**: las dos,
  variantes de la ⭐ Ortografia10. Todo lo demás 👎 (X de ortografía, Tu/Mi,
  verbos, emociones, tiempo, Spelling10). Conclusión: **la marca es
  Ortografia10** (y sus hermanas 100/365/Diez, Lengua10). Tanda 10 (26):
  sufijos de marca (App, Web, Lab, Club, Hub, Play, Go, Diario, Ya…) y
  Orthografia + número. Vetados: Ortografia10Online, Plus, Test.

- 13/10 madrugada: tanda 10 sin revisar (26 pendientes). Tanda 11 (15):
  hermanas de la marca + sufijo (Ortografia100Web, Ortografia365Diario,
  Lengua10Club, Lengua100…) para pasar de 40. Sin feedback nuevo no tiene
  sentido seguir apilando: a partir de aquí, si la cola tiene ≥ 40, nada.

## Programación

- Cron de sesión cada 15 min (CronCreate) + Routine horaria de respaldo que
  (`trig_018w5z4dN7KtnkE8NitZZnga`) que recrea el cron si la sesión se
  reinicia y ejecuta la rutina.

## Qué NO hacer

- No cambies el estado de nada que Paco haya decidido.
- No consultes TMview/OEPM en bucle.
- No despliegues ni toques `main` desde la rutina.
