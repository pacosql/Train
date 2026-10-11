// "Pon la coma": se muestra una operación con decimales y las cifras del
// resultado SIN coma. Se toca la ranura entre cifras donde va la coma (o
// "sin coma"). Se acierta estimando ("3 × 2 ≈ 6, así que 7,245") o
// contando decimales; el 💡 da las dos. Niveles: × 10/100 → producto de
// decimales → ÷ 10/100 → división decimal → sumas con cifras alineadas.
import { randInt, pick, saveScore } from "./utils.js";

// Un decimal es { v, d }: valor entero v con d cifras decimales (v = 345, d = 2 → 3,45).
export function fmt({ v, d }) {
  const s = String(v).padStart(d + 1, "0");
  return d ? `${s.slice(0, -d)},${s.slice(-d)}` : s;
}
const num = ({ v, d }) => v / 10 ** d;
const digitsOf = (x) => String(Math.round(x)).length;
// Decimal al azar con d decimales, parte entera en [lo, hi] y última cifra ≠ 0.
function randDec(d, lo, hi) {
  for (;;) {
    const v = randInt(lo * 10 ** d, (hi + 1) * 10 ** d - 1);
    if (d === 0 || v % 10 !== 0) return { v, d };
  }
}
// Quita ceros finales tras la coma (11,0 → 11).
const strip = (r) => { while (r.d > 0 && r.v % 10 === 0) { r.v /= 10; r.d--; } return r; };
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "es"}`;

// Ronda: { text, result:{v,d}, digits, pos (ranura; digits.length = sin coma), hintEst, hintRule }
export function buildRound(level) {
  for (;;) {
    let text, result, hintEst, hintRule;
    if (level === 0) {
      const a = randDec(randInt(1, 3), 1, 99);
      const e = randInt(1, Math.min(3, a.d + 1));
      result = strip(e <= a.d ? { v: a.v, d: a.d - e } : { v: a.v * 10 ** (e - a.d), d: 0 });
      text = `${fmt(a)} × ${10 ** e}`;
      hintRule = `Multiplicar por ${10 ** e} mueve la coma ${plural(e, "lugar")} a la derecha: ${fmt(a)} → ${fmt(result)}`;
      hintEst = `${Math.round(num(a))} × ${10 ** e} = ${Math.round(num(a)) * 10 ** e}, así que el resultado anda por ahí: ${fmt(result)}`;
    } else if (level === 1) {
      const a = randDec(randInt(1, 2), 1, 9);
      const b = randDec(1, 1, 9);
      result = { v: a.v * b.v, d: a.d + b.d };
      if (result.v % 10 === 0) continue;
      const est = Math.round(num(a)) * Math.round(num(b));
      if (digitsOf(est) !== digitsOf(Math.floor(num(result)))) continue;
      text = `${fmt(a)} × ${fmt(b)}`;
      hintEst = `${Math.round(num(a))} × ${Math.round(num(b))} = ${est}, así que ≈ ${est} → ${fmt(result)}`;
      hintRule = `${plural(a.d, "decimal")} + ${plural(b.d, "decimal")} = ${plural(result.d, "decimal")}: ${fmt(result)}`;
    } else if (level === 2) {
      const a = randDec(randInt(0, 2), 1, 999);
      const e = randInt(1, 3);
      result = strip({ v: a.v, d: a.d + e });
      text = `${fmt(a)} ÷ ${10 ** e}`;
      hintRule = `Dividir entre ${10 ** e} mueve la coma ${plural(e, "lugar")} a la izquierda: ${fmt(a)} → ${fmt(result)}`;
      hintEst = num(result) < 1 ? `${fmt(a)} entre ${10 ** e} es menos que 1, así que empieza por 0: ${fmt(result)}` : `${Math.round(num(a))} ÷ ${10 ** e} ≈ ${Math.round(num(a) / 10 ** e)}, así que ${fmt(result)}`;
    } else if (level === 3) {
      result = randDec(randInt(1, 2), 1, 9);
      const k = randInt(2, 9);
      const a = { v: result.v * k, d: result.d };
      if (a.v % 10 === 0) continue;
      const est = Math.round(Math.round(num(a)) / k);
      if (digitsOf(est) !== digitsOf(Math.floor(num(result)))) continue;
      text = `${fmt(a)} ÷ ${k}`;
      hintEst = `${Math.round(num(a))} ÷ ${k} ≈ ${est}, así que ${fmt(result)}`;
      hintRule = `Divide sin la coma, ${a.v} ÷ ${k} = ${result.v}, y el cociente lleva los mismos decimales que ${fmt(a)} (${a.d}): ${fmt(result)}`;
    } else {
      const da = randInt(1, 2);
      const a = randDec(da, 0, 9);
      const b = randDec(3 - da, 0, 9);
      const d = Math.max(a.d, b.d);
      result = { v: a.v * 10 ** (d - a.d) + b.v * 10 ** (d - b.d), d };
      if (result.v % 10 === 0 || result.v === 0) continue;
      const est = Math.round(num(a)) + Math.round(num(b));
      if (digitsOf(est) !== digitsOf(Math.floor(num(result)))) continue;
      text = `${fmt(a)} + ${fmt(b)}`;
      hintEst = `${Math.round(num(a))} + ${Math.round(num(b))} ≈ ${est}, así que ${fmt(result)}`;
      hintRule = `Alinea las comas: ${fmt({ v: a.v * 10 ** (d - a.d), d })} + ${fmt({ v: b.v * 10 ** (d - b.d), d })} = ${fmt(result)}`;
    }
    const digits = fmt(result).replace(",", "");
    const pos = result.d ? digits.length - result.d : digits.length;
    return { text, result, digits, pos, hintEst, hintRule };
  }
}

export function mountComaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let busy = false;
  let pending = null;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body cm-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    round = buildRound(Math.min(4, Math.floor(score / 30)));
    busy = false;
    const cells = [...round.digits]
      .map((c, i) => `<span class="cm-digit">${c}</span>${i < round.digits.length - 1 ? `<button type="button" class="cm-slot" data-slot="${i + 1}" aria-label="coma aquí"></button>` : ""}`)
      .join("");
    body.innerHTML = `
      <p class="prompt cm-prompt">¿Dónde va la coma del resultado?</p>
      <div class="cm-op" data-op>${round.text} = ${round.digits}</div>
      <div class="cm-digits" data-digits>${cells}<button type="button" class="cm-slot cm-nocoma" data-slot="${round.digits.length}">sin<br>coma</button></div>
      <div class="cm-sol" data-sol></div>
      <div class="feedback cm-fb" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => tap(Number(b.dataset.slot))));
  }

  function tap(pos) {
    if (finished || busy) return;
    busy = true;
    rounds++;
    const ok = pos === round.pos;
    const good = body.querySelector(`[data-slot="${round.pos}"]`);
    good.classList.add("good");
    if (round.pos < round.digits.length) good.textContent = ",";
    if (!ok) {
      const bad = body.querySelector(`[data-slot="${pos}"]`);
      bad.classList.add("bad");
      if (pos < round.digits.length) bad.textContent = ",";
    }
    body.querySelector("[data-sol]").textContent = `${round.text} = ${fmt(round.result)}`;
    const fb = body.querySelector("[data-feedback]");
    fb.innerHTML = `💡 ${round.hintEst}<br>📏 ${round.hintRule}`;
    fb.className = `feedback cm-fb ${ok ? "ok" : "bad"}`;
    if (ok) {
      score += 10;
      renderScore();
      pending = setTimeout(nextRound, 900);
      return;
    }
    lives--;
    renderLives();
    if (lives <= 0) return (pending = setTimeout(() => finish(false), 2200));
    pending = setTimeout(nextRound, 2200);
  }

  function finish(userExited) {
    // Con el end-card en pantalla "← Menú" debe seguir funcionando.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "coma", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔸</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} comas bien puestas</p>
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
    clearTimeout(pending);
  };
}
