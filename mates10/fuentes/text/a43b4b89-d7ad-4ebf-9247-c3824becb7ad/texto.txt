# Mates10 — Banco de contenidos, tutor y aplicaciones

Documento unificado · versión 1.1 · 30 sep 2026 · Autor: Paco (Francisco González) con Claude. Este documento reúne los ocho módulos del sistema. Es la referencia que Claude Code debe leer entera antes de trabajar.

---

## Módulo 00 — Índice y reglas generales

Este primer capítulo es la versión compacta; los siguientes son la extendida.

### Qué estamos construyendo

Un sistema que, para cada niño de 1º de primaria a 2º de bachillerato, sabe qué ha dado en clase, qué domina, cómo se le enseña y qué ejercicio ponerle ahora para que aprenda y quiera volver; y que se lo demuestra al padre cada semana. Empieza en España y está preparado para otros países.

### Las piezas, en una frase cada una

- **Habilidad**: una cosa concreta que el niño sabe o no ("multiplicar por 7"). La unidad de todo. Tiene código fijo, definición, errores típicos, prerrequisitos, importancia, carga, y una familia para la enseñanza concéntrica.
- **Mapa**: para cada sistema educativo, curso, trimestre, mes y orden, qué habilidades ya se han dado. Es la frontera. Legal (decreto) y afinada por colegio y editorial.
- **Ejercicio**: una pregunta de una habilidad, con respuesta, distractores ligados a errores, y explicaciones por método. Sale de una plantilla; no se publica sin revisión humana.
- **Método**: cómo se enseña cada habilidad (tradicional, ABN, Singapur, completar a diez). El colegio declara el suyo y la app explica con ese.
- **Técnica de práctica**: qué ejercicio viene después según lo que acaba de pasar (conmutativa, vecinos, mismo error, bajar al prerrequisito, espaciar, intercalar).
- **Mecánica**: el juego con el que se juega el ejercicio (opciones, globos, teclado, reparto, balanza). Genéricas o específicas. Ejercicio y mecánica solo comparten el formato.
- **Tutor**: el que decide. Lee suelo (qué domina), techo (mapa) y calendario (repaso), y elige en cascada habilidad, técnica, ejercicio, mecánica y explicación. Mide cada intento. Funciona sin ningún dato del alumno: infiere nivel, curso y edad de la prueba de nivel, y mejora con cada dato que el padre dé.
- **Enganche**: el conocimiento sobre qué hace que el niño vuelva, con límites porque son niños, y medido siempre junto al aprendizaje.
- **Fuente**: el documento real que justifica cada fila, archivado tal cual.

### Los módulos

| nº | módulo | contiene | fuentes principales | estado |
|---|---|---|---|---|
| 01 | Contenido | habilidades, bloques, prerrequisitos, errores típicos, sistemas, cursos, colegios, mapa, reglas de frontera | decretos, libros, Kumon, Rubio, programaciones, competencia | modelo cerrado; datos: solo el caso de uso de 1º ESO |
| 02 | Ejercicios | plantillas, ejercicios, explicaciones, validación, revisión humana, no reproducción | módulo 01, ejercicios modelo | modelo cerrado; sin datos |
| 03 | Mecánicas | especificación de los juegos, afinidad por habilidad | apps de referencia, material de aula, catálogo de mayo | modelo cerrado; inventario pendiente |
| 04 | Didáctica | métodos de enseñanza y técnicas de práctica; ciencia del aprendizaje | manuales de didáctica, ABN, Singapur, Anki, Duolingo | modelo cerrado; 10 técnicas iniciales; métodos por rellenar |
| 05 | Tutor | localización e inferencia, prueba de nivel, estado del alumno, cascada, medición, mejora | módulos 01, 04, 06; literatura de tutores inteligentes | contrato definido; algoritmo por construir |
| 06 | Enganche | principios, base de conocimiento de mecanismos, tablas, métricas conjuntas | Duolingo, juegos infantiles, autodeterminación, normativa de menores | primera versión de la base de conocimiento |
| 07 | Fuentes | archivo, trazabilidad, proceso de captura | todos | modelo cerrado; 22 fotos de Edelvives por archivar |

Cómo se conectan: 07 recibe todo; 01 alimenta a 02, 04 y 05; 04 alimenta a 02 (explicaciones) y a 05 (técnicas); 03 alimenta a 05; 06 alimenta a 05; 05 produce los intentos que hacen mejorar a 01, 02, 03, 04 y 06.

### Reglas que no se negocian

1. Ningún ejercicio se muestra si alguna de sus habilidades no está permitida por el mapa.
2. Habilidad recién introducida: dificultad baja y sin cronómetro.
3. Ningún ejercicio copia material de terceros; solo los "comunes" (7 + 5). El validador lo comprueba contra el archivo.
4. Nada se publica sin validación automática y revisor humano (directo o heredado de la plantilla).
5. Nada entra en ningún módulo sin fuente archivada.
6. Toda explicación va seguida de un intento nuevo; se explica con el método del colegio; si el error se repite, se cambia de método.
7. Enganche solo al servicio del aprendizaje; sin patrones oscuros con menores; el padre puede ver y entender cualquier mecanismo.
8. La sesión es corta y termina en acierto. El objetivo es que vuelva mañana.

### Siguientes pasos

1. Montar el repo con este paquete, `casos-de-uso-edelvives-1eso.md` y las 22 fotos como primera fuente.
2. Lanzar el prompt de arranque y responder a lo que pida.
3. Módulo 01: taxonomía de 1º de primaria desde el decreto de Murcia; comprar libros de 1º de segunda mano.
4. Módulo 02: 50 ejercicios de OPER.JERARQ.02, medir aceptación del validador.
5. Módulo 03: inventario de mecánicas; 8–10 finalistas al proyecto de diseño.
6. Módulo 04: métodos de la familia "suma" (tradicional y ABN) revisados por un maestro.
7. Módulo 05: prototipo del tutor sobre una sola familia de habilidades con la prueba de nivel.
8. Módulo 06: decidir los mecanismos de la primera versión con Paco.

### Glosario

- **Base de datos**: el almacén donde vive todo. Usamos PostgreSQL a través de Supabase.
- **Esquema**: el plano de la base de datos: qué tablas hay, qué columnas tiene cada una y cómo se relacionan.
- **Tabla**: una lista de cosas del mismo tipo (habilidades, ejercicios, colegios). Como una hoja de Excel.
- **Fila**: una cosa concreta dentro de la tabla (una habilidad, un ejercicio).
- **Columna**: un dato de esa cosa (código, nombre, definición).
- **Clave primaria (PK)**: la columna que identifica una fila sin ambigüedad. Normalmente un `id`.
- **Clave foránea (FK)**: una columna que apunta a la clave primaria de otra tabla. Es lo que crea las relaciones. `ejercicio.habilidad_id` apunta a `habilidad.id`.
- **Relación 1:N** ("uno a muchos"): una habilidad tiene muchos ejercicios; cada ejercicio tiene una sola habilidad principal.
- **Relación N:M** ("muchos a muchos"): una habilidad tiene varios prerrequisitos, y cada habilidad es prerrequisito de varias. Se resuelve con una **tabla de unión** que solo tiene dos FK.
- **Enum**: una columna que solo admite valores de una lista cerrada (`trimestre` solo puede ser 1, 2 o 3).
- **JSONB**: una columna que guarda un objeto flexible (por ejemplo, los parámetros de una habilidad: `{"cifras": 2, "llevada": false}`). Útil cuando la estructura varía de una fila a otra.
- **Índice**: una ayuda para buscar rápido por una columna. No cambia los datos.
- **Vista**: una consulta guardada que se comporta como una tabla. Ejemplo: "habilidades permitidas para Madrid, 1º, T1".
- **Taxonomía**: la lista cerrada y codificada de habilidades. Es una tabla (`habilidad`), no un concepto abstracto.
- **Formato**: el contrato de datos de un ejercicio: qué campos tiene (solo respuesta, respuesta más distractores, lista ordenable…). No es cómo se ve en pantalla.
- **Mecánica**: la forma de jugar un ejercicio en pantalla o en papel (opciones, globos, teclado, hoja impresa). Una mecánica declara qué formatos puede jugar.
- **Fuente**: un documento real (foto, PDF, página web) archivado tal cual, al que apunta cada fila del banco para justificarla.
- **Afinidad**: cuánto conviene una mecánica para una habilidad concreta, de 1 a 5. Distinta de la compatibilidad, que es sí/no y depende solo del formato.
- **Técnica de práctica**: la regla que decide qué ejercicio viene después según lo que acaba de pasar (conmutativa, vecinos, familia de hechos, mismo error, bajar al prerrequisito, espaciar, intercalar). Distinta del método, que es cómo se explica.
- **Suelo, techo y calendario**: el suelo es el nivel del alumno (qué domina), el techo es el mapa (hasta dónde se puede preguntar), el calendario es el repaso espaciado (cuándo toca volver a cada cosa). El tutor decide dentro de ese marco.
- **Método**: la forma de enseñar una habilidad (completar a diez, algoritmo vertical, ABN, modelo de barras). Una habilidad tiene varios; un colegio suele seguir uno. Las explicaciones se escriben según un método.


---

## Módulo 01 — Contenido: habilidades, fronteras y mapa

### 1. Propósito

Saber qué se enseña (la taxonomía de habilidades con sus prerrequisitos y errores típicos) y cuándo (el mapa curricular por sistema educativo, curso, trimestre, mes y orden, afinado por colegio y editorial). Es el módulo del que dependen todos los demás.

### 2. Tablas

#### Banco 1 — Habilidades y fronteras

##### 5.1 habilidad

| columna | tipo | comentario |
|---|---|---|
| id | uuid PK | |
| codigo | text único | `NUM.SUMA.02`. Legible por humanos, estable para siempre, igual en todos los países |
| bloque_id | uuid FK → bloque | Ver 5.1b. Empieza con nueve bloques y puede cambiar según se aprenda |
| nombre | text | "Suma de dos sumandos de 1 cifra con llevada" |
| nombre_padres | text | Sin jerga: "sumas llevándose" |
| definicion | text | Qué se pide exactamente, sin ambigüedad. Aquí viven las fronteras |
| parametros | jsonb | `{"sumandos": 2, "cifras": 1, "llevada": true, "max_resultado": 18}` |
| ejemplo_frontera | text | El ejercicio más difícil que todavía entra en esta habilidad |
| ejemplo_fuera | text | Un ejercicio que parece de esta habilidad pero ya es de la siguiente |
| nivel_kumon | text nullable | Referencia cruzada: "2A", "A", etc. Se rellena cuando haya tabla de Kumon delante, no de memoria |
| importancia | smallint | 1–5. Cuánto pesa en el curso y en lo que viene después. Las tablas de multiplicar o la resolución de problemas son 5; un tipo de gráfico concreto puede ser 2. Decide cuánto tiempo de sesión merece |
| carga_alumno | smallint | 1–5. Cuánto cuesta al niño en atención y esfuerzo. Los problemas de enunciado son 5; una suma directa es 1. La sesión no encadena dos habilidades de carga 5 seguidas |
| familia | text nullable | Nombre de la familia de habilidades a la que pertenece, para la enseñanza concéntrica (ver debajo): "suma", "fracciones", "ecuaciones". Las habilidades de una familia se ordenan por `nivel_familia` |
| nivel_familia | smallint nullable | Posición dentro de la familia: SUMA.01 (1º primaria, una cifra) … SUMA.09 (5º primaria, decimales) |
| fuente_id | uuid FK → fuente | Fuente principal que justifica su existencia y definición |
| fuente_ref | text nullable | Página o sección concreta ("pág. 20, sección 7") |
| activo | boolean | Para retirar sin borrar |

Regla: si dos ejercicios exigen conocimientos distintos, son dos habilidades. Si un ejercicio pudiera tener dos habilidades principales, la taxonomía está mal definida (puede tener secundarias, ver 5.10).

Enseñanza concéntrica (en espiral). Las matemáticas escolares vuelven cada curso sobre lo mismo con más profundidad: fracciones en 3º, 4º, 5º, 6º y 1º ESO. El modelo lo soporta así: cada vuelta es una habilidad distinta con su propio código y su propia definición (FRAC.01 "fracción como parte de un todo con dibujo", FRAC.04 "fracciones equivalentes", FRAC.07 "operaciones con fracciones de distinto denominador"), unidas por `familia` y `nivel_familia`, y encadenadas con prerrequisitos. El mapa curricular de cada curso pone en `introduce` la habilidad nueva de la familia y en `repasa` las anteriores. Así un alumno de 5º que falla FRAC.07 puede bajar a FRAC.04 dentro de la misma familia sin salirse de lo permitido, y el informe al padre puede decir "en fracciones va por el nivel 4 de 9".

Los problemas de enunciado son una habilidad, no un formato. Van en el bloque `problemas`, con familia propia ("problemas de una operación", "problemas de dos operaciones", "problemas con datos sobrantes"…), `importancia` 5 y `carga_alumno` 5, y con la habilidad numérica que usan como prerrequisito. Es la habilidad más pesada para el alumno y la que más distingue a un niño que "sabe mates" de uno que "sabe calcular"; por eso se dosifica en la sesión y no se sustituye por cálculo.

##### 5.1b bloque (agrupación de habilidades, evolutiva)

Los bloques son una tabla y no un enum porque van a cambiar según se aprenda: al contrastar la taxonomía con los cuadernos Rubio y la tabla de Kumon puede que un bloque se parta o dos se junten. Cada bloque mantiene su correspondencia con el "sentido" de la LOMLOE para poder informar en términos legales si hace falta.

| columna | tipo | comentario |
|---|---|---|
| id | uuid PK | |
| codigo | text único | `NUM`, `OPER`, `MED`, `GEO`, `ALG`, `FUN`, `EST`, `ANA`, `PROB` |
| nombre | text | numeración, operaciones, medida, geometría, álgebra, funciones, estadística y probabilidad, análisis, problemas |
| nombre_padres | text | Sin jerga, para el informe |
| sentido_lomloe | enum | numerico, medida, espacial, algebraico, estocastico, transversal. A qué sentido de la ley corresponde |
| orden | smallint | Para el informe y la sesión |
| activo | boolean | Un bloque retirado no se borra: sus habilidades se reasignan y el bloque queda inactivo |

Decisión (30 sep): arrancar con los nueve. Validar la partición contra Rubio y Kumon durante la mina 1 y ajustar si hace falta; el prefijo del código de habilidad (`NUM.`, `OPER.`…) es el del bloque en el momento de crearla y no se cambia aunque el bloque se reorganice, para no romper códigos.

##### 5.2 habilidad_prerrequisito (tabla de unión, N:M)

| columna | tipo | comentario |
|---|---|---|
| habilidad_id | uuid FK → habilidad | La habilidad objetivo |
| prerrequisito_id | uuid FK → habilidad | Lo que hay que dominar antes |
| peso | enum | imprescindible, recomendable |
| fuente_id | uuid FK nullable → fuente | Si el prerrequisito sale de una fuente concreta (Kumon, decreto) y no solo de criterio |

Es un grafo dirigido sin ciclos. Sirve para el repaso dirigido ("la semana que viene dan SUMA.05; sus prerrequisitos son SUMA.03 y NUM.DESC.02; practica esos").

##### 5.3 error_tipico

| columna | tipo | comentario |
|---|---|---|
| id | uuid PK | |
| habilidad_id | uuid FK → habilidad | |
| codigo | text único | `NUM.SUMA.02.E01` |
| nombre | text | "Resta en vez de llevar" |
| descripcion | text | Cómo se manifiesta (27 + 5 = 22) |
| explicacion_nino | text | Lo que se le dice al niño cuando comete este error |
| indicacion_padres | text | Cómo reconocerlo en casa y qué decirle |
| fuente_id | uuid FK nullable → fuente | De qué libro, ejercicio o observación sale el error |
| fuente_ref | text nullable | |

