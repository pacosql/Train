// "Inventa la regla": la inversión del clásico "¿qué número sigue?".
// Aquí se da la serie COMPLETA y lo que hay que construir es la regla
// que la genera — multiplicar por algo y luego sumar/restar algo — con
// dos selectores. Así el patrón deja de ser adivinar el siguiente número
// y pasa a ser describir la máquina que los produce.
// La regla generada se comprueba por fuerza bruta contra TODAS las
// reglas del espacio de selectores: si dos reglas distintas dieran la
// misma serie, se regenera.
import { randInt, pick, clamp, saveScore } from "./utils.js";

const MULS = [1, 2, 3, 4, 5];
const ADDS = [-3, -2, -1, 0, 1, 2, 3, 4, 5];

const LEVELS = [
  { muls: [1, 2], adds: [1, 2, 3, 4], max: 80 },
  { muls: [1, 2, 3], adds: [-2, -1, 0, 1, 2, 3, 4], max: 200 },
  { muls: [2, 3, 4], adds: [-3, -2, -1, 0, 1, 2, 3, 5], max: 400 },
  { muls: [2, 3, 4, 5], adds: [-3, -2, -1, 0, 1, 2, 3, 4, 5], max: 1200 },
];
const TERMS = 5;

export function levelForStreak(streak) {
  return clamp(Math.floor(streak / 2), 0, LEVELS.length - 1);
}

// Aplica la regla "× mul y luego + add" desde el primer término.
export function buildSeries(start, mul, add, terms = TERMS, max = Infinity) {
  const out = [start];
  for (let i = 1; i < terms; i++) {
    const v = out[i - 1] * mul + add;
    if (v < 1 || v > max) return null;
    out.push(v);
  }
  return out;
}

// Fuerza bruta: todas las reglas del espacio de selectores que
// reproducen exactamente la serie dada a partir de su primer término.
export function matchingRules(series) {
  const hits = [];
  for (const m of MULS) {
    for (const a of ADDS) {
      const s = buildSeries(series[0], m, a, series.length);
      if (s && s.every((v, i) => v === series[i])) hits.push({ mul: m, add: a });
    }
  }
  return hits;
}

export function makeInventaRound(streak) {
  const level = levelForStreak(streak);
  const lvl = LEVELS[level];
  let guard = 0;
  while (guard++ < 400) {
    const mul = pick(lvl.muls);
    const add = pick(lvl.adds);
    if (mul === 1 && add === 0) continue; // serie constante: no es regla
    const start = randInt(1, mul >= 4 ? 4 : mul >= 2 ? 6 : 9);
    const series = buildSeries(start, mul, add, TERMS, lvl.max);
    if (!series) continue;
    if (new Set(series).size < 3) continue; // demasiado plana para leerse
    if (matchingRules(series).length !== 1) continue; // regla única, o no vale
    return { series, mul, add, level };
  }
  // Caso fijo de emergencia: 2, 5, 8, 11, 14 (×1 y +3).
  return { series: [2, 5, 8, 11, 14], mul: 1, add: 3, level };
}

function ruleText(mul, add) {
  const p2 = add === 0 ? "" : add > 0 ? ` +${add}` : ` −${Math.abs(add)}`;
  return `×${mul}${p2}`;
}

const ORDINAL = ["1.º", "2.º", "3.º", "4.º", "5.º", "6.º"];

