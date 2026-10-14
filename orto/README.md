# ✍️ Orto — ortografía con OrtoScore

PWA para adultos (sirve para cualquiera) que mide y mejora la ortografía en
español. Un solo tipo de usuario: tú. Sin padres ni profesores.

- **URL:** https://pacosql.github.io/Train/orto/
- **Prefijo Supabase:** `orto_` · **caché:** `orto-*`

## Qué hace

1. **Perfil**: eliges tu nombre o creas uno (la edad es opcional; sirve
   para decir si tu nivel es el esperable).
2. **Prueba de nivel** (~40 preguntas, adaptativa): por cada bloque
   (acentuación, b/v, h, g/j, ll/y, otras letras, mayúsculas,
   puntuación, juntas/separadas, homófonos y errores de adultos) hace una
   búsqueda binaria sobre sus competencias ordenadas de fácil a difícil.
3. **OrtoScore 0-100**, con su traducción a algo tangible: *«en un texto
   de periódico de 100 palabras harías unas 1,4 faltas»*, y el **curso
   equivalente** (*«≈ 2º ESO»*). Con edad: *«con 45 años lo esperable es
   91: te faltan 11 puntos»*.
4. **Competencias** (86, en 11 bloques) con **estrellas** de 0 a 5,
   curso en que se enseñan, lección (regla, ejemplos, excepciones y truco)
   y botón para practicar solo esa.
5. **Práctica adaptativa** (15 ejercicios): elige la competencia que más
   sube tu OrtoScore entre las que tienen los prerrequisitos a medias,
   enseña la lección la primera vez, ajusta la dificultad (termostato
   70-90 % de aciertos), explica cada fallo **con la regla aplicada a esa
   palabra** («ca-MIÓN: aguda terminada en n → con tilde») y, si fallas dos
   seguidas, **baja al prerrequisito** («Antes de seguir con las agudas en
   n/s, vamos a asegurar *agudas, llanas y esdrújulas*») y luego vuelve.
   Termina siempre en acierto.
6. **Juegos** (inspirados en los 🏁 de Math Games):
   - 📰 **Corrector de periódico**: texto real de ~100 palabras con tantas
     faltas como harías tú, sacadas de tus competencias flojas.
   - 🚦 **Semáforo** 60 s: ¿bien o mal escrita?
   - 🎧 **Dictado** de 10 palabras (voz del navegador).
   - 🃏 **Parejas** de homófonos con su significado.
7. **Palabras difíciles**: las que fallas tú, las que más fallan todos
   (vista `orto_palabras_dificiles`) y las «traicioneras» a priori.
8. **La escala**: qué OrtoScore corresponde a cada curso.

### Mecánicas de ejercicio

| Mecánica | Qué es | Dónde |
|---|---|---|
| `tilde` | La palabra sin tildes: toca la vocal que la lleva o «No lleva tilde» | acentuación |
| `elige` | ¿Cómo se escribe? 2-4 variantes con errores típicos | todo |
| `letra` | Falta la letra: b/v, h/—, g/j, ll/y, c/cc/s… | letras |
| `hueco` | Frase con hueco (porque/por qué, tú/tu, terminó/término…) | homófonos, diacríticas |
| `frase` | ¿Cuál está bien escrita? (comas, mayúsculas) | puntuación |
| `caza` | Toca la palabra mal escrita en una frase (real de prensa) | todo |
| `dictado` | Oye la palabra (y la frase) y escríbela; marca en rojo lo que falló | palabras |
| `silabas`, `tonica`, `clasifica`, `diptongo` | Base de la acentuación, generadas al momento por el motor | ACE.SILABAS… |
| `parejas` | Une homófono con significado | homófonos |

## Cómo está hecho

```
orto/
  index.html, manifest.json, sw.js, config.js, css/, icons/
  js/silabas.js    motor de sílabas y tildes (RAE 2010), sin DOM
  js/modelo.js     BKT, OrtoScore, escala, prueba de nivel, tutor
  js/banco.js      carga del banco, selección y explicaciones
  js/mecanicas.js  las 12 mecánicas
  js/app.js        pantallas
  js/db.js         Supabase por REST (sin librerías), escrituras en cola
  datos/competencias.json   taxonomía + lecciones (fuente: tools/competencias.py)
  datos/palabras.json       ~6 900 ejercicios de palabras (tools/generar.mjs)
  datos/frases.json         frases de prensa para «caza» y el corrector
  datos/pesos.json          apariciones de cada regla por 100 palabras de prensa
  datos/manual/*.json       ~1 300 ejercicios en contexto redactados a mano
  supabase/001_esquema.sql
  tools/                    generar, validar, tests, e2e
```

### El banco (8 197 ejercicios validados)

- **Palabras de prensa real.** `tools/corpus.py` baja el corpus Leipzig
  *spa_news_2023_100K* y se queda con los medios de España (30 346 frases,
  661 543 palabras). `tools/generar.mjs` clasifica cada palabra en la
  competencia cuya regla la explica (p. ej. *estaba* → b en -aba; *gobierno*
  → b/v sin regla; *exámenes*… ) y crea el distractor cambiando **solo** esa
  letra o tilde. El distractor **no puede existir** en el diccionario
  (Hunspell es_ES, paquete `dictionary-es`): si existe (*tuvo/tubo*,
  *término/terminó*) es un homófono y se trabaja en frase.
- **Pares mínimos de tilde en frases reales** (*publicó/público*,
  *esta/está*): frase de prensa con hueco y las formas que existen.
