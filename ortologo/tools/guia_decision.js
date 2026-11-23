// Guía de decisión de la marca (documento vivo, PDF de 3 hojas A4 para imprimir).
// El usuario la va anotando a mano y pidiendo cambios: se edita el texto de
// aquí abajo, se sube la versión de la cabecera y se vuelve a generar.
//
//   node ortologo/tools/guia_decision.js [salida.pdf]
//
// Cambios pedidos hasta ahora:
//  v2 (23-nov-2026): fuera «qué es barato / caro de cambiar» y «antes de
//      imprimir nada»: irrelevante, no quiere releerlo.
//  v3 (23-nov-2026): fuera la fila «Hermano Mates10» de la comparación ñ / í:
//      no la quiere para nada.
//  v4 (23-nov-2026): Mates10 fuera del todo: también la pregunta «¿Da familia?»
//      de la tabla de puntuar (el examen pasa a ser de 9 preguntas).
const fs = require("fs"); const { chromium } = require("playwright");
const path = require("path"), { execSync } = require("child_process");
const F = path.resolve(__dirname, "..") + "/";
const NUMS = [667, 711, 712, 726, 659, 728, 734, 947, 721, 971, 1019];
const R = Object.fromEntries(JSON.parse(execSync(`bash ${JSON.stringify(path.join(__dirname, "sb.sh"))} GET 'ortologo_disenos?select=numero,titulo,svg_marca,colores&numero=in.(${NUMS.join(",")})'`).toString()).map((r) => [r.numero, r]));
const SALIDA = process.argv[2] || "Ortografia10-guia-de-decision.pdf";
const font = (fam, w, file, st = "normal") => `@font-face{font-family:${fam};font-weight:${w};font-style:${st};src:url(data:font/woff2;base64,${fs.readFileSync(F + file).toString("base64")})}`;
const fonts = [font("Poppins", 400, "fonts/poppins-400.woff2"), font("Poppins", 500, "fonts/poppins-500.woff2"), font("Poppins", 600, "fonts/poppins-600.woff2"), font("Poppins", 700, "fonts/poppins-700.woff2"), font("Poppins", 800, "fonts/poppins-800.woff2"), font("Playfair", 900, "tools/fuentes/playfair-900.woff2"), font("Playfair", 900, "tools/fuentes/playfair-900i.woff2", "italic")].join("");
const ic = (n, px = 44) => { const r = R[n]; if (!r) return ""; const c = r.colores; return `<span class="ico"><span class="ic" style="width:${px}px;height:${px}px;background:${c.icono_fondo};color:${c.icono_tinta};--a:${c.acento};--f:${c.icono_fondo}">${r.svg_marca}</span><small>nº ${n}</small></span>`; };
const fila = (ns, px) => `<div class="icos">${ns.map((n) => ic(n, px)).join("")}</div>`;
const html = `<!doctype html><meta charset="utf-8"><style>${fonts}
@page{size:A4;margin:12mm 14mm 11mm}
*{box-sizing:border-box}body{margin:0;font-family:Poppins,sans-serif;font-size:9.3pt;line-height:1.42;color:#141413}
h1{font-family:Playfair,serif;font-weight:900;font-size:28pt;line-height:1.02;margin:0 0 5pt}h1 i{font-style:italic}
h2{font-family:Playfair,serif;font-weight:900;font-size:15pt;line-height:1.15;margin:10pt 0 4pt;break-after:avoid}
h2 span{font-family:Poppins;font-size:9pt;font-weight:700;color:#141839;background:#fecb3b;border-radius:99px;padding:1pt 8pt;margin-right:6pt;vertical-align:3pt}
p{margin:0 0 4pt}.lead{font-size:10pt}
.hero{background:#141839;color:#fecb3b;border-radius:14pt;padding:14pt 18pt 13pt;margin-bottom:8pt}.hero p{color:#f6f2ea;margin:0;font-size:10.5pt}.hero .k{font-size:8pt;letter-spacing:.16em;text-transform:uppercase;font-weight:600;opacity:.85;margin-bottom:6pt}
table{width:100%;border-collapse:collapse;margin:3pt 0 5pt;font-size:8.7pt;break-inside:avoid}
th{text-align:left;font-size:7.6pt;letter-spacing:.07em;text-transform:uppercase;color:#6b6a66;font-weight:600;padding:4pt 6pt;border-bottom:2pt solid #141413}
td{padding:3.2pt 6pt;border-bottom:.6pt solid #dedcd5;vertical-align:top}td:first-child{font-weight:600}
.box{border:1.6pt solid #141413;border-radius:11pt;padding:7pt 11pt;margin:5pt 0;break-inside:avoid}.box.sol{background:#fecb3b;border-color:#fecb3b}.box.papel{background:#f6f2ea;border-color:#f6f2ea}
.icos{display:flex;gap:9pt;flex-wrap:wrap;margin:4pt 0 2pt}.ico{display:inline-flex;flex-direction:column;align-items:center;gap:2pt}.ico small{font-size:6.8pt;color:#6b6a66}
.ic{display:block;border-radius:22.5%;overflow:hidden}.ic svg{display:block;width:100%;height:100%}.acento{fill:var(--a)}.acento-trazo{stroke:var(--a)}.fondo{fill:var(--f)}.fondo-trazo{stroke:var(--f)}
ol,ul{margin:1pt 0 4pt;padding-left:15pt}li{margin-bottom:1pt}
.paso{display:grid;grid-template-columns:26pt 1fr;gap:0 8pt;margin:0 0 4pt;break-inside:avoid}.paso .n{width:20pt;height:20pt;border-radius:50%;background:#fecb3b;color:#141839;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:10.5pt}.paso b{display:block}
.punt td{height:15pt}.punt td:not(:first-child){border-left:.6pt solid #dedcd5;width:17%}.punt td:first-child{font-weight:500}
.ficha{display:grid;grid-template-columns:1fr 1fr;gap:6pt 18pt;font-size:10.5pt}.ficha div{border-bottom:1pt solid #141413;padding:7pt 0 2pt}.ficha b{font-weight:600}
.dos{display:grid;grid-template-columns:1fr 1fr;gap:8pt}.dos .box{margin:0}
.salto{break-before:page}.nota{font-size:8.4pt;color:#6b6a66}
</style>
<div class="hero"><div class="k">Ortografía10 · guía de decisión</div><h1>Cómo decidir la marca <i>en una tarde</i></h1><p>Qué usar como símbolo, como logotipo y como dirección; dónde va cada cosa; y seis pruebas para validarlo tú solo en unas dos horas.</p><p style="font-size:7.5pt;opacity:.7;margin-top:6pt">Documento vivo · versión 4 · 23 de noviembre de 2026</p></div>

<h2><span>1</span>No es una decisión, son tres</h2>
<p class="lead">Tu duda —«la ñ o el nombre con letras»— desaparece cuando ves que no compiten. Una marca tiene piezas distintas para sitios distintos, y puedes quedarte con la ñ <b>y</b> con las letras.</p>
<table><tr><th>Pieza</th><th>Qué es</th><th>Tus candidatos</th></tr>
<tr><td>Símbolo</td><td>El dibujo pequeño</td><td>${fila([667, 711, 712, 726, 659, 728, 734], 34)}</td></tr>
<tr><td>Logotipo</td><td>El nombre escrito</td><td>${fila([947, 721, 971, 1019], 34)}</td></tr>
<tr><td>Dirección</td><td>Cómo te buscan</td><td>ortografia10.com &nbsp;o&nbsp; ortografia10.app</td></tr></table>
<p>Tienes que elegir <b>una de cada fila, en ese orden</b>.</p>

<h2><span>2</span>Dónde va cada pieza</h2>
<table><tr><th>Dónde lo ven</th><th>Qué pieza manda</th><th>Por qué</th></tr>
<tr><td>Icono de App Store / Google Play</td><td>Símbolo</td><td>A ese tamaño, tres líneas de texto no se leen</td></tr>
<tr><td>Favicon</td><td>Símbolo</td><td>16 píxeles: solo cabe una letra</td></tr>
<tr><td>Foto de perfil en redes</td><td>Símbolo</td><td>Es redonda y casi siempre diminuta</td></tr>
<tr><td>Pegatina o imán del coche</td><td>Símbolo + nombre + dirección</td><td>Quien no te conoce necesita saber qué buscar</td></tr>
<tr><td>Marcapáginas</td><td>Logotipo + símbolo + dirección</td><td>Hay sitio y se mira de cerca, con calma</td></tr>
<tr><td>Inicio y cierre de cada Reel</td><td>Logotipo</td><td>Es donde se aprende el nombre</td></tr>
<tr><td>Cabecera de la web</td><td>Símbolo y logotipo juntos</td><td></td></tr></table>
<div class="box papel"><b>Regla:</b> el símbolo solo nunca va sin el nombre cerca hasta que la gente lo asocie. En las redes eso ya ocurre: el nombre de la cuenta sale al lado de la foto.</div>


<h2 class="salto"><span>3</span>Decisión A: el símbolo (ñ o í)</h2>
<p>Las dos aprueban lo técnico: se ven a 16 píxeles, funcionan a una tinta y caben en el círculo. La diferencia es lo que dicen.</p>
<table><tr><th></th><th>La ñ ${fila([667, 711, 712], 26)}</th><th>La í ${fila([659, 728, 734], 26)}</th></tr>
<tr><td>A favor</td><td>Es la que mejor te está funcionando. Simpática, redonda, se recuerda sola.</td><td>Está en tu nombre. La tilde es justo lo que enseña la app.</td></tr>
<tr><td>En contra</td><td>Dice «español» antes que «ortografía». No está en «Ortografía10». La Ñ se usa mucho para «lo español».</td><td>Es más fría. Una i en una caja puede recordar a «información».</td></tr>
</table>
<div class="box"><b>Mi opinión.</b> En el ranking puse la í primera por pertinencia. Pero si la ñ es la que la gente recuerda y le gusta, eso pesa más que mi nota: un logo sirve para que te reconozcan, no para explicar el producto. Comprueba con la prueba de los cinco segundos que no es solo que <i>guste</i> más, sino que se <i>recuerda</i> más.</div>

<h2><span>4</span>Decisión B: el logotipo</h2>
<p>No compite con el símbolo. Solo comprueba tres cosas del cartel que elijas:</p>
<ul><li><b>Pareja:</b> misma letra y mismos colores que el símbolo. Juntos tienen que parecer de la misma casa.</li>
<li><b>Una línea:</b> necesitas también la versión en una sola línea («Ortografía10») para la cabecera de la web y el cierre del Reel.</li>
<li><b>Sin «.com» dentro:</b> la dirección va al lado, no forma parte del logo.</li></ul>

<h2><span>5</span>Decisión C: .com o .app</h2>
<table><tr><th></th><th>ortografia10.com</th><th>ortografia10.app</th></tr>
<tr><td>Qué entiende la gente</td><td>«Es una dirección, la puedo teclear»</td><td>«Es una app, la puedo descargar»</td></tr>
<tr><td>Coincide con la pegatina</td><td>Sí: un solo texto que recordar</td><td>Solo si la pegatina dice lo mismo</td></tr>
<tr><td>Riesgo</td><td>Ninguno, si el dominio es tuyo</td><td>Si no tienes también ese dominio, quien lo teclee no llega a ti</td></tr></table>
<ol><li>Si el nombre a secas (<b>ortografia10</b>) está libre en Instagram, YouTube y TikTok, cógelo: es lo más corto y no te ata a nada.</li>
<li>Si no, <b>ortografia10.com en todas partes</b>, idéntico en redes, pegatina y marcapáginas. Un texto repetido se recuerda; dos parecidos se confunden.</li>
<li>Compra también el <b>.app</b> y haz que lleve al mismo sitio.</li></ol>
<p class="nota">Antes de decidir, comprueba que cada red admite el punto en el nombre de usuario y cuál de los dos dominios tienes ya comprado.</p>


<div class="box sol"><b>Mi apuesta, como punto de partida:</b> la ñ en el bloque o en el círculo amarillo como símbolo, el cartel «Orto / grafía / 10» como logotipo, y ortografia10.com como dirección en todas partes. La única pega seria es que la ñ no está en tu nombre; si en la prueba de los cinco segundos gana con claridad, yo viviría con ella.</div>
<h2 class="salto"><span>6</span>El proceso de esta tarde (unas dos horas)</h2>
<div class="paso"><div class="n">1</div><div><b>Preselección · 15 min</b>Abre el ranking y tus 👍. Quédate con tres símbolos como máximo (una ñ, una í y un comodín) y dos logotipos. Si dudas entre dos casi iguales, son el mismo: elige uno.</div></div>
<div class="paso"><div class="n">2</div><div><b>Imprime · 15 min</b>El A4 de cada finalista y la hoja de iPhones con todos. Al 100 %, sin «ajustar a la página».</div></div>
<div class="paso"><div class="n">3</div><div><b>Las seis pruebas · 45 min</b>
<ol><li><b>El metro.</b> Cuelga la hoja de iPhones y aléjate un metro. ¿Cuál encuentras primero?</li>
<li><b>Los cinco segundos.</b> Mira un finalista cinco segundos, dale la vuelta y dibújalo. ¿Se parece?</li>
<li><b>El favicon.</b> Mira el pequeño del A4. ¿Sigue siendo él o es una mancha?</li>
<li><b>La fotocopia.</b> Fotocópialo en blanco y negro. ¿Se entiende?</li>
<li><b>El círculo.</b> ¿Respira en el avatar redondo o se corta?</li>
<li><b>La pareja.</b> Pon el símbolo junto a cada logotipo. ¿Parecen la misma marca?</li></ol></div></div>
<div class="paso"><div class="n">4</div><div><b>Puntúa · 15 min</b>Rellena la tabla con ✓, ~ o ✗. Quien falle una de las cuatro primeras queda fuera, aunque sea tu favorito.</div></div>
<table class="punt"><tr><th>Pregunta</th><th>Símbolo nº ____</th><th>Símbolo nº ____</th><th>Símbolo nº ____</th></tr>
${["¿Se entiende en un segundo?", "¿Lo dibujaría de memoria?", "¿Se reconoce a 16 píxeles?", "¿Funciona a una tinta?", "¿Destaca entre las apps?", "¿Tiene que ver con lo que soy?", "¿Aguantará veinte años?", "¿Vale para todo?", "¿Es mío?"].map((q, i) => `<tr${i === 3 ? ' style="border-bottom:2pt solid #141413"' : ""}><td>${i + 1}. ${q}</td><td></td><td></td><td></td></tr>`).join("")}
<tr><td><b>Total</b></td><td></td><td></td><td></td></tr></table>
<div class="paso"><div class="n">5</div><div><b>Si hay empate · 10 min</b>¿Cuál no me cansaría ver todos los días durante años? · ¿Cuál me imagino bordado en una sudadera sin que dé vergüenza? · ¿Cuál encaja con lo que ya tengo en los Reels (amarillo y azul noche)?</div></div>
<div class="paso"><div class="n">6</div><div><b>Escribe la decisión · 10 min</b></div></div>
<div class="box"><div class="ficha"><div><b>Símbolo:</b> nº</div><div><b>Logotipo:</b> nº</div><div><b>Colores:</b></div><div><b>Tipografía:</b></div><div><b>Nombre en redes:</b></div><div><b>Dirección en pegatinas:</b></div></div></div>

`;
(async () => { const b = await chromium.launch(); const p = await b.newPage(); await p.setContent(html, { waitUntil: "load" }); await p.evaluate(() => document.fonts.ready); await p.pdf({ path: SALIDA, format: "A4", printBackground: true, preferCSSPageSize: true }); await b.close(); })();
