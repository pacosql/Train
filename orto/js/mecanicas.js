// Orto — las mecánicas de ejercicio. Cada una pinta el ejercicio en `el` y
// devuelve una promesa con {correcto, respuesta, palabra, solucion}. Marcan
// en verde lo correcto y en rojo lo elegido si está mal; la explicación la
// pone app.js debajo.
import { quitarTildes, indiceTilde, vocalesTildables, silabear } from "./silabas.js";
import { barajar, azar } from "./banco.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = (s, el) => el.querySelector(s);
const $$ = (s, el) => [...el.querySelectorAll(s)];

// ---------------------------------------------------------------- voz
let vozES = null;
function elegirVoz() {
  try {
    const vs = speechSynthesis.getVoices();
    vozES = vs.find((v) => v.lang === "es-ES") || vs.find((v) => v.lang?.startsWith("es")) || null;
  } catch {}
}
if (typeof speechSynthesis !== "undefined") { elegirVoz(); speechSynthesis.onvoiceschanged = elegirVoz; }
export function hablar(t, rate = 0.85) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "es-ES"; u.rate = rate; if (vozES) u.voice = vozES;
    speechSynthesis.speak(u);
  } catch {}
}

// Botones de opciones con respuesta al tocar.
function opciones(el, lista, correcta, { vertical = false, etiqueta = (x) => x } = {}) {
  return new Promise((ok) => {
    const cont = document.createElement("div");
    cont.className = "ops" + (vertical ? " vertical" : "") + (lista.some((x) => String(etiqueta(x)).length > 14) ? " largas" : "");
    if (window.ORTO_DEBUG) cont.dataset.sol = lista.indexOf(correcta);
    cont.innerHTML = lista.map((o, i) => `<button class="op" data-i="${i}">${esc(etiqueta(o))}</button>`).join("");
    el.appendChild(cont);
    $$(".op", cont).forEach((b) => (b.onclick = () => {
      const o = lista[+b.dataset.i];
      $$(".op", cont).forEach((x) => { x.disabled = true; if (lista[+x.dataset.i] === correcta) x.classList.add("bien"); });
      if (o !== correcta) b.classList.add("mal");
      ok({ correcto: o === correcta, respuesta: String(o), elegido: o });
    }));
  });
}

const titulo = (t) => `<div class="consigna">${t}</div>`;

// ---------------------------------------------------------------- elige
export async function elige(el, it) {
  const correcta = it.k === "palabra" ? it.w : it.o[it.a];
  const lista = it.k === "palabra" ? barajar([it.w, ...it.alts.slice(0, 3)]) : barajar(it.o);
  const q = it.q || "";
  el.innerHTML = titulo(q ? esc(q).replace("…", "<b>…</b>") : "¿Cómo se escribe?");
  const r = await opciones(el, lista, correcta);
  return { ...r, palabra: it.w || correcta, solucion: correcta };
}

// ---------------------------------------------------------------- letra
export async function letra(el, it) {
  const [i, j] = it.g;
  const hueco = `<span class="hueco" id="h">?</span>`;
  el.innerHTML = titulo("¿Qué letra falta?") + `<div class="palabra grande">${esc(it.w.slice(0, i))}${hueco}${esc(it.w.slice(j))}</div>`;
  const correcta = it.op[0];
  const r = await opciones(el, barajar(it.op), correcta, { etiqueta: (x) => (x === "" ? "(nada)" : x) });
  const h = $("#h", el);
  h.textContent = correcta || "·"; h.classList.add(r.correcto ? "bien" : "mal");
  return { ...r, palabra: it.w, solucion: it.w, respuesta: it.w.slice(0, i) + r.elegido + it.w.slice(j) };
}