##### 5.4 sistema_educativo

| columna | tipo | comentario |
|---|---|---|
| id | uuid PK | |
| codigo | text único | `ES-MD` (Madrid), `ES-MC` (Murcia), `MX` (México), `US-GA` (Georgia) |
| pais | text | ISO 3166: ES, MX, US |
| region | text nullable | Comunidad, estado, provincia. Null si el sistema es nacional |
| nombre | text | |
| idioma | text | es-ES, es-MX, en-US. Afecta a enunciados y nombres de curso |

##### 5.5 curso

| columna | tipo | comentario |
|---|---|---|
| id | uuid PK | |
| sistema_id | uuid FK → sistema_educativo | |
| codigo | text | `PRI1`, `G1`, `BAS1`. Único dentro del sistema |
| nombre_local | text | "1º de Primaria", "1st grade", "1° básico" |
| orden | smallint | Posición en el sistema, para comparar cursos |
| edad_tipica | smallint | Edad al empezar el curso |
| etapa | text | primaria, secundaria, bachillerato… nombre local |

Dos cursos de sistemas distintos con la misma `edad_tipica` no son equivalentes: la equivalencia real la da el mapa curricular (qué habilidades entran), no la edad.

##### 5.6 colegio

| columna | tipo | comentario |
|---|---|---|
| id | uuid PK | |
| sistema_id | uuid FK → sistema_educativo | |
| nombre | text | |
| municipio | text | |
| tipo | enum | publico, concertado, privado |
| editorial_mates | text nullable | Editorial del libro que usan, si se sabe |
| escuela_metodo | enum nullable | tradicional, abn, singapur, montessori. Con qué método enseñan; decide con qué método se explica a sus alumnos |

##### 5.8 mapa_curricular

Esta tabla ES la frontera. Cada fila dice: "en este contexto, en este momento, esta habilidad está en este estado".

| columna | tipo | comentario |
|---|---|---|
| id | uuid PK | |
| sistema_id | uuid FK → sistema_educativo | Obligatorio |
| colegio_id | uuid FK → colegio nullable | Si está relleno, esta fila afina la del sistema |
| curso_id | uuid FK → curso | |
| trimestre | smallint | 1, 2, 3 (o el número de periodos que tenga el sistema) |
| mes | smallint nullable | 1–12. Si es null, vale para todo el trimestre |
| orden | integer | Posición de la habilidad dentro del curso según la fuente (sección 1 antes que sección 7). Ordena dentro de un mismo mes y es lo que la foto del libro afina |
| habilidad_id | uuid FK → habilidad | |
| estado | enum | introduce, consolida, repasa |
| fuente_id | uuid FK → fuente | De dónde sale esta decisión |
| fuente_ref | text nullable | Página o sección concreta de la fuente |
| nota | text nullable | Por qué, si hay contradicción entre fuentes |

Semántica de `estado`:
- `introduce`: es la primera vez que la ve. Ejercicios de esa habilidad solo con dificultad baja y sin cronómetro.
- `consolida`: ya la vio, ahora la practica. Cualquier dificultad y cualquier mecánica.
- `repasa`: la vio en un curso anterior. Sirve para mantenimiento y para fluidez.

### 6. Reglas de frontera (cómo se decide qué puede ver un alumno)

Entrada: sistema educativo, curso, trimestre, mes actual, colegio (opcional).

1. Tomar las filas de `mapa_curricular` de ese sistema y curso cuyo (trimestre, mes, orden) sea anterior o igual a la posición actual. Sin foto ni dato del colegio, la posición actual es el mes en curso completo; con foto, es el `orden` que la foto fija.
2. Si hay filas con `colegio_id` = el colegio del alumno, sustituyen a las del sistema para la misma habilidad.
3. El conjunto resultante de `habilidad_id` es lo permitido.
4. Un ejercicio está permitido si TODAS sus habilidades (principal y secundarias, tabla `ejercicio_habilidad`) están en el conjunto permitido.
5. Habilidades en `introduce` este mes → solo `dificultad = 1` y mecánicas sin tiempo. En `consolida` o `repasa` → cualquier dificultad y cualquier mecánica.
6. Para "preparar la próxima lección": tomar las habilidades del mes siguiente en `introduce`, ir a `habilidad_prerrequisito` y practicar esos prerrequisitos (que ya están en el conjunto permitido por construcción).
7. La foto del libro no añade habilidades: sirve para fijar `mes` y `orden` con precisión (o para crear filas de colegio si el libro va adelantado/atrasado respecto al mapa del sistema).
8. Modo examen (indicado por el padre): se restringe al subconjunto de habilidades del tema del examen. Sigue siendo un subconjunto del permitido.

Estas reglas se implementan como una vista o función SQL, no en la app. Así la frontera vive en un solo sitio.

### 3. Fuentes que necesita este módulo

| fuente | para qué | cómo se consigue | estado |
|---|---|---|---|
| Real Decreto 157/2022 (primaria), 217/2022 (ESO), 243/2022 (bachillerato) | Saberes básicos por etapa: techo legal estatal | Descarga del BOE, agente | pendiente |
| Decretos autonómicos (Murcia 209/2022, 235/2022, 251/2022; Madrid; Andalucía; Valencia…) | Reparto por curso: la frontera legal de cada comunidad | Descarga del boletín autonómico, agente | pendiente |
| Libros de texto de las cinco editoriales grandes (SM, Santillana, Anaya, Edelvives, Edebé), índice y páginas de ejercicios de cada unidad | Orden de unidades y secciones: el mapa por editorial | Segunda mano (Paco); índices desde webs de editoriales (agente) | Edelvives 1º ESO fotografiado (22 fotos) |
| Tabla de niveles de Kumon | Granularidad fina de habilidades de cálculo | Paco la aporta | pendiente |
| Cuadernos Rubio | Secuencia clásica de operaciones por cuaderno; validar bloques y granularidad | Paco los aporta (fotos de índice y muestra) | pendiente |
| Programaciones didácticas de colegios | Temporalización real por semanas | Se piden al colegio; muchas están en la web del centro | Maristas Murcia pendiente |
| Competencia (Smartick, Khan Academy, Matific) | Cómo estructuran ellos las habilidades; qué cubren y qué no | Capturas y documentación pública, agente | pendiente |
| Maestros | Validar fronteras dudosas y errores típicos | Entrevistas cortas | pendiente |

La estructura de `fuente` (módulo 07) admite cualquier otra: una fuente nueva es una fila más con su tipo, no un cambio de modelo.

### 4. Proceso de construcción (mina 1)

**Mina 1 — Habilidades y fronteras.** Entrada: decretos oficiales, libros de texto, tabla Kumon. Trabajo: extraer habilidades atómicas, definirlas, ordenarlas con prerrequisitos, y situarlas en el mapa por sistema/curso/trimestre. Es trabajo de criterio, iterativo, con revisión humana en cada habilidad. Se hace una vez por sistema educativo y se mantiene. Incluye el conocimiento didáctico: para cada habilidad, los métodos con los que se enseña (`metodo`, `habilidad_metodo`), extraídos de manuales de didáctica de las matemáticas, materiales ABN y Singapur, libros de texto y maestros; es la parte que más necesita revisión de un docente, porque un método mal explicado enseña un error. La taxonomía se puede generar en gran parte desde el decreto y el conocimiento del modelo, con revisión humana en las fronteras dudosas; los libros de texto hacen falta sobre todo para el mapa (cuándo y en qué orden) y para validar, no para crear. De cada libro bastan el índice y las páginas de ejercicios de cada unidad, no la teoría. Salida: filas en `habilidad`, `habilidad_prerrequisito`, `habilidad_fuente`, `error_tipico`, `metodo`, `habilidad_metodo`, `mapa_curricular`.

Orden recomendado para arrancar: (1) decreto de Murcia de primaria → taxonomía de 1º de primaria con prerrequisitos y errores típicos, revisada por Paco; (2) mapa de Murcia por trimestre desde el decreto; (3) índices de las cinco editoriales para 1º → mapa por editorial; (4) Kumon y Rubio → contrastar granularidad y bloques; (5) repetir por curso.

### 5. Medición y mejora

- Cobertura: habilidades del decreto sin fila en `habilidad`; habilidades sin ejercicios; sin errores típicos; sin prerrequisitos.
- Contradicciones registradas en `habilidad_fuente` con rol `contradice` y sin decisión en `nota`.
- Con alumnos: habilidades donde muchos fallan justo después de "dominar" el prerrequisito → el prerrequisito está mal definido o falta uno intermedio. Habilidades que casi nadie ve en el mes previsto → el mapa está desplazado.

### 6. Qué pedir a Paco

- Tabla de niveles de Kumon y fotos de índices de los cuadernos Rubio.
- Un libro de 1º de primaria de cada editorial grande (índice y páginas de ejercicios).
- La programación didáctica de un colegio concreto, si la consigue.
- Decisión en cada contradicción entre fuentes que el agente no pueda resolver.

### 7. Decisiones y estado

### 9. Preguntas abiertas y decisiones (30 sep 2026)

**Decididas**

1. Mes en el mapa: se rellena. Que después el tutor lo use o no es otra cuestión.
2. Problemas de enunciado: son una habilidad, no un formato, y de las más importantes y pesadas. Incorporado en 5.1 (bloque `problemas`, `importancia`, `carga_alumno`) junto con la enseñanza concéntrica (`familia`, `nivel_familia`). Añadidas también métricas de jugabilidad y relevancia pedagógica a las mecánicas (5.12).
3. Plantilla e instancia se guardan las dos (5.9a y 5.9). Ningún ejercicio llega a la app sin revisión humana (`publicado` exige `revisado_por`). La revisión heredada (plantilla aprobada + muestra de 20 → las instancias por código heredan el revisor) queda soportada en el modelo; si se usa o no se decidirá con el volumen delante. Para distinguirlo, `ejercicio.revision_tipo` = directa | heredada.
4. Primera versión: solo mecánica OPCIONES y una única respuesta correcta. El modelo mantiene el soporte para varias correctas y más mecánicas, pero no se construyen aún.
5. Multiidioma: sí. Columna `idioma` en ejercicio y plantilla; los ejercicios de cada idioma se generan aparte, no se traducen, porque cambian nombres, moneda y contexto.

**Decididas el 30 sep; se deja la explicación para el registro**

6. Cómo agrupar las habilidades en bloques.

   Cada habilidad lleva una columna `bloque` que dice a qué gran área pertenece. Sirve para tres cosas: que el informe al padre diga "va bien en numeración y flojo en geometría", que la sesión mezcle bloques (intercalado), y que un agente sepa por dónde buscar al extraer habilidades de un decreto.

   La ley (LOMLOE) usa cinco "sentidos": numérico, de la medida, espacial, algebraico y estocástico (datos y azar). El problema es que "numérico" en primaria es el 70 % de todo: contar, leer números, sumar, restar, multiplicar, dividir, fracciones, decimales. Un informe que diga "va bien en numérico" no dice casi nada.

   Decidido: nueve bloques. `numeracion` (leer, escribir, comparar, descomponer números), `operaciones` (las cuatro operaciones, potencias, raíces), `medida`, `geometria`, `algebra` (desde 6º: letras, ecuaciones), `funciones` (desde 2º ESO), `estadistica_probabilidad`, `analisis` (bachillerato: límites, derivadas, integrales) y `problemas`. Como tabla (5.1b), no como enum, porque al contrastar con Rubio y Kumon puede cambiar.

7. Dónde guardar qué error delata cada respuesta errónea.

   Cuando un ejercicio se juega con opciones, cada opción incorrecta ("distractor") está pensada para delatar un error concreto: en 45 − 2 · (3 + 4), la opción 38 delata "resolvió el paréntesis y se olvidó del 2", y la opción 301 delata "fue de izquierda a derecha sin jerarquía". Esa relación (respuesta errónea → error típico) es lo que permite dar la explicación exacta sin preguntar nada.

   Hay dos formas de guardarla. La primera: dentro del propio ejercicio, en el campo `distractores`, como una lista donde cada elemento lleva el valor y el error: `[{"valor": "38", "error": "E04"}, {"valor": "301", "error": "E01"}]`. Es más sencilla de escribir y de leer. La segunda: `distractores` guarda solo los valores (`["38", "301", "35"]`) y una tabla aparte, `ejercicio_error`, guarda las parejas (ejercicio, respuesta errónea, error típico). Es más pesada pero permite consultas que la primera no: "¿cuántos ejercicios tengo que detecten el error E03?", "¿qué errores nunca detecta ningún ejercicio?", "¿qué error comete más este alumno en toda la app?". Y además sirve cuando el niño escribe la respuesta con el teclado en vez de elegirla: si escribe 38 sin que nadie se lo haya ofrecido, la tabla permite reconocer el error igual.

   Elegida la segunda porque el informe al padre y el diagnóstico del alumno se apoyan en esas consultas. Confirmado el 30 sep.

Ver también `casos-de-uso-edelvives-1eso.md`, que rellena estas tablas con datos reales de un libro.


---

## Módulo 02 — Ejercicios y explicaciones

### 1. Propósito

Tener, para cada habilidad, cientos de ejercicios en varios formatos, con respuesta, distractores ligados a errores típicos, y explicaciones por método; generados en volumen, validados automáticamente, revisados por una persona antes de publicarse, y nunca copiados de terceros.

### 2. Tablas

##### 5.9a plantilla (el molde de un ejercicio)

Un ejercicio se guarda dos veces: como plantilla (el molde con variables) y como instancia (el ejercicio concreto con números y nombres). La plantilla es lo que se revisa a fondo; las instancias son lo que ve el niño.

| columna | tipo | comentario |
|---|---|---|
| id | uuid PK | |
| habilidad_id | uuid FK → habilidad | Habilidad principal |
| formato | enum | El mismo que tendrán sus instancias |
| dificultad | smallint | |
| enunciado_plantilla | text | Con variables: "{nombre} tiene {a} caramelos y reparte {b} a cada amigo. ¿Para cuántos amigos le llega?" |
| restricciones | jsonb | Rango y condiciones de cada variable: `{"a": [10, 50], "b": [2, 9], "regla": "a divisible por b"}` |
| solucion_plantilla | text | Expresión que calcula la respuesta: `a / b` |
| explicacion_plantilla | text | Con las mismas variables |
| generador | enum | codigo, ia, manual |
| revisado_por | text nullable | Persona que aprobó la plantilla |
| revisado_en | timestamptz nullable | |
| estado | enum | borrador, aprobada, retirada |

##### 5.9 ejercicio (una instancia)

| columna | tipo | comentario |
|---|---|---|
| id | uuid PK | |
| plantilla_id | uuid FK nullable → plantilla | De qué molde sale. Null solo en ejercicios escritos a mano sin plantilla |
| formato | enum | ver tabla de formatos más abajo |
| dificultad | smallint | 1, 2, 3 dentro de la habilidad principal |
| enunciado | text | Markdown o texto plano. Nunca HTML, para poder maquetar PDF |
| datos | jsonb nullable | Lo que el formato necesite además del enunciado (posiciones en una recta, elementos a emparejar…) |
| parametros | jsonb nullable | Los valores estructurados del ejercicio: `{"op": "mult", "a": 7, "b": 8}`. Obligatorio en lo calculable. Es lo que permite a las técnicas elegir vecinos, conmutativas e inversas sin leer el enunciado |
| respuesta | jsonb | Respuesta(s) correcta(s) normalizada(s). Lista si hay varias |
| distractores | jsonb nullable | Lista ordenada de respuestas erróneas plausibles (solo valores). Obligatorio si el formato lo exige. Qué error típico delata cada una vive en `ejercicio_error` (5.11), no aquí |
| (explicaciones) | — | Van en `ejercicio_explicacion` (5.9b), una por método, porque el mismo ejercicio se explica distinto según cómo enseñe el colegio |
| ciclo_registro | enum | ciclo1 (6–8 años), ciclo2 (8–10), ciclo3 (10–12), secundaria |
| grupo_id | uuid nullable | Ejercicios que comparten contexto o van encadenados (apartados a, b, c; "¿es correcta?" + "corrígela") |
| idioma | text | es-ES, es-MX, en-US |
| imprimible | boolean | Tiene sentido en papel |
| generado_por | text | Modelo/prompt/versión o "algoritmo", para trazabilidad. Nunca referencia a un ejercicio de libro: los ejercicios son variantes propias |
| fuente_id | uuid FK nullable → fuente | Solo si un documento concreto inspiró el tipo de ejercicio |
| fuente_ref | text nullable | |
| validado_automatico | boolean | Pasó el validador (esquema, corrección, copia, frontera) |
| revisado_por | text nullable | Persona que aprobó esta instancia concreta, o la plantilla de la que sale (ver regla de revisión) |
| revisado_en | timestamptz nullable | |
| revision_tipo | enum nullable | directa (una persona vio esta instancia), heredada (de la plantilla aprobada más muestra) |
| publicado | boolean | Solo los publicados llegan a la app. Requiere `validado_automatico = true` y `revisado_por` no nulo |
| version | integer | |

