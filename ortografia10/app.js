// Ortografía 10 — aprender ortografía jugando.
//
// Dos lados:
//   · Jugar: rondas de 10 ejercicios de tipos variados (los 👍 salen más,
//     los 👎 no salen), con la regla explicada en cada fallo.
//   · Valorar: todos los tipos de ejercicio con 👍 / 👎 (como en Orto Redes).
//
// El material sale de orto/ (palabras, frases de prensa y ejercicios hechos
// a mano, ya validados): ver tools/datos.py. Los votos y las respuestas se
// guardan en el móvil y se suben a Supabase (ortografia10_votos,
// ortografia10_respuestas); si no hay red o la tabla aún no existe, se quedan
// en cola y se reintentan al abrir la app.
import { quitarTildes, silabear, analizar, explicarTilde } from "./silabas.js";
import { catDe, registrarNota, sembrarNota, pintarNota } from "./nota.js?v=__BUILD_ID__";

const CFG = window.ORTOGRAFIA10_CONFIG;
const $main = document.getElementById("main");
const RONDA = 10;

// ------------------------------------------------------------ utilidades
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => { const x = a[rnd(a.length)]; if (x && typeof x.c === "string") compUsada = x.c; return x; }; // la competencia va a la Nota
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const norm = (s) => String(s).trim().toLowerCase().replace(/\s+/g, " ");
const tokens = (s) => s.match(/[\p{L}\p{M}]+|[^\p{L}\p{M}]+/gu) || [];
const esPal = (t) => /\p{L}/u.test(t);
const ls = {
  get(k, d) { try { const v = localStorage.getItem("o10." + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("o10." + k, JSON.stringify(v)); } catch {} },
};
function toast(t) {
  const d = document.createElement("div"); d.className = "toast"; d.textContent = t;
  document.body.appendChild(d); setTimeout(() => d.remove(), 1800);
}

let DISP = ls.get("dev", null);
if (!DISP) { DISP = Math.random().toString(36).slice(2, 10); ls.set("dev", DISP); }

// ------------------------------------------------------------ datos
let D = null, byWord = new Map();
const COMP = (id) => (D.C[id] || [id, "", ""]);
const P = (i) => (compUsada = D.P[i][4], { w: D.P[i][0], alts: D.P[i][1], g: D.P[i][2], op: D.P[i][3], c: D.P[i][4], d: D.P[i][5] });
// compUsada: la competencia del último ejercicio (para la pestaña Nota).
let compUsada = null;
const manual = (f) => D.M.filter(f);
let MAN = {};

async function cargar() {
  const r = await fetch("datos.json");
  D = await r.json();
  D.P.forEach((p, i) => { if (!byWord.has(p[0])) byWord.set(p[0], i); });
  MAN = {
    hueco: manual((m) => m.t === "hueco" && !m.c.startsWith("JS.") && m.q && m.q.includes("___")),
    junto: manual((m) => m.t === "hueco" && m.c.startsWith("JS.") && m.q && m.q.includes("___")),
    elige: manual((m) => m.t === "elige" && m.o && m.o.length >= 2),
    caza: manual((m) => m.t === "caza" && m.mal && !m.mal.includes(" ") && tokens(m.q).includes(m.mal)),
    puntua: manual((m) => m.t === "frase" && m.c.startsWith("PUN.")),
    mayus: manual((m) => m.t === "frase" && m.c.startsWith("MAY.")),
    parejas: manual((m) => m.t === "parejas" && m.pares && m.pares.length >= 2),
  };
}
const ACE_TILDE = new Set(["ACE.AGUDA_NS", "ACE.AGUDA_VOCAL", "ACE.ESDRUJULA", "ACE.HIATO", "ACE.DIPT_TILDE", "ACE.LLANA_CON", "ACE.AGUDA_SIN", "ACE.LLANA_SIN"]);
function palAzar(f = () => true, intentos = 400) {
  for (let k = 0; k < intentos; k++) { const i = rnd(D.P.length); const p = P(i); if (f(p)) return p; }
  return P(rnd(D.P.length));
}

// ------------------------------------------------------------ Supabase (con cola)
const H = { apikey: CFG.anonKey, Authorization: `Bearer ${CFG.anonKey}`, "Content-Type": "application/json" };
const T = (n) => CFG.tablePrefix + n;
function encolar(tabla, fila) { const c = ls.get("cola", []); c.push({ tabla, fila }); ls.set("cola", c.slice(-500)); vaciarCola(); }
let vaciando = false;
async function vaciarCola() {
  if (vaciando) return; vaciando = true;
  try {
    let c = ls.get("cola", []);
    while (c.length) {
      const { tabla, fila } = c[0];
      const r = await fetch(`${CFG.url}/rest/v1/${T(tabla)}`, { method: "POST", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify(fila) });
      if (!r.ok) break;
      c.shift(); ls.set("cola", c);
    }
  } catch {} finally { vaciando = false; }
}
let TOT = null; // {tipo: {up, down}} de todos los dispositivos
async function cargarTotales() {
  try {
    const r = await fetch(`${CFG.url}/rest/v1/${T("votos")}?select=tipo,valor,dispositivo,created_at&order=created_at.asc&limit=20000`, { headers: H });
    if (!r.ok) return;
    const ult = {};
    for (const v of await r.json()) ult[v.dispositivo + "|" + v.tipo] = v;
    TOT = {};
    for (const v of Object.values(ult)) {
      if (!v.valor) continue;
      const t = (TOT[v.tipo] = TOT[v.tipo] || { up: 0, down: 0, est: 0 });
      if (v.valor > 0) { t.up++; t.est += v.valor; } else t.down++;
    }
  } catch {}
}

// ------------------------------------------------------------ votos y estadísticas locales
// Voto por tipo: -1 = 👎, 1-5 = 👍 con sus estrellas (un 👍 recién dado
// empieza en 3 ★). En Supabase va igual en «valor» (0 = voto quitado).
const votos = () => ls.get("votos", {});
const PESO = { 1: 1.5, 2: 2, 3: 3, 4: 4.5, 5: 6 }; // cuánto más sale al jugar
function votar(tipo, accion) {
  const v = votos(); const antes = v[tipo] || 0;
  let nuevo;
  if (accion === "up") nuevo = antes > 0 ? 0 : 3;
  else if (accion === "down") nuevo = antes === -1 ? 0 : -1;
  else nuevo = +accion; // 1-5 estrellas
  if (nuevo) v[tipo] = nuevo; else delete v[tipo];
  ls.set("votos", v);
  encolar("votos", { tipo, valor: nuevo, dispositivo: DISP });
  if (TOT) {
    const t = (TOT[tipo] = TOT[tipo] || { up: 0, down: 0, est: 0 });
    if (antes > 0) { t.up--; t.est -= antes; } if (antes === -1) t.down--;
    if (nuevo > 0) { t.up++; t.est += nuevo; } if (nuevo === -1) t.down++;
  }
  return nuevo;
}
{ const v = votos(); if (!ls.get("v2", false)) { for (const k in v) if (v[k] === 1) v[k] = 3; ls.set("votos", v); ls.set("v2", true); } }
function apuntar(tipo, ok) {
  const s = ls.get("stats", { n: 0, ok: 0, tipos: {}, dias: [] });
  s.n++; if (ok) s.ok++;
  const t = (s.tipos[tipo] = s.tipos[tipo] || [0, 0]); t[0]++; if (ok) t[1]++;
  const hoy = new Date().toISOString().slice(0, 10);
  if (!s.dias.includes(hoy)) s.dias.push(hoy);
  s.hoy = s.hoyFecha === hoy ? (s.hoy || 0) + 1 : 1; s.hoyFecha = hoy;
  ls.set("stats", s);
  const comp = compUsada, categoria = catDe(comp, tipo);
  registrarNota(categoria, comp, ok);
  encolar("respuestas", { tipo, acierto: ok, dispositivo: DISP, categoria, comp });
}
function racha(dias) {
  let n = 0; const d = new Date();
  for (;;) { const k = d.toISOString().slice(0, 10); if (dias.includes(k)) { n++; d.setDate(d.getDate() - 1); } else if (n === 0 && k === new Date().toISOString().slice(0, 10)) { d.setDate(d.getDate() - 1); } else break; }
  return n;
}

// ------------------------------------------------------------ piezas de UI comunes
function opciones(cont, lista, correcta, { dos = false, fr = false } = {}) {
  return new Promise((res) => {
    cont.innerHTML = `<div class="ops ${dos ? "dos" : ""}">${lista.map((o, i) => `<button class="op ${fr ? "fr" : ""}" data-i="${i}">${esc(o === "" ? "(nada)" : o)}</button>`).join("")}</div>`;
    cont.querySelectorAll(".op").forEach((b) => b.onclick = () => {
      const i = +b.dataset.i; const ok = i === correcta;
      cont.querySelectorAll(".op").forEach((x) => { x.disabled = true; if (+x.dataset.i === correcta) x.classList.add("ok"); });
      if (!ok) b.classList.add("mal");
      res(ok);
    });
  });
}
// Frase con palabras tocables. Devuelve el índice de token tocado (o -1 = «no hay falta»).
function tocable(cont, toks, { noHay = false, clase = "frase" } = {}) {
  return new Promise((res) => {
    cont.innerHTML = `<div class="${clase}">${toks.map((t, i) => esPal(t) ? `<button class="tok" data-i="${i}">${esc(t)}</button>` : esc(t)).join("")}</div>
      ${noHay ? `<button class="btn" style="width:100%" data-no>No hay ninguna falta</button>` : ""}`;
    const fin = (i) => { cont.querySelectorAll("button").forEach((b) => b.disabled = true); res(i); };
    cont.querySelectorAll(".tok").forEach((b) => b.onclick = () => fin(+b.dataset.i));
    const nb = cont.querySelector("[data-no]"); if (nb) nb.onclick = () => fin(-1);
  });
}
function marcarToks(cont, tocado, correcto) {
  cont.querySelectorAll(".tok").forEach((b) => {
    const i = +b.dataset.i;
    if (i === correcto) b.classList.add(tocado === correcto ? "ok" : "era");
    if (i === tocado && tocado !== correcto) b.classList.add("mal");
  });
}
const reglaDe = (c) => { if (c) compUsada = c; const [n, r, t] = COMP(c); return r ? `<div class="regla"><b>${esc(n)}</b>${esc(r)}${t ? `<br><i>Truco: ${esc(t)}</i>` : ""}</div>` : ""; };
function hablar(t) {
  if (!("speechSynthesis" in window)) return false;
  const u = new SpeechSynthesisUtterance(t); u.lang = "es-ES"; u.rate = 0.85;
  const v = speechSynthesis.getVoices().find((v) => /^es(-ES)?/i.test(v.lang) && /es-ES/i.test(v.lang)) || speechSynthesis.getVoices().find((v) => /^es/i.test(v.lang));
  if (v) u.voice = v;
  speechSynthesis.cancel(); speechSynthesis.speak(u); return true;
}

// ------------------------------------------------------------ refranes (hechos a mano)
const REFRANES = [
  ["Mas vale prevenir que curar.", "Mas", "Más", "«Más» de cantidad lleva tilde; «mas» sin tilde significa «pero»."],
  ["A quien madruga, Dios le alluda.", "alluda", "ayuda", "«Ayudar» se escribe con y: ayuda, ayudé, ayudando."],
  ["No ay mal que por bien no venga.", "ay", "hay", "«Hay» es del verbo haber (hay, había). «Ay» es un quejido y «ahí», un lugar."],
  ["Quien bien te quiere te ará llorar.", "ará", "hará", "«Hará» es del verbo hacer, y hacer lleva h en todas sus formas."],
  ["En voca cerrada no entran moscas.", "voca", "boca", "«Boca» va con b, como «bocado» y «bocadillo»."],
  ["Más vale pajaro en mano que ciento volando.", "pajaro", "pájaro", "PÁ-ja-ro es esdrújula: todas las esdrújulas llevan tilde."],
  ["Dime con quien andas y te diré quién eres.", "quien", "quién", "En las preguntas indirectas «quién» lleva tilde: dime con quién…"],
  ["Al mal tiempo, vuena cara.", "vuena", "buena", "«Buena» va con b: bueno, buena, bondad."],
  ["Camaron que se duerme se lo lleva la corriente.", "Camaron", "Camarón", "ca-ma-RÓN es aguda terminada en n: lleva tilde."],
  ["Ojos que no ben, corazón que no siente.", "ben", "ven", "«Ver» se escribe con v en todas sus formas: veo, ves, ven."],
  ["Cría cuerbos y te sacarán los ojos.", "cuerbos", "cuervos", "«Cuervo» va con v (después de r no hay regla: se memoriza)."],
  ["A cavallo regalado no le mires el diente.", "cavallo", "caballo", "«Caballo» va con b, como «caballero» y «cabalgar»."],
  ["El que la sige la consigue.", "sige", "sigue", "Para que la g suene suave delante de e, hace falta la u: sigue, guerra."],
  ["Agua que no as de beber, déjala correr.", "as", "has", "«Has» es del verbo haber (has de beber): lleva h."],
  ["Ablando del rey de Roma, por la puerta asoma.", "Ablando", "Hablando", "«Hablar» lleva h en todas sus formas."],
  ["Perro ladrador, poco mordedór.", "mordedór", "mordedor", "mor-de-DOR es aguda terminada en r: no lleva tilde."],
  ["No por mucho madrugar amanece mas temprano.", "mas", "más", "«Más» de cantidad o comparación lleva tilde."],
  ["Donde fueres, has lo que vieres.", "has", "haz", "«Haz» es el imperativo de hacer (haz tú), con z. «Has» es de haber."],
  ["A buen entendedor, pocas palabras vastan.", "vastan", "bastan", "«Bastar» va con b. «Vasto» con v significa «muy grande»."],
  ["Quien siembra bientos recoge tempestades.", "bientos", "vientos", "«Viento» va con v, como «ventilador» y «ventana»."],
];


// ------------------------------------------------------------ ¿las dos valen? (formato de Ortografix)
// [A, B, respuesta: 0 = solo A, 1 = solo B, 2 = las dos, explicación]
const DOSVALEN = [
  ["guion", "guión", 0, "Desde 2010 «guion» es monosílabo a efectos de tilde, como «fue» o «dio»: sin tilde."],
  ["psicología", "sicología", 2, "Valen las dos, pero se prefiere «psicología», con ps-."],
  ["septiembre", "setiembre", 2, "Valen las dos; la más usada y recomendada es «septiembre»."],
  ["quizá", "quizás", 2, "Las dos son correctas e igual de válidas."],
  ["periodo", "período", 2, "Las dos son correctas: «periodo» (llana) y «período» (esdrújula)."],
  ["vídeo", "video", 2, "Las dos: «vídeo» es la de España y «video», la de América."],
  ["oscuro", "obscuro", 2, "Valen las dos, pero se prefiere «oscuro», sin b."],
  ["fue", "fué", 0, "«Fue» es monosílabo: los monosílabos no llevan tilde (salvo la diacrítica: tú, él, sí…)."],
  ["truhan", "truhán", 0, "«Truhan» es monosílabo a efectos de tilde (como «guion»): sin tilde."],
  ["armonía", "harmonía", 2, "Las dos están en el diccionario, pero se prefiere «armonía», sin h."],
  ["hierba", "yerba", 2, "Las dos son correctas; «hierba» es la más general."],
  ["posdata", "postdata", 2, "Valen las dos, pero se prefiere «posdata»."],
  ["transporte", "trasporte", 2, "Valen las dos; la preferida es «transporte»."],
  ["cóctel", "coctel", 2, "Las dos: «cóctel» (llana) en España y «coctel» (aguda), sobre todo en América."],
  ["haya", "haiga", 0, "El subjuntivo de haber es «haya». «Haiga» es un vulgarismo."],
  ["aun así", "aún así", 0, "«Aun así» significa «incluso así»: sin tilde. «Aún» con tilde es «todavía»."],
  ["echo de menos", "hecho de menos", 0, "Es del verbo echar: «echo de menos», sin h."],
  ["grosso modo", "a grosso modo", 0, "Es latín y significa «a grandes rasgos»: «grosso modo», sin «a» delante."],
  ["solo", "sólo", 2, "Las dos se admiten, pero se recomienda «solo» sin tilde; la tilde solo se tolera si hay ambigüedad."],
  ["icono", "ícono", 2, "Las dos: «icono» en España e «ícono», muy usada en América."],
];

// ------------------------------------------------------------ teoría de las clasificaciones
// [pregunta, opciones, correcta, explicación]
const TEORIA = [
  ["Una palabra es aguda cuando la sílaba fuerte es…", ["la última", "la penúltima", "la antepenúltima"], 0, "Agudas: ca-MIÓN, re-LOJ, ca-FÉ. El golpe de voz va en la última sílaba."],
  ["Una palabra es llana (o grave) cuando la sílaba fuerte es…", ["la última", "la penúltima", "la antepenúltima"], 1, "Llanas: ÁR-bol, LÁ-piz, CA-sa, e-XA-men."],
  ["Una palabra es esdrújula cuando la sílaba fuerte es…", ["la penúltima", "la antepenúltima", "la última"], 1, "Esdrújulas: PÁ-ja-ro, MÚ-si-ca, TELÉ-fo-no."],
  ["Una sobresdrújula tiene la sílaba fuerte…", ["antes de la antepenúltima", "en la antepenúltima", "en la penúltima"], 0, "Sobresdrújulas: DÍ-ga-me-lo, RÁ-pi-da-men-te. Casi siempre son verbos con pronombres o adverbios en -mente."],
  ["Las agudas llevan tilde cuando terminan en…", ["vocal, n o s", "consonante que no sea n ni s", "cualquier letra"], 0, "camión, café, compás llevan tilde; reloj, pared, feliz no."],
  ["Las llanas llevan tilde cuando terminan en…", ["vocal, n o s", "consonante que no sea n ni s (o en -s tras consonante)", "nunca la llevan"], 1, "árbol, lápiz, fácil, bíceps llevan tilde; casa, examen, joven no. Justo al revés que las agudas."],
  ["Las esdrújulas y sobresdrújulas llevan tilde…", ["siempre", "solo si terminan en vocal", "nunca"], 0, "Todas, sin excepción: pájaro, música, dígamelo."],
  ["Un diptongo es…", ["dos vocales seguidas que van en la misma sílaba", "dos vocales seguidas en sílabas distintas", "tres vocales seguidas"], 0, "cie-lo, au-la, cui-da-do. Se forma con una vocal cerrada (i, u) sin acento y otra vocal."],
  ["Un hiato es…", ["dos vocales seguidas en la misma sílaba", "dos vocales seguidas que van en sílabas distintas", "una vocal con tilde"], 1, "ca-er, le-ón, pa-ís, rí-o."],
  ["Un triptongo es…", ["tres vocales seguidas en la misma sílaba", "tres sílabas con tilde", "dos diptongos seguidos"], 0, "a-ve-ri-guáis, buey, U-ru-guay: cerrada + abierta + cerrada en una sola sílaba."],
  ["Las vocales abiertas (o fuertes) son…", ["a, e, o", "i, u", "a, i, u"], 0, "a, e, o son abiertas; i, u son cerradas. Dos abiertas juntas siempre forman hiato: le-ón, ca-er."],
  ["¿Cuándo lleva tilde la i o la u de un hiato (país, río, búho)?", ["siempre que sea la sílaba fuerte", "solo si es aguda", "nunca"], 0, "Una i o u tónica junto a a, e, o lleva tilde siempre, aunque la regla general no la pida: rí-o es llana en vocal y la lleva."],
  ["Los monosílabos (palabras de una sílaba)…", ["no llevan tilde, salvo la diacrítica", "llevan tilde si terminan en n o s", "siempre llevan tilde"], 0, "fue, dio, vio, fe, ti, guion: sin tilde. Solo la diacrítica distingue parejas: tú/tu, él/el, sí/si, más/mas…"],
  ["La tilde diacrítica sirve para…", ["distinguir palabras que se escriben igual pero significan distinto", "marcar las sílabas largas", "las palabras extranjeras"], 0, "tú (persona) / tu (posesivo), sé (saber) / se (pronombre), té (bebida) / te."],
  ["Los adverbios acabados en -mente…", ["llevan tilde si la llevaba el adjetivo", "nunca llevan tilde", "siempre llevan tilde"], 0, "fácil → fácilmente; rápido → rápidamente; lento → lentamente (sin tilde)."],
  ["Las mayúsculas…", ["llevan tilde igual que las minúsculas", "nunca llevan tilde", "solo en los nombres propios"], 0, "Álvaro, ÉXITO, Óscar: la tilde no se quita por ir en mayúscula."],
  ["Qué, quién, cómo, cuándo, dónde, cuál llevan tilde…", ["cuando preguntan o exclaman, también en preguntas indirectas", "siempre", "nunca"], 0, "¿Qué quieres? / No sé qué quieres. Pero: Dice que viene (sin tilde)."],
  ["Al separar en sílabas, una consonante entre dos vocales va…", ["con la vocal de detrás", "con la vocal de delante", "sola"], 0, "ca-sa, pe-ro, a-mi-go."],
  ["«ch», «ll» y «rr» al separar en sílabas…", ["no se separan nunca", "se separan siempre", "depende de la palabra"], 0, "co-che, ca-lle, pe-rro: son una sola consonante."],
  ["«Examen» es llana y no lleva tilde. ¿Y «exámenes»?", ["esdrújula, con tilde", "llana, sin tilde", "aguda, con tilde"], 0, "Al hacer el plural la sílaba fuerte se queda en el mismo sitio (XA), pero ahora es la antepenúltima: e-XÁ-me-nes."],
];

// ------------------------------------------------------------ tipos de ejercicio
// orig: de dónde sale la idea. Cada run(el) devuelve una promesa con
// {ok, titulo?, html} o null si no se puede hacer aquí (p. ej., sin voz).
const TIPOS = [
  {
    id: "caza", e: "🎯", n: "Caza la falta", orig: "Projet Voltaire",
    desc: "Una frase real de prensa. Toca la palabra mal escrita… o pulsa «No hay ninguna falta» (a veces está perfecta).",
    ej: "«El equipo estubo a punto de ganar» → toca «estubo».",
    async run(el) {
      let toks, err = -1, bien = "", mal = "", c = null, x = "";
      if (Math.random() < 0.25 && MAN.caza.length) {
        const m = pick(MAN.caza); toks = tokens(m.q); err = toks.indexOf(m.mal); bien = m.bien; mal = m.mal; c = m.c; x = m.x;
      } else {
        const [s, pi] = pick(D.F); const p = P(pi); toks = tokens(s); c = p.c;
        if (Math.random() < 0.65) { err = toks.indexOf(p.w); mal = pick(p.alts); bien = p.w; toks[err] = mal; }
      }
      el.innerHTML = `<p class="enun">¿Hay alguna falta? Tócala.</p><div id="z"></div>`;
      const z = el.querySelector("#z");
      const t = await tocable(z, toks, { noHay: true });
      marcarToks(z, t, err);
      const ok = t === err;
      if (err < 0) return { ok, html: ok ? `<p>La frase estaba bien escrita.</p>` : `<p>Esta frase no tenía ninguna falta: «${esc(toks[t])}» está bien.</p>` };
      return { ok, html: `<p>Era «<s>${esc(mal)}</s>» → <b>${esc(bien)}</b>.</p>${x ? `<p>${esc(x)}</p>` : reglaDe(c)}` };
    },
  },
  {
    id: "bienmal", e: "✅", n: "¿Bien o mal?", orig: "Instagram (encuesta de historias)",
    desc: "Sale una palabra: ¿está bien escrita o tiene falta? Un toque y a la siguiente.",
    ej: "«exhuberante» → Mal (es «exuberante»).",
    async run(el) {
      const p = palAzar((p) => p.d <= 3); const bien = Math.random() < 0.5; const w = bien ? p.w : pick(p.alts);
      el.innerHTML = `<p class="enun">¿Está bien escrita?</p><div class="palabra">${esc(w)}</div><div id="z"></div>`;
      const ok = await opciones(el.querySelector("#z"), ["✓ Bien", "✗ Mal"], bien ? 0 : 1, { dos: true });
      return { ok, html: bien ? `<p>«<b>${esc(p.w)}</b>» está bien escrita.</p>${reglaDe(p.c)}` : `<p>Se escribe <b>${esc(p.w)}</b>, no «${esc(w)}».</p>${reglaDe(p.c)}` };
    },
  },
  {
    id: "elige", e: "🅰️", n: "¿Cómo se escribe?", orig: "Instagram (quiz A, B o C)",
    desc: "Dos o tres maneras de escribir la misma palabra. Solo una es buena.",
    ej: "¿«prever», «preveer» o «preber»?",
    async run(el) {
      let lista, a, x = "", c;
      if (Math.random() < 0.35 && MAN.elige.length) { const m = pick(MAN.elige); const o = shuffle(m.o.map((t, i) => [t, i === m.a])); lista = o.map((q) => q[0]); a = o.findIndex((q) => q[1]); x = m.x; c = m.c; }
      else { const p = palAzar((p) => p.alts.length >= 1); const o = shuffle([[p.w, true], ...p.alts.slice(0, 2).map((t) => [t, false])]); lista = o.map((q) => q[0]); a = o.findIndex((q) => q[1]); c = p.c; }
      el.innerHTML = `<p class="enun">¿Cuál está bien escrita?</p><div id="z"></div>`;
      const ok = await opciones(el.querySelector("#z"), lista, a);
      return { ok, html: `<p>Lo correcto es <b>${esc(lista[a])}</b>.</p>${x ? `<p>${esc(x)}</p>` : reglaDe(c)}` };
    },
  },
  {
    id: "letra", e: "🔤", n: "Falta la letra", orig: "Orto (juego de letras)",
    desc: "Una palabra con un hueco: ¿b o v?, ¿g o j?, ¿con h o sin h?, ¿ll o y?…",
    ej: "«hier_a» → b o v → hierba.",
    async run(el) {
      const p = palAzar((p) => p.g && p.op && p.op.length >= 2 && p.op.includes(p.w.slice(p.g[0], p.g[1])));
      const pieza = p.w.slice(p.g[0], p.g[1]); const ops = shuffle(p.op);
      el.innerHTML = `<p class="enun">¿Qué va en el hueco?</p><div class="palabra">${esc(p.w.slice(0, p.g[0]))}<span class="hueco">&nbsp;</span>${esc(p.w.slice(p.g[1]))}</div><div id="z"></div>`;
      const ok = await opciones(el.querySelector("#z"), ops, ops.indexOf(pieza), { dos: ops.length <= 2 });
      return { ok, html: `<p>Es <b>${esc(p.w)}</b>.</p>${reglaDe(p.c)}` };
    },
  },
  {
    id: "tilde", e: "´", n: "Pon la tilde", orig: "Orto (acentuación)",
    desc: "La palabra aparece sin tildes. Toca la vocal que la lleva, o di que no lleva.",
    ej: "«camion» → toca la o → camión.",
    async run(el) {
      const p = palAzar((p) => ACE_TILDE.has(p.c) && !p.w.includes("ü"));
      const sin = quitarTildes(p.w); const correcta = p.w.search(/[áéíóú]/);
      el.innerHTML = `<p class="enun">¿Dónde va la tilde?</p><div class="vocales">${[...sin].map((ch, i) => /[aeiou]/.test(ch) ? `<button data-i="${i}">${esc(ch)}</button>` : `<span>${esc(ch)}</span>`).join("")}</div>
        <button class="btn" style="width:100%" data-i="-1">No lleva tilde</button>`;
      const t = await new Promise((res) => el.querySelectorAll("[data-i]").forEach((b) => b.onclick = () => res(+b.dataset.i)));
      el.querySelectorAll("[data-i]").forEach((b) => { b.disabled = true; const i = +b.dataset.i; if (i === correcta && i >= 0) b.classList.add("ok"); if (i === t && t !== correcta) b.classList.add("mal"); });
      return { ok: t === correcta, html: `<p>Se escribe <b>${esc(p.w)}</b>.</p><div class="regla"><b>Por qué</b>${esc(explicarTilde(p.w))}</div>` };
    },
  },
  {
    id: "dictado", e: "🎧", n: "Dictado", orig: "Orto (dictado)",
    desc: "Escucha la palabra y escríbela. Puedes repetirla las veces que quieras.",
    ej: "🔊 «exhausto» → escribes «exhausto».",
    async run(el) {
      if (!("speechSynthesis" in window)) return null;
      const p = palAzar((p) => p.w.length >= 5 && p.d <= 3);
      el.innerHTML = `<p class="enun">Escucha y escribe</p><div class="fila" style="margin:14px 0"><button class="btn neg" id="oir">🔊 Oír otra vez</button></div>
        <input class="esc" id="in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escribe aquí"><button class="btn" style="width:100%" id="ok">Comprobar</button>`;
      el.querySelector("#oir").onclick = () => hablar(p.w); setTimeout(() => hablar(p.w), 250);
      const inp = el.querySelector("#in"); inp.focus();
      await new Promise((res) => { el.querySelector("#ok").onclick = res; inp.onkeydown = (e) => { if (e.key === "Enter") res(); }; });
      inp.disabled = true; el.querySelector("#ok").disabled = true;
      const ok = norm(inp.value) === norm(p.w);
      return { ok, html: `<p>${ok ? "" : `Has escrito «${esc(inp.value)}». `}Era <b>${esc(p.w)}</b>.</p>${reglaDe(p.c)}` };
    },
  },
  {
    id: "hueco", e: "🕳️", n: "Rellena el hueco", orig: "Instagram (¿solo o sólo?) + Orto",
    desc: "Frase con un hueco y palabras que suenan igual: tú/tu, sí/si, haber/a ver, vaya/valla/baya…",
    ej: "«¿___ has terminado?» → Ya / Lla.",
    async run(el) {
      const m = pick(MAN.hueco);
      el.innerHTML = `<p class="enun">${esc(m.q).replace("___", '<span style="border-bottom:3px solid #000;padding:0 18px"></span>')}</p><div id="z"></div>`;
      const ok = await opciones(el.querySelector("#z"), m.o, m.a, { dos: m.o.length === 2 });
      return { ok, html: `<p>Va <b>${esc(m.o[m.a])}</b>.</p>${m.x ? `<p>${esc(m.x)}</p>` : reglaDe(m.c)}` };
    },
  },
  {
    id: "junto", e: "🔗", n: "¿Junto o separado?", orig: "Orto (homófonos)",
    desc: "porque / por qué / porqué, sino / si no, a parte / aparte, demás / de más…",
    ej: "«No sé ___ llora» → por qué.",
    async run(el) {
      const m = pick(MAN.junto);
      el.innerHTML = `<p class="enun">${esc(m.q).replace("___", '<span style="border-bottom:3px solid #000;padding:0 18px"></span>')}</p><div id="z"></div>`;
      const ok = await opciones(el.querySelector("#z"), m.o, m.a, { dos: m.o.length === 2 });
      return { ok, html: `<p>Va <b>${esc(m.o[m.a])}</b>.</p>${m.x ? `<p>${esc(m.x)}</p>` : reglaDe(m.c)}` };
    },
  },
  {
    id: "intruso", e: "🕵️", n: "El intruso", orig: "Instagram (¿cuál está mal?)",
    desc: "Cuatro palabras y una tiene falta. Encuéntrala.",
    ej: "caballo · hierba · aber · jirafa → «aber».",
    async run(el) {
      const usadas = new Set(); const buenas = [];
      while (buenas.length < 3) { const p = palAzar((p) => p.w.length > 3 && p.d <= 3 && !usadas.has(p.w)); usadas.add(p.w); buenas.push(p.w); }
      const malP = palAzar((p) => p.w.length > 3 && !usadas.has(p.w)); const mal = pick(malP.alts);
      const lista = shuffle([...buenas, mal]);
      el.innerHTML = `<p class="enun">¿Cuál está mal escrita?</p><div id="z"></div>`;
      const ok = await opciones(el.querySelector("#z"), lista, lista.indexOf(mal), { dos: true });
      return { ok, html: `<p>El intruso era «<s>${esc(mal)}</s>»: se escribe <b>${esc(malP.w)}</b>.</p>${reglaDe(malP.c)}` };
    },
  },
  {
    id: "cuantas", e: "🔢", n: "¿Cuántas faltas hay?", orig: "Instagram (cuenta las faltas)",
    desc: "Una frase con 0, 1 o 2 faltas escondidas. ¿Cuántas ves?",
    ej: "«Ayer estubo aqui» → 2.",
    async run(el) {
      const [s] = pick(D.F); const toks = tokens(s);
      const cand = shuffle(toks.map((t, i) => [t, i]).filter(([t]) => t.length > 3 && byWord.has(t)));
      const n = Math.min(cand.length, pick([0, 1, 1, 2, 2]));
      const cambios = [];
      for (let k = 0; k < n; k++) { const [t, i] = cand[k]; const p = P(byWord.get(t)); const alt = pick(p.alts); toks[i] = alt; cambios.push([alt, t, i]); }
      el.innerHTML = `<p class="enun">¿Cuántas faltas tiene esta frase?</p><div class="frase">${esc(toks.join(""))}</div><div id="z"></div>`;
      const ok = await opciones(el.querySelector("#z"), ["0", "1", "2", "3"], n, { dos: true });
      return { ok, html: n ? `<p>${n === 1 ? "Había una" : `Había ${n}`}: ${cambios.map(([a, b]) => `«<s>${esc(a)}</s>» → <b>${esc(b)}</b>`).join(", ")}.</p>` : `<p>No tenía ninguna: estaba perfecta.</p>` };
    },
  },
  {
    id: "corrige", e: "✏️", n: "Corrígela tú", orig: "Nuevo (a prueba)",
    desc: "Te enseño una palabra mal escrita y tú la escribes bien. Sin opciones: de memoria.",
    ej: "«exepción» → escribes «excepción».",
    async run(el) {
      const p = palAzar((p) => p.w.length >= 5 && p.d <= 3); const mal = pick(p.alts);
      el.innerHTML = `<p class="enun">Esta palabra tiene una falta. Escríbela bien:</p><div class="palabra" style="color:var(--mal)"><s>${esc(mal)}</s></div>
        <input class="esc" id="in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escríbela bien"><button class="btn" style="width:100%" id="ok">Comprobar</button>`;
      const inp = el.querySelector("#in"); inp.focus();
      await new Promise((res) => { el.querySelector("#ok").onclick = res; inp.onkeydown = (e) => { if (e.key === "Enter") res(); }; });
      inp.disabled = true; el.querySelector("#ok").disabled = true;
      const ok = norm(inp.value) === norm(p.w);
      return { ok, html: `<p>${ok ? "" : `Has escrito «${esc(inp.value)}». `}Se escribe <b>${esc(p.w)}</b>.</p>${reglaDe(p.c)}` };
    },
  },
  {
    id: "cartel", e: "🪧", n: "El cartel con falta", orig: "Instagram (faltas en carteles reales)",
    desc: "Un cartel de tienda o de la calle con una falta. Siempre hay una: búscala.",
    ej: "«SE BENDE PISO» → toca «BENDE».",
    async run(el) {
      let toks, err, bien, mal, c, x = "";
      const cortas = MAN.caza.filter((m) => m.q.length <= 70);
      if (Math.random() < 0.5 && cortas.length) { const m = pick(cortas); toks = tokens(m.q); err = toks.indexOf(m.mal); bien = m.bien; mal = m.mal; c = m.c; x = m.x; }
      else {
        let s, pi; for (let k = 0; k < 60; k++) { [s, pi] = pick(D.F); if (s.length <= 75) break; }
        const p = P(pi); toks = tokens(s); err = toks.indexOf(p.w); mal = pick(p.alts); bien = p.w; toks[err] = mal; c = p.c;
      }
      el.innerHTML = `<p class="enun">Este cartel tiene una falta. Tócala.</p><div id="z"></div>`;
      const z = el.querySelector("#z");
      const t = await tocable(z, toks, { clase: "cartel" });
      marcarToks(z, t, err);
      return { ok: t === err, html: `<p>Era «<s>${esc(mal)}</s>» → <b>${esc(bien)}</b>.</p>${x ? `<p>${esc(x)}</p>` : reglaDe(c)}` };
    },
  },
  {
    id: "refran", e: "📜", n: "El refrán roto", orig: "Orto Redes (idea de Instagram)",
    desc: "Un refrán de toda la vida con una falta metida. ¿Dónde está?",
    ej: "«En voca cerrada no entran moscas» → «voca».",
    async run(el) {
      const [q, mal, bien, x] = pick(REFRANES); const toks = tokens(q); const err = toks.indexOf(mal);
      el.innerHTML = `<p class="enun">El refrán tiene una falta. Tócala.</p><div id="z"></div>`;
      const z = el.querySelector("#z");
      const t = await tocable(z, toks, { clase: "frase refran" });
      marcarToks(z, t, err);
      return { ok: t === err, html: `<p>Era «<s>${esc(mal)}</s>» → <b>${esc(bien)}</b>.</p><p>${esc(x)}</p>` };
    },
  },
  {
    id: "porque", e: "💡", n: "¿Por qué se escribe así?", orig: "Projet Voltaire (aprender la regla)",
    desc: "La palabra ya está bien escrita: elige qué regla lo explica. Para entender, no solo acertar.",
    ej: "«cambio» → «m antes de b y p».",
    async run(el) {
      const p = palAzar((p) => p.g && !/MEMORIA$/.test(p.c) && COMP(p.c)[1]);
      const bloque = p.c.split(".")[0];
      const otras = shuffle(Object.keys(D.C).filter((k) => k !== p.c && !/MEMORIA$/.test(k) && D.C[k][1] && !k.startsWith("ACE.SIL") && (k.split(".")[0] === bloque || Math.random() < 0.15))).slice(0, 2);
      const o = shuffle([p.c, ...otras]);
      const marc = `${esc(p.w.slice(0, p.g[0]))}<u>${esc(p.w.slice(p.g[0], p.g[1]))}</u>${esc(p.w.slice(p.g[1]))}`;
      el.innerHTML = `<p class="enun">¿Qué regla explica esta palabra?</p><div class="palabra">${marc}</div><div id="z"></div>`;
      const ok = await opciones(el.querySelector("#z"), o.map((k) => COMP(k)[0]), o.indexOf(p.c), { fr: true });
      return { ok, html: reglaDe(p.c) };
    },
  },
  {
    id: "tonica", e: "🔊", n: "La sílaba fuerte", orig: "Orto (base de la acentuación)",
    desc: "La palabra partida en sílabas: toca la que suena más fuerte. Es la base de todas las tildes.",
    ej: "ca · MIÓN → toca «mión».",
    async run(el) {
      const p = palAzar((p) => p.c.startsWith("ACE.") && p.c !== "ACE.MENTE" && silabear(p.w).length >= 2 && analizar(p.w).coherente);
      const a = analizar(p.w);
      el.innerHTML = `<p class="enun">¿Qué sílaba suena más fuerte?</p><div class="sils">${a.silabas.map((s, i) => `<button data-i="${i}">${esc(s)}</button>`).join("")}</div>`;
      const t = await new Promise((res) => el.querySelectorAll(".sils button").forEach((b) => b.onclick = () => res(+b.dataset.i)));
      el.querySelectorAll(".sils button").forEach((b) => { b.disabled = true; const i = +b.dataset.i; if (i === a.tonica) b.classList.add("ok"); else if (i === t) b.classList.add("mal"); });
      return { ok: t === a.tonica, html: `<div class="regla"><b>Por qué</b>${esc(explicarTilde(p.w))}</div>` };
    },
  },
  {
    id: "clase", e: "🏷️", n: "Aguda, llana o esdrújula", orig: "Orto (base de la acentuación)",
    desc: "¿Dónde cae el golpe de voz? Clasifica la palabra.",
    ej: "«lápiz» → llana.",
    async run(el) {
      const p = palAzar((p) => p.c.startsWith("ACE.") && (p.c !== "ACE.MENTE" || /[áéíóú]/.test(p.w)) && silabear(p.w).length >= 2 && (analizar(p.w).coherente || analizar(p.w).mente));
      const a = analizar(p.w); const L = ["aguda", "llana", "esdrújula", "sobresdrújula"]; const k = Math.max(0, L.indexOf(a.tipo));
      el.innerHTML = `<p class="enun">¿Qué tipo de palabra es?</p><div class="palabra">${esc(p.w)}</div><div id="z"></div>`;
      const ok = await opciones(el.querySelector("#z"), ["Aguda", "Llana", "Esdrújula", "Sobresdrújula"], k, { dos: true });
      return { ok, html: `<div class="regla"><b>Por qué</b>${esc(explicarTilde(p.w))}</div>` };
    },
  },
  {
    id: "puntua", e: "❗", n: "Comas y puntos", orig: "Orto (puntuación)",
    desc: "Tres versiones de la misma frase: elige la que está bien puntuada.",
    ej: "«Hola, Ana» frente a «Hola Ana».",
    async run(el) {
      const m = pick(MAN.puntua);
      el.innerHTML = `<p class="enun">${esc(m.q || "¿Cuál está bien escrita?")}</p><div id="z"></div>`;
      const ok = await opciones(el.querySelector("#z"), m.o, m.a, { fr: true });
      return { ok, html: m.x ? `<p>${esc(m.x)}</p>` : reglaDe(m.c) };
    },
  },
  {
    id: "mayus", e: "🔠", n: "Mayúsculas", orig: "Orto (mayúsculas)",
    desc: "¿Lunes o lunes? ¿Sevilla o sevilla? Elige la frase con las mayúsculas bien puestas.",
    ej: "«El lunes voy a Sevilla».",
    async run(el) {
      const m = pick(MAN.mayus);
      el.innerHTML = `<p class="enun">${esc(m.q || "¿Cuál está bien escrita?")}</p><div id="z"></div>`;
      const ok = await opciones(el.querySelector("#z"), m.o, m.a, { fr: true });
      return { ok, html: m.x ? `<p>${esc(m.x)}</p>` : reglaDe(m.c) };
    },
  },
  {
    id: "parejas", e: "🃏", n: "Une las parejas", orig: "Orto (parejas de homófonos)",
    desc: "Palabras que suenan igual y su significado. Toca una a la izquierda y su pareja a la derecha.",
    ej: "hay ↔ del verbo haber · ahí ↔ en ese lugar · ay ↔ quejido.",
    async run(el) {
      const m = pick(MAN.parejas); const pares = m.pares.slice(0, 4);
      const izq = shuffle(pares.map((p, i) => [p[0], i])), der = shuffle(pares.map((p, i) => [p[1], i]));
      el.innerHTML = `<p class="enun">Une cada palabra con su significado</p><div class="parejas"><div>${izq.map(([t, i]) => `<button class="pz" data-l="${i}">${esc(t)}</button>`).join("")}</div><div>${der.map(([t, i]) => `<button class="pz" data-r="${i}">${esc(t)}</button>`).join("")}</div></div>`;
      let sel = null, fallos = 0, hechos = 0;
      await new Promise((res) => {
        el.querySelectorAll("[data-l]").forEach((b) => b.onclick = () => { if (b.disabled) return; el.querySelectorAll("[data-l]").forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); sel = b; });
        el.querySelectorAll("[data-r]").forEach((b) => b.onclick = () => {
          if (!sel || b.disabled) return;
          if (sel.dataset.l === b.dataset.r) { [sel, b].forEach((x) => { x.classList.remove("sel"); x.classList.add("hecho"); x.disabled = true; }); sel = null; if (++hechos === pares.length) res(); }
          else { fallos++; b.classList.add("mal"); setTimeout(() => b.classList.remove("mal"), 500); }
        });
      });
      return { ok: fallos === 0, html: `<p>${fallos ? `${fallos} ${fallos === 1 ? "fallo" : "fallos"} por el camino.` : "Todas a la primera."}</p><p>${pares.map((p) => `<b>${esc(p[0])}</b>: ${esc(p[1])}`).join(" · ")}</p>` };
    },
  },
  {
    id: "dosvalen", e: "⚖️", n: "¿Las dos valen?", orig: "Ortografix (Instagram / Threads)",
    desc: "¿Se escribe A o B? Ojo: a veces valen las dos y una es la recomendada.",
    ej: "«quizá» o «quizás» → las dos valen.",
    async run(el) {
      const [a, b, r, x] = pick(DOSVALEN); const sw = Math.random() < 0.5; const A = sw ? b : a, B = sw ? a : b;
      const correcta = r === 2 ? 2 : (r === 0) !== sw ? 0 : 1;
      el.innerHTML = `<p class="enun">¿Se escribe «${esc(A)}» o «${esc(B)}»?</p><div id="z"></div>`;
      const ok = await opciones(el.querySelector("#z"), [`Solo «${A}»`, `Solo «${B}»`, "Las dos valen"], correcta);
      return { ok, html: `<p>${esc(x)}</p>` };
    },
  },
  {
    id: "anagrama", e: "🔀", n: "Anagrama", orig: "Juego de palabras (inteligencia)",
    desc: "Las letras de una palabra, desordenadas. Ordénalas y escríbela bien escrita (con su tilde).",
    ej: "Ó · M · N · I · C · A → camión.",
    async run(el) {
      const p = palAzar((p) => p.w.length >= 5 && p.w.length <= 9 && p.d <= 3 && /^[a-záéíóúüñ]+$/.test(p.w));
      let l; do { l = shuffle([...p.w]); } while (l.join("") === p.w);
      el.innerHTML = `<p class="enun">Ordena las letras</p><div class="fichas-l">${l.map((c) => `<span>${esc(c.toUpperCase())}</span>`).join("")}</div>
        <input class="esc" id="in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="¿Qué palabra es?"><button class="btn" style="width:100%" id="ok">Comprobar</button>`;
      const inp = el.querySelector("#in"); inp.focus();
      await new Promise((res) => { el.querySelector("#ok").onclick = res; inp.onkeydown = (e) => { if (e.key === "Enter") res(); }; });
      inp.disabled = true; el.querySelector("#ok").disabled = true;
      const ok = norm(inp.value) === norm(p.w);
      return { ok, html: `<p>Era <b>${esc(p.w)}</b>.</p>${reglaDe(p.c)}` };
    },
  },
  {
    id: "ahorcado", e: "🪢", n: "Palabra oculta", orig: "Juego de palabras (ahorcado)",
    desc: "Adivina la palabra letra a letra antes de 6 fallos. Las vocales con tilde son letras distintas: ¡piensa cómo se escribe!",
    ej: "_ _ _ _ _ Ó _ → camión.",
    async run(el) {
      const p = palAzar((p) => p.w.length >= 5 && p.w.length <= 10 && p.d <= 3 && /^[a-záéíóúüñ]+$/.test(p.w));
      const w = p.w; const dichas = new Set(); let fallos = 0;
      const teclas = [..."aábcdeéfghiíjklmnñoópqrstuúüvwxyz"].filter((c) => !"üwk".includes(c) || w.includes(c));
      el.innerHTML = `<p class="enun">Adivina la palabra</p><div class="palabra" id="w"></div><div class="reloj" id="f"></div><div class="teclado">${teclas.map((c) => `<button data-c="${c}">${c}</button>`).join("")}</div>`;
      const pinta = () => { el.querySelector("#w").textContent = [...w].map((c) => (dichas.has(c) ? c : "_")).join(" "); el.querySelector("#f").textContent = "♥".repeat(6 - fallos) + "♡".repeat(fallos); };
      pinta();
      const ok = await new Promise((res) => el.querySelectorAll("[data-c]").forEach((b) => b.onclick = () => {
        const c = b.dataset.c; dichas.add(c); b.disabled = true;
        if (w.includes(c)) b.classList.add("ok"); else { b.classList.add("mal"); fallos++; }
        pinta();
        if ([...w].every((x) => dichas.has(x))) res(true); else if (fallos >= 6) res(false);
      }));
      el.querySelectorAll("[data-c]").forEach((b) => b.disabled = true);
      el.querySelector("#w").textContent = w;
      return { ok, html: `<p>La palabra era <b>${esc(w)}</b>${ok ? ` (${fallos} ${fallos === 1 ? "fallo" : "fallos"})` : ""}.</p>${reglaDe(p.c)}` };
    },
  },
  {
    id: "vocales", e: "🫥", n: "Sin vocales", orig: "Juego de palabras (inteligencia)",
    desc: "Solo quedan las consonantes. Adivina la palabra y escríbela entera, con sus tildes.",
    ej: "c _ m _ _ n → camión.",
    async run(el) {
      const p = palAzar((p) => p.w.length >= 5 && p.w.length <= 11 && p.d <= 3 && /^[a-záéíóúüñ]+$/.test(p.w) && (p.w.match(/[^aeiouáéíóúü]/g) || []).length >= 3);
      const m = [...p.w].map((c) => (/[aeiouáéíóúü]/.test(c) ? "_" : c)).join(" ");
      el.innerHTML = `<p class="enun">¿Qué palabra es?</p><div class="palabra" style="font-size:${p.w.length > 7 ? 28 : 36}px;letter-spacing:.04em">${esc(m)}</div>
        <input class="esc" id="in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escríbela entera"><button class="btn" style="width:100%" id="ok">Comprobar</button>`;
      const inp = el.querySelector("#in"); inp.focus();
      await new Promise((res) => { el.querySelector("#ok").onclick = res; inp.onkeydown = (e) => { if (e.key === "Enter") res(); }; });
      inp.disabled = true; el.querySelector("#ok").disabled = true;
      const ok = norm(inp.value) === norm(p.w);
      return { ok, html: `<p>Era <b>${esc(p.w)}</b>.${!ok && norm(quitarTildes(inp.value)) === norm(quitarTildes(p.w)) ? " ¡Casi! Solo te ha fallado la tilde." : ""}</p>${reglaDe(p.c)}` };
    },
  },
  {
    id: "diptongo", e: "🔗", n: "¿Diptongo o hiato?", orig: "Clasificaciones (base de las reglas)",
    desc: "Dos vocales juntas: ¿van en la misma sílaba (diptongo) o en sílabas distintas (hiato)?",
    ej: "«cielo» → diptongo (cie-lo) · «país» → hiato (pa-ís).",
    async run(el) {
      const p = palAzar((p) => /[aeiouáéíóú]h?[aeiouáéíóú]/.test(p.w) && !/q|gu[eéií]|y|ü/.test(p.w) && (p.w.match(/[aeiouáéíóú]h?[aeiouáéíóú]/g) || []).length === 1);
      const sil = silabear(p.w);
      const tri = sil.some((s) => /[aeiouáéíóú]{3}/.test(s));
      const dip = sil.some((s) => /[aeiouáéíóú]{2}/.test(s));
      const k = tri ? 2 : dip ? 0 : 1;
      el.innerHTML = `<p class="enun">Las vocales juntas de esta palabra forman…</p><div class="palabra">${esc(p.w).replace(/([aeiouáéíóú]h?[aeiouáéíóú]+)/, "<u>$1</u>")}</div><div id="z"></div>`;
      const ok = await opciones(el.querySelector("#z"), ["Diptongo", "Hiato", "Triptongo"], k);
      return { ok, html: `<p>Se separa <b>${esc(sil.join("-"))}</b>: ${k === 1 ? "las vocales quedan en sílabas distintas, es un hiato." : k === 2 ? "tres vocales en la misma sílaba, es un triptongo." : "las vocales van en la misma sílaba, es un diptongo."}</p>${p.c === "ACE.HIATO" || p.c === "ACE.DIPT_TILDE" ? reglaDe(p.c) : ""}` };
    },
  },
  {
    id: "separa", e: "✂️", n: "Separa en sílabas", orig: "Clasificaciones (base de las reglas)",
    desc: "Tres maneras de partir la palabra en sílabas. Solo una es la buena.",
    ej: "«ventana» → ven-ta-na.",
    async run(el) {
      const p = palAzar((p) => p.w.length >= 5 && silabear(p.w).length >= 3 && !/y/.test(p.w));
      const sil = silabear(p.w); const bien = sil.join("-");
      const malas = new Set();
      for (let k = 0; k < 40 && malas.size < 2; k++) {
        const s = sil.slice(); const i = rnd(s.length - 1);
        if (Math.random() < 0.5 && s[i].length > 1) { s[i + 1] = s[i].slice(-1) + s[i + 1]; s[i] = s[i].slice(0, -1); }
        else if (s[i + 1].length > 1) { s[i] = s[i] + s[i + 1][0]; s[i + 1] = s[i + 1].slice(1); }
        const t = s.join("-"); if (t !== bien && !s.includes("")) malas.add(t);
      }
      if (malas.size < 2) return null;
      const o = shuffle([bien, ...malas]);
      el.innerHTML = `<p class="enun">¿Cómo se separa en sílabas?</p><div class="palabra">${esc(p.w)}</div><div id="z"></div>`;
      const ok = await opciones(el.querySelector("#z"), o, o.indexOf(bien));
      return { ok, html: `<p><b>${esc(bien)}</b> (${sil.length} sílabas).</p><div class="regla"><b>Separar en sílabas</b>${esc(COMP("ACE.SILABAS")[1])}</div>` };
    },
  },
  {
    id: "teoria", e: "🎓", n: "Teoría de la tilde", orig: "Clasificaciones (base de las reglas)",
    desc: "Preguntas cortas sobre las reglas: qué es una llana, cuándo hay hiato, qué es la tilde diacrítica…",
    ej: "«Las llanas llevan tilde cuando terminan en…» → consonante que no sea n ni s.",
    async run(el) {
      const [q, o, a, x] = pick(TEORIA); const mix = shuffle(o.map((t, i) => [t, i === a]));
      el.innerHTML = `<p class="enun">${esc(q)}</p><div id="z"></div>`;
      const ok = await opciones(el.querySelector("#z"), mix.map((m) => m[0]), mix.findIndex((m) => m[1]), { fr: true });
      return { ok, html: `<p>${esc(x)}</p>` };
    },
  },
  {
    id: "ortodle", e: "🟩", n: "Ortodle", orig: "Wordle (juego de palabras)",
    desc: "Adivina la palabra en 6 intentos. Verde: letra en su sitio; amarilla: está pero en otro sitio. La á y la a son letras distintas, y la pista te dice qué regla tiene.",
    ej: "Pista «B o V sin regla», 5 letras → n·u·b·e·s.",
    async run(el, pFijo) {
      const p = pFijo || palAzar((p) => p.w.length >= 5 && p.w.length <= 6 && p.d <= 3 && /^[a-záéíóúñ]+$/.test(p.w));
      const w = p.w, L = w.length, filas = []; let actual = "";
      const teclas = [..."qwertyuiopasdfghjklñzxcvbnmáéíóú"];
      const estado = {}; // letra -> ok | casi | no
      el.innerHTML = `<p class="enun">Adivina la palabra</p><p class="sub" style="margin:-8px 0 10px">Pista: ${esc(COMP(p.c)[0])} · ${L} letras</p>
        <div class="wd" id="g" style="grid-template-columns:repeat(${L},1fr)"></div><div class="teclado wk" id="k"></div>`;
      const colorea = (g) => {
        const r = Array(L).fill("no"), resto = {};
        [...w].forEach((c, i) => { if (g[i] === c) r[i] = "ok"; else resto[c] = (resto[c] || 0) + 1; });
        [...g].forEach((c, i) => { if (r[i] !== "ok" && resto[c]) { r[i] = "casi"; resto[c]--; } });
        return r;
      };
      const pinta = () => {
        let h = "";
        for (let f = 0; f < 6; f++) {
          const g = filas[f]; const col = g ? colorea(g) : null; const txt = g || (f === filas.length ? actual : "");
          for (let i = 0; i < L; i++) h += `<span class="${col ? col[i] : txt[i] ? "lleno" : ""}">${esc(txt[i] || "")}</span>`;
        }
        el.querySelector("#g").innerHTML = h;
        el.querySelector("#k").innerHTML = teclas.map((c) => `<button data-c="${c}" class="${estado[c] || ""}">${c}</button>`).join("") + `<button data-c="⌫" class="ancha">⌫</button><button data-c="↵" class="ancha neg">OK</button>`;
      };
      pinta();
      const ok = await new Promise((res) => {
        const tecla = (c) => {
          if (c === "⌫") actual = actual.slice(0, -1);
          else if (c === "↵") {
            if (actual.length !== L) return toast(`Tiene ${L} letras`);
            filas.push(actual); const col = colorea(actual);
            [...actual].forEach((x, i) => { const n = col[i]; if (estado[x] !== "ok") estado[x] = n === "ok" ? "ok" : estado[x] === "casi" ? "casi" : n; });
            const g = actual; actual = "";
            if (g === w) { pinta(); return res(true); }
            if (filas.length >= 6) { pinta(); return res(false); }
          } else if (actual.length < L) actual += c;
          pinta();
        };
        el.querySelector("#k").onclick = (e) => { const b = e.target.closest("[data-c]"); if (b) tecla(b.dataset.c); };
      });
      el.querySelector("#k").onclick = null;
      const cuadro = filas.map((g) => colorea(g).map((c) => (c === "ok" ? "🟩" : c === "casi" ? "🟨" : "⬜")).join("")).join("<br>");
      return { ok, html: `<p>${ok ? `¡En ${filas.length} de 6!` : "Se acabaron los intentos."} Era <b>${esc(w)}</b>.</p><p style="line-height:1.2">${cuadro}</p>${reglaDe(p.c)}` };
    },
  },
  {
    id: "intercambia", e: "🔄", n: "Intercambia letras", orig: "Waffle (juego de palabras)",
    desc: "Las letras están revueltas. Toca dos para cambiarlas de sitio hasta formar la palabra bien escrita. Las que ya están en su sitio se ponen en negro. Movimientos limitados.",
    ej: "C·N·A·I·Ó·M → camión en 4 cambios.",
    async run(el) {
      const p = palAzar((p) => p.w.length >= 5 && p.w.length <= 8 && p.d <= 3 && /^[a-záéíóúñ]+$/.test(p.w) && new Set(p.w).size >= 4);
      const w = [...p.w]; let a; do { a = shuffle(w); } while (a.join("") === p.w);
      // mínimo de cambios = n - nº de ciclos (con letras repetidas es una cota)
      let min = 0; { const b = a.slice(); for (let i = 0; i < b.length; i++) if (b[i] !== w[i]) { const j = b.findIndex((c, k) => k > i && c === w[i] && b[k] !== w[k]); [b[i], b[j]] = [b[j], b[i]]; min++; } }
      let quedan = min + 3, sel = -1;
      el.innerHTML = `<p class="enun">Ordénala con cambios de dos en dos</p><p class="reloj" id="m"></p><div class="fichas-l tap" id="t"></div><p class="sub" style="text-align:center">Pista: ${esc(COMP(p.c)[0])}</p>`;
      const pinta = () => {
        el.querySelector("#m").textContent = `${quedan} ${quedan === 1 ? "cambio" : "cambios"} (mínimo ${min})`;
        el.querySelector("#t").innerHTML = a.map((c, i) => `<span data-i="${i}" class="${c === w[i] ? "ok" : ""} ${i === sel ? "sel" : ""}">${esc(c.toUpperCase())}</span>`).join("");
      };
      pinta();
      const ok = await new Promise((res) => {
        el.querySelector("#t").onclick = (e) => {
          const s = e.target.closest("[data-i]"); if (!s) return; const i = +s.dataset.i;
          if (sel < 0) { sel = i; return pinta(); }
          if (sel !== i) { [a[sel], a[i]] = [a[i], a[sel]]; quedan--; }
          sel = -1; pinta();
          if (a.join("") === p.w) res(true); else if (quedan <= 0) res(false);
        };
      });
      el.querySelector("#t").onclick = null;
      return { ok, html: `<p>${ok ? `¡Conseguido con ${quedan} ${quedan === 1 ? "cambio" : "cambios"} de sobra!` : "Te has quedado sin cambios."} Era <b>${esc(p.w)}</b>.</p>${reglaDe(p.c)}` };
    },
  },
  {
    id: "superviv", e: "❤️", n: "Supervivencia", orig: "Juegos arcade (vidas y récord)",
    desc: "Palabras sin parar: ¿bien o mal? Tienes 3 vidas y cada vez hay menos tiempo. ¿Cuántas aguantas? Guarda tu récord.",
    ej: "Récord: 23 seguidas.",
    async run(el) {
      const rec = ls.get("rec.superviv", 0); let vidas = 3, puntos = 0, t = 4500; const fallos = [];
      el.innerHTML = `<p class="enun">¿Bien o mal? Que no se te acabe el tiempo</p><div class="hud"><span id="v"></span><span id="pt"></span><span>Récord ${rec}</span></div>
        <div class="barra-t"><i id="bt"></i></div><div class="palabra" id="w"></div><div class="ops dos"><button class="op" data-v="1">✓ Bien</button><button class="op" data-v="0">✗ Mal</button></div>`;
      const $w = el.querySelector("#w"), $bt = el.querySelector("#bt");
      await new Promise((res) => {
        let act, tim;
        const hud = () => { el.querySelector("#v").textContent = "♥".repeat(vidas) + "♡".repeat(3 - vidas); el.querySelector("#pt").textContent = `${puntos} puntos`; };
        const fallo = () => { vidas--; fallos.push(act); hud(); if (vidas <= 0) { clearTimeout(tim); res(); return true; } };
        const nueva = () => {
          const p = palAzar((p) => p.d <= 3); const ok = Math.random() < 0.5; act = { p, ok, w: ok ? p.w : pick(p.alts) };
          $w.textContent = act.w; $bt.style.transition = "none"; $bt.style.width = "100%"; void $bt.offsetWidth;
          $bt.style.transition = `width ${t}ms linear`; $bt.style.width = "0%";
          clearTimeout(tim); tim = setTimeout(() => { if (!fallo()) nueva(); }, t);
        };
        hud(); nueva();
        el.querySelectorAll(".op").forEach((b) => b.onclick = () => {
          if (vidas <= 0) return;
          if ((b.dataset.v === "1") === act.ok) { puntos++; t = Math.max(1400, t * 0.94); hud(); nueva(); }
          else if (!fallo()) nueva();
        });
      });
      el.querySelectorAll(".op").forEach((b) => b.disabled = true);
      const nuevoRec = puntos > rec; if (nuevoRec) ls.set("rec.superviv", puntos);
      return { ok: puntos >= 10 || nuevoRec, html: `<p><b>${puntos} puntos</b>. ${nuevoRec ? "🏆 ¡Nuevo récord!" : `Tu récord: ${rec}.`}</p>${fallos.map((f) => `<p>«${esc(f.w)}» → <b>${esc(f.p.w)}</b>${f.ok ? " (estaba bien)" : ""}</p>`).join("")}` };
    },
  },
  {
    id: "lluvia", e: "🌧️", n: "Lluvia de palabras", orig: "Arcade (lluvia de palabras)",
    desc: "Caen palabras. Revienta las que están mal escritas antes de que lleguen al suelo; deja caer las buenas. 3 vidas, 45 segundos.",
    ej: "«exhuberante» cae → la tocas y explota.",
    async run(el) {
      const rec = ls.get("rec.lluvia", 0); let vidas = 3, puntos = 0, fin = Date.now() + 45000, vel = 6500; const fallos = [];
      el.innerHTML = `<p class="enun">Toca solo las mal escritas</p><div class="hud"><span id="v"></span><span id="pt"></span><span id="tt"></span></div><div class="lluvia" id="z"></div>`;
      const z = el.querySelector("#z");
      await new Promise((res) => {
        const hud = () => { el.querySelector("#v").textContent = "♥".repeat(Math.max(0, vidas)) + "♡".repeat(Math.max(0, 3 - vidas)); el.querySelector("#pt").textContent = `${puntos} puntos`; el.querySelector("#tt").textContent = `${Math.max(0, Math.ceil((fin - Date.now()) / 1000))} s`; };
        let acabado = false;
        const acabar = () => { if (acabado) return; acabado = true; clearInterval(gen); clearInterval(rel); z.querySelectorAll(".gota").forEach((g) => g.remove()); res(); };
        const quita = () => { vidas--; hud(); if (vidas <= 0) acabar(); };
        const gota = () => {
          const p = palAzar((p) => p.d <= 3 && p.w.length <= 11); const malo = Math.random() < 0.5; const w = malo ? pick(p.alts) : p.w;
          const g = document.createElement("button"); g.className = "gota"; g.textContent = w;
          g.style.left = `${4 + rnd(56)}%`; z.appendChild(g);
          const an = g.animate([{ transform: "translateY(-40px)" }, { transform: `translateY(${z.clientHeight}px)` }], { duration: vel, easing: "linear" });
          g.onclick = () => { if (acabado) return; an.cancel(); g.remove(); if (malo) { puntos++; hud(); } else { fallos.push([w, p.w, true]); quita(); } };
          an.onfinish = () => { g.remove(); if (acabado) return; if (malo) { fallos.push([w, p.w, false]); quita(); } };
          vel = Math.max(3200, vel * 0.97);
        };
        hud(); gota();
        const gen = setInterval(gota, 1300);
        const rel = setInterval(() => { hud(); if (Date.now() > fin) acabar(); }, 250);
      });
      const nuevoRec = puntos > rec; if (nuevoRec) ls.set("rec.lluvia", puntos);
      return { ok: vidas > 0 || nuevoRec, html: `<p><b>${puntos} puntos</b>. ${nuevoRec ? "🏆 ¡Nuevo récord!" : `Tu récord: ${rec}.`}</p>${fallos.slice(0, 6).map(([m, b, buena]) => `<p>${buena ? `Tocaste «${esc(m)}», que estaba bien` : `Se te escapó «<s>${esc(m)}</s>» → <b>${esc(b)}</b>`}</p>`).join("")}` };
    },
  },
  {
    id: "construye", e: "🧱", n: "Construye la palabra", orig: "Construcción por sílabas",
    desc: "Monta la palabra tocando sus sílabas en orden. Cuidado: hay una sílaba trampa con la falta típica.",
    ej: "ca · vi · llo · ba → ca-ba-llo (la trampa es «va»).",
    async run(el) {
      const p = palAzar((p) => silabear(p.w).length >= 3 && silabear(p.w).length <= 5 && p.alts.some((a) => silabear(a).some((s) => !silabear(p.w).includes(s))));
      const sil = silabear(p.w); const alt = p.alts.find((a) => silabear(a).some((s) => !sil.includes(s)));
      const trampa = silabear(alt).find((s) => !sil.includes(s));
      const fichas = shuffle([...sil.map((s, i) => ({ s, i })), { s: trampa, i: -1 }]);
      let pos = 0, errores = 0;
      el.innerHTML = `<p class="enun">Monta la palabra sílaba a sílaba</p><div class="palabra" id="w">&nbsp;</div><div class="sils" id="f">${fichas.map((f, k) => `<button data-k="${k}">${esc(f.s)}</button>`).join("")}</div>`;
      await new Promise((res) => {
        el.querySelector("#f").onclick = (e) => {
          const b = e.target.closest("[data-k]"); if (!b || b.disabled) return; const f = fichas[+b.dataset.k];
          if (f.s === sil[pos]) { b.disabled = true; b.classList.add("ok"); pos++; el.querySelector("#w").textContent = sil.slice(0, pos).join("·"); if (pos === sil.length) res(); }
          else { errores++; b.classList.add("mal"); setTimeout(() => b.classList.remove("mal"), 450); }
        };
      });
      el.querySelectorAll("#f button").forEach((b) => b.disabled = true);
      return { ok: errores === 0, html: `<p><b>${esc(p.w)}</b>${errores ? ` (${errores} ${errores === 1 ? "error" : "errores"})` : ", sin un fallo"}. La trampa era «${esc(trampa)}», de «<s>${esc(alt)}</s>».</p>${reglaDe(p.c)}` };
    },
  },
  {
    id: "conexiones", e: "🧩", n: "Conexiones", orig: "Connections del NYT (inteligencia)",
    desc: "16 palabras: agrúpalas de 4 en 4 según la regla de ortografía que comparten. Solo puedes fallar 4 veces.",
    ej: "cambio, hombre, tiempo, siempre → «m antes de b y p».",
    async run(el) {
      const porComp = {};
      // Sin tildes (sus grupos se solapan con los de letras) y sin plurales repetidos.
      D.P.forEach((p) => { if (p[0].length <= 10 && !/MEMORIA$/.test(p[4]) && !p[4].startsWith("ACE.") && COMP(p[4])[1]) (porComp[p[4]] = porComp[p[4]] || []).push(p[0]); });
      const raiz = (w) => quitarTildes(w).slice(0, 5);
      const raices = new Set();
      const usados = new Set(), grupos = [], bloques = new Set();
      for (const c of shuffle(Object.keys(porComp))) {
        if (grupos.length === 4) break;
        const b = c.split(".")[0]; if (bloques.has(b)) continue;
        const ws = [];
        for (const w of shuffle([...new Set(porComp[c])])) { if (ws.length < 4 && !usados.has(w) && !raices.has(raiz(w)) && !ws.some((x) => raiz(x) === raiz(w))) ws.push(w); }
        if (ws.length < 4) continue;
        ws.forEach((w) => { usados.add(w); raices.add(raiz(w)); }); bloques.add(b); grupos.push({ c, ws });
      }
      if (grupos.length < 4) return null;
      let quedan = shuffle(grupos.flatMap((g, gi) => g.ws.map((w) => ({ w, gi })))), sel = new Set(), fallos = 0; const hechos = [];
      el.innerHTML = `<p class="enun">Haz 4 grupos de 4 por su regla</p><div id="hechos"></div><div class="cx" id="g"></div><p class="reloj" id="f"></p><div class="fila"><button class="btn" id="mez">Mezclar</button><button class="btn neg" id="ok" disabled>Comprobar</button></div>`;
      const pinta = () => {
        el.querySelector("#hechos").innerHTML = hechos.map((g) => `<div class="cx-ok"><b>${esc(COMP(g.c)[0])}</b><br>${g.ws.map(esc).join(" · ")}</div>`).join("");
        el.querySelector("#g").innerHTML = quedan.map((x, i) => `<button data-i="${i}" class="${sel.has(i) ? "sel" : ""}">${esc(x.w)}</button>`).join("");
        el.querySelector("#f").textContent = "Fallos: " + "●".repeat(fallos) + "○".repeat(4 - fallos);
        el.querySelector("#ok").disabled = sel.size !== 4;
      };
      pinta();
      const ok = await new Promise((res) => {
        el.querySelector("#g").onclick = (e) => { const b = e.target.closest("[data-i]"); if (!b) return; const i = +b.dataset.i; sel.has(i) ? sel.delete(i) : sel.size < 4 && sel.add(i); pinta(); };
        el.querySelector("#mez").onclick = () => { quedan = shuffle(quedan); sel.clear(); pinta(); };
        el.querySelector("#ok").onclick = () => {
          const xs = [...sel].map((i) => quedan[i]); const gi = xs[0].gi;
          if (xs.every((x) => x.gi === gi)) { hechos.push(grupos[gi]); quedan = quedan.filter((x) => x.gi !== gi); sel.clear(); pinta(); if (!quedan.length) res(true); }
          else {
            fallos++; const cuenta = Math.max(...[0, 1, 2, 3].map((g) => xs.filter((x) => x.gi === g).length));
            toast(cuenta === 3 ? "¡Casi! Te sobra una" : "No es un grupo"); sel.clear(); pinta();
            if (fallos >= 4) res(false);
          }
        };
      });
      el.querySelectorAll("#g button, .fila button").forEach((b) => b.disabled = true);
      return { ok, html: `<p>${ok ? `¡Los 4 grupos${fallos ? ` con ${fallos} ${fallos === 1 ? "fallo" : "fallos"}` : " sin fallar"}!` : "Se acabaron los fallos. Los grupos eran:"}</p>${grupos.map((g) => `<div class="regla"><b>${esc(COMP(g.c)[0])}</b>${g.ws.map(esc).join(" · ")}</div>`).join("<div style='height:6px'></div>")}` };
    },
  },
  {
    id: "sopa", e: "🔎", n: "Sopa de letras", orig: "Sopa de letras (pasatiempo)",
    desc: "Te doy 4 palabras MAL escritas. Encuentra en la sopa la versión correcta: toca su primera y su última letra.",
    ej: "Buscas «ierba» → encuentras HIERBA en la sopa.",
    async run(el) {
      const N = 9; const g = Array.from({ length: N }, () => Array(N).fill(""));
      const pals = []; const usados = new Set();
      for (let k = 0; k < 300 && pals.length < 4; k++) {
        const p = palAzar((p) => p.w.length >= 4 && p.w.length <= N && /^[a-záéíóúñ]+$/.test(p.w) && !usados.has(p.w) && p.d <= 3);
        const w = p.w.toUpperCase(); const dir = rnd(2); const r = rnd(dir ? N - w.length + 1 : N), c = rnd(dir ? N : N - w.length + 1);
        const celdas = [...w].map((_, i) => (dir ? [r + i, c] : [r, c + i]));
        if (celdas.every(([y, x], i) => !g[y][x] || g[y][x] === w[i])) { celdas.forEach(([y, x], i) => (g[y][x] = w[i])); pals.push({ p, celdas, w, mal: pick(p.alts), hecha: false }); usados.add(p.w); }
      }
      if (pals.length < 4) return null;
      const relleno = "AAAEEEIIOOUBCDLMNRRSSTTGPVHÑZJ";
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!g[y][x]) g[y][x] = relleno[rnd(relleno.length)];
      let ini = null;
      el.innerHTML = `<p class="enun">Encuentra la forma correcta</p><div class="pistas" id="pi"></div><div class="sopa" id="s" style="grid-template-columns:repeat(${N},1fr)">${g.flat().map((ch, i) => `<button data-i="${i}">${ch}</button>`).join("")}</div><button class="btn" style="width:100%;margin-top:10px" id="rinde">Me rindo</button>`;
      const pistas = () => { el.querySelector("#pi").innerHTML = pals.map((x) => x.hecha ? `<span class="hecha">${esc(x.p.w)}</span>` : `<span><s>${esc(x.mal)}</s></span>`).join(""); };
      pistas();
      const ok = await new Promise((res) => {
        el.querySelector("#rinde").onclick = () => res(false);
        el.querySelector("#s").onclick = (e) => {
          const b = e.target.closest("[data-i]"); if (!b) return; const i = +b.dataset.i;
          if (ini === null) { ini = i; b.classList.add("sel"); return; }
          const a = ini; ini = null; el.querySelectorAll("#s .sel").forEach((x) => x.classList.remove("sel"));
          const pos = (k) => [Math.floor(k / N), k % N];
          const x = pals.find((x) => !x.hecha && [[a, i], [i, a]].some(([u, v]) => String(pos(u)) === String(x.celdas[0]) && String(pos(v)) === String(x.celdas.at(-1))));
          if (x) { x.hecha = true; x.celdas.forEach(([yy, xx]) => el.querySelector(`#s [data-i="${yy * N + xx}"]`).classList.add("ok")); pistas(); if (pals.every((q) => q.hecha)) res(true); }
          else { b.classList.add("mal"); setTimeout(() => b.classList.remove("mal"), 400); }
        };
      });
      pals.forEach((x) => x.celdas.forEach(([yy, xx]) => el.querySelector(`#s [data-i="${yy * N + xx}"]`).classList.add("ok")));
      el.querySelectorAll("#s button, #rinde").forEach((b) => b.disabled = true);
      return { ok, html: `<p>${pals.map((x) => `«<s>${esc(x.mal)}</s>» → <b>${esc(x.p.w)}</b>`).join(" · ")}</p>` };
    },
  },
  {
    id: "caja", e: "🔐", n: "La caja fuerte", orig: "Escape room de Projet Voltaire (Revolt-IA)",
    desc: "Abre los 4 cierres de la caja fuerte: cada acierto abre uno y te da una cifra del código; cada fallo vuelve a cerrar el último. 60 segundos.",
    ej: "🔓🔓🔒🔒 · código 7 3 _ _.",
    async run(el) {
      const codigo = Array.from({ length: 4 }, () => rnd(10)); let abiertos = 0, fin = Date.now() + 60000, preguntas = 0;
      el.innerHTML = `<p class="enun">Abre la caja fuerte</p><div class="caja"><div id="cer"></div><div id="cod"></div><div class="reloj" id="tt"></div></div><div id="q"></div>`;
      const hud = () => {
        el.querySelector("#cer").textContent = "🔓".repeat(abiertos) + "🔒".repeat(4 - abiertos);
        el.querySelector("#cod").textContent = codigo.map((d, i) => (i < abiertos ? d : "_")).join(" ");
        el.querySelector("#tt").textContent = `${Math.max(0, Math.ceil((fin - Date.now()) / 1000))} s`;
      };
      const ok = await new Promise((res) => {
        const rel = setInterval(() => { hud(); if (Date.now() > fin) { clearInterval(rel); res(false); } }, 250);
        const pregunta = async () => {
          if (abiertos >= 4) { clearInterval(rel); return res(true); }
          preguntas++; const q = el.querySelector("#q"); const yo = preguntas; let bien;
          const p = palAzar((p) => p.d <= 3);
          if (Math.random() < 0.5 && p.g && p.op && p.op.includes(p.w.slice(p.g[0], p.g[1]))) {
            const pieza = p.w.slice(p.g[0], p.g[1]); const ops = shuffle(p.op).slice(0, 3); if (!ops.includes(pieza)) ops[0] = pieza;
            q.innerHTML = `<div class="palabra">${esc(p.w.slice(0, p.g[0]))}<span class="hueco">&nbsp;</span>${esc(p.w.slice(p.g[1]))}</div><div id="z"></div>`;
            bien = await opciones(q.querySelector("#z"), ops, ops.indexOf(pieza), { dos: true });
          } else {
            const b = Math.random() < 0.5; q.innerHTML = `<div class="palabra">${esc(b ? p.w : pick(p.alts))}</div><div id="z"></div>`;
            bien = await opciones(q.querySelector("#z"), ["✓ Bien", "✗ Mal"], b ? 0 : 1, { dos: true });
          }
          if (yo !== preguntas || Date.now() > fin) return;
          abiertos = Math.max(0, abiertos + (bien ? 1 : -1)); hud();
          setTimeout(pregunta, bien ? 250 : 700);
        };
        hud(); pregunta();
      });
      preguntas = -1; el.querySelector("#q").innerHTML = "";
      return { ok, html: `<p>${ok ? `🔓 ¡Abierta! El código era <b>${codigo.join(" ")}</b>, con ${Math.ceil((fin - Date.now()) / 1000)} s de sobra.` : `Se acabó el tiempo con ${abiertos} de 4 cierres abiertos.`}</p>` };
    },
  },
  {
    id: "duo", e: "🦉", n: "Escribe lo que oyes", orig: "Duolingo (banco de palabras)",
    desc: "Oyes una frase y la montas tocando las fichas en orden. Entre las fichas hay trampas: la misma palabra con falta.",
    ej: "🔊 «El equipo estuvo a punto…» → fichas: estuvo · estubo · …",
    async run(el) {
      if (!("speechSynthesis" in window)) return null;
      let s, pi; for (let k = 0; k < 80; k++) { [s, pi] = pick(D.F); if (s.split(" ").length <= 11) break; }
      const pals = s.match(/[\p{L}\p{M}]+/gu); const p = P(pi);
      const trampas = [pick(p.alts)];
      const otra = pals.find((w) => w !== p.w && w.length > 3 && byWord.has(w)); if (otra) trampas.push(pick(P(byWord.get(otra)).alts));
      const fichas = shuffle([...pals.map((w) => ({ w, ok: true })), ...trampas.map((w) => ({ w, ok: false }))]);
      const puesto = [];
      el.innerHTML = `<p class="enun">Escucha y monta la frase</p><div class="fila" style="margin:8px 0 12px"><button class="btn neg" id="oir">🔊 Oír</button><button class="btn" id="lento">🐢 Despacio</button></div>
        <div class="banco-r" id="r"></div><div class="banco" id="b">${fichas.map((f, k) => `<button data-k="${k}">${esc(f.w)}</button>`).join("")}</div>
        <button class="btn" style="width:100%;margin-top:12px" id="ok">Comprobar</button>`;
      const di = (rate) => { const u = new SpeechSynthesisUtterance(s); u.lang = "es-ES"; u.rate = rate; const v = speechSynthesis.getVoices().find((v) => /^es/i.test(v.lang)); if (v) u.voice = v; speechSynthesis.cancel(); speechSynthesis.speak(u); };
      el.querySelector("#oir").onclick = () => di(0.9); el.querySelector("#lento").onclick = () => di(0.6); setTimeout(() => di(0.9), 250);
      const pinta = () => {
        el.querySelector("#r").innerHTML = puesto.map((k, i) => `<button data-i="${i}">${esc(fichas[k].w)}</button>`).join("") || "<span class='sub'>Toca las fichas en orden</span>";
        el.querySelectorAll("#b button").forEach((b) => b.style.visibility = puesto.includes(+b.dataset.k) ? "hidden" : "");
      };
      pinta();
      el.querySelector("#b").onclick = (e) => { const b = e.target.closest("[data-k]"); if (b) { puesto.push(+b.dataset.k); pinta(); } };
      el.querySelector("#r").onclick = (e) => { const b = e.target.closest("[data-i]"); if (b) { puesto.splice(+b.dataset.i, 1); pinta(); } };
      await new Promise((res) => el.querySelector("#ok").onclick = res);
      el.querySelectorAll("button").forEach((b) => b.disabled = true);
      const dicho = puesto.map((k) => fichas[k].w).join(" ");
      const ok = dicho === pals.join(" ");
      return { ok, html: `<p>${esc(s)}</p>${ok ? "" : `<p>Tú: ${esc(dicho || "(nada)")}</p>`}<p>Las trampas eran: ${trampas.map((t) => `<s>${esc(t)}</s>`).join(" · ")}</p>${reglaDe(p.c)}` };
    },
  },
  {
    id: "rosco", e: "⭕", n: "El rosco", orig: "Pasapalabra (concurso de TV)",
    desc: "Una letra para cada palabra del abecedario. Te doy la palabra mal escrita y tú la escribes bien. «Pasapalabra» la deja para la siguiente vuelta. 150 segundos.",
    ej: "Con la H: «ierba» → hierba.",
    async run(el) {
      const letras = [..."abcdefghijlmnñopqrstuvxyz"]; const usados = new Set();
      const ro = letras.map((l) => {
        const ini = (w) => quitarTildes(w)[0] === l;
        let p = palAzar((p) => ini(p.w) && !usados.has(p.w) && p.d <= 3 && /^[a-záéíóúñü]+$/.test(p.w), 600), modo = "Empieza por";
        if (!ini(p.w)) { p = palAzar((p) => quitarTildes(p.w).includes(l) && !usados.has(p.w) && /^[a-záéíóúñü]+$/.test(p.w), 600); modo = "Contiene la"; }
        usados.add(p.w); return { l, p, modo, mal: pick(p.alts), estado: "" };
      });
      const rec = ls.get("rec.rosco", 0); const fin = Date.now() + 150000; let cola = ro.map((_, i) => i);
      el.innerHTML = `<div class="rosco" id="ro">${ro.map((r, i) => `<span data-i="${i}" style="--a:${(360 / ro.length) * i}deg">${r.l.toUpperCase()}</span>`).join("")}
        <div class="rosco-c"><div class="reloj" id="tt"></div><p id="cl"></p><input class="esc" id="in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escríbela bien">
        <div class="fila"><button class="btn" id="pasa">Pasapalabra</button><button class="btn neg" id="ok">OK</button></div></div></div>`;
      const inp = el.querySelector("#in");
      const pinta = () => {
        ro.forEach((r, i) => { el.querySelector(`#ro [data-i="${i}"]`).className = r.estado + (i === cola[0] ? " act" : ""); });
        const r = ro[cola[0]];
        if (r) el.querySelector("#cl").innerHTML = `${r.modo} <b>${r.l.toUpperCase()}</b>: «<s>${esc(r.mal)}</s>»`;
        el.querySelector("#tt").textContent = `${Math.max(0, Math.ceil((fin - Date.now()) / 1000))} s`;
      };
      pinta(); inp.focus();
      await new Promise((res) => {
        const rel = setInterval(() => { pinta(); if (Date.now() > fin) { clearInterval(rel); res(); } }, 300);
        const sig = () => { if (!cola.length) { clearInterval(rel); res(); return; } pinta(); inp.value = ""; inp.focus(); };
        el.querySelector("#ok").onclick = () => { const i = cola.shift(); const r = ro[i]; r.estado = norm(inp.value) === norm(r.p.w) ? "ok" : "mal"; r.dijo = inp.value; sig(); };
        el.querySelector("#pasa").onclick = () => { cola.push(cola.shift()); sig(); };
        inp.onkeydown = (e) => { if (e.key === "Enter") el.querySelector(inp.value.trim() ? "#ok" : "#pasa").click(); };
      });
      inp.disabled = true; el.querySelectorAll(".rosco-c button").forEach((b) => b.disabled = true);
      const bien = ro.filter((r) => r.estado === "ok").length; const nuevoRec = bien > rec; if (nuevoRec) ls.set("rec.rosco", bien);
      const malas = ro.filter((r) => r.estado !== "ok");
      return { ok: bien >= Math.ceil(ro.length * 0.6) || nuevoRec, html: `<p><b>${bien} de ${ro.length}</b>. ${nuevoRec ? "🏆 ¡Nuevo récord!" : `Tu récord: ${rec}.`}</p>${malas.length ? `<p>${malas.map((r) => `${r.l.toUpperCase()}: <b>${esc(r.p.w)}</b>${r.dijo ? ` (pusiste «${esc(r.dijo)}»)` : ""}`).join(" · ")}</p>` : ""}` };
    },
  },
  {
    id: "panal", e: "🐝", n: "El panal", orig: "Spelling Bee del NYT",
    desc: "7 letras en un panal. Forma todas las palabras que puedas de 4 letras o más, usando siempre la del centro. La á y la a son letras distintas.",
    ej: "Letras C·A·M·I·Ó·N·S (centro A) → «cama», «camión»…",
    async run(el) {
      const dic = D.W || D.P.map((p) => p[0]).filter((w) => /^[a-záéíóúñü]{4,}$/.test(w));
      let L, centro, sol;
      for (let k = 0; k < 120; k++) {
        const base = pick(dic); const set = [...new Set(base)]; if (set.length !== 7) continue;
        for (const c of shuffle(set)) { const s = dic.filter((w) => w.includes(c) && [...w].every((x) => set.includes(x))); if (s.length >= 8) { L = set; centro = c; sol = s; break; } }
        if (sol) break;
      }
      if (!sol) return null;
      let otras = shuffle(L.filter((c) => c !== centro)), actual = ""; const hechas = [];
      const meta = Math.min(sol.length, Math.max(5, Math.ceil(sol.length * 0.35)));
      el.innerHTML = `<p class="enun">Forma palabras con la letra del centro</p><p class="reloj" id="pt"></p><div class="palabra" id="w" style="min-height:52px"></div>
        <div class="panal" id="pn"></div><div class="fila" style="margin-top:12px"><button class="btn" id="bo">Borrar</button><button class="btn" id="mz">Mezclar</button><button class="btn neg" id="en">Enviar</button></div>
        <div class="pistas" id="hh" style="margin-top:12px"></div><button class="btn" style="width:100%;margin-top:6px" id="fin">Terminar</button>`;
      const pinta = () => {
        el.querySelector("#w").textContent = actual || " ";
        el.querySelector("#pn").innerHTML = [otras[0], otras[1], otras[2], centro, otras[3], otras[4], otras[5]].map((c) => `<button data-c="${c}" class="${c === centro ? "centro" : ""}">${c.toUpperCase()}</button>`).join("");
        el.querySelector("#pt").textContent = `${hechas.length} de ${sol.length} palabras · objetivo ${meta}`;
        el.querySelector("#hh").innerHTML = hechas.map((w) => `<span class="hecha">${esc(w)}</span>`).join("");
      };
      pinta();
      await new Promise((res) => {
        el.querySelector("#pn").onclick = (e) => { const b = e.target.closest("[data-c]"); if (b) { actual += b.dataset.c; pinta(); } };
        el.querySelector("#bo").onclick = () => { actual = actual.slice(0, -1); pinta(); };
        el.querySelector("#mz").onclick = () => { otras = shuffle(otras); pinta(); };
        el.querySelector("#fin").onclick = res;
        el.querySelector("#en").onclick = () => {
          const w = actual; actual = "";
          if (w.length < 4) toast("Mínimo 4 letras");
          else if (!w.includes(centro)) toast("Tiene que llevar la letra del centro");
          else if (hechas.includes(w)) toast("Esa ya la tienes");
          else if (sol.includes(w)) { hechas.push(w); toast(new Set(w).size === 7 ? "🐝 ¡Usa las 7 letras!" : "¡Bien!"); if (hechas.length === sol.length) res(); }
          else if (sol.includes(quitarTildes(w)) || sol.some((s) => quitarTildes(s) === quitarTildes(w))) toast("Casi: revisa la tilde");
          else toast("No está en la lista");
          pinta();
        };
      });
      el.querySelectorAll("#pn button, .fila button, #fin").forEach((b) => b.disabled = true);
      const faltan = sol.filter((w) => !hechas.includes(w));
      return { ok: hechas.length >= meta, html: `<p><b>${hechas.length} de ${sol.length}</b> palabras.</p>${faltan.length ? `<p>Te faltaron: ${faltan.map(esc).join(" · ")}</p>` : "<p>¡Todas!</p>"}` };
    },
  },
  {
    id: "memoria", e: "🃏", n: "Memoria de parejas", orig: "Juego de memoria (cartas boca abajo)",
    desc: "12 cartas boca abajo: 6 palabras bien escritas y sus 6 versiones con falta. Levanta dos y encuentra cada pareja con los menos intentos posibles.",
    ej: "«hierba» ↔ «ierba».",
    async run(el) {
      const usados = new Set(), pares = [];
      while (pares.length < 6) { const p = palAzar((p) => p.w.length <= 10 && p.d <= 3 && !usados.has(p.w)); usados.add(p.w); pares.push([p.w, pick(p.alts)]); }
      const cartas = shuffle(pares.flatMap(([b, m], i) => [{ t: b, i, bien: true }, { t: m, i, bien: false }]));
      let abiertas = [], intentos = 0, hechas = 0; const rec = ls.get("rec.memoria", 0);
      el.innerHTML = `<p class="enun">Encuentra las parejas</p><p class="reloj" id="pt"></p><div class="memo" id="m">${cartas.map((c, k) => `<button data-k="${k}"><span>${esc(c.t)}</span></button>`).join("")}</div>`;
      const hud = () => { el.querySelector("#pt").textContent = `${intentos} intentos${rec ? ` · récord ${rec}` : ""}`; };
      hud();
      await new Promise((res) => {
        el.querySelector("#m").onclick = (e) => {
          const b = e.target.closest("[data-k]"); if (!b || b.classList.contains("vista") || abiertas.length >= 2) return;
          b.classList.add("vista"); abiertas.push(b);
          if (abiertas.length === 2) {
            intentos++; hud(); const [a, c] = abiertas.map((x) => cartas[+x.dataset.k]);
            if (a.i === c.i) { abiertas.forEach((x) => { x.classList.add("hecha"); const cc = cartas[+x.dataset.k]; if (!cc.bien) x.querySelector("span").innerHTML = `<s>${esc(cc.t)}</s>`; }); abiertas = []; if (++hechas === 6) setTimeout(res, 300); }
            else setTimeout(() => { abiertas.forEach((x) => x.classList.remove("vista")); abiertas = []; }, 900);
          }
        };
      });
      const nuevoRec = !rec || intentos < rec; if (nuevoRec) ls.set("rec.memoria", intentos);
      return { ok: intentos <= 12 || nuevoRec, html: `<p><b>${intentos} intentos</b> (lo perfecto son 6). ${nuevoRec ? "🏆 ¡Nuevo récord!" : `Tu récord: ${rec}.`}</p><p>${pares.map(([b, m]) => `<b>${esc(b)}</b> / <s>${esc(m)}</s>`).join(" · ")}</p>` };
    },
  },
  {
    id: "desliza", e: "👆", n: "Desliza", orig: "Gesto de Tinder (deslizar)",
    desc: "Sale una palabra con hueco y dos opciones, una a cada lado. Desliza la tarjeta hacia la buena (o toca el lado). 25 segundos: ¿cuántas haces?",
    ej: "«hier_a» → desliza a la izquierda «b».",
    async run(el) {
      const rec = ls.get("rec.desliza", 0); let bien = 0, total = 0; const fallos = []; const fin = Date.now() + 25000;
      el.innerHTML = `<div class="hud"><span id="pt">0</span><span id="tt"></span><span>Récord ${rec}</span></div><div class="desliza" id="z"><div class="lado iz" id="li"></div><div class="lado de" id="ld"></div><div class="carta" id="c"></div></div>`;
      const $c = el.querySelector("#c"); let act;
      const nueva = () => {
        const p = palAzar((p) => p.g && p.op && p.op.length === 2 && p.op.includes(p.w.slice(p.g[0], p.g[1])));
        const ops = shuffle(p.op); act = { p, ops, pieza: p.w.slice(p.g[0], p.g[1]) };
        el.querySelector("#li").textContent = ops[0] || "(nada)"; el.querySelector("#ld").textContent = ops[1] || "(nada)";
        $c.innerHTML = `${esc(p.w.slice(0, p.g[0]))}<span class="hueco">&nbsp;</span>${esc(p.w.slice(p.g[1]))}`; $c.style.transform = "";
      };
      await new Promise((res) => {
        const rel = setInterval(() => { el.querySelector("#tt").textContent = `${Math.max(0, Math.ceil((fin - Date.now()) / 1000))} s`; if (Date.now() > fin) { clearInterval(rel); res(); } }, 200);
        const elige = (lado) => {
          if (Date.now() > fin) return; total++;
          if (act.ops[lado] === act.pieza) { bien++; $c.classList.add("bien"); } else { fallos.push(act.p.w); $c.classList.add("malc"); }
          el.querySelector("#pt").textContent = `${bien} ✓`;
          $c.style.transform = `translateX(${lado ? 140 : -140}%) rotate(${lado ? 20 : -20}deg)`;
          setTimeout(() => { $c.classList.remove("bien", "malc"); nueva(); }, 220);
        };
        let x0 = null;
        $c.onpointerdown = (e) => { x0 = e.clientX; $c.setPointerCapture(e.pointerId); };
        $c.onpointermove = (e) => { if (x0 !== null) $c.style.transform = `translateX(${e.clientX - x0}px) rotate(${(e.clientX - x0) / 12}deg)`; };
        $c.onpointerup = (e) => { const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 60) elige(dx > 0 ? 1 : 0); else $c.style.transform = ""; };
        el.querySelector("#li").onclick = () => elige(0); el.querySelector("#ld").onclick = () => elige(1);
        nueva();
      });
      $c.onpointerdown = null; el.querySelector("#li").onclick = el.querySelector("#ld").onclick = null;
      const nuevoRec = bien > rec; if (nuevoRec) ls.set("rec.desliza", bien);
      return { ok: (bien >= 8 && bien / Math.max(1, total) >= 0.8) || nuevoRec, html: `<p><b>${bien} de ${total}</b>. ${nuevoRec ? "🏆 ¡Nuevo récord!" : `Tu récord: ${rec}.`}</p>${fallos.length ? `<p>Fallaste: ${fallos.map((w) => `<b>${esc(w)}</b>`).join(" · ")}</p>` : ""}` };
    },
  },
  {
    id: "carrera", e: "🏁", n: "Carrera contra el Profe", orig: "Duelo contra un rival (carreras)",
    desc: "El Profe Tilde avanza solo. Tú avanzas con cada acierto y retrocedes con cada fallo. El primero en llegar a la meta gana.",
    ej: "Tú 🏃 ━━━━━━━━ 🏁 · Profe 🧑‍🏫 ━━━━ 🏁",
    async run(el) {
      const META = 12; let yo = 0, profe = 0; const fallos = [];
      el.innerHTML = `<div class="pista-c"><div>Tú <span id="py"></span></div><div>Profe <span id="pp"></span></div></div><div class="palabra" id="w"></div><div class="ops dos"><button class="op" data-v="1">✓ Bien</button><button class="op" data-v="0">✗ Mal</button></div>`;
      const barra = (n, e) => "━".repeat(n) + e + "┄".repeat(META - n) + "🏁";
      const hud = () => { el.querySelector("#py").textContent = barra(yo, "🏃"); el.querySelector("#pp").textContent = barra(profe, "🧑‍🏫"); };
      let act; const nueva = () => { const p = palAzar((p) => p.d <= 3); const ok = Math.random() < 0.5; act = { p, ok, w: ok ? p.w : pick(p.alts) }; el.querySelector("#w").textContent = act.w; };
      hud(); nueva();
      const gana = await new Promise((res) => {
        const bot = setInterval(() => { profe++; hud(); if (profe >= META) { clearInterval(bot); res(false); } }, 2300);
        el.querySelectorAll(".op").forEach((b) => b.onclick = () => {
          if (profe >= META || yo >= META) return;
          if ((b.dataset.v === "1") === act.ok) yo++; else { yo = Math.max(0, yo - 1); fallos.push(act); }
          hud(); if (yo >= META) { clearInterval(bot); res(true); } else nueva();
        });
      });
      el.querySelectorAll(".op").forEach((b) => b.disabled = true);
      return { ok: gana, html: `<p>${gana ? "🏆 ¡Le has ganado al Profe Tilde!" : "El Profe llegó antes. ¡La revancha!"}</p>${fallos.slice(0, 5).map((f) => `<p>«${esc(f.w)}» → <b>${esc(f.p.w)}</b>${f.ok ? " (estaba bien)" : ""}</p>`).join("")}` };
    },
  },
  {
    id: "raya", e: "#️⃣", n: "Tres en raya", orig: "Juego de mesa (tres en raya)",
    desc: "Juegas contra la máquina. Para poner tu ✗ en una casilla tienes que acertar la letra que falta; si fallas, pierdes el turno.",
    ej: "Eliges la casilla del centro → «hier_a» → b → ✗ tuya.",
    async run(el) {
      const T = Array(9).fill(""); const lineas = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
      const gana = (s) => lineas.some((l) => l.every((i) => T[i] === s));
      el.innerHTML = `<p class="enun" id="msg">Elige casilla</p><div class="raya" id="t"></div><div id="q"></div>`;
      const pinta = () => { el.querySelector("#t").innerHTML = T.map((v, i) => `<button data-i="${i}" ${v ? "disabled" : ""}>${v}</button>`).join(""); };
      const bot = () => {
        const libres = T.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
        const prueba = (s) => libres.find((i) => { T[i] = s; const g = gana(s); T[i] = ""; return g; });
        let i = prueba("◯"); if (i === undefined) i = prueba("✗"); if (i === undefined) i = T[4] ? pick(libres) : 4;
        T[i] = "◯";
      };
      pinta();
      const res = await new Promise((fin) => {
        el.querySelector("#t").onclick = async (e) => {
          const b = e.target.closest("[data-i]"); if (!b || b.disabled || el.querySelector("#q").innerHTML) return;
          const i = +b.dataset.i; b.classList.add("sel");
          const p = palAzar((p) => p.g && p.op && p.op.includes(p.w.slice(p.g[0], p.g[1])));
          const pieza = p.w.slice(p.g[0], p.g[1]); const ops = shuffle(p.op).slice(0, 3); if (!ops.includes(pieza)) ops[0] = pieza;
          const q = el.querySelector("#q");
          q.innerHTML = `<div class="palabra">${esc(p.w.slice(0, p.g[0]))}<span class="hueco">&nbsp;</span>${esc(p.w.slice(p.g[1]))}</div><div id="z"></div>`;
          const ok = await opciones(q.querySelector("#z"), ops, ops.indexOf(pieza), { dos: true });
          el.querySelector("#msg").textContent = ok ? "¡Casilla tuya!" : `Era «${p.w}». Pierdes el turno.`;
          await new Promise((r) => setTimeout(r, ok ? 500 : 1200)); q.innerHTML = "";
          if (ok) T[i] = "✗";
          if (gana("✗")) { pinta(); return fin("gana"); }
          if (T.every(Boolean)) { pinta(); return fin("empate"); }
          bot(); pinta();
          if (gana("◯")) return fin("pierde");
          if (T.every(Boolean)) return fin("empate");
          el.querySelector("#msg").textContent = "Tu turno: elige casilla";
        };
      });
      el.querySelectorAll("#t button").forEach((b) => b.disabled = true);
      return { ok: res === "gana", html: `<p>${res === "gana" ? "🏆 ¡Tres en raya!" : res === "empate" ? "Empate." : "Ha ganado la máquina."}</p>` };
    },
  },
  {
    id: "diario", e: "📅", n: "Reto del día", orig: "Wordle (un reto al día y racha)",
    desc: "Un Ortodle al día, la misma palabra para todos ese día. Mantén la racha de días seguidos y comparte tu cuadrícula.",
    ej: "Racha: 🔥 5 días.",
    async run(el) {
      const hoy = new Date().toISOString().slice(0, 10);
      const elegibles = D.P.map((_, i) => i).filter((i) => { const w = D.P[i][0]; return w.length >= 5 && w.length <= 6 && D.P[i][5] <= 3 && /^[a-záéíóúñ]+$/.test(w); });
      let h = 0; for (const c of hoy) h = (h * 31 + c.charCodeAt(0)) >>> 0;
      const p = P(elegibles[h % elegibles.length]);
      const st = ls.get("diario", { ult: "", racha: 0, hechos: {} });
      const res = await TIPO.ortodle.run(el, p);
      if (!st.hechos[hoy]) {
        const ayer = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
        st.racha = res.ok ? (st.ult === ayer ? st.racha + 1 : 1) : 0; st.ult = hoy; st.hechos[hoy] = res.ok ? 1 : -1; ls.set("diario", st);
      }
      return { ok: res.ok, html: `<p>${st.hechos[hoy] ? `Reto de hoy ${st.hechos[hoy] === 1 ? "superado" : "fallado"} · 🔥 racha de ${st.racha} ${st.racha === 1 ? "día" : "días"}. Mañana, palabra nueva.` : ""}</p>${res.html}` };
    },
  },
  {
    id: "reloj", e: "⏱️", n: "Contrarreloj", orig: "Orto (semáforo) e Instagram (reto)",
    desc: "20 segundos: palabras que pasan rápido y tú dices bien o mal. ¿Cuántas aciertas?",
    ej: "10 aciertos de 12 en 20 s.",
    async run(el) {
      let fin = Date.now() + 20000, bien = 0, total = 0; const fallos = [];
      el.innerHTML = `<p class="enun">¿Bien o mal? ¡Rápido!</p><div class="reloj" id="r">20</div><div class="palabra" id="w"></div><div class="ops dos"><button class="op" data-v="1">✓ Bien</button><button class="op" data-v="0">✗ Mal</button></div>`;
      const $w = el.querySelector("#w"), $r = el.querySelector("#r");
      let actual;
      const nueva = () => { const p = palAzar((p) => p.d <= 3); const ok = Math.random() < 0.5; actual = { p, ok, w: ok ? p.w : pick(p.alts) }; $w.textContent = actual.w; };
      nueva();
      await new Promise((res) => {
        const tic = setInterval(() => { const s = Math.max(0, Math.ceil((fin - Date.now()) / 1000)); $r.textContent = s; if (s <= 0) { clearInterval(tic); res(); } }, 200);
        el.querySelectorAll(".op").forEach((b) => b.onclick = () => {
          if (Date.now() > fin) return;
          total++; const dijo = b.dataset.v === "1";
          if (dijo === actual.ok) bien++; else fallos.push(actual);
          nueva();
        });
      });
      el.querySelectorAll(".op").forEach((b) => b.disabled = true);
      $w.textContent = `${bien} / ${total}`;
      const ok = total >= 5 && bien / total >= 0.75;
      return { ok, html: `<p>${bien} aciertos de ${total}.${ok ? "" : " (Para darlo por bueno: 5 o más y 3 de cada 4 bien.)"}</p>${fallos.slice(0, 5).map((f) => `<p>«${esc(f.w)}» → <b>${esc(f.p.w)}</b></p>`).join("")}` };
    },
  },
];
const TIPO = Object.fromEntries(TIPOS.map((t) => [t.id, t]));

