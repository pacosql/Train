// "Continúa la gráfica": una serie con un patrón claro (sumar siempre lo
// mismo, restar siempre lo mismo o duplicar) dibujada como gráfico de
// líneas; el jugador toca el punto candidato que sigue el patrón.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const W = 300, H = 210;
const PAD_L = 26, PAD_R = 16, PAD_T = 26, PAD_B = 28;

// Genera la serie y el valor siguiente. Todos los valores quedan > 0 para
// que el gráfico nunca baje del eje.
function buildSeries() {
  const kind = pick(["sube", "baja", "dobla"]);
  const values = [];
  let next;
  if (kind === "sube") {
    const n = pick([4, 5]);
    const step = randInt(2, 5);
    const start = randInt(1, 6);
    for (let i = 0; i < n; i++) values.push(start + i * step);
    next = start + n * step;
  } else if (kind === "baja") {
    const n = pick([4, 5]);
    const step = randInt(2, 4);
    const start = n * step + randInt(1, 5);
    for (let i = 0; i < n; i++) values.push(start - i * step);
    next = start - n * step;
  } else {
    const start = randInt(1, 3);
    for (let i = 0; i < 4; i++) values.push(start * Math.pow(2, i));
    next = start * 16;
  }
  return { values, next };
}

// Los candidatos se dibujan a alturas proporcionales a su valor: si dos
// estuvieran demasiado juntos serían indistinguibles a simple vista, así
// que se exige una separación mínima entre todos ellos.
function buildCandidates(values, next) {
  const all = values.concat([next]);
  const span = Math.max(...all) - Math.min(...all);
  const gap = Math.max(1, Math.round(span * 0.14));
  const out = [next];
  for (const d of shuffle([1, 2, 3, -1, -2, -3])) {
    if (out.length === 4) break;
    const v = next + d * gap;
    if (v > 0 && out.every((o) => Math.abs(o - v) >= gap)) out.push(v);
  }
  return out;
}

function chartSvg(values, cands, next) {
  const cols = values.length + 1;
  const colW = (W - PAD_L - PAD_R) / cols;
  const vmax = Math.max(...values, ...cands) * 1.12;
  const xFor = (i) => PAD_L + (i + 0.5) * colW;
  const yFor = (v) => H - PAD_B - (v / vmax) * (H - PAD_T - PAD_B);

  const line = values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(" ");
  const pts = values
    .map(
      (v, i) =>
        `<circle class="pe-graf-pt" cx="${xFor(i)}" cy="${yFor(v)}" r="4.5"/>` +
        `<text class="pe-graf-lbl" x="${xFor(i)}" y="${yFor(v) - 10}" text-anchor="middle">${v}</text>`
    )
    .join("");

  const cx = xFor(values.length);
  const dots = cands
    .map(
      (v) => `
      <g class="pe-graf-cand" data-v="${v}" data-ok="${v === next ? 1 : 0}">
        <circle cx="${cx}" cy="${yFor(v)}" r="17" fill="transparent"/>
        <text class="pe-graf-lbl" x="${cx - 15}" y="${yFor(v) + 4}" text-anchor="end">${v}</text>
        <circle class="pe-graf-dot" cx="${cx}" cy="${yFor(v)}" r="8"/>
      </g>`
    )
    .join("");

  return `
    <svg class="pe-graf-svg" viewBox="0 0 ${W} ${H}" role="img">
      <line class="pe-graf-axis" x1="${PAD_L - 8}" y1="${H - PAD_B}" x2="${W - 6}" y2="${H - PAD_B}"/>
      <line class="pe-graf-axis" x1="${PAD_L - 8}" y1="${PAD_T - 14}" x2="${PAD_L - 8}" y2="${H - PAD_B}"/>
      <line class="pe-graf-guide" x1="${cx}" y1="${PAD_T - 14}" x2="${cx}" y2="${H - PAD_B}"/>
      <polyline class="pe-graf-line" points="${line}"/>
      ${pts}
      ${dots}
    </svg>
  `;
}

export function mountGraficaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let answered = false;
  let next = 0;

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

  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function nextRound() {
    if (finished) return;
    // Repite hasta tener 4 candidatos bien separados: si no, dos puntos
    // caerían casi a la misma altura y la respuesta sería discutible.
    let series, cands, guard = 0;
    do {
      series = buildSeries();
      cands = buildCandidates(series.values, series.next);
      guard++;
    } while (cands.length < 4 && guard < 30);
    next = series.next;
    answered = false;

    body.innerHTML = `
      <p class="prompt">¿Qué punto continúa la gráfica?<small>Mira cómo cambia la serie y toca el punto correcto</small></p>
      <div class="pe-graf-wrap">${chartSvg(series.values, cands, series.next)}</div>
      <div class="feedback" data-feedback></div>
    `;
    body.querySelectorAll(".pe-graf-cand").forEach((g) => {
      g.addEventListener("click", () => tap(g));
    });
  }

  function tap(g) {
    if (finished || answered) return;
    answered = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    if (g.dataset.ok === "1") {
      g.classList.add("correct");
      score += 10;
      renderScore();
      feedback.textContent = "¡Sigue el patrón!";
      feedback.className = "feedback ok";
      setTimeout(nextRound, 750);
    } else {
      lives--;
      renderLives();
      g.classList.add("wrong");
      body.querySelector(`.pe-graf-cand[data-ok="1"]`).classList.add("correct");
      feedback.textContent = `Era el ${next}`;
      feedback.className = "feedback bad";
      if (lives <= 0) return setTimeout(() => finish(false), 800);
      setTimeout(nextRound, 1100);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "grafica", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📈</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} gráficas</p>
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
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
  };
}