Regla de revisión humana: la app nunca muestra un ejercicio que no haya revisado una persona. Con cientos de miles de instancias eso no puede significar leerlas una a una, así que la revisión se hace a nivel de plantilla y muestra: una persona aprueba la plantilla y una muestra de sus instancias (20 al azar, o todas si son menos); las instancias generadas por código desde una plantilla aprobada heredan `revisado_por` de la plantilla; las instancias generadas por IA (problemas, texto) se revisan una a una porque cada una puede fallar por su cuenta. Nada pasa a `publicado = true` sin ambas cosas: validación automática y revisor humano, ya sea directo o heredado. Ambas vías quedan soportadas (`revision_tipo`); cuál se usa por defecto se decidirá con el volumen delante.

Formatos (contrato de datos de cada uno):

| formato | necesita | lo juegan mecánicas como |
|---|---|---|
| numerico | respuesta | teclado, papel, y cualquiera que genere distractores automáticamente |
| opcion_multiple | respuesta(s) + distractores | opciones, globos, emparejar. En la primera versión, una sola respuesta correcta; varias correctas queda para más adelante |
| verdadero_falso | respuesta | tarjetas, papel |
| ordenar | lista en `datos` + orden correcto en `respuesta` | arrastrar, papel |
| recta_numerica | rango en `datos` + posición en `respuesta` | recta numérica, papel |
| emparejar | pares en `datos` | emparejar, papel |
| texto_corto | respuesta como texto | teclado, papel |
| abierto | sin autocorrección | papel, revisión por adulto |
| reparto | `datos = {"total": 12, "grupos": 3}` + respuesta | reparto (mecánica específica) |
| balanza | `datos = {"izquierda": "x + 3", "derecha": "7"}` + respuesta | balanza (mecánica específica) |

Los dos últimos son formatos específicos: existen porque una mecánica específica (la que representa la operación misma, no un envoltorio) necesita datos propios. Cada mecánica específica nueva trae su formato. La restricción "esta mecánica solo vale para dividir" no se declara: sale sola de que solo las habilidades de división generan ejercicios en formato `reparto`.

Regla de no reproducción (aplica a todo generador, humano o agente):
- Ningún ejercicio del banco copia un ejercicio de un libro, web o material de terceros. Los ejercicios son variantes propias generadas desde la definición y los parámetros de la habilidad.
- Excepción única: ejercicios "comunes", es decir, los que cualquiera escribiría igual porque no hay otra forma de plantearlos: operaciones numéricas puras (7 + 5, 6 · 8, √81, 45 − 2 · (3 + 4)), tablas, series triviales, preguntas de definición estándar ("¿qué es un número primo?"). Que un número coincida con el de un libro no es copia; el espacio de operaciones cortas es finito y compartido.
- Nunca se copian: enunciados de problemas con contexto (nombres, situaciones, datos inventados por la editorial), figuras, tablas de datos, series de apartados a/b/c tal cual, ni la selección concreta de números de un ejercicio largo. Se cambian contexto, nombres, cantidades y estructura.
- El validador rechaza cualquier ejercicio cuyo enunciado coincida en más de unas pocas palabras seguidas con un texto extraído en `fuentes/text/`. La comprobación es mecánica (búsqueda de n-gramas contra el archivo de fuentes), no de criterio.
- `fuente_id` en `ejercicio` indica qué tipo de ejercicio inspiró la variante, nunca que el ejercicio proceda de ahí.

Regla: para `numerico`, la app puede generar distractores sobre la marcha (respuesta ±1, error de llevada, error de tabla) y jugarlo como `opcion_multiple`. Si el ejercicio ya trae `distractores`, se usan esos, porque están pensados y ligados a errores típicos en `ejercicio_error`.

##### 5.9b ejercicio_explicacion (una explicación por ejercicio y método)

| columna | tipo | comentario |
|---|---|---|
| ejercicio_id | uuid FK → ejercicio | |
| metodo_id | uuid FK → metodo | Con qué método está escrita |
| explicacion_nino | text | Cómo se resuelve, en el registro del ciclo |
| explicacion_adulto | text nullable | Qué está aprendiendo, por qué falla, cómo ayudarle sin hacerlo por él |
| explicacion_pasos | jsonb nullable | La explicación como pasos estructurados, para que una mecánica animada pueda recorrerlos: `[{"paso": 1, "operacion": "3 + 4", "resultado": "7", "texto": "Primero el paréntesis"}, ...]`. Obligatorio en todo lo calculable; opcional en problemas y texto |
| generado_por | text | |
| revisado_por | text nullable | Misma regla de revisión que el ejercicio |

Reglas:
- Todo ejercicio publicado tiene al menos la explicación del método principal de su habilidad. Las de métodos alternativos se generan solo para las escuelas que tengan alumnos (ABN cuando haya colegios ABN).
- La app elige la explicación por este orden: método de la escuela del colegio del alumno → método de la editorial → método principal de la habilidad.
- `error_tipico.explicacion_nino` (la correctora) es independiente del método; si un error tiene un método de remedio en `habilidad_metodo`, la app lo usa en el reintento.

##### 5.10 ejercicio_habilidad (tabla de unión, N:M con rol)

| columna | tipo | comentario |
|---|---|---|
| ejercicio_id | uuid FK → ejercicio | |
| habilidad_id | uuid FK → habilidad | |
| rol | enum | principal, secundaria |

Exactamente una fila `principal` por ejercicio. `(2 + 5) × 4` tiene principal OPER.JERARQ.02 (jerarquía con paréntesis) y secundarias NUM.SUMA.01 y OPER.MULT.02. La principal decide la dificultad y qué se evalúa; las secundarias se registran con menos peso y sirven para la frontera (todas deben estar permitidas).

##### 5.11 ejercicio_error

| columna | tipo | comentario |
|---|---|---|
| ejercicio_id | uuid FK → ejercicio | |
| error_tipico_id | uuid FK → error_tipico | |
| respuesta_erronea | text | La respuesta concreta que delata este error (para 27 + 5, "22") |

Sirve en dos direcciones: en opción múltiple, cada distractor apunta aquí a su error; en teclado, si el niño escribe "22" sin que nadie se lo haya ofrecido, la app también sabe qué error ha cometido. Un ejercicio numérico generado por código lleva sus filas de `ejercicio_error` calculadas aplicando cada error típico de la habilidad como una función.

### 3. Fuentes que necesita este módulo

| fuente | para qué |
|---|---|
| Módulo 01 (habilidad, error_tipico, mapa) | Sin habilidad cerrada no se genera nada |
| Módulo 04 (metodo) | La explicación se escribe según el método principal de la habilidad |
| Textos extraídos del archivo de fuentes (módulo 07) | Para la comprobación de no reproducción |
| Ejercicios modelo escritos a mano por Opus o por un maestro (3–5 por habilidad) | Ejemplos en la skill de generación |

### 4. Proceso de construcción (mina 2)

**Mina 2 — Ejercicios y explicaciones.** Entrada: la taxonomía ya definida. Trabajo: para cada habilidad, generar ejercicios en los formatos que tengan sentido, con distractores pensados (ligados a errores típicos), explicación para el niño y para el adulto. Los ejercicios puramente numéricos se generan por algoritmo, no por IA; la IA aporta enunciados de problemas, distractores con sentido y explicaciones. Cada ejercicio pasa por un validador que comprueba que respeta la definición y el `ejemplo_frontera` de su habilidad, y que no reproduce material de las fuentes archivadas (regla de no reproducción, 5.9). Es trabajo masivo y paralelizable. Cada ejercicio se genera con la explicación del método principal de su habilidad; las de otros métodos se generan bajo demanda. Salida: filas en `plantilla`, `ejercicio`, `ejercicio_habilidad`, `ejercicio_error`, `ejercicio_explicacion`.

Detalle del proceso: (1) plan de generación por habilidad (qué formatos, cuántos por dificultad); (2) dos generadores: código para lo numérico, Sonnet en Batch para texto y problemas, exigiendo JSON con el esquema y la expresión de cálculo; (3) explicaciones en la misma llamada, versión niño y adulto, y pasos estructurados; (4) validación en cascada: esquema → corrección recalculada → copia por n-gramas → duplicados → frontera y calidad con Opus; (5) los rechazos se agrupan por motivo y corrigen la skill, no el ejercicio; (6) muestreo humano y publicación.

### 5. Medición y mejora

- Tasa de aceptación del validador por lote y por motivo de rechazo (objetivo: más del 85 % en la segunda pasada).
- Ejercicios publicados por habilidad, formato y dificultad; huecos.
- Con alumnos: ejercicios con tasa de acierto anómala respecto a su habilidad (demasiado fáciles o difíciles: mal etiquetados); distractores que nadie elige (no delatan nada) o que todos eligen (ambiguos).
- Rechazos guardados con motivo como datos de mejora de las skills.

### 6. Qué pedir a Paco

- Revisión humana de plantillas y muestras (o designar quién la hace).
- Confirmar el registro de las explicaciones para cada ciclo con dos o tres ejemplos que le gusten.


---

## Módulo 03 — Mecánicas (los juegos)

### 1. Propósito

Especificar las formas de jugar un ejercicio: qué necesita cada una, qué mide, cuándo y cómo explica, para qué habilidades conviene. Aquí se especifican; el diseño visual y la implementación son un proyecto aparte.

### 2. Tablas

##### 5.12 mecanica (cómo se juega un ejercicio)

Un ejercicio es contenido; una mecánica es la forma de jugarlo. Se separan porque el mismo "2 × 3" puede aparecer como pregunta con cuatro opciones, como globos que suben, como carrera contra el reloj o como hoja impresa. Y una misma mecánica sirve para cientos de habilidades.

| columna | tipo | comentario |
|---|---|---|
| id | uuid PK | |
| codigo | text único | Genéricas: `OPCIONES`, `GLOBOS`, `EMPAREJAR`, `RECTA`, `TECLADO`, `ORDENAR`, `TARJETAS`, `PAPEL`. Específicas: `REPARTO`, `BALANZA`, `BLOQUES` (llevada), `PIZZA` (fracciones) |
| nombre | text | Nombre para el equipo |
| tipo | enum | generica (envoltorio: vale para cualquier habilidad cuyo formato admita), especifica (representa la operación misma; exige un formato propio) |
| descripcion | text | Cómo funciona, qué ve el niño, qué hace |
| formatos_admitidos | enum[] | Qué formatos de ejercicio puede renderizar (ver 5.9) |
| tiempo | enum | sin_tiempo, con_tiempo, ritmo_creciente |
| respuestas_correctas | enum | una, varias, ordenar |
| mide | enum | reconocimiento (elige), produccion (escribe), fluidez (con tiempo) |
| edad_minima | smallint | Por la motricidad y la lectura que exige |
| duracion_tipica_seg | smallint | Para componer sesiones |
| carga_cognitiva | enum | baja, media, alta |
| jugabilidad | smallint nullable | 1–5. Cuánto engancha, medido en pruebas con niños (¿la usan solos?) y después con datos de uso (sesiones que la eligen, abandono). Empieza vacío; lo rellena la prueba de la mina 3 |
| relevancia_pedagogica | smallint nullable | 1–5. Cuánto enseña más allá de entretener: si hace visible un concepto (balanza, reparto) o solo lo envuelve (globos). Lo rellena el criterio y luego los datos de aprendizaje por mecánica |
| momento_explicacion | enum | al_fallar (interrumpe y explica antes de seguir), al_terminar (acumula fallos y explica al final de la ronda), nunca (la mecánica es autoexplicativa, como la balanza) |
| forma_explicacion | enum[] | texto_corto, pasos_destapables, animacion_sobre_ejercicio, ejemplo_resuelto. Qué formas de explicación sabe mostrar; `animacion_sobre_ejercicio` exige `explicacion_pasos` en el ejercicio |
| reintento | boolean | Si tras explicar ofrece inmediatamente otro ejercicio de la misma habilidad, a poder ser del mismo error típico |
| fuente_id | uuid FK nullable → fuente | App o material del que se tomó la idea (archivado como fuente: capturas de pantalla) |
| estado | enum | idea, prototipo, en_app, descartada |

Reglas:
- El ejercicio no sabe con qué mecánica se va a jugar. Guarda respuesta y distractores; la mecánica los coloca.
- Una mecánica solo puede usar ejercicios cuyo formato esté en sus `formatos_admitidos`.
- Las mecánicas con tiempo (`GLOBOS`) solo se usan con habilidades en estado `consolida` o `repasa`, nunca en `introduce`. Cronómetro sobre algo recién aprendido produce frustración, no fluidez. `habilidad_mecanica.estado_minimo` (5.13) puede ser más restrictivo que esta regla, nunca menos.
- `mide` es lo que la capa del alumno usa para pesar los resultados: un acierto en `produccion` vale más que en `reconocimiento`; un fallo en `fluidez` no significa "no lo sabe" sino "no lo tiene automatizado".
- Qué mecánica toca en cada momento (variedad, alternancia, duración de sesión) no lo decide el banco: lo decide la capa del alumno.

Explicaciones: dónde vive cada cosa.
- El contenido de la explicación (texto para el niño, texto para el adulto, pasos estructurados, explicación correctora de cada error típico) está en `ejercicio_explicacion` (una por método) y en `error_tipico`. Lo genera la mina 2 siguiendo los métodos de la mina 1. La mecánica no sabe nada de eso: lo recibe hecho, ya en el método del colegio del niño.
- Cuándo y cómo se muestra lo decide la mecánica (`momento_explicacion`, `forma_explicacion`). Las mecánicas con tiempo no interrumpen: explican al terminar la ronda. Las mecánicas específicas (balanza, reparto) suelen no necesitar explicación porque la propia pantalla muestra el error.
- La explicación sola no enseña; enseña la explicación seguida de un intento nuevo. Toda mecánica con `reintento = true` ofrece a continuación otro ejercicio de la misma habilidad, preferiblemente que ataque el mismo error típico que acaba de cometer.
- Cuanto menor es el niño, menos texto y más animación sobre el propio ejercicio. Por eso `explicacion_pasos` es obligatorio en primaria para todo lo calculable.

##### 5.13 habilidad_mecanica (afinidad, no solo compatibilidad)

La compatibilidad (5.12) dice qué mecánicas pueden jugar un formato. La afinidad dice cuáles convienen para cada habilidad.

| columna | tipo | comentario |
|---|---|---|
| habilidad_id | uuid FK → habilidad | |
| mecanica_id | uuid FK → mecanica | |
| idoneidad | smallint | 1 (evitar) a 5 (la mejor opción) |
| estado_minimo | enum | introduce, consolida, repasa. Desde qué estado en el mapa se permite |
| motivo | text | "fluidez: las tablas hay que automatizarlas" |
| origen | enum | criterio, datos. Si viene de intuición pedagógica o de medir aprendizaje real |

