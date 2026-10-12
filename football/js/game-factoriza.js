// "Descompón en factores primos": la raya vertical del cuaderno. El número
// arriba a la izquierda; a la derecha de la raya se escribe el primo más
// pequeño que lo divide y debajo, a la izquierda, el cociente; así fila a
// fila hasta llegar a 1. Cada cifra va en su cuadrito y el foco avanza
// solo en el orden de clase (primo → cociente → primo…); las filas van
// apareciendo según se rellenan, como en el cuaderno. En los niveles altos
// se cierra con la línea "60 = 2² · 3 · 5" (casillas para los exponentes)
// y aparecen números primos, que solo se dividen entre sí mismos.
import { randInt, pick, saveScore } from "./utils.js";

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (n) => String(n).split("").map((d) => SUP[d]).join("");
const isPrime = (n) => {
  if (n < 2) return false;
  for (let p = 2; p * p <= n; p++) if (n % p === 0) return false;
  return true;
};
const PRIMES = Array.from({ length: 200 }, (_, i) => i).filter(isPrime);

// Filas de la raya: { n, p } = número de la izquierda y primo de la derecha.
export function factorize(n) {
  const rows = [];
  for (let x = n; x > 1; ) {
    let p = 2;
    while (x % p) p++;
    rows.push({ n: x, p });
    x /= p;
  }
  return rows;
}
// Potencias: [[primo, exponente], …] en orden creciente.
export function powers(rows) {
  const out = [];
  rows.forEach(({ p }) => (out.length && out[out.length - 1][0] === p ? out[out.length - 1][1]++ : out.push([p, 1])));
  return out;
}
export const expr = (pw) => pw.map(([p, e]) => p + (e > 1 ? sup(e) : "")).join(" · ");

// Por qué se elige ese primo, dicho como en clase.
function reason(x, p) {
  if (x === p) return `${x} es primo → ${p}`;
  if (p === 2) return `${x} es par → 2`;
  if (p === 3) return `${x} no es par; ${String(x).split("").join(" + ")} = ${String(x).split("").reduce((s, d) => s + +d, 0)} → 3`;
  if (p === 5) return `${x} acaba en 5 → 5`;
  return `${x} = ${p} × ${x / p} → ${p}`;
}

// Niveles: 0 hasta 30 · 1 hasta 100 · 2 hasta 300 · 3 con la expresión en
// potencias (siempre con algún factor repetido) · 4 igual, y a veces primos.
export function buildRound(level) {
  let n, rows, prime = false;
  for (;;) {
    if (level === 4 && Math.random() < 0.4) { n = pick(PRIMES.filter((p) => p >= 11)); prime = true; }
    else n = level === 0 ? randInt(4, 30) : level === 1 ? randInt(31, 100) : level === 2 ? randInt(101, 300) : randInt(12, 300);
    if (!prime && isPrime(n)) continue;
    rows = factorize(n);
    if (rows.length > 7) continue; // como mucho 8 filas en la raya
    if (level >= 3 && !prime && powers(rows).every(([, e]) => e === 1)) continue;
    break;
  }
  const pw = powers(rows);
  const withExpr = level >= 3 && !prime;
  // Casillas en el orden de clase: cifras del primo, cifras del cociente…
  const slots = [];
  rows.forEach((r, k) => {
    String(r.p).split("").forEach((ch, j) => slots.push({ kind: "p", row: k, col: j, want: ch }));
    const q = String(r.n / r.p);
    q.split("").forEach((ch, j) => slots.push({ kind: "q", row: k + 1, col: String(n).length - q.length + j, want: ch }));
  });
  if (withExpr) pw.forEach(([, e], i) => slots.push({ kind: "e", idx: i, want: String(e), blank: e === 1 ? "1" : undefined }));
  let hint;
  if (prime) {
    const tried = PRIMES.filter((p) => p * p <= n);
    const next = PRIMES.find((p) => p * p > n);
    hint = `${n} no se puede dividir entre ${tried.join(", ").replace(/, (\d+)$/, " ni $1")}, y ${next} × ${next} = ${next * next} ya pasa de ${n}: es primo, solo se divide entre él mismo → ${n} : ${n} = 1`;
  } else {
    hint = `Pruebo el primo más pequeño que divide: ${rows.map((r) => reason(r.n, r.p)).join("; ")}; y llego a 1`;
    if (withExpr) hint += `. Junto los iguales: ${n} = ${expr(pw)}`;
  }
  return { n, rows, pw, prime, withExpr, slots, hint, W: String(n).length, P: Math.max(...rows.map((r) => String(r.p).length)) };
}

