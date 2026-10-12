// "El signo que falta": "6 □ 3 = 18" sobre papel cuadriculado con las cuatro
// fichas + − × ÷ grandes debajo; se toca una, entra en el hueco y se
// corrige al instante. En el nivel alto hay dos huecos ("4 □ 2 □ 3 = 11"),
// con una única combinación válida (comprobadas las 16, y con el mismo
// resultado se opere de izquierda a derecha o con la jerarquía). El 💡 dice
// por qué ese signo: "para pasar de 6 a 18 hay que multiplicar".
import { randInt, pick, saveScore } from "./utils.js";

export const OPS = ["+", "−", "×", "÷"];
const calc = (a, op, b) => (op === "+" ? a + b : op === "−" ? a - b : op === "×" ? a * b : a / b);
const same = (x, y) => Math.abs(x - y) < 1e-9;
// Dos convenciones para a o1 b o2 c: de izquierda a derecha y con jerarquía.
const ltr = (a, o1, b, o2, c) => calc(calc(a, o1, b), o2, c);
const prec = (a, o1, b, o2, c) => {
  const hi = (o) => o === "×" || o === "÷";
  return hi(o2) && !hi(o1) ? calc(a, o1, calc(b, o2, c)) : ltr(a, o1, b, o2, c);
};

// El porqué, como en clase; si ya hay ×, se compara con el signo "primo".
function hintOne(a, op, b, r, L) {
  if (op === "+") return `${a} + ${b} = ${r}: de ${a} a ${r} he subido ${b}, así que sumo${L ? ` (${a} × ${b} daría ${a * b})` : ""}`;
  if (op === "−") return `${a} − ${b} = ${r}: de ${a} a ${r} he bajado ${b}, así que resto${L > 1 && a % b === 0 ? ` (${a} ÷ ${b} daría ${a / b})` : ""}`;
  if (op === "×") return `${a} × ${b} = ${r}: para pasar de ${a} a ${r} hay que multiplicar (${a} + ${b} solo daría ${a + b})`;
  return `${a} ÷ ${b} = ${r}: ${a} repartido en ${b} partes iguales son ${r}, así que divido (${a} − ${b} daría ${a - b})`;
}

// Niveles: 0 + y − · 1 + − × · 2 las cuatro · 3 dos huecos.
export function buildRound(level) {
  const L = Math.min(3, level);
  if (L < 3) {
    const allowed = L === 0 ? ["+", "−"] : L === 1 ? ["+", "−", "×"] : OPS;
    for (;;) {
      const op = pick(allowed);
      let a, b;
      if (op === "+") { a = randInt(2, 20); b = randInt(2, 20); }
      else if (op === "−") { a = randInt(5, 20); b = randInt(2, a - 1); }
      else if (op === "×") { a = randInt(2, 10); b = randInt(2, 10); }
      else { b = randInt(2, 10); a = b * randInt(2, 10); }
      const r = calc(a, op, b);
      // Ningún otro signo de las cuatro fichas puede dar el mismo resultado.
      if (OPS.filter((o) => same(calc(a, o, b), r)).length !== 1) continue;
      return { nums: [a, b], ops: [op], result: r, level: L, hint: hintOne(a, op, b, r, L) };
    }
  }
  for (;;) {
    const a = randInt(2, 10), b = randInt(2, 10), c = randInt(2, 10), o1 = pick(OPS), o2 = pick(OPS);
    const mid = calc(a, o1, b), r = ltr(a, o1, b, o2, c);
    if (!Number.isInteger(mid) || mid < 0 || !Number.isInteger(r) || r < 0 || r > 99 || !same(r, prec(a, o1, b, o2, c))) continue;
    // Entre las 16 combinaciones solo esta da el resultado, se mire como se mire.
    let n = 0;
    for (const p of OPS) for (const q of OPS) if (same(ltr(a, p, b, q, c), r) || same(prec(a, p, b, q, c), r)) n++;
    if (n !== 1) continue;
    return { nums: [a, b, c], ops: [o1, o2], result: r, level: L,
      hint: `Primero ${a} ${o1} ${b} = ${mid} y luego ${mid} ${o2} ${c} = ${r} → ${a} ${o1} ${b} ${o2} ${c} = ${r}` };
  }
}

export function mountSignoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, holes, active, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body sg2-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const holeEls = () => body.querySelectorAll("[data-hole]");

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.floor(hits / 2));
    holes = round.ops.map(() => "");
    active = 0;
    busy = false;
    const eq = round.nums.map((n, i) => `<span class="sg2-num">${n}</span>${i < round.ops.length ? `<button type="button" class="sg2-hole" data-hole="${i}"></button>` : ""}`).join("");
    body.innerHTML = `
      <p class="prompt sg2-prompt">¿Qué signo falta?</p>
      <div class="sg2-cuaderno">
        <div class="sg2-eq">${eq}<span class="sg2-num sg2-eqs">=</span><span class="sg2-num">${round.result}</span></div>
      </div>
      <div class="sg2-chips">${OPS.map((o) => `<button type="button" class="sg2-chip" data-op="${o}">${o}</button>`).join("")}</div>
      <div class="feedback sg2-feedback" data-feedback></div>
    `;
    holeEls().forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.hole), paint())));
    body.querySelectorAll("[data-op]").forEach((b) => b.addEventListener("click", () => putSign(b.dataset.op)));
    paint();
  }

  function paint() {
    holeEls().forEach((b, i) => {
      b.textContent = holes[i];
      b.classList.toggle("active", i === active);
    });
  }

  // La ficha entra en el hueco activo; si queda otro vacío el foco pasa a él
  // y, en cuanto están todos, se corrige al instante.
  function putSign(op) {
    if (finished || busy) return;
    holes[active] = op;
    const empty = holes.findIndex((h) => h === "");
    if (empty === -1) { paint(); return check(); }
    active = empty;
    paint();
  }

  function check() {
    busy = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    let ok = true;
    holeEls().forEach((b, i) => {
      b.classList.remove("active");
      const good = holes[i] === round.ops[i];
      ok = ok && good;
      b.classList.add(good ? "good" : "bad");
      if (!good) b.innerHTML = `<s>${holes[i]}</s><em class="sg2-want">${round.ops[i]}</em>`;
    });
    body.querySelectorAll("[data-op]").forEach((b) => (b.disabled = true));
    const full = round.nums.map((n, i) => (i < round.ops.length ? `${n} ${round.ops[i]}` : n)).join(" ") + ` = ${round.result}`;
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${full}. 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.innerHTML = `Era ${full}. 💡 ${round.hint} <button type="button" class="sg2-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad";
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 2500);
    }
  }

  // Teclado físico: + - * / (también x y :).
  const KEYS = { "+": "+", "-": "−", "*": "×", x: "×", "/": "÷", ":": "÷" };
  const onKey = (e) => {
    const op = KEYS[e.key.toLowerCase()];
    if (op) { e.preventDefault(); putSign(op); }
  };
  window.addEventListener("keydown", onKey);

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "signo", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>❓</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} signos acertados de ${rounds}</p>
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
    hits = 0;
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
  };
}
