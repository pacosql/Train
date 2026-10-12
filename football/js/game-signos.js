// "La regla de los signos": (−3) × (−4) = ?  Primero se toca el signo del
// resultado con dos botones grandes (+ / −) y, si es correcto, aparece el
// teclado para escribir el valor absoluto. La ronda vale +10 al acertar las
// dos cosas; fallar el signo o el valor resta una vida. Tras cada respuesta
// un 💡 enseña la regla con los números de la ronda y, en sumas y restas,
// una mini recta numérica con el salto.
import { randInt, pick, saveScore } from "./utils.js";

const M = "−";
const fmt = (n) => (n < 0 ? `${M}${-n}` : `${n}`); // −3 · 7
const par = (n) => (n < 0 ? `(${M}${-n})` : `${n}`); // (−3) · 7
const signed = (n) => (n < 0 ? `${M}${-n}` : `+${n}`); // −3 · +7

// Nivel 0 suma/resta · 1 productos · 2 divisiones · 3 paréntesis anidados · 4 mezcla hasta 100
export function buildRound(level) {
  const kind = level >= 4 ? pick(["sum", "mul", "div", "par"]) : ["sum", "mul", "div", "par"][level];
  const big = level >= 4;
  let a, b, text, value, hint, line = null;
  if (kind === "sum") {
    const max = big ? 60 : 9;
    do { a = randInt(-max, max); b = randInt(-max, max); } while (!a || !b || a + b === 0 || (a > 0 && b > 0));
    text = b < 0 ? `${fmt(a)} ${M} ${-b}` : `${fmt(a)} + ${b}`;
    value = a + b;
    hint = a < 0 && b < 0
      ? `${text}: los dos restan, se juntan → ${signed(value)}`
      : `${text}: gana el ${Math.max(Math.abs(a), Math.abs(b))} por ${Math.abs(value)} → ${signed(value)}`;
    line = { from: a, to: value };
  } else if (kind === "mul") {
    a = randInt(2, big ? 10 : 9) * pick([1, -1]);
    b = randInt(2, big ? 10 : 9) * pick([1, -1]);
    text = `${par(a)} × ${par(b)}`;
    value = a * b;
    hint = `${a < 0 ? "Menos" : "Más"} por ${b < 0 ? "menos" : "más"}, ${value < 0 ? "menos" : "más"}: ${text} = ${signed(value)}`;
  } else if (kind === "div") {
    const q = randInt(2, big ? 10 : 9) * pick([1, -1]);
    b = randInt(2, big ? 10 : 9) * pick([1, -1]);
    a = q * b;
    text = `${par(a)} ÷ ${par(b)}`;
    value = q;
    hint = `${a < 0 ? "Menos" : "Más"} entre ${b < 0 ? "menos" : "más"}, ${value < 0 ? "menos" : "más"}: ${text} = ${signed(value)}`;
  } else {
    const max = big ? 50 : 9;
    a = randInt(1, max);
    const form = pick(["neg", "pos", "negsum", "restneg"]);
    if (form === "neg") { text = `${M}(${M}${a})`; value = a; hint = `El menos delante cambia el signo: ${text} = +${a}`; }
    else if (form === "pos") { text = `${M}(+${a})`; value = -a; hint = `El menos delante cambia el signo: ${text} = ${M}${a}`; }
    else if (form === "negsum") {
      do b = randInt(-max, max); while (!b || a + b === 0);
      text = `${M}(${M}${a}) ${b < 0 ? M : "+"} ${Math.abs(b)}`;
      value = a + b;
      hint = `${M}(${M}${a}) = +${a}, y ${a} ${b < 0 ? M : "+"} ${Math.abs(b)} = ${signed(value)}`;
      line = { from: a, to: value };
    } else {
      b = randInt(1, max);
      text = `${a} ${M} (${M}${b})`;
      value = a + b;
      hint = `Restar un negativo es sumar: ${text} = ${a} + ${b} = +${value}`;
      line = { from: a, to: value };
    }
  }
  return { text, value, hint, line };
}

