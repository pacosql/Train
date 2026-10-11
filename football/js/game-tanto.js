// "Tanto por ciento": ¿Cuánto es el 25 % de 80? Se escribe con el teclado
// y, de fondo, una barra de 100 % con la parte pedida resaltada. Solo
// porcentajes "amables" de cálculo mental y el 💡 enseña LA ESTRATEGIA
// ("25 % es la cuarta parte: 80 ÷ 4 = 20"). En el último nivel se mezclan
// el 200 % y la pregunta inversa "¿qué % es 20 de 80?".
import { randInt, pick, saveScore } from "./utils.js";

// Por cada % amable, el múltiplo que debe cumplir la base para que todo
// (resultado e intermedios del 💡) sea entero.
const MULT = { 50: 2, 25: 4, 10: 10, 20: 10, 75: 4, 5: 20, 1: 100, 30: 10, 40: 10, 15: 20, 200: 1 };
const LEVELS = [[50, 25, 10], [20, 75, 5, 1], [30, 40, 15], [200]];
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

function strategy(p, N, v) {
  const t = N / 10;
  switch (p) {
    case 50: return `50 % es la mitad: ${N} ÷ 2 = ${v}`;
    case 25: return `25 % es la cuarta parte: ${N} ÷ 4 = ${v}`;
    case 10: return `10 % es dividir entre 10: ${N} ÷ 10 = ${v}`;
    case 20: return `10 % es ${t}; 20 % es el doble → ${v}`;
    case 75: return `75 % son tres cuartos: ${N} ÷ 4 = ${N / 4}; ${N / 4} × 3 = ${v}`;
    case 5: return `10 % es ${t}; 5 % es la mitad → ${v}`;
    case 1: return `1 % es dividir entre 100: ${N} ÷ 100 = ${v}`;
    case 30: return `10 % es ${t}; 30 % son tres veces → ${v}`;
    case 40: return `10 % es ${t}; 40 % son cuatro veces → ${v}`;
    case 15: return `15 % = 10 % + 5 %: ${t} + ${t / 2} = ${v}`;
    default: return `200 % es el doble: ${N} × 2 = ${v}`;
  }
}

// Nivel 0 50/25/10 · 1 20/75/5/1 · 2 30/40/15 · 3 200 % y "¿qué % es a de N?"
export function buildRound(level) {
  const inverse = level >= 3 && Math.random() < 0.5;
  const p = inverse ? pick(Object.keys(MULT).map(Number)) : pick(LEVELS[Math.min(level, 3)]);
  const m = MULT[p];
  const N = m * randInt(2, m === 100 ? 9 : Math.min(150, Math.floor(400 / m)));
  const part = (p * N) / 100;
  if (!inverse) return { inverse, p, N, part, answer: part, hint: strategy(p, N, part) };
  const g = gcd(part, N);
  const frac = N / g === 1 ? `${part / g}` : `${part / g}/${N / g}`;
  return { inverse, p, N, part, answer: p, hint: `${part}/${N} = ${frac} = ${p} %` };
}

export function mountTantoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives, score = 0, rounds = 0, ok = 0, finished = false;
  let round = null, typed = "", locked = false, pending = null;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats"><span class="lives" data-lives></span><span class="score" data-score>⭐ 0</span></div>
    </div>
    <div class="game-body tp-body" data-body></div>`;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const level = () => Math.min(3, Math.floor(ok / 2));

  function bar(width, label) {
    return `<div class="tp-bar"><div class="tp-ticks"></div><div class="tp-fill" style="width:${width}%">${label}</div></div>`;
  }

  function nextRound() {
    round = buildRound(level());
    typed = "";
    locked = false;
    const { inverse, p, N, part } = round;
    const prompt = inverse
      ? `¿Qué % es <b>${part}</b> de <b>${N}</b>?`
      : `¿Cuánto es el <b>${p} %</b> de <b>${N}</b>?`;
    const mark = `<span class="tp-mark" data-mark>${inverse ? "? %" : "?"}</span>`;
    body.innerHTML = `
      <p class="prompt tp-prompt" data-prompt>${prompt}</p>
      <div class="tp-barwrap">
        ${bar(Math.min(p, 100), p > 100 ? "100 %" : mark)}
        ${p > 100 ? bar(p - 100, mark) : ""}
        <div class="tp-ends"><span>0</span><span>100 % = ${N}</span></div>
      </div>
      <div class="keypad-display" data-display>&nbsp;</div>
      <div class="keypad" data-keypad></div>
      <div class="feedback" data-feedback></div>`;
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = key === "✓" ? "choice-btn keypad-key primary" : "choice-btn keypad-key";
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
  }

  function pressKey(key) {
    if (locked || finished) return;
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (key === "✓") { if (typed !== "") resolve(Number(typed) === round.answer); return; }
    else if (typed.length < 4) typed += key;
    body.querySelector("[data-display]").textContent = typed ? `${typed}${round.inverse ? " %" : ""}` : " ";
  }

  function resolve(good) {
    locked = true;
    rounds++;
    const mark = body.querySelector("[data-mark]");
    mark.textContent = round.inverse ? `${round.p} %` : `${round.part}`;
    mark.classList.add(good ? "ok" : "fix");
    if (!good) body.querySelector("[data-display]").classList.add("tp-wrong");
    const fb = body.querySelector("[data-feedback]");
    fb.textContent = `💡 ${round.hint}`;
    fb.className = `feedback tp-hint ${good ? "ok" : "bad"}`;
    if (good) { score += 10; ok++; renderScore(); pending = setTimeout(nextRound, 900); return; }
    lives--;
    renderLives();
    pending = setTimeout(() => (lives <= 0 ? finish(false) : nextRound()), 2200);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero
    // "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "tanto", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>%</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} porcentajes</p>
        <div class="end-actions">
          <button class="primary" data-retry>Jugar otra vez</button>
          <button class="secondary" data-menu>Volver al menú</button>
        </div>
      </div>`;
    body.querySelector("[data-retry]").addEventListener("click", start);
    body.querySelector("[data-menu]").addEventListener("click", onExit);
  }

  function start() {
    lives = startLives; score = 0; rounds = 0; ok = 0; finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    clearTimeout(pending);
  };
}
