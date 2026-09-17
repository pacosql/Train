// "Sin pasarse": blackjack matemático de aula. Cada carta trae una
// operación (+7, ×2, −3…) que se aplica a tu total y tú decides cuándo
// plantarte: hay que superar a la máquina sin pasarse del objetivo. El
// cálculo mental encadenado ES la decisión.
import { clamp, pick, randInt, saveScore } from "./utils.js";

// Operaciones posibles de las cartas. Cada nivel usa un subconjunto.
function opPool(level) {
  const ops = [];
  for (let v = 2; v <= 9; v++) ops.push({ kind: "+", v });
  for (let v = 2; v <= 6; v++) ops.push({ kind: "-", v });
  ops.push({ kind: "*", v: 2 });
  if (level >= 1) ops.push({ kind: "*", v: 2 });
  if (level >= 2) ops.push({ kind: "*", v: 3 });
  return ops;
}

export function applyOp(total, op) {
  if (op.kind === "+") return total + op.v;
  if (op.kind === "-") return total - op.v;
  return total * op.v;
}

export function opLabel(op) {
  if (op.kind === "*") return `×${op.v}`;
  return `${op.kind}${op.v}`;
}

// Totales que va tomando una mano, carta a carta.
export function chainTotals(start, cards) {
  const out = [start];
  let t = start;
  for (const c of cards) {
    t = applyOp(t, c);
    out.push(t);
  }
  return out;
}

// Comprueba TODAS las garantías de una ronda:
//  - la máquina se planta sin pasarse,
//  - el jugador empieza por debajo de la máquina (tiene que pedir),
//  - hay exactamente UN punto donde plantarse gana (único e inequívoco),
//  - ese punto necesita al menos 2 cartas,
//  - seguir pidiendo desde ahí te pasa (riesgo real),
//  - ningún total del jugador empata con el de la máquina.
export function checkVeintiunoRound(r) {
  const { target, start, cards, cpuFinal, cpuStand, cpuTotals } = r;
  if (!(cpuFinal <= target && cpuFinal >= cpuStand)) return null;
  if (cpuTotals.some((v) => v > target)) return null;
  if (start >= cpuFinal) return null;
  const totals = chainTotals(start, cards);
  let bustAt = -1;
  for (let i = 1; i < totals.length; i++) {
    if (totals[i] > target) { bustAt = i; break; }
  }
  if (bustAt < 3) return null; // hacen falta al menos 2 cartas seguras
  const safe = totals.slice(0, bustAt); // índices 0..bustAt-1
  if (safe.some((v) => v < 0)) return null;
  if (safe.includes(cpuFinal)) return null; // nunca un empate
  const wins = [];
  safe.forEach((v, i) => { if (v > cpuFinal) wins.push(i); });
  if (wins.length !== 1) return null; // solución única
  if (wins[0] < 2) return null;
  return { bustAt, winAt: wins[0], totals };
}

