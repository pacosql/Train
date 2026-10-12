// "Pon el paréntesis": una igualdad como "2 + 3 × 4 = 20" que es falsa sin
// paréntesis. Se tocan dos huecos (abrir y cerrar) y se evalúa en vivo;
// bien si da el objetivo. Si ya se cumple sin paréntesis, hay botón
// "No hace falta". Niveles: 3 operandos con + y × → con − y ÷ → 4
// operandos → rondas en las que no hace falta.
import { randInt, pick, saveScore } from "./utils.js";

const PRIO = { "+": 1, "−": 1, "×": 2, "÷": 2 };
const apply = (a, s, b) => (s === "+" ? a + b : s === "−" ? a - b : s === "×" ? a * b : b === 0 ? NaN : a / b);
const isInt = (x) => Number.isFinite(x) && Math.abs(x - Math.round(x)) < 1e-9;
export const fmt = (x) => (!Number.isFinite(x) ? "—" : (isInt(x) ? String(Math.round(x)) : x.toFixed(2).replace(/\.?0+$/, "").replace(".", ",")).replace("-", "−"));

// Evalúa una lista plana (sin paréntesis) con prioridad y devuelve el
// valor, la cadena de pasos y si todos los pasos fueron enteros ≥ 0.
export function evalFlat(nums, ops) {
  let n = nums.slice();
  let o = ops.slice();
  const steps = [];
  let clean = true;
  while (o.length) {
    let i = o.findIndex((s) => PRIO[s] === 2);
    if (i < 0) i = 0;
    const v = apply(n[i], o[i], n[i + 1]);
    if (!isInt(v) || v < 0) clean = false;
    n.splice(i, 2, v);
    o.splice(i, 1);
    steps.push(render(n, o));
  }
  return { value: n[0], steps, clean };
}

export function render(nums, ops, group) {
  return nums.map((v, i) => `${group && group[0] === i ? "(" : ""}${fmt(v)}${group && group[1] === i ? ")" : ""}${i < ops.length ? ` ${ops[i]} ` : ""}`).join("");
}

// Evalúa con el grupo [k, m] entre paréntesis (o sin grupo).
export function evalWith(nums, ops, group) {
  if (!group) return evalFlat(nums, ops);
  const [k, m] = group;
  const inner = evalFlat(nums.slice(k, m + 1), ops.slice(k, m));
  const outerN = [...nums.slice(0, k), inner.value, ...nums.slice(m + 1)];
  const outerO = [...ops.slice(0, k), ...ops.slice(m)];
  const outer = evalFlat(outerN, outerO);
  return { value: outer.value, clean: inner.clean && outer.clean, steps: [render(outerN, outerO), ...outer.steps] };
}

// Todas las colocaciones válidas: ≥ 2 operandos y no toda la expresión.
export function groups(n) {
  const g = [];
  for (let k = 0; k < n - 1; k++) for (let m = k + 1; m < n; m++) if (!(k === 0 && m === n - 1)) g.push([k, m]);
  return g;
}

// Ronda: { nums, ops, target, group (null si no hace falta), hint }
export function buildRound(level) {
  for (;;) {
    const n = level >= 2 ? 4 : 3;
    const opsPool = level === 0 ? ["+", "×"] : ["+", "−", "×", "÷"];
    const ops = Array.from({ length: n - 1 }, () => pick(opsPool));
    if (new Set(ops).size < 2) continue;
    const nums = Array.from({ length: n }, () => randInt(level === 0 ? 2 : 1, level >= 2 ? 12 : 9));
    const plain = evalFlat(nums, ops);
    const all = groups(n).map((g) => ({ g, r: evalWith(nums, ops, g) }));
    const noneRound = level >= 3 && Math.random() < 0.4;
    if (noneRound) {
      if (!plain.clean || plain.value > 150) continue;
      if (!all.some(({ r }) => Math.abs(r.value - plain.value) > 1e-9)) continue;
      return { nums, ops, target: plain.value, group: null, hint: `No hace falta: ${render(nums, ops)} = ${plain.steps.join(" = ")} ya daba ${fmt(plain.value)}` };
    }
    const cands = all.filter(({ g, r }) => r.clean && r.value <= 150 && Math.abs(r.value - plain.value) > 1e-9 && all.every((o) => o.g === g || Math.abs(o.r.value - r.value) > 1e-9));
    if (!cands.length) continue;
    const { g, r } = pick(cands);
    return { nums, ops, target: r.value, group: g, hint: `${render(nums, ops, g)} = ${r.steps.join(" = ")}; sin paréntesis sería ${plain.steps[0]}${plain.steps.length > 1 ? ` = ${plain.steps.at(-1)}` : ""}` };
  }
}

