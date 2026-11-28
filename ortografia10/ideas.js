// Ortografía 10 — pestaña «Ideas»: ideas de lanzamiento, marketing, juegos y
// retos. Cada idea se abre y enseña maquetas de cómo se vería (pantallas de
// móvil hechas con HTML/CSS, en blanco y negro). Son simulaciones, no
// capturas reales: los nombres, cifras y mensajes son inventados.
//
// Los votos de cada idea van a ortografia10_votos con tipo = "idea:<id>".

const m = (titulo, cuerpo, { app = "", negro = false } = {}) =>
  `<figure class="mq"><div class="mv${negro ? " neg" : ""}"><div class="mv-st"><span>9:41</span><span>${app}</span><span>▮▮▮</span></div><div class="mv-c">${cuerpo}</div></div><figcaption>${titulo}</figcaption></figure>`;
const logo = `<div class="mv-logo">orto<br>grafía<br>10</div>`;
const chat = (quien, msgs) => `<div class="mv-wa"><b>${quien}</b></div>${msgs.map(([yo, t]) => `<div class="mv-b ${yo ? "yo" : ""}">${t}</div>`).join("")}`;
const sq = (s) => s.split("").map((c) => `<i class="sq ${c === "1" ? "n" : c === "2" ? "r" : c === "3" ? "g" : ""}"></i>`).join("");

export const CATS_IDEAS = [
  ["lan", "🚀", "Lanzamiento", "Cómo conseguir los primeros usuarios antes y durante la salida"],
  ["vir", "📣", "Viralidad", "Que los propios jugadores compartan y traigan a otros"],
  ["mkt", "🎯", "Marketing y contenido", "Contenido para redes y medios"],
  ["jue", "🎮", "Retos y juegos", "Mecánicas que enganchan y hacen volver"],
];