// ---------------------------------------------------------------- tilde
// La palabra sin tildes; se toca la vocal que la lleva o "No lleva tilde".
export function tilde(el, it) {
  return new Promise((ok) => {
    const w = it.w, base = quitarTildes(w), buena = indiceTilde(w);
    const tild = new Set(vocalesTildables(base));
    el.innerHTML = titulo("Toca la vocal que lleva tilde") +
      `<div class="palabra grande letras">${[...base].map((ch, k) => tild.has(k) ? `<button class="vocal" data-k="${k}">${esc(ch)}</button>` : `<span>${esc(ch)}</span>`).join("")}</div>
       <div class="ops"><button class="op ancha" id="sin">No lleva tilde</button></div>`;
    if (window.ORTO_DEBUG) el.dataset.sol = buena;
    const fin = (k) => {
      $$(".vocal", el).forEach((b) => (b.disabled = true)); $("#sin", el).disabled = true;
      const correcto = k === buena;
      // Muestra la palabra bien escrita.
      $(".palabra", el).innerHTML = [...w].map((ch, i) => `<span class="${i === buena ? "bien" : ""}">${esc(ch)}</span>`).join("");
      if (!correcto && k >= 0) $(".palabra", el).insertAdjacentHTML("afterend", `<div class="small centro bad">Tocaste la «${esc(base[k])}» (${esc(base.slice(0, k) + ({ a: "á", e: "é", i: "í", o: "ó", u: "ú" }[base[k].toLowerCase()] || base[k]) + base.slice(k + 1))})</div>`);
      if (buena === -1) $("#sin", el).classList.add("bien"); else if (k === -1) $("#sin", el).classList.add("mal");
      const resp = k === -1 ? base : base.slice(0, k) + ({ a: "á", e: "é", i: "í", o: "ó", u: "ú" }[base[k]] || base[k]) + base.slice(k + 1);
      ok({ correcto, respuesta: resp, palabra: w, solucion: w });
    };
    $$(".vocal", el).forEach((b) => (b.onclick = () => fin(+b.dataset.k)));
    $("#sin", el).onclick = () => fin(-1);
  });
}

// ---------------------------------------------------------------- hueco
export async function hueco(el, it) {
  const [a, b] = it.q.split("___");
  el.innerHTML = (it.fuente === "prensa" ? `<div class="etq">📰 Frase real de prensa</div>` : "") +
    `<div class="frase">${esc(a)}<span class="hueco" id="h">&nbsp;?&nbsp;</span>${esc(b)}</div>`;
  const correcta = it.o[it.a];
  const r = await opciones(el, barajar(it.o), correcta);
  const h = $("#h", el); h.textContent = correcta; h.classList.add(r.correcto ? "bien" : "mal");
  return { ...r, palabra: it.w || correcta, solucion: it.q.replace("___", correcta) };
}

// ---------------------------------------------------------------- frase
export async function frase(el, it) {
  el.innerHTML = titulo(esc(it.q || "¿Cuál está bien escrita?"));
  const correcta = it.o[it.a];
  const r = await opciones(el, barajar(it.o), correcta, { vertical: true });
  return { ...r, palabra: null, solucion: correcta };
}

// ---------------------------------------------------------------- caza
// Frase con (casi siempre) una falta: tocar la palabra mal escrita.
const RE_PAL = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:\s[a-záéíóúüñ]+)?/g;
export function caza(el, it, banco) {
  return new Promise((ok) => {
    let texto, mal, bien;
    if (it.k === "palabra") {
      const f = banco.frase(it);
      const conFalta = Math.random() < 0.85;
      const re = new RegExp(`(^|[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ])${it.w}(?![A-Za-zÁÉÍÓÚÜÑáéíóúüñ])`);
      mal = conFalta ? azar(it.alts) : null; bien = conFalta ? it.w : null;
      texto = conFalta ? f.replace(re, (m, p) => p + mal) : f;
    } else { texto = it.q; mal = it.mal; bien = it.bien; }
    // Tokens: palabras sueltas; si la falta son dos palabras ("a veces"), se juntan.
    const partes = [];
    let resto = texto;
    const malesc = mal && mal.includes(" ") ? mal : null;
    if (malesc) { const k = texto.indexOf(malesc); partes.push(...trocear(texto.slice(0, k)), { w: malesc, falta: true }, ...trocear(texto.slice(k + malesc.length))); }
    else partes.push(...trocear(resto));
    let marcada = false;
    partes.forEach((p) => { if (p.w && mal && p.w === mal && !marcada) { p.falta = true; marcada = true; } });
    if (mal && !partes.some((p) => p.falta)) { mal = null; bien = null; } // no debería pasar
    el.innerHTML = (it.k === "palabra" ? `<div class="etq">📰 Frase real de prensa</div>` : "") + titulo("Toca la palabra mal escrita") +
      `<div class="frase caza">${partes.map((p, i) => (p.w ? `<button class="tok" data-i="${i}">${esc(p.w)}</button>` : esc(p.t))).join("")}</div>
       <div class="ops"><button class="op ancha" id="nada">No hay ninguna falta</button></div>`;
    if (window.ORTO_DEBUG) el.dataset.sol = partes.findIndex((p) => p.falta);
    const fin = (i) => {
      $$(".tok", el).forEach((b) => (b.disabled = true)); $("#nada", el).disabled = true;
      const correcto = i === -1 ? !mal : !!partes[i]?.falta;
      $$(".tok", el).forEach((b) => { const p = partes[+b.dataset.i]; if (p.falta) { b.classList.add("bien"); b.innerHTML = `<s>${esc(mal)}</s> ${esc(bien)}`; } });
      if (i >= 0 && !partes[i].falta) $(`.tok[data-i="${i}"]`, el).classList.add("mal");
      if (i === -1) $("#nada", el).classList.add(correcto ? "bien" : "mal");
      else if (!mal) $("#nada", el).classList.add("bien");
      ok({ correcto, respuesta: i === -1 ? "(sin faltas)" : partes[i].w, palabra: bien || it.w || null, solucion: bien ? `${mal} → ${bien}` : "No había ninguna falta", sinFalta: !mal });
    };
    $$(".tok", el).forEach((b) => (b.onclick = () => fin(+b.dataset.i)));
    $("#nada", el).onclick = () => fin(-1);
  });
}
function trocear(s) {
  const out = [];
  let k = 0;
  for (const m of s.matchAll(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g)) {
    if (m.index > k) out.push({ t: s.slice(k, m.index) });
    out.push({ w: m[0] });
    k = m.index + m[0].length;
  }
  if (k < s.length) out.push({ t: s.slice(k) });
  return out;
}

