// "Logaritmos": en la hoja, "log₂ 8 = □" y justo debajo la potencia
// equivalente "2^□ = 8", cuyo exponente se va escribiendo solo con lo que
// pones en la casilla (así se ve que el logaritmo ES ese exponente).
// Luego log 1000, log₃ 81, log₅ 1, log₇ 7, log₂ (1/4) = −2 (con la tecla
// "− cambiar signo") y las propiedades: "log 2 + log 5 = log □ = □".
// El 💡: "¿a qué exponente elevo la base para obtener el número? 2³ = 8 → 3".
import { randInt, pick, saveScore } from "./utils.js";

const M = "−";
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const sgn = (n) => (n < 0 ? `${M}${-n}` : `${n}`);
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹", SUB = "₀₁₂₃₄₅₆₇₈₉";
const sup = (n) => (n < 0 ? "⁻" : "") + String(Math.abs(n)).replace(/\d/g, (c) => SUP[c]);
const logS = (b) => (b === 10 ? "log" : `log${String(b).replace(/\d/g, (c) => SUB[c])}`);
const logH = (b) => `<span class="lg-log">log${b === 10 ? "" : `<sub>${b}</sub>`}</span>`;
const fracH = (n, d) => `<span class="lg-frac"><span>${n}</span><span>${d}</span></span>`;

// El número del que se toma el logaritmo: entero, fracción 1/bⁿ o decimal 0,01.
function arg(b, e) {
  if (e >= 0) return { h: fmt(b ** e), s: fmt(b ** e) };
  const d = b ** -e;
  if (b === 10 && Math.random() < 0.6) { const s = `0,${"0".repeat(-e - 1)}1`; return { h: s, s }; }
  return { h: fracH(1, fmt(d)), s: `1/${fmt(d)}` };
}

// Niveles: 0 base 2 · 1 base 10, 3 y 5 · 2 log 1 = 0 y log de la base = 1 ·
// 3 exponentes negativos (fracciones y 0,01) · 4 propiedades (producto y cociente).
export function buildRound(level) {
  const L = Math.min(4, level), neg = L >= 3;
  if (L === 4) {
    const op = pick(["+", M]), b = pick([10, 10, 2, 3]);
    let a, c, P, n;
    if (b === 10) {
      n = randInt(1, 3);
      P = 10 ** n;
      if (op === "+") {
        const divs = [];
        for (let d = 2; d < P; d++) if (P % d === 0 && !/^10*$/.test(String(d)) && !/^10*$/.test(String(P / d))) divs.push(d);
        a = pick(divs);
        c = P / a;
      } else { c = randInt(2, 9); a = P * c; }
    } else {
      const top = b === 2 ? 8 : 5, i = randInt(1, top - 1), j = randInt(1, top - i);
      if (op === "+") { a = b ** i; c = b ** j; n = i + j; } else { a = b ** (i + j); c = b ** j; n = i; }
      P = b ** n;
    }
    const how = op === "+" ? `Logaritmo de un producto = suma de logaritmos: ${logS(b)} ${fmt(a)} + ${logS(b)} ${fmt(c)} = ${logS(b)} (${fmt(a)} · ${fmt(c)})`
      : `Logaritmo de un cociente = resta de logaritmos: ${logS(b)} ${fmt(a)} ${M} ${logS(b)} ${fmt(c)} = ${logS(b)} (${fmt(a)} : ${fmt(c)})`;
    return {
      kind: "prop", b, ans: [P, n], neg, key: `p${b}${op}${a},${c}`, prompt: "Usa las propiedades de los logaritmos",
      lines: [`${logH(b)} <span class="lg-arg">${fmt(a)}</span> ${op} ${logH(b)} <span class="lg-arg">${fmt(c)}</span> = ${logH(b)} {0}`,
        `${logH(b)} <span class="lg-copy" data-mirror="0"></span> = {1}`],
      hint: `${how} = ${logS(b)} ${fmt(P)} = ${n}, porque ${b}${sup(n)} = ${fmt(P)}`,
    };
  }
  let kind = L;
  if (L === 2 && Math.random() < 0.4) kind = pick([0, 1]);
  if (L === 3 && Math.random() < 0.3) kind = pick([1, 2]);
  const b = kind === 0 ? 2 : kind === 1 ? pick([10, 3, 5]) : kind === 2 ? pick([2, 3, 5, 7, 10]) : pick([2, 3, 10, 5]);
  const e = kind === 0 ? randInt(1, 10) : kind === 1 ? randInt(1, { 10: 6, 3: 6, 5: 4 }[b]) : kind === 2 ? pick([0, 1]) : -randInt(1, { 2: 5, 3: 4, 10: 3, 5: 3 }[b]);
  const x = arg(b, e), base10 = b === 10 ? " (log sin base = logaritmo decimal, base 10)" : "";
  let hint;
  if (e === 0) hint = `Cualquier número elevado a 0 da 1: ${b}⁰ = 1 → ${logS(b)} 1 = 0`;
  else if (e === 1) hint = `La base elevada a 1 es ella misma: ${b}¹ = ${b} → ${logS(b)} ${b} = 1`;
  else if (e < 0) hint = `Exponente negativo = dar la vuelta: ${b}${sup(e)} = ${e === -1 ? x.s : `1/${b}${sup(-e)} = ${x.s}`} → ${sgn(e)}`;
  else hint = `Logaritmo = ¿a qué exponente elevo la base para obtener el número? ${b}${sup(e)} = ${x.s} → ${e}`;
  return {
    kind: "log", b, ans: [e], neg, key: `l${b}^${e}${x.s}`, prompt: "Calcula el logaritmo",
    lines: [`${logH(b)} <span class="lg-arg">${x.h}</span> = {0}`, `<span class="lg-pow">${b}<sup class="lg-mirror" data-mirror="0"></sup></span> = ${x.h}`],
    hint: hint + base10,
  };
}

