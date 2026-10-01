# Mates10 — Decisiones

Registro de toda decisión tomada sin preguntar a Paco: fecha, qué se decidió y por qué.
Las respuestas de Paco se anotan como tales. Formato: `D-NNN · fecha · área`.

## Respuestas de Paco (fase 0)

- **30 sep 2026.** Vale el prefijo `mates10_` y la carpeta `mates10/`, siempre que no choque con nada (comprobado: ninguna tabla, función ni bucket con ese prefijo en el proyecto compartido).
- **30 sep 2026.** El repo no es público; el archivo de fuentes debe ser privado.
- **30 sep 2026.** De momento no aporta fotos, Kumon, Rubio ni libros: se busca todo lo posible por web y se incorpora lo suyo cuando llegue.
- **30 sep 2026.** Pide métodos de aprendizaje tipo Duolingo (y similares) en la base de conocimiento: se cubren en la fase 3 (técnicas de práctica y mecanismos de enganche, con fuente) y en "Propuestas".
- **30 sep 2026.** Pide una URL para navegar todas las tablas con relaciones, filtros y tabla dinámica, y lo mismo en Excel: `mates10/explorar/` y el `.xlsx` con tablas dinámicas.

## Decisiones

### Estructura y hosting

- **D-001 · 30 sep · hosting.** Todo vive en `mates10/` (repo Train). Tablas, funciones y tipos con prefijo `mates10_`; detrás del prefijo, nombres y columnas del documento. Aplicaciones en `mates10/alumno`, `mates10/padre`, `mates10/revisor`, más `mates10/explorar`; entrada en `mates10/`. Un solo service worker con caché `mates10-`.
- **D-002 · 30 sep · BD.** Los "enum" del documento son `text` con `CHECK`, no tipos de Postgres: se amplían con un `ALTER` de la restricción y no chocan con tipos de otras apps. `fuente.tipo` es abierto (sin CHECK), como pide el módulo 07.
- **D-003 · 30 sep · fuentes (revisada).** Los originales (PDF, HTML, capturas, fotos) van al bucket **privado** `mates10-fuentes` de Supabase Storage. No hay clave de servicio en el entorno (correcto), así que el bucket se configuró como buzón de solo escritura: una política permite a la anon key *subir* (`insert`) y ninguna le permite leer ni listar; se leen desde el panel de Supabase (o con la clave de servicio). Comprobado: subir funciona, leer y listar devuelven 404/vacío. `mates10_fuente_archivo.ruta` = `storage:mates10-fuentes/<fuente_id>/<fichero>`. Los **textos extraídos** (pequeños) viven en `mates10/fuentes/text/<fuente_id>/` en el repo privado, porque el validador de copia los necesita; el workflow de Pages borra `mates10/fuentes` y `mates10/tools` antes de publicar, así que nunca llegan a la web. `fuentes/raw/` está en `.gitignore` (el archivo pesaba 420 MB tras la primera mina). Límite 25 MB por descarga y 50 MB por fichero en el bucket. Deuda: cualquiera con la anon key podría subir ficheros al bucket (no leerlos).
- **D-004 · 30 sep · librerías.** supabase-js, jQuery, jQuery UI y PivotTable.js se sirven desde `mates10/vendor/` (versiones fijadas) en vez de CDN: más fiable en móvil y offline.
- **D-005 · 30 sep · columnas añadidas.** Marcadas con `-- (+)` en `supabase/migrations/001_esquema.sql`. Las principales:
  - `fuente.codigo` (slug estable para scripts), `fuente.modulos` (qué módulos la usan); `fuente.origen` admite `generado_modelo`.
  - `sistema_educativo.fuente_id`, `curso.fuente_id`, `colegio.fuente_id`, `colegio.codigo_oficial`, `colegio.ensenanzas` (regla "nada sin fuente" y carga desde el registro).
  - `habilidad.curso_ref` (curso donde se introduce según la fuente estatal/autonómica de referencia, para cobertura), `habilidad.generador` (clave del generador por código), `habilidad.estado_revision` (revisión de habilidades del módulo 08).
  - `error_tipico.funcion` (función que aplica el error a unos parámetros, para calcular distractores).
  - `mapa_curricular.editorial` (mapa por editorial sin colegio concreto) y `mapa_curricular.confianza`.
  - `metodo.familia`, `plantilla.codigo`, `plantilla.idioma`.
  - `ejercicio.huella` (duplicados), `ejercicio.rechazado`, `ejercicio.creado_en`; `revision_tipo` admite `provisional` (ver D-008).
  - `alumno.nombre` (el módulo 08 lo exige y la tabla no lo tenía), `alumno.prueba_nivel_hecha`, `alumno.creado_en`.
  - `alumno_habilidad`: `dificultad_fsrs`, `aciertos_seguidos`, `ultimo_intento`, `origen`.
  - `intento`: `regla_cascada`, `dificultad`, `tiempo_primera_interaccion_ms`, `cambios_respuesta`, `uso_pista`, `explicacion_entera` (lo que el módulo 05 §5 pide medir).
  - `mecanismo_enganche.uso_en_mates10`, `implementable` (calculada: riesgo alto ⇒ no); `alumno_enganche.ultimo_dia`.
  - `revision.decision` admite `comentado` (la revisión de habilidades es "aprobar y comentar").
