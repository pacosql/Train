// "La redacción" — juego grande (por tramos) sobre gráficos engañosos y
// honestos: eres redactor de un periódico y manipulas el ORIGEN del eje, la
// ESCALA (unidad por división) o el TAMAÑO del icono de un pictograma y ves
// al instante qué titular sugiere el gráfico. La regla que fabrica el titular
// aparente es explícita: razón visual = altura(barra grande) / altura(barra
// pequeña) medida en divisiones del eje; con escala uniforme eso es
// (b − origen) / (a − origen), y en un pictograma escalado en 2D es (b/a)².
// Tramos: ¿engaña? (clasificar el truco) → arréglalo (dejar el gráfico
// honesto) → el titular verdadero (porcentaje real desde la tabla) → reto
// "dos portadas" (fabricar a propósito el gráfico del "doble" y luego el
// honesto). Inspirado en MediaWatch (Utrecht) y "fix this chart" (Polypad).
// Progreso persistente en localStorage + football_progress.
import { randInt, pick, shuffle, clamp, saveScore } from "./utils.js";

const ROUNDS = { 1: 4, 2: 3, 3: 3, 4: 2 };
const LEVEL_NAMES = { 1: "¿Engaña?", 2: "Arréglalo", 3: "El titular verdadero", 4: "Dos portadas" };
const STORAGE_KEY = "football_mediawatch_progress";
const PLAYER_KEY = "football_player_id";
export const PASOS = [2, 4, 10, 20]; // unidades por división (pares, para poder partirlas)
export const MAX_DIVS = 12; // divisiones máximas desde 0 con la unidad base
export const MAX_DIVS_FINAS = 14; // divisiones máximas con la unidad partida por encima del umbral
export const TRUCOS = { honesto: "Honesto", truncado: "Eje truncado", irregular: "Escala irregular", pictograma: "Pictograma engañoso" };

const CONTEXTOS = [
  { tema: "Helados vendidos en agosto", labels: ["Fresa", "Choco"], unidad: "helados", verbo: "vende" },
  { tema: "Goles de la temporada", labels: ["Leones", "Tigres"], unidad: "goles", verbo: "marca" },
  { tema: "Visitas a la web (miles)", labels: ["Web A", "Web B"], unidad: "miles de visitas", verbo: "recibe" },
  { tema: "Libros prestados este mes", labels: ["Biblio Norte", "Biblio Sur"], unidad: "libros", verbo: "presta" },
  { tema: "Kilómetros en bici este mes", labels: ["Ana", "Luis"], unidad: "km", verbo: "recorre" },
  { tema: "Entradas vendidas el sábado", labels: ["Cine Sol", "Cine Luna"], unidad: "entradas", verbo: "vende" },
];

// ---------------- aritmética pura ----------------

export const fmtNum = (v) => Number(v.toFixed(2)).toLocaleString("es-ES", { maximumFractionDigits: 2 });
export const pctReal = (a, b) => Math.round((b / a - 1) * 100);

// Primer origen (múltiplo de paso, entre 0 y a) que hace que la razón visual
// (b − g)/(a − g) quede entre 1,9 y 2,1: el gráfico "del doble". Null si no hay.
export function origenDoble(a, b, paso) {
  for (let g = paso; g < a; g += paso) { const r = (b - g) / (a - g); if (r >= 1.9 && r <= 2.1) return g; }
  return null;
}
// Primer múltiplo de paso estrictamente mayor que a (donde puede cambiar la escala).
export const umbralDe = (a, paso) => Math.ceil((a + 1) / paso) * paso;
// Mayor origen permitido: el último múltiplo de paso por debajo de a.
export const origenMax = (a, paso) => Math.ceil(a / paso) * paso - paso;

// Datos: dos valores a < b con razón real entre 1,05 y 1,6, que quepan en el
// eje desde 0, con un origen entero en la rejilla que dé "el doble" y con
// b por encima del umbral (para que la escala irregular cambie el dibujo).
export function genDatos() {
  for (let guard = 0; guard < 5000; guard++) {
    const paso = pick(PASOS);
    const a = randInt(2 * paso, 9 * paso);
    const bMin = Math.max(a + paso, Math.ceil(a * 1.05));
    const bMax = Math.min(Math.floor(a * 1.6), MAX_DIVS * paso);
    if (bMax < bMin) continue;
    const b = randInt(bMin, bMax);
    const g = origenDoble(a, b, paso);
    if (g === null) continue;
    const umbral = umbralDe(a, paso);
    if (b <= umbral) continue; // la barra grande tiene que asomar por encima del umbral: si no, la escala irregular no se nota
    if (umbral / paso + Math.ceil((b - umbral) / (paso / 2)) > MAX_DIVS_FINAS) continue;
    return datosCon({ paso, a, b, g, umbral });
  }
  return datosCon({ paso: 4, a: 42, b: 48, g: 36, umbral: 44 });
}
function datosCon(base, ctx = pick(CONTEXTOS), bigFirst = Math.random() < 0.5) {
  const [l1, l2] = ctx.labels;
  return { ...base, ctx, bigFirst, nA: bigFirst ? l2 : l1, nB: bigFirst ? l1 : l2 };
}

