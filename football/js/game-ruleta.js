// "Ruleta de probabilidad": lee el reparto de colores de la ruleta,
// adivina cuál es más probable y luego gírala de verdad para comprobarlo.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const PALETTE = [
  ["#e5484d", "Rojo"], ["#2ea3c4", "Azul"], ["#f5a623", "Naranja"],
  ["#16a34a", "Verde"], ["#9b6bf0", "Morado"],
];

function buildWheel() {
  const n = pick([3, 4]);
  const colors = shuffle(PALETTE).slice(0, n);
  // Con pesos al azar 1-4, ~40% de las ruletas salían con dos colores
  // empatados en el trozo más grande — "¿qué color es más probable?" deja
  // de tener una única respuesta correcta. Regenera hasta que el máximo
  // sea inequívoco.
  let weights, maxW, maxCount;
  let guard = 0;
  do {
    weights = colors.map(() => randInt(1, 4));
    maxW = Math.max(...weights);
    maxCount = weights.filter((w) => w === maxW).length;
    guard++;
  } while (maxCount > 1 && guard < 30);
  const total = weights.reduce((a, b) => a + b, 0);
  return { colors, weights, total, maxW, maxCount };
}

function wheelSvg(colors, weights, total, rotation) {
  const r = 46, cx = 50, cy = 50;
  let angle = -90;
  let paths = "";
  colors.forEach(([hex], i) => {
    const frac = weights[i] / total;
    const sweep = frac * 360;
    const a0 = (angle * Math.PI) / 180;
    const a1 = ((angle + sweep) * Math.PI) / 180;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const large = sweep > 180 ? 1 : 0;
    paths += `<path d="M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} Z" fill="${hex}" stroke="var(--card)" stroke-width="1.5"/>`;
    angle += sweep;
  });
  return `<svg class="wheel-svg" style="transform:rotate(${rotation}deg)" width="160" height="160" viewBox="0 0 100 100">${paths}</svg>`;
}

export function mountRuletaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let wheel = null;
  let answered = false;

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
    wheel = buildWheel();
    answered = false;
    body.innerHTML = `
      <div class="wheel-wrap">
        <div class="wheel-pointer">▼</div>
        <div data-wheel-holder>${wheelSvg(wheel.colors, wheel.weights, wheel.total, 0)}</div>
      </div>
      <p class="prompt" style="margin-top:14px;">¿Qué color es más probable que salga?</p>
      <div class="choices" data-choices></div>
      <div class="feedback" data-feedback></div>
    `;
    const choicesEl = body.querySelector("[data-choices]");
    const shuffled = shuffle(wheel.colors);
    shuffled.forEach(([hex, name]) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = name;
      btn.style.borderColor = hex;
      btn.addEventListener("click", () => answer(name, btn));
      choicesEl.appendChild(btn);
    });
  }

  function answer(name, btn) {
    if (answered || finished) return;
    answered = true;
    rounds++;
    const idx = wheel.colors.findIndex(([, n]) => n === name);
    const isMax = wheel.weights[idx] === wheel.maxW;
    const correctAndUnique = isMax && wheel.maxCount === 1;
    const feedback = body.querySelector("[data-feedback]");
    [...body.querySelectorAll(".choice-btn")].forEach((b) => (b.disabled = true));
    if (correctAndUnique) {
      score += 10;
      renderScore();
      feedback.textContent = "¡Bien visto!";
      feedback.className = "feedback ok";
    } else {
      lives--;
      renderLives();
      feedback.textContent = "Mira otra vez el tamaño de cada trozo…";
      feedback.className = "feedback bad";
    }
    spin();
  }

  function spin() {
    // Gira la ruleta de verdad y aterriza en un color al azar (ponderado),
    // como recompensa visual — no afecta a la puntuación.
    const r = Math.random() * wheel.total;
    let acc = 0, landedIdx = 0;
    for (let i = 0; i < wheel.weights.length; i++) {
      acc += wheel.weights[i];
      if (r < acc) { landedIdx = i; break; }
    }
    let angle = -90;
    for (let i = 0; i < landedIdx; i++) angle += (wheel.weights[i] / wheel.total) * 360;
    const midSweep = (wheel.weights[landedIdx] / wheel.total) * 360 / 2;
    const targetAngle = angle + midSweep;
    const finalRotation = 360 * 4 - targetAngle;
    const holder = body.querySelector("[data-wheel-holder]");
    const svg = holder.querySelector(".wheel-svg");
    svg.style.transition = "transform 1.4s cubic-bezier(0.2, 0.7, 0.2, 1)";
    requestAnimationFrame(() => {
      svg.style.transform = `rotate(${finalRotation}deg)`;
    });
    setTimeout(() => {
      const feedback = body.querySelector("[data-feedback]");
      feedback.textContent += ` — Salió: ${wheel.colors[landedIdx][1]}`;
      if (lives <= 0) return finish(false);
      setTimeout(nextRound, 900);
    }, 1500);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "ruleta", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎡</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} giros</p>
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
