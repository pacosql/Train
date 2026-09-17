// "Tachones": una fila del 2 al 12 que solo se puede tachar en orden
// creciente estricto (mecánica del juego de mesa Qwixx). Lo que te saltas
// se pierde para siempre, así que cada decisión es una apuesta y el juego
// te enseña las 36 combinaciones de los dos dados: decidir ES calcular la
// probabilidad.
import { clamp, pick, randInt, saveScore } from "./utils.js";

// Cuántas de las 36 combinaciones de dos dados dan cada suma (índice 2..12).
const COMBOS = [0, 0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];

// Combinaciones que caen ESTRICTAMENTE por encima de `last` (las que aún
// sirven cuando el último tachón está en `last`).
export function combosAbove(last) {
  let n = 0;
  for (let s = last + 1; s <= 12; s++) n += COMBOS[s] || 0;
  return n;
}

// Probabilidad de completar `need` tachones con `rollsLeft` tiradas jugando
// de forma óptima, con el último tachón en `last` (1 = fila limpia).
// Programación dinámica exacta: es la que usamos para generar rondas
// jugables y para explicarle al jugador el coste real de su decisión.
export function completionProb(last, need, rollsLeft, memo = {}) {
  if (need <= 0) return 1;
  if (rollsLeft <= 0) return 0;
  const key = last + "|" + need + "|" + rollsLeft;
  if (memo[key] !== undefined) return memo[key];
  const passProb = completionProb(last, need, rollsLeft - 1, memo);
  let total = 0;
  for (let s = 2; s <= 12; s++) {
    let best = passProb;
    if (s > last) {
      const crossProb = completionProb(s, need - 1, rollsLeft - 1, memo);
      if (crossProb > best) best = crossProb;
    }
    total += (COMBOS[s] / 36) * best;
  }
  memo[key] = total;
  return total;
}

// Genera una ronda: cuántos tachones hacen falta y cuántas tiradas hay.
// Cada nivel define una banda de probabilidad de éxito jugando de forma
// óptima: nunca una ronda perdida de salida ni una regalada, y como máximo
// 9 tiradas para que la ronda se resuelva en menos de un minuto.
const LEVELS = [
  { need: 2, min: 0.62, max: 0.9 },
  { need: 3, min: 0.6, max: 0.78 },
  { need: 3, min: 0.45, max: 0.65 },
];

export function makeTachonesRound(level) {
  const cfg = LEVELS[clamp(level, 0, LEVELS.length - 1)];
  const memo = {};
  const options = [];
  for (let rolls = cfg.need; rolls <= 9; rolls++) {
    const prob = completionProb(1, cfg.need, rolls, memo);
    if (prob >= cfg.min && prob <= cfg.max) options.push({ need: cfg.need, rolls, prob });
  }
  if (!options.length) {
    // Guarda agotada: caso fijo válido (jugable y completable, nunca roto).
    const rolls = cfg.need + 5;
    return { need: cfg.need, rolls, prob: completionProb(1, cfg.need, rolls, memo) };
  }
  return pick(options);
}

function pct(p) {
  return `${Math.round(p * 100)}%`;
}

// Dado dibujado con puntos (nada de cifras: se lee de un vistazo).
function diceSvg(n) {
  const spots = {
    1: [[50, 50]],
    2: [[28, 28], [72, 72]],
    3: [[28, 28], [50, 50], [72, 72]],
    4: [[28, 28], [72, 28], [28, 72], [72, 72]],
    5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
    6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]],
  }[n] || [];
  const pips = spots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" class="tc-pip"/>`).join("");
  return `<svg class="tc-die" viewBox="0 0 100 100" aria-hidden="true">
      <rect x="3" y="3" width="94" height="94" rx="18" class="tc-die-face"/>${pips}
    </svg>`;
}

