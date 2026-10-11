// "¿Cuánto vale x?": ecuación de primer grado sencilla ("2x + 3 = 11") y
// teclado para escribir x (con tecla "− cambiar signo" en el nivel de
// soluciones negativas). El 💡 muestra la resolución en dos líneas
// ("2x = 11 − 3 = 8 → x = 8 ÷ 2 = 4") y una comprobación sustituyendo
// ("2·4 + 3 = 11 ✓"). Las soluciones son siempre enteras.
import { randInt, pick, saveScore } from "./utils.js";

const M = "−";
const f = (n) => (n < 0 ? `${M}${-n}` : `${n}`); // número con menos tipográfico
const pr = (n) => (n < 0 ? `(${M}${-n})` : `${n}`); // entre paréntesis si es negativo
const term = (c) => (c === 1 ? "x" : `${f(c)}x`); // coeficiente·x
const plus = (n) => `${n < 0 ? M : "+"} ${Math.abs(n)}`; // "+ 3" / "− 3"

// Nivel 0 x+a=b · 1 ax=b · 2 ax+b=c · 3 ax+b=cx+d · 4 a(x+b)=c · 5 soluciones negativas
export function buildRound(level) {
  const neg = level >= 5;
  const form = neg ? pick(["ax", "axb", "both", "paren"]) : ["xa", "ax", "axb", "both", "paren"][level];
  const x = neg ? -randInt(1, 12) : randInt(1, 12);
  let text, steps, check;
  if (form === "xa") {
    const a = randInt(1, 20) * pick([1, -1]);
    const b = x + a;
    text = `x ${plus(a)} = ${f(b)}`;
    steps = [`x = ${f(b)} ${plus(-a)} = ${f(x)}`];
    check = `${x} ${plus(a)} = ${f(b)} ✓`;
  } else if (form === "ax") {
    const a = randInt(2, 9);
    const b = a * x;
    text = `${a}x = ${f(b)}`;
    steps = [`x = ${pr(b)} ÷ ${a} = ${f(x)}`];
    check = `${a}·${pr(x)} = ${f(b)} ✓`;
  } else if (form === "axb") {
    const a = randInt(2, 9);
    const b = randInt(1, 20) * pick([1, -1]);
    const c = a * x + b;
    text = `${a}x ${plus(b)} = ${f(c)}`;
    steps = [`${a}x = ${f(c)} ${plus(-b)} = ${f(a * x)}`, `x = ${pr(a * x)} ÷ ${a} = ${f(x)}`];
    check = `${a}·${pr(x)} ${plus(b)} = ${f(c)} ✓`;
  } else if (form === "both") {
    const a = randInt(2, 9);
    const c = randInt(1, a - 1);
    const b = randInt(1, 15) * pick([1, -1]);
    const d = (a - c) * x + b;
    text = `${a}x ${plus(b)} = ${term(c)} ${plus(d)}`;
    steps = [`${a}x ${M} ${term(c)} = ${f(d)} ${plus(-b)} → ${term(a - c)} = ${f(d - b)}`,
      a - c === 1 ? `x = ${f(x)}` : `x = ${pr(d - b)} ÷ ${a - c} = ${f(x)}`];
    check = `${a}·${pr(x)} ${plus(b)} = ${f(a * x + b)} = ${c === 1 ? "" : `${c}·`}${pr(x)} ${plus(d)} ✓`;
  } else {
    const a = randInt(2, 6);
    let b;
    do b = randInt(1, 9) * pick([1, -1]); while (x + b === 0);
    const c = a * (x + b);
    text = `${a}(x ${plus(b)}) = ${f(c)}`;
    steps = [`x ${plus(b)} = ${pr(c)} ÷ ${a} = ${f(x + b)}`, `x = ${f(x + b)} ${plus(-b)} = ${f(x)}`];
    check = `${a}·(${f(x)} ${plus(b)}) = ${a}·${pr(x + b)} = ${f(c)} ✓`;
  }
  return { x, text, steps, check, neg };
}

export function mountDespejaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives, score = 0, rounds = 0, ok = 0, finished = false;
  let round = null, typed = "", locked = false, pending = null;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats"><span class="lives" data-lives></span><span class="score" data-score>⭐ 0</span></div>
    </div>
    <div class="game-body dx-body" data-body></div>`;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const level = () => Math.min(5, Math.floor(ok / 2));

  function nextRound() {
    round = buildRound(level());
    typed = "";
    locked = false;
    body.innerHTML = `
      <p class="prompt dx-prompt">¿Cuánto vale <span class="dx-x">x</span>?</p>
      <div class="dx-eq" data-eq>${round.text.replace(/x/g, '<span class="dx-x">x</span>')}</div>
      <div class="dx-sol" data-sol>x = <span class="dx-val" data-val>?</span></div>
      <div class="keypad-display dx-display" data-display>&nbsp;</div>
      <div class="keypad" data-keypad></div>
      ${round.neg ? `<button type="button" class="choice-btn keypad-sign" data-sign>${M} cambiar signo</button>` : ""}
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
    body.querySelector("[data-sign]")?.addEventListener("click", () => pressKey("±"));
  }

  function pressKey(key) {
    if (locked || finished) return;
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (key === "±") typed = typed.startsWith("-") ? typed.slice(1) : `-${typed}`;
    else if (key === "✓") { if (/\d/.test(typed)) resolve(Number(typed) === round.x); return; }
    else if (typed.replace("-", "").length < 3) typed += key;
    body.querySelector("[data-display]").textContent = typed ? typed.replace("-", M) : " ";
    body.querySelector("[data-val]").textContent = typed ? typed.replace("-", M) : "?";
  }

  function resolve(good) {
    locked = true;
    rounds++;
    const val = body.querySelector("[data-val]");
    val.textContent = f(round.x);
    val.classList.add(good ? "ok" : "fix");
    if (!good) body.querySelector("[data-display]").classList.add("dx-wrong");
    const fb = body.querySelector("[data-feedback]");
    fb.innerHTML = `💡 ${round.steps.join("<br>")}<br><span class="dx-check">Comprobación: ${round.check}</span>`;
    fb.className = `feedback dx-hint ${good ? "ok" : "bad"}`;
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
    saveScore(client, "despeja", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>𝑥</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} ecuaciones</p>
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