- **D-006 · 30 sep · tablas añadidas.** `mates10_rechazo_validador` (rechazos del validador con motivo, módulo 02 §5), `mates10_alumno_habilidad_hist` (dominio diario, para la evolución de dos semanas del informe al padre). `sesion` tenía solo descripción en prosa: columnas alumno, tipo, inicio, fin, objetivo, mecánicas, motivo de fin, intentos, aciertos, explicaciones, terminó en acierto, iniciada por, estado del tutor.

### Contradicciones resueltas

- **D-007 · 30 sep · distractores.** El anexo (v0.2) guarda el error dentro de `distractores`; la decisión 7 del módulo 01 lo prohíbe. Manda el módulo: `distractores` solo valores, la relación con el error en `ejercicio_error`.
- **D-008 · 30 sep · publicación provisional.** El prompt pide publicar 5 ejercicios por habilidad de primaria sin revisor para poder jugar; el documento exige revisor. Se añade `revision_tipo = 'provisional'` y la restricción queda: `publicado ⇒ validado_automatico ∧ ¬rechazado ∧ (revisado_por ≠ null ∨ revision_tipo = 'provisional')`. Al aprobar el revisor, pasa a `directa`/`heredada`. Si rechaza, se despublica.
- **D-009 · 30 sep · dificultad en introduce.** El prompt dice "sin dificultad alta"; el documento, "solo dificultad = 1". Se aplica la más estricta (documento).
- **D-010 · 30 sep · fuente de lo que sale del criterio del modelo.** Errores típicos, prerrequisitos y partes de la taxonomía salen del conocimiento del modelo (el anexo lo admite). No se inventa una fuente: se crean fuentes de tipo `criterio_modelo`, `origen = generado_modelo`, `confianza = baja`, una por lote, con el prompt/criterio archivado como texto. Así "nada entra sin fuente" se cumple y queda visible qué es criterio y qué es documento.
- **D-011 · 30 sep · 4 opciones.** Si una habilidad tiene menos de tres errores típicos aplicables a un ejercicio, se completan los distractores con alternativas genéricas (±1, ±10, cifra cambiada) que no tienen fila en `ejercicio_error`.
- **D-012 · 30 sep · sistema por defecto.** Sin datos, `alumno.sistema_id = ES-MC` (Murcia), editable por el padre: el dispositivo no revela la comunidad autónoma.
- **D-013 · 30 sep · lectura.** "Mecánicas sin lectura, enunciado con audio" en la prueba de nivel: con la mecánica única OPCIONES se añade un botón de leer en voz alta (síntesis de voz del navegador).

