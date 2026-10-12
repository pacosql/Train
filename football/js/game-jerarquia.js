// "Paso a paso": una expresión con varias operaciones. Se toca el signo de
// la operación que hay que hacer PRIMERO; si es correcta se resuelve en la
// pantalla y se sigue hasta que queda un número (+10). Tocar una que no
// toca cuesta una vida y el 💡 explica la jerarquía.
// Niveles: 3 operandos → 4 operandos → con paréntesis → con potencias.
import { randInt, pick, saveScore } from "./utils.js";

const PRIO = { "+": 1, "−": 1, "×": 2, "÷": 2 };
const apply = (a, s, b) => (s === "+" ? a + b : s === "−" ? a - b : s === "×" ? a * b : b === 0 ? NaN : a / b);
const valOf = (t) => (t.k === "p" ? t.b ** t.e : t.v);

// Grupo más interno: [lo, hi) en tokens.
function innerGroup(tokens) {
  const close = tokens.findIndex((t) => t.k === ")");
  if (close < 0) return [0, tokens.length];
  let open = close;
  while (tokens[open].k !== "(") open--;
  return [open + 1, close];
}

// Índices de las operaciones que se pueden hacer ahora. Primero las
// potencias del grupo; luego la prioridad máxima; con igual prioridad,
// de izquierda a derecha (se admite saltarse una si la anterior es + o ×
// y el resultado sigue siendo entero no negativo: 2 + 3 + 4 → vale el 2º +).
export function validOps(tokens) {
  const [lo, hi] = innerGroup(tokens);
  const pows = [];
  for (let i = lo; i < hi; i++) if (tokens[i].k === "p") pows.push(i);
  if (pows.length) return pows;
  let maxP = 0;
  for (let i = lo; i < hi; i++) if (tokens[i].k === "o") maxP = Math.max(maxP, PRIO[tokens[i].s]);
  const out = [];
  for (let i = lo; i < hi; i++) {
    const t = tokens[i];
    if (t.k !== "o" || PRIO[t.s] !== maxP) continue;
    const prev = i - 2 >= lo && tokens[i - 2].k === "o" && PRIO[tokens[i - 2].s] === maxP ? tokens[i - 2].s : null;
    if (prev === null) out.push(i);
    else if ((prev === "+" || prev === "×") && Number.isInteger(apply(tokens[i - 1].v, t.s, tokens[i + 1].v)) && apply(tokens[i - 1].v, t.s, tokens[i + 1].v) >= 0) out.push(i);
  }
  return out;
}

// Resuelve la operación i y devuelve los tokens nuevos (quita paréntesis
// que ya solo encierran un número).
export function step(tokens, i) {
  const t = tokens.slice();
  if (t[i].k === "p") t.splice(i, 1, { k: "n", v: t[i].b ** t[i].e, fresh: true });
  else t.splice(i - 1, 3, { k: "n", v: apply(t[i - 1].v, t[i].s, t[i + 1].v), fresh: true });
  for (let j = 0; j < t.length - 2; j++) {
    if (t[j].k === "(" && t[j + 1].k === "n" && t[j + 2].k === ")") t.splice(j, 3, t[j + 1]);
  }
  return t;
}

const text = (tokens) => tokens.map((t) => (t.k === "n" ? t.v : t.k === "o" ? t.s : t.k === "p" ? `${t.b}^${t.e}` : t.k)).join(" ").replace(/\( /g, "(").replace(/ \)/g, ")");

// Genera una expresión cuyo cálculo (haciendo siempre la primera
// operación válida) solo pasa por enteros no negativos y pequeños.
export function buildRound(level) {
  for (;;) {
    const n = level === 0 ? 3 : level === 1 ? 4 : randInt(3, 4);
    const ops = [];
    const nums = [];
    for (let i = 0; i < n; i++) {
      const prevOp = ops[i - 1];
      if (prevOp === "÷") {
        const divs = [];
        for (let d = 2; d <= 9; d++) if (nums[i - 1] % d === 0 && d !== nums[i - 1]) divs.push(d);
        nums.push(divs.length ? pick(divs) : randInt(2, 9));
      } else nums.push(prevOp === "×" || ops[i] === "×" ? randInt(2, 9) : randInt(1, level >= 1 ? 20 : 12));
      if (i < n - 1) ops.push(pick(["+", "−", "×", "÷", "+", "−", "×"]));
    }
    const tokens = [];
    nums.forEach((v, i) => {
      tokens.push({ k: "n", v });
      if (i < n - 1) tokens.push({ k: "o", s: ops[i] });
    });
    if (level >= 3) {
      const j = randInt(0, n - 1) * 2;
      const b = randInt(2, 5);
      tokens[j] = { k: "p", b, e: b <= 3 ? randInt(2, 3) : 2 };
    }
    if (level >= 2 && (level === 2 || Math.random() < 0.6)) {
      const k = randInt(0, n - 2); // paréntesis alrededor de los operandos k y k+1
      tokens.splice(2 * k + 3, 0, { k: ")" });
      tokens.splice(2 * k, 0, { k: "(" });
      // El paréntesis tiene que cambiar algo: sin él el resultado sería otro.
      const plain = tokens.filter((t) => t.k !== "(" && t.k !== ")");
      if (finalValue(plain, false) === finalValue(tokens)) continue;
    }
    if (level < 3 && new Set(ops.map((s) => PRIO[s])).size < 2) continue; // que haya × o ÷ junto a + o −
    const fin = finalValue(tokens);
    if (fin === null || fin > 200) continue;
    return { tokens, result: fin };
  }
}

