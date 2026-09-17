// "Giros y direcciones": rotar sobre la rosa de los vientos. La flecha
// gira de verdad al responder porque el giro se entiende viéndolo, no
// leyendo "135° a la derecha".
import { randInt, saveScore } from "./utils.js";

// Orden horario desde el norte: el índice x 45 es el ángulo en grados.
const ROSA = [
  { sigla: "N", nombre: "norte" },
  { sigla: "NE", nombre: "noreste" },
  { sigla: "E", nombre: "este" },
  { sigla: "SE", nombre: "sureste" },
  { sigla: "S", nombre: "sur" },
  { sigla: "SO", nombre: "suroeste" },
  { sigla: "O", nombre: "oeste" },
  { sigla: "NO", nombre: "noroeste" },
];

export function mountBrujulaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let timers = [];
  let correctIdx = 0;
  let startAngle = 0;
  let endAngle = 0;

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
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function nextRound() {
    const desdeIdx = randInt(0, 7);
    const pasos = randInt(1, 7); // 1..7 pasos de 45°: nunca un giro completo
    const derecha = randInt(0, 1) === 0;
    const signo = derecha ? 1 : -1;
    // Resto siempre positivo: en JS (-1 % 8) da -1, no 7.
    correctIdx = (((desdeIdx + signo * pasos) % 8) + 8) % 8;
    startAngle = desdeIdx * 45;
    endAngle = startAngle + signo * pasos * 45;

    const desde = ROSA[desdeIdx];
    body.innerHTML = `
      <div class="rose-wrap">
        <p class="prompt rose-prompt">
          Miras al <b>${desde.sigla}</b> y giras <b>${pasos * 45}°</b> a la ${derecha ? "derecha ↻" : "izquierda ↺"}
          <small>${desde.nombre} — toca hacia dónde miras ahora</small>
        </p>
        <div class="rose" data-rose>
          <div class="rose-ring"></div>
          <div class="rose-cross"></div>
          <div class="rose-arrow" data-arrow style="transform:translateX(-50%) rotate(${startAngle}deg)">
            <div class="rose-head"></div>
          </div>
          <div class="rose-hub"></div>
        </div>
        <div class="feedback" data-feedback></div>
      </div>
    `;
    const rose = body.querySelector("[data-rose]");
    ROSA.forEach((dir, i) => {
      const rad = (i * 45 * Math.PI) / 180;
      const btn = document.createElement("button");
      btn.className = `rose-point${i % 2 === 0 ? " rose-cardinal" : ""}`;
      btn.dataset.idx = i;
      btn.textContent = dir.sigla;
      btn.style.left = `${50 + Math.sin(rad) * 41}%`;
      btn.style.top = `${50 - Math.cos(rad) * 41}%`;
      btn.addEventListener("click", () => answer(i, btn));
      rose.appendChild(btn);
    });
  }

  function answer(idx, btn) {
    if (finished) return;
    rounds++;
    const rose = body.querySelector("[data-rose]");
    rose.querySelectorAll(".rose-point").forEach((b) => { b.disabled = true; });
    // Gira la flecha al resultado real para que se vea el recorrido.
    const arrow = body.querySelector("[data-arrow]");
    arrow.style.transform = `translateX(-50%) rotate(${endAngle}deg)`;

    const feedback = body.querySelector("[data-feedback]");
    if (idx === correctIdx) {
      btn.classList.add("correct");
      score += 10;
      renderScore();
      feedback.textContent = `¡Sí! Ahora miras al ${ROSA[correctIdx].nombre}`;
      feedback.className = "feedback ok";
      later(nextRound, 1000);
    } else {
      btn.classList.add("wrong");
      rose.querySelector(`[data-idx="${correctIdx}"]`).classList.add("correct");
      lives--;
      renderLives();
      feedback.textContent = `Era el ${ROSA[correctIdx].nombre} (${ROSA[correctIdx].sigla})`;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 1000);
      later(nextRound, 1400);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimers();
    if (userExited) return onExit();
    saveScore(client, "brujula", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧭</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} rondas</p>
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
    clearTimers();
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
    clearTimers();
  };
}