// ---------------------------------------------------------------- dictado
export function dictado(el, it, banco) {
  return new Promise((ok) => {
    const f = banco.frase(it);
    el.innerHTML = titulo("Escucha y escribe la palabra") +
      `<div class="row centro"><button class="oir" id="oir">🔊 Palabra</button>${f ? `<button class="oir" id="oirf">🔊 En una frase</button>` : ""}</div>
       <input id="resp" class="dict" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Escribe aquí" />
       <div class="teclas">${["á", "é", "í", "ó", "ú", "ü", "ñ"].map((t) => `<button class="tecla">${t}</button>`).join("")}</div>
       <button class="primary grande" id="ok">Comprobar</button><div id="dif"></div>`;
    const inp = $("#resp", el);
    if (window.ORTO_DEBUG) el.dataset.sol = it.w;
    $("#oir", el).onclick = () => hablar(it.w, 0.8);
    if (f) $("#oirf", el).onclick = () => hablar(f, 0.95);
    $$(".tecla", el).forEach((b) => (b.onclick = () => { const p = inp.selectionStart ?? inp.value.length; inp.value = inp.value.slice(0, p) + b.textContent + inp.value.slice(p); inp.focus(); inp.setSelectionRange(p + 1, p + 1); }));
    setTimeout(() => hablar(it.w, 0.8), 300);
    const fin = () => {
      const v = inp.value.trim().toLowerCase();
      if (!v) return inp.focus();
      inp.disabled = true; $("#ok", el).remove(); $$(".tecla", el).forEach((b) => (b.disabled = true));
      const correcto = v === it.w;
      inp.classList.add(correcto ? "bien" : "mal");
      if (!correcto) $("#dif", el).innerHTML = `<div class="palabra">${diferencias(v, it.w)}</div>`;
      ok({ correcto, respuesta: v, palabra: it.w, solucion: it.w });
    };
    $("#ok", el).onclick = fin;
    inp.onkeydown = (e) => { if (e.key === "Enter") fin(); };
  });
}
// Marca en la palabra correcta lo que falló (alineación sencilla).
function diferencias(mal, bien) {
  const n = mal.length, m = bien.length;
  const D = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (mal[i - 1] === bien[j - 1] ? 0 : 1));
  const marca = new Array(m).fill(false);
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && D[i][j] === D[i - 1][j - 1] + (mal[i - 1] === bien[j - 1] ? 0 : 1)) { if (mal[i - 1] !== bien[j - 1]) marca[j - 1] = true; i--; j--; }
    else if (j > 0 && D[i][j] === D[i][j - 1] + 1) { marca[j - 1] = true; j--; }
    else { if (j < m) marca[j] = true; else if (j > 0) marca[j - 1] = true; i--; }
  }
  return `Escribiste <s>${esc(mal)}</s> · Es ${[...bien].map((c, k) => (marca[k] ? `<b class="rojo">${esc(c)}</b>` : esc(c))).join("")}`;
}