### Frontera (módulo 01 §6)

- **D-014 · 30 sep · implementación.** Funciones SQL `mates10_permitidas`, `mates10_permitidas_alumno`, `mates10_ejercicio_permitido`, `mates10_proxima_leccion` (migración 002). Calendario escolar español: T1 = sep–dic, T2 = ene–mar, T3 = abr–ago; julio y agosto cuentan como curso terminado.
- **D-015 · 30 sep · capas.** Colegio > editorial > sistema: si una capa más específica tiene filas para una habilidad, sustituye a las de las otras para esa habilidad (aunque estén en el futuro: el colegio manda).
- **D-016 · 30 sep · estado efectivo.** Una fila `introduce` solo vale su mes (o su trimestre si no tiene mes). Pasado ese periodo sin fila nueva, la habilidad cuenta como `consolida`. Evita que algo introducido en octubre siga limitado a dificultad 1 en mayo.
- **D-017 · 30 sep · cursos anteriores.** Todo lo que el mapa del sistema pone en cursos anteriores entra como `repasa`, sin necesidad de duplicar filas por curso (el anexo lo describe como "lo que arrastra de primaria").
- **D-018 · 30 sep · sin curso declarado.** Techo = un curso por encima del inferido, curso completo (módulo 05 §2). Sin curso ni inferencia (arranque a ciegas), techo provisional = 3º de primaria completo (punto neutro del módulo 05). La prueba de nivel no está limitada por el techo cuando no hay curso declarado: diagnostica, no enseña.

### Mina 1 (contenido)

- **D-019 · 30 sep · decretos.** Se archivan del boletín oficial; cuando el boletín corta la conexión desde el entorno (Asturias, Cantabria, La Rioja), se archiva una copia íntegra del PDF oficial alojada por terceros (conserva firma/CSV) con la URL oficial en `notas`. Galicia se archiva en HTML (sus PDF superan 25 MB). Un decreto que cubre dos etapas (Canarias ESO+BAC, Cantabria ESO+BAC) se archiva una vez o con dos códigos, según el agente; ambos casos están en `notas`. Ceuta y Melilla: órdenes EFP/678, 754 y 755/2022 del Ministerio, archivadas una vez (`ORD-MEFP-*`) y usadas por los dos sistemas.
- **D-020 · 30 sep · códigos de suma y resta.** El documento usa `NUM.SUMA.*` en un ejemplo y `OPER` en la lista de bloques; como la suma es del bloque operaciones, el código es `OPER.SUMA.*` (y `OPER.RESTA.*`).
- **D-021 · 30 sep · taxonomía.** Se genera por grupos de familias (T1–T6, `01-contenido/taxonomia/familias.md`) de 1º de primaria a 2º de bachillerato, con el decreto de Murcia como referencia de curso (`curso_ref`) y el estatal donde Murcia no reparte por curso. Errores típicos, prerrequisitos, importancia, carga y secuencia de referencia dentro del curso son criterio del modelo y apuntan a las fuentes `CRIT-TAX-T*` (D-010).
- **D-031 · 30 sep · nivel en la familia.** `nivel_familia` se calcula al cargar como el orden de enseñanza dentro de la familia (curso de referencia, trimestre, orden), no desde el número del código: los códigos fijados por el anexo (p. ej. OPER.POT.02 en 1.º ESO) no siempre siguen ese orden. Es lo que usan la prueba de nivel y el mensaje "va por el nivel X de N".
- **D-032 · 30 sep · tablas de multiplicar.** Familia propia OPER.TABLA con OPER.TABLA.01 … .10 (una por tabla; el número es el de la tabla), para que el informe diga "domina la tabla del 7". OPER.MULT.02 (anexo) queda como fluidez con todas las tablas mezcladas, con las diez como prerrequisito.
- **D-033 · 30 sep · ajustes del mapa por comunidad.** Solo se ajusta cuando el decreto de la comunidad sitúa un saber explícitamente en otro curso/ciclo o no lo incluye en ninguna etapa (entonces la habilidad no entra en su mapa). Los números romanos solo están en el decreto de Murcia y se excluyen en el resto. Los ordinales tampoco aparecen en varios decretos, pero se mantienen: son vocabulario transversal de primer ciclo y no adelantan nada (decisión provisional, a confirmar por Paco). Cada ajuste queda además en `habilidad_fuente` con rol `contradice` y la decisión en `nota`.
- **D-034 · 30 sep · capa editorial.** Índices públicos de SM, Santillana, Anaya y Edebé (Edelvives no publica índices: todo tras login docente) convertidos en filas del mapa por editorial (unidad → habilidades que la unidad permite afirmar; ante la duda, no). Se aplican en todas las comunidades aunque la edición archivada sea de una concreta (SM y Santillana: Madrid; Anaya: general; Edebé: Andalucía/Aragón). Si el alumno tiene editorial, esas filas sustituyen a las del sistema para las habilidades que la editorial sitúa; el resto sigue el mapa de su comunidad. Trimestre oficial solo donde el índice lo da (confianza alta); si no, por tercios (media).
- **D-022 · 30 sep · saberes de los decretos.** Los resúmenes `01-contenido/decretos/*.json` conservan el texto literal de cada saber (son disposiciones legales, sin propiedad intelectual: art. 13 LPI), con página y anexo.
- **D-023 · 30 sep · colegios.** Registro Estatal de Centros Docentes no Universitarios (RCD, Ministerio). Murcia: 636 centros con primaria, ESO o bachillerato (508 públicos, 116 concertados, 12 privados). Se incluyen centros de educación especial y aulas hospitalarias que el registro da con primaria. `python3 mates10/tools/cargar_colegios.py ES-XX` carga cualquier otra comunidad.

