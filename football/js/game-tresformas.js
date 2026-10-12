// "Fracción, decimal y porcentaje": la tabla de tres columnas del libro
// (Fracción | Decimal | %) con una fila: se da una de las tres formas y
// las otras dos son casillas que se tocan y se escriben con el teclado
// (con coma decimal). Vale cualquier fracción equivalente. Al responder
// se pinta la cuadrícula de 100 con el porcentaje coloreado y el 💡
// encadena "1/4 = 1 : 4 = 0,25 = 25 %".
import { randInt, pick, saveScore } from "./utils.js";

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
// P en centésimas → "0,25", "1,5", "0,05"
export const decOf = (P) => {
  const e = Math.floor(P / 100), c = P % 100;
  return c ? `${e},${String(c).padStart(2, "0").replace(/0$/, "")}` : String(e);
};
// "0,25" → 25 centésimas (o NaN si no es un número bien escrito)
export const parseCent = (t) => (/^\d*,?\d*$/.test(t) && /\d/.test(t) ? Math.round(Number(t.replace(",", ".")) * 1e6) / 1e4 : NaN);

// Niveles: 0 1/2, 1/4, 3/4, 1/10 · 1 quintos y décimas · 2 cualquier
// centésima (0,35 = 35/100 = 7/20) · 3 mayores que 1 (1,5 = 150 %) ·
// 4 mezcla de 1-3. En cada ronda se da una columna al azar.
export function buildRound(level, given = pick(["f", "d", "p"])) {
  if (level >= 4) level = pick([1, 2, 3]);
  let a, b;
  if (level === 0) [a, b] = pick([[1, 2], [1, 4], [3, 4], [1, 10]]);
  else if (level === 1) {
    do { b = pick([5, 10]); a = randInt(1, b - 1); } while (gcd(a, b) !== 1);
  } else if (level === 2) {
    let p;
    do p = randInt(1, 99); while (p % 10 === 0 || [25, 50, 75].includes(p));
    const g = gcd(p, 100);
    [a, b] = [p / g, 100 / g];
  } else {
    do { b = pick([2, 4, 5, 10, 20, 25]); a = randInt(b + 1, 3 * b - 1); } while (gcd(a, b) !== 1);
  }
  const P = (a * 100) / b, dec = decOf(P);
  const slots = [];
  if (given !== "f") slots.push({ id: "fn", col: "f", want: String(a) }, { id: "fd", col: "f", want: String(b) });
  if (given !== "d") slots.push({ id: "d", col: "d", want: dec });
  if (given !== "p") slots.push({ id: "p", col: "p", want: String(P) });
  let hint = `${a}/${b} = ${a} : ${b} = ${dec} = ${P} %`;
  if (b !== 100 && level >= 2) hint += ` (${dec} son ${P} centésimas: ${P}/100 = ${a}/${b}, divido entre ${100 / b})`;
  else if (given === "p" && b !== 100) hint += ` (${P} % son ${P} de cada 100: ${P}/100 = ${a}/${b})`;
  if (P > 100) hint += `; más de un entero es más del 100 %`;
  return { a, b, P, dec, given, slots, hint };
}