export function mountParentesisGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let open = null; // operando donde abre "("
  let close = null; // operando tras el que cierra ")"
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
    <div class="game-body pa-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    round = buildRound(Math.min(3, Math.floor(score / 30)));
    open = close = null;
    busy = false;
    const n = round.nums.length;
    let html = "";
    round.nums.forEach((v, i) => {
      html += `<button type="button" class="pa-gap" data-open="${i}" aria-label="abrir paréntesis"></button><span class="pa-num">${v}</span><button type="button" class="pa-gap" data-close="${i}" aria-label="cerrar paréntesis"></button>`;
      if (i < n - 1) html += `<span class="pa-opr">${round.ops[i]}</span>`;
    });
    body.innerHTML = `
      <p class="prompt pa-prompt">Pon el paréntesis para que dé <b class="pa-target" data-target>${fmt(round.target)}</b></p>
      <div class="pa-expr${n === 4 ? " n4" : ""}" data-expr>${html}<span class="pa-eq">=</span><span class="pa-num pa-target">${fmt(round.target)}</span></div>
      <div class="pa-live" data-live></div>
      <div class="pa-sol" data-sol></div>
      <div class="feedback pa-fb" data-feedback></div>
      <button type="button" class="secondary pa-none" data-none>No hace falta paréntesis</button>
    `;
    body.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => tapGap("open", Number(b.dataset.open))));
    body.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => tapGap("close", Number(b.dataset.close))));
    body.querySelector("[data-none]").addEventListener("click", () => check(null));
    paint();
  }

  function paint() {
    const n = round.nums.length;
    body.querySelectorAll("[data-open]").forEach((b) => {
      const i = Number(b.dataset.open);
      b.textContent = open === i ? "(" : "";
      b.classList.toggle("set", open === i);
      b.disabled = busy || (close !== null && (i >= close || (close === n - 1 && i === 0)));
    });
    body.querySelectorAll("[data-close]").forEach((b) => {
      const i = Number(b.dataset.close);
      b.textContent = close === i ? ")" : "";
      b.classList.toggle("set", close === i);
      b.disabled = busy || (open !== null && (i <= open || (open === 0 && i === n - 1)));
    });
    const g = open !== null && close !== null ? [open, close] : null;
    const live = body.querySelector("[data-live]");
    live.textContent = `Ahora da: ${fmt(evalWith(round.nums, round.ops, g).value)}`;
    live.className = "pa-live";
  }

  function tapGap(kind, i) {
    if (finished || busy) return;
    if (kind === "open") open = open === i ? null : i;
    else close = close === i ? null : i;
    paint();
    if (open !== null && close !== null) check([open, close]);
  }

  function check(group) {
    if (finished || busy) return;
    busy = true;
    rounds++;
    const value = evalWith(round.nums, round.ops, group).value;
    const ok = Math.abs(value - round.target) < 1e-9;
    const live = body.querySelector("[data-live]");
    live.textContent = `Ahora da: ${fmt(value)} ${ok ? "✓" : "✗"}`;
    live.className = `pa-live ${ok ? "ok" : "bad"}`;
    const fb = body.querySelector("[data-feedback]");
    fb.textContent = `💡 ${round.hint}`;
    fb.className = `feedback pa-fb ${ok ? "ok" : "bad"}`;
    body.querySelectorAll(".pa-gap").forEach((b) => (b.disabled = true));
    if (ok) {
      score += 10;
      renderScore();
      body.querySelectorAll(".pa-gap.set").forEach((b) => b.classList.add("good"));
      pending = setTimeout(nextRound, 900);
      return;
    }
    lives--;
    renderLives();
    body.querySelectorAll(".pa-gap.set").forEach((b) => b.classList.add("bad"));
    // La colocación correcta, en verde, en el propio dibujo.
    if (round.group) {
      const [k, m] = round.group;
      const o = body.querySelector(`[data-open="${k}"]`);
      const c = body.querySelector(`[data-close="${m}"]`);
      o.textContent = "(";
      c.textContent = ")";
      o.className = c.className = "pa-gap good";
    }
    body.querySelector("[data-sol]").textContent = `${render(round.nums, round.ops, round.group)} = ${fmt(round.target)}`;
    if (lives <= 0) return (pending = setTimeout(() => finish(false), 2200));
    pending = setTimeout(nextRound, 2200);
  }

  function finish(userExited) {
    // Con el end-card en pantalla "← Menú" debe seguir funcionando.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "parentesis", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧷</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} igualdades arregladas</p>
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
