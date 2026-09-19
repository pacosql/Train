// "La pensión de los sospechosos" — juego grande (por tramos) de deducción
// por eliminación en parrilla lógica: 4 huéspedes, 4 habitaciones en fila
// (1-2-3-4) y, desde el tramo 2, 4 mascotas. Se lee una pista de una línea
// y se TACHA en la parrilla la casilla que descarta; cuando en una fila
// solo queda una casilla, la parrilla la marca ✓ sola y tacha su columna.
// Un tachón que ninguna pista (ni lo ya deducido) justifica vuelve atrás y
// cuesta una vida. Cada caso lo genera un resolutor por enumeración (24
// asignaciones con un atributo, 24×24 = 576 con dos): se añaden pistas
// verdaderas al azar hasta que quede exactamente una asignación y luego se
// eliminan las redundantes (conjunto minimal). Progreso persistente
// (localStorage + football_progress).
//
// FORMATOS DE PISTA (texto fijo, para que un test pueda parsearlos):
//   sujeto S  = nombre del huésped | "El del <mascota>"
//   objeto O  = nombre del huésped | "quien tiene el <mascota>"
//   dir    → "S está en la R."
//   neg    → "S no está en la R."
//   right  → "S está justo a la derecha de O."      (hab(S) = hab(O) + 1)
//   adj    → "S está al lado de O."                 (|hab(S) − hab(O)| = 1)
//   gt     → "S está en una habitación mayor que la de O."
//   par    → "S está en una habitación par." / "… impar."
//   haspet → "Nombre tiene el <mascota>."
//   nopet  → "Nombre no tiene el <mascota>."
// Las habitaciones se numeran 1..n en el texto (0..n−1 en el estado).
import { pick, shuffle, saveScore } from "./utils.js";

const ROUNDS = { 1: 3, 2: 3, 3: 3, 4: 3, 5: 2 };
const LEVEL_NAMES = { 1: "Pistas directas", 2: "Dos atributos", 3: "Pide la pista", 4: "El testigo mentiroso", 5: "El caso completo" };
const STORAGE_KEY = "football_sospechosos_progress";
const PLAYER_KEY = "football_player_id";
export const NAMES = ["Ana", "Luis", "Marta", "Pedro", "Sara", "Hugo", "Rosa", "Iván", "Eva", "Noa", "Leo", "Paula"];
export const PETS = ["gato", "perro", "loro", "pez"];
const ALL_TYPES = ["dir", "neg", "right", "adj", "gt", "par", "haspet", "nopet"];

// ---------------- modelo y resolutor ----------------