Reglas:
- Se rellena por familia de habilidad, no una a una: cálculo automático (tablas, sumas básicas) → mecánicas de fluidez alto; razonamiento (jerarquía, problemas) → producción y opciones alto, fluidez vetado; posición y orden (recta numérica, comparar) → arrastrar alto. Una habilidad concreta solo tiene filas propias si se aparta de su familia.
- Un ejercicio no lleva afinidad: la hereda de su habilidad principal.
- La sesión elige mecánica ponderando por `idoneidad` entre las compatibles, no al azar.
- Cada intento del alumno registra `mecanica_id`. A partir de ahí la afinidad se puede recalcular con datos (`origen = datos`) y sustituir al criterio inicial.

### 3. Fuentes que necesita este módulo

| fuente | para qué | cómo |
|---|---|---|
| Apps de matemáticas para niños (Smartick, Prodigy, DragonBox, Khan Academy Kids, Matific, SplashLearn, Todo Math) | Inventario de mecánicas genéricas y específicas | Instalar, jugar 20 min, capturas archivadas como fuente |
| Apps que enganchan fuera de matemáticas (Duolingo, Elevate, Brilliant) | Mecánicas transferibles | Igual |
| Material manipulativo de aula (regletas, bloques base 10, balanza numérica, recta de suelo) | Mecánicas específicas candidatas | Catálogos y fotos |
| Kumon y Rubio en papel | Mecánicas de papel para el PDF | Paco |
| Catálogo de mayo de 2026 (8 mecánicas de 12 apps) | Punto de partida | Ya existe |
| Módulo 04 (metodo con representación manipulativa o pictórica) | Cada método concreto es candidato a mecánica específica | |

### 4. Proceso de construcción (mina 3)

**Mina 3 — Mecánicas.** Entrada: apps de referencia (Smartick, Prodigy, DragonBox, Duolingo, Khan Kids), ideas propias, Kumon en papel. Trabajo en tres pasos: (1) inventario de mecánicas como filas en estado `idea`, cada una con su captura archivada como `fuente`; (2) contrato: qué formato necesita cada una y qué mide; las que necesitan datos que el banco no tiene se descartan o se anota qué habría que añadir; (3) prototipo en HTML probado con niños de la edad objetivo, diez minutos por mecánica; las que enganchan pasan a `en_app`. Además de las mecánicas de juego se inventarían las mecánicas de explicación: cómo enseñan las apps de referencia cuando el niño falla (texto, pasos destapables, animación sobre el ejercicio, ejemplo resuelto al lado). Son pocas, transversales a todos los juegos, y se registran como valores de `forma_explicacion`. Es trabajo de diseño y prueba, no de volumen. El diseño visual de las mecánicas que pasan a `en_app` es un proyecto aparte; aquí solo se especifican. Salida: filas en `mecanica` y `habilidad_mecanica` (afinidad inicial por familia de habilidad, `origen = criterio`).

Criterios de selección (1–5 cada uno): cuánto enseña, a cuántas habilidades sirve, coste de desarrollo, edad que cubre, respeto de las restricciones de la ciencia (módulo 04). Finalistas: 8–10 con al menos dos de fluidez, dos de producción, tres de reconocimiento y dos o tres específicas para los conceptos que más cuestan (llevada, reparto, fracciones, ecuaciones). Primera versión: solo OPCIONES con una correcta.

### 5. Medición y mejora

- En prototipo: ¿la usa solo? (observación) y ¿sabe algo nuevo al terminar? (cinco preguntas antes y después).
- En producción, por mecánica y habilidad: acierto, tiempo, abandono dentro de la mecánica, elección cuando hay alternativa, y crecimiento de `p_dominio` en los intentos jugados con ella. Con eso se recalcula `habilidad_mecanica.idoneidad` (`origen = datos`) y se rellenan `jugabilidad` y `relevancia_pedagogica`.

### 6. Qué pedir a Paco

- Su app de identificar juegos y lo que ya tenga catalogado.
- Acceso a tres o cuatro niños de la edad objetivo para las pruebas de prototipo.


---

## Módulo 04 — Didáctica: cómo se enseña y cómo se practica

### 1. Propósito

La base de conocimiento sobre aprendizaje: los métodos con los que se enseña cada habilidad (tradicional, ABN, Singapur, estrategias concretas como completar a diez) y las técnicas de práctica que deciden qué ejercicio viene después (conmutativa, vecinos, familia de hechos, mismo error, bajar al prerrequisito, espaciar, intercalar). Es lo que el tutor (módulo 05) ejecuta y lo que las explicaciones (módulo 02) siguen.

### 2. Tablas

##### 5.3b metodo (cómo se enseña)

El conocimiento didáctico: las formas documentadas de enseñar cada habilidad. Es distinto de la explicación de un ejercicio (que es una aplicación de un método a un caso) y distinto de la mecánica (que es cómo se juega en pantalla).

| columna | tipo | comentario |
|---|---|---|
| id | uuid PK | |
| codigo | text único | `SUMA.COMPLETAR10`, `SUMA.ALG_VERTICAL`, `SUMA.ABN_REJILLA`, `MULT.DOBLES`, `MULT.DESCOMPOSICION`, `PROB.BARRAS` |
| nombre | text | "Completar a diez" |
| escuela | enum | tradicional, abn, singapur, montessori, generico. La corriente a la que pertenece; `generico` para estrategias que todas usan |
| representacion | enum | manipulativa (material), pictorica (dibujo), simbolica (números). La progresión concreto → pictórico → abstracto |
| descripcion | text | En qué consiste, con un ejemplo resuelto |
| cuando_usar | text | Como primera presentación, como refuerzo, como remedio de un error concreto |
| edad_desde | smallint | |
| fuente_id | uuid FK → fuente | Manual de didáctica, material ABN, libro de texto, maestro |
| activo | boolean | |

##### 5.3c habilidad_metodo (qué métodos tiene cada habilidad)

| columna | tipo | comentario |
|---|---|---|
| habilidad_id | uuid FK → habilidad | |
| metodo_id | uuid FK → metodo | |
| rol | enum | principal (el que se usa por defecto), alternativo, remedio |
| orden_presentacion | smallint | Primero el manipulativo, luego el pictórico, luego el simbólico |
| error_tipico_id | uuid FK nullable → error_tipico | Si `rol = remedio`, qué error corrige este método |
| mecanica_id | uuid FK nullable → mecanica | Mecánica específica que representa este método en pantalla (bloques base 10 para descomposición, recta para conteo a saltos, balanza para ecuaciones) |
| nota | text nullable | |

Reglas:
- Toda habilidad tiene al menos un método `principal`. Sin él no se puede escribir su explicación.
- El colegio puede declarar su escuela (`colegio.escuela_metodo`: tradicional, abn, singapur…). Si lo hace, la app usa para ese alumno el método principal de esa escuela cuando existe, y el genérico si no. Si no lo declara, se usa el de la editorial del libro (los libros tradicionales enseñan el algoritmo tradicional) o el genérico.
- Un método de `rol = remedio` se activa cuando el alumno repite el error típico al que apunta: en vez de explicar otra vez igual, se cambia de método.
- Las mecánicas específicas nacen aquí: cada método con representación manipulativa o pictórica es candidato a una pantalla propia.

##### 5.3d tecnica_practica (qué ejercicio viene después)

Conocimiento sobre cómo se practica, distinto del método (cómo se explica). Cada técnica es una regla que, dado lo que acaba de pasar, dice qué ejercicio conviene ahora.

| columna | tipo | comentario |
|---|---|---|
| id | uuid PK | |
| codigo | text único | Ver lista debajo |
| nombre | text | |
| descripcion | text | En qué consiste y por qué funciona |
| disparador | enum | tras_fallo, tras_acierto, error_repetido, repaso_vencido, introduccion, siempre |
| regla | jsonb | Cómo derivar el siguiente ejercicio a partir del actual, ejecutable por el tutor. Ejemplos debajo |
| ambito | enum | habilidad (solo donde `habilidad_tecnica` lo diga), universal (todas) |
| fuente_id | uuid FK → fuente | Literatura de aprendizaje o app de referencia |

Técnicas iniciales:

| codigo | disparador | regla (ejemplo) | para qué habilidades |
|---|---|---|---|
| CONMUTATIVA | tras_fallo | `{"intercambiar": ["a", "b"]}` — falla 7 × 8, pregunta 8 × 7 | hechos de suma y multiplicación |
| VECINO | tras_fallo | `{"variar": "b", "delta": [-1, 1]}` — 7 × 8 falla, pregunta 7 × 7 y 7 × 9 | hechos numéricos, tablas |
| FAMILIA_HECHOS | tras_acierto | `{"inversa": true}` — 7 × 8 = 56 acertado, pregunta 56 : 7 | operaciones con inversa |
| DESCOMPONER | tras_fallo | `{"partir": "b", "en": [5, "resto"]}` — 7 × 8 como 7 × 5 + 7 × 3 | multiplicación, suma con llevada |
| MISMO_ERROR | error_repetido | `{"error_tipico_id": "<el detectado>", "n": 2}` — otro ejercicio que provoque el mismo error | razonamiento, jerarquía, problemas |
| BAJAR_PRERREQUISITO | error_repetido | `{"tras_fallos": 3, "ir_a": "prerrequisito_imprescindible"}` | todas con prerrequisito |
| EJEMPLO_RESUELTO | tras_fallo | `{"mostrar_resuelto": true, "luego": "mismo_tipo"}` — ejemplo resuelto y a continuación uno igual (fading) | problemas, procedimientos largos |
| INTERCALAR | siempre | `{"max_seguidos_misma_habilidad": 3}` | universal |
| ESPACIAR | repaso_vencido | `{"algoritmo": "fsrs"}` — intervalos que se alargan con cada acierto | universal |
| SUBIR_DIFICULTAD | tras_acierto | `{"tras_aciertos": 3, "dificultad": "+1"}` | universal |

Para que VECINO, CONMUTATIVA, FAMILIA_HECHOS y DESCOMPONER puedan ejecutarse, los ejercicios numéricos guardan sus parámetros estructurados (`ejercicio.parametros`, ver 5.9), no solo el enunciado.

##### 5.3e habilidad_tecnica (qué técnicas sirven a cada habilidad)

| columna | tipo | comentario |
|---|---|---|
| habilidad_id | uuid FK → habilidad | |
| tecnica_id | uuid FK → tecnica_practica | |
| prioridad | smallint | 1–5. Entre varias técnicas con el mismo disparador, cuál probar primero |
| parametros | jsonb nullable | Ajustes de la regla para esta habilidad (qué variable es "b", cuántos fallos antes de bajar) |
| nota | text nullable | |

Reglas:
- Las técnicas `universal` no necesitan filas aquí: aplican a todo.
- Se rellena por familia, como la afinidad: las familias de hechos numéricos reciben CONMUTATIVA, VECINO, FAMILIA_HECHOS y DESCOMPONER; las de razonamiento reciben MISMO_ERROR, EJEMPLO_RESUELTO y BAJAR_PRERREQUISITO. Una habilidad solo tiene filas propias si se aparta de su familia.
- Cada intento registra qué técnica lo eligió (`intento.tecnica_id`), para poder medir después qué técnicas aceleran el dominio y ajustar prioridades con datos.

### 3. Fuentes que necesita este módulo

| fuente | para qué |
|---|---|
| Manuales de didáctica de las matemáticas (los de las facultades de Educación; Castro; Chamorro; NCTM en EE.UU.) | Métodos por habilidad, progresión concreto → pictórico → abstracto |
| Materiales del método ABN (Jaime Martínez Montero) | Métodos ABN de suma, resta, multiplicación y división; muy extendido en Andalucía y presente en Murcia |
| Método Singapur (modelo de barras, CPA) | Problemas y representación pictórica |
| Kumon y Rubio | Técnicas de práctica: secuencias, repetición, vecinos |
| Ciencia del aprendizaje (apéndice A: recuperación, espaciado, intercalado, dificultad deseable, feedback, dominio; Roediger y Karpicke, Cepeda, Rohrer, Bjork) | Las técnicas universales y sus parámetros |
| Duolingo, Anki (SM-2, FSRS) | Espaciado y repaso: algoritmos publicados |
| Maestros | Validar que cada método está bien explicado; un método mal explicado enseña un error |

### 4. Proceso de construcción

Por familia de habilidad: (1) listar los métodos documentados con fuente archivada; (2) elegir el principal por escuela (tradicional, ABN, Singapur) y los de remedio por error típico; (3) asignar técnicas de práctica por familia con prioridad; (4) revisión de un maestro; (5) los ejercicios modelo de cada método para el módulo 02.

### 5. Medición y mejora

- Por técnica: cuánto acelera el dominio (intentos hasta `p_dominio` ≥ 0,85) frente a no aplicarla; se ajusta `habilidad_tecnica.prioridad` con datos.
- Por método: tasa de acierto en el reintento tras una explicación con ese método; si un método de remedio no mejora el reintento, no remedia.
- Espaciado: tasa de olvido real a 7 y 30 días frente a la prevista; ajusta los parámetros de FSRS.

### 6. Qué pedir a Paco

- Si conoce colegios ABN en Murcia, para tener alumnos de las dos escuelas desde el principio.
- Un maestro de primaria dispuesto a revisar métodos y explicaciones una tarde al mes.

### Apéndice — Fundamentos científicos e inspiraciones

Este apéndice recoge en qué ciencia se apoya el producto y qué productos ya la aplican. Sirve para dos cosas: que quien desarrolle no invente lo que ya está resuelto, y como base para la comunicación del producto (nota de prensa, web, conversación con padres).

#### A.1 Lo que la evidencia respalda

**Práctica de recuperación (retrieval practice).** Intentar sacar una respuesta de la memoria enseña más que releer o ver una explicación. Un niño que resuelve 20 ejercicios aprende más que uno que ve 20 ejemplos resueltos. Es el motor de toda la app: la unidad de aprendizaje es el ejercicio, no la lección.

**Repetición espaciada (spaced repetition).** La memoria se refuerza cuando se repasa justo antes de olvidar. El intervalo entre repasos se alarga con cada acierto (1 día, 4 días, 10, 25, 60…) y se acorta al fallar. Los algoritmos están publicados y probados con millones de usuarios: SM-2 (SuperMemo, 1987) y FSRS (2022), que ajusta los intervalos a cada persona a partir de su historial. Aplicado a Mates10: cada habilidad tiene su propia fecha de próximo repaso por alumno.

**Dificultad deseable.** El aprendizaje es máximo cuando el alumno acierta en torno al 80–85 % de las veces. Por debajo se frustra, por encima no aprende. Ese porcentaje es el termostato del sistema adaptativo: la dificultad sube o baja para mantenerlo.

**Intercalado (interleaving).** Mezclar tipos de ejercicio en una misma sesión (una suma, una resta, un problema, otra suma) produce más aprendizaje que bloques de ejercicios iguales, aunque al niño le parezca más difícil y al padre le parezca desordenado. Hay que explicárselo al padre, porque va contra la intuición.

**Feedback inmediato y específico.** Decir "has restado en vez de llevar" enseña; decir "mal, la respuesta es 32" no. Por eso el banco cataloga errores típicos por habilidad y cada ejercicio sabe qué respuesta errónea delata qué error.

**Aprendizaje por dominio (mastery learning).** No avanzar a la siguiente habilidad hasta que la anterior esté consolidada. Es el principio de Kumon y de Khan Academy, y lo que justifica la tabla de prerrequisitos. Evita el efecto acumulativo por el que un niño que no domina las decenas en 1º arrastra el problema hasta 4º.

