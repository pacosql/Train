// "La caja de dividir": la división española DE VERDAD, dibujada como en
// el libro. El dividendo a la izquierda; a su derecha la caja (raya
// vertical y raya horizontal) con el divisor dentro, arriba, y el cociente
// DEBAJO de la raya. Bajo el dividendo van los restos parciales y las
// cifras que se "bajan" (con su flechita). Se rellena en el orden de
// clase: cifra del cociente → (producto, en los primeros niveles) → resto
// → se baja sola la siguiente cifra → siguiente cifra del cociente…
// El 💡 cuenta los pasos y acaba con la prueba D = d × c + r.
import { randInt, saveScore } from "./utils.js";

const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const tenths = (n) => `${fmt(Math.floor(n / 10))},${n % 10}`; // n en décimas

// Divide paso a paso: primer grupo = las primeras cifras que forman un
// número ≥ d; luego, en cada paso, resto y se baja la cifra siguiente.
export function divide(digits, d) {
  let end = 0, val = digits[0];
  while (val < d) val = val * 10 + digits[++end];
  const steps = [];
  for (;;) {
    const q = Math.floor(val / d), prod = q * d, rem = val - prod;
    steps.push({ group: val, end, q, prod, rem });
    if (end === digits.length - 1) return steps;
    val = rem * 10 + digits[++end];
  }
}

// Niveles: 0 dos cifras ÷ una · 1 tres cifras ÷ una (con el producto
// escrito) · 2 con un 0 en el cociente, restando de cabeza · 3 tres o
// cuatro cifras ÷ dos cifras · 4 cociente con una cifra decimal.
export function buildRound(level) {
  let D, d, dec, digits, steps;
  for (;;) {
    dec = level >= 4 ? 1 : 0;
    if (level === 0) { d = randInt(2, 9); D = randInt(Math.max(10, 2 * d), 99); }
    else if (level <= 2) { d = randInt(2, 9); D = randInt(100, 999); }
    else if (level === 3) { d = randInt(11, 39); D = randInt(150, 9999); }
    else { d = randInt(2, 9); D = randInt(20, 999); }
    if (d % 10 === 0) continue;
    digits = String(D).split("").map(Number);
    if (dec) digits.push(0); // el ",0" que se añade para sacar décimas
    steps = divide(digits, d);
    const zero = steps.slice(1).some((s) => s.q === 0);
    if (level <= 1 && zero) continue;
    if (level === 2 && !zero) continue;
    if (level === 3 && steps.length < 2) continue;
    if (dec && D % d === 0) continue; // si es exacta no hacen falta decimales
    break;
  }
  const nInt = String(D).length;
  const showProd = level <= 1;
  const qDigits = steps.map((s) => s.q).join("");
  const r = steps[steps.length - 1].rem;
  const qStr = dec ? tenths(+qDigits) : fmt(+qDigits);
  const rStr = dec && r ? tenths(r) : String(r);
  // Casillas en el orden de clase.
  const slots = [];
  const put = (kind, k, n, end) =>
    String(n).split("").forEach((ch, j, a) => slots.push({ kind, step: k, col: end - a.length + 1 + j, want: ch }));
  steps.forEach((s, k) => {
    slots.push({ kind: "q", step: k, col: k, want: String(s.q) });
    if (showProd) put("p", k, s.prod, s.end);
    put("r", k, s.rem, s.end);
  });
  const said = steps.map((s, k) => {
    const pre = k === 0 ? "" : dec && s.end === digits.length - 1 ? "Pongo la coma en el cociente y añado un 0: " : `Bajo el ${digits[s.end]}: `;
    return `${pre}${fmt(s.group)} : ${d} → ${s.q} (${s.q} × ${d} = ${fmt(s.prod)}, de ${fmt(s.prod)} a ${fmt(s.group)} van ${s.rem})`;
  });
  const hint = `${said.join("; ")}. Prueba: ${d} × ${qStr} + ${rStr} = ${fmt(D)} ✓`;
  return { D, d, dec, digits, nInt, steps, showProd, slots, qDigits, r, qStr, rStr, hint };
}

