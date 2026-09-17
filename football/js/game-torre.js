// #49 "Construye la torre" (Comparación) — REHECHO.
// Antes: todos los bloques valían 1, así que "apilar" era darle N veces a
// un contador — cambiar las mates por cualquier otra pregunta habría dado
// el mismo juego, y sólo había 15 rondas distintas posibles.
// Ahora: la bandeja trae piezas CONCRETAS de valores distintos y de un solo
// uso, y cada pieza mide en pantalla exactamente lo que vale. Alcanzar la
// altura pedida obliga a descomponer el número en las piezas que hay (no
// existe la pieza "+1" infinita), y la relación con el modelo —doble,
// mitad, triple, tantos menos— hay que calcularla antes de apilar. Cada
// ronda tiene una única combinación válida, comprobada por fuerza bruta.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const UNIT = 12;       // px de alto por unidad de valor
const MAX_STACK = 18;  // tope físico: por encima la torre no cabe
const MAX_TARGET = 15;

export function torreLevelFor(streak) {
  return streak >= 5 ? 2 : streak >= 2 ? 1 : 0;
}

// Relaciones con el modelo. Cada una devuelve el modelo, la altura pedida
// y la cuenta escrita, que es lo que se muestra al fallar.
function relIgual() {
  const n = randInt(4, 12);
  return { id: "igual", model: n, target: n, text: "igual de alta", how: `el modelo mide ${n} → ${n}` };
}
function relMas(dmin, dmax) {
  return () => {
    const n = randInt(3, 9);
    const d = randInt(dmin, dmax);
    return { id: `mas${d}`, model: n, target: n + d, text: `${d} más alta`, how: `${n} + ${d} = ${n + d}` };
  };
}
function relMenos(dmin, dmax) {
  return () => {
    const n = randInt(7, 14);
    const d = randInt(dmin, dmax);
    return { id: `menos${d}`, model: n, target: n - d, text: `${d} más baja`, how: `${n} − ${d} = ${n - d}` };
  };
}
function relDoble() {
  const n = randInt(3, 7);
  return { id: "doble", model: n, target: n * 2, text: "el doble de alta", how: `${n} × 2 = ${n * 2}` };
}
function relTriple() {
  const n = randInt(2, 5);
  return { id: "triple", model: n, target: n * 3, text: "el triple de alta", how: `${n} × 3 = ${n * 3}` };
}
function relMitad() {
  const n = 2 * randInt(3, 7);
  return { id: "mitad", model: n, target: n / 2, text: "la mitad de alta", how: `${n} ÷ 2 = ${n / 2}` };
}

const REL_LEVELS = [
  [relIgual, relMas(2, 3)],
  [relIgual, relDoble, relMas(3, 5), relMenos(2, 3)],
  [relDoble, relTriple, relMitad, relMas(4, 6), relMenos(3, 4)],
];

// Cuántos subconjuntos de piezas suman `target` (fuerza bruta: como mucho
// 6 piezas, 63 combinaciones). Es la garantía de solución única.
export function countSubsets(pieces, target) {
  let n = 0;
  const total = 1 << pieces.length;
  for (let m = 1; m < total; m++) {
    let s = 0;
    for (let i = 0; i < pieces.length; i++) if (m & (1 << i)) s += pieces[i];
    if (s === target) n++;
  }
  return n;
}

// Parte `target` en `n` valores DISTINTOS de 1 a 9 (valores repetidos
// harían indistinguibles dos soluciones).
function distinctPartition(target, n) {
  for (let t = 0; t < 80; t++) {
    const vals = [];
    let rest = target;
    let ok = true;
    for (let i = 0; i < n - 1; i++) {
      const left = n - 1 - i; // piezas que aún quedan por poner, incluida la última
      const hi = Math.min(9, rest - left);
      if (hi < 1) { ok = false; break; }
      const v = randInt(1, hi);
      vals.push(v);
      rest -= v;
    }
    if (!ok || rest < 1 || rest > 9) continue;
    vals.push(rest);
    if (new Set(vals).size === vals.length) return vals;
  }
  return null;
}

