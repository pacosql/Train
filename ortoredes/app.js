// Orto Redes — galería de ideas de publicaciones (Instagram, TikTok,
// Facebook) para una cuenta de ortografía que lleve gente a Ortografía 10.
// Sin build: datos + plantillas HTML. Los votos (👍/👎 por idea) van a la
// tabla ortoredes_votos de Supabase vía REST con la anon key.
(function () {
  "use strict";
  const CFG = window.ORTOREDES_CONFIG;
  const T = CFG.tablePrefix + "votos";
  const H = "@ortografia10";

  // ---------- Piezas de maqueta ----------
  const foot = (izq = H, der = "") => `<div class="foot"><span>${izq}</span><span>${der}</span></div>`;
  const quiz = (opts, ok, cls = "") =>
    `<div class="quiz ${cls}" data-ok="${ok}">${opts
      .map((o, i) => `<button class="opt" data-i="${i}"><span>${o}</span></button>`)
      .join("")}</div>`;
  const rail = () =>
    `<div class="rail"><div><i>♡</i>48k</div><div><i>💬</i>3.120</div><div><i>↗</i>9k</div><div><i>🔖</i>12k</div></div>`;
  const bars = (n, on) => `<div class="bars">${Array.from({ length: n }, (_, i) => `<span class="${i <= on ? "on" : ""}"></span>`).join("")}</div>`;
  const vcap = (t) => `<div class="vcap"><b>${H}</b> ${t}</div>`;
  const fb = (texto, cuerpo, acciones = "👍 Me gusta · 💬 Comentar · ↗ Compartir") =>
    `<div class="frame fbpost"><div class="fbhead"><div class="av">10</div><div><b>Ortografía 10</b><small>Hace 2 h · 🌐</small></div></div>
     <div class="fbtext">${texto}</div>${cuerpo}<div class="fbactions">${acciones
       .split(" · ")
       .map((a) => `<span>${a}</span>`)
       .join("")}</div></div>`;

  // ---------- Las ideas ----------
  // red: ig | tt | fb. viral: el mecanismo concreto que hace que se comparta.
  const IDEAS = [
    // ===================== INSTAGRAM =====================
    {
      id: "ig-refran-roto",
      red: "ig",
      formato: "Carrusel 4:5",
      serie: "Serie semanal",
      titulo: "El refrán roto",
      resumen:
        "Un refrán de toda la vida con UNA falta escondida. Primera lámina: el refrán solo, en grande. Hay que deslizar para ver la solución y la regla. Es el «toca la falta» de Projet Voltaire, pero en formato carrusel.",
      frames: [
        `<div class="frame r45"><div class="k">El refrán roto · nº 07</div><div class="big">Mas vale tarde que nunca.</div><div class="sm">Hay una falta. ¿La ves?</div><div class="swipe">desliza →</div>${foot()}</div>`,
        `<div class="frame r45"><div class="k">Pista</div><div class="mid">No es una letra.<br>Es algo que <em>falta</em> encima de una.</div>${foot(H, "2/4")}</div>`,
        `<div class="frame r45 white"><div class="k">Solución</div><div class="big"><span class="tach">Mas</span> Más vale tarde que nunca.</div><div class="sm"><b>más</b> (cantidad) lleva tilde.<br><b>mas</b> sin tilde significa «pero»: <i>Lo intentó, mas no pudo.</i></div>${foot(H, "3/4")}</div>`,
        `<div class="frame r45"><div class="k">¿Cuántas faltas harías tú?</div><div class="mid">Haz el test de 5 minutos y descubre tu nota de ortografía.</div><div class="btnfake">Enlace en la bio</div>${foot(H, "4/4")}</div>`,
      ],
      como: [
        "Plantilla fija: fondo negro, refrán en serif blanca, número de serie arriba. Siempre igual para que se reconozca en el feed.",
        "Esconde la falta en algo que «suena bien» (tildes diacríticas, b/v, h). Nunca una errata absurda: tiene que hacer dudar.",
        "Lámina 2 = pista. Obliga a deslizar otra vez (más tiempo en el post).",
        "Lámina 3 = solución en blanco (cambio de color = sensación de «revelación»).",
        "Otros refranes: «A buen entendedor, pocas palabras <i>vastan</i>», «<i>Quién</i> mal anda, mal acaba», «En boca <i>cerrada</i> no entran moscas» (sin falta: ¡a veces no la hay!).",
      ],
      viral: [
        "<b>Comentario fácil</b>: «Di la palabra con falta en comentarios ANTES de deslizar». La gente comenta para presumir → señal fuerte para el algoritmo.",
        "<b>Los carruseles se guardan</b> mucho más que una foto única, e Instagram vuelve a mostrar la lámina 2 a quien no deslizó (segunda oportunidad de alcance).",
        "<b>Serie numerada</b>: «nº 07» crea hábito y da motivo para seguir la cuenta.",
        "1 de cada 5 refranes <b>no tiene falta</b> (como el «no hay falta» de Voltaire): genera discusión en comentarios.",
      ],
      caption:
        "Este refrán lo has escrito mal toda tu vida 👀\nComenta la palabra con falta ANTES de deslizar.\n\n#ortografía #refranes #español #lengua",
      metrica: "Guardados y comentarios",
      esfuerzo: "Bajo · 15 min con plantilla",
    },
    {
      id: "ig-bien-mal",
      red: "ig",
      formato: "Post único 4:5",
      serie: "",
      titulo: "¿Bien o mal? (responde 1 o 2)",
      resumen:
        "Una frase cotidiana, la de WhatsApp de todos los días, y dos opciones. Nada más. La respuesta se da en un comentario fijado al cabo de unas horas.",
      frames: [
        `<div class="frame r45"><div class="k">¿Bien o mal?</div><div class="big">«Haber si quedamos el viernes.»</div>${quiz(["1 · Bien", "2 · Mal"], 1, "two")}${foot(H, "toca una opción")}</div>`,
        `<div class="frame r45 white"><div class="k">Comentario fijado</div><div class="mid"><span class="tach">Haber</span> <b>A ver</b> si quedamos el viernes.</div><div class="sm"><b>haber</b> = verbo (<i>puede haber problemas</i>).<br><b>a ver</b> = «veamos». Truco: si puedes decir «veamos», van separadas.</div>${foot()}</div>`,
      ],
      como: [
        "Frase real, de las que la gente escribe: «haber si», «a sido», «echo de menos», «se a roto».",
        "Mitad de las veces está BIEN (p. ej. «Echo de menos el verano») para que no sea obvio.",
        "No pongas la solución en la imagen. Escríbela en un comentario y fíjalo 3-4 horas después.",
      ],
      viral: [
        "<b>Cuesta cero responder</b>: un solo número. Cuantos más comentarios en la primera hora, más lo empuja Instagram.",
        "<b>Discusión</b>: cuando la frase está bien, la mitad dice «mal» y se ponen a corregirse unos a otros (más comentarios).",
        "<b>Envío por mensaje</b>: «mándaselo a quien te escribe así» en el pie de foto. Que lo compartan por mensaje privado es de lo que más cuenta hoy en Instagram.",
      ],
      caption: "1 = bien, 2 = mal. Sin mirar el diccionario 😏\nLa respuesta, fijada en comentarios en 3 h.\nMándaselo a quien te escribe así 👇",
      metrica: "Comentarios en la 1.ª hora y envíos por mensaje",
      esfuerzo: "Muy bajo · 5 min",
    },
    {
      id: "ig-story-solo",
      red: "ig",
      formato: "Historias 9:16",
      serie: "Diaria",
      titulo: "Historia con sticker de quiz: ¿solo o sólo?",
      resumen:
        "Tres historias seguidas: pregunta con sticker de quiz → sticker de encuesta para medir la polémica → respuesta con la norma actual. Las historias son para fidelizar a quien ya te sigue.",
      frames: [
        `<div class="frame r916">${bars(3, 0)}<div class="k" style="top:24px">Quiz</div><div class="mid center">Según la RAE, ¿cuál es la forma recomendada?</div><div class="sticker"><div class="q">Hoy trabajo ___ por la mañana</div>${quiz(["solo", "sólo"], 0)}</div></div>`,
        `<div class="frame r916">${bars(3, 1)}<div class="mid center">¿Te molesta que «solo» ya no lleve tilde?</div><div class="sticker"><div class="q">Me molesta…</div><div class="slider"></div></div></div>`,
        `<div class="frame r916 white">${bars(3, 2)}<div class="k" style="top:24px">La norma</div><div class="mid">Desde 2010 se recomienda <b>solo</b> sin tilde, también cuando significa «solamente».</div><div class="sm">Y en 2023 la RAE aclaró que la tilde se puede poner si quien escribe ve riesgo de ambigüedad, pero no es obligatoria.</div><div class="btnfake">🔗 Test completo</div></div>`,
      ],
      como: [
        "Sticker de quiz con la respuesta correcta marcada: Instagram enseña a cada persona si acertó.",
        "Sticker deslizador («¿cuánto te molesta?»): es divertido y te da datos para el siguiente post.",
        "La última historia lleva el sticker de enlace a Ortografía 10.",
        "Guarda las mejores en una historia destacada llamada «Quiz».",
      ],
      viral: [
        "Las historias no traen seguidores nuevos, pero <b>cada respuesta al sticker cuenta como interacción</b>: Instagram te muestra más a esas personas en el feed después.",
        "Es el único sitio donde el <b>enlace directo a la app</b> funciona bien (sticker de enlace).",
        "Temas polémicos de la RAE (solo, guion, este/éste) dan «me molesta muchísimo» → genial para el siguiente carrusel: «El 72 % de vosotros odia esta norma».",
      ],
      caption: "(Las historias no llevan texto: el sticker es el pie)",
      metrica: "Respuestas al sticker y toques en el enlace",
      esfuerzo: "Bajo · 10 min/día",
    },
    {
      id: "ig-reel-carteles",
      red: "ig",
      formato: "Reel 9:16 · 15 s",
      serie: "",
      titulo: "Faltas en carteles reales (el boli rojo)",
      resumen:
        "Fotos de carteles con faltas (tiendas, bares, anuncios). En cada uno, un rotulador rojo aparece y corrige. Gancho en el primer segundo.",
      frames: [
        `<div class="frame r916"><div class="tc">0:00</div><div class="scene">Gancho · 1 s</div><div class="mid">Este cartel tiene 2 faltas.<br>Tienes 3 segundos.</div><div style="margin-top:16px" class="cartel">SE ALQUILA HAVITACIÓN<br>CERRADO POR VACACIÓNES</div>${rail()}${vcap("¿Las has visto? 👀")}</div>`,
        `<div class="frame r916"><div class="tc">0:04</div><div class="scene">Corrección</div><div class="cartel">SE ALQUILA <span class="tach">HAVITACIÓN</span> <span class="red">HABITACIÓN</span><br>CERRADO POR <span class="tach">VACACIÓNES</span> <span class="red">VACACIONES</span></div><div class="sm" style="margin-top:14px">«vacaciones» es llana y acaba en -s → sin tilde.</div>${rail()}</div>`,
        `<div class="frame r916"><div class="tc">0:12</div><div class="scene">Cierre en bucle</div><div class="mid">Si viste las dos, estás en el 10 % de arriba.</div><div class="sm">Comprueba tu nivel: enlace en la bio.</div>${rail()}${vcap("Mándame tus carteles 📸")}</div>`,
      ],
      como: [
        "Pide a los seguidores que te manden carteles (contenido gratis y que lo sientan suyo). Tapa nombres de negocios: nunca ridiculizar a nadie concreto.",
        "Gancho con reto + tiempo: «Tienes 3 segundos».",
        "Rotulador rojo animado (CapCut: máscara de trazo) y sonido de rotulador.",
        "Que el final empalme con el principio para que se vea dos veces seguidas (bucle).",
      ],
      viral: [
        "En Reels manda el <b>tiempo de visionado</b>: el reto de 3 segundos hace que la gente pause o lo repita.",
        "Los reels son el formato que llega a <b>gente que no te sigue</b>: para captar usuarios, este es el principal.",
        "<b>Compartir para retar</b>: «¿las has visto?» invita a mandarlo a un amigo.",
        "El cierre («estás en el 10 % de arriba») da algo de lo que presumir. Usa cifras reales de la app cuando las tengas.",
      ],
      caption: "Dos faltas en un solo cartel 🫠 ¿Las viste a la primera?\nMándame los que encuentres por la calle 📸",
      metrica: "Tiempo visto, reproducciones repetidas y compartidos",
      esfuerzo: "Medio · 30-45 min",
    },
    {
      id: "ig-test-5",
      red: "ig",
      formato: "Carrusel 4:5 · 7 láminas",
      serie: "",
      titulo: "Test de 5 frases: ¿cuántas aciertas?",
      resumen:
        "Una pregunta por lámina, con opciones. La última da las soluciones y una «nota». Es una prueba de nivel en miniatura que remite a la prueba de nivel de verdad de la app.",
      frames: [
        `<div class="frame r45"><div class="k">Test · 5 preguntas</div><div class="huge">5/5</div><div class="mid" style="margin-top:12px">Solo el que nunca falla lo saca. ¿Tú?</div><div class="sm">Apunta tus respuestas. Soluciones al final.</div>${foot(H, "1/7")}</div>`,
        `<div class="frame r45"><div class="k">Pregunta 1</div><div class="mid">Iré a la playa, ___ llueve.</div>${quiz(["A · sino", "B · si no"], 1)}${foot(H, "2/7")}</div>`,
        `<div class="frame r45"><div class="k">Pregunta 2</div><div class="mid">Te ___ de menos.</div>${quiz(["A · echo", "B · hecho"], 0)}${foot(H, "3/7")}</div>`,
        `<div class="frame r45"><div class="k">Pregunta 3</div><div class="mid">¡___ coche te has comprado!</div>${quiz(["A · Valla", "B · Vaya", "C · Baya"], 1)}${foot(H, "4/7")}</div>`,
        `<div class="frame r45 white"><div class="k">Soluciones</div><ul class="list"><li><span>1 · si no</span><span>condición</span></li><li><span>2 · echo</span><span>verbo echar</span></li><li><span>3 · Vaya</span><span>verbo ir</span></li><li><span>4 · …</span><span></span></li><li><span>5 · …</span><span></span></li></ul><div class="sm">5 → crack · 3-4 → bien · 0-2 → a repasar</div>${foot(H, "6/7")}</div>`,
        `<div class="frame r45"><div class="k">Tu nota real</div><div class="mid">5 preguntas no dicen mucho. La prueba de nivel de Ortografía 10 te da tu nota de 0 a 100 en 5 minutos.</div><div class="btnfake">Enlace en la bio</div>${foot(H, "7/7")}</div>`,
      ],
      como: [
        "5 preguntas de dificultad creciente; la 5.ª, muy difícil (p. ej. «porqué» como sustantivo: <i>No entiendo el porqué</i>).",
        "Opciones tipo test, como en la app: así el post es una muestra del producto.",
        "Pide en el pie: «Comenta tu nota: 3/5, 4/5…».",
      ],
      viral: [
        "<b>La nota es identidad</b>: la gente comenta su resultado para presumir o para reírse de sí misma.",
        "Muchas láminas = <b>mucho tiempo dentro del post</b>.",
        "Es el puente más natural hacia la app: «¿quieres tu nota de verdad?» → <b>conversión</b>.",
      ],
      caption: "Comenta tu nota sin hacer trampas 👇\n(cuando tengas datos de la app: «5/5 solo lo saca el X %»)",
      metrica: "Comentarios con la nota y clics en la bio",
      esfuerzo: "Medio · 30 min",
    },
    {
      id: "ig-top10",
      red: "ig",
      formato: "Carrusel de referencia",
      serie: "Guardable",
      titulo: "Las 10 faltas que comete gente con carrera",
      resumen:
        "Una chuleta para guardar: cada lámina, una pareja que se confunde con un truco para recordarla. Es el formato que más se guarda.",
      frames: [
        `<div class="frame r45"><div class="k">Guárdalo 🔖</div><div class="big">10 faltas que comete gente con carrera universitaria</div><div class="swipe">desliza →</div>${foot()}</div>`,
        `<div class="frame r45"><div class="k">01</div><div class="huge" style="font-size:44px">hay · ahí · ay</div><div class="sm"><b>Ahí</b> hay un hombre que dice <b>¡ay!</b><br>Lugar · existir · dolor.</div>${foot(H, "2/11")}</div>`,
        `<div class="frame r45 white"><div class="k">Las 10</div><ul class="list"><li><span>hay / ahí / ay</span><span>01</span></li><li><span>a ver / haber</span><span>02</span></li><li><span>echo / hecho</span><span>03</span></li><li><span>vaya / valla / baya</span><span>04</span></li><li><span>si no / sino</span><span>05</span></li><li><span>porque / por qué / porqué</span><span>06</span></li><li><span>ha / a</span><span>07</span></li><li><span>tú / tu</span><span>08</span></li><li><span>haya / halla / allá</span><span>09</span></li><li><span>más / mas</span><span>10</span></li></ul>${foot(H, "11/11")}</div>`,
      ],
      como: [
        "Un truco por lámina, nada de teoría larga. Frase de ejemplo memorable.",
        "Lámina final = resumen en una sola imagen (lo que la gente hace captura).",
        "Pie con llamada a guardar: «Guárdalo para cuando dudes».",
      ],
      viral: [
        "<b>Los guardados</b> le dicen a Instagram que el contenido tiene valor duradero → lo sigue enseñando semanas.",
        "«Gente con carrera» toca el orgullo: <b>se comparte para picar</b> a alguien.",
        "La lámina resumen se comparte en historias de otros (alcance gratis).",
      ],
      caption: "Guárdalo para la próxima vez que dudes 🔖\n¿Cuál fallabas tú? Sé sincero 👇",
      metrica: "Guardados",
      esfuerzo: "Medio · 40 min (reutilizable)",
    },

    // ===================== TIKTOK =====================
    {
      id: "tt-cual-bien",
      red: "tt",
      formato: "Carrusel de fotos 9:16",
      serie: "",
      titulo: "¿Cuál está bien escrita? (A, B o C)",
      resumen:
        "Carrusel de fotos en TikTok (modo foto): una palabra traicionera escrita de tres formas. La solución, en la última foto. En TikTok los carruseles de fotos suelen tener más interacción que los vídeos en cuentas educativas.",
      frames: [
        `<div class="frame r916"><div class="k">1 de 3</div><div class="mid center" style="margin-bottom:6px">¿Cuál está bien?</div>${quiz(["A · exhuberante", "B · exuberante", "C · exhuverante"], 1)}${rail()}${vcap("el X % falla la primera 😬 #ortografía")}</div>`,
        `<div class="frame r916"><div class="k">2 de 3</div><div class="mid center" style="margin-bottom:6px">¿Y esta?</div>${quiz(["A · exausto", "B · exhausto", "C · ecshausto"], 1)}${rail()}</div>`,
        `<div class="frame r916 white"><div class="k">Solución</div><div class="mid"><b>exuberante</b> sin h.<br><b>exhausto</b> con h.</div><div class="sm">Truco: el ex<b>h</b>austo ha perdido el aire y necesita una <b>h</b> para respirar.</div>${rail()}</div>`,
      ],
      como: [
        "Usa el modo foto de TikTok con una canción que esté de moda (baja volumen).",
        "Primera foto = la pregunta, sin portada aparte.",
        "Elige palabras que la gente cree saber (exuberante, absorber, desahuciar, hierba/hierva).",
        "Las cifras del pie («el 80 % falla») tienen que venir de los datos reales de la app (la vista de palabras difíciles de Orto).",
      ],
      viral: [
        "TikTok sigue mostrando los carruseles de fotos a gente nueva: <b>cada deslizamiento cuenta como interacción</b>.",
        "Comentario de una letra (A/B/C) = <b>comentar no cuesta nada</b>.",
        "El truco de memoria es lo que se recuerda y se comparte («lo del exhausto que respira»).",
      ],
      caption: "Comenta tu letra antes de pasar 👇 #ortografía #lenguaespañola #aprenderentiktok",
      metrica: "Comentarios y fotos vistas",
      esfuerzo: "Bajo · 15 min",
    },
    {
      id: "tt-dictado",
      red: "tt",
      formato: "Vídeo 9:16 · 20 s",
      serie: "Reto",
      titulo: "Dictado imposible: 3 palabras",
      resumen:
        "Hablas a cámara: «Te dicto 3 palabras. Escríbelas en los comentarios sin autocorrector». La solución sale en un vídeo de respuesta a comentario.",
      frames: [
        `<div class="frame r916"><div class="tc">0:00</div><div class="scene">A cámara · plano corto</div><div class="mid">«Te dicto 3 palabras. Escríbelas en comentarios. Sin autocorrector.»</div>${rail()}${vcap("Reto del dictado #3")}</div>`,
        `<div class="frame r916"><div class="tc">0:06</div><div class="scene">Texto grande en pantalla</div><div class="huge center">1</div><div class="mid center" style="margin-top:8px">«absorber»</div><div class="sm center">(dilo despacio, sin enseñarla escrita)</div>${rail()}</div>`,
        `<div class="frame r916 white"><div class="tc">vídeo 2</div><div class="scene">Responder a comentario</div><div class="mid">absor<b>b</b>er · des<b>h</b>auciar · <b>h</b>ierba</div><div class="sm">«Respondo a @maria: casi, pero absorber va con dos b.»</div>${rail()}</div>`,
      ],
      como: [
        "Grábalo tú a cámara (la cara humana mantiene a la gente viendo más que el texto solo).",
        "No enseñes la palabra escrita: solo audio + número.",
        "Al día siguiente, responde con vídeo a un comentario que falló (sin burlarte).",
      ],
      viral: [
        "Los comentarios son el contenido: <b>cada respuesta es una interacción</b> y la gente vuelve a ver si acertó.",
        "Responder con vídeo a comentarios crea <b>una cadena de vídeos</b> (el 2.º llega a quien comentó el 1.º).",
        "Formato «reto» = la gente lo <b>une a su vídeo (stitch)</b> para hacerlo con amigos.",
      ],
      caption: "Sin autocorrector, que te veo 👀 #dictado #ortografía #reto",
      metrica: "Comentarios y vídeos derivados",
      esfuerzo: "Bajo · 10 min",
    },
    {
      id: "tt-pov",
      red: "tt",
      formato: "Vídeo humor 9:16 · 10 s",
      serie: "",
      titulo: "POV: tu ligue te escribe «haber si quedamos»",
      resumen:
        "Sketch de humor: cara de dilema al leer un mensaje con falta. Humor + ortografía = se comparte fuera del público de «gente que estudia».",
      frames: [
        `<div class="frame r916"><div class="tc">0:00</div><div class="scene">Texto + cara</div><div class="mid">POV: tu ligue te escribe</div><div class="sticker" style="text-align:left;font-size:13px;margin-top:10px">Haber si quedamos 😊</div>${rail()}${vcap("lo dejo o lo educo 🤔")}</div>`,
        `<div class="frame r916"><div class="tc">0:05</div><div class="scene">Cambio de plano</div><div class="mid">Yo, decidiendo si le corrijo, le dejo o me caso igual:</div><div class="huge center" style="margin-top:14px">🫠</div>${rail()}</div>`,
      ],
      como: [
        "Usa un audio que esté de moda (el sonido marca el ritmo del sketch).",
        "Variantes: «a sido un placer», «te echo de menos» bien escrito (¡y te enamoras!), «valla día».",
        "Cierra con texto pequeño: «Truco: si puedes decir «veamos», es a ver».",
      ],
      viral: [
        "<b>Todo el mundo puede verse reflejado</b>: el humor de ligar se comparte por mensaje privado a amigos.",
        "Sale de tu nicho: TikTok lo prueba con público general, no solo con gente que quiere aprender.",
        "El debate «¿le dejarías por una falta?» = <b>montones de comentarios</b>.",
      ],
      caption: "¿Le dejarías por esto? Sé sincero 😂 #pov #ortografía #ligar",
      metrica: "Compartidos y comentarios",
      esfuerzo: "Bajo · 10 min",
    },
    {
      id: "tt-falta-dia",
      red: "tt",
      formato: "Serie diaria 9:16 · 7 s",
      serie: "Día X/365",
      titulo: "Una falta al día (día 1 de 365)",
      resumen:
        "Formato fijo, cortísimo y siempre igual: «Día 23/365» + palabra mal → palabra bien + truco de una línea. La constancia es el gancho.",
      frames: [
        `<div class="frame r916"><div class="k">Día 23/365</div><div class="big center"><span class="tach">iva</span><br>iba</div><div class="sm center">Los imperfectos en -aba / -iba siempre con b.<br><i>Cantaba, iba, jugaba.</i></div>${rail()}${vcap("Día 23. Mañana, otra.")}</div>`,
        `<div class="frame r916"><div class="k">Día 24/365</div><div class="big center"><span class="tach">aprobechar</span><br>aprovechar</div><div class="sm center">De «provecho», con v.</div>${rail()}</div>`,
      ],
      como: [
        "Graba 30 de golpe en una tarde (mismo encuadre o la misma plantilla de texto).",
        "Publica a la misma hora todos los días.",
        "Saca el orden de las faltas de las competencias de la app (de fácil a difícil): el contenido ya está hecho.",
      ],
      viral: [
        "Las series crean <b>hábito</b>: «sigue la cuenta para no perderte el día 24» funciona porque es verdad.",
        "Vídeos de 7 s = <b>se ven enteros y se repiten</b> (más del 100 % de visionado).",
        "Si un día explota, la gente <b>va a tu perfil y se ve los anteriores</b> → muchos seguidores de golpe.",
      ],
      caption: "Día 23/365 de aprender una falta al día ✍️ Síguenos para el 24.",
      metrica: "Seguidores por visita al perfil",
      esfuerzo: "Muy bajo por pieza",
    },

    // ===================== FACEBOOK =====================
    {
      id: "fb-texto-fondo",
      red: "fb",
      formato: "Publicación de texto con fondo",
      serie: "",
      titulo: "La frase que todo el mundo comparte",
      resumen:
        "En Facebook el público es mayor (40-65 años), le gusta compartir «cosas que hay que saber» y presumir de que «esto en mis tiempos se enseñaba bien».",
      frames: [
        fb(
          "¿Tus hijos lo saben? 👇",
          `<div class="fbbg">Ahí hay un hombre que dice «¡ay!»</div>`,
          "👍 2,1 mil · 💬 846 · ↗ 5,3 mil"
        ),
      ],
      como: [
        "Usa la publicación de texto con fondo de color de Facebook (o una imagen cuadrada blanca con serif negra).",
        "Frase-regla mnemotécnica clásica, de las que se enseñaban en el colegio.",
        "Pregunta dirigida a padres y abuelos: «¿Tus hijos/nietos lo saben?».",
      ],
      viral: [
        "En Facebook lo que más mueve es <b>compartir</b>: la gente comparte para educar a los suyos y quedar bien.",
        "<b>Nostalgia del colegio</b>: «esto me lo enseñó mi maestra en 1975» → comentarios largos.",
        "Llega a padres que <b>comprarían la app para sus hijos</b> (un comprador distinto al de Instagram).",
      ],
      caption: "¿Tus hijos lo saben? 👇 Compártelo si te lo enseñaron en el colegio.",
      metrica: "Compartidos",
      esfuerzo: "Muy bajo",
    },
    {
      id: "fb-encuesta-guion",
      red: "fb",
      formato: "Encuesta (grupo o página)",
      serie: "",
      titulo: "Encuesta: ¿«guion» o «guión»?",
      resumen:
        "Los cambios de la RAE indignan y dan para discutir. Encuesta de dos opciones + explicación en el primer comentario.",
      frames: [
        fb(
          "Votad sin buscar en Google 😏 ¿Cómo se escribe hoy?",
          `<div class="fbpoll">${quiz(["guion", "guión"], 0)}</div><div class="fbtext" style="color:#8b8b88;font-size:11.5px">Primer comentario: desde 2010, «guion», «truhan», «rio» (del verbo reír) y «fie» se escriben sin tilde: son monosílabos a efectos de ortografía.</div>`,
          "👍 980 · 💬 1,2 mil · ↗ 310"
        ),
      ],
      como: [
        "Mejor en grupos (de idiomas, de profes, de mayores) además de en tu página.",
        "Respuesta en el primer comentario, con fuente (RAE, Ortografía de 2010).",
        "Encadena con: «¿Y solo? ¿Y este?» la semana siguiente.",
      ],
      viral: [
        "Las normas que han cambiado generan <b>indignación con argumentos</b>: debates largos que Facebook premia.",
        "La encuesta es <b>un toque</b>, sin escribir: participa hasta quien nunca comenta.",
        "Te posiciona como «los que saben» → confianza para vender después.",
      ],
      caption: "Votad sin buscar en Google 😏",
      metrica: "Votos y comentarios",
      esfuerzo: "Muy bajo",
    },
    {
      id: "fb-reto-frase",
      red: "fb",
      formato: "Reto en comentarios",
      serie: "",
      titulo: "Reto: una frase con haya, halla, allá y aya",
      resumen:
        "Pides a la gente que escriba una frase usando las cuatro palabras correctamente. Los comentarios SON la publicación.",
      frames: [
        fb(
          "RETO 🧠 Escribe UNA frase que use bien las cuatro:",
          `<div class="fbbg" style="font-size:26px">haya · halla<br>allá · aya</div><div class="fbtext" style="margin-top:10px;font-size:11.5px;color:#8b8b88">💬 Pilar R.: «Allá donde se halla la niña con su aya, ojalá haya paz.» 🏆</div>`,
          "👍 640 · 💬 2,4 mil · ↗ 190"
        ),
      ],
      como: [
        "Da la definición rápida en el primer comentario (haya: haber · halla: hallar/encontrar · allá: lugar · aya: niñera).",
        "Al día siguiente, publica «las 5 mejores frases» con el nombre de quien las escribió (crea comunidad).",
      ],
      viral: [
        "<b>Contenido creado por la gente</b>: tú publicas 1 frase, ellos escriben 2.000.",
        "Mencionar a los ganadores hace que <b>lo compartan con orgullo</b>.",
        "Funciona igual en Instagram y TikTok (reutiliza).",
      ],
      caption: "Los que lo consigan, a la publicación de mañana 🏆",
      metrica: "Comentarios",
      esfuerzo: "Bajo",
    },
    {
      id: "fb-dictado-egb",
      red: "fb",
      formato: "Imagen + vídeo corto",
      serie: "Nostalgia",
      titulo: "El dictado de 5.º de EGB",
      resumen:
        "Foto de un cuaderno de los 80 con un dictado corregido en rojo. «¿Lo aprobarías hoy?». Nostalgia + reto.",
      frames: [
        `<div class="frame r11 white"><div class="k">Dictado · 5.º EGB · 1987</div><div class="mid" style="font-family:'Bradley Hand','Segoe Print',cursive;font-size:18px">El <span class="err">vúho</span> se posó en la rama del haya mientras el leñador, exhausto, volvía a casa.</div><div class="sm red">1 falta · Bien 🖍️</div>${foot("Ortografía 10", "¿lo aprobarías?")}</div>`,
      ],
      como: [
        "Escríbelo a mano de verdad, en cuaderno de cuadros, con boli rojo (la autenticidad importa).",
        "Variante en vídeo: lees el dictado con voz de maestro/a y la gente lo escribe.",
        "CTA: «Ortografía 10 tiene dictados como estos para practicar».",
      ],
      viral: [
        "La <b>nostalgia</b> es el motor de Facebook: «¡mi cuaderno era igual!».",
        "Reto implícito: «¿lo aprobarías?» → la gente lo intenta y comenta su resultado.",
        "Lo comparten con <b>hermanos y compañeros de clase</b>: grupos enteros de la misma edad.",
      ],
      caption: "¿Cuántos de vosotros aprobaríais hoy este dictado de 5.º de EGB? 📒",
      metrica: "Compartidos y comentarios",
      esfuerzo: "Bajo",
    },
  ];

  const REDES = [
    { id: "estrategia", nombre: "Cómo hacerlo viral" },
    { id: "ig", nombre: "Instagram" },
    { id: "tt", nombre: "TikTok" },
    { id: "fb", nombre: "Facebook" },
    { id: "fav", nombre: "Mis favoritas" },
  ];

  const INTRO = {
    ig: "Instagram premia hoy <strong>los envíos por mensaje privado, los guardados y el tiempo de visionado</strong>. Los <strong>reels</strong> llegan a gente que no te sigue (captar); los <strong>carruseles</strong> se guardan y dan confianza; las <strong>historias</strong> fidelizan y llevan el enlace a la app.",
    tt: "TikTok enseña cada vídeo primero a un grupo pequeño y, si lo ven entero y comentan, lo amplía. El público es más joven y viene a <strong>reírse y a retarse</strong>. Los <strong>carruseles de fotos</strong> funcionan muy bien en cuentas educativas.",
    fb: "En Facebook el público es <strong>mayor y comparte mucho</strong>: padres, abuelos, profes. La nostalgia del colegio y las normas de la RAE que han cambiado dan para debatir. Es el público que <strong>pagaría la app para sus hijos</strong>.",
    fav: "Las ideas que has marcado con 👍 en este dispositivo. Los votos se guardan también en Supabase (tabla <code>ortoredes_votos</code>).",
  };

  // ---------- Estrategia (pestaña de inicio) ----------
  function estrategia() {
    const reglas = [
      ["Gancho en el primer segundo", "Reto + tiempo («tienes 3 segundos»), una pregunta o una frase que choca. Si no paran de deslizar en 1 s, el resto da igual."],
      ["Comentar debe costar nada", "Una letra (A/B/C), un número (1/2) o una palabra. Así responde cualquiera, y cada comentario empuja la publicación."],
      ["Dar algo de lo que presumir", "Una nota (4/5), «estás en el 10 % de arriba». La gente comenta y comparte para quedar bien."],
      ["Que se pueda mandar a alguien", "«Mándaselo a quien escribe haber». En Instagram, que lo envíen por mensaje privado es de lo que más pesa."],
      ["Guardable", "Chuletas y trucos de memoria: los guardados alargan la vida del post semanas."],
      ["Debate sin ser borde", "Normas cambiadas (solo, guion) y frases que SÍ están bien. Nunca ridiculizar a personas o negocios concretos."],
      ["Series y constancia", "«Día 23/365», «El refrán roto nº 7». Una plantilla fija = se reconoce y se sigue."],
      ["Reutiliza en las tres redes", "La misma idea vale para las tres: reel ↔ TikTok, carrusel ↔ fotos de TikTok, encuesta ↔ Facebook."],
    ];
    return `<section class="est">
      <div class="intro">Qué hacemos: <strong>conseguir seguidores ahora</strong> con contenido de ortografía que se comparte, y <strong>después llevarlos a Ortografía 10</strong> para que compren la app.</div>
      <h2>Las 8 reglas para que se comparta</h2>
      ${reglas.map((r, i) => `<div class="regla"><div class="n">${i + 1}</div><div><b>${r[0]}</b><span>${r[1]}</span></div></div>`).join("")}
      <h2>De seguidor a comprador</h2>
      <div class="funnel">
        <div><b>Atraer</b><span>Reels, vídeos de TikTok y retos: llegan a gente que no te sigue.</span></div>
        <div><b>Enganchar</b><span>Series y carruseles guardables: motivo para seguir la cuenta.</span></div>
        <div><b>Medir</b><span>«¿Cuántas faltas harías tú? Haz el test gratis» — la prueba de nivel de la app como imán.</span></div>
        <div><b>Convertir</b><span>Enlace en la bio, sticker de enlace en historias y respuesta automática por mensaje: «Comenta TEST y te mando el enlace».</span></div>
        <div><b>Recordar</b><span>Usa datos reales de la app en los posts («el 63 % falla esta»): es contenido y es publicidad a la vez.</span></div>
      </div>
      <h2>Lo que copiamos de Projet Voltaire</h2>
      <p>Projet Voltaire (el método francés de ortografía) entrena con <b>frases donde hay que tocar la falta</b> o marcar «<b>no hay falta</b>», un <b>test inicial</b> que fija el nivel, unas <b>200 reglas</b> en niveles crecientes y repaso de lo que fallas. Todo eso se traduce a redes:</p>
      <ul class="plain">
        <li><b>Toca la falta</b> → El refrán roto, carteles, ¿bien o mal?</li>
        <li><b>No hay falta</b> → 1 de cada 5 posts sin falta: genera debate.</li>
        <li><b>Test inicial</b> → Test de 5 frases y el CTA «tu nota de 0 a 100».</li>
        <li><b>Reglas en orden de dificultad</b> → la serie «una falta al día».</li>
        <li><b>Repaso de fallos</b> → «las que más fallasteis esta semana» (recopilatorio del domingo).</li>
      </ul>
      <h2>Una semana tipo</h2>
      <table class="cal">
        <tr><th>Día</th><th>Instagram</th><th>TikTok</th><th>Facebook</th></tr>
        <tr><td>Lun</td><td>El refrán roto</td><td>Falta del día</td><td>Texto con fondo</td></tr>
        <tr><td>Mar</td><td>Historia quiz</td><td>Falta del día · ¿Cuál está bien?</td><td>—</td></tr>
        <tr><td>Mié</td><td>Reel carteles</td><td>Falta del día · POV</td><td>Encuesta RAE</td></tr>
        <tr><td>Jue</td><td>¿Bien o mal?</td><td>Falta del día</td><td>—</td></tr>
        <tr><td>Vie</td><td>Test de 5</td><td>Falta del día · Dictado</td><td>Reto en comentarios</td></tr>
        <tr><td>Dom</td><td>Chuleta guardable</td><td>Recopilatorio</td><td>Dictado de EGB</td></tr>
      </table>
      <div class="box" style="margin-top:28px"><p><b>Métricas que importan</b> (en este orden): seguidores nuevos por semana → visitas al perfil → clics en el enlace → personas que hacen el test → compras. Los «me gusta» casi no importan.</p></div>
    </section>`;
  }

  // ---------- Votos (Supabase REST) ----------
  const LS = "ortoredes-mis-votos";
  let mis = {};
  try { mis = JSON.parse(localStorage.getItem(LS) || "{}"); } catch (e) { mis = {}; }
  let totales = {};
  const headers = { apikey: CFG.anonKey, Authorization: `Bearer ${CFG.anonKey}`, "Content-Type": "application/json" };

  async function cargarVotos() {
    try {
      const r = await fetch(`${CFG.url}/rest/v1/${T}?select=idea,valor&limit=10000`, { headers });
      if (!r.ok) throw new Error(r.status);
      totales = {};
      (await r.json()).forEach((v) => {
        totales[v.idea] = totales[v.idea] || { up: 0, down: 0 };
        totales[v.idea][v.valor > 0 ? "up" : "down"]++;
      });
      document.querySelectorAll("[data-tot]").forEach(pintarTotal);
    } catch (e) { /* sin red: la página funciona igual */ }
  }
  function pintarTotal(el) {
    const t = totales[el.dataset.tot] || { up: 0, down: 0 };
    el.textContent = t.up || t.down ? `${t.up} 👍 · ${t.down} 👎` : "";
  }
  async function votar(idea, valor, btn) {
    btn.disabled = true;
    try {
      const r = await fetch(`${CFG.url}/rest/v1/${T}`, { method: "POST", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify({ idea, valor }) });
      if (!r.ok) throw new Error(r.status);
      mis[idea] = valor;
      try { localStorage.setItem(LS, JSON.stringify(mis)); } catch (e) {}
      toast(valor > 0 ? "Guardada en tus favoritas" : "Descartada");
      await cargarVotos();
      render();
    } catch (e) {
      toast("No se pudo guardar el voto");
    } finally { btn.disabled = false; }
  }

  // ---------- Render ----------
  const nombreRed = { ig: "Instagram", tt: "TikTok", fb: "Facebook" };
  function tarjeta(it, n) {
    const v = mis[it.id];
    return `<article class="idea" id="${it.id}">
      <div class="meta"><span class="num">${String(n).padStart(2, "0")}</span><span class="chip solid">${nombreRed[it.red]}</span><span class="chip">${it.formato}</span>${it.serie ? `<span class="chip">${it.serie}</span>` : ""}</div>
      <h2>${it.titulo}</h2>
      <p class="resumen">${it.resumen}</p>
      <div class="stage">${it.frames.join("")}</div>
      ${it.frames.length > 1 ? `<div class="dots">${it.frames.map((_, i) => `<span class="${i ? "" : "on"}"></span>`).join("")}</div>` : ""}
      <div class="hint">${it.frames.length > 1 ? "Desliza la maqueta · " : ""}toca las opciones para probar</div>
      <div class="cols">
        <div><h3>Cómo hacerlo</h3><ol>${it.como.map((c) => `<li>${c}</li>`).join("")}</ol></div>
        <div><h3>Por qué se comparte</h3><ol>${it.viral.map((c) => `<li>${c}</li>`).join("")}</ol></div>
      </div>
      <div class="box"><h3>Texto de la publicación</h3><p class="caption">${it.caption}</p></div>
      <div class="kpis"><span>Métrica clave · <b>${it.metrica}</b></span><span>Esfuerzo · <b>${it.esfuerzo}</b></span></div>
      <div class="votos">
        <button data-vote="1" data-id="${it.id}" class="${v === 1 ? "on" : ""}">👍 La haría</button>
        <button data-vote="-1" data-id="${it.id}" class="${v === -1 ? "on" : ""}">👎 No</button>
        <span class="tot" data-tot="${it.id}"></span>
      </div>
    </article>`;
  }

  let actual = "estrategia";
  try { const h = location.hash.slice(1); if (REDES.some((r) => r.id === h)) actual = h; } catch (e) {}

  function render() {
    const tabs = document.getElementById("tabs");
    tabs.innerHTML = REDES.map((r) => {
      const n = r.id === "fav" ? IDEAS.filter((i) => mis[i.id] === 1).length : IDEAS.filter((i) => i.red === r.id).length;
      return `<button role="tab" data-tab="${r.id}" aria-selected="${r.id === actual}">${r.nombre}${r.id !== "estrategia" ? `<span class="n">${n}</span>` : ""}</button>`;
    }).join("");
    const main = document.getElementById("main");
    if (actual === "estrategia") { main.innerHTML = estrategia(); return; }
    const lista = actual === "fav" ? IDEAS.filter((i) => mis[i.id] === 1) : IDEAS.filter((i) => i.red === actual);
    main.innerHTML = `<div class="intro">${INTRO[actual]}</div>` +
      (lista.length ? lista.map((it, i) => tarjeta(it, i + 1)).join("") : `<p class="intro">Aún no has marcado ninguna con 👍.</p>`);
    document.querySelectorAll("[data-tot]").forEach(pintarTotal);
    document.querySelectorAll(".stage").forEach((st) => {
      const dots = st.parentElement.querySelectorAll(".dots span");
      if (!dots.length) return;
      st.addEventListener("scroll", () => {
        const f = st.querySelector(".frame");
        const i = Math.round(st.scrollLeft / (f.offsetWidth + 12));
        dots.forEach((d, j) => d.classList.toggle("on", j === Math.min(i, dots.length - 1)));
      }, { passive: true });
    });
  }

  document.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-tab]");
    if (tab) { actual = tab.dataset.tab; history.replaceState(null, "", "#" + actual); render(); window.scrollTo({ top: 0 }); return; }
    const vb = e.target.closest("[data-vote]");
    if (vb) { votar(vb.dataset.id, Number(vb.dataset.vote), vb); return; }
    const opt = e.target.closest(".quiz .opt");
    if (opt) {
      const q = opt.parentElement;
      const ok = Number(q.dataset.ok);
      q.classList.add("done");
      q.querySelectorAll(".opt").forEach((o) => {
        const i = Number(o.dataset.i);
        o.classList.toggle("ok", i === ok);
        o.classList.toggle("ko", i !== ok);
        o.classList.toggle("picked", o === opt);
      });
      toast(Number(opt.dataset.i) === ok ? "¡Correcto!" : "Ups, esa no");
    }
  });

  let tt;
  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg; el.classList.add("show");
    clearTimeout(tt); tt = setTimeout(() => el.classList.remove("show"), 1600);
  }

  render();
  cargarVotos();
})();
