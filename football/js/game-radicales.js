// "Saca factores de la raíz": en la hoja cuadriculada, la descomposición
// en factores con la raya vertical (50 | 2, 25 | 5, 5 | 5, 1) y al lado
// "50 = 2 · 5²" y "√50 = □√□": se escribe el número que sale y el que se
// queda dentro (bajo la raya de la raíz). Niveles: un cuadrado por un primo
// (√50 = 5√2) → dos factores (√72 = 6√2) → raíz cúbica (³√54 = 3³√2) →
// producto de raíces (√6 · √3 = √□ = □√□) → sumar radicales semejantes
// (2√3 + 5√3 = □√3, y √12 + √27 = □√3). El 💡 dice qué sale y por qué.
import { randInt, pick, saveScore } from "./utils.js";

const SUPD = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const supS = (n) => String(n).replace(/\d/g, (c) => SUPD[c]);
const M = "−";
function factor(n) {
  const f = [];
  for (let p = 2; n > 1; p++) {
    let e = 0;
    while (n % p === 0) { n /= p; e++; }
    if (e) f.push([p, e]);
  }
  return f;
}
const factS = (n) => factor(n).map(([p, e]) => (e > 1 ? `${p}${supS(e)}` : `${p}`)).join(" · ");
const factH = (n) => factor(n).map(([p, e]) => (e > 1 ? `${p}<sup>${e}</sup>` : `${p}`)).join(" · ");
// Saca factores de la raíz de índice idx: n = c^idx · r
function extract(n, idx) {
  let c = 1, r = 1;
  for (const [p, e] of factor(n)) { c *= p ** Math.floor(e / idx); r *= p ** (e % idx); }
  return { c, r };
}
const radH = (idx, inner) => `<span class="rc-rad">${idx === 3 ? '<sup class="rc-idx">3</sup>' : ""}<svg class="rc-sym" viewBox="0 0 10 20" preserveAspectRatio="none" aria-hidden="true"><path d="M0 12 L2.5 10.5 L6 19 L10 1"/></svg><span class="rc-arg">${inner}</span></span>`;
const radS = (idx, inner) => `${idx === 3 ? "³√" : "√"}${inner}`;
const isSq = (n) => Number.isInteger(Math.sqrt(n));

// Niveles: 0 cuadrado de un primo por un primo · 1 dos factores · 2 raíz
// cúbica · 3 producto de raíces · 4 suma o resta de radicales semejantes.
export function buildRound(level) {
  const L = Math.min(4, level);
  for (;;) {
    if (L <= 2) {
      const idx = L === 2 ? 3 : 2;
      const c = L === 0 ? pick([2, 3, 5, 7]) : L === 1 ? randInt(2, 12) : randInt(2, 5);
      const r = L === 0 ? pick([2, 3, 5, 7]) : L === 1 ? pick([2, 3, 5, 6, 7, 10, 11, 13, 14, 15]) : pick([2, 3, 4, 5, 6, 7, 9, 10]);
      const n = c ** idx * r;
      if (n > [150, 400, 1000][L]) continue;
      if (L === 1 && (factor(n).length < 2 || (factor(c).length === 1 && factor(c)[0][1] === 1 && factor(r).length === 1))) continue;
      const hint = `${n} = ${c ** idx} · ${r} = ${c}${supS(idx)} · ${r}: el ${c} sale de la raíz${idx === 3 ? " cúbica" : ""}: ${c}${radS(idx, r)}`;
      return {
        kind: "saca", idx, n, ans: [c, r], key: `s${n},${idx}`, ladder: true,
        prompt: "Saca factores de la raíz",
        lines: [`${n} = ${factH(n)}`, `${radH(idx, n)} = {0}${radH(idx, "{1}")}`], hint,
      };
    }
    if (L === 3) {
      const a = randInt(2, 15), b = randInt(2, 15);
      if (isSq(a) || isSq(b)) continue;
      const { c, r } = extract(a * b, 2);
      if (c < 2 || r < 2 || r > 10) continue;
      return {
        kind: "producto", idx: 2, n: a * b, ans: [a * b, c, r], key: `p${a},${b}`,
        prompt: "Multiplica las raíces y saca factores",
        lines: [`${radH(2, a)} · ${radH(2, b)} = ${radH(2, "{0}")} = {1}${radH(2, "{2}")}`],
        hint: `Se multiplica dentro de la raíz: √${a} · √${b} = √${a * b}; ${a * b} = ${c * c} · ${r} = ${c}² · ${r} → ${c}√${r}`,
      };
    }
    const r = pick([2, 3, 5, 6, 7]), op = pick(["+", M]);
    const coef = (k) => (k === 1 ? "" : `${k}`);
    if (Math.random() < 0.5) {
      const p = randInt(1, 9), q = randInt(1, 9), s = op === "+" ? p + q : p - q;
      if (s < 2) continue;
      return {
        kind: "suma", idx: 2, r, ans: [s], key: `a${p}${op}${q},${r}`, prompt: "Suma los radicales semejantes",
        lines: [`<span class="rc-term">${coef(p)}${radH(2, r)}</span> ${op} <span class="rc-term">${coef(q)}${radH(2, r)}</span> = {0}${radH(2, r)}`],
        hint: `Radicales semejantes (los dos con √${r}): se ${op === "+" ? "suman" : "restan"} los números de delante: ${p} ${op} ${q} = ${s} → ${s}√${r}`,
      };
    }
    if (r > 5) continue;
    const s1 = randInt(1, 5), s2 = randInt(1, 5), s = op === "+" ? s1 + s2 : s1 - s2;
    if (s1 === s2 || s < 2) continue;
    const n1 = s1 * s1 * r, n2 = s2 * s2 * r, t = (k) => (k === 1 ? `√${r}` : `${k}√${r}`);
    return {
      kind: "suma", idx: 2, r, ans: [s], key: `b${n1}${op}${n2}`, prompt: "Saca factores y suma",
      lines: [`<span class="rc-term">${radH(2, n1)}</span> ${op} <span class="rc-term">${radH(2, n2)}</span> = {0}${radH(2, r)}`],
      hint: `Primero saca factores: √${n1} = ${t(s1)} y √${n2} = ${t(s2)} → ${s1} ${op} ${s2} = ${s}: ${s}√${r}`,
    };
  }
}