### Mina 2 (ejercicios)

- **D-024 · 30 sep · generación sin API.** No hay `ANTHROPIC_API_KEY` en el entorno, así que el "Sonnet en Batch" del documento se sustituye por subagentes de esta sesión que siguen la skill `.claude/skills/mates10-generar-ejercicios`. Lo calculable (la mayoría de primaria) va por código: `tools/gen/` (38 generadores) con distractores calculados aplicando cada error típico como función y explicación por pasos del mismo generador (así es correcta por construcción).
- **D-025 · 30 sep · validador.** Cascada `tools/validador.py`: esquema → recálculo independiente (una implementación distinta de la del generador) → copia (7-gramas contra todo `fuentes/text/`, salvo enunciados "comunes") → duplicados (huella) → frontera (`max_resultado` de la habilidad). La etapa "calidad con Opus" la hace un agente sobre muestras (skill `mates10-validar-ejercicios`).
- **D-026 · 30 sep · plantillas por código.** Una plantilla por habilidad y dificultad (P1, P2, P3) con el generador y sus restricciones: aprobarla aprueba sus instancias (revisión heredada).
- **D-027 · 30 sep · formato.** Todo se guarda como `opcion_multiple` con una correcta y tres distractores (la mecánica única de esta entrega). Números con convención española: coma decimal, espacio fino de miles desde 5 cifras, `×` y `:` en primaria, `·` en ESO.
- **D-028 · 30 sep · ABN.** Las explicaciones ABN se generan en las familias de suma y resta de primaria (por partes: "añado 10, luego 5"), como pide el módulo 08; se muestran si el colegio o el padre declaran ABN.
- **D-029 · 30 sep · textos para prelectores.** Conteo y primeras sumas/restas usan iconos (🍎🍎🍎) y un texto para leer en voz alta (`datos.lectura`).
- **D-030 · 30 sep · método por defecto.** Si una familia no tiene método documentado, sus habilidades usan `GENERICO.PASOS` (explicación por pasos con comprobación). Se sustituye en cuanto haya método con fuente.

### Tutor (módulo 05)

