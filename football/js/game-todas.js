// "Todas las formas": la inversión del típico "¿cuánto es 7 + 8?". Aquí
// se da el RESULTADO y hay que encontrar TODAS las parejas de cartas de
// la mesa que lo forman (sumando o multiplicando). La ronda no termina
// hasta tener las 3, 4 o 5 parejas, así que el niño no puede parar en la
// primera descomposición que se le ocurra: tiene que barrer la mesa.
// La mesa se genera controlando el número exacto de parejas válidas y
// con todos los valores distintos, para que no haya ninguna ambigüedad.
import { randInt, pick, shuffle, clamp, saveScore } from "./utils.js";

const LEVELS = [
  { kind: "sum", tmin: 10, tmax: 18, pairs: 3 },
  { kind: "sum", tmin: 14, tmax: 26, pairs: 4 },
  { kind: "mix", tmin: 20, tmax: 40, pairs: 5, mulPairs: 3 },
  { kind: "mul", pairs: 4 },
];
const MUL_TARGETS = [24, 36, 48, 60, 72, 84, 90, 96, 120, 144];

export function levelForStreak(streak) {
  return clamp(Math.floor(streak / 3), 0, LEVELS.length - 1);
}

// Cuantas más parejas, menos señuelos: la mesa nunca pasa de 11 cartas
// para que se vea entera en 400 px.
function decoyCount(k) {
  return clamp(11 - 2 * k, 1, 3);
}

// Todas las parejas de cartas (valores distintos) que dan el objetivo.
export function allPairs(cards, target, mode) {
  const out = [];
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const hit = mode === "sum" ? cards[i] + cards[j] === target : cards[i] * cards[j] === target;
      if (hit) out.push([Math.min(cards[i], cards[j]), Math.max(cards[i], cards[j])]);
    }
  }
  return out;
}

function makeSumRound(tmin, tmax, k) {
  let guard = 0;
  while (guard++ < 300) {
    const target = randInt(tmin, tmax);
    const half = Math.ceil(target / 2);
    const lows = [];
    for (let v = 2; v < half; v++) lows.push(v); // desde 2: el 1 es un atajo tonto
    if (lows.length < k) continue;
    // Cada "bajo" trae su complemento, que por ser mayor que la mitad
    // nunca choca con otro bajo: los 2k valores salen distintos solos.
    const cards = [];
    shuffle(lows).slice(0, k).forEach((v) => { cards.push(v, target - v); });
    // Señuelos: no pueden emparejarse con nada de lo que ya hay.
    const wanted = cards.length + decoyCount(k);
    let dguard = 0;
    while (cards.length < wanted && dguard++ < 300) {
      const d = randInt(2, target + 8);
      if (cards.includes(d)) continue;
      if (cards.includes(target - d)) continue;
      if (d * 2 === target) continue; // se emparejaría consigo mismo
      cards.push(d);
    }
    if (cards.length < wanted) continue;
    const pairs = allPairs(cards, target, "sum");
    if (pairs.length !== k) continue;
    return { mode: "sum", target, cards: shuffle(cards), pairs };
  }
  return null;
}

function lowDivisors(target) {
  const out = [];
  for (let d = 2; d * d < target; d++) if (target % d === 0) out.push(d);
  return out;
}

function makeMulRound(k) {
  const usable = MUL_TARGETS.filter((t) => lowDivisors(t).length >= k);
  let guard = 0;
  while (guard++ < 300 && usable.length) {
    const target = pick(usable);
    const cards = [];
    shuffle(lowDivisors(target)).slice(0, k).forEach((d) => { cards.push(d, target / d); });
    const wanted = cards.length + decoyCount(k);
    let dguard = 0;
    while (cards.length < wanted && dguard++ < 300) {
      const d = randInt(2, Math.floor(target / 2));
      if (cards.includes(d)) continue;
      if (target % d === 0 && (cards.includes(target / d) || d * d === target)) continue;
      cards.push(d);
    }
    if (cards.length < wanted) continue;
    const pairs = allPairs(cards, target, "mul");
    if (pairs.length !== k) continue;
    return { mode: "mul", target, cards: shuffle(cards), pairs };
  }
  return null;
}

export function makeTodasRound(streak) {
  const level = levelForStreak(streak);
  const lvl = LEVELS[level];
  let round = null;
  if (lvl.kind === "sum") round = makeSumRound(lvl.tmin, lvl.tmax, lvl.pairs);
  else if (lvl.kind === "mul") round = makeMulRound(lvl.pairs);
  else round = randInt(1, 10) <= 4 ? makeMulRound(lvl.mulPairs) : makeSumRound(lvl.tmin, lvl.tmax, lvl.pairs);
  if (!round) {
    // Caso fijo de emergencia: 12 con 2+10, 3+9 y 4+8 (ni 5, ni 11, ni 21).
    const cards = [2, 10, 3, 9, 4, 8, 5, 11, 21];
    round = { mode: "sum", target: 12, cards: shuffle(cards), pairs: allPairs(cards, 12, "sum") };
  }
  round.level = level;
  return round;
}