// Genera una ronda construyéndola hacia atrás desde las garantías, y la
// valida con el comprobador. do/while con guarda y caso fijo de reserva.
export function makeVeintiunoRound(level) {
  const lvl = clamp(level, 0, 2);
  const target = pick([[40, 50], [50, 60], [60, 75]][lvl]);
  const pool = opPool(lvl);
  const nCards = 5 + lvl;
  let guard = 0;
  while (guard++ < 1200) {
    const cpuStand = target - randInt(8, 14);
    const cpuStart = randInt(4, 11);
    const cpuCards = [];
    let cpuTotal = cpuStart;
    let bad = false;
    while (cpuTotal < cpuStand) {
      if (cpuCards.length >= 6) { bad = true; break; }
      const options = pool.filter((op) => applyOp(cpuTotal, op) <= target && applyOp(cpuTotal, op) >= 1);
      if (!options.length) { bad = true; break; }
      const op = pick(options);
      cpuCards.push(op);
      cpuTotal = applyOp(cpuTotal, op);
    }
    if (bad || cpuCards.length < 2) continue;
    const cpuFinal = cpuTotal;

    const start = randInt(3, Math.max(4, cpuFinal - 12));
    if (start >= cpuFinal) continue;
    const winAt = randInt(2, 3);
    const cards = [];
    let total = start;
    // Cartas previas: se quedan por debajo de la máquina (hay que pedir más).
    for (let i = 1; i < winAt; i++) {
      const options = pool.filter((op) => {
        const v = applyOp(total, op);
        return v >= 1 && v < cpuFinal;
      });
      if (!options.length) { bad = true; break; }
      const op = pick(options);
      cards.push(op);
      total = applyOp(total, op);
    }
    if (bad) continue;
    // La carta ganadora: pasa a la máquina sin pasarse del objetivo.
    const winOpts = pool.filter((op) => {
      const v = applyOp(total, op);
      return v > cpuFinal && v <= target;
    });
    if (!winOpts.length) continue;
    const winOp = pick(winOpts);
    cards.push(winOp);
    total = applyOp(total, winOp);
    // La siguiente carta se pasa: plantarse a tiempo importa de verdad.
    const bustOpts = pool.filter((op) => applyOp(total, op) > target);
    if (!bustOpts.length) continue;
    cards.push(pick(bustOpts));
    // Relleno: cartas que ya no se llegan a jugar (solo dan mazo).
    while (cards.length < nCards) cards.push(pick(pool));

    const round = {
      target, start, cards, cpuStand, cpuFinal,
      cpuStart, cpuCards, cpuTotals: chainTotals(cpuStart, cpuCards),
    };
    const info = checkVeintiunoRound(round);
    if (info) return Object.assign(round, info);
  }
  // Caso fijo válido y comprobado (nunca una ronda rota).
  const fixed = {
    target: 50, start: 12, cpuStart: 9, cpuStand: 38,
    cpuCards: [{ kind: "+", v: 9 }, { kind: "*", v: 2 }, { kind: "+", v: 2 }],
    cards: [{ kind: "+", v: 9 }, { kind: "*", v: 2 }, { kind: "+", v: 9 }, { kind: "+", v: 7 }, { kind: "+", v: 3 }],
  };
  fixed.cpuTotals = chainTotals(fixed.cpuStart, fixed.cpuCards);
  fixed.cpuFinal = fixed.cpuTotals[fixed.cpuTotals.length - 1];
  return Object.assign(fixed, checkVeintiunoRound(fixed) || { bustAt: 3, winAt: 2, totals: chainTotals(fixed.start, fixed.cards) });
}