export function mountCajaGame(container, { client, onExit }) {
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
    <div class="game-body cj-body" data-body></div>
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

  // Fila de la izquierda en la que va cada cosa.
  const prodRow = (k) => 1 + 2 * k;
  const remRow = (k) => (round.showProd ? 2 + 2 * k : 1 + k);

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 2)));
    typed = round.slots.map(() => "");
    active = 0;
    busy = false;
    const { steps, digits, nInt, d, dec } = round;
    const n = digits.length;
    const nRows = 1 + steps.length * (round.showProd ? 2 : 1);
    // Rejilla de la izquierda: nRows × (hueco del signo + n columnas).
    const grid = Array.from({ length: nRows }, () => Array.from({ length: n + 1 }, () => `<span class="cj-cell"></span>`));
    const at = (row, col, html) => (grid[row][col + 1] = html);
    digits.forEach((v, c) =>
      at(0, c, `<span class="cj-cell cj-fixed${c >= nInt ? " cj-added" : ""}${dec && c === nInt - 1 ? " cj-comma" : ""}" data-dcol="${c}">${v}</span>`)
    );
    round.slots.forEach((s, i) => {
      if (s.kind === "q") return;
      const row = s.kind === "p" ? prodRow(s.step) : remRow(s.step);
      at(row, s.col, `<button type="button" class="cj-cell cj-slot${s.kind === "p" ? " cj-under" : ""}" data-slot="${i}"></button>`);
    });
    steps.forEach((s, k) => {
      if (round.showProd) at(prodRow(k), s.end - String(s.prod).length, `<span class="cj-cell cj-minus">−</span>`);
      if (k < steps.length - 1) at(remRow(k), s.end + 1, `<span class="cj-cell cj-baja" data-baja="${k}">${digits[s.end + 1]}</span>`);
    });
    const m = Math.max(String(d).length, steps.length);
    body.innerHTML = `
      <p class="prompt cj-prompt">${dec ? "Divide hasta las décimas" : "Haz la división"}</p>
      <div class="cj-caja cj-cuaderno" style="--cj-n:${n};--cj-m:${m};--cj-c:${nRows >= 6 ? 32 : n + m <= 6 ? 40 : 33}px">
        <div class="cj-left">${grid.map((r, i) => `<div class="cj-row" data-row="${i}">${r.join("")}</div>`).join("")}</div>
        <div class="cj-right">
          <div class="cj-divisor">${String(d).split("").map((v) => `<span class="cj-cell cj-fixed">${v}</span>`).join("")}</div>
          <div class="cj-cociente">${round.slots
            .map((s, i) => (s.kind === "q" ? `<button type="button" class="cj-cell cj-slot${dec && s.step === steps.length - 2 ? " cj-comma" : ""}" data-slot="${i}" data-q="${s.step}"></button>` : ""))
            .join("")}</div>
        </div>
      </div>
      <div class="keypad cj-keypad" data-keypad></div>
      <div class="feedback cj-feedback" data-feedback></div>
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

  // Celdas del grupo que se está dividiendo (para resaltarlo).
  function groupCells(k) {
    const s = round.steps[k];
    if (k === 0) return [...body.querySelectorAll(`[data-row="0"] [data-dcol]`)].filter((c) => +c.dataset.dcol <= s.end);
    const prev = round.steps[k - 1];
    const start = prev.end - String(prev.rem).length + 1;
    const row = body.querySelector(`[data-row="${remRow(k - 1)}"]`);
    return [...row.children].filter((_, i) => i - 1 >= start && i - 1 <= s.end);
  }

  function paint() {
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot;
      if (!busy) b.textContent = typed[k];
      b.classList.toggle("active", !busy && k === active);
    });
    // Se baja sola la cifra siguiente cuando el resto de ese paso está escrito.
    round.steps.forEach((s, k) => {
      const done = busy || round.slots.every((t, i) => t.step !== k || t.kind !== "r" || typed[i] !== "");
      const el = body.querySelector(`[data-baja="${k}"]`);
      if (el) el.classList.toggle("cj-show", done);
      const src = body.querySelector(`[data-row="0"] [data-dcol="${s.end + 1}"]`);
      if (src && k < round.steps.length - 1) src.classList.toggle("cj-bajado", done);
    });
    body.querySelectorAll(".cj-grupo").forEach((c) => c.classList.remove("cj-grupo"));
    if (!busy) groupCells(round.slots[active].step).forEach((c) => c.classList.add("cj-grupo"));
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
    const missing = typed.indexOf("");
    if (missing >= 0) {
      active = missing;
      paint();
      feedback.textContent = "Faltan casillas por rellenar";
      feedback.className = "feedback bad cj-feedback";
      return;
    }
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot;
      const ok = typed[k] === round.slots[k].want;
      allOk = allOk && ok;
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${typed[k]}</s><i class="cj-fix">${round.slots[k].want}</i>`;
    });
    paint();
    const text = `${fmt(round.D)}${round.dec ? ",0" : ""} : ${round.d} = ${round.qStr}, resto ${round.rStr}`;
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${text}. 💡 ${round.hint}`;
      feedback.className = "feedback ok cj-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.innerHTML = `Era ${text}. 💡 ${round.hint} <button type="button" class="cj-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad cj-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 2500 + 400 * round.steps.length);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "caja", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>➗</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} divisiones bien hechas de ${rounds}</p>
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