// Valoración a ojo (mía, no medida): viral = cuánto se compartiría como
// post o reel; adictivo = cuántas veces seguidas apetece jugarlo. 1-3.
const VA = {
  caza: [2, 3, "El clásico de Voltaire: rápido, y el «no hay falta» engancha."],
  bienmal: [3, 3, "Formato de encuesta de historias: un toque y comentas."],
  elige: [3, 2, "El quiz A/B/C que más se comparte en Instagram."],
  letra: [1, 2, "Útil para practicar, poco vistoso para compartir."],
  tilde: [2, 2, "Funciona como reto «¿dónde va la tilde?»."],
  dictado: [2, 2, "«Dictado imposible» da vídeos virales; en la app es más lento."],
  hueco: [2, 2, "«¿Tú o tu?» genera debate en comentarios."],
  junto: [3, 2, "porque/por qué/porqué: todo el mundo duda y lo comenta."],
  intruso: [3, 3, "Muy compartible: «solo el 10 % la encuentra»."],
  cuantas: [3, 2, "Provoca comentarios con el número que ve cada uno."],
  corrige: [1, 2, "Exigente: aprende mucho, se comparte poco."],
  cartel: [3, 2, "Las faltas en carteles reales son de lo más viral."],
  refran: [3, 2, "Refrán conocido + falta = reconocible y gracioso."],
  porque: [1, 1, "Para entender la regla; más estudio que juego."],
  tonica: [1, 1, "Base necesaria, poco espectáculo."],
  clase: [2, 1, "«¿Aguda, llana o esdrújula?» engancha a los que se acuerdan del cole."],
  puntua: [2, 1, "La coma que cambia el sentido («Vamos a comer, niños») sí es viral."],
  mayus: [1, 1, "Útil, poco emocionante."],
  parejas: [1, 2, "Juego tranquilo, gusta repetirlo."],
  dosvalen: [3, 2, "«¡Las dos valen!» sorprende y se comenta mucho (formato Ortografix)."],
  anagrama: [2, 3, "Juego de inteligencia: muy adictivo, poco de ortografía."],
  ahorcado: [2, 3, "Adictivo de toda la vida; con tildes obliga a pensar."],
  vocales: [3, 3, "Reto visual que se resuelve en segundos: perfecto para historias."],
  diptongo: [1, 1, "Teoría pura: útil para entender los hiatos con tilde."],
  separa: [1, 2, "Mecánico pero rápido."],
  teoria: [1, 1, "Para repasar reglas; poco juego."],
  reloj: [2, 3, "La presión del tiempo engancha: «¿cuántas haces en 20 s?»."],
  ortodle: [3, 3, "El fenómeno Wordle: un reto corto, colores y la cuadrícula 🟩🟨 para compartir."],
  intercambia: [2, 3, "Como Waffle: pocos movimientos y la sensación de «ya casi» engancha."],
  superviv: [3, 3, "Vidas + récord + cada vez más rápido: el «una más» de los arcades."],
  lluvia: [3, 3, "Arcade puro: grabado en vídeo da un reel muy vistoso."],
  construye: [2, 2, "Montar con fichas y la sílaba trampa hacen pensar en la falta."],
  conexiones: [3, 3, "Como Connections del NYT: reto de inteligencia diario muy compartido."],
  sopa: [2, 3, "Pasatiempo de siempre con giro: buscas la forma correcta de una palabra mal escrita."],
  caja: [2, 3, "Escape room exprés: código, candados y cuenta atrás."],
  duo: [2, 2, "Formato Duolingo, con fichas trampa mal escritas."],
  rosco: [3, 3, "El rosco de Pasapalabra: todo el mundo lo conoce y quiere completarlo."],
  panal: [2, 3, "Como Spelling Bee: «solo una más» hasta encontrarlas todas."],
  memoria: [2, 3, "Memoria de toda la vida, pero cada pareja es una falta típica."],
  desliza: [2, 3, "El gesto de deslizar es rapidísimo y engancha como una app de citas."],
  carrera: [2, 3, "Rival que avanza solo: tensión y ganas de revancha."],
  raya: [2, 2, "Un juego de mesa conocido con la ortografía como llave."],
  diario: [3, 3, "Un reto al día, igual para todos, con racha: el truco de Wordle."],
};
const puntos = (n) => "●".repeat(n) + "○".repeat(3 - n);