// Descomposición en factores con la raya vertical, como en el cuaderno.
function ladder(n) {
  const rows = [];
  for (const [p, e] of factor(n)) for (let i = 0; i < e; i++) { rows.push([n, p]); n /= p; }
  rows.push([1, ""]);
  return `<div class="rc-ladder">${rows.map(([a, p]) => `<span class="rc-ln">${a}</span><span class="rc-lp">${p}</span>`).join("")}</div>`;
}

export function mountRadicalesGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, active, busy, goNext = null;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body rc-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const fill = (s) => s.replace(/\{(\d+)\}/g, (_, k) => `<button type="button" class="rc-slot" data-slot="${k}"></button>`);

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    goNext = null;
    const prev = round && round.key;
    do round = buildRound(Math.min(4, Math.floor(hits / 2)));
    while (round.key === prev); // nunca la misma ronda dos veces seguidas
    typed = round.ans.map(() => "");
    active = 0;
    busy = false;
    body.innerHTML = `
      <p class="prompt rc-prompt">${round.prompt}</p>
      <div class="rc-cuaderno">
        ${round.ladder ? ladder(round.n) : ""}
        <div class="rc-lines">${round.lines.map((l) => `<div class="rc-line">${fill(l)}</div>`).join("")}</div>
      </div>
      <div class="keypad rc-keypad" data-keypad></div>
      <div class="feedback rc-feedback" data-feedback></div>
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
    paint();
  }

  function paint() {
    body.querySelectorAll("[data-slot]").forEach((b) => {
      b.textContent = typed[+b.dataset.slot];
      b.classList.toggle("active", +b.dataset.slot === active);
    });
  }

  function say(h, cls) {
    const fb = body.querySelector("[data-feedback]");
    fb.innerHTML = h;
    fb.className = `feedback rc-feedback ${cls}`;
    return fb;
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return enter();
    const t = typed[active];
    if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (t.length < 4) typed[active] = t === "0" ? key : t + key;
    paint();
  }

  // ✓ con la casilla llena pasa al siguiente hueco (de izquierda a derecha).
  function enter() {
    const n = typed.length;
    const next = [...Array(n).keys()].map((i) => (active + 1 + i) % n).find((i) => typed[i] === "");
    if (next === undefined) return check();
    if (typed[active] === "") return say("Escribe un número en la casilla marcada", "bad");
    active = next;
    paint();
  }

  function check() {
    busy = true;
    rounds++;
    const v = typed.map(Number), ok = round.ans.map((w, k) => v[k] === w);
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot;
      b.classList.remove("active");
      b.classList.add(ok[k] ? "good" : "bad");
      if (!ok[k]) b.innerHTML = `<s>${typed[k]}</s><em class="rc-fix">${round.ans[k]}</em>`;
    });
    if (ok.every(Boolean)) {
      score += 10;
      hits++;
      renderScore();
      say(`✓ 💡 ${round.hint}`, "ok");
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      // ¿Vale lo mismo pero sin sacar todo? (p. ej. √72 = 3√8)
      const [c, r] = round.kind === "producto" ? v.slice(1) : v;
      const half = round.kind !== "suma" && c > 0 && r > 1 && c ** round.idx * r === round.n
        ? `${c}${radS(round.idx, r)} vale lo mismo, pero aún se pueden sacar factores del ${r} (${r} = ${factS(r)}). ` : "";
      goNext = () => { clearTimeout(pending); goNext = null; lives <= 0 ? finish(false) : nextRound(); };
      say(`${half}💡 ${round.hint} <button type="button" class="rc-next" data-next>Siguiente →</button>`, "bad")
        .querySelector("[data-next]").addEventListener("click", goNext);
      pending = setTimeout(goNext, 4000);
    }
  }

  // Teclado físico: cifras, borrar, Enter.
  function onKey(e) {
    if (finished || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Enter" && goNext) return e.preventDefault(), goNext();
    const key = /^[0-9]$/.test(e.key) ? e.key : e.key === "Backspace" ? "⌫" : e.key === "Enter" ? "✓" : null;
    if (key) { e.preventDefault(); pressKey(key); }
  }

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "radicales", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>√</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} raíces simplificadas de ${rounds}</p>
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
    round = null;
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
