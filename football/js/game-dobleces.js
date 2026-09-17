// "Dobleces de masa": en la panadería, cada doblez DUPLICA las capas
// (1 → 2 → 4 → 8 …). El dedo dobla la lámina y la pila crece al doble de
// alto cada vez, así que 2⁶ se ve como altura en vez de como una cuenta.
// Dos tipos de ronda: doblar hasta un número de capas (contar dobleces) y
// la inversión "he dado 6 dobleces, ¿cuántas capas hay?".
import { randInt, saveScore } from "./utils.js";

const MAX_FOLDS = 7; // tope de la mesa: más allá la masa ya no se dobla

// Escalera de potencias de 2 que se muestra al fallar.
const LADDER = [0, 1, 2, 3, 4, 5, 6, 7];

export function makeDoblecesRound(streak, lastKey) {
  const minN = streak < 4 ? 2 : 3;
  const maxN = streak < 2 ? 4 : streak < 4 ? 5 : 6;
  let mode = "fold";
  let n = 3;
  let key = "fold3";
  let guard = 0;
  let ok = false;
  while (guard < 300 && !ok) {
    guard++;
    // Las primeras rondas siempre son de doblar: primero se entiende el gesto.
    mode = streak < 1 ? "fold" : (randInt(0, 1) === 0 ? "fold" : "invert");
    const top = mode === "invert" ? Math.min(maxN + 1, MAX_FOLDS) : maxN;
    n = randInt(minN, top);
    key = `${mode}${n}`;
    ok = key !== lastKey;
  }
  if (!ok) { mode = "fold"; n = 3; key = "fold3"; }
  return { mode, n, layers: 2 ** n, key };
}

