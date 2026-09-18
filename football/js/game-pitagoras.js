// "Escalera y pared": el teorema de Pitágoras aplicado a una escalera
// apoyada contra un muro, formando un triángulo rectángulo con el suelo.
// Se usan siempre ternas pitagóricas enteras, así que la respuesta nunca
// tiene decimales ni ambigüedad. El lado que falta rota entre la
// hipotenusa (la escalera) y cada cateto (altura o distancia a la pared),
// para obligar a aplicar la fórmula en los dos sentidos —
// a² + b² = c² y c² − a² = b² — en vez de memorizar solo "sumar catetos".
import { pick, saveScore } from "./utils.js";

const TRIPLES = [
  [3, 4, 5],
  [6, 8, 10],
  [9, 12, 15],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
];

const MAX_DIGITS = 2;

export function generatePitagorasRound() {
  const [a, b, c] = pick(TRIPLES); // a = distancia al muro, b = altura, c = escalera (hipotenusa)
  const missingSide = pick(["a", "b", "c"]);
  let answer;
  if (missingSide === "c") answer = Math.sqrt(a * a + b * b);
  else if (missingSide === "b") answer = Math.sqrt(c * c - a * a);
  else answer = Math.sqrt(c * c - b * b);
  return { a, b, c, missingSide, answer };
}

function labelFor(side) {
  if (side === "a") return "distancia al muro";
  if (side === "b") return "altura que alcanza";
  return "longitud de la escalera";
}

function triangleSvg(round) {
  const { a, b, c, missingSide } = round;
  const W = 220;
  const H = 200;
  const groundY = H - 20;
  const wallX = 30;
  const topX = wallX;
  const topY = 20;
  const baseX = W - 20;

  const showA = missingSide === "a" ? "?" : a;
  const showB = missingSide === "b" ? "?" : b;
  const showC = missingSide === "c" ? "?" : c;

  return `
    <svg class="ptg-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
      <line x1="${wallX}" y1="${topY}" x2="${wallX}" y2="${groundY}" class="ptg-wall" />
      <line x1="${wallX}" y1="${groundY}" x2="${baseX}" y2="${groundY}" class="ptg-ground" />
      <line x1="${wallX}" y1="${topY}" x2="${baseX}" y2="${groundY}" class="ptg-ladder" />
      <rect x="${wallX - 6}" y="${groundY - 12}" width="12" height="12" class="ptg-corner" />
      <text x="${wallX - 12}" y="${(topY + groundY) / 2}" class="ptg-label ptg-label-b">${showB}</text>
      <text x="${(wallX + baseX) / 2}" y="${groundY + 16}" class="ptg-label ptg-label-a">${showA}</text>
      <text x="${(wallX + baseX) / 2 - 10}" y="${(topY + groundY) / 2 - 10}" class="ptg-label ptg-label-c">${showC}</text>
    </svg>
  `;
}

export function mountPitagorasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let typed = "";
  let locked = false;
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
    round = generatePitagorasRound();
    typed = "";
    locked = false;

    body.innerHTML = `
      <p class="prompt">La escalera está apoyada en la pared, formando un triángulo rectángulo con el suelo<small>Usa el teorema de Pitágoras: a² + b² = c² (c es siempre la escalera, la hipotenusa)</small></p>
      <div class="ptg-wrap" data-wrap>${triangleSvg(round)}</div>
      <p class="prompt">¿Cuánto mide <b>${labelFor(round.missingSide)}</b>?</p>
      <div class="keypad-display" data-display>&nbsp;</div>
      <div class="keypad" data-keypad></div>
      <div class="feedback" data-feedback></div>
    `;

    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn keypad-key";
      btn.type = "button";
      btn.textContent = key;
      if (key === "⌫") {
        btn.setAttribute("data-backspace", "");
        btn.addEventListener("click", () => pressBackspace());
      } else if (key === "✓") {
        btn.setAttribute("data-submit", "");
        btn.addEventListener("click", () => submit());
      } else {
        btn.setAttribute("data-digit", key);
        btn.addEventListener("click", () => pressDigit(key));
      }
      pad.appendChild(btn);
    });

    renderDisplay();
  }

  function renderDisplay() {
    body.querySelector("[data-display]").textContent = typed || " ";
  }

  function pressDigit(d) {
    if (finished || locked) return;
    if (typed.length >= MAX_DIGITS) return;
    if (typed === "0") typed = d;
    else typed += d;
    renderDisplay();
  }

  function pressBackspace() {
    if (finished || locked) return;
    typed = typed.slice(0, -1);
    renderDisplay();
  }

  function explanation() {
    const { a, b, c, missingSide, answer } = round;
    if (missingSide === "c") {
      return `La escalera es la hipotenusa: c = √(a² + b²) = √(${a}² + ${b}²) = √${a * a + b * b} = ${answer}.`;
    }
    if (missingSide === "b") {
      return `La altura es un cateto: b = √(c² − a²) = √(${c}² − ${a}²) = √${c * c - a * a} = ${answer}.`;
    }
    return `La distancia al muro es un cateto: a = √(c² − b²) = √(${c}² − ${b}²) = √${c * c - b * b} = ${answer}.`;
  }

  function submit() {
    if (finished || locked || typed === "") return;
    const guess = Number(typed);
    locked = true;
    const feedback = body.querySelector("[data-feedback]");

    if (guess === round.answer) {
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! ${explanation()}`;
      feedback.className = "feedback ok";
      later(nextRound, 1800);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `No es correcto. ${explanation()}`;
      feedback.className = "feedback bad";
      if (lives <= 0) {
        later(() => finish(false), 2600);
      } else {
        later(nextRound, 2600);
      }
    }
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "pitagoras", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📐</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} escaleras resueltas</p>
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
    timers.forEach(clearTimeout);
  };
}