**Modelado del conocimiento del alumno (knowledge tracing).** Para cada habilidad se mantiene una probabilidad de que el alumno la domina, actualizada con cada acierto o fallo. La versión clásica es Bayesian Knowledge Tracing (Corbett y Anderson, 1994), con cuatro parámetros por habilidad: probabilidad inicial de saberla, de aprenderla en cada intento, de acertar por azar y de fallar por despiste. De ahí salen "aprende rápido" o "aprende lento" sin que nadie lo etiquete.

#### A.2 Lo que la evidencia no respalda (y no se construye)

**Estilos de aprendizaje (visual, auditivo, kinestésico).** Veinte años de estudios no han conseguido demostrar que enseñar a cada niño "en su estilo" mejore resultados. Los niños tienen preferencias, pero adaptar el contenido a la preferencia no mejora el aprendizaje. No habrá test de estilos ni contenido por estilo.

**Puntos, insignias y rankings como motor principal.** Tienen un efecto pequeño y que se desgasta; en varios estudios la motivación intrínseca baja cuando se retira la recompensa. Se usan con moderación, nunca como sustituto del progreso real visible.

#### A.3 Motivación

La teoría de la autodeterminación (Deci y Ryan) identifica tres necesidades que sostienen la motivación a largo plazo:

- **Competencia**: sentir que se progresa. Barras de dominio por habilidad, mapa de calor de las tablas de multiplicar, "ya sabes 14 de 20". Progreso visible y honesto, no medallas.
- **Autonomía**: sentir que se elige algo. Qué practicar hoy, el orden, el personaje.
- **Relación**: sentir que alguien lo ve. El padre recibe el progreso y lo comenta con el niño.

#### A.4 Atención y TDAH

El TDAH no es una forma distinta de aprender sino una dificultad para sostener la atención y regular el esfuerzo. Lo que ayuda está bien documentado: sesiones cortas (5–8 minutos), recompensa inmediata y frecuente, una sola cosa en pantalla, dificultad muy ajustada, variedad de formato. Casi todo esto beneficia también a los niños sin TDAH, así que no hay "modo TDAH": la longitud de sesión, la frecuencia de refuerzo y la tolerancia a la dificultad son parámetros de cada alumno, que se ajustan observándolo. Un padre puede declarar un diagnóstico y eso solo cambia los valores iniciales.

#### A.5 Productos de referencia

- **Anki**: repetición espaciada con tarjetas; algoritmos SM-2 y FSRS. De aquí sale el calendario de repaso por habilidad.
- **Kumon**: dominio antes de avanzar; hojas cortas diarias; taxonomía muy granular de habilidades. De aquí sale la granularidad de la taxonomía y la idea de sesión corta diaria.
- **Khan Academy**: mastery learning con prerrequisitos explícitos entre habilidades; mapa de conocimiento visible. De aquí sale el grafo de prerrequisitos.
- **Duolingo**: sesiones de 5 minutos, racha diaria, feedback inmediato, intercalado. De aquí sale el ritmo de sesión y la mecánica de hábito.
- **Smartick** (competidor directo en España): sesión diaria de 15 minutos, adaptación por rendimiento, informe al padre.

---


---

## Módulo 05 — Tutor: localizar, evaluar, decidir y medir

### 1. Propósito

El tutor es el que elige el siguiente ejercicio. Su objetivo doble: que el alumno aprenda y que quiera volver. Para decidir necesita saber dónde está el alumno (sistema, curso, mes), qué domina (suelo), hasta dónde puede llegar (techo), cuándo toca repasar (calendario) y cómo está respondiendo ahora mismo (la sesión). Este módulo define cómo se consigue esa información, cómo se decide y cómo se mide si funciona. El módulo 06 aporta el conocimiento sobre enganche que el tutor aplica.

### 2. Localizar al alumno: con información o sin ella

El tutor tiene que funcionar con cualquier cantidad de información y mejorar con cada dato.

| dato | de dónde sale | si no está |
|---|---|---|
| Sistema educativo | Idioma y región del dispositivo, confirmación de un toque | Se asume por dispositivo y se pregunta al padre en el primer informe |
| Edad | Se pregunta en el onboarding, pero es opcional | Se estima desde el nivel inferido por la prueba (curso inferido → edad típica ± 1), con confianza guardada; cualquier dato del padre la sustituye |
| Curso | Edad → curso típico del sistema; confirmación | Sin edad ni curso: lo infiere la prueba de nivel. Sin dato declarado, el techo se limita a un curso por encima del nivel inferido, y el primer informe al padre pide confirmar el curso |
| Colegio y editorial | Preguntas opcionales del onboarding; la editorial es la más rentable | Mapa del sistema sin afinar |
| Escuela de método (ABN o tradicional) | Una pregunta al padre: "¿en el cole suman con rejilla o con llevadas?" | Método principal de la editorial o genérico |
| Posición en el mes | Calendario | Foto del libro, cuaderno o examen la afina; otros alumnos del mismo colegio la afinan |
| Objetivo (examen, próxima lección) | El padre lo indica | Preparar la habilidad que el mapa introduce el mes que viene |

Inferencia del curso sin dato: la prueba de nivel sitúa al alumno en cada familia; el curso inferido es el más alto cuyas habilidades `introduce` domina en más de la mitad de las familias. Si contradice la edad declarada en más de un curso, se pregunta al padre.

Arranque a ciegas (ningún dato): no hay ningún campo obligatorio. La prueba de nivel es lo primero y sirve a la vez para nivel, curso y edad. Empieza en un punto neutro (habilidades de 2º–3º de primaria, que cualquier niño de 6 a 12 puede intentar), solo con mecánicas que no exigen leer (números, opciones con iconos, enunciado con audio), y sube o baja por familia. Hasta que haya inferencia se usa el registro más bajo de explicaciones y sesiones de cinco minutos: equivocarse por abajo es barato, por arriba frustra. Los valores inferidos (`curso_inferido`, `edad_estimada`, `ciclo_registro_inferido`) se guardan con su confianza y se reemplazan por cualquier dato declarado.

### 3. Prueba de nivel

Objetivo: saber, en 10–15 minutos, en qué nivel de cada familia concéntrica está el alumno, dando prioridad a lo que es prerrequisito de lo que está dando en clase.

1. Se toman las familias con habilidades en el techo del alumno (curso y mes) y se ordenan por `importancia` y por ser prerrequisito del mapa de este mes.
2. Por familia, búsqueda binaria sobre `nivel_familia`: se empieza en el nivel que el mapa espera dominado el curso anterior; acierto en producción → subir; fallo → bajar. Dos o tres ítems por familia bastan para situar el nivel.
3. Solo mecánicas de producción (teclado) o de opciones sin tiempo; nunca globos ni cronómetro.
4. Parada: cuando todas las familias prioritarias están situadas o a los 15 minutos; lo que quede se sitúa en las primeras sesiones normales.
5. Salida: `alumno_habilidad.p_dominio` inicial por habilidad de cada familia (alto para los niveles por debajo del situado, bajo por encima), y el curso inferido.
6. Se repite de forma ligera cada trimestre y cuando el mapa cambia de curso.

Prioridad de prerrequisitos: para el éxito en clase, importa más dominar lo que la lección de este mes necesita que lo que el curso pide en general. La prueba y la cascada pesan las habilidades por `importancia` × (es prerrequisito imprescindible de algo en `introduce` este mes).

### 4. Estado del alumno y cascada de decisión


#### 4.1 Suelo, techo y calendario

- **Suelo (nivel):** lo que el alumno domina ahora. Por habilidad, una probabilidad de dominio actualizada con cada intento (knowledge tracing, apéndice A). Por familia, el `nivel_familia` más alto dominado. Dice desde dónde aprender.
- **Techo (mapa):** curso, mes y orden del alumno en `mapa_curricular`. Dice hasta dónde se puede preguntar y dónde no pasarse. El objetivo inmediato (próxima lección o examen) es un punto dentro del techo.
- **Calendario (repaso espaciado):** por habilidad, fecha del próximo repaso y estabilidad (cuánto aguanta sin olvidar). Algoritmo FSRS o SM-2, apéndice A.
- **Ritmo:** duración de sesión, frecuencia de refuerzo, tolerancia a la frustración. Parámetros por alumno, con valores iniciales por edad y ajustados observando.

#### 4.2 Tablas de la capa del alumno

##### alumno

| columna | tipo | comentario |
|---|---|---|
| id | uuid PK | |
| fecha_nacimiento | date nullable | Opcional. Si falta, se usa `edad_estimada` |
| edad_estimada | smallint nullable | Inferida del nivel; con `confianza_inferencia` |
| curso_inferido | uuid FK nullable → curso | Cuando no hay curso declarado |
| confianza_inferencia | numeric nullable | 0–1 |
| sistema_id | uuid FK → sistema_educativo | |
| curso_id | uuid FK nullable → curso | Declarado por el padre; si es null, manda `curso_inferido` con techo limitado |
| colegio_id | uuid FK nullable → colegio | |
| escuela_metodo | enum nullable | Si el padre lo declara y el colegio no está dado de alta |
| editorial_mates | text nullable | La pregunta más rentable del onboarding |
| posicion_mes | smallint | Dónde va la clase; por defecto el mes actual |
| posicion_orden | integer nullable | Afinado por foto del libro, cuaderno o examen |
| posicion_fuente | enum | calendario, foto_libro, cuaderno, examen, declarado |
| objetivo | jsonb nullable | Próxima lección o examen: `{"tipo": "examen", "habilidades": [...], "fecha": ...}` |
| sesion_seg | smallint | Duración objetivo de sesión. Inicial por edad: 5 min a los 6 años, 15 a los 12 |
| refuerzo_cada | smallint | Cada cuántos aciertos hay refuerzo visible |
| tolerancia | smallint | 1–5. Cuánta frustración aguanta antes de bajar dificultad |
| idioma | text | |

##### alumno_habilidad (suelo y calendario, una fila por habilidad tocada)

| columna | tipo | comentario |
|---|---|---|
| alumno_id | uuid FK → alumno | |
| habilidad_id | uuid FK → habilidad | |
| p_dominio | numeric | 0–1. Probabilidad de que la domina (knowledge tracing) |
| estabilidad_dias | numeric | Cuánto aguanta sin repaso antes de caer por debajo del umbral |
| proximo_repaso | date | Calendario |
| intentos | integer | |
| aciertos | integer | |
| aciertos_produccion | integer | Aciertos escribiendo, que pesan más que eligiendo |
| ultimo_error_tipico_id | uuid FK nullable | Para MISMO_ERROR y para el informe al padre |
| errores_seguidos | smallint | Para BAJAR_PRERREQUISITO |
| estado | enum | no_vista, en_curso, dominada, olvidada |
| actualizado_en | timestamptz | |

##### intento (el registro de todo; lo alimenta todo lo demás)

| columna | tipo | comentario |
|---|---|---|
| id | uuid PK | |
| alumno_id | uuid FK → alumno | |
| sesion_id | uuid | Para medir duración y abandono |
| ejercicio_id | uuid FK → ejercicio | |
| habilidad_id | uuid FK → habilidad | La principal del ejercicio, desnormalizada para consultar rápido |
| mecanica_id | uuid FK → mecanica | Con qué se jugó; decide el peso del resultado |
| tecnica_id | uuid FK nullable → tecnica_practica | Qué técnica eligió este ejercicio |
| metodo_id | uuid FK nullable → metodo | Con qué método se explicó, si se explicó |
| respuesta | text | Lo que respondió |
| correcto | boolean | |
| error_tipico_id | uuid FK nullable | Detectado vía `ejercicio_error` |
| tiempo_ms | integer | |
| vio_explicacion | boolean | |
| reintento_de | uuid FK nullable → intento | Si es el intento nuevo tras una explicación |
| fecha | timestamptz | |

#### 4.3 La cascada del tutor

Para cada ejercicio que se va a mostrar, en este orden; la primera regla que aplica gana:

1. **Repaso vencido.** Si hay habilidades con `proximo_repaso` ≤ hoy, la más urgente (mayor `importancia`, menor `estabilidad`).
2. **Preparación.** Si `alumno.objetivo` o el mapa marcan una habilidad próxima en `introduce` cuyos prerrequisitos imprescindibles tienen `p_dominio` bajo, uno de esos prerrequisitos.
3. **Práctica.** Una habilidad `en_curso` dentro del techo con `p_dominio` por debajo del umbral de dominio (0,85), la de mayor `importancia`.
4. **Avance.** La siguiente habilidad del mapa dentro del techo que esté `no_vista` y tenga prerrequisitos dominados. Nunca por encima de `posicion_mes` y `posicion_orden`.
5. **Técnica.** Según el último intento en esa habilidad: fallo → técnicas `tras_fallo` por prioridad de `habilidad_tecnica` (CONMUTATIVA, VECINO, DESCOMPONER…); error típico repetido → MISMO_ERROR; tres fallos seguidos → BAJAR_PRERREQUISITO; tres aciertos seguidos → SUBIR_DIFICULTAD o FAMILIA_HECHOS. INTERCALAR limita los seguidos de la misma habilidad en toda la sesión.
6. **Ejercicio.** La técnica lo elige por `parametros`, por `ejercicio_error` o por prerrequisito, entre los publicados, con dificultad permitida por el estado en el mapa, y sin repetir uno ya visto en los últimos N intentos.
7. **Mecánica.** Compatible por formato, ponderada por `habilidad_mecanica.idoneidad`, sin cronómetro si la habilidad está en `introduce`, y alternando con la anterior para variedad.
8. **Explicación.** Si falla: `ejercicio_explicacion` del método del colegio → editorial → principal; si el error es típico, primero la correctora de `error_tipico`; si el error se repite, el método de `rol = remedio`. Después, reintento (regla 6 de la compacta).
9. **Termostato.** Si la tasa de acierto de la sesión baja del 70 %, se baja dificultad o se pasa a repaso de lo dominado; si supera el 90 %, se sube. Objetivo 80–85 % (apéndice A).
10. **Fin de sesión.** Al llegar a `sesion_seg` o a dos señales de fatiga (tiempos que se disparan, fallos en cadena), se cierra con algo dominado para terminar en acierto.

Todo intento actualiza `alumno_habilidad` (p_dominio, estabilidad, proximo_repaso) y, agregado, sirve para recalcular `habilidad_mecanica.idoneidad` y `habilidad_tecnica.prioridad` con datos.

#### 4.4 Qué sigue fuera de este módulo

- La implementación concreta del knowledge tracing y del repaso espaciado (qué parámetros, qué umbrales). Apéndice A da los algoritmos de referencia.
- Roles de usuario (padre, tutor humano) y el informe al padre; el informe se calcula desde `alumno_habilidad` e `intento`.
- La interfaz de la app, el diseño visual y la implementación de cada mecánica (proyecto de diseño aparte).
- La maquetación de los PDF (usa `ejercicio.enunciado` en markdown y `imprimible = true`).

### 5. Medir cada intento y cada sesión

Todo lo que se mide sale de `intento` y `sesion`. Lo que se guarda por intento, además de lo de la tabla: cambios de respuesta antes de confirmar (dudó), uso de pista, si vio la explicación entera o la saltó, tiempo hasta la primera interacción (se quedó bloqueado) y tiempo total. Por sesión (`sesion`: alumno, inicio, fin, mecánicas usadas, motivo de fin): duración real frente a objetivo, punto de abandono, tasa de acierto, número de explicaciones, si terminó en acierto.

Señales que el tutor lee en tiempo real:
- Acierto rápido y estable → fluidez; candidata a subir dificultad o a mecánica con tiempo.
- Acierto lento con cambios de respuesta → sabe pero no domina; más práctica sin subir.
- Fallo con error típico → explicación correctora y reintento del mismo tipo.
- Fallo sin error típico y rápido → adivinando; bajar a reconocimiento y reducir opciones.
- Tiempos que se disparan o fallos en cadena → fatiga; cerrar con algo dominado.

### 6. Cómo mejora el tutor

