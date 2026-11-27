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

const CFG = window.ORTOGRAFIA10_CONFIG;
const $main = document.getElementById("main");
const RONDA = 10;

// ------------------------------------------------------------ utilidades
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];
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
const P = (i) => ({ w: D.P[i][0], alts: D.P[i][1], g: D.P[i][2], op: D.P[i][3], c: D.P[i][4], d: D.P[i][5] });
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
      const t = (TOT[v.tipo] = TOT[v.tipo] || { up: 0, down: 0 });
      v.valor > 0 ? t.up++ : t.down++;
    }
  } catch {}
}

// ------------------------------------------------------------ votos y estadísticas locales
const votos = () => ls.get("votos", {});
function votar(tipo, valor) {
  const v = votos(); const nuevo = v[tipo] === valor ? 0 : valor;
  if (nuevo) v[tipo] = nuevo; else delete v[tipo];
  ls.set("votos", v);
  encolar("votos", { tipo, valor: nuevo, dispositivo: DISP });
  if (TOT) {
    TOT[tipo] = TOT[tipo] || { up: 0, down: 0 };
  }
  return nuevo;
}
function apuntar(tipo, ok) {
  const s = ls.get("stats", { n: 0, ok: 0, tipos: {}, dias: [] });
  s.n++; if (ok) s.ok++;
  const t = (s.tipos[tipo] = s.tipos[tipo] || [0, 0]); t[0]++; if (ok) t[1]++;
  const hoy = new Date().toISOString().slice(0, 10);
  if (!s.dias.includes(hoy)) s.dias.push(hoy);
  s.hoy = s.hoyFecha === hoy ? (s.hoy || 0) + 1 : 1; s.hoyFecha = hoy;
  ls.set("stats", s);
  encolar("respuestas", { tipo, acierto: ok, dispositivo: DISP });
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
const reglaDe = (c) => { const [n, r, t] = COMP(c); return r ? `<div class="regla"><b>${esc(n)}</b>${esc(r)}${t ? `<br><i>Truco: ${esc(t)}</i>` : ""}</div>` : ""; };
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
      const p = palAzar((p) => p.c.startsWith("ACE.") && p.c !== "ACE.MENTE" && silabear(p.w).length >= 2 && analizar(p.w).coherente);
      const a = analizar(p.w); const L = ["aguda", "llana", "esdrújula"]; const k = Math.min(L.indexOf(a.tipo) < 0 ? 2 : L.indexOf(a.tipo), 2);
      el.innerHTML = `<p class="enun">¿Qué tipo de palabra es?</p><div class="palabra">${esc(p.w)}</div><div id="z"></div>`;
      const ok = await opciones(el.querySelector("#z"), ["Aguda", "Llana", "Esdrújula"], k);
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

// ------------------------------------------------------------ elegir el siguiente tipo
function siguienteTipo(ultimo, forzado) {
  if (forzado) return TIPO[forzado];
  const v = votos();
  let pool = TIPOS.filter((t) => v[t.id] !== -1 && t.id !== ultimo);
  if (!pool.length) pool = TIPOS.filter((t) => t.id !== ultimo);
  const peso = (t) => (v[t.id] === 1 ? 3 : 1);
  let r = Math.random() * pool.reduce((s, t) => s + peso(t), 0);
  for (const t of pool) { r -= peso(t); if (r <= 0) return t; }
  return pool[0];
}

// ------------------------------------------------------------ pantallas
let tab = "jugar";
document.querySelectorAll(".tabs button").forEach((b) => b.onclick = () => irA(b.dataset.tab));
function irA(t) {
  tab = t; ronda = null;
  document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === t));
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  t === "jugar" ? inicio() : valorar();
  scrollTo(0, 0);
}

function inicio() {
  const s = ls.get("stats", { n: 0, ok: 0, tipos: {}, dias: [] }); const v = votos();
  const hoy = s.hoyFecha === new Date().toISOString().slice(0, 10) ? s.hoy || 0 : 0;
  const nUp = Object.values(v).filter((x) => x === 1).length, nDown = Object.values(v).filter((x) => x === -1).length;
  $main.innerHTML = `
    <h2>Aprende ortografía jugando</h2>
    <p class="sub">Rondas de ${RONDA} ejercicios de ${TIPOS.length} tipos distintos. Si fallas, te explico la regla.</p>
    <button class="btn neg big" id="go">Jugar</button>
    <div class="stats">
      <div class="stat"><b>${hoy}</b><span>hoy</span></div>
      <div class="stat"><b>${s.n ? Math.round((100 * s.ok) / s.n) + "%" : "—"}</b><span>aciertos</span></div>
      <div class="stat"><b>${racha(s.dias || [])}</b><span>días seguidos</span></div>
    </div>
    <p class="sub">${nUp || nDown ? `Has valorado ${nUp + nDown} tipos: los 👍 (${nUp}) te salen más y los 👎 (${nDown}) ya no te salen.` : "Aún no has valorado ningún tipo de ejercicio: puedes hacerlo mientras juegas o en «Valorar»."}</p>
    <button class="btn" style="width:100%" id="val">👍 👎 Valorar los ${TIPOS.length} tipos de ejercicio</button>`;
  $main.querySelector("#go").onclick = () => empezar();
  $main.querySelector("#val").onclick = () => irA("valorar");
}

