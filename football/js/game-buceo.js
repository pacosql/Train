// "Buceo": llevar al buzo de una profundidad a una cota exacta gastando
// saltos con signo (+3, −4, +7…), cada uno de un solo uso. Sumar y restar
// enteros como desplazamiento vertical real sobre una recta numérica: la
// superficie (0) y el fondo son los límites de la recta.
import { clamp, pick, randInt, shuffle, saveScore } from "./utils.js";

const FLOOR = -18;   // fondo del mar (extremo de la recta)
const SURFACE = 0;   // superficie
const MIN_D = -17;   // cotas jugables (ni pegado al fondo ni fuera del agua)
const MAX_D = -1;

const LEVELS = [
  { sizes: [2], decoys: 2 },
  { sizes: [2, 3], decoys: 2 },
  { sizes: [3], decoys: 3 },
];

// Cuántos subconjuntos NO VACÍOS de `values` suman `delta`.
export function countSubsets(values, delta) {
  let count = 0;
  const n = values.length;
  for (let mask = 1; mask < 1 << n; mask++) {
    let s = 0;
    for (let i = 0; i < n; i++) if (mask & (1 << i)) s += values[i];
    if (s === delta) count++;
  }
  return count;
}

// ¿Con los saltos que quedan se puede llegar todavía?
export function canReach(values, delta) {
  if (delta === 0) return true;
  return countSubsets(values, delta) > 0;
}

// Todos los órdenes posibles de la solución se quedan dentro del mar:
// así el jugador nunca es castigado por elegir un orden legítimo.
function ordersInside(start, sol) {
  const n = sol.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    let s = start;
    for (let i = 0; i < n; i++) if (mask & (1 << i)) s += sol[i];
    if (s < MIN_D || s > MAX_D) return false;
  }
  return true;
}

// Genera una ronda con EXACTAMENTE un subconjunto de saltos que llega a la
// cota (do/while con guarda y caso fijo de reserva).
export function makeBuceoRound(level) {
  const cfg = LEVELS[clamp(level, 0, LEVELS.length - 1)];
  let guard = 0;
  while (guard++ < 600) {
    const solSize = pick(cfg.sizes);
    const start = randInt(-16, -3);
    const target = randInt(MIN_D, MAX_D);
    if (target === start) continue;
    const delta = target - start;
    if (Math.abs(delta) < 3) continue; // nada de rondas casi resueltas

    const sol = [];
    let ok = true;
    for (let i = 0; i < solSize - 1; i++) {
      const options = [];
      for (let v = -9; v <= 9; v++) if (v !== 0 && !sol.includes(v)) options.push(v);
      if (!options.length) { ok = false; break; }
      sol.push(pick(options));
    }
    if (!ok) continue;
    const lastV = delta - sol.reduce((a, b) => a + b, 0);
    if (lastV === 0 || Math.abs(lastV) > 9 || sol.includes(lastV)) continue;
    sol.push(lastV);
    if (countSubsets(sol, delta) !== 1) continue; // la propia solución, única
    if (!ordersInside(start, sol)) continue;

    // Señuelos: valores distintos que no abren un segundo camino.
    const jumps = sol.slice();
    for (let d = 0; d < cfg.decoys; d++) {
      const pool = [];
      for (let v = -9; v <= 9; v++) if (v !== 0 && !jumps.includes(v)) pool.push(v);
      const cand = shuffle(pool).find((v) => countSubsets(jumps.concat([v]), delta) === 1);
      if (cand === undefined) { ok = false; break; }
      jumps.push(cand);
    }
    if (!ok) continue;
    if (countSubsets(jumps, delta) !== 1) continue;

    return { start, target, delta, jumps: shuffle(jumps), solution: sol.slice() };
  }
  // Guarda agotada: caso fijo válido y comprobado.
  return {
    start: -12, target: -5, delta: 7,
    jumps: shuffle([5, 2, 8, -9]), solution: [5, 2],
  };
}

