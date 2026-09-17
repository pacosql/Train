// "Cifras": cinco números y un objetivo. Se combinan dos números con
// + − × ÷ y el resultado SE QUEDA en la mesa como número nuevo, gastando
// los dos operandos (como el concurso Cifras y Letras y como Digits del
// NYT). El objetivo se construye hacia delante encadenando operaciones
// reales sobre los números dados, así que siempre existe solución, y se
// confirma con un resolutor por fuerza bruta que además da la solución
// más corta para enseñarla al fallar.
import { randInt, pick, shuffle, clamp, saveScore } from "./utils.js";

const OPS = ["+", "-", "*", "/"];
const SIGN = { "+": "+", "-": "−", "*": "×", "/": "÷" };
const MAX_VALUE = 1000; // por encima de esto los números dejan de ser manejables

// Configuración por nivel: cuántas operaciones encadena el generador,
// en qué rango cae el objetivo y de dónde sale el número "grande".
const LEVELS = [
  { chain: 2, min: 15, max: 60, bigs: [5, 6, 7, 8, 9, 10] },
  { chain: 3, min: 20, max: 120, bigs: [10, 12, 15, 20] },
  { chain: 3, min: 30, max: 250, bigs: [15, 20, 25, 50] },
  { chain: 4, min: 40, max: 400, bigs: [25, 50, 75, 100] },
];

export function levelForStreak(streak) {
  return clamp(Math.floor(streak / 2), 0, LEVELS.length - 1);
}

// a OP b como número entero válido, o null si la operación no vale:
// división no exacta, resultado 0 o negativo, o fuera de rango.
function apply(op, a, b) {
  let r;
  if (op === "+") r = a + b;
  else if (op === "-") r = a - b;
  else if (op === "*") r = a * b;
  else r = b !== 0 && a % b === 0 ? a / b : null;
  if (r === null || r <= 0 || r > MAX_VALUE) return null;
  return r;
}

// Las parejas de operandos a probar: + y × son conmutativas, − y ÷ no.
function orders(op, a, b) {
  return op === "+" || op === "*" ? [[a, b]] : [[a, b], [b, a]];
}

function stateKey(nums) {
  return nums.slice().sort((x, y) => x - y).join(",");
}

// Resolutor por fuerza bruta: explora por niveles todos los estados que
// se pueden alcanzar combinando dos números de la mesa (con memoria de
// estados ya vistos) y devuelve la solución MÁS CORTA como lista de
// pasos {x, op, y, r}, o null si el objetivo es inalcanzable.
export function solveCifras(nums, target, maxDepth = 4) {
  if (nums.includes(target)) return [];
  let frontier = [{ nums: nums.slice(), steps: [] }];
  const seen = new Set([stateKey(nums)]);
  for (let depth = 0; depth < maxDepth; depth++) {
    const next = [];
    for (const node of frontier) {
      const list = node.nums;
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const rest = list.filter((_, k) => k !== i && k !== j);
          for (const op of OPS) {
            for (const [x, y] of orders(op, list[i], list[j])) {
              const r = apply(op, x, y);
              if (r === null) continue;
              const steps = node.steps.concat([{ x, op, y, r }]);
              if (r === target) return steps;
              const child = rest.concat([r]);
              const key = stateKey(child);
              if (seen.has(key)) continue;
              seen.add(key);
              next.push({ nums: child, steps });
            }
          }
        }
      }
    }
    frontier = next;
    if (!frontier.length) break;
  }
  return null;
}