// ------------------------------------------------------------ elegir el siguiente tipo
function siguienteTipo(ultimo, forzado) {
  if (forzado) return TIPO[forzado];
  const v = votos();
  let pool = TIPOS.filter((t) => v[t.id] !== -1 && t.id !== ultimo);
  if (!pool.length) pool = TIPOS.filter((t) => t.id !== ultimo);
  const peso = (t) => (v[t.id] > 0 ? PESO[v[t.id]] : 1);
  let r = Math.random() * pool.reduce((s, t) => s + peso(t), 0);
  for (const t of pool) { r -= peso(t); if (r <= 0) return t; }
  return pool[0];
}

// ------------------------------------------------------------ pantallas
let tab = "jugar";
// Si el móvil aún tiene un index.html viejo en caché, añadir la pestaña que falte.
{ const nav = document.querySelector(".tabs");
  for (const [id, n] of [["valorar", "Valorar"], ["fichas", "Fichas"], ["nota", "Nota"]]) if (nav && !nav.querySelector(`[data-tab="${id}"]`)) { const b = document.createElement("button"); b.dataset.tab = id; b.textContent = n; nav.appendChild(b); } }
document.querySelectorAll(".tabs button").forEach((b) => b.onclick = () => irA(b.dataset.tab));
function irA(t) {
  tab = t; ronda = null;
  document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === t));
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  t === "jugar" ? inicio() : t === "fichas" ? fichas() : t === "nota" ? pintarNota($main, { COMP, esc, empezar }) : valorar();
  scrollTo(0, 0);
}

