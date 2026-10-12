// "Valor numérico": la expresión escrita como en el libro ("P(x) = 2x + 1")
// y debajo la sustitución con casillas: "P(3) = 2 · □ + 1 = □". Primero se
// rellenan las casillas de la sustitución (el número que entra en lugar
// de la letra) y luego el resultado. ✓ (o Enter) pasa a la siguiente
// casilla vacía y, con todas llenas, corrige. El 💡 hace la cuenta:
// "Cambio la x por 3: 2 · 3 + 1 = 6 + 1 = 7".
import { randInt, pick, saveScore } from "./utils.js";

const M = "−";
const neg = (n) => String(n).replace("-", M);
const par = (n) => (n < 0 ? `(${neg(n)})` : neg(n)); // negativo entre paréntesis
const sgn = (c, first) => (first ? (c < 0 ? M : "") : c < 0 ? ` ${M} ` : " + ");
const V = (v) => `<i>${v}</i>`;
const nz = (a, b) => { let v; do v = randInt(a, b); while (v === 0); return v; };
const frac = (n, d) => `<span class="vn-frac"><span>${n}</span><span>${d}</span></span>`;

// Un término es c · (letras con exponente): { c: 2, f: [["x", 2]] } = 2x².
const exprHTML = (terms) =>
  terms.map((t, i) => sgn(t.c, i === 0) + (Math.abs(t.c) === 1 && t.f.length ? "" : Math.abs(t.c)) +
    t.f.map(([v, p]) => V(v) + (p > 1 ? `<sup>${p}</sup>` : "")).join("")).join("");

// La sustitución: cada letra se cambia por una casilla (entre paréntesis
// si el número es negativo); "num" escribe lo mismo con los números.
function substitute(terms, vals, num) {
  let k = 0;
  const ans = [];
  const html = terms.map((t, i) => {
    const facs = t.f.map(([v, p]) => {
      ans.push(vals[v]);
      const s = num ? neg(vals[v]) : `[${k++}]`;
      return (vals[v] < 0 ? `(${s})` : s) + (p > 1 ? `<sup>${p}</sup>` : "");
    });
    const a = Math.abs(t.c);
    return sgn(t.c, i === 0) + (facs.length ? (a === 1 ? "" : `${a} · `) : String(a)) + facs.join(" · ");
  }).join("");
  return { html, ans };
}

function polyRound(terms, vals, name) {
  const sub = substitute(terms, vals, false);
  const tv = terms.map((t) => t.f.reduce((p, [v, e]) => p * vals[v] ** e, t.c));
  const value = tv.reduce((s, v) => s + v, 0);
  const mid = tv.map((v, i) => (i === 0 ? neg(v) : `${v < 0 ? ` ${M} ` : " + "}${Math.abs(v)}`)).join("");
  const letters = Object.keys(vals);
  const change = letters.map((v) => `la ${V(v)} por ${par(vals[v])}`).join(" y ");
  const warn = [];
  for (const v of letters)
    if (vals[v] < 0 && terms.some((t) => t.f.some(([w, p]) => w === v && p === 2)))
      warn.push(`ojo: (${neg(vals[v])})<sup>2</sup> = ${vals[v] ** 2}, positivo`);
  if (terms.some((t) => t.c < 0 && t.f.length === 1 && t.f[0][1] === 1 && vals[t.f[0][0]] < 0)) warn.push("menos por menos, más");
  const hint = `Cambio ${change}: ${substitute(terms, vals, true).html} = ${mid} = ${neg(value)}${warn.length ? ` (${warn.join("; ")})` : ""}`;
  const def = name ? `${V("P")}(${V("x")}) = ${exprHTML(terms)}` : `${exprHTML(terms)} &nbsp;para ${letters.map((v) => `${V(v)} = ${neg(vals[v])}`).join(", ")}`;
  const work = `${name ? `${V("P")}(${neg(vals.x)}) = ` : ""}${sub.html} = [${sub.ans.length}]`;
  return { def, work, answers: [...sub.ans, value], value, terms, vals, hint };
}

