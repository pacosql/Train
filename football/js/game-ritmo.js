// "Compás musical": hay que llenar un compás de 4/4 hasta valer
// exactamente 1 sumando figuras. Todo se cuenta en corcheas (1/8) para
// trabajar con enteros y que las fracciones salgan siempre exactas.
import { randInt, pick, saveScore } from "./utils.js";

const FULL = 8; // 8 corcheas = 1 compás entero
const NOTES = [
  { id: "redonda", eighths: 8, label: "redonda", frac: "1" },
  { id: "blanca", eighths: 4, label: "blanca", frac: "1/2" },
  { id: "negra", eighths: 2, label: "negra", frac: "1/4" },
  { id: "corchea", eighths: 1, label: "corchea", frac: "1/8" },
];

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function fracLabel(eighths) {
  if (eighths === 0) return "0";
  if (eighths === FULL) return "1";
  const g = gcd(eighths, FULL);
  return `${eighths / g}/${FULL / g}`;
}

function glyph(id) {
  const hollow = id === "redonda" || id === "blanca";
  const head = `<ellipse cx="9" cy="20" rx="6" ry="4.4" transform="rotate(-20 9 20)" ${
    hollow ? 'fill="none" stroke="currentColor" stroke-width="2"' : 'fill="currentColor"'
  }/>`;
  const stem = id === "redonda" ? "" : `<rect x="13.6" y="3" width="2" height="17" fill="currentColor"/>`;
  const flag = id === "corchea" ? `<path d="M15.6,3 C21,6 21,11 17,14 C19,10 18.5,6.5 15.6,5.4 Z" fill="currentColor"/>` : "";
  return `<svg class="pe-ritmo-glyph" viewBox="0 0 24 26" aria-hidden="true">${head}${stem}${flag}</svg>`;
}

export function mountRitmoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false;
  let startNotes = []; // figuras que ya vienen puestas en la ronda
  let placed = [];

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

  function total() {
    return placed.reduce((a, n) => a + n.eighths, 0);
  }

  function nextRound() {
    if (finished) return;
    // El compás empieza medio hecho para variar las rondas, pero nunca
    // lleno: siempre debe quedar hueco que el jugador pueda completar.
    const prefill = randInt(0, 5);
    startNotes = [];
    let sum = 0;
    while (sum < prefill) {
      const options = NOTES.filter((n) => n.eighths <= prefill - sum);
      const n = pick(options);
      startNotes.push(n);
      sum += n.eighths;
    }
    placed = startNotes.slice();
    locked = false;

    body.innerHTML = `
      <p class="prompt">Llena el compás de 4/4<small>Suma figuras hasta que valga exactamente 1</small></p>
      <div class="pe-ritmo-bar" data-bar></div>
      <div class="pe-ritmo-total">Llevas <b data-total>0</b> de 1</div>
      <div class="pe-ritmo-notes" data-notes></div>
      <div class="feedback" data-feedback></div>
    `;
    const notesEl = body.querySelector("[data-notes]");
    NOTES.forEach((n) => {
      const btn = document.createElement("button");
      btn.className = "pe-ritmo-note";
      btn.innerHTML = `${glyph(n.id)}<span class="pe-ritmo-name">${n.label}</span><span class="pe-ritmo-frac">${n.frac}</span>`;
      btn.addEventListener("click", () => addNote(n));
      notesEl.appendChild(btn);
    });
    drawBar();
  }

  function drawBar() {
    const bar = body.querySelector("[data-bar]");
    const blocks = placed
      .map(
        (n) =>
          `<span class="pe-ritmo-block" style="width:${(n.eighths / FULL) * 100}%">${glyph(n.id)}</span>`
      )
      .join("");
    const guides = [25, 50, 75].map((p) => `<i class="pe-ritmo-guide" style="left:${p}%"></i>`).join("");
    bar.innerHTML = `${guides}<span class="pe-ritmo-blocks">${blocks}</span>`;
    body.querySelector("[data-total]").textContent = fracLabel(total());
  }

  function addNote(n) {
    if (finished || locked) return;
    const sum = total() + n.eighths;
    const feedback = body.querySelector("[data-feedback]");
    if (sum > FULL) {
      locked = true;
      rounds++;
      lives--;
      renderLives();
      feedback.textContent = `¡Te pasas! ${fracLabel(total())} + ${n.frac} es más de 1`;
      feedback.className = "feedback bad";
      body.querySelector("[data-bar]").classList.add("pe-ritmo-over");
      if (lives <= 0) return setTimeout(() => finish(false), 800);
      // El compás se vacía y vuelve a empezar como estaba al abrir la ronda.
      setTimeout(() => {
        if (finished) return;
        placed = startNotes.slice();
        locked = false;
        body.querySelector("[data-bar]").classList.remove("pe-ritmo-over");
        feedback.textContent = "";
        feedback.className = "feedback";
        drawBar();
      }, 1000);
      return;
    }
    placed.push(n);
    drawBar();
    if (sum === FULL) {
      locked = true;
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = "¡Compás completo!";
      feedback.className = "feedback ok";
      setTimeout(nextRound, 800);
    } else {
      feedback.textContent = `Faltan ${fracLabel(FULL - sum)}`;
      feedback.className = "feedback";
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "ritmo", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎵</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} compases</p>
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