export function mountTachonesGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  const timers = [];

  // Estado de la ronda en curso.
  let need = 0;
  let rolls = 0;
  let rollsLeft = 0;
  let crossed = [];
  let last = 1; // último número tachado (1 = fila limpia)
  let dice = [1, 1];
  let locked = true;
  let decisions = [];
  let startProb = 0;

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
    const round = makeTachonesRound(Math.floor(streak / 2));
    need = round.need;
    rolls = round.rolls;
    startProb = round.prob;
    rollsLeft = rolls;
    crossed = [];
    last = 1;
    decisions = [];
    locked = true;

    body.innerHTML = `
      <p class="prompt">Tacha ${need} números<small>Solo se tacha hacia la derecha: lo que te saltas se pierde</small></p>
      <div class="tc-row" data-row></div>
      <div class="tc-meta">
        <span data-meta-cross></span>
        <span data-meta-rolls></span>
      </div>
      <div class="tc-dice" data-dice></div>
      <div class="tc-odds" data-odds></div>
      <div class="tc-actions">
        <button class="primary tc-btn" data-cross>Tachar</button>
        <button class="secondary tc-btn" data-pass>Pasar</button>
      </div>
      <div class="feedback" data-feedback></div>
    `;
    body.querySelector("[data-cross]").addEventListener("click", () => decide(true));
    body.querySelector("[data-pass]").addEventListener("click", () => decide(false));
    renderRow();
    renderMeta();
    body.querySelector("[data-dice]").innerHTML = `${diceSvg(0)}${diceSvg(0)}`;
    body.querySelector("[data-odds]").innerHTML = `Sirven las sumas mayores que el último tachón`;
    setButtons(false);
    later(rollDice, 450);
  }

  function renderRow() {
    const row = body.querySelector("[data-row]");
    if (!row) return;
    let html = "";
    for (let n = 2; n <= 12; n++) {
      let cls = "tc-cell";
      if (crossed.includes(n)) cls += " is-crossed";
      else if (n < last) cls += " is-lost";
      if (!locked && n === dice[0] + dice[1] && n > last) cls += " is-hot";
      html += `<div class="${cls}"><span>${n}</span></div>`;
    }
    row.innerHTML = html;
  }

  function renderMeta() {
    const a = body.querySelector("[data-meta-cross]");
    const b = body.querySelector("[data-meta-rolls]");
    if (a) a.innerHTML = `✕ <b>${crossed.length}</b>/${need}`;
    if (b) b.innerHTML = `🎲 <b>${rollsLeft}</b> tiradas`;
  }

  function setButtons(enabled, sum, legal) {
    const cross = body.querySelector("[data-cross]");
    const pass = body.querySelector("[data-pass]");
    if (!cross || !pass) return;
    cross.disabled = !enabled || !legal;
    pass.disabled = !enabled;
    cross.textContent = sum ? (legal ? `Tachar el ${sum}` : `El ${sum} ya no vale`) : "Tachar";
  }

  function rollDice() {
    if (finished) return;
    dice = [randInt(1, 6), randInt(1, 6)];
    rollsLeft--;
    const sum = dice[0] + dice[1];
    const legal = sum > last;
    locked = false;
    renderRow();
    renderMeta();
    body.querySelector("[data-dice]").innerHTML = `${diceSvg(dice[0])}${diceSvg(dice[1])}`;
    const useful = combosAbove(last);
    const afterUseful = combosAbove(sum);
    const odds = body.querySelector("[data-odds]");
    if (legal) {
      odds.innerHTML = `Ahora te sirven <b>${useful}</b> de 36 combinaciones.
        Si tachas el ${sum}, te quedarán <b>${afterUseful}</b> de 36.`;
    } else {
      odds.innerHTML = `El ${sum} está detrás de tu último tachón: esta tirada
        se pierde. Te siguen sirviendo <b>${useful}</b> de 36.`;
    }
    setButtons(true, sum, legal);
    const feedback = body.querySelector("[data-feedback]");
    feedback.textContent = "";
    feedback.className = "feedback";
    if (!legal) later(() => decide(false, true), 1100);
  }

  function decide(doCross, auto) {
    if (finished || locked) return;
    const sum = dice[0] + dice[1];
    if (doCross && sum <= last) return;
    locked = true;
    setButtons(false);

    // Probabilidad de completar con cada opción (antes de aplicarla).
    const memo = {};
    const needLeft = need - crossed.length;
    const probCross = sum > last ? completionProb(sum, needLeft - 1, rollsLeft, memo) : -1;
    const probPass = completionProb(last, needLeft, rollsLeft, memo);
    const chosenProb = doCross ? probCross : probPass;
    const bestProb = Math.max(probCross, probPass);
    if (!auto) {
      decisions.push({ last, sum, doCross, chosenProb, bestProb, rollsLeft });
    }

    const feedback = body.querySelector("[data-feedback]");
    if (doCross) {
      crossed.push(sum);
      last = sum;
      renderRow();
      renderMeta();
      feedback.textContent = `Tachas el ${sum} — te quedan ${combosAbove(last)} de 36 combinaciones útiles`;
      feedback.className = "feedback ok";
    } else {
      renderRow();
      feedback.textContent = auto
        ? `Tirada perdida: el ${sum} no iba hacia delante`
        : `Pasas: guardas los ${combosAbove(last)} de 36 que te sirven`;
      feedback.className = "feedback";
    }

    if (crossed.length >= need) return later(winRound, 700);
    if (rollsLeft <= 0) return later(loseRound, 700);
    later(rollDice, 700);
  }

  function winRound() {
    rounds++;
    streak++;
    score += 10;
    renderScore();
    const feedback = body.querySelector("[data-feedback]");
    feedback.textContent = `¡${need} tachones en orden! +10`;
    feedback.className = "feedback ok";
    later(nextRound, 900);
  }

  // Al fallar, la tabla 6×6 de sumas explica POR QUÉ: se marca en verde lo
  // que servía y en rojo lo que ya no, en el momento de la peor decisión.
  function loseRound() {
    rounds++;
    streak = 0;
    lives--;
    renderLives();

    let worst = null;
    decisions.forEach((d) => {
      const lost = d.bestProb - d.chosenProb;
      if (lost > 0.03 && (!worst || lost > worst.bestProb - worst.chosenProb)) worst = d;
    });
    const ref = worst ? worst.sum : last;
    const refLast = worst ? worst.last : last;
    const useful = combosAbove(ref);

    let why;
    if (worst && worst.doCross) {
      why = `Tachaste el <b>${worst.sum}</b> teniendo el tachón en
        ${refLast === 1 ? "nada" : refLast}: detrás del ${worst.sum} solo quedan
        <b>${useful}</b> de 36 combinaciones, y tu opción de completar cayó del
        <b>${pct(worst.bestProb)}</b> al <b>${pct(worst.chosenProb)}</b>.`;
    } else if (worst) {
      why = `Pasaste con el <b>${worst.sum}</b> cuando tacharlo dejaba
        <b>${useful}</b> de 36 útiles: tu opción de completar bajó del
        <b>${pct(worst.bestProb)}</b> al <b>${pct(worst.chosenProb)}</b>.`;
    } else {
      why = `Jugaste bien: con ${rolls} tiradas y ${need} tachones la
        probabilidad era del <b>${pct(startProb)}</b> y esta vez los dados no
        acompañaron.`;
    }

    let table = "";
    for (let a = 1; a <= 6; a++) {
      for (let b = 1; b <= 6; b++) {
        const s = a + b;
        table += `<div class="tc-tcell ${s > ref ? "is-good" : "is-bad"}">${s}</div>`;
      }
    }

    body.innerHTML = `
      <p class="prompt">Se acabaron las tiradas<small>${crossed.length} de ${need} tachones</small></p>
      <div class="tc-why">${why}</div>
      <div class="tc-table">${table}</div>
      <div class="tc-legend">
        <span><i class="tc-sw is-good"></i> pasan del ${ref}: ${useful} de 36</span>
        <span><i class="tc-sw is-bad"></i> ya no valen: ${36 - useful} de 36</span>
      </div>
      <div class="feedback bad">−1 vida</div>
      <button class="primary" data-go style="margin-top:12px;">Seguir →</button>
    `;
    body.querySelector("[data-go]").addEventListener("click", () => {
      if (lives <= 0) return finish(false);
      nextRound();
    });
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "tachones", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎲</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} filas jugadas</p>
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