function pairText(p, mode) {
  return `${p[0]} ${mode === "sum" ? "+" : "×"} ${p[1]}`;
}

export function mountTodasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let locked = false;
  let round = null;
  let found = []; // parejas ya encontradas, como claves "a-b"
  let pick1 = null; // índice de la primera carta tocada
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
  function key(a, b) {
    return `${Math.min(a, b)}-${Math.max(a, b)}`;
  }

  function nextRound() {
    round = makeTodasRound(streak);
    found = [];
    pick1 = null;
    locked = false;
    const verb = round.mode === "sum" ? "suman" : "multiplican";

    body.innerHTML = `
      <p class="prompt">Todas las parejas que <b>${verb} ${round.target}</b><small>Hay ${round.pairs.length} — toca dos cartas</small></p>
      <div class="td-counter" data-counter></div>
      <div class="td-grid" data-grid></div>
      <div class="td-found" data-found></div>
      <div class="feedback" data-feedback></div>
    `;
    renderGrid();
    renderCounter();
  }

  function say(text, kind) {
    const el = body.querySelector("[data-feedback]");
    if (!el) return;
    el.innerHTML = text;
    el.className = `feedback${kind ? ` ${kind}` : ""}`;
  }

  function renderCounter() {
    body.querySelector("[data-counter]").textContent =
      `${found.length} de ${round.pairs.length} encontradas`;
    body.querySelector("[data-found]").innerHTML = found
      .map((k) => `<span class="td-chip">${k.split("-").join(round.mode === "sum" ? " + " : " × ")}</span>`)
      .join("");
  }

  function isFound(value) {
    return found.some((k) => k.split("-").map(Number).includes(value));
  }

  function renderGrid() {
    const grid = body.querySelector("[data-grid]");
    grid.innerHTML = "";
    round.cards.forEach((value, idx) => {
      const btn = document.createElement("button");
      const done = isFound(value);
      btn.className = `td-card${done ? " found" : ""}${pick1 === idx ? " sel" : ""}`;
      btn.type = "button";
      btn.textContent = value;
      btn.disabled = locked || done;
      btn.addEventListener("click", () => tap(idx));
      grid.appendChild(btn);
    });
  }

  function tap(idx) {
    if (finished || locked) return;
    if (pick1 === null) {
      pick1 = idx;
      say("");
      renderGrid();
      return;
    }
    if (pick1 === idx) { // mismo toque: se suelta la carta
      pick1 = null;
      renderGrid();
      return;
    }
    const firstIdx = pick1;
    const a = round.cards[firstIdx];
    const b = round.cards[idx];
    const value = round.mode === "sum" ? a + b : a * b;
    const sign = round.mode === "sum" ? "+" : "×";
    pick1 = null;

    if (value === round.target) {
      const k = key(a, b);
      if (found.includes(k)) { // no puede pasar (las cartas se bloquean), red de seguridad
        renderGrid();
        return;
      }
      found.push(k);
      renderGrid();
      renderCounter();
      if (found.length === round.pairs.length) {
        locked = true;
        rounds++;
        streak++;
        score += 10;
        renderScore();
        renderGrid();
        say(`¡Las ${round.pairs.length} parejas de ${round.target}!`, "ok");
        later(nextRound, 1200);
      } else {
        say(`¡Bien! ${a} ${sign} ${b} = ${round.target}. Faltan ${round.pairs.length - found.length}`, "ok");
      }
      return;
    }

    // Al fallar se ve POR QUÉ: la cuenta que sale de verdad.
    lives--;
    renderLives();
    say(`${a} ${sign} ${b} = ${value}, y buscamos ${round.target}`, "bad");
    const grid = body.querySelector("[data-grid]");
    [grid.children[firstIdx], grid.children[idx]].forEach((n) => n && n.classList.add("wrong"));
    if (lives <= 0) {
      locked = true;
      rounds++;
      streak = 0;
      renderGrid();
      showMissing();
      return later(() => finish(false), 3200);
    }
    later(() => { renderGrid(); }, 600);
  }

  function showMissing() {
    const missing = round.pairs.filter((p) => !found.includes(key(p[0], p[1])));
    const list = missing.map((p) => `${pairText(p, round.mode)}`).join(" · ");
    say(`Faltaban: <b>${list}</b>`, "bad");
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "todas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🃏</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} mesas jugadas</p>
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