// Genera una ronda: números, objetivo alcanzable y solución mínima.
export function makeCifrasRound(streak) {
  const level = levelForStreak(streak);
  const lvl = LEVELS[level];
  let guard = 0;
  while (guard++ < 200) {
    const nums = [randInt(1, 10), randInt(1, 10), randInt(1, 10), randInt(1, 10), pick(lvl.bigs)];
    const order = shuffle(nums);
    // Cadena hacia delante sobre los números dados: el objetivo nace de
    // operaciones que de verdad se pueden hacer.
    let acc = order[0];
    let broken = false;
    for (let i = 1; i <= lvl.chain; i++) {
      const b = order[i];
      const options = [];
      for (const op of OPS) {
        for (const [x, y] of orders(op, acc, b)) {
          const r = apply(op, x, y);
          if (r === null) continue;
          if (r === x || r === y) continue; // ×1 y ÷1 no aportan nada
          options.push(r);
        }
      }
      if (!options.length) { broken = true; break; }
      acc = pick(options);
    }
    if (broken) continue;
    const target = acc;
    if (target < lvl.min || target > lvl.max) continue;
    if (nums.includes(target)) continue; // sin operar no vale
    const solution = solveCifras(nums, target, lvl.chain);
    if (!solution || solution.length < 2) continue; // que cueste al menos dos jugadas
    return { nums, target, solution, level };
  }
  // Caso fijo de emergencia, siempre resoluble: (10 + 2) × 4 = 48.
  const nums = [2, 3, 4, 5, 10];
  return { nums, target: 48, solution: solveCifras(nums, 48, 4) || [], level };
}

function stepText(s) {
  return `${s.x} ${SIGN[s.op]} ${s.y} = ${s.r}`;
}