// Un gráfico = datos + tres mandos: origen del eje, unidad por división por
// encima del umbral (uniforme si coincide con paso) y, en pictogramas, si el
// icono crece también a lo ancho.
export function hacerGrafico(d, { tipo = "barras", origen = 0, unidadArriba = d.paso, icono2d = false } = {}) {
  return { tipo, a: d.a, b: d.b, paso: d.paso, umbral: d.umbral, origen, unidadArriba, icono2d };
}
// Altura de un valor medida en divisiones del eje (así se calcula la razón visual).
export function divisiones(ch, v) {
  const corte = ch.unidadArriba === ch.paso ? Infinity : ch.umbral;
  const bajo = Math.min(v, corte);
  return Math.max(0, bajo - ch.origen) / ch.paso + Math.max(0, v - corte) / ch.unidadArriba;
}
export function ejeTicks(ch) {
  const corte = ch.unidadArriba === ch.paso ? Infinity : ch.umbral;
  const ticks = [ch.origen];
  let v = ch.origen;
  while (v < ch.b - 1e-9) { v += v >= corte ? ch.unidadArriba : ch.paso; ticks.push(v); }
  return ticks;
}
export function razonVisual(ch) {
  if (ch.tipo === "pictograma") { const q = ch.b / ch.a; return ch.icono2d ? q * q : q; }
  return divisiones(ch, ch.b) / divisiones(ch, ch.a);
}
export function describeRazon(r) {
  if (r < 1.9) return `un ${Math.round((r - 1) * 100)} % más`;
  if (r <= 2.1) return "el doble";
  if (r < 2.9) return "más del doble";
  if (r <= 3.1) return "el triple";
  return "más del triple";
}
export function truco(ch) {
  if (ch.tipo === "pictograma") return ch.icono2d ? "pictograma" : "honesto";
  const trunc = ch.origen > 0, irreg = ch.unidadArriba !== ch.paso;
  if (trunc && irreg) return "ambos";
  if (trunc) return "truncado";
  if (irreg) return "irregular";
  return "honesto";
}
export const esHonesto = (ch) => truco(ch) === "honesto";
export const titular = (d, ch) => `${d.nB} ${d.ctx.verbo} ${describeRazon(razonVisual(ch))} que ${d.nA}`;
export const esDoble = (ch) => { const r = razonVisual(ch); return r >= 1.9 && r <= 2.1; };

export function explicaTruco(d, ch) {
  const t = truco(ch), P = pctReal(d.a, d.b), q = d.b / d.a, r = razonVisual(ch);
  const real = `en realidad ${d.nB} ${d.ctx.verbo} un ${P} % más (${d.b} frente a ${d.a})`;
  const trunc = `el eje empieza en ${ch.origen} y no en 0: la barra de ${d.nB} mide ${d.b} − ${ch.origen} = ${d.b - ch.origen} y la de ${d.nA} ${d.a} − ${ch.origen} = ${d.a - ch.origen}`;
  const irreg = `las divisiones no valen lo mismo (hasta ${ch.umbral} van de ${ch.paso} en ${ch.paso} y por encima de ${fmtNum(ch.unidadArriba)} en ${fmtNum(ch.unidadArriba)}), así que la barra de ${d.nB} ${ch.unidadArriba < ch.paso ? "se estira" : "se encoge"}`;
  if (t === "truncado") return `${trunc}: razón visual ${fmtNum(r)} (${describeRazon(r)}); ${real}.`;
  if (t === "irregular") return `${irreg}: razón visual ${fmtNum(r)} (${describeRazon(r)}); ${real}.`;
  if (t === "ambos") return `${trunc}, y además ${irreg}: razón visual ${fmtNum(r)} (${describeRazon(r)}); ${real}.`;
  if (t === "pictograma") return `el icono de ${d.nB} es ${fmtNum(q)} veces más alto y también ${fmtNum(q)} veces más ancho: ocupa ${fmtNum(q * q)} veces más (${describeRazon(q * q)}); ${real}.`;
  if (ch.tipo === "pictograma") return `el icono de ${d.nB} solo crece a lo alto (×${fmtNum(q)}), no a lo ancho: ${real}.`;
  return `el eje empieza en 0 y todas las divisiones valen ${ch.paso}: ${real}.`;
}

// ---------------- generadores por tramo ----------------

function origenesPosibles(d) { const out = []; for (let g = d.paso; g < d.a; g += d.paso) out.push(g); return out; }