- **A mano** (`datos/manual/`): diacríticas, interrogativos, aún/aun,
  solo, plurales, compuestas, mayúsculas, puntuación, juntas/separadas,
  homófonos, parónimos y las ~125 palabras que más fallan los adultos
  (*prever*, *idiosincrasia*, *cónyuge*, *exorbitante*…), cada una con su
  explicación.
- `node orto/tools/validar.mjs` comprueba todo: esquema, respuesta que
  existe, distractores que no, hueco único, falta única en «caza»,
  coherencia del motor y que cada competencia tenga ejercicios.

### OrtoScore

```
faltas/100 palabras = K · Σ_c occ_c · r_c · (1 − p_c)
OrtoScore           = 100 · e^(−faltas/6)        (K = 1,5)
```

- `occ_c`: apariciones de la competencia por cada 100 palabras de prensa
  española (contadas en el corpus; estimadas en las de contexto).
- `r_c`: probabilidad de falta por aparición de quien no la domina.
- `p_c`: dominio (Bayesian Knowledge Tracing: p(T)=0,12, p(S)=0,08 y p(G)
  según la mecánica: 1/opciones al elegir, 0,03 en el dictado).
- 0 faltas → 100 · 1 → 85 · 3 → 61 · 6 → 37.
- **Escala por cursos**: perfil típico al acabar cada curso (lo de cursos
  anteriores al 92 %, lo de su curso al 65 %, lo posterior lo que se
  aprende leyendo). Sale: 1º P 23 · 2º P 28 · 3º P 34 · 4º P 43 · 5º P 52 ·
  6º P 63 · 1º ESO 73 · 2º ESO 79 · 3º ESO 84 · 4º ESO 86 · adulto 91 ·
  corrector profesional 97.
- **Estrellas**: <15 % → 0 · <35 % → 1 · <55 % → 2 · <72 % → 3 · <88 % → 4 · 5.

### Cursos (de dónde sale el curso de cada competencia)

Reconstruido con índices reales abiertos (no hay un documento oficial que
reparta la ortografía curso a curso; el currículo LOMLOE solo dice
«aplicación de las normas ortográficas»):

- Edelvives, *Cuadernos de ortografía*, tabla de contenidos del cuaderno 1.
- Junta de Castilla y León (CROL), cuadernos de ortografía de 1º, 2º y 6º.
- Santillana, *Saber Hacer*, planes de mejora de Lengua de 1º a 6º.
- CEIP Azorín (Comunidad Valenciana), contenidos de 2º, 3º y 6º.
- IES Cabañas (Aragón), programación 2º y 4º ESO; IES Guadalpeña, cuadernillo
  de ortografía de 3º ESO; IES Severo Ochoa, programación LOMLOE 1º y 4º ESO.
- RAE, *Ortografía de la lengua española* (2010), novedades: guion, truhan,
  solo y demostrativos sin tilde, «o» entre cifras.
- Cuadernos Rubio: la colección *Ortografía* (2019, 6 cuadernos de 6 a 11
  años) no publica índice; se asume la secuencia habitual.

Resumen: 1º-2º correspondencia sonido-grafía (c/qu, g/gu/gü, z/c, r/rr,
mp/mb, br/bl), mayúsculas, ¿? ¡!, coma en enumeraciones, -d/-z; 3º-4º
h, b/v y g/j por reglas, clasificar por el acento y tilde general, dos
puntos y punto y coma; 5º-6º diptongo e hiato, diacrítica,
interrogativos, cc, x, ll/y; ESO: repaso en espiral, homófonos,
porque/sino/haber, juntas/separadas, parónimos.

### Decisiones tomadas sin preguntar

- **Una sola app, un solo rol** (como pediste), con varios perfiles
  posibles en el mismo dispositivo (Paco ya está creado).
- **Norma**: RAE 2010. *Solo* y demostrativos sin tilde se enseñan como
  recomendación (la RAE admite la tilde en *solo* si hay ambigüedad real);
  formas como *sólo* o *guión* cuentan como fallo solo en los ejercicios
  que lo dicen así.
- **Grafías dobles válidas** (*enseguida/en seguida*, *hierba/yerba*,
  *adónde/a dónde*) nunca compiten entre sí como opciones.
- **Prensa con fallos**: algunas frases del corpus vienen cortadas o con
  alguna errata de origen; se filtran por longitud, signos y vocabulario,
  pero puede colarse alguna.
- **Sin autenticación** (como el resto del hosting): cualquiera con la URL
  puede ver los perfiles.
- **Modo debug** (`?debug`): deja la solución en el DOM para el e2e.

## Regenerar y probar

```bash
python3 orto/tools/competencias.py                 # taxonomía y lecciones
python3 orto/tools/corpus.py /tmp/orto-corpus      # baja el corpus (CC BY)
(cd orto && npm install)                           # diccionario es_ES
node orto/tools/generar.mjs /tmp/orto-corpus       # palabras, frases, pesos, pares mínimos
node orto/tools/validar.mjs                        # validación en cascada
node orto/tools/test_silabas.mjs                   # motor de sílabas y tildes
python3 orto/tools/db.py -f orto/supabase/001_esquema.sql   # tablas (necesita SUPABASE_ACCESS_TOKEN)
python3 -m http.server 8765 &                      # desde la raíz del repo
ACIERTO=0.9 node orto/tools/e2e.mjs http://localhost:8765/orto/   # Playwright
```

Atribución: frases y frecuencias del corpus *spa_news_2023_100K* de la
[Leipzig Corpora Collection](https://wortschatz.uni-leipzig.de/en/download/Spanish)
(CC BY 4.0). Diccionario: Hunspell es_ES (LibreOffice / RLA-ES, vía
`dictionary-es`, solo para validar al generar).