export function mountVeintiunoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  const timers = [];

  let round = null;
  let drawn = 0;
  let total = 0;
  let locked = true;

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

  function chainHtml(start, cards, count) {
    let html = `<span class="vu-num">${start}</span>`;
    for (let i = 0; i < count; i++) {
      html += `<span class="vu-op">${opLabel(cards[i])}</span>`;
      html += `<span class="vu-num">${chainTotals(start, cards.slice(0, i + 1)).pop()}</span>`;
    }
    return html;
  }

  // Barra 0 → objetivo con la marca de la máquina: el "sin pasarse" se ve.
  function barHtml(value) {
    const t = round.target;
    const fill = clamp((value / t) * 100, 0, 100);
    const mark = clamp((round.cpuFinal / t) * 100, 0, 100);
    return `
      <div class="vu-bar">
        <div class="vu-bar-fill" style="width:${fill}%"></div>
        <div class="vu-bar-mark" style="left:${mark}%"><i>🤖</i></div>
      </div>
      <div class="vu-bar-ends"><span>0</span><span>${t}</span></div>
    `;
  }

  function nextRound() {
    round = makeVeintiunoRound(Math.floor(streak / 2));
    drawn = 0;
    total = round.start;
    locked = false;

    body.innerHTML = `
      <p class="prompt">Supera a la máquina sin pasarte de ${round.target}
        <small>La máquina pide carta mientras tenga menos de ${round.cpuStand}</small></p>
      <div class="vu-hand vu-cpu">
        <div class="vu-hand-top"><span class="vu-who">🤖 Máquina</span>
          <span class="vu-total">${round.cpuFinal}</span></div>
        <div class="vu-chain">${chainHtml(round.cpuStart, round.cpuCards, round.cpuCards.length)}</div>
      </div>
      <div class="vu-hand vu-you">
        <div class="vu-hand-top"><span class="vu-who">🙂 Tú</span>
          <span class="vu-total" data-total>${total}</span></div>
        <div class="vu-chain" data-chain>${chainHtml(round.start, round.cards, 0)}</div>
        <div data-bar>${barHtml(total)}</div>
      </div>
      <div class="vu-actions">
        <button class="primary vu-btn" data-hit>Pedir carta 🂠</button>
        <button class="secondary vu-btn" data-stand>Plantarse</button>
      </div>
      <div class="feedback" data-feedback></div>
    `;
    body.querySelector("[data-hit]").addEventListener("click", hit);
    body.querySelector("[data-stand]").addEventListener("click", stand);
    renderHand();
  }

  function renderHand() {
    body.querySelector("[data-total]").textContent = total;
    body.querySelector("[data-chain]").innerHTML = chainHtml(round.start, round.cards, drawn);
    body.querySelector("[data-bar]").innerHTML = barHtml(total);
    const hit = body.querySelector("[data-hit]");
    hit.disabled = locked || drawn >= round.cards.length;
    body.querySelector("[data-stand]").disabled = locked;
  }

  function hit() {
    if (finished || locked || drawn >= round.cards.length) return;
    const card = round.cards[drawn];
    drawn++;
    const before = total;
    total = applyOp(total, card);
    renderHand();
    const feedback = body.querySelector("[data-feedback]");
    if (total > round.target) {
      locked = true;
      renderHand();
      feedback.textContent = `${before} ${opLabel(card)} = ${total}: te pasaste`;
      feedback.className = "feedback bad";
      later(() => loseRound("bust", card, before), 750);
      return;
    }
    feedback.textContent = `${before} ${opLabel(card)} = ${total}` +
      (total > round.cpuFinal ? ` — ya superas a la máquina` : ` — sigues por debajo de ${round.cpuFinal}`);
    feedback.className = "feedback";
  }

  function stand() {
    if (finished || locked) return;
    locked = true;
    renderHand();
    if (total > round.cpuFinal) return later(winRound, 350);
    later(() => loseRound("short"), 350);
  }

  function winRound() {
    rounds++;
    streak++;
    score += 10;
    renderScore();
    const feedback = body.querySelector("[data-feedback]");
    feedback.textContent = `${total} gana a ${round.cpuFinal} sin pasar de ${round.target}. +10`;
    feedback.className = "feedback ok";
    later(nextRound, 1100);
  }

  // Al fallar se ve el encadenado completo paso a paso y en qué carta se
  // torció la cuenta.
  function loseRound(reason, card, before) {
    rounds++;
    streak = 0;
    lives--;
    renderLives();

    const totals = chainTotals(round.start, round.cards);
    const shown = Math.max(drawn, round.winAt);
    let steps = `<span class="vu-num">${round.start}</span>`;
    for (let i = 1; i <= shown && i < totals.length; i++) {
      const over = totals[i] > round.target;
      const isWin = i === round.winAt && !over;
      steps += `<span class="vu-op">${opLabel(round.cards[i - 1])}</span>`;
      steps += `<span class="vu-num ${over ? "is-bust" : isWin ? "is-win" : ""}">${totals[i]}</span>`;
      if (over) break;
    }

    let why;
    if (reason === "bust") {
      why = `Ibas en <b>${before}</b> y la carta <b>${opLabel(card)}</b> te puso en
        <b>${total}</b>, que pasa de ${round.target}. Con
        <b>${totals[round.winAt]}</b> (carta ${round.winAt}) ya ganabas a la
        máquina y no te pasabas.`;
    } else {
      why = `Te plantaste en <b>${total}</b> y la máquina tenía <b>${round.cpuFinal}</b>:
        te faltaba llegar a <b>${totals[round.winAt]}</b>, que era el único total
        que gana sin pasar de ${round.target}.`;
    }

    body.innerHTML = `
      <p class="prompt">${reason === "bust" ? "Te has pasado" : "No has superado a la máquina"}
        <small>objetivo ${round.target} · máquina ${round.cpuFinal}</small></p>
      <div class="vu-steps">${steps}</div>
      <div class="vu-why">${why}</div>
      <div class="feedback bad">−1 vida</div>
      <button class="primary" data-go style="margin-top:12px;">Seguir →</button>
    `;
    body.querySelector("[data-go]").addEventListener("click", () => {
      if (lives <= 0) return finish(false);
      nextRound();
    });
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "veintiuno", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🂡</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} manos jugadas</p>
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