export function mountFactorizaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, active, reach, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body fz-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const onKey = (e) => {
    if (/^\d$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
  };

  function nextRound() {
    if (finished) return;
    const level = Math.min(4, Math.floor(hits / 2));
    round = buildRound(level);
    typed = round.slots.map(() => "");
    active = 0;
    reach = 0;
    busy = false;
    const { n, rows, W, P, slots } = round;
    const slotBtn = (i) => `<button type="button" class="fz-cell fz-slot" data-slot="${i}"></button>`;
    // Izquierda: el número y los cocientes (alineados a la derecha).
    const left = rows.concat([{}]).map((_, k) => {
      const cells = Array.from({ length: W }, () => `<span class="fz-cell"></span>`);
      if (k === 0) String(n).split("").forEach((ch, j) => (cells[j] = `<span class="fz-cell fz-fixed">${ch}</span>`));
      slots.forEach((s, i) => s.kind === "q" && s.row === k && (cells[s.col] = slotBtn(i)));
      return `<div class="fz-row" data-row="${k}">${cells.join("")}</div>`;
    });
    // Derecha de la raya: los primos (alineados a la izquierda).
    const right = rows.concat([{}]).map((_, k) => {
      const cells = Array.from({ length: P }, () => `<span class="fz-cell"></span>`);
      slots.forEach((s, i) => s.kind === "p" && s.row === k && (cells[s.col] = slotBtn(i)));
      return `<div class="fz-row" data-row="${k}">${cells.join("")}</div>`;
    });
    const line = round.withExpr
      ? `<span class="fz-fixed">${n}</span><span class="fz-op">=</span>${round.pw
          .map(([p], i) => `${i ? `<span class="fz-op">·</span>` : ""}<span class="fz-pow"><span class="fz-fixed">${p}</span>${slotBtn(slots.findIndex((s) => s.kind === "e" && s.idx === i)).replace("fz-cell fz-slot", "fz-cell fz-slot fz-exp")}</span>`)
          .join("")}`
      : "";
    body.innerHTML = `
      <p class="prompt fz-prompt">Descompón <b>${n}</b> en factores primos</p>
      <div class="fz-cuaderno">
        <div class="fz-raya" style="--fz-w:${W};--fz-p:${P};--fz-rows:${level === 0 ? 5 : level === 1 ? 7 : 8}">
          <div class="fz-izq">${left.join("")}</div>
          <div class="fz-der">${right.join("")}</div>
        </div>
        <div class="fz-expr" data-expr>${line}</div>
      </div>
      <div class="keypad fz-keypad" data-keypad></div>
      <div class="feedback fz-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && +b.dataset.slot <= reach && ((active = +b.dataset.slot), paint())));
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

  // Las filas aparecen según se llega a ellas (no se sabe de antemano cuántas hay).
  function paint() {
    reach = Math.max(reach, active);
    const { slots, rows } = round;
    const firstOfRow = (k) => slots.findIndex((s) => s.row === k);
    rows.concat([{}]).forEach((_, k) => {
      const show = busy || k === 0 || reach >= firstOfRow(k);
      body.querySelectorAll(`[data-row="${k}"]`).forEach((r) => r.classList.toggle("fz-hidden", !show));
    });
    const firstExp = slots.findIndex((s) => s.kind === "e");
    body.querySelector("[data-expr]").classList.toggle("fz-hidden", !(busy || (firstExp >= 0 && reach >= firstExp)));
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot;
      if (!busy) b.textContent = typed[k];
      b.classList.toggle("active", !busy && k === active);
    });
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return check();
    if (key === "⌫") {
      if (typed[active] === "" && active > 0) active--;
      typed[active] = "";
    } else {
      typed[active] = key;
      if (active < typed.length - 1) active++;
    }
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const missing = typed.findIndex((t, i) => t === "" && round.slots[i].blank === undefined);
    if (missing >= 0) {
      active = missing;
      paint();
      feedback.textContent = "Faltan casillas por rellenar";
      feedback.className = "feedback bad fz-feedback";
      return;
    }
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot, s = round.slots[k];
      const ok = (typed[k] || s.blank) === s.want;
      allOk = allOk && ok;
      b.classList.add(ok ? "good" : "bad");
      if (ok) b.textContent = typed[k];
      else b.innerHTML = `<s>${typed[k]}</s><i class="fz-fix">${s.want}</i>`;
    });
    paint();
    const text = round.prime ? `${round.n} es primo` : `${round.n} = ${expr(round.pw)}`;
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${text}. 💡 ${round.hint}`;
      feedback.className = "feedback ok fz-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.innerHTML = `${text}. 💡 ${round.hint} <button type="button" class="fz-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad fz-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 2500 + 300 * round.rows.length);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "factoriza", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧱</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} números descompuestos de ${rounds}</p>
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