// Fórmulas de verdad (nivel 4): se sustituyen las medidas y se calcula.
const FORMULAS = [
  () => { let b, h; do { b = randInt(2, 12); h = randInt(2, 12); } while ((b * h) % 2); return { name: "Área del triángulo", vals: { b, h }, value: (b * h) / 2,
    def: `${V("A")} = ${frac(`${V("b")} · ${V("h")}`, 2)}`, work: `${V("A")} = ${frac("[0] · [1]", 2)} = [2]`, calc: `${frac(`${b} · ${h}`, 2)} = ${frac(b * h, 2)} = ${(b * h) / 2}` }; },
  () => { const b = randInt(2, 15), h = randInt(2, 15); return { name: "Perímetro del rectángulo", vals: { b, h }, value: 2 * b + 2 * h,
    def: `${V("P")} = 2${V("b")} + 2${V("h")}`, work: `${V("P")} = 2 · [0] + 2 · [1] = [2]`, calc: `2 · ${b} + 2 · ${h} = ${2 * b} + ${2 * h} = ${2 * b + 2 * h}` }; },
  () => { const l = randInt(2, 15); return { name: "Área del cuadrado", vals: { l }, value: l * l,
    def: `${V("A")} = ${V("l")}<sup>2</sup>`, work: `${V("A")} = [0]<sup>2</sup> = [1]`, calc: `${l}<sup>2</sup> = ${l} · ${l} = ${l * l}` }; },
  () => { const a = randInt(2, 9); return { name: "Volumen del cubo", vals: { a }, value: a ** 3,
    def: `${V("V")} = ${V("a")}<sup>3</sup>`, work: `${V("V")} = [0]<sup>3</sup> = [1]`, calc: `${a}<sup>3</sup> = ${a} · ${a} · ${a} = ${a ** 3}` }; },
  () => { const v = randInt(2, 18) * 5, t = randInt(2, 9); return { name: "Distancia recorrida", vals: { v, t }, value: v * t,
    def: `${V("d")} = ${V("v")} · ${V("t")}`, work: `${V("d")} = [0] · [1] = [2]`, calc: `${v} · ${t} = ${v * t}` }; },
  () => { let B, b, h; do { B = randInt(4, 14); b = randInt(2, B - 1); h = randInt(2, 10); } while (((B + b) * h) % 2);
    return { name: "Área del trapecio", vals: { B, b, h }, value: ((B + b) * h) / 2,
      def: `${V("A")} = ${frac(`(${V("B")} + ${V("b")}) · ${V("h")}`, 2)}`, work: `${V("A")} = ${frac("([0] + [1]) · [2]", 2)} = [3]`,
      calc: `${frac(`(${B} + ${b}) · ${h}`, 2)} = ${frac(`${B + b} · ${h}`, 2)} = ${frac((B + b) * h, 2)} = ${((B + b) * h) / 2}` }; },
];

// Niveles: 0 ax + b · 1 con x² · 2 x negativo · 3 dos letras · 4 fórmulas.
export function buildRound(level) {
  if (level >= 4) {
    const f = pick(FORMULAS)();
    const ks = Object.keys(f.vals);
    return { ...f, level, def: `${f.name}: ${f.def}`, given: ks.map((k) => `${V(k)} = ${f.vals[k]}`).join(", "),
      answers: [...ks.map((k) => f.vals[k]), f.value], hint: `Cambio ${ks.map((k) => `la ${V(k)} por ${f.vals[k]}`).join(", ")}: ${f.calc}` };
  }
  if (level === 3) {
    const a = nz(-5, 6), b = nz(-5, 6);
    const form = randInt(0, 2);
    const terms = form === 0 ? [{ c: nz(-6, 7), f: [["a", 1]] }, { c: nz(-6, 7), f: [["b", 1]] }]
      : form === 1 ? [{ c: pick([1, 1, 2, 3, -1]), f: [["a", 2]] }, { c: nz(-6, 7), f: [["b", 1]] }]
      : [{ c: pick([1, 2, 3, -2]), f: [["a", 1], ["b", 1]] }, { c: nz(-9, 9), f: [] }];
    return { level, ...polyRound(terms, { a, b }, false) };
  }
  const x = level === 2 ? randInt(-5, -1) : randInt(1, level === 0 ? 9 : 5);
  let terms;
  if (level === 0 || (level === 2 && Math.random() < 0.3)) terms = [{ c: randInt(2, 9), f: [["x", 1]] }, { c: nz(-9, 9), f: [] }];
  else {
    const c2 = pick(level === 2 ? [1, 1, 2, -1] : [1, 1, 2, 3]), c1 = randInt(-6, 6), c0 = nz(-9, 9);
    terms = [{ c: c2, f: [["x", 2]] }];
    if (c1) terms.push({ c: c1, f: [["x", 1]] });
    terms.push({ c: c0, f: [] });
  }
  return { level, ...polyRound(terms, { x }, true) };
}