// ---------------------------------------------------------------- sílabas
export async function silabas(el, it) {
  const buena = it.sil.join("-");
  const malas = new Set();
  const letras = it.sil.join("");
  const cortes = []; let p = 0; it.sil.slice(0, -1).forEach((s) => { p += s.length; cortes.push(p); });
  const desde = (cs) => { const out = []; let k = 0; for (const c of [...cs, letras.length]) { out.push(letras.slice(k, c)); k = c; } return out.join("-"); };
  for (let k = 0; k < 40 && malas.size < 3; k++) {
    const cs = cortes.slice();
    const r = Math.random();
    if (r < 0.5 && cs.length) { const i = Math.floor(Math.random() * cs.length); cs[i] += Math.random() < 0.5 ? -1 : 1; }
    else if (r < 0.75 && cs.length) cs.splice(Math.floor(Math.random() * cs.length), 1);
    else { const c = 1 + Math.floor(Math.random() * (letras.length - 1)); if (!cs.includes(c)) cs.push(c); cs.sort((a, b) => a - b); }
    if (cs.some((c, i) => c <= 0 || c >= letras.length || (i && c <= cs[i - 1]))) continue;
    const v = desde(cs);
    if (v !== buena) malas.add(v);
  }
  el.innerHTML = titulo(`¿Cómo se separa en sílabas «${esc(it.w)}»?`);
  const r = await opciones(el, barajar([buena, ...malas]), buena);
  return { ...r, palabra: it.w, solucion: buena };
}

// ---------------------------------------------------------------- tónica
export function tonica(el, it) {
  return new Promise((ok) => {
    if (window.ORTO_DEBUG) el.dataset.sol = it.ton;
    el.innerHTML = titulo("Toca la sílaba que suena más fuerte") +
      `<div class="silabas">${it.sil.map((s, i) => `<button class="sil" data-i="${i}">${esc(s)}</button>`).join("")}</div>`;
    $$(".sil", el).forEach((b) => (b.onclick = () => {
      const i = +b.dataset.i;
      $$(".sil", el).forEach((x) => { x.disabled = true; if (+x.dataset.i === it.ton) x.classList.add("bien"); });
      if (i !== it.ton) b.classList.add("mal");
      ok({ correcto: i === it.ton, respuesta: it.sil[i], palabra: it.w, solucion: it.sil[it.ton] });
    }));
  });
}

// ---------------------------------------------------------------- clasificar
export async function clasifica(el, it) {
  el.innerHTML = titulo("¿Qué tipo de palabra es?") + `<div class="palabra grande">${esc(it.w)}</div>`;
  const r = await opciones(el, ["aguda", "llana", "esdrújula", "sobresdrújula"], it.tipo);
  return { ...r, palabra: it.w, solucion: it.tipo };
}

// ---------------------------------------------------------------- diptongo
export async function diptongo(el, it) {
  const sil = silabear(it.w).join("");
  const k = sil.toLowerCase().indexOf(it.grupo.toLowerCase());
  const pal = k >= 0 ? `${esc(sil.slice(0, k))}<u>${esc(sil.slice(k, k + it.grupo.length))}</u>${esc(sil.slice(k + it.grupo.length))}` : esc(it.w);
  el.innerHTML = titulo(`En esta palabra, las vocales subrayadas forman…`) + `<div class="palabra grande">${pal}</div>`;
  const r = await opciones(el, ["diptongo", "hiato", "triptongo"], it.clase);
  return { ...r, palabra: it.w, solucion: it.clase };
}

// ---------------------------------------------------------------- parejas
export function parejas(el, it) {
  return new Promise((ok) => {
    const pares = it.pares;
    const izq = barajar(pares.map((p, i) => ({ t: p[0], i })));
    const der = barajar(pares.map((p, i) => ({ t: p[1], i })));
    el.innerHTML = titulo("Une cada palabra con lo que significa") +
      `<div class="parejas"><div>${izq.map((x) => `<button class="pz" data-i="${x.i}">${esc(x.t)}</button>`).join("")}</div>
       <div>${der.map((x) => `<button class="pd" data-i="${x.i}">${esc(x.t)}</button>`).join("")}</div></div>`;
    let sel = null, errores = 0, hechas = 0;
    $$(".pz", el).forEach((b) => (b.onclick = () => { $$(".pz", el).forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); sel = b; }));
    $$(".pd", el).forEach((b) => (b.onclick = () => {
      if (!sel) return;
      if (sel.dataset.i === b.dataset.i) {
        sel.classList.remove("sel"); sel.classList.add("bien"); b.classList.add("bien"); sel.disabled = b.disabled = true; sel = null; hechas++;
        if (hechas === pares.length) ok({ correcto: errores <= 1, respuesta: `${errores} errores`, palabra: null, solucion: pares.map((p) => `${p[0]}: ${p[1]}`).join(" · "), errores });
      } else { errores++; b.classList.add("mal"); setTimeout(() => b.classList.remove("mal"), 500); }
    }));
  });
}

export const MECANICAS = { elige, letra, tilde, hueco, frase, caza, dictado, silabas, tonica, clasifica, diptongo, parejas };