function permutations(n) {
  const out = [];
  const rec = (arr, rest) => { if (!rest.length) { out.push(arr); return; } rest.forEach((v, i) => rec([...arr, v], [...rest.slice(0, i), ...rest.slice(i + 1)])); };
  rec([], Array.from({ length: n }, (_, i) => i));
  return out;
}
const ASG_CACHE = {};
// Todas las asignaciones: room[g] = habitación del huésped g; pet[g] = mascota del huésped g (o null).
export function allAssignments(n, withPets) {
  const key = `${n}${withPets ? "p" : ""}`;
  if (ASG_CACHE[key]) return ASG_CACHE[key];
  const P = permutations(n);
  const out = [];
  for (const room of P) { if (!withPets) out.push({ room, pet: null }); else for (const pet of P) out.push({ room, pet }); }
  ASG_CACHE[key] = out;
  return out;
}
const subjRoom = (s, a) => (s.kind === "g" ? a.room[s.i] : a.room[a.pet.indexOf(s.i)]);
// ¿Se cumple la pista c en la asignación a?
export function holds(c, a) {
  switch (c.type) {
    case "dir": return subjRoom(c.who, a) === c.room;
    case "neg": return subjRoom(c.who, a) !== c.room;
    case "right": return subjRoom(c.who, a) === subjRoom(c.other, a) + 1;
    case "adj": return Math.abs(subjRoom(c.who, a) - subjRoom(c.other, a)) === 1;
    case "gt": return subjRoom(c.who, a) > subjRoom(c.other, a);
    case "par": return (subjRoom(c.who, a) + 1) % 2 === (c.parity === "par" ? 0 : 1);
    case "haspet": return a.pet[c.g] === c.pet;
    case "nopet": return a.pet[c.g] !== c.pet;
    default: return true;
  }
}
export const compatible = (clues, A) => A.filter((a) => clues.every((c) => holds(c, a)));
export const countSolutions = (clues, A) => compatible(clues, A).length;
const subjText = (s, names, pets) => (s.kind === "g" ? names[s.i] : `El del ${pets[s.i]}`);
const objText = (s, names, pets) => (s.kind === "g" ? names[s.i] : `quien tiene el ${pets[s.i]}`);
export function clueText(c, names, pets) {
  const S = c.who ? subjText(c.who, names, pets) : "", O = c.other ? objText(c.other, names, pets) : "";
  switch (c.type) {
    case "dir": return `${S} está en la ${c.room + 1}.`;
    case "neg": return `${S} no está en la ${c.room + 1}.`;
    case "right": return `${S} está justo a la derecha de ${O}.`;
    case "adj": return `${S} está al lado de ${O}.`;
    case "gt": return `${S} está en una habitación mayor que la de ${O}.`;
    case "par": return `${S} está en una habitación ${c.parity}.`;
    case "haspet": return `${names[c.g]} tiene el ${pets[c.pet]}.`;
    case "nopet": return `${names[c.g]} no tiene el ${pets[c.pet]}.`;
    default: return "";
  }
}
// Todas las pistas de los tipos permitidos (verdaderas o falsas según `truth`) para una solución.
export function cluePool(sol, n, withPets, allowed, truth = true, noDirectGuest = false) {
  const subjects = Array.from({ length: n }, (_, i) => ({ kind: "g", i }));
  if (withPets) for (let i = 0; i < n; i++) subjects.push({ kind: "p", i });
  const out = [];
  const push = (c) => { if (allowed.includes(c.type) && holds(c, sol) === truth) out.push(c); };
  for (const who of subjects) {
    for (let room = 0; room < n; room++) { if (!(noDirectGuest && who.kind === "g")) push({ type: "dir", who, room }); push({ type: "neg", who, room }); }
    push({ type: "par", who, parity: "par" }); push({ type: "par", who, parity: "impar" });
    for (const other of subjects) {
      if (other === who) continue;
      push({ type: "right", who, other }); push({ type: "gt", who, other });
      if (subjects.indexOf(who) < subjects.indexOf(other)) push({ type: "adj", who, other });
    }
  }
  if (withPets) for (let g = 0; g < n; g++) for (let pet = 0; pet < n; pet++) { if (!noDirectGuest) push({ type: "haspet", g, pet }); push({ type: "nopet", g, pet }); }
  return out;
}
// Quita las pistas que sobran manteniendo la solución única (conjunto minimal).
export function prune(clues, A) {
  let cur = clues.slice();
  for (const c of shuffle(clues)) { const rest = cur.filter((x) => x !== c); if (rest.length && countSolutions(rest, A) === 1) cur = rest; }
  return cur;
}
// Subconjunto más pequeño de pistas bajo el que `pred` se cumple en TODAS las asignaciones compatibles.
export function minimalForcing(clues, A, pred) {
  const m = clues.length;
  const masks = Array.from({ length: 1 << m }, (_, k) => k).sort((x, y) => popcount(x) - popcount(y));
  for (const mask of masks) {
    const sub = clues.filter((_, i) => mask & (1 << i));
    const S = compatible(sub, A);
    if (S.length && S.every(pred)) return sub;
  }
  return clues;
}
const popcount = (x) => { let k = 0; while (x) { k += x & 1; x >>= 1; } return k; };

function pickNames(n) { return shuffle(NAMES).slice(0, n); }

// Caso genérico: pistas verdaderas al azar hasta solución única, podadas al conjunto minimal.
export function genCase({ n = 4, withPets = false, allowed = ALL_TYPES, min = 3, max = 4, maxDir = 4, noDirectGuest = false, tries = 300 } = {}) {
  const A = allAssignments(n, withPets);
  let best = null;
  for (let t = 0; t < tries; t++) {
    const sol = pick(A);
    const pool = shuffle(cluePool(sol, n, withPets, allowed, true, noDirectGuest));
    let chosen = [], S = A, dirs = 0;
    for (const c of pool) {
      if (c.type === "dir" && c.who.kind === "g") { if (dirs >= maxDir) continue; dirs++; }
      chosen.push(c); S = S.filter((a) => holds(c, a));
      if (S.length === 1) break;
    }
    if (S.length !== 1) continue;
    chosen = prune(chosen, A);
    const cs = { n, withPets, names: pickNames(n), pets: withPets ? PETS.slice(0, n) : null, sol, clues: shuffle(chosen) };
    if (chosen.length >= min && chosen.length <= max) return cs;
    if (!best || Math.abs(chosen.length - (min + max) / 2) < Math.abs(best.clues.length - (min + max) / 2)) best = cs;
  }
  return best;
}
export const genDirectasCase = () => genCase({ n: 4, withPets: false, allowed: ["dir", "neg", "right", "adj", "gt", "par"], min: 3, max: 4, maxDir: 2 });
export const genDobleCase = () => genCase({ n: 4, withPets: true, allowed: ALL_TYPES, min: 4, max: 6, noDirectGuest: true });
export const genRetoCase = () => {
  const c = genCase({ n: 4, withPets: true, allowed: ALL_TYPES, min: 5, max: 5, noDirectGuest: true });
  const kind = pick(["g", "r", "p"]);
  const g = pick([0, 1, 2, 3]);
  const target = kind === "g" ? { kind, i: g } : kind === "r" ? { kind, i: c.sol.room[g] } : { kind, i: c.sol.pet[g] };
  return { ...c, target };
};