// Tramo 1: un gráfico y cuatro categorías; exactamente una es la correcta.
export function genEngana() {
  const d = genDatos();
  const t = pick(["honesto", "truncado", "irregular", "pictograma", "honesto"]);
  let ch;
  if (t === "honesto") ch = hacerGrafico(d, { tipo: Math.random() < 0.35 ? "pictograma" : "barras" });
  else if (t === "truncado") ch = hacerGrafico(d, { origen: Math.random() < 0.5 ? d.g : pick(origenesPosibles(d)) });
  else if (t === "irregular") ch = hacerGrafico(d, { unidadArriba: pick([d.paso / 2, d.paso * 2]) });
  else ch = hacerGrafico(d, { tipo: "pictograma", icono2d: true });
  return { d, ch, answer: t, options: Object.keys(TRUCOS), razon: razonVisual(ch), titular: titular(d, ch) };
}

// Tramo 2: un gráfico engañoso (uno o dos mandos torcidos) que hay que dejar honesto.
export function genArregla() {
  const d = genDatos();
  const t = pick(["truncado", "irregular", "ambos", "pictograma"]);
  let ch;
  if (t === "truncado") ch = hacerGrafico(d, { origen: pick(origenesPosibles(d)) });
  else if (t === "irregular") ch = hacerGrafico(d, { unidadArriba: pick([d.paso / 2, d.paso * 2]) });
  else if (t === "ambos") ch = hacerGrafico(d, { origen: pick(origenesPosibles(d)), unidadArriba: pick([d.paso / 2, d.paso * 2]) });
  else ch = hacerGrafico(d, { tipo: "pictograma", icono2d: true });
  return { d, ch, tipoInicial: t, objetivo: { origen: 0, unidadArriba: d.paso, icono2d: false } };
}

// Tramo 3: datos en tabla; el titular correcto es el porcentaje real. Los
// distractores salen de los trucos (eje truncado → "el doble"; pictograma 2D →
// (b/a)²; confundir diferencia con porcentaje; porcentaje sobre la base equivocada).
export function genTitular() {
  const d = genDatos();
  const P = pctReal(d.a, d.b);
  const correct = `un ${P} % más`;
  const q = d.b / d.a;
  const cands = ["el doble", describeRazon(q * q), `un ${d.b - d.a} % más`, `un ${Math.round((1 - d.a / d.b) * 100)} % más`, `un ${2 * P} % más`, "el triple", "más del doble"];
  const options = [correct];
  for (const c of cands) { if (options.length === 4) break; if (!options.includes(c)) options.push(c); }
  return { d, P, correct, options: shuffle(options), modo: Math.random() < 0.5 ? "opciones" : "teclado" };
}

// Reto: mismos datos, dos portadas (la del "doble" y la honesta).
export function genPortadas() {
  const d = genDatos();
  return { d, ch: hacerGrafico(d), g: d.g };
}

// ---------------- dibujo ----------------

const W = 320, H = 232, PAD_L = 44, PAD_R = 12, PAD_T = 24, PAD_B = 30;

function barrasSvg(d, ch) {
  const ticks = ejeTicks(ch);
  const tope = ticks[ticks.length - 1];
  const plotH = H - PAD_T - PAD_B, baseY = H - PAD_B;
  const pxDiv = plotH / Math.max(divisiones(ch, tope), 1);
  const y = (v) => baseY - divisiones(ch, v) * pxDiv;
  let out = `<line x1="${PAD_L}" y1="${PAD_T - 6}" x2="${PAD_L}" y2="${baseY}" class="rdc-axis" /><line x1="${PAD_L}" y1="${baseY}" x2="${W - PAD_R}" y2="${baseY}" class="rdc-axis" />`;
  ticks.forEach((t) => { out += `<line x1="${PAD_L}" y1="${y(t)}" x2="${W - PAD_R}" y2="${y(t)}" class="rdc-grid" /><text x="${PAD_L - 6}" y="${y(t) + 3.5}" class="rdc-tick">${fmtNum(t)}</text>`; });
  const bars = d.bigFirst ? [[d.nB, d.b, "rdc-bar-b"], [d.nA, d.a, "rdc-bar-a"]] : [[d.nA, d.a, "rdc-bar-a"], [d.nB, d.b, "rdc-bar-b"]];
  bars.forEach(([name, v, cls], i) => {
    const cx = PAD_L + (W - PAD_L - PAD_R) * (i === 0 ? 0.3 : 0.7);
    out += `<rect x="${cx - 30}" y="${y(v)}" width="60" height="${baseY - y(v)}" class="rdc-bar ${cls}" /><text x="${cx}" y="${y(v) - 6}" class="rdc-val">${v}</text><text x="${cx}" y="${H - 9}" class="rdc-name">${name}</text>`;
  });
  return `<svg class="rdc-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Gráfico de barras: ${d.ctx.tema}">${out}</svg>`;
}