// Valor final siguiendo la primera operación válida; en modo estricto es
// null si algún paso no es entero no negativo (o pasa de 400).
export function finalValue(tokens, strict = true) {
  let t = tokens;
  while (t.length > 1) {
    const i = validOps(t)[0];
    t = step(t, i);
    const v = t.find((x) => x.fresh)?.v;
    if (!Number.isFinite(v) || (strict && (!Number.isInteger(v) || v < 0 || v > 400))) return null;
  }
  return t[0].v;
}

export function mountJerarquiaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let tokens = [];
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
    <div class="game-body je-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    round = buildRound(Math.min(3, Math.floor(rounds / 2)));
    tokens = round.tokens;
    busy = false;
    body.innerHTML = `
      <p class="prompt je-prompt">Toca la operación que se hace primero</p>
      <p class="je-orig" data-orig></p>
      <div class="je-expr" data-expr></div>
      <div class="feedback je-fb" data-feedback></div>
      <p class="je-rule">Paréntesis → potencias → × y ÷ → + y −, de izquierda a derecha</p>
    `;
    paint();
  }

  function paint() {
    const expr = body.querySelector("[data-expr]");
    expr.innerHTML = tokens
      .map((t, i) => {
        if (t.k === "n") return `<span class="je-num${t.fresh ? " fresh" : ""}">${t.v}</span>`;
        if (t.k === "o") return `<button type="button" class="je-op" data-op="${i}">${t.s}</button>`;
        if (t.k === "p") return `<button type="button" class="je-op je-pow" data-op="${i}">${t.b}<sup>${t.e}</sup></button>`;
        return `<span class="je-par">${t.k}</span>`;
      })
      .join("");
    expr.querySelectorAll("[data-op]").forEach((b) => b.addEventListener("click", () => tap(Number(b.dataset.op))));
    body.querySelector("[data-orig]").textContent = tokens.length > 1 && tokens !== round.tokens ? `Empezaste con: ${text(round.tokens).replace(/(\d)\^(\d)/g, (_, b, e) => b + "²³"[e - 2])}` : "";
  }

  // Explica por qué la operación i es la que toca ahora.
  function why(t, i) {
    const tk = t[i];
    if (tk.k === "p") return `${tk.b}${"²³"[tk.e - 2]} = ${Array(tk.e).fill(tk.b).join(" × ")} = ${tk.b ** tk.e} (las potencias van primero)`;
    const r = `${t[i - 1].v} ${tk.s} ${t[i + 1].v} = ${apply(t[i - 1].v, tk.s, t[i + 1].v)}`;
    if (innerGroup(t)[1] < t.length) return `${r} (lo de dentro del paréntesis primero)`;
    if (PRIO[tk.s] === 2 && t.some((x) => x.k === "o" && PRIO[x.s] === 1)) return `${r} (× y ÷ antes que + y −)`;
    return `${r} (misma prioridad: de izquierda a derecha)`;
  }

  function tap(i) {
    if (finished || busy) return;
    const valid = validOps(tokens);
    const fb = body.querySelector("[data-feedback]");
    if (valid.includes(i)) {
      const msg = why(tokens, i);
      tokens = step(tokens, i);
      paint();
      fb.className = "feedback je-fb ok";
      fb.textContent = `💡 ${msg}`;
      if (tokens.length === 1) {
        busy = true;
        rounds++;
        score += 10;
        renderScore();
        body.querySelector("[data-expr]").insertAdjacentHTML("beforeend", `<span class="je-result">✓</span>`);
        pending = setTimeout(nextRound, 900);
      }
      return;
    }
    // Fallo: vida, la tocada en rojo, las válidas en verde y el porqué.
    lives--;
    renderLives();
    const [lo, hi] = innerGroup(tokens);
    const good = tokens[valid[0]];
    const goodTxt = good.k === "p" ? `${good.b}${"²³"[good.e - 2]}` : `${tokens[valid[0] - 1].v} ${good.s} ${tokens[valid[0] + 1].v}`;
    let msg;
    if (i < lo || i >= hi) msg = `Primero lo de dentro del paréntesis: ${goodTxt}`;
    else if (good.k === "p") msg = `Primero las potencias: ${goodTxt} = ${good.b ** good.e}`;
    else if (PRIO[tokens[i].s] < PRIO[good.s]) msg = `Primero multiplicaciones y divisiones; luego sumas y restas: ${goodTxt}`;
    else msg = `Con la misma prioridad se va de izquierda a derecha: primero ${goodTxt}`;
    fb.className = "feedback je-fb bad";
    fb.textContent = `💡 ${msg}`;
    body.querySelector(`[data-op="${i}"]`).classList.add("bad");
    valid.forEach((j) => body.querySelector(`[data-op="${j}"]`).classList.add("good"));
    if (lives <= 0) {
      busy = true;
      pending = setTimeout(() => finish(false), 2200);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla "← Menú" debe seguir funcionando.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "jerarquia", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🪜</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} expresiones resueltas</p>
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