export function mountInventaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let locked = false;
  let round = null;
  let selMul = null;
  let selAdd = null;
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
    round = makeInventaRound(streak);
    selMul = null;
    selAdd = null;
    locked = false;

    body.innerHTML = `
      <p class="prompt">¿Qué regla hace esta serie?<small>Cada número sale del anterior</small></p>
      <div class="iv-series">${round.series
        .map((v, i) => `<span class="iv-term">${v}</span>${i < round.series.length - 1 ? '<span class="iv-arrow">→</span>' : ""}`)
        .join("")}</div>
      <div class="iv-rule">
        <div class="iv-row">
          <span class="iv-label">multiplica por</span>
          <div class="iv-chips" data-muls></div>
        </div>
        <div class="iv-row">
          <span class="iv-label">y luego</span>
          <div class="iv-chips" data-adds></div>
        </div>
      </div>
      <div class="iv-guess" data-guess>Elige las dos piezas de la regla</div>
      <button class="primary" data-check disabled>Comprobar</button>
      <div class="feedback" data-feedback></div>
    `;

    const mulsEl = body.querySelector("[data-muls]");
    MULS.forEach((m) => {
      const btn = document.createElement("button");
      btn.className = "iv-chip";
      btn.type = "button";
      btn.textContent = `×${m}`;
      btn.addEventListener("click", () => { if (!locked) { selMul = m; refresh(); } });
      mulsEl.appendChild(btn);
    });
    const addsEl = body.querySelector("[data-adds]");
    ADDS.forEach((a) => {
      const btn = document.createElement("button");
      btn.className = "iv-chip";
      btn.type = "button";
      btn.textContent = a === 0 ? "+0" : a > 0 ? `+${a}` : `−${Math.abs(a)}`;
      btn.addEventListener("click", () => { if (!locked) { selAdd = a; refresh(); } });
      addsEl.appendChild(btn);
    });
    body.querySelector("[data-check]").addEventListener("click", check);
    refresh();
  }

  function say(text, kind) {
    const el = body.querySelector("[data-feedback]");
    if (!el) return;
    el.innerHTML = text;
    el.className = `feedback${kind ? ` ${kind}` : ""}`;
  }

  function refresh() {
    body.querySelectorAll("[data-muls] .iv-chip").forEach((btn, i) => {
      btn.classList.toggle("on", MULS[i] === selMul);
      btn.disabled = locked;
    });
    body.querySelectorAll("[data-adds] .iv-chip").forEach((btn, i) => {
      btn.classList.toggle("on", ADDS[i] === selAdd);
      btn.disabled = locked;
    });
    const ready = selMul !== null && selAdd !== null;
    body.querySelector("[data-guess]").textContent = ready
      ? `Tu regla: ${ruleText(selMul, selAdd)}`
      : "Elige las dos piezas de la regla";
    body.querySelector("[data-check]").disabled = locked || !ready;
  }

  // Serie de la regla propuesta sin límites: al fallar hay que poder
  // ver los números que salen, aunque se pasen o bajen de cero.
  function rawSeries(start, mul, add, terms) {
    const out = [start];
    for (let i = 1; i < terms; i++) out.push(out[i - 1] * mul + add);
    return out;
  }

  function check() {
    if (finished || locked || selMul === null || selAdd === null) return;
    const mine = rawSeries(round.series[0], selMul, selAdd, round.series.length);
    const bad = mine.findIndex((v, i) => v !== round.series[i]);

    if (bad === -1) {
      locked = true;
      rounds++;
      streak++;
      score += 10;
      renderScore();
      refresh();
      say(`¡Esa es! ${ruleText(round.mul, round.add)}`, "ok");
      later(nextRound, 1200);
      return;
    }

    // Al fallar se ve POR QUÉ: la serie que sale con la regla propuesta
    // y el término exacto donde se rompe.
    lives--;
    renderLives();
    streak = 0;
    const num = (v) => String(v).replace("-", "−"); // signo menos de verdad
    say(
      `Con ${ruleText(selMul, selAdd)}: ${mine.map(num).join(" → ")}<br>` +
        `el ${ORDINAL[bad]} sale ${num(mine[bad])} y debería ser ${round.series[bad]}`,
      "bad"
    );
    if (lives <= 0) {
      locked = true;
      rounds++;
      refresh();
      later(() => {
        say(`La regla era <b>${ruleText(round.mul, round.add)}</b>`, "bad");
        later(() => finish(false), 2000);
      }, 2200);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "inventa", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧩</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} series jugadas</p>
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