- **D-040 · 30 sep · dónde vive.** Todo el tutor está en funciones SQL (`supabase/migrations/003_tutor.sql`) llamadas por RPC: `mates10_siguiente`, `mates10_registrar_intento`, `mates10_prueba_siguiente`, `mates10_prueba_cerrar`, `mates10_informe`, `mates10_revisar`. Las pantallas no deciden nada.
- **D-041 · 30 sep · suelo (BKT).** Knowledge tracing bayesiano con parámetros iniciales comunes a todas las habilidades: p(L0) = 0,10, p(T) = 0,15, p(G) = 0,25 (cuatro opciones), p(S) = 0,10. Dominio a partir de 0,85 (documento). El acierto en un reintento (tras ver la explicación) pesa la mitad. Nota: en BKT estándar un fallo también aplica la transición de aprendizaje, así que p puede subir un poco tras un fallo con p muy baja; es el comportamiento del modelo publicado y se deja así. Se recalibrará por familia con datos (módulo 05 §6).
- **D-042 · 30 sep · calendario (FSRS-4.5).** Pesos por defecto publicados de FSRS-4.5; retención objetivo 0,9 (intervalo = S). Una revisión por habilidad y día (el primer intento del día). Nota 1 = fallo, 2 = acierto en reintento o con dudas (más de un cambio de respuesta), 3 = acierto, 4 = acierto rápido (< 4 s) tras dos aciertos seguidos. El agente de técnicas documentó FSRS-5 (19 pesos): se deja como mejora.
- **D-043 · 30 sep · cascada.** Orden del documento: fin de sesión → reintento tras fallo (MISMO_ERROR → CONMUTATIVA → VECINO → otro de la misma habilidad; tres fallos seguidos → BAJAR_PRERREQUISITO) → repaso vencido → preparación (prerrequisitos de lo que el mapa introduce el mes siguiente) → práctica (en curso, bajo el umbral, mayor importancia) → avance (no vista, prerrequisitos imprescindibles dominados) → respaldo. INTERCALAR: máx. 3 seguidas de la misma habilidad; nunca dos de carga 5 seguidas. No se repite un ejercicio visto en los últimos 40 intentos.
- **D-044 · 30 sep · termostato y dificultad.** Dificultad objetivo por dominio (p < 0,4 → 1; < 0,7 → 2; si no, 3), +1 tras tres aciertos seguidos (SUBIR_DIFICULTAD), y termostato de sesión con 4+ intentos: acierto < 70 % → −1, > 90 % → +1. Siempre limitada por la frontera (introduce → 1).
- **D-045 · 30 sep · fin de sesión.** Al llegar a `sesion_seg`, a 15 preguntas o a dos señales de fatiga (tres fallos seguidos; tiempo de los dos últimos > 2× la mediana), se cierra; si el último fue fallo, se pone uno fácil de algo dominado (FIN_EN_ACIERTO) y se cierra tras acertarlo. Sesión inicial: 5 min sin edad; por edad, 5 min a los 6 años + 100 s por año hasta 15 min.
- **D-046 · 30 sep · prueba de nivel.** Hasta 8 familias (las de mayor importancia con ejercicios y niveles alrededor del punto de partida), búsqueda binaria sobre el nivel de la familia empezando en lo que el mapa espera dominado el curso anterior (sin curso: 2º–3º de primaria), máximo 3 ítems por familia, 20 ítems (12 si tiene menos de 8 años) o 15 minutos. Sin curso declarado no se limita por el mapa (diagnostica, no enseña). Cierre: niveles ≤ situado → p = 0,9 (dominada), por encima → 0,2; curso inferido = el más alto que cubre en más de la mitad de las familias; confianza = 0,3 + 0,08 × familias (máx. 0,9); edad estimada = edad típica de ese curso.
- **D-047 · 30 sep · explicación elegida.** Escuela del colegio → escuela declarada por el padre → principal genérico/tradicional. Si el mismo error típico se repite, se prefiere un método de rol remedio o alternativo (regla 6: cambiar de método).
- **D-048 · 30 sep · secundarias.** Las habilidades secundarias de un ejercicio solo cuentan para la frontera; su dominio no se actualiza en esta entrega (el documento dice "con menos peso"; se deja para cuando haya datos).
- **D-049 · 30 sep · racha.** `alumno_enganche.racha_dias` se calcula pero no se muestra al niño (el enganche de esta entrega es solo progreso visible, fin en acierto y sesión corta; el agente de enganche además rebaja la racha a riesgo medio por la guía de la AEPD).