function signed(v) {
  return v > 0 ? `+${v}` : `−${Math.abs(v)}`;
}
function depth(v) {
  return v === 0 ? "0 m" : `−${Math.abs(v)} m`;
}

export function mountBuceoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  const timers = [];

  let round = null;
  let pos = 0;
  let used = [];
  let trail = [];
  let locked = true;

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

  const STEP = 16;
  const TOP = 16;
  const yOf = (d) => TOP + -clamp(d, FLOOR, SURFACE) * STEP;

  function lineSvg() {
    let ticks = "";
    for (let d = 0; d >= FLOOR; d--) {
      const y = yOf(d);
      const long = d % 2 === 0;
      ticks += `<line x1="${long ? 34 : 42}" y1="${y}" x2="48" y2="${y}" class="bu-tick"/>`;
      if (long && d < 0) ticks += `<text x="31" y="${y + 3.5}" class="bu-lbl">−${Math.abs(d)}</text>`;
    }
    return `
      <svg class="bu-svg" viewBox="0 0 150 ${yOf(FLOOR) + 26}" aria-hidden="true">
        <rect x="0" y="${yOf(0)}" width="150" height="${yOf(FLOOR) - yOf(0) + 26}" class="bu-water"/>
        <rect x="0" y="${yOf(FLOOR) + 8}" width="150" height="18" class="bu-sand"/>
        <line x1="0" y1="${yOf(0)}" x2="150" y2="${yOf(0)}" class="bu-surface"/>
        <line x1="48" y1="${yOf(0)}" x2="48" y2="${yOf(FLOOR)}" class="bu-axis"/>
        ${ticks}
        <line x1="48" y1="${yOf(round.target)}" x2="132" y2="${yOf(round.target)}" class="bu-goal"/>
        <text x="134" y="${yOf(round.target) + 5}" class="bu-goal-ico">🧰</text>
        <polyline points="" class="bu-trail" data-trail/>
        <g data-gapmark></g>
        <g class="bu-diver" data-diver><text x="58" y="5" class="bu-diver-ico">🤿</text></g>
      </svg>`;
  }

  function renderPos(animate) {
    const diver = body.querySelector("[data-diver]");
    if (!diver) return;
    diver.style.transition = animate ? "transform .45s ease" : "none";
    diver.style.transform = `translateY(${yOf(pos)}px)`;
    const poly = body.querySelector("[data-trail]");
    poly.setAttribute("points", trail.map((d) => `88,${yOf(d)}`).join(" "));
    const now = body.querySelector("[data-now]");
    if (now) now.textContent = depth(pos);
  }

  function nextRound() {
    round = makeBuceoRound(Math.floor(streak / 2));
    pos = round.start;
    used = [];
    trail = [round.start];
    locked = false;

    body.innerHTML = `
      <p class="prompt">Lleva al buzo a ${depth(round.target)}
        <small>Cada salto se usa una sola vez · no salgas del agua ni toques el fondo</small></p>
      <div class="bu-layout">
        <div class="bu-line">${lineSvg()}</div>
        <div class="bu-side">
          <div class="bu-now">🤿 <b data-now>${depth(pos)}</b></div>
          <div class="bu-jumps" data-jumps></div>
        </div>
      </div>
      <div class="feedback" data-feedback></div>
    `;
    const jumpsEl = body.querySelector("[data-jumps]");
    round.jumps.forEach((v, i) => {
      const btn = document.createElement("button");
      btn.className = `choice-btn bu-jump ${v > 0 ? "is-up" : "is-down"}`;
      btn.type = "button";
      btn.innerHTML = `${v > 0 ? "▲" : "▼"} ${signed(v)}`;
      btn.addEventListener("click", () => jump(i, btn));
      jumpsEl.appendChild(btn);
    });
    renderPos(false);
  }

  function remaining() {
    return round.jumps.filter((_, i) => !used.includes(i));
  }

  function jump(i, btn) {
    if (finished || locked || used.includes(i)) return;
    const v = round.jumps[i];
    const before = pos;
    used.push(i);
    btn.disabled = true;
    btn.classList.add("is-used");
    pos = pos + v;
    trail.push(pos);
    renderPos(true);
    const feedback = body.querySelector("[data-feedback]");

    if (pos === round.target) {
      locked = true;
      rounds++;
      streak++;
      score += 10;
      renderScore();
      feedback.textContent = `${depth(before)} ${signed(v)} = ${depth(pos)} ¡cota exacta! +10`;
      feedback.className = "feedback ok";
      return later(nextRound, 1100);
    }
    if (pos > SURFACE || pos < FLOOR) {
      locked = true;
      feedback.textContent = pos > SURFACE ? "Has salido del agua" : "Has chocado con el fondo";
      feedback.className = "feedback bad";
      return later(() => loseRound(pos > SURFACE ? "out" : "floor"), 750);
    }
    if (!canReach(remaining(), round.target - pos)) {
      locked = true;
      feedback.textContent = `${depth(before)} ${signed(v)} = ${depth(pos)} — ya no te queda cómo llegar`;
      feedback.className = "feedback bad";
      return later(() => loseRound("stuck"), 850);
    }
    feedback.textContent = `${depth(before)} ${signed(v)} = ${depth(pos)}`;
    feedback.className = "feedback";
  }

  // Al fallar, la recta vertical muestra el recorrido hecho y a qué
  // distancia quedó de la cota, con la cuenta completa y la solución.
  function loseRound(reason) {
    rounds++;
    streak = 0;
    lives--;
    renderLives();

    let chain = `<span class="bu-num">${depth(trail[0])}</span>`;
    for (let i = 1; i < trail.length; i++) {
      chain += `<span class="bu-op">${signed(trail[i] - trail[i - 1])}</span>`;
      const bad = trail[i] > SURFACE || trail[i] < FLOOR;
      chain += `<span class="bu-num ${bad ? "is-bad" : ""}">${depth(trail[i])}</span>`;
    }
    const gap = round.target - pos;
    const why = reason === "out"
      ? `Te has pasado de la superficie: desde ${depth(trail[trail.length - 2])} ese salto te
         subía ${Math.abs(trail[trail.length - 1] - trail[trail.length - 2])} m y el agua solo
         daba para ${Math.abs(trail[trail.length - 2])}.`
      : reason === "floor"
        ? `Has bajado por debajo del fondo (${depth(FLOOR)}).`
        : `Te quedaste a ${Math.abs(gap)} m de la cota (${gap > 0 ? "por debajo" : "por encima"}).`;
    const sol = round.solution.map(signed).join(" y ");

    body.innerHTML = `
      <p class="prompt">No has llegado a la cota<small>objetivo ${depth(round.target)}</small></p>
      <div class="bu-line bu-line-center">${lineSvg()}</div>
      <div class="bu-steps">${chain}</div>
      <div class="bu-why">${why} De ${depth(round.start)} a ${depth(round.target)} hay
        <b>${signed(round.delta)}</b>, y los únicos saltos que lo dan eran <b>${sol}</b>.</div>
      <div class="feedback bad">−1 vida</div>
      <button class="primary" data-go style="margin-top:12px;">Seguir →</button>
    `;
    // La recta vertical repite el recorrido hecho y marca en rojo lo que
    // faltaba para la cota.
    renderPos(false);
    if (gap !== 0) {
      const mark = body.querySelector("[data-gapmark]");
      const y1 = yOf(pos);
      const y2 = yOf(round.target);
      mark.innerHTML = `
        <line x1="112" y1="${y1}" x2="112" y2="${y2}" class="bu-gapline"/>
        <line x1="106" y1="${y1}" x2="118" y2="${y1}" class="bu-gapline"/>
        <line x1="106" y1="${y2}" x2="118" y2="${y2}" class="bu-gapline"/>
        <text x="122" y="${(y1 + y2) / 2 + 3}" class="bu-gaptxt">${Math.abs(gap)} m</text>`;
    }
    body.querySelector("[data-go]").addEventListener("click", () => {
      if (lives <= 0) return finish(false);
      nextRound();
    });
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "buceo", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🤿</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} inmersiones</p>
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