function pictSvg(d, ch) {
  const q = ch.b / ch.a, sy = q, sx = ch.icono2d ? q : 1;
  const baseY = H - 52, ICON_H = 61;
  const items = d.bigFirst ? [[d.nB, d.b, sx, sy, "rdc-bar-b"], [d.nA, d.a, 1, 1, "rdc-bar-a"]] : [[d.nA, d.a, 1, 1, "rdc-bar-a"], [d.nB, d.b, sx, sy, "rdc-bar-b"]];
  let out = `<line x1="${PAD_R}" y1="${baseY}" x2="${W - PAD_R}" y2="${baseY}" class="rdc-axis" />`;
  items.forEach(([name, v, kx, ky, cls], i) => {
    const cx = W * (i === 0 ? 0.28 : 0.72);
    out += `<g class="rdc-pict" transform="translate(${cx} ${baseY}) scale(${kx} ${ky})"><rect x="-13" y="-46" width="26" height="46" rx="7" class="rdc-icon ${cls}" /><circle cx="0" cy="-52" r="9" class="rdc-icon ${cls}" /></g>`;
    out += `<text x="${cx}" y="${baseY - ICON_H * ky - 8}" class="rdc-val">${v}</text><text x="${cx}" y="${baseY + 16}" class="rdc-name">${name}</text><text x="${cx}" y="${baseY + 32}" class="rdc-factor">alto ×${fmtNum(ky)} · ancho ×${fmtNum(kx)}</text>`;
  });
  return `<svg class="rdc-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Pictograma: ${d.ctx.tema}">${out}</svg>`;
}

const chartSvg = (d, ch) => (ch.tipo === "pictograma" ? pictSvg(d, ch) : barrasSvg(d, ch));
const paperHtml = (d, ch) => `<div class="rdc-paper"><div class="rdc-masthead">EL DIARIO DE LOS DATOS</div><div class="rdc-headline" data-headline>«${titular(d, ch)}»</div></div>`;
const chartBlock = (d, ch) => `<div class="rdc-tema">${d.ctx.tema} (${d.ctx.unidad})</div><div class="rdc-wrap" data-chart>${chartSvg(d, ch)}</div>${paperHtml(d, ch)}`;

function controlsHtml(d, ch, { escala = false, icono = false } = {}) {
  let out = `<div class="rdc-ctrl"><span class="rdc-ctrl-label">Origen del eje</span><div class="rdc-stepper"><button type="button" class="choice-btn rdc-step" data-adj="orig-" aria-label="Bajar origen">−</button><b data-orig-val>${ch.origen}</b><button type="button" class="choice-btn rdc-step" data-adj="orig+" aria-label="Subir origen">+</button></div><input type="range" class="rdc-range" data-orig-range min="0" max="${origenMax(d.a, d.paso)}" step="${d.paso}" value="${ch.origen}" aria-label="Origen del eje" /></div>`;
  if (escala) out += `<div class="rdc-ctrl"><span class="rdc-ctrl-label">Por encima de ${ch.umbral}, cada división vale (por debajo valen ${d.paso}):</span><div class="rdc-chips">${[d.paso / 2, d.paso, d.paso * 2].map((u) => `<button type="button" class="rdc-chip" data-unit="${u}" aria-pressed="${ch.unidadArriba === u}">${fmtNum(u)}</button>`).join("")}</div></div>`;
  if (icono) out += `<div class="rdc-ctrl"><span class="rdc-ctrl-label">El icono grande crece…</span><div class="rdc-chips"><button type="button" class="rdc-chip" data-icon="alto" aria-pressed="${!ch.icono2d}">solo a lo alto</button><button type="button" class="rdc-chip" data-icon="2d" aria-pressed="${ch.icono2d}">a lo alto y a lo ancho</button></div></div>`;
  return `<div class="rdc-controls">${out}</div>`;
}

// ---------------- progreso ----------------

function loadProgress() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : { nivelMax: 0, fallosPorTipo: {}, partidas: 0 }; }
  catch (_) { return { nivelMax: 0, fallosPorTipo: {}, partidas: 0 }; }
}
function playerId() {
  try { let id = localStorage.getItem(PLAYER_KEY); if (!id) { id = `p_${Math.random().toString(36).slice(2, 10)}`; localStorage.setItem(PLAYER_KEY, id); } return id; }
  catch (_) { return "anon"; }
}
async function saveProgress(client, progress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (_) { /* sin almacenamiento */ }
  if (!client) return;
  try { await client.from("football_progress").upsert({ game: "mediawatch", player: playerId(), data: progress, updated_at: new Date().toISOString() }); } catch (_) { /* guinda */ }
}

// ---------------- juego ----------------