Tres niveles, del más barato al más caro:
1. Ajuste de parámetros con datos: umbrales (0,85 de dominio, 70–90 % del termostato), prioridades de técnicas, idoneidad de mecánicas, parámetros de FSRS. Se recalculan cada mes con los intentos acumulados.
2. Evaluación fuera de línea: con el histórico de intentos se puede simular qué habría pasado con otra cascada ("replay") antes de cambiarla en producción.
3. Pruebas A/B con cuidado: solo sobre decisiones del tutor (qué técnica, qué mecánica), nunca sobre contenido ni sobre el techo; con niños, la métrica de la prueba es aprendizaje y retención, no solo uso.

Métricas del tutor: crecimiento semanal de `p_dominio` por alumno; retención a 30 días de lo dominado; porcentaje de prerrequisitos dominados antes de que el mapa introduzca la habilidad ("llega preparado a clase"); tasa de acierto de sesión dentro de 80–85 %; abandonos intra-sesión.

### 7. Fuentes que necesita este módulo

Módulos 01 (mapa, prerrequisitos, importancia), 04 (técnicas, métodos, espaciado, knowledge tracing), 06 (enganche); literatura de tutores inteligentes (Corbett y Anderson; Koedinger; VanLehn) y de tests adaptativos (CAT); Duolingo y Smartick como referencias de producto.

### 8. Qué pedir a Paco

- Decidido: ningún dato es obligatorio; la edad se pregunta pero se puede vivir sin ella. Queda por decidir qué se le dice al padre para animarle a dar curso y editorial (propuesta: mostrar el curso inferido y pedir que lo confirme).
- Cuánto puede durar la prueba de nivel para un niño de 6 años y para uno de 12.
- Si el padre puede marcar exámenes y con cuánta antelación.


---

## Módulo 06 — Enganche: que el alumno quiera volver

### 1. Propósito

Capturar el conocimiento sobre qué hace que la gente vuelva a una app (Duolingo, juegos, redes sociales) y convertirlo en reglas que el tutor aplique al servicio del aprendizaje, con límites explícitos porque los usuarios son niños. Y medir enganche y aprendizaje juntos: el enganche que no correlaciona con aprender se elimina.

### 2. Principios (no negociables)

1. El enganche está al servicio del aprendizaje: cada mecanismo tiene que subir una métrica de aprendizaje o de retención, no solo de uso. Lo que sube uso sin subir aprendizaje, fuera.
2. Sin patrones oscuros con menores: nada de urgencia artificial, cuentas atrás falsas, castigos por no volver, compras por impulso, ni comparación pública entre niños. La normativa europea (DSA, AEPD para menores) va en esa dirección y los padres, que son los clientes, lo penalizan.
3. Sesiones cortas por diseño: el objetivo es que vuelva mañana, no que se quede hoy. Una sesión de 10 minutos que termina en acierto vale más que una de 40.
4. El padre ve todo: cualquier mecanismo de enganche que no se pueda explicar al padre en una frase no se implementa.

### 3. Base de conocimiento: mecanismos, de dónde vienen, cómo se usan aquí

| mecanismo | origen | evidencia | uso en Mates10 |
|---|---|---|---|
| Progreso visible y cercano (goal gradient) | Juegos, Duolingo, fidelización | Fuerte: el esfuerzo aumenta cerca de la meta | Barra de dominio por habilidad y por familia; "te faltan 2 para dominar la tabla del 7" |
| Racha diaria | Duolingo, Snapchat | Fuerte para hábito; riesgo de ansiedad al romperla | Racha con "escudos" que perdonan un día; nunca se pierde el progreso, solo la racha |
| Recompensa variable | Máquinas tragaperras, redes sociales | Fuerte para volver; éticamente delicada con niños | Solo en forma de sorpresa positiva no ligada a rendimiento (un personaje nuevo aparece), nunca ligada a dinero ni con frecuencia calculada para enganchar |
| Terminar en acierto (peak-end) | Psicología (Kahneman) | Fuerte: se recuerda el final | La sesión termina siempre con algo dominado |
| Autonomía: elegir | Autodeterminación (Deci y Ryan) | Fuerte a largo plazo | Elegir personaje, orden del día, mecánica cuando hay varias |
| Competencia: sentir que mejora | Autodeterminación | La más fuerte y la más honesta | Informe semanal al niño en sus palabras: "hace dos semanas no sabías esto" |
| Relación: alguien lo ve | Autodeterminación | Fuerte | El padre recibe y comenta; opcional: un adulto de referencia felicita |
| Coleccionables y avatar | Juegos infantiles | Media; se desgasta | Cosméticos ligados a dominio real de habilidades, no a tiempo de uso |
| Puntos, ligas, rankings | Duolingo, juegos | Débil o negativa a largo plazo; comparación pública daña a los que van peor | No hay rankings entre niños. Puntos solo como progreso propio |
| Notificaciones | Redes sociales | Alta a corto plazo, tóxica si abusa | Una al día máximo, en la hora en que el niño suele jugar, con contenido concreto ("hoy toca la tabla del 7"); ninguna si ya ha jugado |
| Bucle de recompensa inmediata (feed infinito) | Instagram, TikTok | Muy fuerte para uso; nula para aprendizaje | No se usa. La sesión tiene fin |
| Cambio de actividad frecuente | Juegos casuales | Media; sostiene atención | Alternancia de mecánicas dentro de la sesión (ya en el tutor) |
| Narrativa y personajes | Juegos infantiles (Prodigy, DragonBox) | Media-alta en 6–10 años | Un mundo que se descubre con el dominio; proyecto de diseño |
| Efecto Zeigarnik (lo inacabado) | Psicología | Media | "Te queda una habilidad para terminar este bloque" |

### 4. Tablas

##### mecanismo_enganche

| columna | tipo | comentario |
|---|---|---|
| id | uuid PK | |
| codigo | text único | `RACHA`, `PROGRESO_CERCANO`, `FIN_EN_ACIERTO`, `SORPRESA`, `NOTIFICACION_DIARIA`, `COLECCIONABLE` |
| nombre | text | |
| descripcion | text | |
| origen | text | Producto o literatura de donde sale |
| fuente_id | uuid FK → fuente | Archivada |
| evidencia | enum | fuerte, media, debil, negativa |
| riesgo_menores | enum | ninguno, bajo, medio, alto. Alto = no se implementa |
| parametros | jsonb | Los ajustables: escudos de racha, hora de notificación, frecuencia de sorpresa |
| edad_desde, edad_hasta | smallint | |
| estado | enum | idea, en_prueba, activo, retirado |

##### alumno_enganche (parámetros y estado por alumno; capa del alumno)

| columna | tipo | comentario |
|---|---|---|
| alumno_id | uuid FK | |
| racha_dias | integer | |
| escudos | smallint | |
| hora_habitual | time nullable | Inferida de las sesiones |
| notificaciones_permitidas | boolean | Lo decide el padre |
| mecanismos_activos | uuid[] | Qué mecanismos aplican a este alumno (por edad y por decisión del padre) |
| coleccion | jsonb | Lo que ha desbloqueado y por qué habilidad |

Cada evento de enganche (notificación enviada, racha rota, sorpresa mostrada) se registra en `evento_enganche` (alumno, mecanismo, fecha, resultado) para poder medir.

### 5. Medición: enganche y aprendizaje, juntos

Enganche: retención D1, D7, D30; sesiones por semana; duración media frente a objetivo; abandono intra-sesión; tasa de vuelta tras notificación; racha media; sesiones iniciadas por el niño frente a iniciadas por el padre (el dato que más importa: ¿lo abre solo?).

Aprendizaje: crecimiento de `p_dominio` por semana; retención a 30 días; prerrequisitos listos antes de la lección.

Regla de decisión: cada mecanismo se evalúa en las dos columnas. Sube enganche y aprendizaje → se queda. Sube enganche y baja o no toca aprendizaje → se revisa; si al mes sigue igual, se retira. Baja enganche → se retira. Y una métrica de guardia: sesiones por día por alumno; si un niño hace más de tres al día de forma sostenida, se avisa al padre, porque el objetivo no es que juegue más.

### 6. Fuentes que necesita este módulo

Duolingo (blog de ingeniería y de producto; sus experimentos con rachas y notificaciones son públicos), Nir Eyal (Hooked, con distancia crítica), la investigación sobre gamificación en educación (Hamari; Sailer), la teoría de la autodeterminación (Deci y Ryan), la literatura sobre menores y diseño persuasivo (5Rights, ICO Age Appropriate Design Code, AEPD), y observación directa de Prodigy, DragonBox, Khan Kids y Smartick. Todo archivado como fuente (módulo 07).

### 7. Qué pedir a Paco

- Su lista de líneas rojas propias además de las de arriba.
- Qué quiere que vea el niño al abrir la app (progreso, personaje, tarea del día) y qué el padre; con eso se prioriza qué mecanismos entran en la primera versión.

### Apéndice — El padre como cliente

El niño usa la app; el padre la paga. La retención del producto depende de que el padre vea, cada semana, que el aprendizaje es real. Esto no es marketing: es un requisito de diseño que afecta al banco y a la capa del alumno.

#### B.1 Lo que el padre necesita ver

1. **Que el niño aprende de verdad.** No "ha hecho 40 ejercicios" sino "hace dos semanas fallaba las restas con llevada 6 de cada 10 veces; hoy las acierta 9 de cada 10". El dato de dominio por habilidad, con su evolución, es el producto para el padre.
2. **Que está en línea con la clase.** "Esta semana en el colegio van a empezar la multiplicación; ya hemos repasado lo que necesita." El padre entiende que la app no va por libre.
3. **Que retiene.** "Esto que aprendió en octubre lo sigue sabiendo en enero." La repetición espaciada es invisible para el niño pero se le muestra al padre como prueba de que el aprendizaje dura.
4. **Dónde está el problema.** Mapa de calor de las tablas de multiplicar, lista de errores de concepto que repite. Concreto y accionable.
5. **Qué puede hacer él.** Una frase por semana: "esta semana pregúntale las tablas del 6 y del 7 en el coche". El padre se convierte en parte del método.

#### B.2 Lo que el banco debe soportar para esto

- Cada habilidad tiene un **nombre para padres**, sin jerga: "restas llevándose" mejor que "sustracción con reagrupación". Columna adicional en `habilidad`.
- Cada explicación puede tener una **versión para el adulto**: qué está aprendiendo el niño, por qué falla, cómo ayudarle sin hacerlo por él.
- Cada error típico incluye una **indicación para el padre**: cómo reconocerlo en casa y qué decirle al niño.
- El mapa curricular permite generar el mensaje "la semana que viene en clase toca X".

#### B.3 Argumentos para la comunicación del producto

- No es un juego con mates dentro: es un método con base científica (recuperación, espaciado, dominio) que se aplica a cada niño según cómo aprende y cómo olvida.
- Sigue el temario real del colegio del niño, por comunidad autónoma y por libro de texto. No le pregunta lo que aún no ha dado.
- El padre ve el progreso real por habilidad, no puntos ni estrellas.
- Diez minutos al día.

---


---

## Módulo 07 — Fuentes y trazabilidad

### 1. Propósito

Que todo lo que entra en cualquier módulo se pueda rastrear hasta el documento real que lo justifica, guardado tal cual: fotos, PDFs, páginas web, capturas de apps. Y que ese archivo sirva para comprobar que ningún ejercicio reproduce material de terceros. Es transversal: todos los módulos escriben aquí.

### 2. Tablas

##### 5.7 fuente (archivo de fuentes con trazabilidad)

La tabla `fuente` no es una etiqueta: es el registro de un documento real guardado tal cual se recibió o se encontró. Todo lo que entra en el banco (habilidad, error típico, fila del mapa, ejercicio) apunta a una fuente y, cuando procede, a una página o fragmento concreto de ella.

| columna | tipo | comentario |
|---|---|---|
| id | uuid PK | |
| tipo | enum | libro_texto, decreto, kumon, web_editorial, programacion_centro, foto_padre, cuaderno, examen, profesor, otro |
| titulo | text | "Matemáticas 1º ESO, Edelvives, proyecto Fanfest, ed. 2022" |
| editorial | text nullable | |
| isbn | text nullable | |
| curso_id | uuid FK nullable | |
| sistema_id | uuid FK nullable | Para decretos y programaciones |
| anio | integer nullable | Edición o publicación |
| origen | enum | foto_usuario, busqueda_web, descarga_oficial, aportado_equipo, aportado_profesor |
| url_original | text nullable | De dónde se descargó, si aplica |
| capturado_en | timestamptz | Cuándo se recibió o descargó |
| capturado_por | text | Persona, agente o modelo que lo incorporó |
| confianza | enum | alta (documento oficial o libro físico), media (muestra parcial, tienda), baja (deducido de terceros) |
| notas | text nullable | |

##### 5.7b fuente_archivo (los ficheros tal cual)

Una fuente puede tener varios archivos (las 22 fotos de un libro, el HTML y el PDF de una web). Cada archivo se guarda sin modificar.

| columna | tipo | comentario |
|---|---|---|
| id | uuid PK | |
| fuente_id | uuid FK → fuente | |
| ruta | text | Ruta en el almacenamiento (Supabase Storage o carpeta `fuentes/raw/` del repo, según tamaño) |
| tipo_archivo | enum | foto, pdf, html, captura_pantalla, texto_extraido |
| pagina_o_seccion | text nullable | "pág. 20", "índice", "unidad 7 ejercicios" |
| hash_sha256 | text | Para detectar duplicados y probar que no se ha alterado |
| tamano_bytes | bigint | |
| derivado_de | uuid FK nullable → fuente_archivo | Si es un texto extraído (OCR, parseo), de qué original sale |
| orden | smallint | Para mantener la secuencia de páginas fotografiadas |

Reglas del archivo:
- El original nunca se edita ni se recorta. Si hace falta una versión legible, se crea otro `fuente_archivo` con `derivado_de` apuntando al original.
- Una página web se guarda tres veces: HTML capturado, captura de pantalla o PDF, y texto extraído. Las webs de editoriales cambian cada curso; el enlace por sí solo no vale como fuente.
- Una foto enviada por Paco o por un padre se guarda con el nombre original, la fecha de captura y, si el móvil la incluye, la fecha EXIF.
- Todo lo que un agente encuentre por búsqueda web se archiva en el mismo turno en que lo usa. Si no se puede archivar, no se puede usar como fuente: se anota en `notas` y se marca `confianza = baja`.
- El archivo de fuentes es interno. No lo consume la app ni se expone a clientes; contiene material con derechos de terceros que solo se usa para investigación y desarrollo.

##### 5.7c habilidad_fuente (varias fuentes por habilidad)

Cuando una habilidad tiene varias fuentes (el decreto la define, el libro la sitúa, Kumon la afina), la fuente principal va en `habilidad.fuente_id` y las demás aquí.

| columna | tipo | comentario |
|---|---|---|
| habilidad_id | uuid FK → habilidad | |
| fuente_id | uuid FK → fuente | |
| fuente_ref | text nullable | Página o sección |
| rol | enum | define, situa, afina, contradice |
| nota | text nullable | Obligatoria si `rol = contradice`: qué dice esta fuente, qué dice la principal y qué se decidió |

El rol `contradice` es el más valioso: registra dónde las fuentes no coinciden y qué se decidió, que es justo lo que un agente no puede decidir solo.

Resumen de trazabilidad: `habilidad`, `error_tipico`, `mapa_curricular` y `ejercicio` llevan `fuente_id` y `fuente_ref` en su propia tabla (ver cada una); `habilidad_prerrequisito` y `mecanica` llevan `fuente_id` opcional. En `ejercicio` la fuente indica qué inspiró el tipo de ejercicio, nunca que el ejercicio proceda de ahí (regla de no reproducción, 5.9).

### 3. Tipos de fuente por módulo

