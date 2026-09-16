// "Atrapa los múltiplos": números suben en continuo; toca solo los que
// cumplen la regla vigente y evita los demás. Flujo continuo, no un
// "pregunta + 4 opciones" como el resto de juegos del motor de quiz.
import { randInt, pick, saveScore } from "./utils.js";

const SLOTS = [6, 30, 54, 78];
const COLORS = ["#e5484d", "#f5a623", "#3ecf8e", "#2ea3c4", "#9b6bf0", "#f06ea1"];

function buildRule() {
  const kind = pick(["multiple", "parity", "compare"]);
  if (kind === "multiple") {
    const n = pick([2, 3, 4, 5]);
    return { label: `Toca los múltiplos de ${n}`, test: (v) => v % n === 0 };
  }
  if (kind === "parity") {
    const even = Math.random() < 0.5;
    return { label: `Toca los números ${even ? "pares" : "impares"}`, test: (v) => (v % 2 === 0) === even };
  }
  const n = randInt(10, 40);
  const greater = Math.random() < 0.5;
  return {
    label: `Toca los números ${greater ? "mayores" : "menores"} que ${n}`,
    test: (v) => (greater ? v > n : v < n),
  };
}

export function mountAtrapaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let rule = null;
  let spawnTimer = null;
  let ruleTimer = null;
  let elapsed = 0;
  let live = [];
  let sky, ruleEl;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body" data-body style="padding:0;"></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const bodyEl = container.querySelector("[data-body]");

  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function newRule() {
    rule = buildRule();
    ruleEl.textContent = rule.label;
  }

  function spawn() {
    if (finished) return;
    const matches = Math.random() < 0.55;
    let val;
    let guard = 0;
    do {
      val = randInt(1, 60);
      guard++;
    } while (rule.test(val) !== matches && guard < 40);
    const el = document.createElement("div");
    el.className = "balloon atrapa-el";
    el.textContent = val;
    el.style.left = `${pick(SLOTS) + randInt(-3, 3)}%`;
    el.style.background = COLORS[randInt(0, COLORS.length - 1)];
    const dur = Math.max(3200, 5600 - elapsed * 40);
    el.style.animationDuration = `${dur}ms`;
    el.addEventListener("click", () => {
      if (finished || el.dataset.done) return;
      el.dataset.done = "1";
      rounds++;
      el.classList.add("popped");
      if (rule.test(val)) {
        score += 10;
        renderScore();
      } else {
        lives--;
        renderLives();
        if (lives <= 0) return setTimeout(() => finish(false), 300);
      }
    });
    el.addEventListener("animationend", () => {
      el.remove();
      live = live.filter((x) => x !== el);
    });
    sky.appendChild(el);
    live.push(el);
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    if (spawnTimer) clearInterval(spawnTimer);
    if (ruleTimer) clearInterval(ruleTimer);
    live.forEach((el) => el.remove());
    live = [];
    if (userExited) return onExit();
    saveScore(client, "atrapa", { score, rounds });
    bodyEl.innerHTML = `
      <div class="end-card">
        <div>🎯</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} números tocados</p>
        <div class="end-actions">
          <button class="primary" data-retry>Jugar otra vez</button>
          <button class="secondary" data-menu>Volver al menú</button>
        </div>
      </div>
    `;
    bodyEl.querySelector("[data-retry]").addEventListener("click", start);
    bodyEl.querySelector("[data-menu]").addEventListener("click", onExit);
  }

  function start() {
    lives = startLives;
    score = 0;
    rounds = 0;
    elapsed = 0;
    finished = false;
    live = [];
    bodyEl.innerHTML = `
      <div class="balloon-sky" data-sky>
        <div class="balloon-question" data-rule></div>
      </div>
    `;
    sky = bodyEl.querySelector("[data-sky]");
    ruleEl = bodyEl.querySelector("[data-rule]");
    renderLives();
    renderScore();
    newRule();
    spawnTimer = setInterval(() => {
      elapsed++;
      spawn();
    }, 950);
    ruleTimer = setInterval(newRule, 9000);
    spawn();
  }

  start();
  return function cleanup() {
    finished = true;
    if (spawnTimer) clearInterval(spawnTimer);
    if (ruleTimer) clearInterval(ruleTimer);
  };
}
