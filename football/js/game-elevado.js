// "Potencias": rondas alternadas de dos tipos. "2³ = ?" se escribe con el
// teclado (💡 "2³ = 2 × 2 × 2 = 8 (no 2 × 3)"), y "¿Qué potencia es
// 5 × 5 × 5?" se contesta escribiendo base y exponente en dos casillas
// (✓ pasa de la base al exponente y vuelve a comprobar). Niveles:
// cuadrados → cubos → potencias de 10 → exponentes 1 y 0 → bases negativas
// con la tecla "− cambiar signo".
import { randInt, pick, saveScore } from "./utils.js";

const M = "−";
const SUP = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
const sup = (n) => String(n).split("").map((d) => SUP[d]).join("");
const f = (n) => (n < 0 ? `${M}${-n}` : `${n}`);
const pr = (n) => (n < 0 ? `(${M}${-n})` : `${n}`);
const fmtNum = (n) => f(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ").replace(/^/, n < 0 ? M : "");
const powTxt = (b, e) => `${pr(b)}${sup(e)}`;

// Nivel 0 cuadrados ≤12² · 1 cubos · 2 potencias de 10 · 3 exponentes 1 y 0 · 4 bases negativas.
// `alt` alterna la ronda "valor" (2³ = ?) con la ronda "potencia" (¿qué potencia es 5 × 5 × 5?).
export function buildRound(level, alt) {
  let b, e;
  if (level === 0) { b = randInt(2, 12); e = 2; }
  else if (level === 1) { b = randInt(2, 6); e = 3; }
  else if (level === 2) { b = 10; e = randInt(1, 6); }
  else if (level === 3) { b = randInt(2, 20); e = pick([0, 1, 0, 1, 2]); }
  else { b = -randInt(2, 5); e = randInt(2, b === -2 ? 5 : 3); }
  const type = alt && e >= 2 ? "power" : "value";
  const value = b ** e;
  const factors = Array(e).fill(pr(b)).join(" × ");
  let hint;
  if (type === "power") hint = `${factors}: el ${f(b)} se repite ${e} veces → ${powTxt(b, e)}`;
  else if (e === 0) hint = `Cualquier número elevado a 0 es 1: ${powTxt(b, e)} = 1`;
  else if (e === 1) hint = `Elevado a 1 es él mismo: ${powTxt(b, e)} = ${f(b)}`;
  else if (b === 10) hint = `${powTxt(b, e)} = un 1 y ${e} ceros → ${fmtNum(value)}`;
  else if (b < 0) hint = `${powTxt(b, e)} = ${factors} = ${fmtNum(value)}: exponente ${e % 2 ? "impar → negativo" : "par → positivo"}`;
  else hint = `${powTxt(b, e)} = ${factors} = ${fmtNum(value)} (no ${b} × ${e})`;
  return { type, b, e, value, factors, hint };
}

export function mountElevadoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives, score = 0, rounds = 0, ok = 0, finished = false;
  let round = null, typed = { base: "", exp: "", value: "" }, box = "value", locked = false, pending = null;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats"><span class="lives" data-lives></span><span class="score" data-score>⭐ 0</span></div>
    </div>
    <div class="game-body ev-body" data-body></div>`;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const level = () => Math.min(4, Math.floor(ok / 2));
  const shown = (s) => (s ? s.replace("-", M) : "?");

  function nextRound() {
    round = buildRound(level(), rounds % 2 === 1);
    typed = { base: "", exp: "", value: "" };
    box = round.type === "power" ? "base" : "value";
    locked = false;
    const neg = level() >= 4;
    const ask = round.type === "power"
      ? `<p class="prompt ev-prompt">¿Qué potencia es <b>${round.factors}</b>?</p>
         <div class="ev-answer"><button type="button" class="ev-box active" data-box="base">?</button><button type="button" class="ev-box ev-exp" data-box="exp">?</button></div>`
      : `<p class="prompt ev-prompt">${powTxt(round.b, round.e)} = <span class="ev-box ev-inline active" data-box="value">?</span></p>`;
    body.innerHTML = `
      ${ask}
      <small class="ev-step" data-step>${round.type === "power" ? "Escribe la base y pulsa ✓; luego el exponente." : "Escribe el valor y pulsa ✓."}</small>
      <div class="keypad-display ev-display" data-display>&nbsp;</div>
      <div class="keypad" data-keypad></div>
      ${neg ? `<button type="button" class="choice-btn keypad-sign" data-sign>${M} cambiar signo</button>` : ""}
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
    body.querySelectorAll("button[data-box]").forEach((el) => el.addEventListener("click", () => focusBox(el.dataset.box)));
  }

  function focusBox(name) {
    if (locked || finished) return;
    box = name;
    body.querySelectorAll("[data-box]").forEach((el) => el.classList.toggle("active", el.dataset.box === name));
    paint();
  }

  function paint() {
    body.querySelector("[data-display]").textContent = typed[box] ? typed[box].replace("-", M) : " ";
    body.querySelectorAll("[data-box]").forEach((el) => (el.textContent = shown(typed[el.dataset.box])));
  }

  function pressKey(key) {
    if (locked || finished) return;
    const t = typed[box];
    if (key === "⌫") typed[box] = t.slice(0, -1);
    else if (key === "±") { if (box !== "exp") typed[box] = t.startsWith("-") ? t.slice(1) : `-${t}`; }
    else if (key === "✓") {
      if (!/\d/.test(t)) return;
      if (box === "base") return focusBox("exp");
      return resolve(round.type === "power"
        ? Number(typed.base) === round.b && Number(typed.exp) === round.e
        : Number(typed.value) === round.value);
    } else if (t.replace("-", "").length < (box === "exp" ? 1 : 7)) typed[box] = t + key;
    paint();
  }

  function resolve(good) {
    locked = true;
    rounds++;
    const cls = good ? "ok" : "fix";
    if (round.type === "power") {
      const bb = body.querySelector('[data-box="base"]'), eb = body.querySelector('[data-box="exp"]');
      bb.textContent = pr(round.b); eb.textContent = round.e;
      bb.classList.add(cls); eb.classList.add(cls);
    } else {
      const vb = body.querySelector('[data-box="value"]');
      vb.textContent = fmtNum(round.value);
      vb.classList.add(cls);
    }
    body.querySelectorAll("[data-box]").forEach((el) => el.classList.remove("active"));
    if (!good) body.querySelector("[data-display]").classList.add("ev-wrong");
    const fb = body.querySelector("[data-feedback]");
    fb.textContent = `💡 ${round.hint}`;
    fb.className = `feedback ev-hint ${good ? "ok" : "bad"}`;
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
    saveScore(client, "elevado", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>x²</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} potencias</p>
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
