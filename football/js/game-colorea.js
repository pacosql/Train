// "Colorea por resultado": cuadrícula de operaciones; hay que tocar solo
// las que dan el número pedido. Las casillas que no valen NUNCA dan ese
// resultado, así tocar mal es siempre culpa del cálculo, no del azar.
import { randInt, pick, shuffle, clamp, saveScore } from "./utils.js";

// Escribe una operación cuyo resultado es exactamente v.
function opWithResult(v) {
  const forms = [];
  if (v >= 2) {
    forms.push(() => {
      const a = randInt(1, v - 1);
      return `${a} + ${v - a}`;
    });
  }
  forms.push(() => {
    const b = randInt(1, 9);
    return `${v + b} − ${b}`;
  });
  const divs = [];
  for (let d = 2; d <= 9; d++) {
    if (v % d === 0 && v / d >= 2 && v / d <= 12) divs.push(d);
  }
  if (divs.length) {
    forms.push(() => {
      const d = pick(divs);
      return `${d} × ${v / d}`;
    });
  }
  return pick(forms)();
}

// Texto único para v: si el azar repite, se cae a una resta distinta por
// cada b, que nunca choca con la de otro valor.
function uniqueOp(v, taken) {
  let guard = 0;
  while (guard < 40) {
    const t = opWithResult(v);
    if (!taken.has(t)) return t;
    guard++;
  }
  for (let b = 1; b <= 99; b++) {
    const t = `${v + b} − ${b}`;
    if (!taken.has(t)) return t;
  }
  return `${v} + 0`;
}

function buildRound() {
  const target = randInt(6, 24);
  const total = pick([9, 12]);
  const hits = randInt(2, 4); // siempre entre 2 y 4 casillas buenas
  const taken = new Set();
  const cells = [];
  for (let i = 0; i < hits; i++) {
    const text = uniqueOp(target, taken);
    taken.add(text);
    cells.push({ text, hit: true });
  }
  for (let i = cells.length; i < total; i++) {
    let v;
    let guard = 0;
    do {
      v = clamp(target + randInt(-9, 9), 2, 40);
      guard++;
    } while (v === target && guard < 40);
    if (v === target) v = target + 1; // jamás un distractor que valga
    const text = uniqueOp(v, taken);
    taken.add(text);
    cells.push({ text, hit: false });
  }
  return { target, hits, cells: shuffle(cells) };
}

export function mountColoreaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let remaining = 0;

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
  function renderRemaining() {
    const el = body.querySelector("[data-remaining]");
    if (el) el.textContent = remaining === 1 ? "Queda 1 casilla" : `Quedan ${remaining} casillas`;
  }

  function nextRound() {
    if (finished) return;
    round = buildRound();
    remaining = round.hits;
    body.innerHTML = `
      <p class="prompt">Toca todas las casillas que dan <b>${round.target}</b><small data-remaining></small></p>
      <div class="col-grid" data-grid></div>
      <div class="feedback" data-feedback></div>
    `;
    const grid = body.querySelector("[data-grid]");
    round.cells.forEach((cell) => {
      const btn = document.createElement("button");
      btn.className = "col-cell";
      btn.textContent = cell.text;
      btn.addEventListener("click", () => tapCell(cell, btn));
      grid.appendChild(btn);
    });
    renderRemaining();
  }

  function tapCell(cell, el) {
    if (finished || el.disabled) return;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    el.disabled = true;
    if (cell.hit) {
      el.classList.add("hit");
      remaining--;
      renderRemaining();
      feedback.textContent = "¡Esa vale!";
      feedback.className = "feedback ok";
      if (remaining <= 0) {
        score += 10;
        renderScore();
        body.querySelectorAll(".col-cell").forEach((c) => (c.disabled = true));
        setTimeout(nextRound, 700);
      }
    } else {
      el.classList.add("wrong");
      lives--;
      renderLives();
      feedback.textContent = "Esa no da ese número…";
      feedback.className = "feedback bad";
      if (lives <= 0) setTimeout(() => finish(false), 450);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "colorea", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎨</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} casillas tocadas</p>
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
