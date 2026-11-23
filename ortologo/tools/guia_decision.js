// Guía de la marca Ortografía10: qué está decidido, qué falta por decidir y
// cómo se usa la marca en la web, la app y los Reels. Documento vivo en PDF
// A4 para imprimir. El usuario la anota a mano y pide cambios: se edita el
// texto de aquí abajo, se sube la versión de la cabecera y se regenera.
//
//   node ortologo/tools/guia_decision.js [salida.pdf]
//
// Cambios pedidos hasta ahora:
//  v2 (23-nov-2026): fuera «qué es barato / caro de cambiar» y «antes de
//      imprimir nada»: irrelevante, no quiere releerlo.
//  v3 (23-nov-2026): fuera la fila «Hermano Mates10» de la comparación ñ / í.
//  v4 (23-nov-2026): Mates10 fuera del todo (el examen pasa a 9 preguntas).
//  v5 (23-nov-2026): el logo casi está decidido: el logotipo «Ortografía10» en
//      bloque (nº 1968, 2323, 2074, 1802, 1019) para la app y para Instagram;
//      el símbolo pequeño (favicon) queda entre la í y la ñ. Se añade la guía
//      de marca para desarrollar la web, la app y los Reels.
// No volver a meter: costes de cambiar, Mates10 / Serie 10 / hermanos.
const fs = require("fs"); const { chromium } = require("playwright");
const path = require("path"), { execSync } = require("child_process");
const F = path.resolve(__dirname, "..") + "/";
const LOGOS = [1968, 2323, 2074, 1802, 1019], SIMBOLOS = [667, 711, 712, 659, 728, 734];
const NUMS = [...LOGOS, ...SIMBOLOS];
const R = Object.fromEntries(JSON.parse(execSync(`bash ${JSON.stringify(path.join(__dirname, "sb.sh"))} GET 'ortologo_disenos?select=numero,titulo,svg_marca,svg_favicon,svg_wordmark,colores&numero=in.(${NUMS.join(",")})'`).toString()).map((r) => [r.numero, r]));
const SALIDA = process.argv[2] || "Ortografia10-guia-de-marca.pdf";
const font = (fam, w, file, st = "normal") => `@font-face{font-family:${fam};font-weight:${w};font-style:${st};src:url(data:font/woff2;base64,${fs.readFileSync(F + file).toString("base64")})}`;
const fonts = [font("Poppins", 400, "fonts/poppins-400.woff2"), font("Poppins", 500, "fonts/poppins-500.woff2"), font("Poppins", 600, "fonts/poppins-600.woff2"), font("Poppins", 700, "fonts/poppins-700.woff2"), font("Poppins", 800, "fonts/poppins-800.woff2"),
  font("Inter", 400, "fonts/inter-400.woff2"), font("Inter", 600, "fonts/inter-600.woff2"), font("Inter", 700, "fonts/inter-700.woff2"), font("Fraunces", 600, "fonts/fraunces-600.woff2"),
  font("Playfair", 900, "tools/fuentes/playfair-900.woff2"), font("Playfair", 900, "tools/fuentes/playfair-900i.woff2", "italic")].join("");
const svgDe = (r, campo = "svg_marca") => (r[campo] || r.svg_marca);
const ic = (n, px = 44, campo = "svg_marca", pie = true, radio = "22.5%") => { const r = R[n]; if (!r) return ""; const c = r.colores; return `<span class="ico"><span class="ic" style="width:${px}px;height:${px}px;border-radius:${radio};background:${c.icono_fondo};color:${c.icono_tinta};--a:${c.acento};--f:${c.icono_fondo}">${svgDe(r, campo)}</span>${pie ? `<small>nº ${n}</small>` : ""}</span>`; };
const fila = (ns, px, campo) => `<div class="icos">${ns.map((n) => ic(n, px, campo)).join("")}</div>`;
const wm = (n, alto, color) => { const r = R[n]; if (!r) return ""; return `<span class="wm" style="height:${alto}px;color:${color};--a:#E8443A;--f:transparent">${r.svg_wordmark.replace("<svg ", '<svg style="height:100%;width:auto;display:block" ')}</span>`; };
const sw = (hex, nombre, rol, claro) => `<div class="sw"><i style="background:${hex};${claro ? "box-shadow:inset 0 0 0 .8pt #d8d6cf" : ""}"></i><b>${nombre}</b><code>${hex}</code><span>${rol}</span></div>`;
const L = LOGOS[0];