export function mountDoblecesGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let locked = false;
  let round = null;
  let folds = 0;
  let typed = "";
  let token = 0; // identifica la ronda en curso: corta animaciones viejas
  let lastKey = "";
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
    round = makeDoblecesRound(streak, lastKey);
    lastKey = round.key;
    token++;
    folds = 0;
    typed = "";
    locked = false;
    if (round.mode === "fold") renderFold(); else renderInvert();
  }

  // Altura de cada capa: la pila objetivo ocupa la mitad del molde, así que
  // cada doblez se ve doblar la altura sin chivar cuándo parar.
  function unitFor(layers) {
    return Math.max(1.2, Math.min(20, 150 / (2 * layers)));
  }

  function stackHtml(layers, unit) {
    let html = "";
    for (let i = 0; i < layers; i++) {
      html += `<span class="db-layer" style="height:${unit}px"></span>`;
    }
    return html;
  }

  // ---------- Ronda "dobla hasta N capas" ----------
  function renderFold() {
    const unit = unitFor(round.layers);
    body.innerHTML = `
      <p class="prompt">Dobla hasta tener <b>${round.layers} capas</b><small>Cada doblez duplica las capas</small></p>
      <div class="db-table">
        <div class="db-stack" data-stack>${stackHtml(1, unit)}</div>
      </div>
      <div class="db-count">dobleces: <b data-folds>0</b></div>
      <div class="db-actions">
        <button class="choice-btn db-fold-btn" data-fold>✋ Doblar</button>
        <button class="primary" data-bake>🔥 Al horno</button>
      </div>
      <button class="secondary db-reset" data-reset>↺ Estirar de nuevo</button>
      <div class="db-ladder" data-ladder></div>
      <div class="feedback" data-feedback></div>
    `;
    body.querySelector("[data-fold]").addEventListener("click", doFold);
    body.querySelector("[data-bake]").addEventListener("click", bake);
    body.querySelector("[data-reset]").addEventListener("click", () => {
      if (finished || locked) return;
      folds = 0;
      paintStack();
    });
    paintStack();
  }

  function paintStack() {
    const unit = unitFor(round.layers);
    const stack = body.querySelector("[data-stack]");
    stack.innerHTML = stackHtml(2 ** folds, unit);
    body.querySelector("[data-folds]").textContent = folds;
  }

  function doFold() {
    if (finished || locked) return;
    const feedback = body.querySelector("[data-feedback]");
    if (folds >= MAX_FOLDS) {
      feedback.textContent = "La masa ya no se puede doblar más";
      feedback.className = "feedback bad";
      return;
    }
    folds++;
    paintStack();
    // Lámina fantasma que cae sobre la pila: el gesto del doblez.
    const stack = body.querySelector("[data-stack]");
    const ghost = document.createElement("span");
    ghost.className = "db-ghost";
    ghost.addEventListener("animationend", () => ghost.remove());
    stack.appendChild(ghost);
    feedback.textContent = "";
    feedback.className = "feedback";
  }

  function bake() {
    if (finished || locked) return;
    const fb = body.querySelector("[data-feedback]");
    if (folds === 0) {
      // Aviso sin castigo: todavía no ha doblado nada.
      fb.textContent = "Dobla la masa al menos una vez";
      fb.className = "feedback bad";
      return;
    }
    locked = true;
    rounds++;
    const got = 2 ** folds;
    const feedback = body.querySelector("[data-feedback]");
    if (got === round.layers) {
      score += 10;
      streak++;
      renderScore();
      feedback.innerHTML = `¡Hojaldre perfecto! 2<sup>${folds}</sup> = ${round.layers} capas`;
      feedback.className = "feedback ok";
      later(nextRound, 1000);
      return;
    }
    lives--;
    streak = 0;
    renderLives();
    showLadder(got);
    feedback.innerHTML = `Con ${folds} ${folds === 1 ? "doblez" : "dobleces"} tienes 2<sup>${folds}</sup> = <b>${got}</b> capas, no ${round.layers}`;
    feedback.className = "feedback bad";
    if (lives <= 0) return later(() => finish(false), 3000);
    later(nextRound, 3000);
  }

  // ---------- Ronda de inversión: dobleces → capas ----------
  function renderInvert() {
    const unit = Math.max(1.2, Math.min(20, 150 / round.layers));
    body.innerHTML = `
      <p class="prompt">He dado <b>${round.n} dobleces</b>. ¿Cuántas capas hay?<small>Cada doblez duplica las capas</small></p>
      <div class="db-table">
        <div class="db-stack" data-stack>${stackHtml(1, unit)}</div>
      </div>
      <div class="db-count">dobleces: <b data-folds>0</b> de ${round.n}</div>
      <div class="keypad-display" data-display>&nbsp;</div>
      <div class="keypad" data-keypad></div>
      <div class="db-ladder" data-ladder></div>
      <div class="feedback" data-feedback></div>
    `;
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn keypad-key";
      btn.type = "button";
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
    animateFolds(unit, 1, token);
  }

  // Los dobleces se ven ocurrir uno a uno: la altura se duplica en cada paso.
  function animateFolds(unit, done, mine) {
    if (finished || mine !== token) return;
    const stack = body.querySelector("[data-stack]");
    if (!stack) return;
    stack.innerHTML = stackHtml(2 ** done, unit);
    body.querySelector("[data-folds]").textContent = done;
    if (done < round.n) later(() => animateFolds(unit, done + 1, mine), 320);
  }

  function pressKey(key) {
    if (finished || locked) return;
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (key === "✓") return submit();
    else if (typed.length < 4) typed += key;
    body.querySelector("[data-display]").textContent = typed || " ";
  }

  function submit() {
    if (finished || locked || typed === "") return;
    locked = true;
    rounds++;
    const value = Number(typed);
    const feedback = body.querySelector("[data-feedback]");
    if (value === round.layers) {
      score += 10;
      streak++;
      renderScore();
      feedback.innerHTML = `¡Sí! 2<sup>${round.n}</sup> = ${round.layers} capas`;
      feedback.className = "feedback ok";
      later(nextRound, 1000);
      return;
    }
    lives--;
    streak = 0;
    renderLives();
    showLadder(value);
    feedback.innerHTML = `${round.n} dobleces → 2<sup>${round.n}</sup> = <b>${round.layers}</b> capas`;
    feedback.className = "feedback bad";
    if (lives <= 0) return later(() => finish(false), 3000);
    later(nextRound, 3000);
  }

  // Escalera 1-2-4-8-16-32-64-128: señala dónde estaba la respuesta y
  // dónde se quedó el jugador.
  function showLadder(got) {
    const el = body.querySelector("[data-ladder]");
    if (!el) return;
    el.innerHTML = LADDER.map((e) => {
      const v = 2 ** e;
      const cls = v === round.layers ? "db-step db-step-good"
        : v === got ? "db-step db-step-bad" : "db-step";
      return `<span class="${cls}"><i>${e}</i>${v}</span>`;
    }).join("<b class=\"db-arrow\">×2</b>");
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "dobleces", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🥐</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} láminas de hojaldre</p>
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
    streak = 0;
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