### Aplicaciones (módulo 08)

- **D-060 · 30 sep · Explorar.** Por petición de Paco, `mates10/explorar/`: elegir tabla, seguir relaciones (clave foránea → fila; ficha con "lo que apunta aquí"), añadir columnas de tablas relacionadas, filtros, búsqueda, CSV y tabla dinámica (PivotTable.js). El esquema de relaciones se genera con `tools/gen_esquema.py`.
- **D-061 · 30 sep · OPCIONES.** Se elige una opción y se pulsa "Comprobar" (en vez de responder al tocar): así se miden los cambios de respuesta antes de confirmar (módulo 05 §5). Explicación en pasos destapables y reintento inmediato.
- **D-062 · 30 sep · alumno en el dispositivo.** El alumno elegido se recuerda en el navegador (localStorage) para no tener que buscarlo cada vez; "No soy X" lo olvida.

## Deuda conocida

- **Seguridad.** Prototipo sin autenticación: todas las tablas `mates10_*` tienen RLS con una política permisiva para `anon` (lectura y escritura). Cualquiera con la URL puede leer y modificar datos, incluidos alumnos. Se cambiará con autenticación y políticas por rol (alumno, padre, revisor). La clave de servicio no está en el frontend.
- **Archivo de fuentes en el repo** en vez de bucket privado (D-003).

## Preguntas abiertas para Paco (o un maestro)

Fronteras dudosas que la mina ha decidido provisionalmente; cambiarlas es editar la habilidad o el mapa.

- **Tablas y multiplicación:** el decreto de Murcia y el estatal las ponen en 3.º–4.º; están en 3.º. Muchos libros empiezan al final de 2.º.
- **Paréntesis (OPER.JERARQ.02):** en 1.º ESO (anexo y decreto de Murcia), aunque muchos libros de 5.º–6.º ya usan paréntesis sencillos.
- **Raíz cuadrada:** toda en 1.º ESO (Murcia no la nombra en primaria). ¿Se sigue enseñando el algoritmo (OPER.RAIZ.03) con la LOMLOE? Tiene importancia 2.
- **Factorización y criterios del 4, 6, 9, 11, 25:** en 1.º ESO por el decreto; muchos libros de 6.º los adelantan.
- **Enteros en primaria:** en contexto y recta al final de 6.º; lo formal, en 1.º ESO.
- **Fracciones en 2.º (mitad y cuarto):** ningún decreto las pone en el primer ciclo; adelantadas por lo que hacen los libros.
- **Decimales:** décimas, centésimas y suma/resta con dinero en 4.º; el resto en 5.º (Murcia: tercer ciclo).
- **Equivalentes y distinto denominador:** en 5.º–6.º (Murcia); muchos libros hacen las equivalentes en 4.º.
- **Interés simple en 3.º ESO, compuesto en 4.º ESO, TAE en MACS I:** parte financiera dentro de NUM.PORC (no hay familia financiera).
- **Logaritmos y radicales operativos en 4.º ESO (Matemáticas B):** el mapa tendrá que distinguir 4.º A y B.
- **Forma polar y Moivre en Matemáticas I:** el decreto solo dice "notación adecuada"; incluidos por ser lo habitual.
- **OPER.DIV.01** (anexo) incluye a la vez las divisiones de la tabla y el algoritmo exacto de divisor de una cifra; con granularidad fina serían dos.

## Propuestas

(Se rellena en la fase 3: técnicas de aprendizaje y adaptatividad que el documento no tiene.)
