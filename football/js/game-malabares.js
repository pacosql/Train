// "Malabares": tres pelotas con periodos distintos vuelven a la mano cada
// cierto número de tics (todas empiezan sincronizadas en el tic 0). Hay que
// averiguar en qué tic > 0 coinciden las TRES a la vez por primera vez, es
// decir, el mínimo común múltiplo (m.c.m.) de los tres periodos. Es un juego
// POR TURNOS: el jugador mira las líneas de tiempo con calma y elige entre
// varios tics candidatos, sin límite de reloj ni reflejos de por medio.
import { randInt, shuffle, saveScore } from "./utils.js";

const START_LIVES = 3;
const MIN_PERIOD = 2;
const MAX_PERIOD = 6;
const MAX_MCM = 60; // más allá de esto la línea de tiempo dejaría de ser legible

// m.c.d. por el algoritmo de Euclides.
function gcd2(a, b) {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

function lcm2(a, b) {
  return (a / gcd2(a, b)) * b;
}

// Función pura: m.c.m. de tres enteros positivos, vía m.c.m. por parejas.
export function mcm3(a, b, c) {
  return lcm2(lcm2(a, b), c);
}

// Lista con los primeros tics (>0) en los que una pelota de periodo `p`
// vuelve a la mano, hasta `limit` tics, para el texto de feedback.
function landingsText(p, limit) {
  const list = [];
  for (let t = p; t <= limit && list.length < 4; t += p) list.push(t);
  const hasMore = list.length && list[list.length - 1] + p <= limit;
  return list.join(",") + (hasMore || list.length === 4 ? "..." : "");
}

export function mountMalabaresGame(container, { client, onExit }) {
  let lives = START_LIVES;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false; // evita responder dos veces mientras se resuelve la ronda
  let periods = [];
  let target = 0;
  let range = 0;
  let lastPeriods = "";
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
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(START_LIVES - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  // Sortea 3 periodos distintos entre 2 y 6 cuyo m.c.m. sea legible; si sale
  // demasiado grande (no debería pasar en este rango, pero se guarda por si
  // se cambian los límites), se vuelve a sortear.
  function rollPeriods() {
    let a, b, c, key, m;
    let guard = 0;
    do {
      a = randInt(MIN_PERIOD, MAX_PERIOD);
      do { b = randInt(MIN_PERIOD, MAX_PERIOD); } while (b === a);
      do { c = randInt(MIN_PERIOD, MAX_PERIOD); } while (c === a || c === b);
      key = [a, b, c].sort((x, y) => x - y).join(",");
      m = mcm3(a, b, c);
      guard++;
    } while ((m > MAX_MCM || key === lastPeriods) && guard < 100);
    lastPeriods = key;
    return [a, b, c];
  }

  // Genera los candidatos de respuesta: el m.c.m. correcto + m.c.m. de solo
  // dos de los tres periodos (coincidencias "a medias", no de las tres) +,
  // si hiciera falta rellenar, algún tic cercano más.
  function buildOptions(p, mcm) {
    const set = new Set([mcm]);
    const pairs = [[p[0], p[1]], [p[0], p[2]], [p[1], p[2]]];
    pairs.forEach(([x, y]) => {
      const v = lcm2(x, y);
      if (v !== mcm) set.add(v);
    });
    let step = 1;
    while (set.size < 4) {
      const extra = mcm - step * p[0];
      if (extra > 0) set.add(extra);
      if (set.size < 4) set.add(mcm + step * p[0]);
      step++;
      if (step > 10) break; // salvaguarda, no debería hacer falta
    }
    return shuffle(Array.from(set)).slice(0, Math.min(5, Math.max(4, set.size)));
  }

  function nextRound() {
    periods = rollPeriods();
    target = mcm3(periods[0], periods[1], periods[2]);
    range = Math.max(target + 2, 12);
    locked = false;

    const options = buildOptions(periods, target);
    const cellW = 24;

    const rowsHtml = periods
      .map((p, idx) => {
        const cells = [];
        for (let t = 0; t <= range; t++) {
          const lands = t > 0 && t % p === 0;
          cells.push(
            `<div class="ml-cell${lands ? " ml-cell--land" : ""}" data-tic="${t}">${lands ? t : ""}</div>`
          );
        }
        return `<div class="ml-cellrow" data-row="${idx}">${cells.join("")}</div>`;
      })
      .join("");

    const emojis = ["🔴", "🟢", "🔵"];

    body.innerHTML = `
      <p class="prompt">🤹 ¿En qué tic vuelven las TRES pelotas a la mano a la vez por primera vez?</p>
      <small class="ml-hint">Todas empiezan juntas en el tic 0. Desliza para ver los tics.</small>
      <div class="ml-timelines">
        <div class="ml-labels">
          ${periods.map((p, i) => `<div class="ml-label">${emojis[i]} cada ${p}</div>`).join("")}
        </div>
        <div class="ml-scroll" data-scroll>
          <div class="ml-rows" style="width:${(range + 1) * cellW}px">${rowsHtml}</div>
        </div>
      </div>
      <div class="ml-choices" data-choices></div>
      <div class="feedback" data-feedback></div>
    `;

    const choicesEl = body.querySelector("[data-choices]");
    options.forEach((value) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn ml-choice";
      btn.type = "button";
      btn.dataset.choice = String(value);
      btn.textContent = `Tic ${value}`;
      btn.addEventListener("click", () => answer(value, btn));
      choicesEl.appendChild(btn);
    });
  }

  function explanation() {
    const [a, b, c] = periods;
    return (
      `La pelota de periodo ${a} vuelve en los tics ${landingsText(a, target)}; ` +
      `la de periodo ${b} en ${landingsText(b, target)}; ` +
      `la de periodo ${c} en ${landingsText(c, target)} — ` +
      `las tres coinciden por primera vez en el tic ${target} (el m.c.m. de ${a}, ${b} y ${c})`
    );
  }

  function answer(value, btnEl) {
    if (finished || locked) return;
    locked = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const buttons = Array.from(body.querySelectorAll("[data-choice]"));
    buttons.forEach((b) => { b.disabled = true; });

    if (value === target) {
      btnEl.classList.add("correct");
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! ${explanation()}, no en las parejas sueltas.`;
      feedback.className = "feedback ok";
      later(nextRound, 2200);
    } else {
      btnEl.classList.add("wrong");
      const correctBtn = buttons.find((b) => Number(b.dataset.choice) === target);
      if (correctBtn) correctBtn.classList.add("correct");
      lives--;
      renderLives();
      feedback.textContent = `${explanation()}, no en lo que dijiste.`;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 2600);
      later(nextRound, 2600);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "malabares", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🤹</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} tandas de malabares resueltas</p>
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
    lives = START_LIVES;
    score = 0;
    rounds = 0;
    finished = false;
    lastPeriods = "";
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
