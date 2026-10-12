// "Ecuación de segundo grado": la resolución escrita como en el libro, con
// casillas. Completas: "x² − 5x + 6 = 0" → a = □, b = □, c = □ → Δ = b² − 4ac
// = □ → x = (−b ± √Δ)/2a → x₁ = □, x₂ = □ (la mayor primero). Desde el
// nivel 3 hay un botón "No tiene solución real" para cuando Δ < 0 (está
// siempre, para no chivarlo). Incompletas (nivel 0): "x² − 9 = 0 → x² = □
// → x = ±□" y "x² − 4x = 0 → x · (x − □) = 0 → x = 0 o x = □". El 💡
// repite los pasos con los números de la ronda.
import { randInt, pick, saveScore } from "./utils.js";

const M = "−";
const X = "<i>x</i>";
const neg = (n) => String(n).replace("-", M);
const par = (n) => (n < 0 ? `(${neg(n)})` : neg(n));
const nz = (a, b) => { let v; do v = randInt(a, b); while (v === 0); return v; };
const frac = (n, d) => `<span class="s2-frac"><span>${n}</span><span>${d}</span></span>`;
// a·x² + b·x + c escrito como en el libro (1x² → x², sin términos nulos).
function eq(a, b, c) {
  const t = [[a, `${X}<sup>2</sup>`], [b, X], [c, ""]].filter(([v]) => v !== 0);
  return t.map(([v, s], i) => (i ? (v < 0 ? ` ${M} ` : " + ") : v < 0 ? M : "") + (Math.abs(v) === 1 && s ? "" : Math.abs(v)) + s).join("") + " = 0";
}

function complete(level) {
  let a, b, c, r1 = null, r2 = null;
  const none = (level === 3 && Math.random() < 0.35) || (level >= 4 && Math.random() < 0.3);
  for (;;) {
    if (none) {
      a = level >= 4 ? pick([1, 2, 3]) : 1;
      b = nz(-9, 9);
      c = Math.floor((b * b) / (4 * a)) + randInt(1, 10);
    } else {
      a = level >= 4 ? pick([2, 3, 2, -1, 4]) : 1;
      const dbl = level >= 2 && Math.random() < 0.25;
      r1 = nz(level === 1 ? -9 : -12, level === 1 ? 9 : 12);
      r2 = dbl ? r1 : nz(-12, 12);
      if (r1 < r2) [r1, r2] = [r2, r1];
      b = -a * (r1 + r2);
      c = a * r1 * r2;
      if (level === 1 && r1 === r2) continue;
    }
    if (b === 0 || c === 0 || Math.abs(b) > 40 || Math.abs(c) > 99 || b * b - 4 * a * c > 900) continue;
    break;
  }
  const D = b * b - 4 * a * c, q = 4 * a * c;
  const dText = `Δ = ${par(b)}<sup>2</sup> ${M} 4 · ${par(a)} · ${par(c)} = ${b * b} ${q < 0 ? "+" : M} ${Math.abs(q)} = ${neg(D)}`;
  const head = `<i>a</i> = ${neg(a)}, <i>b</i> = ${neg(b)}, <i>c</i> = ${neg(c)}; ${dText}`;
  let hint, formula;
  if (D < 0) {
    hint = `${head} < 0: no hay raíz cuadrada de un número negativo → no tiene solución real`;
    formula = `${X} = ${frac(`${neg(-b)} ± √(${neg(D)})`, neg(2 * a))} → ∄`;
  } else {
    const s = Math.sqrt(D);
    formula = `${X} = ${frac(`${neg(-b)} ± √${D}`, neg(2 * a))} = ${frac(`${neg(-b)} ± ${s}`, neg(2 * a))}`;
    hint = D === 0
      ? `${head} → solución doble: ${X} = ${neg(-b)}/${par(2 * a)} = ${neg(r1)}, así que ${X}₁ = ${X}₂ = ${neg(r1)}`
      : `${head} → ${X} = (${neg(-b)} ± ${s})/${par(2 * a)} → ${X}₁ = ${neg(r1)}, ${X}₂ = ${neg(r2)} (la mayor primero)`;
  }
  const rows = [
    `<div class="s2-eq">${eq(a, b, c)}</div>`,
    `<div class="s2-row"><i>a</i> = [0] &nbsp; <i>b</i> = [1] &nbsp; <i>c</i> = [2]</div>`,
    `<div class="s2-row">Δ = <i>b</i><sup>2</sup> ${M} 4<i>ac</i> = [3]</div>`,
    `<div class="s2-row s2-formula" data-formula>${X} = ${frac(`${M}<i>b</i> ± √Δ`, "2<i>a</i>")}</div>`,
    `<div class="s2-row">${X}₁ = [4] &nbsp; ${X}₂ = [5]</div>`,
  ];
  return { level, kind: "completa", a, b, c, D, none: D < 0, rows, formula, hint, answers: [a, b, c, D, r1, r2] };
}

