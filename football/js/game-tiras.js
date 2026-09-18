// "Diagrama de tiras": reparto proporcional al estilo tape diagram de
// Zearn/Singapore Math. Dos personas se reparten un total en una razón
// simple (a:b segmentos); el diagrama muestra los segmentos ya marcados
// (sin decir cuánto vale cada uno) y el total de la suma. El jugador debe
// hallar el valor de 1 segmento, o cuánto tiene una persona concreta.
import { randInt, pick, saveScore } from "./utils.js";

const NAMES = [
  "Ana", "Luis", "Marta", "Carlos", "Sofía", "Pablo",
  "Lucía", "Diego", "Elena", "Mario", "Nora", "Iván",
];

const ITEMS = [
  "canicas", "caramelos", "cromos", "monedas", "pegatinas",
  "lápices", "libros", "globos", "chapas", "botones",
];

const MAX_DIGITS = 3; // total máximo posible: (4+5)*12 = 108

// Genera una ronda "al revés": primero el valor de 1 segmento (entero
// limpio), luego los segmentos de cada persona, y de ahí el total — así
// el reparto siempre cae exacto y sin decimales.
export function generateTirasRound() {
  const unitValue = randInt(2, 12);

  let a = randInt(1, 5);
  let b = randInt(1, 5);
  while (b === a) b = randInt(1, 5);

  const total = (a + b) * unitValue;
  const val0 = a * unitValue;
  const val1 = b * unitValue;

  let name0 = pick(NAMES);
  let name1 = pick(NAMES);
  while (name1 === name0) name1 = pick(NAMES);

  const item = pick(ITEMS);

  const questionType = Math.random() < 0.5 ? "unit" : "person";
  const askIndex = randInt(0, 1); // solo se usa si questionType === "person"
  const answer = questionType === "unit" ? unitValue : (askIndex === 0 ? val0 : val1);

  return {
    unitValue,
    a,
    b,
    total,
    val0,
    val1,
    names: [name0, name1],
    item,
    questionType,
    askIndex,
    answer,
  };
}

export function mountTirasGame(container, { client, onExit }) {
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

  function segmentsHtml(count) {
    let html = "";
    for (let i = 0; i < count; i++) html += `<div class="tir-segment"></div>`;
    return html;
  }

  function questionText() {
    if (round.questionType === "unit") {
      return "¿Cuánto vale 1 segmento?";
    }
    const name = round.names[round.askIndex];
    return `¿Cuánto tiene ${name}?`;
  }

  function nextRound() {
    round = generateTirasRound();
    typed = "";
    locked = false;

    const [name0, name1] = round.names;

    body.innerHTML = `
      <p class="tir-intro">
        <b>${name0}</b> y <b>${name1}</b> tienen entre los dos
        <b>${round.total} ${round.item}</b>, repartidos según este diagrama de tiras:
      </p>
      <div class="tir-diagram">
        <div class="tir-row">
          <span class="tir-name">${name0}</span>
          <div class="tir-bar">${segmentsHtml(round.a)}</div>
        </div>
        <div class="tir-row">
          <span class="tir-name">${name1}</span>
          <div class="tir-bar">${segmentsHtml(round.b)}</div>
        </div>
      </div>
      <div class="tir-total">Total = ${round.total} ${round.item}</div>
      <p class="prompt">${questionText()}</p>
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
    const [name0, name1] = round.names;
    return (
      `${round.total} ${round.item} repartidos en ${round.a + round.b} segmentos ` +
      `(${round.a}+${round.b}) = ${round.unitValue} ${round.item} por segmento. ` +
      `${name0} tiene ${round.a} segmento${round.a === 1 ? "" : "s"} = ${round.val0}. ` +
      `${name1} tiene ${round.b} segmento${round.b === 1 ? "" : "s"} = ${round.val1}.`
    );
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
        later(() => finish(false), 1800);
      } else {
        later(nextRound, 2200);
      }
    }
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "tiras", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📊</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} repartos resueltos</p>
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