let ronda = null;
function empezar(forzado = null) {
  ronda = { n: 0, ok: 0, total: forzado ? 3 : RONDA, forzado, ultimo: null, hist: [], id: Math.random() };
  turno();
}

async function turno() {
  const R = ronda; if (!R) return;
  if (R.n >= R.total) return resumen();
  let t, res = null, cuerpo;
  for (let k = 0; k < 8 && !res; k++) {
    t = siguienteTipo(R.ultimo, R.forzado);
    $main.innerHTML = `
      <div class="barra"><button class="x" id="salir" aria-label="Salir">✕</button><div class="prog"><i style="width:${(100 * R.n) / R.total}%"></i></div><b>${R.n + 1}/${R.total}</b></div>
      <div class="tipo">${t.e} ${esc(t.n)}</div><div id="ej"></div><div id="fb"></div>`;
    $main.querySelector("#salir").onclick = () => irA(R.forzado ? "valorar" : "jugar");
    cuerpo = $main.querySelector("#ej");
    try { res = t.run(cuerpo); res = await res; } catch (e) { console.error(t.id, e); res = null; }
    if (ronda !== R) return; // salió a mitad
    if (!res && R.forzado) { $main.innerHTML = `<p>Este ejercicio no funciona en este navegador (necesita voz).</p>`; return; }
  }
  if (!res) return;
  R.n++; if (res.ok) R.ok++; R.ultimo = t.id; R.hist.push([t.id, res.ok]);
  apuntar(t.id, res.ok);
  const v = votos()[t.id] || 0;
  const fb = $main.querySelector("#fb");
  fb.innerHTML = `<div class="fb">
      <h3 class="${res.ok ? "" : "mal"}">${res.ok ? pick(["¡Bien!", "¡Correcto!", "¡Eso es!", "¡Perfecto!"]) : "Casi…"}</h3>${res.html}
      <div class="mini"><span>¿Te gusta este tipo de ejercicio?</span><span class="votos">${botonesVoto(t.id, v)}</span></div>
      <button class="btn neg big" id="sig">${R.n >= R.total ? "Ver resultado" : "Siguiente"}</button></div>`;
  enganchaVotos(fb);
  const sig = fb.querySelector("#sig"); sig.onclick = () => turno();
  fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function resumen() {
  const R = ronda;
  const porTipo = {};
  R.hist.forEach(([id, ok]) => { porTipo[id] = porTipo[id] || [0, 0]; porTipo[id][0]++; if (ok) porTipo[id][1]++; });
  $main.innerHTML = `
    <h2>${R.ok} de ${R.total}</h2>
    <p class="sub">${R.ok === R.total ? "¡Ronda perfecta!" : R.ok >= R.total * 0.7 ? "Muy bien. Sigue así." : "Cada fallo es una regla nueva aprendida."}</p>
    ${Object.entries(porTipo).map(([id, [n, ok]]) => `<div class="mini" style="color:#000"><span>${TIPO[id].e} ${esc(TIPO[id].n)} · ${ok}/${n}</span><span class="votos">${botonesVoto(id, votos()[id] || 0)}</span></div>`).join("")}
    <div class="fila" style="margin-top:18px"><button class="btn neg" id="otra">${R.forzado ? "Probar otra vez" : "Otra ronda"}</button><button class="btn" id="val">${R.forzado ? "Volver a Valorar" : "Valorar"}</button></div>`;
  enganchaVotos($main);
  $main.querySelector("#otra").onclick = () => empezar(R.forzado);
  $main.querySelector("#val").onclick = () => irA(R.forzado ? "valorar" : "valorar");
}

function botonesVoto(id, v) {
  const t = TOT && TOT[id];
  return `<button class="voto ${v === 1 ? "on" : ""}" data-voto="1" data-tipo="${id}" aria-label="Me gusta">👍${t ? `<small>${t.up}</small>` : ""}</button><button class="voto ${v === -1 ? "on" : ""}" data-voto="-1" data-tipo="${id}" aria-label="No me gusta">👎${t ? `<small>${t.down}</small>` : ""}</button>`;
}
function enganchaVotos(root, despues) {
  root.querySelectorAll("[data-voto]").forEach((b) => b.onclick = () => {
    const id = b.dataset.tipo, val = +b.dataset.voto; const antes = votos()[id] || 0;
    const nuevo = votar(id, val);
    if (TOT) { const t = (TOT[id] = TOT[id] || { up: 0, down: 0 }); if (antes === 1) t.up--; if (antes === -1) t.down--; if (nuevo === 1) t.up++; if (nuevo === -1) t.down++; }
    root.querySelectorAll(`[data-tipo="${id}"]`).forEach((x) => {
      x.classList.toggle("on", +x.dataset.voto === nuevo);
      const sm = x.querySelector("small"); if (sm && TOT) sm.textContent = +x.dataset.voto === 1 ? TOT[id].up : TOT[id].down;
    });
    toast(nuevo === 1 ? "👍 Te saldrá más a menudo" : nuevo === -1 ? "👎 Ya no te saldrá" : "Voto quitado");
    if (despues) despues();
  });
}

let filtro = "todos";
function valorar() {
  const v = votos(); const s = ls.get("stats", { tipos: {} });
  const lista = TIPOS.filter((t) => filtro === "todos" || (filtro === "up" && v[t.id] === 1) || (filtro === "down" && v[t.id] === -1) || (filtro === "sin" && !v[t.id]));
  const n = (f) => TIPOS.filter(f).length;
  $main.innerHTML = `
    <h2>¿Qué ejercicios te gustan?</h2>
    <p class="sub">${TIPOS.length} tipos, sacados de Projet Voltaire, de cuentas de ortografía de Instagram y de lo que ya teníamos en Orto. Los 👍 te saldrán más al jugar y los 👎 dejarán de salir.</p>
    <div class="filtros">
      <button data-f="todos" class="${filtro === "todos" ? "on" : ""}">Todos ${TIPOS.length}</button>
      <button data-f="sin" class="${filtro === "sin" ? "on" : ""}">Sin valorar ${n((t) => !v[t.id])}</button>
      <button data-f="up" class="${filtro === "up" ? "on" : ""}">👍 ${n((t) => v[t.id] === 1)}</button>
      <button data-f="down" class="${filtro === "down" ? "on" : ""}">👎 ${n((t) => v[t.id] === -1)}</button>
    </div>
    ${lista.map((t) => { const st = (s.tipos || {})[t.id]; return `<article class="tarjeta ${v[t.id] === 1 ? "like" : v[t.id] === -1 ? "dislike" : ""}">
      <h3><span>${t.e}</span>${esc(t.n)}</h3><div class="orig">${esc(t.orig)}</div>
      <p>${esc(t.desc)}</p><p class="ej">Ejemplo: ${esc(t.ej)}</p>
      <div class="pie"><button class="probar" data-probar="${t.id}">▶ Probar${st ? ` · ${st[1]}/${st[0]}` : ""}</button><span class="votos">${botonesVoto(t.id, v[t.id] || 0)}</span></div>
    </article>`; }).join("") || `<p class="sub">Nada por aquí.</p>`}
    <p class="nota">Los votos se guardan en este móvil y en Supabase (tabla <code>ortografia10_votos</code>), junto con los de otros dispositivos; el número junto a 👍/👎 es el total de todos.</p>`;
  $main.querySelectorAll("[data-f]").forEach((b) => b.onclick = () => { filtro = b.dataset.f; valorar(); });
  $main.querySelectorAll("[data-probar]").forEach((b) => b.onclick = () => empezar(b.dataset.probar));
  enganchaVotos($main, () => setTimeout(() => { if (tab === "valorar" && !ronda) valorar(); }, 350));
}

// ------------------------------------------------------------ arranque
$main.innerHTML = `<p class="sub">Cargando ejercicios…</p>`;
cargar().then(() => {
  inicio();
  vaciarCola();
  cargarTotales().then(() => { if (tab === "valorar" && !ronda) valorar(); });
}).catch((e) => { $main.innerHTML = `<p>No se han podido cargar los ejercicios. ${esc(e.message)}</p>`; });
window.__o10 = { TIPOS, empezar, irA };