// Niveles: 0 incompletas · 1 completas con raíces enteras · 2 también Δ = 0
// (solución doble) · 3 también Δ < 0 (botón "No tiene solución") ·
// 4 con a ≠ 1.
export function buildRound(level) {
  if (level > 0) return complete(level);
  if (Math.random() < 0.5) {
    const a = pick([1, 1, 1, 2, 3]), k = randInt(1, a === 1 ? 12 : 9);
    const hint = `Paso el ${a * k * k} al otro lado${a > 1 ? ` y divido entre ${a}` : ""}: ${X}<sup>2</sup> = ${k * k} → ${X} = ±√${k * k} = ±${k}`;
    return { level, kind: "pura", a, b: 0, c: -a * k * k, none: false, hint, answers: [k * k, k],
      rows: [`<div class="s2-eq">${eq(a, 0, -a * k * k)}</div>`, `<div class="s2-row">${X}<sup>2</sup> = [0]</div>`, `<div class="s2-row">${X} = ±[1]</div>`] };
  }
  const r = randInt(1, 12), s = pick([1, -1]); // x² − r·x (s = 1) o x² + r·x (s = −1)
  const sign = s > 0 ? M : "+";
  const hint = `Saco ${X} factor común: ${X} · (${X} ${sign} ${r}) = 0 → o ${X} = 0, o ${X} ${sign} ${r} = 0 → ${X} = ${neg(s * r)}`;
  return { level, kind: "factor", a: 1, b: -s * r, c: 0, none: false, hint, answers: [r, s * r],
    rows: [`<div class="s2-eq">${eq(1, -s * r, 0)}</div>`, `<div class="s2-row">${X} · (${X} ${sign} [0]) = 0</div>`, `<div class="s2-row">${X} = 0 &nbsp;o&nbsp; ${X} = [1]</div>`] };
}

export function mountSegundogradoGame(container, { client, onExit }) {
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
    <div class="game-body s2-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const filled = (v) => v !== "" && v !== "-";

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    const last = round && round.rows[0];
    do round = buildRound(Math.min(4, Math.floor(hits / 3))); while (round.rows[0] === last);
    typed = round.answers.map(() => "");
    active = 0;
    busy = false;
    body.innerHTML = `
      <p class="prompt s2-prompt">${round.kind === "completa" ? "Resuélvela con la fórmula" : "Resuelve la ecuación incompleta"}</p>
      <div class="s2-cuaderno">
        ${round.rows.join("").replace(/\[(\d+)\]/g, (_, k) => `<button type="button" class="s2-slot" data-slot="${k}"></button>`)}
        ${round.kind === "completa" && round.level >= 3 ? `<button type="button" class="s2-none" data-none>∄ No tiene solución real</button>` : ""}
      </div>
      <div class="keypad s2-keypad" data-keypad></div>
      <button type="button" class="choice-btn keypad-sign s2-sign" data-sign>${M} cambiar signo</button>
      <div class="feedback s2-feedback" data-feedback></div>
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
    body.querySelector("[data-none]")?.addEventListener("click", () => !busy && !finished && check(true));
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
    if (key === "✓") return check(false);
    if (key === "±") typed[active] = t.startsWith("-") ? t.slice(1) : "-" + t;
    else if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (t.replace("-", "").length < 4) typed[active] = t + key;
    paint();
  }

  // saysNone = se ha pulsado "No tiene solución real" (solo mira a, b, c y Δ).
  function check(saysNone) {
    const feedback = body.querySelector("[data-feedback]");
    const need = saysNone ? [0, 1, 2, 3] : typed.map((_, k) => k);
    if (!need.every((k) => filled(typed[k]))) {
      if (filled(typed[active]) || saysNone) {
        const order = typed.map((_, k) => (active + 1 + k) % typed.length).filter((k) => need.includes(k));
        active = order.find((k) => !filled(typed[k]));
        paint();
        if (!saysNone) return;
      }
      feedback.textContent = saysNone ? "Primero escribe a, b, c y Δ" : "Escribe un número en la casilla";
      feedback.className = "feedback bad s2-feedback";
      return;
    }
    busy = true;
    rounds++;
    let ok = saysNone === round.none;
    body.querySelectorAll("[data-slot]").forEach((s) => {
      const i = +s.dataset.slot, want = round.answers[i];
      s.classList.remove("active");
      if (want === null && saysNone) return s.classList.add("s2-off"); // x₁, x₂ no existen
      const good = filled(typed[i]) && Number(typed[i]) === want;
      ok = ok && good;
      s.classList.add(good ? "good" : "bad");
      if (!good) s.innerHTML = `<s>${neg(typed[i]) || "·"}</s><span class="s2-want">${want === null ? "∄" : neg(want)}</span>`;
    });
    if (round.formula) body.querySelector("[data-formula]").innerHTML = round.formula;
    body.querySelector("[data-none]")?.classList.add(round.none ? "good" : "s2-off");
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.innerHTML = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok s2-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const why = saysNone && !round.none ? `Δ = ${neg(round.D)} no es negativo: sí tiene solución. ` : !saysNone && round.none ? "Con Δ negativo no hay soluciones: tocaba el botón ∄. " : "";
      const after = () => (lives <= 0 ? finish(false) : nextRound());
      feedback.innerHTML = `${why}💡 ${round.hint} <button type="button" class="s2-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad s2-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", () => { clearTimeout(pending); after(); });
      pending = setTimeout(after, 4000); // el 💡 de la fórmula es largo: más tiempo para leerlo
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
    saveScore(client, "segundogrado", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📐</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} ecuaciones resueltas de ${rounds}</p>
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