export function mountTresformasGame(container, { client, onExit }) {
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
    <div class="game-body tf-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const onKey = (e) => {
    if (/^\d$/.test(e.key)) pressKey(e.key);
    else if (e.key === "," || e.key === ".") pressKey(",");
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
  };
  const slot = (id) => `<button type="button" class="tf-slot" data-slot="${round.slots.findIndex((s) => s.id === id)}"></button>`;

  // Cuadrícula de 100 por cada entero, con P casillas pintadas.
  function grids(P) {
    const n = Math.ceil(P / 100);
    return Array.from({ length: n }, (_, g) => {
      const fill = Math.min(100, P - 100 * g);
      const cells = Array.from({ length: 100 }, (_, i) => `<rect x="${(i % 10) * 8}" y="${Math.floor(i / 10) * 8}" width="8" height="8" class="${i < fill ? "tf-on" : ""}"/>`).join("");
      return `<svg class="tf-grid" viewBox="-1 -1 82 82">${cells}</svg>`;
    }).join("");
  }

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 2)));
    typed = round.slots.map(() => "");
    active = 0;
    busy = false;
    const { a, b, given } = round;
    const cell = {
      f: given === "f" ? `<span class="tf-frac"><span>${a}</span><span>${b}</span></span>` : `<span class="tf-frac">${slot("fn")}${slot("fd")}</span>`,
      d: given === "d" ? `<span class="tf-given">${round.dec}</span>` : slot("d"),
      p: given === "p" ? `<span class="tf-given">${round.P} %</span>` : `<span class="tf-pct">${slot("p")}<span>%</span></span>`,
    };
    body.innerHTML = `
      <p class="prompt tf-prompt">Completa la tabla</p>
      <div class="tf-sheet tf-cuaderno">
        <table class="tf-table">
          <thead><tr><th>Fracción</th><th>Decimal</th><th>Porcentaje</th></tr></thead>
          <tbody><tr><td>${cell.f}</td><td>${cell.d}</td><td>${cell.p}</td></tr></tbody>
        </table>
      </div>
      <div class="tf-grids" data-grids></div>
      <div class="keypad tf-keypad" data-keypad></div>
      <div class="feedback tf-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((s) => s.addEventListener("click", () => !busy && ((active = +s.dataset.slot), paint())));
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary tf-ok" : ""}`;
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
    paint();
  }

  function paint() {
    body.querySelectorAll("[data-slot]").forEach((s) => {
      const k = +s.dataset.slot;
      if (!busy) s.textContent = typed[k];
      s.classList.toggle("active", !busy && k === active);
    });
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return check();
    const t = typed[active], dec = round.slots[active].id === "d" || round.slots[active].id === "p";
    if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (key === ",") { if (dec && !t.includes(",")) typed[active] = (t || "0") + ","; }
    else if (t.length < 5) typed[active] = t + key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const missing = typed.indexOf("");
    if (missing >= 0) {
      const silent = typed[active] !== "";
      active = missing;
      paint();
      if (!silent) {
        feedback.textContent = "Faltan casillas por rellenar";
        feedback.className = "feedback bad tf-feedback";
      }
      return;
    }
    busy = true;
    rounds++;
    const { slots, P } = round;
    const ok = {};
    const fi = slots.findIndex((s) => s.id === "fn");
    if (fi >= 0) {
      const n = Number(typed[fi]), d = Number(typed[fi + 1]);
      const pair = d > 0 && n * 100 === P * d; // vale cualquier equivalente
      ok.fn = pair || typed[fi] === slots[fi].want;
      ok.fd = pair || typed[fi + 1] === slots[fi + 1].want;
    }
    slots.forEach((s, i) => s.col !== "f" && (ok[s.id] = Math.abs(parseCent(typed[i]) - (s.id === "d" ? P : P * 100)) < 1e-6));
    const allOk = slots.every((s) => ok[s.id]);
    body.querySelectorAll("[data-slot]").forEach((el) => {
      const k = +el.dataset.slot, s = slots[k];
      el.classList.add(ok[s.id] ? "good" : "bad");
      el.innerHTML = ok[s.id] ? typed[k] : `<s>${typed[k]}</s><i class="tf-fix">${s.want}</i>`;
    });
    paint();
    body.querySelector("[data-grids]").innerHTML = `${grids(P)}<span class="tf-glabel">${P} de cada 100</span>`;
    const text = `${round.a}/${round.b} = ${round.dec} = ${P} %`;
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok tf-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.innerHTML = `Era ${text}. 💡 ${round.hint} <button type="button" class="tf-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad tf-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 3000);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "tresformas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔁</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} tablas completadas de ${rounds}</p>
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