export function mountCifrasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let locked = false; // bloquea la mesa mientras se resuelve la ronda
  let round = null;
  let tiles = []; // [{id, value}] números disponibles ahora mismo
  let history = []; // pila de estados para deshacer
  let trail = []; // operaciones hechas, para el rastro en pantalla
  let selId = null;
  let selOp = null;
  let nextId = 0;
  const timers = [];

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");

  function later(fn, ms) {
    timers.push(setTimeout(() => { if (!finished) fn(); }, ms));
  }
  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function nextRound() {
    round = makeCifrasRound(streak);
    nextId = 0;
    tiles = round.nums.map((v) => ({ id: nextId++, value: v }));
    history = [];
    trail = [];
    selId = null;
    selOp = null;
    locked = false;

    body.innerHTML = `
      <p class="prompt">Llega justo a <b>${round.target}</b><small>Toca un número, una operación y otro número</small></p>
      <div class="cf-tiles" data-tiles></div>
      <div class="cf-ops" data-ops></div>
      <div class="cf-trail" data-trail></div>
      <div class="feedback" data-feedback></div>
      <div class="cf-actions">
        <button class="secondary" data-reset>↺ Reiniciar</button>
        <button class="secondary" data-undo>↶ Deshacer</button>
        <button class="secondary" data-give>Ver solución</button>
      </div>
    `;
    const opsEl = body.querySelector("[data-ops]");
    OPS.forEach((op) => {
      const btn = document.createElement("button");
      btn.className = "cf-op";
      btn.type = "button";
      btn.textContent = SIGN[op];
      btn.addEventListener("click", () => tapOp(op));
      opsEl.appendChild(btn);
    });
    body.querySelector("[data-reset]").addEventListener("click", resetRound);
    body.querySelector("[data-undo]").addEventListener("click", undo);
    body.querySelector("[data-give]").addEventListener("click", () => giveUp());
    renderBoard();
  }

  function say(text, kind) {
    const el = body.querySelector("[data-feedback]");
    if (!el) return;
    el.innerHTML = text;
    el.className = `feedback${kind ? ` ${kind}` : ""}`;
  }

  function renderBoard() {
    const tilesEl = body.querySelector("[data-tiles]");
    tilesEl.innerHTML = "";
    tiles.forEach((t) => {
      const btn = document.createElement("button");
      btn.className = `cf-tile${t.id === selId ? " sel" : ""}${t.fresh ? " fresh" : ""}`;
      btn.type = "button";
      btn.textContent = t.value;
      btn.disabled = locked;
      btn.addEventListener("click", () => tapTile(t.id));
      tilesEl.appendChild(btn);
    });
    body.querySelectorAll(".cf-op").forEach((btn) => {
      btn.classList.toggle("sel", btn.textContent === SIGN[selOp]);
      btn.disabled = locked;
    });
    const trailEl = body.querySelector("[data-trail]");
    trailEl.innerHTML = trail.length
      ? trail.map((s) => `<span class="cf-step">${stepText(s)}</span>`).join("")
      : `<span class="cf-hint">Cada resultado se queda en la mesa</span>`;
    body.querySelector("[data-undo]").disabled = locked || !history.length;
    body.querySelector("[data-reset]").disabled = locked || !history.length;
    body.querySelector("[data-give]").disabled = locked;
  }

  function snapshot() {
    history.push({ tiles: tiles.map((t) => ({ id: t.id, value: t.value })), trail: trail.slice() });
  }

  function tapTile(id) {
    if (finished || locked) return;
    if (selId === null) {
      selId = id;
      renderBoard();
      return;
    }
    if (selId === id) { // segundo toque en la misma ficha: se suelta
      selId = null;
      renderBoard();
      return;
    }
    if (!selOp) {
      selId = id; // aún no hay operación: cambiamos de primer número
      renderBoard();
      return;
    }
    combine(selId, selOp, id);
  }

  function tapOp(op) {
    if (finished || locked) return;
    if (selId === null) {
      say("Primero toca un número", "bad");
      return;
    }
    selOp = selOp === op ? null : op;
    say("");
    renderBoard();
  }

  function combine(idA, op, idB) {
    const a = tiles.find((t) => t.id === idA);
    const b = tiles.find((t) => t.id === idB);
    if (!a || !b) return;
    const r = apply(op, a.value, b.value);
    if (r === null) {
      if (op === "/" && b.value !== 0 && a.value % b.value !== 0) {
        say(`${a.value} ÷ ${b.value} no es exacta (sobra ${a.value % b.value})`, "bad");
      } else if (op === "-") {
        say(`${a.value} − ${b.value} no es un número positivo`, "bad");
      } else {
        say("Ese resultado no vale (pasa de 1000)", "bad");
      }
      return;
    }
    snapshot();
    trail = trail.concat([{ x: a.value, op, y: b.value, r }]);
    tiles = tiles.filter((t) => t.id !== idA && t.id !== idB);
    tiles.forEach((t) => { t.fresh = false; });
    tiles.push({ id: nextId++, value: r, fresh: true });
    selId = null;
    selOp = null;

    if (r === round.target) {
      locked = true;
      rounds++;
      streak++;
      score += 10;
      renderScore();
      renderBoard();
      say(`¡${round.target} justo! ${trail.map(stepText).join(" · ")}`, "ok");
      later(nextRound, 1200);
      return;
    }
    renderBoard();
    if (tiles.length === 1) {
      // Sin números que combinar ya no hay jugada posible.
      fail(`Te has quedado con ${tiles[0].value} y no hay más números`);
      return;
    }
    say(`Ahora tienes ${r} en la mesa`);
  }

  function resetRound() {
    if (finished || locked || !history.length) return;
    const first = history[0];
    tiles = first.tiles.map((t) => ({ id: t.id, value: t.value }));
    trail = first.trail.slice();
    history = [];
    selId = null;
    selOp = null;
    say("Mesa como al principio");
    renderBoard();
  }

  function undo() {
    if (finished || locked || !history.length) return;
    const prev = history.pop();
    tiles = prev.tiles.map((t) => ({ id: t.id, value: t.value }));
    trail = prev.trail.slice();
    selId = null;
    selOp = null;
    say("");
    renderBoard();
  }

  function giveUp() {
    if (finished || locked) return;
    fail("Solución:");
  }

  // Al fallar se ve POR QUÉ: la solución mínima, paso a paso.
  function fail(reason) {
    locked = true;
    rounds++;
    streak = 0;
    lives--;
    renderLives();
    renderBoard();
    const steps = round.solution.length
      ? round.solution.map(stepText).join(" → ")
      : `${round.target}`;
    say(`${reason}<br><b>${steps}</b>`, "bad");
    if (lives <= 0) return later(() => finish(false), 3000);
    later(nextRound, 3000);
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "cifras", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔢</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} objetivos jugados</p>
        <div class="end-actions">
          <button class="primary" data-retry>Jugar otra vez</button>
          <button class="secondary" data-menu>Volver al menú</button>
        </div>
      </div>
    `;
    body.querySelector("[data-retry]").addEventListener("click", start);
    body.querySelector("[data-menu]").addEventListener("click", onExit);
  }

  function start() {
    lives = startLives;
    score = 0;
    rounds = 0;
    streak = 0;
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    timers.forEach(clearTimeout);
  };
}