// Tramo 3: dos pistas base dejan k posibilidades; de tres candidatas solo una deja exactamente 1.
export function genPideCase(tries = 400) {
  const A = allAssignments(4, false);
  const allowed = ["dir", "neg", "right", "adj", "gt", "par"];
  for (let t = 0; t < tries; t++) {
    const sol = pick(A);
    const pool = shuffle(cluePool(sol, 4, false, allowed));
    const base = pool.slice(0, 2);
    const S = compatible(base, A), k = S.length;
    if (k < 2 || k > 12) continue;
    if (countSolutions([base[0]], A) === k || countSolutions([base[1]], A) === k) continue; // las dos deben aportar
    const cands = pool.slice(2).map((c) => ({ c, left: S.filter((a) => holds(c, a)).length }));
    const dec = cands.filter((x) => x.left === 1);
    if (!dec.length) continue;
    const others = [];
    for (const x of cands) { if (x.left >= 2 && !others.some((o) => o.left === x.left)) others.push(x); if (others.length === 2) break; }
    if (others.length < 2) continue;
    const options = shuffle([pick(dec), ...others]);
    return { n: 4, withPets: false, names: pickNames(4), pets: null, sol, clues: base, k, options: options.map((x) => x.c), lefts: options.map((x) => x.left) };
  }
  return null;
}

// Tramo 4: cuatro pistas verdaderas (minimal, solución única) más una falsa. Solo quitando la
// falsa queda solución única; con ella el caso es imposible.
export function genMentirosoCase(tries = 60) {
  const A = allAssignments(4, false);
  const allowed = ["dir", "neg", "right", "adj", "gt", "par"];
  for (let t = 0; t < tries; t++) {
    const c = genCase({ n: 4, withPets: false, allowed, min: 4, max: 4, maxDir: 1, tries: 200 });
    if (!c || c.clues.length !== 4) continue;
    const falsePool = shuffle(cluePool(c.sol, 4, false, allowed, false));
    for (const liar of falsePool.slice(0, 60)) {
      const all = [...c.clues, liar];
      if (c.clues.every((tc) => countSolutions(all.filter((x) => x !== tc), A) !== 1)) {
        const clues = shuffle(all);
        return { ...c, clues, liar: clues.indexOf(liar) };
      }
    }
  }
  return null;
}

// ---------------- progreso ----------------

const EMPTY = () => ({ nivelMax: 0, fallosPorTipo: {}, partidas: 0, casos: 0 });
function loadProgress() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? { ...EMPTY(), ...JSON.parse(raw) } : EMPTY(); }
  catch (_) { return EMPTY(); }
}
function playerId() {
  try { let id = localStorage.getItem(PLAYER_KEY); if (!id) { id = `p_${Math.random().toString(36).slice(2, 10)}`; localStorage.setItem(PLAYER_KEY, id); } return id; }
  catch (_) { return "anon"; }
}
async function saveProgress(client, progress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (_) { /* sin almacenamiento */ }
  if (!client) return;
  try { await client.from("football_progress").upsert({ game: "sospechosos", player: playerId(), data: progress, updated_at: new Date().toISOString() }); } catch (_) { /* guinda */ }
}

// ---------------- juego ----------------