// Bandeja jugable: la solución usa 2 o 3 piezas (nunca una sola, que sería
// un toque), sobran piezas sin usar y no hay ninguna otra combinación que
// sume lo pedido.
function makeTray(target) {
  const solSize = target >= 10 ? pick([2, 3, 3]) : pick([2, 2, 3]);
  const sol = distinctPartition(target, solSize);
  if (!sol) return null;
  const free = [];
  for (let v = 1; v <= 9; v++) if (!sol.includes(v)) free.push(v);
  const extrasCount = randInt(2, 3);
  if (free.length < extrasCount) return null;
  const extras = shuffle(free).slice(0, extrasCount);
  const pieces = shuffle(sol.concat(extras));
  if (countSubsets(pieces, target) !== 1) return null;
  return { pieces, sol: sol.slice().sort((a, b) => b - a) };
}

function tryTorre(level) {
  const rel = pick(REL_LEVELS[level])();
  if (rel.target < 3 || rel.target > MAX_TARGET) return null;
  if (rel.model < 2 || rel.model > 14) return null;
  const tray = makeTray(rel.target);
  if (!tray) return null;
  return {
    model: rel.model,
    target: rel.target,
    text: rel.text,
    how: rel.how,
    pieces: tray.pieces,
    sol: tray.sol,
    key: `${rel.id}|${rel.model}`,
  };
}

// Reserva determinista: con piezas 1-2-4-8 toda altura tiene una única
// descomposición (es el binario), así que siempre es una ronda legal.
function fallbackTorre() {
  return {
    model: 6, target: 6, text: "igual de alta", how: "el modelo mide 6 → 6",
    pieces: [4, 1, 8, 2], sol: [4, 2], key: "reserva",
  };
}

export function makeTorreRound(streak, lastKey) {
  const level = torreLevelFor(streak);
  let cand = null;
  let guard = 0;
  do {
    cand = tryTorre(level);
    guard++;
  } while ((!cand || cand.key === lastKey) && guard < 400);
  return cand && cand.key !== lastKey ? cand : fallbackTorre();
}