| módulo | tipos habituales |
|---|---|
| 01 Contenido | decreto, libro_texto, kumon, cuaderno (Rubio), programacion_centro, web_editorial, competencia, profesor, foto_padre |
| 02 Ejercicios | ejercicio_modelo (los escritos a mano), y los textos extraídos para la comprobación de copia |
| 03 Mecánicas | captura_app, material_aula, catalogo |
| 04 Didáctica | manual_didactica, material_metodo (ABN, Singapur), articulo_cientifico |
| 05 Tutor | articulo_cientifico, documentacion_producto |
| 06 Enganche | documentacion_producto, articulo_cientifico, normativa |

`fuente.tipo` es un enum abierto: se amplía cuando aparece un tipo nuevo, sin cambiar nada más.

### 4. Proceso

**Regla transversal de las tres minas: nada entra sin fuente archivada.** Todo agente que incorpore una habilidad, un error, una fila del mapa o una mecánica debe (1) archivar primero el material en `fuente` y `fuente_archivo`, (2) crear la fila del banco apuntando a esa fuente, y (3) si hay contradicción con otra fuente ya archivada, registrarla en `habilidad_fuente` con rol `contradice` y dejar la decisión en `notas`. En el repo, el material crudo vive en `fuentes/raw/<fuente_id>/` y los textos extraídos en `fuentes/text/<fuente_id>/`; los ficheros grandes (fotos, PDFs) van a Supabase Storage con la misma estructura de carpetas.

Estructura en el repo: `fuentes/raw/<fuente_id>/` para el original, `fuentes/text/<fuente_id>/` para el texto extraído, `fuentes/index.md` generado con una línea por fuente (tipo, título, fecha, confianza, módulos que la usan). Los ficheros grandes van a Supabase Storage con las mismas rutas.

Un agente que encuentra algo por búsqueda web hace, en este orden: descargar, guardar HTML, guardar captura o PDF, extraer texto, calcular hash, crear `fuente` y `fuente_archivo`, y solo entonces usar el contenido. Si algún paso falla, la fuente se marca `confianza = baja` y se anota qué faltó.

### 5. Medición y mejora

- Filas de cualquier módulo sin `fuente_id` (debería ser cero salvo lo generado por código).
- Fuentes sin ningún uso (archivadas y nunca referenciadas).
- Contradicciones abiertas (`habilidad_fuente.rol = contradice` sin `nota`).
- Coincidencias de copia detectadas por el validador, por fuente.

### 6. Qué pedir a Paco

- Que toda foto o documento que aporte venga con lo mínimo: qué es, de qué editorial o autor, de qué curso. El agente rellena el resto.
- Confirmar que el archivo es solo interno y quién tiene acceso.


---

## Módulo 08 — Aplicaciones y alcance de la primera entrega

### 1. Propósito

Tres aplicaciones web que se ven en el móvil y comparten la misma base de datos en Supabase: la del alumno, la del padre y la del revisor. Esta primera entrega no busca producto terminado; busca que Paco pueda entrar desde una URL, crear alumnos, jugar, ver el informe de padre y aprobar ejercicios, sobre contenido real minado al máximo detalle posible para España.

### 2. Decisiones de alcance de esta entrega

- Sin autenticación. El alumno escribe su nombre y queda guardado; se puede elegir entre los alumnos creados desde una pantalla de inicio. El padre y el revisor entran por sus propias rutas sin contraseña. Todo esto se cambiará después; ahora no es el problema.
- Una sola mecánica: OPCIONES con una única respuesta correcta y cuatro opciones, sin tiempo. El resto del catálogo de mecánicas queda especificado pero no construido.
- Contenido: España completa a nivel de decreto (las 17 comunidades más Ceuta y Melilla), todos los cursos de 1º de primaria a 2º de bachillerato en la taxonomía; ejercicios primero para primaria completa, luego ESO, luego bachillerato, en ese orden y hasta donde llegue el tiempo. Colegios: lista completa de la Región de Murcia cargada desde el registro oficial de centros; el resto de comunidades se cargan bajo demanda con el mismo proceso.
- Look and feel: el de Claude. Fondo oscuro o neutro, tipografía simple, un color de acento, sin gradientes ni decoración, menús sencillos, todo pensado para móvil primero. En la app del niño puede haber más color en los elementos de juego, pero la estructura es la misma.
- Explicaciones con el método principal de cada habilidad; los métodos alternativos (ABN) se generan solo para las familias de suma y resta de primaria como prueba.
- Prueba de nivel activa al crear el alumno, sin datos obligatorios, según el módulo 05.
- Informe al padre calculado en vivo desde `alumno_habilidad` e `intento`; no hace falta correo ni notificaciones todavía.
- Enganche: solo progreso visible por habilidad y familia, terminar la sesión en acierto y sesión corta. Nada más en esta entrega.

### 3. App del alumno

Pantallas: inicio (elegir alumno o crear uno con el nombre), prueba de nivel si es nuevo, sesión de juego (10–15 preguntas con OPCIONES, alternando habilidades según la cascada del tutor, explicación al fallar y reintento, termina en acierto), progreso (barras por familia y por bloque, en palabras de niño), y un botón para salir. Todo intento se registra con tiempo, cambios de respuesta y si vio la explicación.

### 4. App del padre

Pantallas: elegir alumno; ficha (edad, curso declarado o inferido con su confianza, colegio, editorial, método del colegio; todo editable, y al editarlo se recalcula el techo); informe (dominio por bloque y familia con evolución de dos semanas, errores típicos que repite, próximos repasos, prerrequisitos de lo que viene en el mapa el mes que viene, y una frase de "qué puedes hacer esta semana"); y marcar un examen o una lección próxima como objetivo.

### 5. App del revisor

Es la que faltaba en el modelo. Es la herramienta con la que una persona aprueba lo que la app va a mostrar.

Pantallas: cola de revisión (plantillas y ejercicios con `validado_automatico = true` y `revisado_por` nulo, filtrable por curso, bloque, habilidad, formato y generador); ficha de revisión (el ejercicio tal como lo vería el niño, con respuesta, distractores y a qué error apunta cada uno, explicación por método, parámetros, habilidad y su definición y ejemplo frontera al lado; botones aprobar, rechazar con motivo de una lista cerrada más texto libre, y editar en el sitio); revisión de plantilla (la plantilla con veinte instancias al azar; aprobar la plantilla marca `revision_tipo = heredada` en sus instancias por código); revisión de habilidades (definición, prerrequisitos, errores típicos, con aprobar y comentar); y estadísticas (cobertura por curso y bloque, tasa de aceptación por lote y motivo, lo pendiente).

Tablas nuevas: `revision` (id, objeto_tipo: plantilla | ejercicio | habilidad | explicacion, objeto_id, revisor, decision: aprobado | rechazado | editado, motivo, texto, fecha) y `revisor` (id, nombre). Los motivos de rechazo cerrados: fuera_de_frontera, respuesta_incorrecta, distractor_ambiguo, explicacion_incorrecta, registro_inadecuado, copia, otro.

### 6. Entregables de esta fase

1. Repositorio en GitHub con el código, las migraciones SQL, las skills de generación y validación, la carpeta `fuentes/` y un `DECISIONES.md` con cada decisión tomada sin preguntar.
2. Base de datos en Supabase con todas las tablas de los módulos 01 a 08 cargadas con lo minado.
3. Una URL desde la que se entra a las tres aplicaciones.
4. Un Excel con una hoja por tabla principal (habilidades, mapa, ejercicios, métodos, técnicas, mecanismos de enganche, fuentes, decisiones) y hojas resumen tipo tabla dinámica: habilidades por curso y bloque, ejercicios por habilidad y estado de revisión, cobertura del mapa por comunidad y curso, fuentes por tipo y módulo.


---

## Anexo — Caso de uso con datos reales (Edelvives, 1º ESO, unidad 1)



Fuente: Matemáticas 1º ESO, Edelvives, proyecto Fanfest. Unidad 1, Números naturales (págs. 10–29). Fotos del 29 sep 2026.

Objetivo: ver el modelo v0.2 funcionando con datos reales, tabla a tabla, para que Paco lo comente. No es contenido definitivo.

---

### 0. Lo que el libro me dice antes de rellenar nada

- El índice tiene 13 unidades. Un curso son unos 33 semanas lectivas, así que salen unas 2,5 semanas por unidad. Primer trimestre ≈ unidades 1–5 (naturales, divisibilidad, enteros, fracciones, decimales). Esto es lo que va a `mapa_curricular` como hipótesis, hasta que una foto o un profesor diga otra cosa.
- Cada sección del libro lleva "Practicar y avanzar N–M": la sección 1 usa los ejercicios 1–11, la 2 los 12–18, la 6 los 57–79, la 7 los 80–85, la 8 los 86–99. Eso es un mapeo gratuito de ejercicio → sección → habilidad. Un agente puede extraerlo de cualquier libro de esta editorial sin criterio humano.
- Los ejercicios marcados con ✚ y ✚✚ son de mayor dificultad. Es la columna `dificultad` ya resuelta por la editorial.
- Una sección del libro no es una habilidad. La sección 7 "Operaciones combinadas" son al menos tres habilidades (sin paréntesis, con paréntesis, con potencias y raíces), y los ejercicios 80, 81/82 y 64 lo demuestran: están separados justo por eso.

---

### 1. Banco 1 — Habilidades extraídas de la unidad 1

Solo el bloque de operaciones, que es el que vamos a seguir en el caso de uso. La unidad completa daría unas 20 habilidades.

| codigo | nombre | definicion (resumida) | ejemplo_frontera | ejemplo_fuera | sección libro |
|---|---|---|---|---|---|
| NUM.LECT.03 | Lectura y escritura de naturales hasta 9 cifras | Leer, escribir y dar el valor posicional de una cifra en números hasta cientos de millones | 120 875 780 | 345 423 049 000 000 (billones → NUM.LECT.04) | 1, ej. 1–5 |
| NUM.ORD.02 | Orden y recta numérica con naturales de cualquier tamaño | Comparar, ordenar y situar en la recta números de distinto número de cifras | 999 472 > 989 647 | Ordenar enteros negativos (unidad 3) | 2, ej. 12–15 |
| OPER.DIV.03 | División entera con divisor de 2–3 cifras, cociente y resto | Dividir naturales con divisor de hasta 3 cifras indicando resto; comprobar D = d·c + r | 43 764 : 368 | Dividir decimales (unidad 5) | 4.2, ej. 26 |
| OPER.POT.01 | Potencias de base natural: cálculo | Calcular a^n con a y n naturales pequeños | 2^10 = 1024 | Potencias de base negativa (unidad 3) | 5.1 |
| OPER.POT.02 | Propiedades de potencias: misma base, mismo exponente, potencia de potencia | Reducir a potencia única usando las tres propiedades | (18^4·18^8):(3^5·3^7) | Exponente negativo o cero como caso general (2º ESO) | 5.2–5.3, ej. 44–56 |
| OPER.RAIZ.01 | Cuadrado perfecto y raíz cuadrada exacta | Reconocer cuadrados perfectos y calcular su raíz | √961 = 31 | Raíz con resto (RAIZ.02) | 6.1–6.2, ej. 57–63 |
| OPER.RAIZ.02 | Raíz cuadrada entera por tanteo, con resto | Calcular la raíz entera y el resto; prueba de la raíz | √5 525 por tanteo | Algoritmo de la raíz (RAIZ.03) | 6.3, ej. 69–74 |
| OPER.RAIZ.03 | Algoritmo de la raíz cuadrada | Aplicar el algoritmo separando de dos en dos cifras | √324 912 | Raíces de decimales | 6.3, ej. 75 |
| OPER.JERARQ.01 | Jerarquía sin paréntesis: producto/cociente antes que suma/resta | Resolver expresiones con +, −, ·, : sin paréntesis, de izquierda a derecha dentro del mismo nivel | 7·11 + 67 − 24:3 | Cualquier expresión con paréntesis (JERARQ.02) | 7, ej. 80 |
| OPER.JERARQ.02 | Jerarquía con paréntesis y corchetes | Igual que 01 añadiendo paréntesis y corchetes anidados | 5·[(35−7):4 + 88:8] | Expresiones con potencias o raíces (JERARQ.03) | 7, ej. 81–83 |
| OPER.JERARQ.03 | Jerarquía con potencias y raíces | Igual que 02 añadiendo potencias y raíces en el nivel 2 | 8^3 : (√25 + 3) − √49 | Con enteros negativos (unidad 3) | 7, ej. 64 |
| PROB.COMB.01 | Problema de enunciado resuelto con una operación combinada | Traducir un enunciado a una única expresión con jerarquía y resolverla | Ej. 97d (plantas de Eve, Louise, Michael, Eric) | Problemas con ecuaciones (unidad 8) | 8, ej. 86–93, 97 |

Los `nombre_padres` irían aparte: "Operaciones con paréntesis", "Raíces cuadradas que no salen exactas", etc.

---

### 2. Habilidad de referencia para el caso de uso: OPER.JERARQ.02

#### 2.1 Fila completa en `habilidad`

| columna | valor |
|---|---|
| codigo | OPER.JERARQ.02 |
| bloque | operaciones |
| nombre | Operaciones combinadas con paréntesis y corchetes (sin potencias ni raíces) |
| nombre_padres | Operaciones con paréntesis |
| definicion | Resolver una expresión con naturales que combina suma, resta, multiplicación y división exacta, con paréntesis y corchetes anidados hasta dos niveles. Se aplica: primero paréntesis (del más interno al más externo), luego · y : de izquierda a derecha, luego + y − de izquierda a derecha. No aparecen potencias, raíces, decimales ni negativos. Todos los resultados intermedios son naturales. |
| parametros | {"operaciones": ["+","-","*","/"], "parentesis": true, "niveles_anidamiento_max": 2, "potencias": false, "raices": false, "max_operando": 1000, "resultados_intermedios": "naturales"} |
| ejemplo_frontera | 5·[(35−7):4 + 88:8] = 90 |
| ejemplo_fuera | √36 + 2^4 − 9 (tiene raíz y potencia → JERARQ.03) |
| nivel_kumon | C–D (aprox.) |
| activo | true |

#### 2.2 Prerrequisitos (`habilidad_prerrequisito`)

| prerrequisito_id | peso | por qué |
|---|---|---|
| OPER.JERARQ.01 | imprescindible | Si no domina "primero · y : luego + y −" sin paréntesis, los paréntesis solo añaden ruido |
| OPER.MULT.02 (tablas hasta 10, fluidez) | imprescindible | 7·6, 3·8, 5·9 tienen que ser automáticos; si no, la carga mental se va al cálculo y no a la jerarquía |
| OPER.DIV.01 (división exacta con divisor de 1 cifra) | imprescindible | 12:3, 88:8, 68:4 |
| OPER.RESTA.03 (resta de naturales de 2–3 cifras, con llevada) | recomendable | 45−14, 744−(572−428) |

Para "preparar la próxima lección": si el mapa dice que JERARQ.02 se introduce la semana que viene, la app repasa esta semana JERARQ.01, tablas y divisiones exactas. Todo está ya permitido.

#### 2.3 Errores típicos (`error_tipico`)

Sacados directamente del ejercicio 85 del libro ("explica cuál es el error"), que es una mina de errores típicos ya catalogados por la editorial.