function inicio() {
  const s = ls.get("stats", { n: 0, ok: 0, tipos: {}, dias: [] }); const v = votos();
  const hoy = s.hoyFecha === new Date().toISOString().slice(0, 10) ? s.hoy || 0 : 0;
  const nUp = Object.values(v).filter((x) => x > 0).length, nDown = Object.values(v).filter((x) => x === -1).length;
  $main.innerHTML = `
    <h2>Aprende ortografía jugando</h2>
    <p class="sub">Rondas de ${RONDA} ejercicios de ${TIPOS.length} tipos distintos. Si fallas, te explico la regla.</p>
    <button class="btn neg big" id="go">Jugar</button>
    <div class="stats">
      <div class="stat"><b>${hoy}</b><span>hoy</span></div>
      <div class="stat"><b>${s.n ? Math.round((100 * s.ok) / s.n) + "%" : "—"}</b><span>aciertos</span></div>
      <div class="stat"><b>${racha(s.dias || [])}</b><span>días seguidos</span></div>
    </div>
    <p class="sub">${nUp || nDown ? `Has valorado ${nUp + nDown} tipos: los 👍 (${nUp}) te salen más, y cuantas más ★ más, y los 👎 (${nDown}) ya no te salen.` : "Aún no has valorado ningún tipo de ejercicio: puedes hacerlo mientras juegas o en «Valorar»."}</p>
    <button class="btn" style="width:100%" id="val">👍 👎 Valorar los ${TIPOS.length} tipos de ejercicio</button>`;
  $main.querySelector("#go").onclick = () => empezar();
  $main.querySelector("#val").onclick = () => irA("valorar");
}