export function mountTorreGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let timers = [];
  let round = null;
  let used = [];  // índices de las piezas que están en la torre, en orden
  let locked = false;

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
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function sumUsed() {
    return used.reduce((t, i) => t + round.pieces[i], 0);
  }

  function nextRound() {
    round = makeTorreRound(streak, round ? round.key : "");
    used = [];
    locked = false;

    body.innerHTML = `
      <div class="tw-wrap">
        <p class="prompt tw-prompt">Hazla <b>${round.text}</b> que el modelo<small>cada pieza mide lo que vale — sólo hay una combinación posible</small></p>
        <div class="tw-arena">
          <div class="tw-col">
            <div class="tw-stack" data-model></div>
            <span class="tw-label">Modelo <b>${round.model}</b></span>
          </div>
          <div class="tw-col">
            <div class="tw-stack tw-mine" data-mine>
              <span class="tw-guide" data-guide><i>${round.model}</i></span>
            </div>
            <span class="tw-label">Tu torre <b data-sum>0</b></span>
          </div>
        </div>
        <div class="tw-tray" data-tray></div>
        <div class="feedback" data-feedback></div>
        <div class="tw-why" data-why></div>
        <div class="tw-actions">
          <button class="primary" data-confirm>Confirmar</button>
          <button class="secondary" data-reset>↺ Vaciar</button>
        </div>
      </div>
    `;

    // Modelo: bloques de 1 en 1, para poder contarlo de un vistazo.
    const modelEl = body.querySelector("[data-model]");
    let mh = "";
    for (let i = 0; i < round.model; i++) mh += `<span class="tw-unit"></span>`;
    modelEl.innerHTML = mh;
    // La guía punteada lleva la altura del modelo al lado de tu torre:
    // comparar es ver si pasas de la línea, no restar en la cabeza.
    body.querySelector("[data-guide]").style.bottom = `${round.model * UNIT}px`;

    body.querySelector("[data-confirm]").addEventListener("click", confirmar);
    body.querySelector("[data-reset]").addEventListener("click", () => {
      if (finished || locked) return;
      used = [];
      render();
    });
    render();
  }

  function render() {
    const mine = body.querySelector("[data-mine]");
    const tray = body.querySelector("[data-tray]");
    const guide = body.querySelector("[data-guide]");
    mine.innerHTML = "";
    mine.appendChild(guide);
    used.forEach((idx, pos) => {
      const v = round.pieces[idx];
      const b = document.createElement("button");
      b.className = "tw-piece tw-piece-on";
      b.type = "button";
      b.style.height = `${v * UNIT}px`;
      b.textContent = String(v);
      b.addEventListener("click", () => {
        if (finished || locked) return;
        used.splice(pos, 1);
        render();
      });
      mine.appendChild(b);
    });

    tray.innerHTML = "";
    round.pieces.forEach((v, idx) => {
      const b = document.createElement("button");
      b.className = "tw-tile";
      b.type = "button";
      b.dataset.idx = String(idx);
      b.innerHTML = `<i class="tw-tile-bar" style="height:${v * 4 + 4}px"></i><b>${v}</b>`;
      if (used.includes(idx)) {
        b.classList.add("tw-tile-used");
        b.disabled = true;
      }
      b.addEventListener("click", () => {
        if (finished || locked || used.includes(idx)) return;
        if (sumUsed() + v > MAX_STACK) {
          const f = body.querySelector("[data-feedback]");
          f.textContent = "Esa pieza ya no cabe encima";
          f.className = "feedback bad";
          return;
        }
        used.push(idx);
        render();
      });
      tray.appendChild(b);
    });

    const suma = sumUsed();
    body.querySelector("[data-sum]").textContent = String(suma);
    const f = body.querySelector("[data-feedback]");
    if (!locked) {
      f.textContent = "";
      f.className = "feedback";
    }
  }

  function confirmar() {
    if (finished || locked) return;
    const suma = sumUsed();
    if (used.length === 0) {
      const f = body.querySelector("[data-feedback]");
      f.textContent = "Pon alguna pieza primero";
      f.className = "feedback bad";
      return;
    }
    locked = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const why = body.querySelector("[data-why]");

    if (suma === round.target) {
      streak++;
      score += 10;
      renderScore();
      feedback.textContent = `¡Justo! ${used.map((i) => round.pieces[i]).join(" + ")} = ${round.target}`;
      feedback.className = "feedback ok";
      later(nextRound, 950);
      return;
    }

    streak = 0;
    lives--;
    renderLives();
    const dif = Math.abs(suma - round.target);
    feedback.textContent = suma > round.target
      ? `Te has pasado en ${dif}`
      : `Te faltan ${dif}`;
    feedback.className = "feedback bad";

    // Al fallar se ve la cuenta entera: cómo salía la altura pedida, qué
    // sumaste tú y la única descomposición que valía.
    why.innerHTML = `
      <span class="tw-why-line">Pedía ${round.text}: <b>${round.how}</b></span>
      <span class="tw-why-line tw-why-bad">Tú: ${used.map((i) => round.pieces[i]).join(" + ")} = ${suma}</span>
      <span class="tw-why-line tw-why-good">Única forma: ${round.sol.join(" + ")} = ${round.target}</span>
    `;
    why.classList.add("on");
    // Y la torre buena se levanta sola al lado del modelo.
    later(() => {
      used = round.sol.map((v) => round.pieces.indexOf(v));
      render();
      body.querySelectorAll(".tw-piece-on").forEach((el) => el.classList.add("tw-piece-sol"));
    }, 750);

    if (lives <= 0) return later(() => finish(false), 2500);
    later(nextRound, 2500);
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    clearTimers();
    if (userExited) return onExit();
    saveScore(client, "torre", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🏗️</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} torres construidas</p>
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
    clearTimers();
    lives = startLives;
    score = 0;
    rounds = 0;
    streak = 0;
    round = null;
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    clearTimers();
  };
}