// Mini recta numérica con el salto de `from` a `to` (SVG de 300×48).
function lineSvg({ from, to }) {
  const lo = Math.min(0, from, to), hi = Math.max(0, from, to);
  const step = hi - lo > 24 ? 10 : hi - lo > 12 ? 2 : 1;
  const min = Math.floor(lo / step) * step - step, max = Math.ceil(hi / step) * step + step;
  const x = (v) => 12 + ((v - min) / (max - min)) * 276;
  let ticks = "";
  for (let v = min; v <= max; v += step) {
    const big = v === 0 || v === from || v === to;
    ticks += `<line x1="${x(v)}" y1="26" x2="${x(v)}" y2="${big ? 36 : 31}" class="${big ? "sg-tbig" : ""}"/>`;
    if (big || step >= 10 || max - min <= 12) ticks += `<text x="${x(v)}" y="46" class="${v === to ? "sg-tto" : ""}">${fmt(v)}</text>`;
  }
  const dir = to > from ? 1 : -1;
  return `<svg viewBox="0 0 300 48" class="sg-svg"><line x1="4" y1="26" x2="296" y2="26" class="sg-axis"/>${ticks}
    <path d="M${x(from)} 22 Q${(x(from) + x(to)) / 2} ${2} ${x(to) - dir * 4} 20" class="sg-jump"/>
    <path d="M${x(to) - dir * 4} 20 l${-dir * 6} -5 l2 7 z" class="sg-jumphead"/></svg>`;
}

export function mountSignosGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives, score = 0, rounds = 0, ok = 0, finished = false;
  let round = null, typed = "", locked = false, pending = null;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats"><span class="lives" data-lives></span><span class="score" data-score>⭐ 0</span></div>
    </div>
    <div class="game-body sg-body" data-body></div>`;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const level = () => Math.min(4, Math.floor(ok / 2));

  function nextRound() {
    round = buildRound(level());
    typed = "";
    locked = false;
    body.innerHTML = `
      <p class="prompt sg-prompt" data-expr>${round.text} = <span class="sg-ans" data-ans>?</span></p>
      <small class="sg-step" data-step>¿Qué signo tiene el resultado?</small>
      <div class="sg-signs" data-signs>
        <button type="button" class="sg-sign" data-sign="+">+</button>
        <button type="button" class="sg-sign" data-sign="−">−</button>
      </div>
      <div class="sg-pad" data-pad hidden>
        <div class="keypad-display" data-display>&nbsp;</div>
        <div class="keypad" data-keypad></div>
      </div>
      <div class="sg-line" data-line></div>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-sign]").forEach((b) => b.addEventListener("click", () => pickSign(b)));
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

  function pickSign(btn) {
    if (locked || finished) return;
    const want = round.value < 0 ? "−" : "+";
    const ans = body.querySelector("[data-ans]");
    if (btn.dataset.sign === want) {
      btn.classList.add("ok");
      body.querySelectorAll("[data-sign]").forEach((b) => (b.disabled = true));
      ans.textContent = `${want} ?`;
      body.querySelector("[data-step]").textContent = "Bien el signo. Ahora el valor:";
      body.querySelector("[data-pad]").hidden = false;
      return;
    }
    btn.classList.add("bad");
    body.querySelector(`[data-sign="${want}"]`).classList.add("ok");
    resolve(false);
  }

  function pressKey(key) {
    if (locked || finished) return;
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (key === "✓") { if (typed !== "") resolve(Number(typed) === Math.abs(round.value)); return; }
    else if (typed.length < 4) typed += key;
    body.querySelector("[data-display]").textContent = typed || " ";
  }

  function resolve(good) {
    locked = true;
    rounds++;
    body.querySelectorAll("[data-sign]").forEach((b) => (b.disabled = true));
    const ans = body.querySelector("[data-ans]");
    ans.textContent = signed(round.value);
    ans.classList.add(good ? "ok" : "bad-fix");
    if (!good) body.querySelector("[data-display]").classList.add("sg-wrong");
    const fb = body.querySelector("[data-feedback]");
    fb.innerHTML = `💡 ${round.hint}`;
    fb.className = `feedback sg-hint ${good ? "ok" : "bad"}`;
    if (round.line) body.querySelector("[data-line]").innerHTML = lineSvg(round.line);
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
    saveScore(client, "signos", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>±</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} operaciones con signo</p>
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