| codigo | nombre | descripcion (cómo se manifiesta) | explicacion_nino | indicacion_padres |
|---|---|---|---|---|
| JERARQ.02.E01 | Izquierda a derecha ignorando jerarquía | 7 − 3·2 = 8 (hace 7−3=4, luego 4·2) | "Las multiplicaciones y divisiones van antes que las sumas y restas, aunque estén después en la fila. Primero 3·2 = 6, y luego 7 − 6 = 1." | Si al leer la operación tu hijo va haciendo lo primero que ve, pídele que subraye las multiplicaciones y divisiones antes de empezar. |
| JERARQ.02.E02 | Resta antes que división | 24 : 8 − 2 = 4 (hace 8−2=6, luego 24:6) | "La división manda sobre la resta. Primero 24 : 8 = 3, y luego 3 − 2 = 1." | Mismo patrón que E01 pero con división; suele aparecer cuando la resta está "pegada" al divisor. |
| JERARQ.02.E03 | Multiplicación antes que división (mismo nivel) | 100 : 10 · 5 = 2 (hace 10·5=50, luego 100:50) | "Multiplicar y dividir tienen la misma fuerza: se hacen en orden, de izquierda a derecha, como se lee. Primero 100 : 10 = 10, luego 10 · 5 = 50." | Este error es muy común y no lo corrige la regla "multiplica antes"; hay que insistir en "mismo nivel = de izquierda a derecha". |
| JERARQ.02.E04 | Paréntesis resuelto pero factor olvidado | 45 − 2·(3+4) = 45 − 7 = 38 (resuelve el paréntesis y se olvida del 2) | "Muy bien el paréntesis: 3 + 4 = 7. Pero ese 7 va multiplicado por 2: 2·7 = 14. Y ahora 45 − 14 = 31." | Al resolver un paréntesis, que escriba el resultado sustituyéndolo en la expresión completa, no en un lateral. |
| JERARQ.02.E05 | Multiplica solo el primer término del paréntesis | 2·(3+4) = 2·3 + 4 = 10 | "El paréntesis es un bloque: se resuelve entero antes de multiplicar. 3 + 4 = 7, y 2·7 = 14." | Es el germen del error con la propiedad distributiva que aparecerá en 2º ESO; conviene atajarlo ahora. |

#### 2.4 Sitio en el mapa curricular

| columna | valor |
|---|---|
| sistema_id | ES-MC (Región de Murcia) |
| colegio_id | (el colegio de María; fila de colegio porque viene de su libro concreto) |
| curso_id | ESO1 |
| trimestre | 1 |
| mes | 10 (octubre; la unidad 1 ocupa aprox. las tres primeras semanas, la sección 7 cae al final) |
| habilidad_id | OPER.JERARQ.02 |
| estado | introduce |
| fuente_id | Edelvives 1º ESO Fanfest, unidad 1 sección 7, pág. 20 |
| nota | En 6º de primaria ya se ve jerarquía sin paréntesis (JERARQ.01 estaría en `repasa`); JERARQ.02 se introduce formalmente aquí. Confirmar con el decreto de Murcia. |

Y una segunda fila, misma habilidad, `mes = 11`, `estado = consolida`, porque a partir de la unidad 2 se usa sin explicarse.

---

### 3. Banco 2 — Cuatro ejercicios de OPER.JERARQ.02 en formatos distintos

#### Ejercicio A — formato `numerico` (del ej. 82a del libro)

| columna | valor |
|---|---|
| formato | numerico |
| dificultad | 1 |
| enunciado | Calcula: 45 − 2 · (3 + 4) |
| respuesta | ["31"] |
| distractores | [{"valor": "38", "error_tipico_id": "JERARQ.02.E04"}, {"valor": "301", "error_tipico_id": "JERARQ.02.E01"}, {"valor": "35", "error_tipico_id": "JERARQ.02.E05"}] |
| explicacion_nino | Primero el paréntesis: 3 + 4 = 7. Ahora la expresión es 45 − 2 · 7. La multiplicación va antes que la resta: 2 · 7 = 14. Por último, 45 − 14 = 31. |
| explicacion_adulto | Este ejercicio comprueba dos cosas a la vez: que resuelve el paréntesis primero y que después no se olvida de multiplicar su resultado. El error más frecuente es llegar a 45 − 7 = 38, es decir, hacer bien el paréntesis y perder el 2 por el camino. |
| ciclo_registro | secundaria |
| idioma | es-ES |
| imprimible | true |
| generado_por | manual / Edelvives 1º ESO ej. 82a |

`ejercicio_habilidad`: principal OPER.JERARQ.02; secundarias OPER.MULT.02, OPER.RESTA.03.

Cómo se calculan los distractores (esto lo haría el generador, no una persona): 38 = aplicar E04; 301 = aplicar E01 (45−2 = 43, 43·7); 35 = aplicar E05 (2·3 + 4 = 10, 45 − 10). Cada distractor es "la respuesta que obtendrías si cometieras ese error", y por eso al elegirlo la app sabe qué explicación dar.

#### Ejercicio B — formato `opcion_multiple` con varias correctas (del ej. 83)

| columna | valor |
|---|---|
| formato | opcion_multiple |
| dificultad | 2 |
| enunciado | ¿Cuáles de estas colocaciones de paréntesis hacen que la igualdad sea correcta? Elige todas las que valgan. |
| datos | {"expresion_base": "3 + 42 − 12 : 3 = 13"} |
| respuesta | ["3 + (42 − 12) : 3"] |
| distractores | [{"valor": "(3 + 42 − 12) : 3", "nota": "da 11"}, {"valor": "3 + 42 − (12 : 3)", "nota": "da 41, es lo mismo que sin paréntesis"}, {"valor": "(3 + 42) − 12 : 3", "nota": "da 41"}] |
| explicacion_nino | Prueba cada opción. 3 + (42 − 12) : 3 = 3 + 30 : 3 = 3 + 10 = 13. Es la buena. (3 + 42 − 12) : 3 = 33 : 3 = 11, no. Las otras dos dan 41 porque los paréntesis no cambian nada. |
| explicacion_adulto | Aquí no se calcula, se razona hacia atrás: qué agrupación produce el resultado dado. Exige tener la jerarquía tan clara como para manipularla. Es más difícil que el ejercicio A aunque los números sean parecidos. |

Aquí hay solo una correcta; una variante con el "= 41" tendría dos correctas ("sin paréntesis" y "3 + 42 − (12:3)"), que es el tipo de pregunta que Paco quería.

#### Ejercicio C — formato `verdadero_falso` (del ej. 85c)

| columna | valor |
|---|---|
| formato | verdadero_falso |
| dificultad | 1 |
| enunciado | ¿Es correcta esta operación? 100 : 10 · 5 = 2 |
| respuesta | ["falso"] |
| ejercicio_error | si responde "verdadero" → JERARQ.02.E03 |
| explicacion_nino | Multiplicar y dividir valen lo mismo, así que van en orden de izquierda a derecha: 100 : 10 = 10, y 10 · 5 = 50. El 2 sale de hacer primero 10 · 5, y eso es saltarse el orden. |

Este formato es barato de generar (se toma cualquier ejercicio numérico y se le aplica un error típico) y detecta un error concreto con una sola pregunta.

#### Ejercicio D — formato `texto_corto` / problema (del ej. 97b)

| columna | valor |
|---|---|
| formato | numerico |
| dificultad | 2 |
| enunciado | En una granja hay 36 gallinas y 40 conejos. ¿Cuántas patas hay en total? |
| respuesta | ["232"] |
| distractores | [{"valor": "76", "nota": "suma animales, no patas"}, {"valor": "304", "nota": "todo con 4 patas"}, {"valor": "152", "nota": "todo con 2 patas"}] |
| explicacion_nino | Las gallinas tienen 2 patas y los conejos 4. Gallinas: 36 · 2 = 72. Conejos: 40 · 4 = 160. Total: 72 + 160 = 232. En una sola línea: 36 · 2 + 40 · 4 = 232. |

`ejercicio_habilidad`: **principal PROB.COMB.01**, secundarias OPER.JERARQ.01 y OPER.MULT.03. La habilidad principal no es la jerarquía sino traducir el enunciado; por eso este ejercicio no sirve para evaluar JERARQ.02 aunque la use. Este es el punto que Paco planteó con (2+5)·4: sí, un ejercicio ejercita varias habilidades, pero solo una es la que se está midiendo.

---

### 4. Banco 3 — Qué mecánicas pueden jugar cada ejercicio

| | OPCIONES | TECLADO | GLOBOS | EMPAREJAR | PAPEL |
|---|---|---|---|---|---|
| **A** 45 − 2·(3+4) (numerico, con distractores) | Sí | Sí | **No en octubre** (JERARQ.02 está en `introduce`; en noviembre, `consolida`, sí) | Sí (expresión ↔ resultado, con 4 pares) | Sí |
| **B** colocar paréntesis (opcion_multiple, respuestas largas) | Sí | No (la respuesta no es un número) | No (los globos no pueden llevar expresiones largas: `edad_minima` y legibilidad) | No | Sí |
| **C** ¿es correcta? (verdadero_falso) | Sí (2 opciones) | No | Sí en `consolida`, porque es rápido y binario | No | Sí |
| **D** gallinas y conejos (numerico, problema) | Sí | Sí (es el formato natural: leer y escribir) | **No nunca**: un problema de enunciado no se juega con tiempo | No | Sí |

Lo que decide cada celda es mecánico, no de gusto: el `formato` del ejercicio contra `formatos_admitidos` de la mecánica, el `estado` en el mapa contra `tiempo` de la mecánica, y la longitud/legibilidad de las opciones contra las restricciones de la mecánica.

Y la parte que sí es de medición: el mismo ejercicio A jugado con TECLADO (`mide = produccion`) pesa más que con OPCIONES (`mide = reconocimiento`). La capa del alumno no da por dominada JERARQ.02 hasta ver aciertos en producción.

---

### 5. Frontera en acción: qué puede ver María el 15 de octubre

Entrada: ES-MC, ESO1, T1, mes 10, colegio de María.

1. Filas de `mapa_curricular` con (trimestre, mes) ≤ (1, 10): todas las habilidades de la unidad 1 (las 12 de la sección 1) más lo que arrastra de primaria en `repasa`.
2. Ejercicio A: habilidades JERARQ.02 (introduce, oct), MULT.02 (repasa), RESTA.03 (repasa) → **permitido**, dificultad máxima 1 porque la principal está en `introduce`. Ejercicio A tiene dificultad 1 → entra.
3. Ejercicio B: JERARQ.02 en `introduce` pero dificultad 2 → **no todavía**. Entra en noviembre.
4. Ejercicio 64 del libro (√900 : √9 · 2^5 · 5^5): JERARQ.03 → depende de si el mapa la tiene en octubre. En el libro está en la misma unidad, así que sí, pero al final. Con `mes` a secas no se distingue; con `semana` o con la foto del libro, sí.
5. Un ejercicio de ecuaciones de primer grado (unidad 8, marzo): **no permitido** aunque María sea capaz. La app no adelanta al temario.
6. Preparar la próxima lección (unidad 2, múltiplos y divisores, principios de noviembre): sus prerrequisitos son OPER.DIV.03 (división con resto) y OPER.MULT.02 → la app los machaca la última semana de octubre. Eso es lo que el padre ve como "esta semana estamos preparando lo que viene".

---

### 6. Lo que este caso de uso me hace cambiar en el modelo

1. **`mes` no basta**: dentro de una unidad de tres semanas hay orden (sección 1 → 8), y JERARQ.03 va después que JERARQ.02. Propongo añadir `orden` (entero) a `mapa_curricular`, o bien `semana_estimada`. La foto del libro fija ese orden con precisión.
2. **Los ejercicios tipo "corrige el error" (85, 47, 54, 55, 71, 73) son un formato propio**: se le da una operación resuelta mal y tiene que decir si es correcta y corregirla. Es `verdadero_falso` más un `numerico` encadenado. Propongo formato `corrige` con `respuesta = {"es_correcta": false, "valor_correcto": "50"}`.
3. **Los distractores se generan aplicando errores típicos**, no inventándolos. Eso convierte `error_tipico` en la pieza más valiosa del banco 1, más que la definición de la habilidad. Habría que priorizar la mina de errores.
4. **Ejercicios con más de un apartado (a, b, c…)**: el libro los agrupa por contexto (el camión de Héctor, ej. 88). Para la app son ejercicios independientes que comparten `datos.contexto`. Propongo `grupo_id` opcional en `ejercicio` para poder presentarlos juntos en PDF y separados en la app.
5. **Los ejercicios abiertos del libro (94, 96, 99: investiga, redacta, presenta a la clase) no van al banco**. Son de aula, no de app. Solo se guardan como `formato = abierto` si algún día hay revisión por adulto.

---

### 7. Preguntas y respuestas (29 sep 2026)

**1. Granularidad JERARQ.01/02/03.** Paco: de acuerdo. Se mantiene: tres habilidades separadas, no una con parámetros.

**2. ¿Conoce Claude los niveles de Kumon?** La estructura general sí: 7A–4A (contar, secuencias numéricas), 3A–2A (suma, primeras restas), A–B (suma y resta horizontal y vertical), C (multiplicación y división), D (multiplicación y división largas), E–F (fracciones y decimales), G (enteros, iniciación al álgebra), H (ecuaciones lineales y sistemas), I (factorización, cuadráticas, Pitágoras), J–L (álgebra avanzada, funciones, logaritmos, iniciación al cálculo), M–O (trigonometría y cálculo). Cada nivel son 200 hojas divididas en bloques de 10. Lo que no tengo con fiabilidad es el detalle por bloque de hojas: qué hoja concreta introduce la llevada, en qué bloque aparece la división con resto. Y eso es justo la granularidad que sirve para la taxonomía. Conclusión: la tabla de niveles de Kumon sigue haciendo falta; `nivel_kumon` se queda en el modelo pero se rellena cuando tengamos la tabla, no de memoria.

**Pregunta añadida: ¿todo lo del libro de Edelvives lo sabía ya Claude o podía saberlo?** Respuesta honesta, en dos partes.

Lo que sí podía generar sin el libro: la lista de habilidades de 1º ESO (el currículo LOMLOE y los contenidos estándar los conozco), los prerrequisitos entre ellas, los errores típicos de jerarquía de operaciones (son los mismos en cualquier libro y en cualquier país), y ejercicios equivalentes. La sección 1 y la 2 del caso de uso las habría escrito casi iguales sin fotos.

Lo que no podía saber sin el libro: cómo esta editorial reparte el curso en 13 unidades y en qué orden, qué secciones tiene cada unidad, qué ejercicios existen y con qué numeración, cuáles marca como difíciles, y qué se da antes de qué dentro de una unidad. Es decir, todo lo que va a `mapa_curricular` con `colegio_id` o con `fuente_id = libro`.

Una salvedad: mi conocimiento del currículo es fiable en los contenidos pero puede equivocarse en la frontera entre cursos (por ejemplo, si el algoritmo de la raíz cuadrada es de 1º o de 2º ESO, o si en Murcia se ve en primaria). Ahí el libro o el decreto son los que mandan.

Consecuencia para las minas: la taxonomía (mina 1, parte de habilidades) se puede generar mayormente desde el decreto y el conocimiento del modelo, con revisión humana en las fronteras dudosas. Los libros hacen falta sobre todo para el mapa (cuándo y en qué orden) y para validar la taxonomía, no para crearla. Eso reduce mucho el trabajo de fotografiar libros: hace falta el índice completo y las páginas de "Practicar y avanzar" de cada unidad, no la teoría.

**3. Referencia al ejercicio del libro.** Paco: no se conserva. `generado_por` guardará modelo/prompt/versión o "algoritmo", y los ejercicios serán variantes propias, no copias del libro. La fuente se guarda a nivel de `mapa_curricular` (qué libro dice que esta habilidad va en este momento), no a nivel de ejercicio.

**4. `orden` / `semana_estimada` en el mapa.** Paco: de acuerdo. Se añade `orden` (entero, posición de la habilidad dentro del curso según la fuente) a `mapa_curricular`. `semana_estimada` se puede derivar de `orden` y del número total de habilidades del curso, así que no hace falta guardarla.

**5. Formato `corrige`.** Paco: no lo sabe. Propuesta para no decidir ahora: no crear el formato. Se implementa como dos ejercicios encadenados por `grupo_id`: un `verdadero_falso` ("¿es correcta esta operación?") seguido de un `numerico` ("escribe el resultado correcto") que solo se muestra si acertó que era falsa. Si con el uso se ve que la pareja se repite mucho, se convierte en formato propio. Coste de cambiar de opinión después: bajo.
