// "Llena el vaso": alcanzar un volumen exacto con medidas de 100/250/500 ml.
// El nivel del líquido sube animado porque el objetivo es que el litro se
// vea como altura, no como una cifra abstracta.
import { randInt, saveScore } from "./utils.js";

const MEASURES = [100, 250, 500];
const CAPACITY = 2000; // ml que caben en el vaso dibujado

function format(ml) {
  if (ml < 1000) return `${ml} ml`;
  let s = (ml / 1000).toFixed(2);
  while (s.endsWith("0")) s = s.slice(0, -1);
  if (s.endsWith(".")) s = s.slice(0, -1);
  return `${s.replace(".", ",")} L`;
}

// ¿Queda alguna combinación de 100/250/500 que sume justo `rest`?
// Sirve para avisar de callejones sin salida (p. ej. faltan 150 ml).
function reachable(rest) {
  if (rest < 0) return false;
  for (let b = 0; b * 250 <= rest; b++) {
    if ((rest - b * 250) % 100 === 0) return true;
  }
  return rest === 0;
}

export function mountVasoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let target = 0;
  let current = 0;
  let lastTarget = -1;
  let locked = false; // evita verter mientras se resuelve la ronda
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
    // El objetivo se construye SUMANDO medidas reales, así siempre es
    // alcanzable; los límites evitan objetivos de un solo toque o desbordes.
    let a = 0;
    let b = 0;
    let c = 0;
    do {
      a = randInt(0, 4);
      b = randInt(0, 4);
      c = randInt(0, 2);
      target = a * 100 + b * 250 + c * 500;
    } while (a + b + c < 3 || target < 600 || target > 1750 || target === lastTarget);
    lastTarget = target;
    current = 0;
    locked = false;

    body.innerHTML = `
      <p class="prompt">Llena justo <b>${format(target)}</b><small>Añade medidas hasta llegar exacto</small></p>
      <div class="pb-vaso-zone">
        <div class="pb-glass">
          <div class="pb-liquid" data-liquid style="height:0%"></div>
          <span class="pb-glass-mark" style="bottom:25%"><i>0,5 L</i></span>
          <span class="pb-glass-mark" style="bottom:50%"><i>1 L</i></span>
          <span class="pb-glass-mark" style="bottom:75%"><i>1,5 L</i></span>
        </div>
        <div class="pb-vaso-info">
          <div class="pb-vaso-now" data-now>0 ml</div>
          <div class="pb-vaso-target">de ${format(target)}</div>
        </div>
      </div>
      <div class="pb-measures" data-measures></div>
      <div class="feedback" data-feedback></div>
      <button class="secondary" data-empty style="margin-top:10px;">↺ Vaciar el vaso</button>
    `;

    const measuresEl = body.querySelector("[data-measures]");
    MEASURES.forEach((ml) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn pb-measure-btn";
      btn.type = "button";
      btn.innerHTML = `💧<br>+${ml} ml`;
      btn.addEventListener("click", () => pour(ml));
      measuresEl.appendChild(btn);
    });
    body.querySelector("[data-empty]").addEventListener("click", () => {
      if (finished || locked) return;
      current = 0;
      renderGlass();
      const feedback = body.querySelector("[data-feedback]");
      feedback.textContent = "";
      feedback.className = "feedback";
    });
    renderGlass();
  }

  function renderGlass() {
    body.querySelector("[data-liquid]").style.height = `${Math.min((current / CAPACITY) * 100, 100)}%`;
    body.querySelector("[data-now]").textContent = format(current);
  }

  function pour(ml) {
    if (finished || locked) return;
    current += ml;
    renderGlass();
    const feedback = body.querySelector("[data-feedback]");
    if (current === target) {
      locked = true;
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = "¡Nivel exacto!";
      feedback.className = "feedback ok";
      later(nextRound, 800);
    } else if (current > target) {
      locked = true;
      rounds++;
      lives--;
      renderLives();
      feedback.textContent = "Se ha desbordado — el vaso se vacía";
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 800);
      later(() => {
        current = 0;
        locked = false;
        renderGlass();
        feedback.textContent = "";
        feedback.className = "feedback";
      }, 800);
    } else if (!reachable(target - current)) {
      feedback.textContent = `Así ya no llegas justo (faltan ${format(target - current)}): vacía y prueba otro camino`;
      feedback.className = "feedback bad";
    } else {
      feedback.textContent = `Faltan ${format(target - current)}`;
      feedback.className = "feedback";
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
    saveScore(client, "vaso", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🥛</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} vasos medidos</p>
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
    lastTarget = -1;
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