export function mountSospechososGame(container, { client, onExit }) {
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
  const award = () => { rounds++; score += 10; renderScore(); progress.casos = (progress.casos || 0) + 1; };
  const feedback = (t, ok) => { const el = body.querySelector("[data-feedback]"); if (el) { el.textContent = t; el.className = `feedback ${ok ? "ok" : "bad"}`; } };
  const header = (t, s) => `<p class="prompt">${t}${s ? `<small>${s}</small>` : ""}</p>`;
  const badge = (t) => `<div class="sos-badge">${t}</div>`;
  const recordError = (tipo, explicacion) => errors.push({ tipo, explicacion });
  const q = (t) => `«${t}»`;
  function loseLife(next) { lives--; renderLives(); if (lives <= 0) later(screenResults, 2800); else later(next, 2800); }
  function nextRound() {
    roundIdx++;
    if (roundIdx >= ROUNDS[level]) {
      levelReached = Math.max(levelReached, level);
      progress.nivelMax = Math.max(progress.nivelMax || 0, level);
      saveProgress(client, progress);
      roundIdx = 0;
      if (level >= 5) screenResults(); else screenMap();
      return;
    }
    startLevel(level);
  }
  function startLevel(l) { level = l; ({ 1: () => screenTramo(1), 2: () => screenTramo(2), 3: () => screenPide(), 4: () => screenMentiroso(), 5: () => screenReto() })[l](); }
  function outcome(ok, tipo, expl, review, retry) {
    locked = true;
    if (ok) { award(); feedback(`¡Correcto! ${expl}`, true); later(() => { locked = false; review ? nextReview() : nextRound(); }, 2600); }
    else if (review) { feedback(`No: ${expl} Otra vez.`, false); later(() => { locked = false; retry(); }, 3000); }
    else { recordError(tipo, expl); feedback(`No es correcto. ${expl}`, false); loseLife(() => { locked = false; nextRound(); }); }
  }
  const tramoBadge = (review, l) => (review ? badge("Repaso") : badge(`${l === 5 ? "Reto" : `Tramo ${l}`} · ${LEVEL_NAMES[l]} · ${roundIdx + 1} de ${ROUNDS[l]}`));
  const solText = (cs) => Array.from({ length: cs.n }, (_, r) => { const g = cs.sol.room.indexOf(r); return `${r + 1}: ${cs.names[g]}${cs.withPets ? ` (${cs.pets[cs.sol.pet[g]]})` : ""}`; }).join(" · ");
  const cluesHtml = (cs, list, cls = "") => `<div class="sos-clues" data-clues>${list.map((c, i) => `<div class="sos-clue ${cls}" data-clue-idx="${i}">${clueText(c, cs.names, cs.pets)}</div>`).join("")}</div>`;

  // ---- parrilla ----
  // grids: { room: matriz n×n de 0 (nada) / 1 (✗) / 2 (✓), pet: ídem o null }
  const emptyGrid = (n) => Array.from({ length: n }, () => new Array(n).fill(0));
  function gridHtml(cs, which, small) {
    const heads = which === "room" ? Array.from({ length: cs.n }, (_, i) => `${i + 1}`) : cs.pets;
    let out = `<div class="sos-grid ${small ? "sos-grid-sm" : ""}" data-grid="${which}" style="--sos-n:${cs.n}"><div class="sos-corner">${which === "room" ? "🚪" : "🐾"}</div>${heads.map((h) => `<div class="sos-colhead">${h}</div>`).join("")}`;
    for (let g = 0; g < cs.n; g++) {
      out += `<div class="sos-rowhead" data-g="${g}">${cs.names[g]}</div>`;
      for (let r = 0; r < cs.n; r++) out += `<button type="button" class="sos-cell" data-cell data-grid="${which}" data-g="${g}" data-r="${r}" aria-label="${cs.names[g]} · ${heads[r]}"></button>`;
    }
    return `${out}</div>`;
  }
  function paintGrid(which, grid) {
    body.querySelectorAll(`[data-cell][data-grid="${which}"]`).forEach((el) => {
      const v = grid[+el.dataset.g][+el.dataset.r];
      el.classList.toggle("sos-x", v === 1); el.classList.toggle("sos-v", v === 2);
      el.textContent = v === 1 ? "✗" : v === 2 ? "✓" : "";
    });
  }
  // Regla "una habitación por huésped": un ✓ tacha su fila y su columna; con autoRows, una fila con
  // una sola casilla libre se marca ✓; con autoCols, lo mismo para columnas. Devuelve si cambió algo.
  function propagate(grid, n, autoRows, autoCols) {
    let changed = false, again = true;
    while (again) {
      again = false;
      for (let g = 0; g < n; g++) for (let r = 0; r < n; r++) if (grid[g][r] === 2) {
        for (let k = 0; k < n; k++) { if (k !== r && grid[g][k] === 0) { grid[g][k] = 1; again = true; } if (k !== g && grid[k][r] === 0) { grid[k][r] = 1; again = true; } }
      }
      if (autoRows) for (let g = 0; g < n; g++) { const free = []; let has = false; for (let r = 0; r < n; r++) { if (grid[g][r] === 0) free.push(r); if (grid[g][r] === 2) has = true; } if (!has && free.length === 1) { grid[g][free[0]] = 2; again = true; } }
      if (autoCols) for (let r = 0; r < n; r++) { const free = []; let has = false; for (let g = 0; g < n; g++) { if (grid[g][r] === 0) free.push(g); if (grid[g][r] === 2) has = true; } if (!has && free.length === 1) { grid[free[0]][r] = 2; again = true; } }
      if (again) changed = true;
    }
    return changed;
  }
  const gridDone = (grid, n) => grid.every((row) => row.some((v) => v === 2));
  const attrOf = (a, which, g) => (which === "room" ? a.room[g] : a.pet[g]);
  const cellName = (cs, which, g, r) => (which === "room" ? `${cs.names[g]} en la ${r + 1}` : `${cs.names[g]} con el ${cs.pets[r]}`);
  // Parrilla de garabato (sin comprobación): toca para alternar nada → ✗ → ✓ → nada.
  function bindFreeGrid(cs, grids) {
    body.querySelectorAll("[data-cell]").forEach((el) => el.addEventListener("click", () => {
      if (locked || finished) return;
      const which = el.dataset.grid, g = +el.dataset.g, r = +el.dataset.r;
      grids[which][g][r] = (grids[which][g][r] + 1) % 3;
      paintGrid(which, grids[which]);
    }));
  }

  // ---- mapa ----
  function screenMap() {
    locked = false;
    const unlocked = Math.min((progress.nivelMax || 0) + 1, 5);
    const nodes = [1, 2, 3, 4, 5].map((l) => { const done = l <= (progress.nivelMax || 0), open = l <= unlocked; return `<button type="button" class="sos-node ${done ? "sos-node-done" : ""}" data-level="${l}" ${open ? "" : "disabled"}><span class="sos-node-num">${done ? "✓" : l === 5 ? "🎩" : l}</span><span class="sos-node-name">${LEVEL_NAMES[l]}</span></button>`; }).join("");
    body.innerHTML = `
      ${header("La pensión de los sospechosos", "Lee cada pista y tacha en la parrilla lo que descarta: cuando a un huésped solo le queda una habitación, la parrilla la marca sola")}
      <div class="sos-map">${nodes}</div>
      <div class="sos-actions"><button type="button" class="secondary" data-tutorial>Cómo se tacha (tutorial)</button></div>
      <p class="sos-progress">${progress.partidas ? `Partidas: ${progress.partidas}. Casos resueltos: ${progress.casos || 0}. Tramos superados: ${progress.nivelMax || 0} de 5.` : "Primera vez: mira el tutorial y empieza por el tramo 1."}</p>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-level]").forEach((b) => b.addEventListener("click", () => { roundIdx = 0; startLevel(Number(b.getAttribute("data-level"))); }));
    body.querySelector("[data-tutorial]").addEventListener("click", screenTutorial);
  }

  // ---- tutorial: 3×3 con una pista negativa, una directa y la tercera deducida ----
  function screenTutorial() {
    const cs = { n: 3, withPets: false, names: ["Ana", "Luis", "Marta"], pets: null, sol: { room: [1, 2, 0], pet: null } };
    const clues = [{ type: "neg", who: { kind: "g", i: 0 }, room: 0 }, { type: "dir", who: { kind: "g", i: 1 }, room: 2 }];
    const A = allAssignments(3, false);
    const grid = emptyGrid(3);
    let step = 0;
    body.innerHTML = `
      ${badge("Tutorial · cómo se tacha")}
      ${header("Tres huéspedes, tres habitaciones en fila (1-2-3): cada uno en una distinta", "Lee la pista y toca la casilla que descarta")}
      ${cluesHtml(cs, [clues[0]])}
      <div class="sos-count" data-count>Posibilidades: 6 (3 × 2 × 1 formas de repartir)</div>
      ${gridHtml(cs, "room", false)}
      <div class="sos-actions" data-actions></div>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-cell]").forEach((el) => el.addEventListener("click", () => {
      if (locked || finished) return;
      const g = +el.dataset.g, r = +el.dataset.r;
      if (step === 0) {
        if (g === 0 && r === 0) {
          grid[0][0] = 1; paintGrid("room", grid); step = 1;
          body.querySelector("[data-clues]").innerHTML += `<div class="sos-clue sos-clue-new" data-clue-idx="1">${clueText(clues[1], cs.names)}</div>`;
          body.querySelector("[data-count]").textContent = `Posibilidades: ${countSolutions([clues[0]], A)} (de 6)`;
          feedback("Eso es: tachada Ana-1. Ahora una pista directa: toca la casilla Luis-3 para marcarla con ✓.", true);
        } else feedback(`Esa casilla es ${cellName(cs, "room", g, r)}; la pista habla de Ana y de la habitación 1.`, false);
      } else if (step === 1) {
        if (g === 1 && r === 2) {
          grid[1][2] = 2; propagate(grid, 3, false, false); paintGrid("room", grid); step = 2; locked = true;
          body.querySelector("[data-count]").textContent = `Posibilidades: ${countSolutions(clues, A)} (de 6)`;
          feedback("✓ Luis-3. Una habitación por huésped: se tachan el resto de la fila de Luis y de la columna 3. Mira la fila de Ana…", true);
          later(() => {
            propagate(grid, 3, true, true); paintGrid("room", grid); award();
            feedback("A Ana solo le quedaba la 2 (✓ sola) y a Marta la 1: la tercera se deduce sin pista. Caso resuelto.", true);
            body.querySelector("[data-actions]").innerHTML = `<button type="button" class="primary" data-next>Al tramo 1 →</button>`;
            body.querySelector("[data-next]").addEventListener("click", () => { locked = false; roundIdx = 0; startLevel(1); }, { once: true });
          }, 1500);
        } else feedback(`Esa casilla es ${cellName(cs, "room", g, r)}; la pista dice que Luis está en la 3.`, false);
      }
    }));
  }

  // ---- tramos 1 y 2: tachar con justificación ----
  // Tramo 1: un atributo, las pistas se leen de una en una, auto-✓ en filas y columnas.
  // Tramo 2: huésped ↔ habitación ↔ mascota, todas las pistas a la vista, auto-✓ solo en filas.
  function screenTramo(l, review = false) {
    const cs = l === 1 ? genDirectasCase() : genDobleCase();
    const A = allAssignments(cs.n, cs.withPets);
    const progressive = l === 1;
    const tipo = l === 1 ? "tachón" : "tachón doble";
    const grids = { room: emptyGrid(cs.n), pet: cs.withPets ? emptyGrid(cs.n) : null };
    let read = progressive ? 1 : cs.clues.length;
    let mode = "x";
    let done = false;
    body.innerHTML = `
      ${tramoBadge(review, l)}
      ${header(l === 1 ? "Cuatro huéspedes, cuatro habitaciones en fila" : "Cuatro huéspedes, sus habitaciones y sus mascotas", l === 1 ? "Lee las pistas de una en una y tacha solo lo que ya puedas justificar" : "Todas las pistas a la vista: encadena lo que descartas en las dos parrillas")}
      ${cluesHtml(cs, cs.clues.slice(0, read))}
      ${progressive ? `<div class="sos-actions"><button type="button" class="secondary sos-next-clue" data-next-clue>Siguiente pista (${read} de ${cs.clues.length} leídas)</button></div>` : ""}
      ${l === 1 ? `<div class="sos-count" data-count></div>` : ""}
      <div class="sos-mode"><button type="button" class="sos-mode-btn sos-mode-on" data-mode="x">✗ Tachar</button><button type="button" class="sos-mode-btn" data-mode="v">✓ Marcar</button></div>
      ${gridHtml(cs, "room", cs.withPets)}
      ${cs.withPets ? gridHtml(cs, "pet", true) : ""}
      <div class="feedback" data-feedback></div>`;
    const compat = () => compatible(cs.clues.slice(0, read), A);
    const renderCount = () => { const el = body.querySelector("[data-count]"); if (el) el.textContent = `Posibilidades con lo leído: ${compat().length} (de ${A.length})`; };
    renderCount();
    const nextBtn = body.querySelector("[data-next-clue]");
    if (nextBtn) nextBtn.addEventListener("click", () => {
      if (locked || finished || read >= cs.clues.length) return;
      body.querySelector("[data-clues]").innerHTML += `<div class="sos-clue sos-clue-new" data-clue-idx="${read}">${clueText(cs.clues[read], cs.names, cs.pets)}</div>`;
      read++;
      if (read >= cs.clues.length) nextBtn.remove(); else nextBtn.textContent = `Siguiente pista (${read} de ${cs.clues.length} leídas)`;
      renderCount();
    });
    body.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => { mode = b.dataset.mode; body.querySelectorAll("[data-mode]").forEach((x) => x.classList.toggle("sos-mode-on", x === b)); }));
    const explain = (which, g, r, wantX) => {
      const truth = attrOf(cs.sol, which, g) === r;
      const name = cellName(cs, which, g, r);
      const list = (sub) => sub.map((c) => q(clueText(c, cs.names, cs.pets))).join(" + ");
      if (wantX && truth) return `${name} es verdad, no se puede tachar; lo fuerzan ${list(minimalForcing(cs.clues, A, (a) => attrOf(a, which, g) === r))}.`;
      if (wantX) return `todavía no se puede tachar ${name}: lo descarta ${list(minimalForcing(cs.clues, A, (a) => attrOf(a, which, g) !== r))}, que aún no habías leído.`;
      if (!truth) return `${name} es falso, no lleva ✓; lo descarta ${list(minimalForcing(cs.clues, A, (a) => attrOf(a, which, g) !== r))}.`;
      return `aún no está demostrado ${name}: hace falta ${list(minimalForcing(cs.clues, A, (a) => attrOf(a, which, g) === r))}, que aún no habías leído.`;
    };
    body.querySelectorAll("[data-cell]").forEach((el) => el.addEventListener("click", () => {
      if (locked || finished || done) return;
      const which = el.dataset.grid, g = +el.dataset.g, r = +el.dataset.r;
      const grid = grids[which];
      if (grid[g][r] !== 0) return;
      const S = compat();
      const wantX = mode === "x";
      const justified = wantX ? S.every((a) => attrOf(a, which, g) !== r) : S.every((a) => attrOf(a, which, g) === r);
      if (justified) {
        grid[g][r] = wantX ? 1 : 2;
        for (const w of ["room", "pet"]) if (grids[w]) { propagate(grids[w], cs.n, true, l === 1); paintGrid(w, grids[w]); }
        const solved = gridDone(grids.room, cs.n) && (!grids.pet || gridDone(grids.pet, cs.n));
        if (solved) {
          done = true; locked = true; award();
          feedback(`Caso resuelto: ${solText(cs)}.`, true);
          later(() => { locked = false; review ? nextReview() : nextRound(); }, 2600);
        } else feedback(wantX ? `Tachado ${cellName(cs, which, g, r)}.` : `✓ ${cellName(cs, which, g, r)}.`, true);
        return;
      }
      el.classList.add("sos-bad"); later(() => el.classList.remove("sos-bad"), 700);
      const expl = explain(which, g, r, wantX);
      locked = true;
      if (review) { feedback(`No: ${expl}`, false); later(() => { locked = false; }, 1500); }
      else { recordError(tipo, `${wantX ? "Tachaste" : "Marcaste"} ${cellName(cs, which, g, r)}: ${expl}`); feedback(`No: ${expl}`, false); lives--; renderLives(); if (lives <= 0) later(screenResults, 2800); else later(() => { locked = false; }, 1500); }
    }));
  }

  // ---- tramo 3: pide la pista ----
  function screenPide(review = false) {
    const cs = genPideCase();
    const A = allAssignments(4, false);
    const S = compatible(cs.clues, A);
    const grid = emptyGrid(4);
    for (let g = 0; g < 4; g++) for (let r = 0; r < 4; r++) { if (S.every((a) => a.room[g] !== r)) grid[g][r] = 1; else if (S.every((a) => a.room[g] === r)) grid[g][r] = 2; }
    body.innerHTML = `
      ${tramoBadge(review, 3)}
      ${header(`Con estas dos pistas quedan <b>${cs.k}</b> repartos posibles`, "Solo puedes pedir UNA pista más: elige la que deje un único reparto")}
      ${cluesHtml(cs, cs.clues)}
      <div class="sos-count" data-count>Posibilidades: ${cs.k} (de 24)</div>
      ${gridHtml(cs, "room", true)}
      <div class="sos-options">${cs.options.map((c, i) => `<button type="button" class="choice-btn sos-opt" data-clue="${i}">${clueText(c, cs.names)}</button>`).join("")}</div>
      <div class="feedback" data-feedback></div>`;
    paintGrid("room", grid);
    body.querySelectorAll("[data-clue]").forEach((btn) => btn.addEventListener("click", () => {
      if (locked || finished) return;
      const i = +btn.dataset.clue; const ok = cs.lefts[i] === 1;
      body.querySelectorAll("[data-clue]").forEach((x) => (x.disabled = true)); btn.classList.add(ok ? "correct" : "wrong");
      const detail = cs.options.map((c, j) => `${q(clueText(c, cs.names))} deja ${cs.lefts[j]}`).join("; ");
      const expl = `de los ${cs.k} repartos, ${detail}. Solución: ${solText(cs)}.`;
      outcome(ok, "pedir pista", expl, review, () => screenPide(true));
    }));
  }

  // ---- tramo 4: el testigo mentiroso ----
  function screenMentiroso(review = false) {
    const cs = genMentirosoCase();
    const A = allAssignments(4, false);
    const grids = { room: emptyGrid(4), pet: null };
    body.innerHTML = `
      ${tramoBadge(review, 4)}
      ${header("Cinco testimonios y uno miente", "Con los cinco el caso es imposible; quitando solo el falso queda un único reparto. ¿Cuál miente?")}
      <div class="sos-options sos-options-1">${cs.clues.map((c, i) => `<button type="button" class="choice-btn sos-opt sos-clue-btn" data-liar="${i}">${clueText(c, cs.names)}</button>`).join("")}</div>
      <p class="sos-hint">Parrilla de apuntes (toca para alternar ✗ / ✓; aquí no se comprueba):</p>
      ${gridHtml(cs, "room", true)}
      <div class="feedback" data-feedback></div>`;
    bindFreeGrid(cs, grids);
    body.querySelectorAll("[data-liar]").forEach((btn) => btn.addEventListener("click", () => {
      if (locked || finished) return;
      const i = +btn.dataset.liar; const ok = i === cs.liar;
      body.querySelectorAll("[data-liar]").forEach((x) => (x.disabled = true)); btn.classList.add(ok ? "correct" : "wrong");
      const liarTxt = q(clueText(cs.clues[cs.liar], cs.names));
      let expl = `miente ${liarTxt}: sin ella queda un único reparto (${solText(cs)}) y con ella ninguno.`;
      if (!ok) { const left = countSolutions(cs.clues.filter((_, j) => j !== i), A); expl = `quitando ${q(clueText(cs.clues[i], cs.names))} ${left === 0 ? "sigue sin haber ningún reparto posible" : `quedan ${left} repartos`}; ${expl}`; }
      outcome(ok, "mentiroso", expl, review, () => screenMentiroso(true));
    }));
  }

  // ---- reto: el caso completo (sin vidas, sin auto-tachado) ----
  function screenReto(review = false) {
    const cs = genRetoCase();
    const grids = { room: emptyGrid(4), pet: emptyGrid(4) };
    const sel = { g: -1, r: -1, p: -1 };
    const t = cs.target;
    const ask = t.kind === "g" ? `Acusa a <b>${cs.names[t.i]}</b>: ¿en qué habitación está y qué mascota tiene?` : t.kind === "r" ? `El ladrón duerme en la habitación <b>${t.i + 1}</b>: ¿quién es y qué mascota tiene?` : `El ladrón es quien tiene el <b>${cs.pets[t.i]}</b>: ¿quién es y en qué habitación está?`;
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Reto · ${LEVEL_NAMES[5]} · ${roundIdx + 1} de ${ROUNDS[5]}`)}
      ${header(ask, "Aquí no se pierden vidas ni la parrilla ayuda: toca huésped, habitación y mascota y acusa")}
      ${cluesHtml(cs, cs.clues)}
      ${gridHtml(cs, "room", true)}
      ${gridHtml(cs, "pet", true)}
      <div class="sos-accuse" data-target-kind="${t.kind}" data-target-idx="${t.i}">
        <div class="sos-accuse-row">${cs.names.map((nm, i) => `<button type="button" class="sos-accuse-btn" data-accuse="g:${i}">${nm}</button>`).join("")}</div>
        <div class="sos-accuse-row">${[0, 1, 2, 3].map((i) => `<button type="button" class="sos-accuse-btn" data-accuse="r:${i}">🚪 ${i + 1}</button>`).join("")}</div>
        <div class="sos-accuse-row">${cs.pets.map((p, i) => `<button type="button" class="sos-accuse-btn" data-accuse="p:${i}">${p}</button>`).join("")}</div>
        <div class="sos-actions"><button type="button" class="primary" data-accuse-go disabled>Acusar</button></div>
      </div>
      <div class="feedback" data-feedback></div>`;
    bindFreeGrid(cs, grids);
    const go = body.querySelector("[data-accuse-go]");
    body.querySelectorAll("[data-accuse]").forEach((b) => b.addEventListener("click", () => {
      if (locked || finished) return;
      const [k, i] = b.dataset.accuse.split(":"); sel[k] = +i;
      body.querySelectorAll(`[data-accuse^="${k}:"]`).forEach((x) => x.classList.toggle("sos-accuse-sel", x === b));
      go.disabled = !(sel.g >= 0 && sel.r >= 0 && sel.p >= 0);
    }));
    go.addEventListener("click", () => {
      if (locked || finished || go.disabled) return;
      locked = true; go.disabled = true;
      const tripleOk = cs.sol.room[sel.g] === sel.r && cs.sol.pet[sel.g] === sel.p;
      const hasTarget = (t.kind === "g" && sel.g === t.i) || (t.kind === "r" && sel.r === t.i) || (t.kind === "p" && sel.p === t.i);
      const ok = tripleOk && hasTarget;
      const expl = `acusaste a ${cs.names[sel.g]} en la ${sel.r + 1} con el ${cs.pets[sel.p]}; el reparto real es ${solText(cs)}.`;
      if (ok) { award(); feedback(`¡Caso cerrado! ${expl}`, true); }
      else { recordError("acusación", expl.charAt(0).toUpperCase() + expl.slice(1)); feedback(`No: ${expl}`, false); }
      later(() => { locked = false; review ? nextReview() : nextRound(); }, 3200);
    });
  }

  // ---- resultados y repaso ----
  function screenResults() {
    locked = false; // si se llegó aquí sin vidas, outcome() dejó locked = true y el repaso quedaría bloqueado
    const byType = {};
    errors.forEach((e) => { byType[e.tipo] = (byType[e.tipo] || 0) + 1; });
    progress = { nivelMax: Math.max(progress.nivelMax || 0, levelReached), fallosPorTipo: { ...(progress.fallosPorTipo || {}) }, partidas: (progress.partidas || 0) + 1, casos: progress.casos || 0 };
    Object.entries(byType).forEach(([t, v]) => { progress.fallosPorTipo[t] = (progress.fallosPorTipo[t] || 0) + v; });
    saveProgress(client, progress);
    const items = errors.length ? `<ul class="sos-errors">${errors.map((e) => `<li><b>${e.tipo}:</b> ${e.explicacion}</li>`).join("")}</ul>` : `<p class="sos-progress">Sin fallos: no tachaste nada que las pistas no justificaran.</p>`;
    body.innerHTML = `
      ${header("Resultados", `${rounds} aciertos · tramos ${Math.max(levelReached, progress.nivelMax || 0)} de 5`)}
      <div class="sos-learned">Cada pista descarta casillas; un ✓ tacha su fila y su columna, y una fila con una sola casilla libre se cierra sola. Contar cuántos repartos quedan (24 → 6 → 2 → 1) dice cuánto vale una pista, y un testimonio que deja el caso sin ningún reparto posible es el que miente.</div>
      ${items}
      <div class="sos-actions">${errors.length ? '<button type="button" class="primary" data-review>Repasar lo fallado</button>' : ""}<button type="button" class="secondary" data-end>Terminar</button></div>`;
    const rv = body.querySelector("[data-review]");
    if (rv) rv.addEventListener("click", () => { reviewQueue = [...new Set(errors.map((e) => e.tipo))]; nextReview(); });
    body.querySelector("[data-end]").addEventListener("click", () => finish(false));
  }
  function nextReview() {
    const tipo = reviewQueue.shift();
    if (!tipo) { finish(false); return; }
    ({ "tachón": () => screenTramo(1, true), "tachón doble": () => screenTramo(2, true), "pedir pista": () => screenPide(true), "mentiroso": () => screenMentiroso(true), "acusación": () => screenReto(true) }[tipo] || nextReview)();
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "sospechosos", { score, rounds });
    body.innerHTML = `
      <div class="end-card"><div>🎩</div><div class="big-score">${score} pts</div><p>${rounds} aciertos · tramos ${Math.max(levelReached, progress.nivelMax || 0)} de 5</p>
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