let ronda = null;
function empezar(forzado = null) {
  ronda = { n: 0, ok: 0, total: forzado ? 999 : RONDA, forzado, ultimo: null, hist: [], id: Math.random() };
  turno();
}

async function turno() {
  const R = ronda; if (!R) return;
  if (R.n >= R.total) return resumen();
  let t, res = null, cuerpo;
  for (let k = 0; k < 8 && !res; k++) {
    t = siguienteTipo(R.ultimo, R.forzado);
    $main.innerHTML = `
      <div class="barra"><button class="x" id="salir" aria-label="Salir">✕</button>${R.forzado ? `<div class="prog"></div><b>Probando · ${votos()[R.forzado] ? "valorado" : "sin valorar"}</b>` : `<div class="prog"><i style="width:${(100 * R.n) / R.total}%"></i></div><b>${R.n + 1}/${R.total}</b>`}</div>
      <div class="tipo">${t.e} ${esc(t.n)}</div>
      ${R.forzado ? `<div class="votar-ya"><span>¿Te gusta? Vota sin jugar:</span>${botonesVoto(t.id, votos()[t.id] || 0, true)}<button class="probar" id="saltatipo">Siguiente tipo →</button></div>` : ""}
      <div id="ej"></div><div id="fb"></div>`;
    $main.querySelector("#salir").onclick = () => irA(R.forzado ? "valorar" : "jugar");
    if (R.forzado) {
      // Votar nada más ver el ejercicio, sin resolverlo: pasa al siguiente tipo sin valorar.
      const vy = $main.querySelector(".votar-ya"), tid = t.id;
      enganchaVotos(vy, (acc, nuevo) => { if (nuevo !== 0) setTimeout(() => { if (ronda === R) irSinValorar(tid); }, 600); });
      vy.querySelector("#saltatipo").onclick = () => irSinValorar(tid);
    }
    cuerpo = $main.querySelector("#ej");
    compUsada = null;
    try { res = t.run(cuerpo); res = await res; } catch (e) { console.error(t.id, e); res = null; }
    if (ronda !== R) return; // salió a mitad
    if (!res && R.forzado) { $main.innerHTML = `<p>Este ejercicio no funciona en este navegador (necesita voz).</p>`; return; }
  }
  if (!res) return;
  R.racha = res.ok ? (R.racha || 0) + 1 : 0; R.mejor = Math.max(R.mejor || 0, R.racha);
  R.n++; if (res.ok) R.ok++; R.ultimo = t.id; R.hist.push([t.id, res.ok]);
  apuntar(t.id, res.ok);
  const v = votos()[t.id] || 0;
  const fb = $main.querySelector("#fb");
  fb.innerHTML = `<div class="fb">
      <h3 class="${res.ok ? "" : "mal"}">${res.ok ? pick(["¡Bien!", "¡Correcto!", "¡Eso es!", "¡Perfecto!"]) : "Casi…"}${R.racha >= 3 ? ` <span class="racha">🔥 ${R.racha} seguidas</span>` : ""}</h3>${res.html}
      <div class="mini"><span>¿Te gusta este tipo de ejercicio?</span>${botonesVoto(t.id, v, true)}</div>
      ${R.forzado
        ? `<div class="fila"><button class="btn" id="sig">Otro ejemplo</button><button class="btn neg" id="sigtipo">${sinVal() ? "Siguiente tipo sin valorar →" : "Volver a Valorar"}</button></div>`
        : `<button class="btn neg big" id="sig">${R.n >= R.total ? "Ver resultado" : "Siguiente"}</button>${sinVal() ? `<button class="btn" id="sigtipo" style="width:100%;margin-top:10px">Valorar un tipo que aún no has valorado →</button>` : ""}`}</div>`;
  // Votar mientras se prueba un tipo lleva solo al siguiente tipo sin valorar.
  enganchaVotos(fb, (acc, nuevo) => { if (R.forzado && nuevo !== 0) setTimeout(() => { if (ronda === R) irSinValorar(t.id); }, 700); });
  fb.querySelector("#sig").onclick = () => turno();
  const st = fb.querySelector("#sigtipo"); if (st) st.onclick = () => irSinValorar(t.id);
  function sinVal() { return TIPOS.find((x) => !votos()[x.id] && x.id !== t.id); }
  fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function irSinValorar(actual) {
  const n = TIPOS.find((x) => !votos()[x.id] && x.id !== actual);
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  if (n) { empezar(n.id); scrollTo(0, 0); toast(`Siguiente sin valorar: ${n.e} ${n.n}`); }
  else { filtro = "todos"; irA("valorar"); toast("¡Ya has valorado todos los tipos!"); }
}

function resumen() {
  const R = ronda;
  const porTipo = {};
  R.hist.forEach(([id, ok]) => { porTipo[id] = porTipo[id] || [0, 0]; porTipo[id][0]++; if (ok) porTipo[id][1]++; });
  $main.innerHTML = `
    <h2>${R.ok} de ${R.total}</h2>
    <p class="sub">${R.ok === R.total ? "¡Ronda perfecta!" : R.ok >= R.total * 0.7 ? "Muy bien. Sigue así." : "Cada fallo es una regla nueva aprendida."}</p>
    ${Object.entries(porTipo).map(([id, [n, ok]]) => `<div class="mini" style="color:#000"><span>${TIPO[id].e} ${esc(TIPO[id].n)} · ${ok}/${n}</span>${botonesVoto(id, votos()[id] || 0)}</div>`).join("")}
    <div class="fila" style="margin-top:18px"><button class="btn neg" id="otra">${R.forzado ? "Probar otra vez" : "Otra ronda"}</button><button class="btn" id="val">${R.forzado ? "Volver a Valorar" : "Valorar"}</button></div>`;
  enganchaVotos($main);
  $main.querySelector("#otra").onclick = () => empezar(R.forzado);
  $main.querySelector("#val").onclick = () => irA(R.forzado ? "valorar" : "valorar");
}

function botonesVoto(id, v, siempreEstrellas = false) {
  const t = TOT && TOT[id];
  const media = t && t.up ? `★${(t.est / t.up).toFixed(1).replace(".", ",")} · ` : "";
  return `<span class="votos" data-vt="${id}">
    <button class="voto ${v > 0 ? "on" : ""}" data-voto="up" aria-label="Me gusta">👍${t ? `<small>${t.up}</small>` : ""}</button><button class="voto ${v === -1 ? "on" : ""}" data-voto="down" aria-label="No me gusta">👎${t ? `<small>${t.down}</small>` : ""}</button>
    ${v > 0 || siempreEstrellas ? `<span class="estrellas" title="¿Cuánto te gusta?">${[1, 2, 3, 4, 5].map((n) => `<button data-voto="${n}" class="${n <= v ? "on" : ""}" aria-label="${n} estrellas">★</button>`).join("")}${t && t.up ? `<small>${media}${t.up}</small>` : ""}</span>` : ""}
  </span>`;
}
const TXT = { 1: "Te gusta un poco", 2: "Te gusta algo", 3: "Te gusta", 4: "Te gusta mucho", 5: "¡Te encanta! Te saldrá muchísimo" };
function enganchaVotos(root, despues) {
  root.querySelectorAll("[data-vt]").forEach((cont) => cont.querySelectorAll("[data-voto]").forEach((b) => b.onclick = () => {
    const id = cont.dataset.vt; const nuevo = votar(id, b.dataset.voto);
    root.querySelectorAll(`[data-vt="${id}"]`).forEach((x) => { x.outerHTML = botonesVoto(id, nuevo); });
    enganchaVotos(root, despues);
    toast(nuevo > 0 ? `${"★".repeat(nuevo)} ${TXT[nuevo]}${b.dataset.voto === "up" ? " · pon de 1 a 5 ★" : ""}` : nuevo === -1 ? "👎 Ya no te saldrá" : "Voto quitado");
    if (despues) despues(b.dataset.voto, nuevo);
  }));
}

// En «Sin valorar» se ven de uno en uno: votas y aparece el siguiente, sin
// buscar con scroll. Es lo que se abre por defecto mientras quede alguno.
let filtro = null; const saltados = [];
function valorar() {
  const v = votos(); const s = ls.get("stats", { tipos: {} });
  const sinValorar = TIPOS.filter((t) => !v[t.id]).sort((a, b) => saltados.indexOf(a.id) - saltados.indexOf(b.id));
  if (!filtro) filtro = sinValorar.length ? "sin" : "todos";
  const uno = filtro === "sin";
  const lista = uno ? sinValorar.slice(0, 1) : TIPOS.filter((t) => filtro === "todos" || (filtro === "up" && v[t.id] > 0) || (filtro === "down" && v[t.id] === -1));
  const n = (f) => TIPOS.filter(f).length;
  $main.innerHTML = `
    <h2>¿Qué ejercicios te gustan?</h2>
    <p class="sub">${TIPOS.length} tipos, sacados de Projet Voltaire, de cuentas de ortografía de Instagram de lo que ya teníamos en Orto y de juegos de palabras. «Viral» y «adictivo» son mi estimación, no un dato medido. Con 👍 eliges de 1 a 5 ★: cuantas más estrellas, más te sale al jugar. Los 👎 dejan de salir.</p>
    <div class="filtros">
      <button data-f="todos" class="${filtro === "todos" ? "on" : ""}">Todos ${TIPOS.length}</button>
      <button data-f="sin" class="${filtro === "sin" ? "on" : ""}">Sin valorar ${n((t) => !v[t.id])}</button>
      <button data-f="up" class="${filtro === "up" ? "on" : ""}">👍 ${n((t) => v[t.id] > 0)}</button>
      <button data-f="down" class="${filtro === "down" ? "on" : ""}">👎 ${n((t) => v[t.id] === -1)}</button>
    </div>
    ${uno && lista.length ? `<p class="quedan">Quedan <b>${sinValorar.length}</b> sin valorar. Toca 👎, 👍 (3 ★) o directamente las estrellas: pasa solo al siguiente.</p>` : ""}
    ${lista.map((t) => { const st = (s.tipos || {})[t.id]; return `<article class="tarjeta ${v[t.id] > 0 ? "like" : v[t.id] === -1 ? "dislike" : ""}">
      <h3><span>${t.e}</span>${esc(t.n)}</h3><div class="orig">${esc(t.orig)}</div>
      <p>${esc(t.desc)}</p><p class="ej">Ejemplo: ${esc(t.ej)}</p>${VA[t.id] ? `<p class="va"><span>🔥 Viral ${puntos(VA[t.id][0])}</span><span>🔁 Adictivo ${puntos(VA[t.id][1])}</span><br>${esc(VA[t.id][2])}</p>` : ""}
      <div class="pie"><button class="probar" data-probar="${t.id}">▶ Probar${st ? ` · ${st[1]}/${st[0]}` : ""}</button>${botonesVoto(t.id, v[t.id] || 0, uno)}</div>
      ${uno ? `<div class="fila" style="margin-top:12px"><button class="btn" id="saltar">Saltar</button></div>` : ""}
    </article>`; }).join("") || (uno ? `<div class="tarjeta like"><h3>¡Ya los has valorado todos! 🎉</h3><p>Puedes cambiar cualquier voto en «Todos».</p><button class="btn neg" id="vertodos">Ver todos</button></div>` : `<p class="sub">Nada por aquí.</p>`)}
    <p class="nota">Los votos se guardan en este móvil y en Supabase (tabla <code>ortografia10_votos</code>), junto con los de otros dispositivos; el número junto a 👍/👎 es el total de todos.</p>`;
  $main.querySelectorAll("[data-f]").forEach((b) => b.onclick = () => { filtro = b.dataset.f; valorar(); });
  $main.querySelectorAll("[data-probar]").forEach((b) => b.onclick = () => empezar(b.dataset.probar));
  const otra = (ms) => setTimeout(() => { if (tab === "valorar" && !ronda) { valorar(); scrollTo(0, 0); } }, ms);
  const salt = $main.querySelector("#saltar"), vt = $main.querySelector("#vertodos");
  if (salt) salt.onclick = () => { const id = lista[0].id; const i = saltados.indexOf(id); if (i >= 0) saltados.splice(i, 1); saltados.push(id); valorar(); };
  if (vt) vt.onclick = () => { filtro = "todos"; valorar(); };
  enganchaVotos($main, (accion, nuevo) => {
    if (!uno) return otra(350);
    otra(accion === "down" ? 450 : 600);
  });
}

// ------------------------------------------------------------ fichas
// Índice de fichas: una por competencia de Orto (regla, palabras que la
// cumplen, excepciones, errores típicos y truco) y una por grupo de
// palabras que se confunden (parejas de homófonos + ejemplos de frases).
let fBloque = "todas", fTexto = "";
function datosFichas() {
  if (datosFichas.c) return datosFichas.c;
  const porComp = {};
  D.P.forEach((p) => { (porComp[p[4]] = porComp[p[4]] || []).push(p); });
  const reglas = Object.entries(D.C).filter(([, c]) => c[1]).map(([id, c]) => {
    const pals = porComp[id] || [];
    const ej = [...new Set([...(c[3] || []), ...pals.slice(0, 14).map((p) => p[0])])].slice(0, 14);
    const errores = pals.filter((p) => p[1] && p[1][0]).slice(0, 6).map((p) => [p[1][0], p[0]]);
    return { id, tipo: "regla", b: c[5], titulo: c[0], regla: c[1], truco: c[2], ej, exc: c[4] || [], errores, curso: D.CU[c[6]] || "" };
  });
  const vistos = new Set();
  const conf = [];
  for (const m of MAN.parejas) {
    const clave = m.pares.map((p) => p[0].toLowerCase()).sort().join("|");
    if (vistos.has(clave)) continue; vistos.add(clave);
    const pal = m.pares.map((p) => p[0].toLowerCase());
    const frases = D.M.filter((x) => x.t === "hueco" && x.o && x.o.some((o) => pal.includes(o.toLowerCase())) && x.o.every((o) => pal.includes(o.toLowerCase()))).slice(0, 3)
      .map((x) => x.q.replace("___", `«${x.o[x.a]}»`));
    conf.push({ id: "c" + conf.length, tipo: "conf", b: "CONF", titulo: m.pares.map((p) => p[0]).join(" / "), pares: m.pares, frases, regla: COMP(m.c)[1] });
  }
  conf.push({ id: "dosvalen", tipo: "dos", b: "CONF", titulo: "¿Las dos valen? Parejas con dos formas (o solo una)", lista: DOSVALEN });
  return (datosFichas.c = [...conf, ...reglas]);
}
function fichaHTML(f) {
  if (f.tipo === "conf") return `<details class="ficha"><summary><span class="fb-b">👂 Se confunden</span>${esc(f.titulo)}</summary>
    <ul>${f.pares.map((p) => `<li><b>${esc(p[0])}</b>: ${esc(p[1])}</li>`).join("")}</ul>
    ${f.frases.length ? `<p class="lab">Ejemplos</p><ul>${f.frases.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
    ${f.regla ? `<p class="lab">Regla</p><p>${esc(f.regla)}</p>` : ""}</details>`;
  if (f.tipo === "dos") return `<details class="ficha"><summary><span class="fb-b">⚖️ Se confunden</span>${esc(f.titulo)}</summary>
    <ul>${f.lista.map(([a, b, r, x]) => `<li><b>${esc(a)}</b> / <b>${esc(b)}</b>: ${r === 2 ? "valen las dos" : `solo «${esc(r === 0 ? a : b)}»`}. ${esc(x)}</li>`).join("")}</ul></details>`;
  const B = D.B[f.b] || ["", ""];
  return `<details class="ficha"><summary><span class="fb-b">${B[1]} ${esc(B[0])}${f.curso ? ` · ${esc(f.curso)}` : ""}</span>${esc(f.titulo)}</summary>
    <p class="lab">Regla</p><p>${esc(f.regla)}</p>
    ${f.ej.length ? `<p class="lab">✓ Palabras que la cumplen</p><p>${f.ej.map(esc).join(" · ")}</p>` : ""}
    <p class="lab">✗ Excepciones y palabras que no la siguen</p><p>${f.exc.length ? f.exc.map(esc).join("<br>") : "No tiene excepciones importantes."}</p>
    ${f.errores.length ? `<p class="lab">⚠️ Errores típicos</p><p>${f.errores.map(([m, b]) => `<s>${esc(m)}</s> → <b>${esc(b)}</b>`).join(" · ")}</p>` : ""}
    ${f.truco ? `<p class="lab">💡 Truco</p><p>${esc(f.truco)}</p>` : ""}</details>`;
}
function fichas() {
  const todas = datosFichas();
  const bloques = [["todas", "Todas"], ["CONF", "👂 Se confunden"], ...Object.entries(D.B).map(([id, [n, e]]) => [id, `${e} ${n}`])];
  $main.innerHTML = `<h2>Fichas de ortografía</h2>
    <p class="sub">${todas.length} fichas: cada regla con las palabras que la cumplen, las que no y los errores típicos, y las palabras que más se confunden. Toca una para abrirla.</p>
    <input class="esc buscar" id="q" placeholder="Buscar: mb, hiato, porque, haber…" value="${esc(fTexto)}">
    <div class="filtros">${bloques.map(([id, n]) => `<button data-b="${id}" class="${fBloque === id ? "on" : ""}">${esc(n)}</button>`).join("")}</div>
    <div id="lista"></div>`;
  const pinta = () => {
    const q = norm(quitarTildes(fTexto));
    const l = todas.filter((f) => (fBloque === "todas" || f.b === fBloque) && (!q || norm(quitarTildes(JSON.stringify(f))).includes(q)));
    $main.querySelector("#lista").innerHTML = l.map(fichaHTML).join("") || `<p class="sub">No hay fichas con eso.</p>`;
  };
  $main.querySelector("#q").oninput = (e) => { fTexto = e.target.value; pinta(); };
  $main.querySelectorAll("[data-b]").forEach((b) => b.onclick = () => { fBloque = b.dataset.b; fichas(); });
  pinta();
}

// ------------------------------------------------------------ arranque
$main.innerHTML = `<p class="sub">Cargando ejercicios…</p>`;
cargar().then(() => {
  sembrarNota();
  inicio();
  vaciarCola();
  cargarTotales().then(() => { if (tab === "valorar" && !ronda) valorar(); });
}).catch((e) => { $main.innerHTML = `<p>No se han podido cargar los ejercicios. ${esc(e.message)}</p>`; });
window.__o10 = { TIPOS, empezar, irA };
