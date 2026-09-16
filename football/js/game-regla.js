// "Mide con la regla": la respuesta se toca sobre la propia regla.
// Las rondas con desplazamiento (el objeto no empieza en el 0) son las que
// enseñan lo importante: medir es restar, no leer el número final.
import { randInt, saveScore } from "./utils.js";

const CM = 12; // largo de la regla en cm
const PAD = 10; // px de margen dentro de la regla: el 0 y el 12 no se salen

// Misma proyección para la regla y para el lápiz, así la punta del lápiz
// cae SIEMPRE justo encima de su marca sea cual sea el ancho de pantalla.
function posAt(cm) {
  return `calc(${PAD}px + (100% - ${PAD * 2}px) * ${cm / CM})`;
}

export function mountReglaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let start0 = 0;
  let end0 = 0;
  let length = 0;
  let lastKey = "";
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
    // La longitud existe siempre como marca tocable (1..CM) y el objeto
    // nunca se sale de la regla; 2 de cada 3 rondas van desplazadas.
    let key = "";
    do {
      length = randInt(2, 9);
      const offset = randInt(0, 2) > 0;
      start0 = offset ? randInt(1, CM - length) : 0;
      end0 = start0 + length;
      key = `${start0}-${end0}`;
    } while (end0 > CM || length < 2 || key === lastKey);
    lastKey = key;
    locked = false;

    body.innerHTML = `
      <p class="prompt">¿Cuánto mide el lápiz?<small>Toca en la regla el número de centímetros que mide</small></p>
      <div class="pb-ruler-zone">
        <div class="pb-pencil-lane">
          <div class="pb-pencil" data-pencil>
            <span class="pb-pencil-tip"></span>
          </div>
        </div>
        <div class="pb-ruler" data-ruler></div>
      </div>
      <div class="feedback" data-feedback></div>
    `;

    const pencil = body.querySelector("[data-pencil]");
    pencil.style.left = posAt(start0);
    pencil.style.width = `calc((100% - ${PAD * 2}px) * ${length / CM})`;

    const ruler = body.querySelector("[data-ruler]");
    for (let i = 0; i <= CM; i++) {
      const mark = document.createElement("button");
      mark.className = "pb-mark";
      mark.type = "button";
      mark.dataset.cm = String(i);
      mark.style.left = posAt(i);
      mark.innerHTML = `<span class="pb-mark-line"></span><span class="pb-mark-num">${i}</span>`;
      mark.addEventListener("click", () => answer(i, mark));
      ruler.appendChild(mark);
    }
  }

  function answer(cm, mark) {
    if (finished || locked) return;
    locked = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    if (cm === length) {
      mark.classList.add("correct");
      score += 10;
      renderScore();
      feedback.textContent = start0 > 0 ? `¡Sí! De ${start0} a ${end0} hay ${length} cm` : `¡Sí! Mide ${length} cm`;
      feedback.className = "feedback ok";
      later(nextRound, 950);
    } else {
      mark.classList.add("wrong");
      const good = body.querySelector(`[data-cm="${length}"]`);
      if (good) good.classList.add("correct");
      lives--;
      renderLives();
      feedback.textContent = `Empieza en ${start0} y acaba en ${end0}: mide ${length} cm`;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 1100);
      later(nextRound, 1100);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "regla", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📏</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} medidas tomadas</p>
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
    lastKey = "";
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