const html = `<!doctype html><meta charset="utf-8"><style>${fonts}
@page{size:A4;margin:12mm 14mm 11mm}
*{box-sizing:border-box}body{margin:0;font-family:Poppins,sans-serif;font-size:9.3pt;line-height:1.42;color:#141413}
h1{font-family:Playfair,serif;font-weight:900;font-size:28pt;line-height:1.02;margin:0 0 5pt}h1 i{font-style:italic}
h2{font-family:Playfair,serif;font-weight:900;font-size:15pt;line-height:1.15;margin:11pt 0 4pt;break-after:avoid}
h2 span{font-family:Poppins;font-size:9pt;font-weight:700;color:#141839;background:#fecb3b;border-radius:99px;padding:1pt 8pt;margin-right:6pt;vertical-align:3pt}
h3{font-size:10pt;margin:7pt 0 2pt;break-after:avoid}
.parte{font-family:Poppins;font-size:8pt;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#6b6a66;border-top:2.5pt solid #141413;padding-top:5pt;margin:2pt 0 2pt}
p{margin:0 0 4pt}.lead{font-size:10pt}
.hero{background:#141839;color:#fecb3b;border-radius:14pt;padding:14pt 18pt 13pt;margin-bottom:8pt;display:flex;gap:16pt;align-items:center}.hero p{color:#f6f2ea;margin:0;font-size:10.3pt}.hero .k{font-size:8pt;letter-spacing:.16em;text-transform:uppercase;font-weight:600;opacity:.85;margin-bottom:5pt}
table{width:100%;border-collapse:collapse;margin:3pt 0 5pt;font-size:8.7pt;break-inside:avoid}
th{text-align:left;font-size:7.6pt;letter-spacing:.07em;text-transform:uppercase;color:#6b6a66;font-weight:600;padding:4pt 6pt;border-bottom:2pt solid #141413}
td{padding:3.2pt 6pt;border-bottom:.6pt solid #dedcd5;vertical-align:top}td:first-child{font-weight:600}
.ok{color:#1f9d55;font-weight:700}.pend{color:#c98a12;font-weight:700}.no{color:#d6453d;font-weight:700}
.box{border:1.6pt solid #141413;border-radius:11pt;padding:7pt 11pt;margin:5pt 0;break-inside:avoid}.box.sol{background:#fecb3b;border-color:#fecb3b}.box.papel{background:#f6f2ea;border-color:#f6f2ea}
.icos{display:flex;gap:9pt;flex-wrap:wrap;margin:4pt 0 2pt;align-items:flex-end}.ico{display:inline-flex;flex-direction:column;align-items:center;gap:2pt}.ico small{font-size:6.8pt;color:#6b6a66}
.ic{display:block;overflow:hidden}.ic svg{display:block;width:100%;height:100%}.acento{fill:var(--a)}.acento-trazo{stroke:var(--a)}.fondo{fill:var(--f)}.fondo-trazo{stroke:var(--f)}
.wm{display:inline-block}.wm .acento{fill:var(--a)}
ol,ul{margin:1pt 0 4pt;padding-left:15pt}li{margin-bottom:1.2pt}
.paso{display:grid;grid-template-columns:26pt 1fr;gap:0 8pt;margin:0 0 4pt;break-inside:avoid}.paso .n{width:20pt;height:20pt;border-radius:50%;background:#fecb3b;color:#141839;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:10pt}.paso b{display:block}
.punt td{height:15pt}.punt td:not(:first-child){border-left:.6pt solid #dedcd5;width:17%}.punt td:first-child{font-weight:500}
.ficha{display:grid;grid-template-columns:1fr 1fr;gap:6pt 18pt;font-size:10pt}.ficha div{border-bottom:1pt solid #141413;padding:7pt 0 2pt}.ficha b{font-weight:600}
.dos{display:grid;grid-template-columns:1fr 1fr;gap:8pt}.dos .box{margin:0}.tres{display:grid;grid-template-columns:repeat(3,1fr);gap:8pt}
.salto{break-before:page}.nota{font-size:8.2pt;color:#6b6a66}
.sws{display:grid;grid-template-columns:repeat(3,1fr);gap:6pt 10pt;margin:4pt 0}.sw{display:grid;grid-template-columns:34pt 1fr;grid-template-rows:auto auto auto;column-gap:7pt;font-size:8.2pt;line-height:1.25}.sw i{grid-row:1/4;width:34pt;height:34pt;border-radius:8pt}.sw code{font-size:7.6pt;color:#6b6a66}.sw span{color:#3b3a37}
.prop{display:flex;height:16pt;border-radius:5pt;overflow:hidden;margin:3pt 0 2pt}
.spec{border:1pt solid #e6e4dd;border-radius:9pt;padding:7pt 10pt;margin:3pt 0}.spec .a{font-family:Poppins;font-weight:800;font-size:22pt;line-height:1.05;letter-spacing:-.02em}.spec .b{font-family:Inter;font-size:10.5pt;line-height:1.5}.spec .c{font-family:Fraunces;font-weight:600;font-size:19pt;line-height:1.1}
.sino td:first-child{font-weight:400;color:#1f6b3f}.sino td:nth-child(2){color:#8f2f29}
.reel{display:grid;grid-template-columns:repeat(5,1fr);gap:5pt;margin:4pt 0}.reel div{border-radius:7pt;background:#141839;color:#f6f2ea;padding:6pt 6pt 7pt;font-size:7.6pt;line-height:1.3;min-height:58pt}.reel b{display:block;color:#fecb3b;font-size:8pt;margin-bottom:2pt}
.check li{list-style:none;margin-left:-14pt}.check li:before{content:"☐ ";font-size:10pt}
.mal{display:grid;grid-template-columns:repeat(4,1fr);gap:6pt}.mal div{border:1pt solid #e6e4dd;border-radius:8pt;padding:6pt;text-align:center;font-size:7.6pt;color:#6b6a66}.mal .x{color:#d6453d;font-weight:800}
</style>

<div class="hero"><div style="flex:1"><div class="k">Ortografía10 · guía de marca</div><h1>La marca, <i>decidida y explicada</i></h1><p>Qué está decidido, qué falta por decidir y cómo se usa la marca en la app, la web y los Reels. Es la referencia para desarrollar todo lo demás.</p><p style="font-size:7.5pt;opacity:.7;margin-top:6pt">Documento vivo · versión 5 · 23 de noviembre de 2026</p></div>${ic(L, 92, "svg_marca", false)}</div>

<div class="parte">Parte 1 · Decisiones</div>
<h2><span>1</span>Dónde estamos</h2>
<table><tr><th>Pieza</th><th>Estado</th><th>Qué hay</th></tr>
<tr><td>Nombre</td><td class="ok">Decidido</td><td>«Ortografía10»: junto, con tilde en la í, sin espacio. Dominio ortografia10.com comprado.</td></tr>
<tr><td>Logo principal</td><td class="pend">Casi</td><td>El nombre compuesto en bloque, «Orto / grafía / 10». Para el icono de la app y la foto de Instagram. Falta la versión exacta.${fila(LOGOS, 30)}</td></tr>
<tr><td>Símbolo pequeño</td><td class="pend">Pendiente</td><td>Solo donde el bloque no cabe (favicon, notificaciones): la í o la ñ.${fila([711, 667, 659, 728], 22)}</td></tr>
<tr><td>Colores</td><td class="ok">Casi</td><td>Amarillo y azul noche, con negro como alternativa. Rojo y verde solo para error y acierto.</td></tr>
<tr><td>Tipografía</td><td class="pend">Propuesta</td><td>Poppins para el logo, titulares y Reels; Inter para el texto de la web y la app.</td></tr>
<tr><td>Nombre en redes</td><td class="pend">Pendiente</td><td>ortografia10 a secas si está libre; si no, ortografia10.com en todas.</td></tr>
<tr><td>Voz, Reels, web</td><td class="pend">Propuesta</td><td>En la parte 2 de esta guía.</td></tr></table>

<h2><span>2</span>Dónde va cada pieza</h2>
<table><tr><th>Dónde lo ven</th><th>Qué pieza</th><th>Por qué</th></tr>
<tr><td>Icono de App Store y Google Play</td><td>Logo en bloque</td><td>Así lo has decidido: el nombre entero se lee a 60 px y enseña cómo se escribe</td></tr>
<tr><td>Foto de perfil (Instagram, TikTok, YouTube)</td><td>Logo en bloque</td><td>Mismo icono que la app: quien lo ve en redes lo reconoce en la tienda</td></tr>
<tr><td>Favicon y notificaciones</td><td>Símbolo pequeño (í o ñ)</td><td>A 16 px el bloque es una mancha: hace falta una sola letra</td></tr>
<tr><td>Cabecera de la web</td><td>Icono pequeño + nombre en una línea</td><td>Como en la sección 🌐 Web de la app</td></tr>
<tr><td>Inicio y cierre de cada Reel</td><td>Logo en bloque</td><td>Es donde se aprende el nombre</td></tr>
<tr><td>Pegatina, imán, marcapáginas</td><td>Logo en bloque + ortografia10.com</td><td>Quien no te conoce necesita saber qué buscar</td></tr></table>
<div class="box papel"><b>Regla:</b> el nombre se lee siempre. El símbolo pequeño solo aparece donde el logo en bloque no cabe, y nunca en un sitio donde alguien te vea por primera vez.</div>

<h2><span>3</span>Elegir la versión exacta del logo</h2>
<p>Ya tienes la familia. Quedan cuatro decisiones pequeñas, en este orden. Usa en la app la vista de iPhone, la de favicon y la 🌐 Web para comprobarlas.</p>
<table><tr><th>Decisión</th><th>Opciones</th><th>Mi consejo</th></tr>
<tr><td>Composición</td><td>Tres líneas iguales (1802, 2074) · «grafía» grande con «Orto» y 10 pequeños (1019, 1968) · Orto y grafía grandes con el 10 pequeño abajo a la derecha</td><td>Orto y grafía grandes y el 10 pequeño: el nombre se lee mejor en el móvil y el 10 queda como «nota».</td></tr>
<tr><td>La í</td><td>Tilde roja · í entera roja · sin color</td><td>Tilde roja: es la única corrección del logo y es justo lo que enseñas. La í entera roja pesa demasiado.</td></tr>
<tr><td>Color</td><td>Amarillo con letras azul noche · azul noche con letras amarillas · negro</td><td>Amarillo de fondo: es lo que más destaca entre apps y lo que ya usan tus Reels.</td></tr>
<tr><td>Letra</td><td>Poppins ExtraBold · Poppins Black · otras</td><td>Poppins ExtraBold: la de los vídeos. Que el logo y los Reels sean la misma letra.</td></tr></table>
<div class="box"><b>Dos comprobaciones obligatorias.</b> 1) Mira el icono a 60 px en la hoja de iPhones: el 10 pequeño tiene que leerse. 2) Nada de «.com» dentro del logo (1802, 2074): la dirección va al lado, porque dentro lo fecha y lo hace ilegible en pequeño.</div>

<h2><span>4</span>El símbolo pequeño: í o ñ</h2>
<table><tr><th></th><th>La ñ ${fila([711, 667, 712], 24)}</th><th>La í ${fila([659, 728, 734], 24)}</th></tr>
<tr><td>A favor</td><td>Es la que más gusta. Simpática, redonda, se recuerda sola.</td><td>Está en tu nombre: es la misma í de la tilde roja del logo.</td></tr>
<tr><td>En contra</td><td>Dice «español» antes que «ortografía». No está en «Ortografía10».</td><td>Una i en un cuadrado o un círculo puede leerse como «información».</td></tr></table>
<p><b>Mi consejo:</b> la í con su tilde roja, recortada del propio logo. Así el favicon es un trozo del logo y no un dibujo aparte. Si eliges la ñ, que tenga la misma letra y los mismos colores que el bloque.</p>

<h2><span>5</span>.com o .app en las redes</h2>
<ol><li>Si <b>ortografia10</b> a secas está libre en Instagram, TikTok y YouTube, cógelo.</li><li>Si no, <b>ortografia10.com</b> en todas, idéntico en redes, pegatinas y marcapáginas.</li><li>Compra también el <b>.app</b> y que lleve al mismo sitio.</li></ol>

<h2 class="salto"><span>6</span>El proceso para cerrar el logo</h2>
<div class="paso"><div class="n">1</div><div><b>Preselección</b>De tus 👍 de la familia en bloque, quédate con tres. Si dos se parecen mucho, son el mismo.</div></div>
<div class="paso"><div class="n">2</div><div><b>Imprime</b>La hoja de iPhones, la de favicons y el A4 de cada finalista. Al 100 %.</div></div>
<div class="paso"><div class="n">3</div><div><b>Pruebas</b> El metro (encuéntralo en la hoja de iPhones a un metro) · los cinco segundos (míralo, dale la vuelta, dibújalo) · la fotocopia en blanco y negro · el círculo (avatar) · la web en el móvil.</div></div>
<div class="paso"><div class="n">4</div><div><b>Puntúa</b>Quien falle una de las cuatro primeras queda fuera.</div></div>
<table class="punt"><tr><th>Pregunta</th><th>Logo nº ____</th><th>Logo nº ____</th><th>Logo nº ____</th></tr>
${["¿Se entiende en un segundo?", "¿Lo dibujaría de memoria?", "¿Se reconoce pequeño (60 px)?", "¿Funciona a una tinta?", "¿Destaca entre las apps?", "¿Tiene que ver con lo que soy?", "¿Aguantará veinte años?", "¿Vale para todo?", "¿Es mío?"].map((q, i) => `<tr${i === 3 ? ' style="border-bottom:2pt solid #141413"' : ""}><td>${i + 1}. ${q}</td><td></td><td></td><td></td></tr>`).join("")}
<tr><td><b>Total</b></td><td></td><td></td><td></td></tr></table>

<div class="parte salto">Parte 2 · Guía de marca</div>
<h2><span>7</span>Quiénes somos</h2>
<table><tr><td style="width:23%">Propósito</td><td>Que nadie pierda puntos, ni oportunidades, por una falta de ortografía.</td></tr>
<tr><td>Promesa</td><td><b>Una regla. Un minuto.</b> Cada día una regla, explicada en lo que dura un Reel.</td></tr>
<tr><td>Para quién</td><td>Estudiantes de 17-18 años que preparan la EBAU y opositores. Adultos que quieren escribir sin miedo. Nada infantil.</td></tr>
<tr><td>Personaje</td><td><b>Sabio con corazón de Héroe:</b> da la regla clara (Sabio) y te entrena para el examen (Héroe). Ni payaso ni academia.</td></tr>
<tr><td>Personalidad</td><td>Clara · rápida · exigente pero amable · de aquí.</td></tr>
<tr><td>Lo que no somos</td><td>Un libro de texto, un profesor que regaña, una app para niños, la RAE.</td></tr></table>

<h2><span>8</span>Cómo hablamos</h2>
<ul><li><b>De tú</b>, frases cortas, una idea por frase. Si cabe en una línea, mejor.</li>
<li><b>La regla primero</b>, la excepción después. Siempre con un ejemplo que se quede.</li>
<li><b>Sin sermón:</b> nunca «muy mal», «error grave», «deberías saberlo». El error se señala, no se castiga.</li>
<li><b>Cero faltas, siempre:</b> la marca no puede tener ni una. Tildes en mayúsculas («ÍNDICE»), comillas españolas «», signos de apertura ¿¡.</li>
<li><b>Palabras de la casa:</b> regla · falta · acierto · racha · «busca el error» · «mañana, otra regla».</li></ul>
<table class="sino"><tr><th>Así sí</th><th>Así no</th></tr>
<tr><td>«Camión lleva tilde: aguda acabada en n.»</td><td>«Error ortográfico: acentuación incorrecta de palabra aguda.»</td></tr>
<tr><td>«¡Correcta! Llevas 7 seguidas.»</td><td>«¡¡¡Increíble!!! 🎉🎉 Eres un crack de la ortografía!!»</td></tr>
<tr><td>«Casi. Aquí va sin tilde: «aun» es «incluso».»</td><td>«Incorrecto. Repasa las normas de acentuación.»</td></tr>
<tr><td>«Mañana, otra regla.»</td><td>«No olvides volver mañana para seguir aprendiendo con nosotros.»</td></tr></table>

<h2><span>9</span>El logo: versiones y reglas</h2>
<div class="tres"><div class="box papel"><b>Principal · en bloque</b><br>Icono de la app, avatar, Reels, pegatinas.<br>${ic(L, 44, "svg_marca", false)}</div>
<div class="box papel"><b>Horizontal · una línea</b><br>Cabecera de la web, firmas, pies de página.<br><div style="margin-top:6pt">${wm(L, 18, "#141839")}</div></div>
<div class="box papel"><b>Símbolo · solo pequeño</b><br>Favicon y notificaciones.<br><div style="margin-top:4pt">${ic(2323, 22, "svg_favicon", false)}</div></div></div>
<p><b>Aire alrededor:</b> deja al menos la altura de la «O» libre por los cuatro lados. <b>Tamaño mínimo:</b> bloque 48 px en pantalla y 15 mm impreso; una línea 90 px y 25 mm; símbolo 16 px.</p>
<div class="mal">${["Estirarlo o inclinarlo", "Cambiarle los colores o la letra", "Separar el 10 o cambiarlo de sitio", "Ponerle .com, sombras o degradados", "Ponerlo sobre fotos sin contraste", "Escribir «Ortografia10» sin tilde", "Escribir «Ortografía 10» con espacio", "Usar la tilde roja en otra letra"].map((t) => `<div><span class="x">✗</span><br>${t}</div>`).join("")}</div>

<h2 class="salto"><span>10</span>Color</h2>
<div class="sws">${sw("#FECB3B", "Amarillo", "El color de la marca. Fondos, botones, lo importante.")}${sw("#141839", "Azul noche", "Texto sobre amarillo y fondo oscuro de Reels y app.")}${sw("#111111", "Negro", "Alternativa editorial al azul noche.")}
${sw("#FAF8F3", "Papel", "Fondo claro de la web y de la app.", true)}${sw("#E8443A", "Rojo tilde", "Solo la tilde del logo y los errores.")}${sw("#3FD480", "Verde acierto", "Solo para «¡Correcta!» y rachas.")}</div>
<div class="prop"><span style="flex:6;background:#FAF8F3;box-shadow:inset 0 0 0 .8pt #d8d6cf"></span><span style="flex:3;background:#141839"></span><span style="flex:1;background:#FECB3B"></span></div>
<p class="nota">Proporción en una pantalla normal: 60 % papel, 30 % azul noche, 10 % amarillo. En los Reels se invierte: el azul noche de fondo y el amarillo para lo que hay que mirar.</p>
<ul><li><b>Rojo y verde nunca decoran:</b> solo dicen «falta» y «acierto». Y siempre con una palabra o un icono además del color (✗ / ✓), por quien no distingue colores.</li>
<li><b>Contraste:</b> amarillo sobre azul noche, sí. Amarillo sobre blanco, nunca para texto: no se lee.</li></ul>

<h2><span>11</span>Tipografía</h2>
<div class="spec"><div class="a">Una regla. Un minuto.</div><div class="nota">Poppins ExtraBold · logo, titulares, botones grandes y Reels. Es la letra que ya usan tus vídeos.</div></div>
<div class="spec"><div class="b">«Camión» lleva tilde porque es aguda y acaba en n. Las agudas llevan tilde cuando terminan en n, s o vocal.</div><div class="nota">Inter Regular · todo el texto de la web y de la app. Hecha para leerse en pantalla.</div></div>
<div class="spec"><div class="c">Cero faltas el día del examen.</div><div class="nota">Fraunces (opcional) · solo si eliges el estilo «Cálida» para la web: titulares editoriales con serifa.</div></div>
<table><tr><th>Uso</th><th>Móvil</th><th>Ordenador</th><th>Letra</th></tr>
<tr><td>Titular de portada</td><td>40 px</td><td>64-68 px</td><td>Poppins 800 o Inter 700</td></tr><tr><td>Título de sección</td><td>30 px</td><td>44 px</td><td>Poppins 800</td></tr>
<tr><td>Texto</td><td>17 px</td><td>17-18 px</td><td>Inter 400, interlineado 1,5</td></tr><tr><td>Pie y notas</td><td>13 px</td><td>13-14 px</td><td>Inter 400</td></tr></table>
<p class="nota">Las tres son gratuitas y de licencia libre (OFL): se pueden usar en la web, la app y los vídeos sin pagar.</p>

<h2 class="salto"><span>12</span>Reels y redes</h2>
<p>Cada Reel es la marca en movimiento: misma estructura, mismos colores, misma letra. Así se reconoce antes de leer el nombre.</p>
<div class="reel"><div><b>0-1 s · Gancho</b>«¿Bien o mal?» o «Busca el error», en la pastilla roja.</div><div><b>1-5 s · La frase</b>Una sola frase con el error, grande, en el centro.</div><div><b>5-10 s · ¡Aquí está!</b>El error resaltado en amarillo y la palabra bien escrita en verde.</div><div><b>10-25 s · La regla</b>La regla en una línea y tres ejemplos.</div><div><b>Cierre</b>El logo en bloque y «Mañana, otra regla.»</div></div>
<ul><li><b>Formato:</b> 1080 × 1920, fondo azul noche, Poppins ExtraBold. Deja libres los 250 px de arriba y los 400 de abajo: ahí van los botones de la red.</li>
<li><b>Siempre con texto en pantalla</b> (la mayoría lo ve sin sonido) y la misma firma sonora corta en el cierre.</li>
<li><b>Portada de la cuadrícula:</b> la palabra del día en grande (camión, aún, sino), para que el perfil parezca un índice de reglas.</li>
<li><b>Perfil:</b> foto = logo en bloque; nombre «Ortografía10»; bio: «Una regla. Un minuto. Cero faltas el día del examen.» + enlace a ortografia10.com.</li>
<li><b>Ritmo:</b> mejor un Reel al día a la misma hora que cinco un día y ninguno en una semana.</li></ul>

<h2><span>13</span>Web y app</h2>
<p>Tienes cuatro estilos de web para comparar en la app (🌐 Web): <b>Simple</b> (blanco, tipo Easlo), <b>Cálida</b> (papel y serifa, tipo Claude), <b>Oscura</b> (como los Reels) y <b>A todo color</b> (amarillo). Mi consejo: <b>Simple o Cálida para la web</b>, porque se lee mejor y deja que el logo amarillo destaque; <b>Oscura dentro de la app</b>, para que el ejercicio se vea como en los Reels.</p>
<div class="dos"><div class="box papel"><b>Componentes</b><ul><li>Botones de píldora: azul noche (principal) y gris claro (secundario).</li><li>Tarjetas con esquinas de 16-20 px y sin sombras fuertes.</li><li>Espaciado en múltiplos de 8 px; mucho aire.</li><li>Iconos de línea, simples, del mismo grosor.</li></ul></div>
<div class="box papel"><b>La pantalla del ejercicio</b><ul><li>La frase en Poppins ExtraBold, grande, centrada.</li><li>Error: resaltado amarillo + ✗ rojo. Acierto: palabra en verde + ✓.</li><li>Debajo, la regla en una línea de Inter.</li><li>Botones grandes para el pulgar: «Lleva tilde» / «No lleva».</li></ul></div></div>
<p><b>Accesibilidad:</b> texto de 16 px como mínimo, contraste suficiente (nada de amarillo sobre blanco), y el color nunca va solo.</p>

<h2><span>14</span>Lo que queda por decidir</h2>
<ul class="check"><li>Versión exacta del logo en bloque (composición, í, color, letra) · nº ______</li><li>Símbolo pequeño para el favicon: í o ñ · nº ______</li><li>Nombre en redes: ortografia10 / ortografia10.com</li><li>Estilo de la web: Simple / Cálida / Oscura / A todo color</li><li>Letra del texto: Inter (propuesta) u otra</li><li>Firma sonora de los Reels</li><li>Registro de la marca en la OEPM con el logo elegido</li></ul>
<div class="box"><div class="ficha"><div><b>Logo:</b> nº</div><div><b>Símbolo pequeño:</b> nº</div><div><b>Colores:</b></div><div><b>Letras:</b></div><div><b>Nombre en redes:</b></div><div><b>Estilo de web:</b></div></div></div>`;
(async () => { const b = await chromium.launch(); const p = await b.newPage(); await p.setContent(html, { waitUntil: "load" }); await p.evaluate(() => document.fonts.ready); await p.pdf({ path: SALIDA, format: "A4", printBackground: true, preferCSSPageSize: true }); await b.close(); })();