export const IDEAS = [
  { id: "historia", cat: "vir", pt: 9, por: "Ya está hecha y cada ronda se convierte en un anuncio gratis en historias.", e: "📸", n: "Imagen de resultado para historias", red: "Instagram / WhatsApp", hecho: true, tipo: "Compartir",
    desc: "Al acabar una ronda, un botón crea una imagen vertical en blanco y negro con tu nota (8/10), tu fila de aciertos y una palabra trampa «¿bien o mal escrita?» para que tus seguidores respondan.",
    pasos: ["Acabas una ronda y pulsas «Compartir en redes».", "Se crea la imagen 1080×1920 lista para historias.", "Tus seguidores ven la palabra trampa y entran a responder."],
    mq: () => [
      m("1 · Fin de ronda", `<div class="mv-h">8 de 10</div><p>Muy bien. Sigue así.</p><div class="mv-btn neg">📤 Compartir en redes</div><div class="mv-btn">Otra ronda</div>`),
      m("2 · La historia", `${logo}<div class="mv-big">8/10</div><p>aciertos en mi ronda · 🔥 4 seguidas</p><div class="sqs">${sq("1121111211")}</div><div class="mv-trap"><small>¿Bien o mal escrita?</small><b>exhuberante</b><small>Respóndelo en la app 👇</small></div>`, { app: "Instagram" }),
      m("3 · Respuestas", `<div class="mv-wa"><b>Respuestas a tu historia</b></div><div class="mv-b">¡Mal! Es «exuberante» 😎</div><div class="mv-b">Yo la habría puesto con h 😅</div><div class="mv-b">8/10, te gano seguro</div>`, { app: "Instagram" }),
    ] },
  { id: "reto", cat: "vir", pt: 9, por: "Ya está hecho: es el bucle de invitación más directo (amigo → amigo).", e: "🔗", n: "Enlace de reto «¿me superas?»", red: "WhatsApp / X", hecho: true, tipo: "Reto",
    desc: "El texto que compartes lleva un enlace: quien lo abre ve «Te han retado: sacó 8/10», contesta la palabra trampa y juega para superarlo.",
    pasos: ["Compartes tu resultado por WhatsApp.", "Tu amigo abre el enlace y ve el reto.", "Contesta la palabra trampa y juega para superarte."],
    mq: () => [
      m("1 · Lo envías", chat("Familia 👨‍👩‍👧", [[0, "¿Qué tal el día?"], [1, "🔟 Ortografía 10: 8/10<br>⬛⬛🟥⬛⬛⬛🟥⬛⬛⬛<br>¿Bien o mal: «exhuberante»? ¿Me superas?<br><u>pacosql.github.io/…?reto=8/10</u>"], [0, "Ahora verás 😤"]]), { app: "WhatsApp" }),
      m("2 · Lo abre tu amigo", `<div class="mv-card"><b>⚔️ Te han retado: 8/10</b><p>Primero, la palabra trampa:</p><div class="mv-mid">exhuberante</div><div class="mv-2"><span>✓ Bien</span><span>✗ Mal</span></div></div><div class="mv-btn neg">Jugar</div>`),
      m("3 · El resultado", `<div class="mv-h">9 de 10</div><p>¡Has superado el reto! 🏆</p><div class="mv-btn neg">📤 Devolver el reto</div>`),
    ] },
  { id: "wordle", cat: "jue", pt: 10, por: "El formato que hizo viral a Wordle: un reto diario igual para todos y un resultado que no destripa. Lo mejor para arrancar.", e: "🟩", n: "Cuadrícula del Reto del día", red: "X / WhatsApp", tipo: "Juego diario",
    desc: "Como Wordle: una sola palabra al día igual para todos y un texto con emojis que no destripa la respuesta. Lo mejor para grupos de amigos.",
    pasos: ["Cada día, la misma palabra para todos.", "Al acabar, copias la cuadrícula sin spoilers.", "La pegas en el grupo y comparáis intentos."],
    mq: () => [
      m("1 · El reto de hoy", `<p class="mv-k">Reto del día · nº 214</p><div class="mv-grid">${[["3", "0", "2", "0", "0"], ["3", "3", "0", "3", "0"], ["3", "3", "3", "3", "3"]].map((f) => f.map((c) => `<i class="sq big ${c === "3" ? "n" : c === "2" ? "g" : ""}"></i>`).join("")).join("<br>")}</div><p>¡Acertada en 3! 🔥 Racha: 12 días</p><div class="mv-btn neg">Copiar resultado</div>`),
      m("2 · En el grupo", chat("Los del cole 🎒", [[0, "Ortografía 10 · nº 214 · 4/6<br>⬛⬛⬜⬜⬜<br>⬛⬜⬛⬜⬜<br>⬛⬛⬛⬛⬜<br>⬛⬛⬛⬛⬛"], [1, "Ortografía 10 · nº 214 · 3/6 🔥12<br>⬛⬜🟨⬜⬜<br>⬛⬛⬜⬛⬜<br>⬛⬛⬛⬛⬛"], [0, "¿¿Cómo lo haces??"]]), { app: "WhatsApp" }),
    ] },
  { id: "racha", cat: "jue", pt: 6, por: "Retiene a los que ya juegan, pero atrae poco antes de tener usuarios.", e: "🔥", n: "Racha de días y récords", red: "Instagram / TikTok", tipo: "Compartir",
    desc: "Compartir «🔥 30 días seguidos» o «récord de 47 en Supervivencia». Los récords crean pique entre amigos.",
    pasos: ["Al llegar a un hito (7, 30, 100 días) salta una tarjeta.", "Un toque la comparte como historia.", "Los récords de arcade también tienen la suya."],
    mq: () => [
      m("Hito de racha", `${logo}<div class="mv-big">🔥 30</div><p><b>días seguidos</b> aprendiendo ortografía</p><div class="mv-cal">${"1".repeat(30).split("").map(() => "<i></i>").join("")}</div>`, { app: "Instagram" }),
      m("Récord de arcade", `${logo}<p class="mv-k">❤️ Supervivencia</p><div class="mv-big">47</div><p>palabras seguidas sin perder las 3 vidas</p><div class="mv-trap"><small>¿Me superas?</small><b>🏆 Récord</b></div>`, { app: "Instagram" }),
    ] },
  { id: "nota", cat: "vir", pt: 7, por: "Presumir de nota funciona, sobre todo en LinkedIn; necesita que la Nota sea fiable.", e: "🎓", n: "Mi nota de ortografía", red: "Instagram / LinkedIn", tipo: "Compartir",
    desc: "Una imagen tipo boletín con tu nota de 0 a 10 por categoría (tildes, b/v, h…). Gusta presumir de un 9,5 en tildes.",
    pasos: ["En la pestaña Nota, «Compartir mi boletín».", "Imagen con tu nota global y por categoría.", "Ideal para LinkedIn: «mi ortografía, certificada»."],
    mq: () => [
      m("El boletín", `${logo}<p class="mv-k">Boletín de ortografía</p><div class="mv-big" style="font-size:44px">8,74</div>${[["🗣️ Acentuación", "9,50"], ["🅱️ B y V", "8,25"], ["🤫 La h", "9,00"], ["❗ Puntuación", "7,40"], ["🔗 Juntas o separadas", "8,90"]].map(([a, b]) => `<div class="mv-row"><span>${a}</span><b>${b}</b></div>`).join("")}`, { app: "Instagram" }),
      m("En LinkedIn", `<div class="mv-post"><b>Laura M. · Directora de comunicación</b><p>Hoy he sacado un 9,5 en tildes en Ortografía 10. En un CV, una tilde dice mucho. ¿Cuál es vuestra nota? 👇</p><div class="mv-img">8,74<br><small>ortografía 10</small></div><small>👍 128 · 34 comentarios</small></div>`, { app: "LinkedIn" }),
    ] },
  { id: "solo10", cat: "mkt", pt: 8, por: "Dato propio + reto = contenido semanal fácil; antes del lanzamiento se puede hacer con los datos de la beta.", e: "🧠", n: "«Solo el 10 % la escribe bien»", red: "Instagram / TikTok", tipo: "Marketing",
    desc: "Cada semana, la palabra que más se falla en la app (dato real de Supabase) como reto: «¿Eres del 10 %?». Datos reales = credibilidad.",
    pasos: ["Cada lunes se mira en Supabase la palabra más fallada.", "Se publica como post con encuesta.", "En la app sale un banner con el mismo reto."],
    mq: () => [
      m("El post", `<div class="mv-sq"><small>SOLO EL 11 %</small><b>la escribe bien</b><div class="mv-2 col"><span>exhuberante</span><span>exuberante</span></div><small>¿Eres del 11 %?</small></div><p class="mv-sm">❤️ 2.341 · 💬 412</p>`, { app: "Instagram" }),
      m("En la app", `<div class="mv-card"><b>🧠 Palabra de la semana</b><p>El 89 % de los que juegan la fallan.</p><div class="mv-mid">¿exuberante?</div><div class="mv-2"><span>✓ Bien</span><span>✗ Mal</span></div></div>`),
    ] },
  { id: "reel", cat: "mkt", pt: 7, por: "TikTok da alcance, pero hay que producir vídeos con constancia.", e: "🎬", n: "Vídeo vertical de una partida", red: "TikTok / Reels / Shorts", tipo: "Marketing",
    desc: "Botón que graba 15 s de Lluvia de palabras o Supervivencia como vídeo vertical con marcador. Los arcades se ven muy bien en vídeo.",
    pasos: ["En un arcade, pulsas ⏺ Grabar.", "Se guarda un vídeo vertical de 15 s con tu marcador.", "Lo subes a TikTok con el sonido del juego."],
    mq: () => [
      m("Grabando", `<div class="mv-hud"><span>♥♥♡</span><span>23 pts</span><span>⏺ 0:09</span></div><div class="mv-rain"><span style="left:8%;top:12%">exhuberante</span><span style="left:48%;top:30%">hierba</span><span style="left:18%;top:55%">aber</span><span style="left:55%;top:70%">jirafa</span></div>`),
      m("En TikTok", `<div class="mv-tt"><div class="mv-rain" style="height:62%"><span style="left:10%;top:20%">vurro</span><span style="left:45%;top:50%">caballo</span></div><div class="mv-side">❤️<br>12k<br><br>💬<br>843<br><br>↗️</div><p><b>@ortografia10</b> Nadie pasa de 30 en este juego 😳 #ortografía #reto</p></div>`, { app: "TikTok", negro: true }),
    ] },
  { id: "duelo", cat: "jue", pt: 8, por: "Pique uno contra uno muy fuerte; es la evolución natural del enlace de reto.", e: "⚔️", n: "Duelo con las mismas palabras", red: "WhatsApp", tipo: "Reto",
    desc: "Retas a un amigo con un enlace y os tocan exactamente los mismos 10 ejercicios. Al acabar se comparan los dos resultados.",
    pasos: ["«Retar a un amigo»: se crea un enlace con tu partida.", "Tu amigo juega los mismos 10 ejercicios.", "Pantalla final con los dos marcadores, pregunta a pregunta."],
    mq: () => [
      m("El duelo", `<p class="mv-k">⚔️ Duelo · mismas 10 preguntas</p><div class="mv-vs"><div><b>Tú</b><div class="mv-big" style="font-size:40px">8</div></div><span>vs</span><div><b>Ana</b><div class="mv-big" style="font-size:40px">7</div></div></div>${["hierba", "exuberante", "a ver", "porque", "vaya"].map((w, i) => `<div class="mv-row"><span>${w}</span><b>${i === 1 ? "✓ · ✗" : i === 3 ? "✗ · ✓" : "✓ · ✓"}</b></div>`).join("")}<div class="mv-btn neg">Revancha</div>`),
    ] },
  { id: "liga", cat: "jue", pt: 7, por: "Muy buena para clases y oficinas, pero necesita grupos que ya jueguen.", e: "🏆", n: "Liga semanal de clase o grupo", red: "WhatsApp / aula", tipo: "Juego",
    desc: "Un código de grupo (una clase, una familia, una oficina) con clasificación semanal. Muy útil para profesores.",
    pasos: ["Alguien crea el grupo y comparte el código.", "Cada acierto suma XP a la liga de la semana.", "El lunes se corona al campeón y se reinicia."],
    mq: () => [
      m("La clasificación", `<p class="mv-k">🏆 Liga 2.º B · semana 48</p>${[["1", "Lucía", "1.240"], ["2", "Hugo", "1.105"], ["3", "Tú", "980"], ["4", "Dani", "870"], ["5", "Sara", "640"], ["6", "Leo", "410"]].map(([n, a, x]) => `<div class="mv-row ${a === "Tú" ? "me" : ""}"><span>${n}. ${a}</span><b>${x} XP</b></div>`).join("")}<p class="mv-sm">Quedan 2 días · los 3 primeros suben de liga</p>`),
      m("Unirse", `<div class="mv-card"><b>Únete a un grupo</b><p>Escribe el código que te han pasado:</p><div class="mv-mid" style="letter-spacing:.2em">2B-ORTO</div></div><div class="mv-btn neg">Entrar en la liga</div>`),
    ] },
  { id: "carteles", cat: "mkt", pt: 7, por: "Contenido gratis hecho por la gente; necesita moderación.", e: "🪧", n: "Caza de carteles con falta", red: "Instagram / X", tipo: "Marketing",
    desc: "Los usuarios suben fotos de carteles reales con faltas; los mejores salen en el juego «El cartel con falta» con su nombre. Contenido generado por la gente.",
    pasos: ["Haces una foto a un cartel con falta.", "La subes desde la app con tu nombre.", "Si se elige, sale en el juego y en la cuenta de la app."],
    mq: () => [
      m("Subir un cartel", `<div class="mv-foto"><div class="mv-cartel">SE BENDE<br>PISO</div></div><div class="mv-btn neg">📷 Enviar cartel</div><p class="mv-sm">Si lo elegimos, saldrá con tu nombre.</p>`),
      m("En el juego", `<p class="mv-k">🪧 El cartel con falta</p><div class="mv-cartel" style="margin:10px auto">SE <u>BENDE</u> PISO</div><p class="mv-sm">📸 Cartel cazado por @marta_vlc</p><div class="mv-2"><span>Bende</span><span>Piso</span></div>`),
    ] },
  { id: "polemica", cat: "mkt", pt: 8, por: "La polémica (solo/sólo) da comentarios y alcance orgánico casi seguro.", e: "🔥", n: "Encuesta polémica del día", red: "Instagram / X", tipo: "Marketing",
    desc: "«¿Solo o sólo?», «¿Guion o guión?»: lo que vota la gente en la app frente a lo que dice la RAE. La polémica genera comentarios.",
    pasos: ["Cada día, una duda polémica en la app.", "Se publica el resultado: la gente frente a la RAE.", "Los comentarios hacen el resto."],
    mq: () => [
      m("La encuesta", `<div class="mv-sq"><small>POLÉMICA DEL DÍA</small><b>¿solo o sólo?</b><div class="mv-poll"><div style="width:62%">sólo · 62 %</div></div><div class="mv-poll"><div style="width:38%">solo · 38 %</div></div><small>La RAE: «solo», sin tilde 🤯</small></div>`, { app: "Instagram" }),
    ] },
  { id: "famosos", cat: "mkt", pt: 6, por: "Muy compartible pero con riesgo de derechos y de quedar mal; mejor anuncios y carteles anónimos.", e: "📰", n: "Faltas de titulares y anuncios", red: "X / Instagram", tipo: "Juego",
    desc: "Ejercicios con faltas reales de titulares, anuncios o carteles de series. Muy compartible; mejor sin nombres de personas para no tener problemas de derechos de imagen.",
    pasos: ["Se recopilan titulares y anuncios con faltas.", "Salen como «Caza la falta» con la fuente.", "El post semanal recoge la mejor."],
    mq: () => [
      m("El titular", `<div class="mv-post"><b>📰 Titular de la semana</b><div class="mv-news">El Gobierno <u>a</u> aprobado hoy la nueva ley de vivienda</div><p>¿Dónde está la falta? 👇</p><small>🔁 1.204 · ❤️ 5.320</small></div>`, { app: "X" }),
    ] },
  { id: "pegatinas", cat: "vir", pt: 6, por: "Se reenvían solas, pero cuesta que lleven a la app.", e: "🏷️", n: "Pegatinas y memes descargables", red: "WhatsApp / Telegram", tipo: "Marketing",
    desc: "Pegatinas de WhatsApp tipo «Haber si nos vemos 🤦» o «La coma salva vidas». Se reenvían solas en los grupos.",
    pasos: ["Pack de pegatinas en blanco y negro.", "Se añaden a WhatsApp con un toque.", "Cada pegatina lleva el logo pequeñito."],
    mq: () => [
      m("En un grupo", `${chat("Cena viernes 🍕", [[0, "Haber si nos vemos el viernes"]])}<div class="mv-stk">«A VER»,<br>no «haber» 🤦</div><div class="mv-b">jajaja ya está el de la ortografía</div><div class="mv-stk">LA COMA<br>SALVA VIDAS</div>`, { app: "WhatsApp" }),
    ] },
  { id: "profe", cat: "lan", pt: 8, por: "Un profe trae 25 alumnos de golpe: el mejor canal de adquisición antes del lanzamiento.", e: "👩‍🏫", n: "Modo profe: enviar un reto a la clase", red: "WhatsApp / Classroom", tipo: "Lanzamiento",
    desc: "El profesor elige un tipo de ejercicio y manda un enlace; ve quién lo ha hecho y la nota media. Los profes son grandes difusores.",
    pasos: ["El profe elige ejercicios y crea el reto.", "Lo pega en Classroom o en el grupo de la clase.", "Ve en directo quién lo ha hecho y en qué fallan."],
    mq: () => [
      m("Crear el reto", `<p class="mv-k">👩‍🏫 Nuevo reto para la clase</p>${["☑ ¿Bien o mal?", "☑ Pon la tilde", "☐ El autocorrector", "☑ ¿Es lo mismo?"].map((t) => `<div class="mv-row"><span>${t}</span></div>`).join("")}<div class="mv-btn neg">Crear enlace para 2.º B</div>`),
      m("El panel del profe", `<p class="mv-k">Reto «Tildes» · 2.º B</p><div class="mv-vs"><div><b>Hecho</b><div class="mv-big" style="font-size:34px">18/25</div></div><div><b>Media</b><div class="mv-big" style="font-size:34px">7,4</div></div></div><p class="mv-sm">Lo que más fallan:</p><div class="mv-row"><span>Hiatos (país, río)</span><b>52 %</b></div><div class="mv-row"><span>Diacríticas (tú/tu)</span><b>38 %</b></div>`),
    ] },
  { id: "insignias", cat: "jue", pt: 5, por: "Bonito para retener; aporta poco al lanzamiento.", e: "🏅", n: "Insignias coleccionables", red: "Instagram", tipo: "Juego",
    desc: "Medallas por hitos («Maestro de la h», «100 tildes seguidas») que se pueden compartir como imagen.",
    pasos: ["Cada hito desbloquea una insignia.", "Se ven en una vitrina, las que faltan en gris.", "Cada insignia nueva se puede compartir."],
    mq: () => [
      m("La vitrina", `<p class="mv-k">🏅 Tus insignias · 6/24</p><div class="mv-bdg">${[["🤫", "Maestro de la h", 1], ["´", "100 tildes", 1], ["🔥", "Racha 30", 1], ["🧺", "Cesta de oro", 1], ["⚔️", "Duelista", 1], ["🎯", "Francotirador", 1], ["🦸", "Salvavidas", 0], ["👑", "Rey del rosco", 0], ["📚", "Fichas 100", 0]].map(([e, n, s]) => `<div class="${s ? "" : "off"}"><span>${e}</span><small>${n}</small></div>`).join("")}</div>`),
      m("Nueva insignia", `<div style="text-align:center;margin-top:30px"><div style="font-size:64px">🤫</div><div class="mv-h">Maestro de la h</div><p>50 palabras con h seguidas sin fallar</p></div><div class="mv-btn neg">📤 Compartir</div>`),
    ] },
  { id: "espera", cat: "lan", pt: 9, por: "Crea expectación y una base de usuarios antes de abrir; invitar para subir puestos es viral por diseño.", e: "⏳", n: "Lista de espera con puesto", red: "Web / WhatsApp", tipo: "Lanzamiento",
    desc: "Antes de abrir, una página con el reto del día y «Apúntate a la lista». Te da tu puesto en la cola y subes puestos invitando a amigos.",
    pasos: ["La web abre con un ejercicio de prueba y la lista de espera.", "Al apuntarte ves tu puesto: nº 1.204.", "Cada amigo que se apunta con tu enlace te sube 100 puestos."],
    mq: () => [
      m("La web antes de abrir", `${logo}<div class="mv-h" style="font-size:17px">Aprende ortografía jugando</div><p>Llega en primavera. Prueba un ejercicio:</p><div class="mv-card"><div class="mv-mid">¿exuberante?</div><div class="mv-2"><span>✓ Bien</span><span>✗ Mal</span></div></div><div class="mv-btn neg">Apúntate a la lista</div>`),
      m("Tu puesto", `<p class="mv-k">⏳ Lista de espera</p><div class="mv-big" style="font-size:44px">nº 1.204</div><p>Invita a 3 amigos y sube 300 puestos.</p><div class="mv-btn neg">📤 Invitar por WhatsApp</div><p class="mv-sm">Has invitado a 1 · ¡ya eres el 1.104!</p>`),
    ] },
  { id: "influ", cat: "lan", pt: 9, por: "Las cuentas de ortografía ya tienen la audiencia exacta; un reto conjunto el día del lanzamiento da miles de usuarios.", e: "🤝", n: "Reto con cuentas de ortografía", red: "Instagram / TikTok", tipo: "Lanzamiento",
    desc: "Colaborar con divulgadores de lengua y profes con seguidores: el día del lanzamiento publican «¿Me superas?» con su propio reto en la app.",
    pasos: ["Se contacta con 10-20 cuentas de lengua y ortografía.", "Cada una tiene su reto con su nombre en la app.", "Publican el mismo día: «¿Superas mi 9/10?»."],
    mq: () => [
      m("La colaboración", `<div class="mv-post"><b>@cuenta_de_lengua × ortografía 10</b><div class="mv-img">9/10<br><small>¿me superas?</small></div><p>He hecho el reto de lanzamiento de Ortografía 10. Enlace en la bio 👆</p><small>❤️ 8.402 · 💬 1.210</small></div>`, { app: "Instagram" }),
      m("El reto en la app", `<div class="mv-card"><b>🤝 Reto de @cuenta_de_lengua</b><p>Sacó 9/10. ¿Le ganas?</p></div><div class="mv-btn neg">Aceptar el reto</div><p class="mv-sm">3.214 personas lo han intentado hoy</p>`),
    ] },
  { id: "diadellibro", cat: "lan", pt: 7, por: "Fecha con prensa y colegios ya atentos a la lengua; da una excusa para salir en medios.", e: "📖", n: "Lanzamiento el Día del Libro", red: "Prensa / colegios", tipo: "Lanzamiento",
    desc: "Abrir la app el 23 de abril con un «Reto nacional de ortografía» de 24 horas: un marcador en directo de cuántos aciertos lleva todo el país.",
    pasos: ["Anuncio previo a colegios y medios.", "El 23 de abril, reto de 24 h abierto a todos.", "Marcador en directo y resultados por comunidades."],
    mq: () => [
      m("El reto de 24 h", `<p class="mv-k">📖 23 de abril · Reto nacional</p><div class="mv-big" style="font-size:36px">1.284.502</div><p>aciertos de todo el país</p><div class="mv-row"><span>Quedan</span><b>06:12:45</b></div><div class="mv-row"><span>Tu comunidad</span><b>4.ª</b></div><div class="mv-btn neg">Sumar mis aciertos</div>`),
    ] },
  { id: "betaprofes", cat: "lan", pt: 8, por: "Probar con 20 clases antes de abrir da datos, testimonios y profes que luego la recomiendan.", e: "🧪", n: "Beta privada con profesores", red: "Correo / colegios", tipo: "Lanzamiento",
    desc: "Invitar a 20 profes de primaria y ESO a probarla con su clase antes del lanzamiento, a cambio de acceso gratis y su opinión.",
    pasos: ["Invitación por correo a profes de lengua.", "Un mes de uso en clase con el modo profe.", "Sus datos y frases sirven para el lanzamiento."],
    mq: () => [
      m("La invitación", `<div class="mv-wa"><b>📧 Invitación a la beta</b></div><p><b>Para:</b> profe de Lengua</p><p>Hola, Marta: estamos creando Ortografía 10, una app para aprender ortografía jugando. ¿Te gustaría probarla gratis con tu clase antes de que salga?</p><div class="mv-btn neg">Quiero probarla</div><p class="mv-sm">Plazas para 20 clases</p>`),
    ] },
  { id: "prensa", cat: "mkt", pt: 7, por: "Un dato propio y curioso es lo que más recogen los medios; sale gratis con los datos de la beta.", e: "🗞️", n: "Nota de prensa con un dato propio", red: "Prensa / X", tipo: "Marketing",
    desc: "Con los datos de la beta, un estudio sencillo: «Las 10 palabras que más fallan los españoles». Se manda a medios con la app como fuente.",
    pasos: ["Se sacan de Supabase las palabras más falladas.", "Se escribe una nota corta con el ranking.", "Se envía a medios y se publica en redes."],
    mq: () => [
      m("La noticia", `<div class="mv-post"><b>📰 Sociedad</b><div class="mv-news">Nueve de cada diez españoles escriben mal «exuberante», según una app de ortografía</div><p>«Exuberante», «absorber» y «haya» encabezan la lista de palabras más falladas…</p></div>`),
    ] },
];