export function mountValornumericoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, active, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body vn-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const slots = (html) => html.replace(/\[(\d+)\]/g, (_, k) => `<button type="button" class="vn-slot" data-slot="${k}"></button>`);

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    const last = round && round.work + round.def;
    do round = buildRound(Math.min(4, Math.floor(hits / 3))); while (round.work + round.def === last);
    typed = round.answers.map(() => "");
    active = 0;
    busy = false;
    body.innerHTML = `
      <p class="prompt vn-prompt">Sustituye y calcula</p>
      <div class="vn-cuaderno">
        <div class="vn-def">${round.def}</div>
        ${round.given ? `<div class="vn-given">con ${round.given}</div>` : ""}
        <div class="vn-work">${slots(round.work)}</div>
      </div>
      <div class="keypad vn-keypad" data-keypad></div>
      <button type="button" class="choice-btn keypad-sign vn-sign" data-sign>${M} cambiar signo</button>
      <div class="feedback vn-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary" : ""}`;
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
    body.querySelector("[data-sign]").addEventListener("click", () => pressKey("±"));
    paint();
  }

  function paint() {
    body.querySelectorAll("[data-slot]").forEach((b) => {
      b.textContent = neg(typed[+b.dataset.slot]);
      b.classList.toggle("active", +b.dataset.slot === active);
    });
  }

  function pressKey(key) {
    if (finished || busy) return;
    const t = typed[active];
    if (key === "✓") return check();
    if (key === "±") typed[active] = t.startsWith("-") ? t.slice(1) : "-" + t;
    else if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (t.replace("-", "").length < 4) typed[active] = t + key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const filled = (v) => v !== "" && v !== "-";
    // ✓ con casillas vacías: el foco pasa a la siguiente que falte (en orden).
    if (!typed.every(filled)) {
      if (filled(typed[active])) {
        active = typed.map((_, k) => (active + 1 + k) % typed.length).find((k) => !filled(typed[k]));
        return paint();
      }
      feedback.textContent = "Escribe un número en la casilla";
      feedback.className = "feedback bad vn-feedback";
      return;
    }
    busy = true;
    rounds++;
    let ok = true;
    body.querySelectorAll("[data-slot]").forEach((s) => {
      const i = +s.dataset.slot, good = Number(typed[i]) === round.answers[i];
      ok = ok && good;
      s.classList.remove("active");
      s.classList.add(good ? "good" : "bad");
      if (!good) s.innerHTML = `<s>${neg(typed[i])}</s><span class="vn-want">${neg(round.answers[i])}</span>`;
    });
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.innerHTML = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok vn-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const after = () => (lives <= 0 ? finish(false) : nextRound());
      feedback.innerHTML = `Vale ${neg(round.answers.at(-1))}. 💡 ${round.hint} <button type="button" class="vn-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad vn-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", () => { clearTimeout(pending); after(); });
      pending = setTimeout(after, 2500);
    }
  }

  // Teclado físico: cifras, ⌫, Enter, "-" para el signo y flechas.
  function onKey(e) {
    if (finished || !round) return;
    if (busy) {
      if (e.key === "Enter") body.querySelector("[data-next]")?.click();
      return;
    }
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
    else if (e.key === "-") pressKey("±");
    else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      active = (active + (e.key === "ArrowRight" ? 1 : typed.length - 1)) % typed.length;
      paint();
    } else return;
    e.preventDefault();
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "valornumerico", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔢</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} valores numéricos bien calculados de ${rounds}</p>
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
    round = null;
    finished = false;
    window.removeEventListener("keydown", onKey);
    window.addEventListener("keydown", onKey);
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