export function mountMediawatchGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false;
  let level = 0;
  let roundIdx = 0;
  let levelReached = 0;
  let errors = [];
  let reviewQueue = [];
  let progress = loadProgress();
  const timers = [];

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats"><span class="lives" data-lives></span><span class="score" data-score>⭐ 0</span></div>
    </div>
    <div class="game-body" data-body></div>`;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");

  const later = (fn, ms) => timers.push(setTimeout(() => { if (!finished) fn(); }, ms));
  const renderLives = () => { livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)); };
  const renderScore = () => { scoreEl.textContent = `⭐ ${score}`; };
  const award = () => { rounds++; score += 10; renderScore(); };
  const feedback = (t, ok) => { const el = body.querySelector("[data-feedback]"); if (el) { el.textContent = t; el.className = `feedback ${ok ? "ok" : "bad"}`; } };
  const header = (t, s) => `<p class="prompt">${t}${s ? `<small>${s}</small>` : ""}</p>`;
  const badge = (t) => `<div class="rdc-badge">${t}</div>`;
  const recordError = (tipo, explicacion) => errors.push({ tipo, explicacion });
  function loseLife(next) { lives--; renderLives(); if (lives <= 0) later(screenResults, 2800); else later(next, 2800); }
  function nextRound() {
    roundIdx++;
    if (roundIdx >= ROUNDS[level]) {
      levelReached = Math.max(levelReached, level);
      progress.nivelMax = Math.max(progress.nivelMax || 0, level);
      saveProgress(client, progress);
      roundIdx = 0;
      if (level >= 4) screenResults(); else screenMap();
      return;
    }
    startLevel(level);
  }
  function startLevel(l) { level = l; ({ 1: screenEngana, 2: screenArregla, 3: screenTitular, 4: screenPortadas })[l](); }
  function outcome(ok, tipo, expl, review, retry) {
    locked = true;
    if (ok) { award(); feedback(`¡Correcto! ${expl}`, true); later(() => { locked = false; review ? nextReview() : nextRound(); }, 2200); }
    else if (review) { feedback(`No: ${expl} Otra vez.`, false); later(() => { locked = false; retry(); }, 2800); }
    else { recordError(tipo, expl); feedback(`No es correcto. ${expl}`, false); loseLife(() => { locked = false; nextRound(); }); }
  }

  // Mandos del gráfico: cambian el estado JS y redibujan gráfico + titular.
  function bindControls(d, ch, onChange) {
    const redraw = () => {
      body.querySelector("[data-chart]").innerHTML = chartSvg(d, ch);
      body.querySelector("[data-headline]").textContent = `«${titular(d, ch)}»`;
      const ov = body.querySelector("[data-orig-val]"); if (ov) ov.textContent = String(ch.origen);
      const rg = body.querySelector("[data-orig-range]"); if (rg) rg.value = String(ch.origen);
      body.querySelectorAll("[data-unit]").forEach((c) => c.setAttribute("aria-pressed", String(Number(c.getAttribute("data-unit")) === ch.unidadArriba)));
      body.querySelectorAll("[data-icon]").forEach((c) => c.setAttribute("aria-pressed", String((c.getAttribute("data-icon") === "2d") === ch.icono2d)));
      if (onChange) onChange();
    };
    const maxO = origenMax(d.a, d.paso);
    body.querySelectorAll("[data-adj]").forEach((b) => b.addEventListener("click", () => {
      if (locked || finished) return;
      ch.origen = clamp(ch.origen + (b.getAttribute("data-adj") === "orig+" ? d.paso : -d.paso), 0, maxO);
      redraw();
    }));
    const rg = body.querySelector("[data-orig-range]");
    if (rg) rg.addEventListener("input", () => { if (locked || finished) { rg.value = String(ch.origen); return; } ch.origen = clamp(Math.round(Number(rg.value) / d.paso) * d.paso, 0, maxO); redraw(); });
    body.querySelectorAll("[data-unit]").forEach((c) => c.addEventListener("click", () => { if (locked || finished) return; ch.unidadArriba = Number(c.getAttribute("data-unit")); redraw(); }));
    body.querySelectorAll("[data-icon]").forEach((c) => c.addEventListener("click", () => { if (locked || finished) return; ch.icono2d = c.getAttribute("data-icon") === "2d"; redraw(); }));
    return redraw;
  }
  const formulaTxt = (d, ch) => `razón visual = (${d.b} − ${ch.origen}) / (${d.a} − ${ch.origen}) = ${fmtNum(razonVisual(ch))}`;

  // ---- mapa ----
  function screenMap() {
    locked = false;
    const unlocked = Math.min((progress.nivelMax || 0) + 1, 4);
    const nodes = [1, 2, 3, 4].map((l) => { const done = l <= (progress.nivelMax || 0), open = l <= unlocked; return `<button type="button" class="rdc-node ${done ? "rdc-node-done" : ""}" data-level="${l}" ${open ? "" : "disabled"}><span class="rdc-node-num">${done ? "✓" : l === 4 ? "★" : l}</span><span class="rdc-node-name">${LEVEL_NAMES[l]}</span></button>`; }).join("");
    body.innerHTML = `
      ${header("La redacción", "Eres redactor: el mismo dato puede parecer «un 14 % más» o «el doble» según dónde empiece el eje, cuánto valga cada división o cómo crezca el icono")}
      <div class="rdc-map">${nodes}</div>
      <div class="rdc-actions"><button type="button" class="secondary" data-tutorial>Mueve el eje (tutorial)</button></div>
      <p class="rdc-progress">${progress.partidas ? `Partidas: ${progress.partidas}. Tramos superados: ${progress.nivelMax || 0} de 4.` : "Primera vez: haz el tutorial y empieza por el tramo 1."}</p>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-level]").forEach((b) => b.addEventListener("click", () => { roundIdx = 0; startLevel(Number(b.getAttribute("data-level"))); }));
    body.querySelector("[data-tutorial]").addEventListener("click", screenTutorial);
  }

  // ---- tutorial: mueve el origen del eje ----
  function screenTutorial() {
    const d = datosCon({ paso: 4, a: 42, b: 48, g: 36, umbral: 44 }, CONTEXTOS[0], false);
    const ch = hacerGrafico(d);
    let fase = 1;
    body.innerHTML = `
      ${badge("Tutorial · mueve el eje")}
      ${header("Fresa vendió 42 helados y Choco 48. Sube el origen del eje hasta que el titular diga «el doble»", "Usa + / − o el deslizador y mira cómo cambia el titular")}
      ${chartBlock(d, ch)}
      ${controlsHtml(d, ch)}
      <div class="rdc-formula" data-formula>${formulaTxt(d, ch)}</div>
      <div class="rdc-actions" data-next-wrap></div>
      <div class="feedback" data-feedback></div>`;
    bindControls(d, ch, () => {
      body.querySelector("[data-formula]").textContent = formulaTxt(d, ch);
      if (fase === 1 && esDoble(ch)) {
        fase = 2;
        feedback(`Con el eje desde ${ch.origen}, la barra de Choco mide 48 − ${ch.origen} = ${48 - ch.origen} y la de Fresa 42 − ${ch.origen} = ${42 - ch.origen}: parece el doble sin cambiar ningún dato. Ahora devuelve el origen a 0.`, true);
      } else if (fase === 2 && ch.origen === 0) {
        fase = 3; locked = true; award();
        feedback("Con el eje en 0 se ve la verdad: 48 frente a 42 es solo un 14 % más. Ese es el primer truco que vas a cazar.", true);
        body.querySelector("[data-next-wrap]").innerHTML = '<button type="button" class="primary" data-next>Al tramo 1 →</button>';
        body.querySelector("[data-next]").addEventListener("click", () => { locked = false; roundIdx = 0; startLevel(1); }, { once: true });
      } else if (fase === 1) feedback(`Origen en ${ch.origen}: el titular dice «${describeRazon(razonVisual(ch))}». Sigue subiendo.`, true);
    });
  }

  // ---- tramo 1: ¿engaña? ----
  function screenEngana(review = false) {
    const r = genEngana();
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Tramo 1 · ${LEVEL_NAMES[1]} · ${roundIdx + 1} de ${ROUNDS[1]}`)}
      ${header("¿Este gráfico es honesto o esconde un truco?", "Elige la categoría")}
      ${chartBlock(r.d, r.ch)}
      ${review ? "" : '<div class="rdc-hint">Pistas: ¿el eje empieza en 0? ¿todas las divisiones valen lo mismo? ¿el icono grande crece también a lo ancho?</div>'}
      <div class="rdc-options">${r.options.map((k) => `<button type="button" class="choice-btn rdc-opt" data-opt="${k}">${TRUCOS[k]}</button>`).join("")}</div>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-opt]").forEach((btn) => btn.addEventListener("click", () => {
      if (locked || finished) return;
      const k = btn.getAttribute("data-opt"); const ok = k === r.answer;
      body.querySelectorAll("[data-opt]").forEach((x) => (x.disabled = true)); btn.classList.add(ok ? "correct" : "wrong");
      outcome(ok, "¿engaña?", `${TRUCOS[r.answer].toLowerCase()}: ${explicaTruco(r.d, r.ch)}`, review, () => screenEngana(true));
    }));
  }

  // ---- tramo 2: arréglalo ----
  function screenArregla(review = false) {
    const r = genArregla();
    const ch = r.ch;
    const pict = ch.tipo === "pictograma";
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Tramo 2 · ${LEVEL_NAMES[2]} · ${roundIdx + 1} de ${ROUNDS[2]}`)}
      ${header("Este gráfico engaña. Ajusta los mandos hasta dejarlo honesto y publícalo", "Eje desde 0, divisiones iguales, icono que solo crece a lo alto")}
      ${chartBlock(r.d, ch)}
      ${controlsHtml(r.d, ch, { escala: !pict, icono: pict })}
      <div class="rdc-actions"><button type="button" class="primary" data-publish>Publicar</button></div>
      <div class="feedback" data-feedback></div>`;
    bindControls(r.d, ch);
    body.querySelector("[data-publish]").addEventListener("click", () => {
      if (locked || finished) return;
      const ok = esHonesto(ch);
      const P = pctReal(r.d.a, r.d.b);
      const expl = ok ? `eje desde 0, divisiones iguales${pict ? ", icono solo a lo alto" : ""}: el titular honesto es «${r.d.nB} ${r.d.ctx.verbo} un ${P} % más que ${r.d.nA}».` : `publicaste con ${TRUCOS[truco(ch)] ? TRUCOS[truco(ch)].toLowerCase() : "eje truncado y escala irregular"}; ${explicaTruco(r.d, ch)}`;
      outcome(ok, "arréglalo", expl, review, () => screenArregla(true));
    });
  }

  // ---- tramo 3: el titular verdadero ----
  function screenTitular(review = false) {
    const r = genTitular();
    const rows = (r.d.bigFirst ? [[r.d.nB, r.d.b], [r.d.nA, r.d.a]] : [[r.d.nA, r.d.a], [r.d.nB, r.d.b]]).map(([n, v]) => `<tr><td>${n}</td><td>${v}</td></tr>`).join("");
    const table = `<div class="rdc-tema">${r.d.ctx.tema}</div><table class="rdc-table"><thead><tr><th></th><th>${r.d.ctx.unidad}</th></tr></thead><tbody>${rows}</tbody></table>`;
    const expl = `${r.d.b} / ${r.d.a} = ${fmtNum(r.d.b / r.d.a)}, es decir, un ${r.P} % más (${r.d.b - r.d.a} ${r.d.ctx.unidad} de diferencia); «el doble» solo sale truncando el eje en ${r.d.g}.`;
    if (r.modo === "opciones") {
      body.innerHTML = `
        ${review ? badge("Repaso") : badge(`Tramo 3 · ${LEVEL_NAMES[3]} · ${roundIdx + 1} de ${ROUNDS[3]}`)}
        ${header(`Sin gráfico: ¿qué titular es verdad? «${r.d.nB} ${r.d.ctx.verbo} … que ${r.d.nA}»`, "Porcentaje real = (grande / pequeño − 1) × 100, redondeado")}
        ${table}
        <div class="rdc-options">${r.options.map((o) => `<button type="button" class="choice-btn rdc-opt" data-opt="${o}">${o}</button>`).join("")}</div>
        <div class="feedback" data-feedback></div>`;
      body.querySelectorAll("[data-opt]").forEach((btn) => btn.addEventListener("click", () => {
        if (locked || finished) return;
        const ok = btn.getAttribute("data-opt") === r.correct;
        body.querySelectorAll("[data-opt]").forEach((x) => (x.disabled = true)); btn.classList.add(ok ? "correct" : "wrong");
        outcome(ok, "titular verdadero", expl, review, () => screenTitular(true));
      }));
      return;
    }
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Tramo 3 · ${LEVEL_NAMES[3]} · ${roundIdx + 1} de ${ROUNDS[3]}`)}
      ${header(`Escribe el porcentaje real: «${r.d.nB} ${r.d.ctx.verbo} un … % más que ${r.d.nA}»`, "Porcentaje real = (grande / pequeño − 1) × 100, redondeado a entero")}
      ${table}
      <div class="rdc-inputrow"><input type="number" inputmode="numeric" class="rdc-input" data-answer aria-label="Porcentaje" /><span class="rdc-unit">% más</span><button type="button" class="primary" data-check>Publicar</button></div>
      <div class="feedback" data-feedback></div>`;
    const input = body.querySelector("[data-answer]");
    const check = () => {
      if (locked || finished) return;
      const v = Number(input.value);
      if (input.value.trim() === "" || !Number.isFinite(v)) { feedback("Escribe un número entero.", false); return; }
      input.disabled = true;
      outcome(v === r.P, "titular verdadero", expl, review, () => screenTitular(true));
    };
    body.querySelector("[data-check]").addEventListener("click", check);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") check(); });
    input.focus();
  }

  // ---- reto: dos portadas ----
  function screenPortadas() {
    const r = genPortadas();
    const ch = r.ch;
    let fase = 1;
    const render = () => {
      body.innerHTML = `
        ${badge(`Reto · ${LEVEL_NAMES[4]} · ${roundIdx + 1} de ${ROUNDS[4]}`)}
        ${header(fase === 1 ? `Portada 1: con estos datos, mueve el origen para que el titular diga «el doble»` : "Portada 2: ahora la honesta. Devuelve el eje a 0 y publica", fase === 1 ? "Aquí no se pierden vidas: la razón visual tiene que quedar entre 1,9 y 2,1" : "Solo es honesto si el eje empieza en 0")}
        ${chartBlock(r.d, ch)}
        ${controlsHtml(r.d, ch)}
        <div class="rdc-formula" data-formula>${formulaTxt(r.d, ch)}</div>
        <div class="rdc-actions"><button type="button" class="primary" data-publish>Publicar portada ${fase}</button></div>
        <div class="feedback" data-feedback></div>`;
      bindControls(r.d, ch, () => { body.querySelector("[data-formula]").textContent = formulaTxt(r.d, ch); });
      body.querySelector("[data-publish]").addEventListener("click", () => {
        if (locked || finished) return;
        locked = true;
        const P = pctReal(r.d.a, r.d.b);
        if (fase === 1) {
          const ok = esDoble(ch);
          const expl = `con el origen en ${r.g}: (${r.d.b} − ${r.g}) / (${r.d.a} − ${r.g}) = ${fmtNum((r.d.b - r.g) / (r.d.a - r.g))}, y el titular grita «el doble» aunque el dato real sea un ${P} % más.`;
          if (ok) { award(); feedback(`¡Portada engañosa lista! ${explicaTruco(r.d, ch)}`, true); }
          else { recordError("dos portadas", `Publicaste con origen ${ch.origen} (razón visual ${fmtNum(razonVisual(ch))}, «${describeRazon(razonVisual(ch))}»); ${expl}`); feedback(`Esa portada no dice «el doble»: ${expl}`, false); }
          later(() => { locked = false; fase = 2; render(); }, 3000);
        } else {
          const ok = ch.origen === 0;
          const expl = `la portada honesta tiene el eje en 0: «${r.d.nB} ${r.d.ctx.verbo} un ${P} % más que ${r.d.nA}».`;
          if (ok) { award(); feedback(`¡Portada honesta publicada! ${expl}`, true); }
          else { recordError("dos portadas", `Publicaste la "honesta" con el eje en ${ch.origen}; ${expl}`); feedback(`No: ${expl}`, false); }
          later(() => { locked = false; nextRound(); }, 3000);
        }
      });
    };
    render();
  }

  // ---- resultados y repaso ----
  function screenResults() {
    locked = false; // al agotar las vidas se llega aquí con locked = true: el repaso debe responder
    const byType = {};
    errors.forEach((e) => { byType[e.tipo] = (byType[e.tipo] || 0) + 1; });
    progress = { nivelMax: Math.max(progress.nivelMax || 0, levelReached), fallosPorTipo: { ...(progress.fallosPorTipo || {}) }, partidas: (progress.partidas || 0) + 1 };
    Object.entries(byType).forEach(([t, v]) => { progress.fallosPorTipo[t] = (progress.fallosPorTipo[t] || 0) + v; });
    saveProgress(client, progress);
    const items = errors.length ? `<ul class="rdc-errors">${errors.map((e) => `<li><b>${e.tipo}:</b> ${e.explicacion}</li>`).join("")}</ul>` : `<p class="rdc-progress">Sin fallos: a ti no te cuelan un eje truncado.</p>`;
    body.innerHTML = `
      ${header("Resultados", `${rounds} aciertos · tramos ${Math.max(levelReached, progress.nivelMax || 0)} de 4`)}
      <div class="rdc-learned">Un gráfico honesto empieza el eje en 0, da a todas las divisiones el mismo valor y hace crecer los iconos solo en una dirección. Lo que ves es la razón visual (b − origen)/(a − origen): con el eje en 0 es la razón real, y cuanto más cerca de las barras esté el origen, más «doble» parece.</div>
      ${items}
      <div class="rdc-actions">${errors.length ? '<button type="button" class="primary" data-review>Repasar lo fallado</button>' : ""}<button type="button" class="secondary" data-end>Terminar</button></div>`;
    const rv = body.querySelector("[data-review]");
    if (rv) rv.addEventListener("click", () => { reviewQueue = [...new Set(errors.map((e) => e.tipo))]; nextReview(); });
    body.querySelector("[data-end]").addEventListener("click", () => finish(false));
  }
  function nextReview() {
    locked = false;
    const tipo = reviewQueue.shift();
    if (!tipo) { finish(false); return; }
    ({ "¿engaña?": () => screenEngana(true), "arréglalo": () => screenArregla(true), "titular verdadero": () => screenTitular(true) }[tipo] || nextReview)();
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "mediawatch", { score, rounds });
    body.innerHTML = `
      <div class="end-card"><div>📰</div><div class="big-score">${score} pts</div><p>${rounds} aciertos · tramos ${Math.max(levelReached, progress.nivelMax || 0)} de 4</p>
        <div class="end-actions"><button class="primary" data-retry>Jugar otra vez</button><button class="secondary" data-menu>Volver al menú</button></div></div>`;
    body.querySelector("[data-retry]").addEventListener("click", start);
    body.querySelector("[data-menu]").addEventListener("click", onExit);
  }

  function start() {
    lives = startLives; score = 0; rounds = 0; finished = false; locked = false;
    level = 0; roundIdx = 0; levelReached = 0; errors = []; reviewQueue = [];
    progress = loadProgress();
    renderLives(); renderScore();
    screenMap();
  }

  start();
  return () => { finished = true; timers.forEach(clearTimeout); };
}