export function mountLogaritmoGame(container, { client, onExit }) {
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
    <div class="game-body lg-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const fill = (s) => s.replace(/\{(\d+)\}/g, (_, k) => `<button type="button" class="lg-slot" data-slot="${k}"></button>`);
  const shown = (t) => t.replace("-", M);

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
      <p class="prompt lg-prompt">${round.prompt}</p>
      <div class="lg-cuaderno${round.kind === "prop" ? " lg-props" : ""}">${round.lines.map((l, i) => `<div class="lg-line${i ? " lg-pow-line" : ""}">${fill(l)}</div>`).join("")}</div>
      <div class="keypad lg-keypad" data-keypad></div>
      ${round.neg ? `<button type="button" class="choice-btn keypad-sign lg-sign" data-sign>${M} cambiar signo</button>` : ""}
      <div class="feedback lg-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
    body.querySelector("[data-sign]")?.addEventListener("click", () => pressKey("±"));
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
      b.textContent = shown(typed[+b.dataset.slot]);
      b.classList.toggle("active", +b.dataset.slot === active);
    });
    // la potencia equivalente copia el exponente que se está escribiendo
    body.querySelectorAll("[data-mirror]").forEach((m) => (m.textContent = shown(typed[+m.dataset.mirror])));
  }

  function say(h, cls) {
    const fb = body.querySelector("[data-feedback]");
    fb.innerHTML = h;
    fb.className = `feedback lg-feedback ${cls}`;
    return fb;
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return enter();
    const t = typed[active];
    if (key === "±") { if (round.neg) typed[active] = t.startsWith("-") ? t.slice(1) : `-${t}`; }
    else if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (t.replace("-", "").length < 5) typed[active] = t === "0" ? key : t === "-0" ? `-${key}` : t + key;
    paint();
  }

  // ✓ con la casilla llena pasa al siguiente hueco; con todo lleno, corrige.
  function enter() {
    const n = typed.length, full = (t) => /\d/.test(t);
    const next = [...Array(n).keys()].map((i) => (active + 1 + i) % n).find((i) => !full(typed[i]));
    if (next === undefined) return check();
    if (!full(typed[active])) return say("Escribe un número en la casilla marcada", "bad");
    active = next;
    paint();
  }

  function check() {
    busy = true;
    rounds++;
    const ok = round.ans.map((w, k) => Number(typed[k]) === w);
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot;
      b.classList.remove("active");
      b.classList.add(ok[k] ? "good" : "bad");
      if (!ok[k]) b.innerHTML = `<s>${shown(typed[k])}</s><em class="lg-fix">${round.kind === "prop" && k === 0 ? fmt(round.ans[k]) : sgn(round.ans[k])}</em>`;
    });
    body.querySelectorAll("[data-mirror]").forEach((m) => (m.textContent = round.kind === "prop" ? fmt(round.ans[0]) : sgn(round.ans[0])));
    if (ok.every(Boolean)) {
      score += 10;
      hits++;
      renderScore();
      say(`✓ 💡 ${round.hint}`, "ok");
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      goNext = () => { clearTimeout(pending); goNext = null; lives <= 0 ? finish(false) : nextRound(); };
      say(`💡 ${round.hint} <button type="button" class="lg-next" data-next>Siguiente →</button>`, "bad")
        .querySelector("[data-next]").addEventListener("click", goNext);
      pending = setTimeout(goNext, 4000);
    }
  }

  // Teclado físico: cifras, "-" para el signo, borrar, Enter.
  function onKey(e) {
    if (finished || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Enter" && goNext) return e.preventDefault(), goNext();
    const key = /^[0-9]$/.test(e.key) ? e.key : e.key === "-" ? "±" : e.key === "Backspace" ? "⌫" : e.key === "Enter" ? "✓" : null;
    if (key) { e.preventDefault(); pressKey(key); }
  }

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "logaritmo", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧮</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} logaritmos bien calculados de ${rounds}</p>
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
