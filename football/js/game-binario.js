// "Bombillas binarias": cinco bombillas valen 16, 8, 4, 2 y 1. Encender
// las adecuadas forma el número pedido — es el valor posicional en base 2
// hecho tangible.
import { randInt, saveScore } from "./utils.js";

const PLACES = [16, 8, 4, 2, 1];

function bulbSvg() {
  return `
    <svg class="pe-bin-svg" viewBox="0 0 40 52" aria-hidden="true">
      <path class="pe-bin-glass" d="M20,4 a13,13 0 0 1 8.4,23 c-1.6,1.4 -2.4,2.8 -2.6,4.4 h-11.6 c-0.2,-1.6 -1,-3 -2.6,-4.4 A13,13 0 0 1 20,4 Z"/>
      <path class="pe-bin-fil" d="M15,24 l3,-6 l2,4 l2,-4 l3,6"/>
      <rect class="pe-bin-cap" x="13.5" y="34" width="13" height="4" rx="1.5"/>
      <rect class="pe-bin-cap" x="13.5" y="40" width="13" height="4" rx="1.5"/>
    </svg>`;
}

export function mountBinarioGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let answered = false;
  let target = 1;
  let bulbs = [false, false, false, false, false];

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

  function current() {
    return bulbs.reduce((a, on, i) => a + (on ? PLACES[i] : 0), 0);
  }

  function nextRound() {
    if (finished) return;
    // Nunca se repite el número de la ronda anterior: parecería que el
    // juego se ha quedado colgado.
    const prev = target;
    let n, guard = 0;
    do {
      n = randInt(1, 31);
      guard++;
    } while (n === prev && guard < 20);
    target = n;
    bulbs = [false, false, false, false, false];
    answered = false;

    body.innerHTML = `
      <p class="prompt">Enciende el número <b>${target}</b><small>Cada bombilla vale lo que pone debajo</small></p>
      <div class="pe-bin-row" data-row></div>
      <div class="pe-bin-readout">Ahora vale <b data-readout>0</b></div>
      <div class="feedback" data-feedback></div>
      <button class="primary" data-confirm style="margin-top:12px;">Confirmar</button>
    `;
    const row = body.querySelector("[data-row]");
    PLACES.forEach((v, i) => {
      const btn = document.createElement("button");
      btn.className = "pe-bin-bulb";
      btn.innerHTML = `${bulbSvg()}<span class="pe-bin-place">${v}</span>`;
      btn.addEventListener("click", () => toggle(i, btn));
      row.appendChild(btn);
    });
    body.querySelector("[data-confirm]").addEventListener("click", confirm);
  }

  function toggle(i, btn) {
    if (finished || answered) return;
    bulbs[i] = !bulbs[i];
    btn.classList.toggle("on", bulbs[i]);
    body.querySelector("[data-readout]").textContent = current();
  }

  function confirm() {
    if (finished || answered) return;
    answered = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    if (current() === target) {
      score += 10;
      renderScore();
      feedback.textContent = "¡Bombillas correctas!";
      feedback.className = "feedback ok";
      setTimeout(nextRound, 750);
    } else {
      lives--;
      renderLives();
      const bits = PLACES.map((v) => (Math.floor(target / v) % 2 ? "1" : "0")).join("");
      feedback.textContent = `Tenías ${current()} — ${target} es ${bits}`;
      feedback.className = "feedback bad";
      if (lives <= 0) return setTimeout(() => finish(false), 900);
      setTimeout(nextRound, 1300);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "binario", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>💡</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} números</p>
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
    target = 0; // 0 no es un objetivo posible, así la 1ª ronda no excluye ningún número
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
  };
}
