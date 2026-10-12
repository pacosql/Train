// "Problemas de edades": el enunciado del libro ("Ana tiene 12 años y su
// madre 40. ¿Dentro de cuántos años la madre tendrá el doble?") con la
// tabla de siempre: Hoy | Dentro de x años (Ana: 12 | 12 + x; madre:
// 40 | 40 + x). Se escribe x (o, en los de dos incógnitas, las dos edades)
// con el teclado; al comprobar, la tabla se completa con los números. El 💡
// plantea la ecuación y la resuelve: "40 + x = 2 · (12 + x) → x = 16".
import { randInt, pick, saveScore } from "./utils.js";

const M = "−";
const X = "<i>x</i>";
const KW = { 2: "el doble", 3: "el triple", 4: "el cuádruple", 5: "el quíntuple" };
const KIDS = [["Ana", "f"], ["Luis", "m"], ["Marta", "f"], ["Pablo", "m"], ["Lucía", "f"], ["Hugo", "m"], ["Sara", "f"], ["Leo", "m"]];
const kx = (k) => `${k === 1 ? "" : k}${X}`;

// Hoy c y m; t = +1 "dentro de x años", −1 "hace x años"; k veces.
function ratio(level) {
  for (;;) {
    const fut = level === 0 ? Math.random() < 0.6 : Math.random() < 0.5;
    const k = fut ? (level === 0 ? 2 : pick([2, 3, 3, 4])) : (level === 0 ? pick([3, 4]) : pick([3, 4, 5])), x = randInt(1, 20), c = randInt(2, 30);
    const m = fut ? k * (c + x) - x : k * (c - x) + x;
    if (m - c < 20 || m - c > 42 || (!fut && c - x < 1)) continue;
    return { fut, k, x, c, m };
  }
}

// Niveles: 0 "dentro de / hace x años" (el doble; el triple o más si es
// "hace", que con el doble saldrían edades raras) · 1 suma de edades ·
// 2 el triple, el cuádruple… · 3 dos incógnitas (triple y suman, o "tiene
// 28 más") · 4 dos incógnitas con "dentro de N años" (y repaso).
export function buildRound(level) {
  const [kid, g] = pick(KIDS), [adult, ga] = pick([["su madre", "f"], ["su padre", "m"]]);
  const Adult = adult.replace("su ", ""), Cap = Adult === "madre" ? "Madre" : "Padre", The = `${Adult === "madre" ? "La madre" : "El padre"} de ${kid}`, pron = g === "f" ? "ella" : "él";
  const both = g === "f" && ga === "f" ? "las dos" : "los dos", each = g === "f" && ga === "f" ? "cada una" : "cada uno";
  const lv = level >= 4 ? pick([4, 4, 3, 2, 1]) : level;
  let text, cols, rows, answers, names, steps, check;
  if (lv === 0 || lv === 2) {
    const { fut, k, x, c, m } = ratio(lv);
    const s = fut ? "+" : M, col = fut ? `Dentro de ${X} años` : `Hace ${X} años`;
    text = `${kid} tiene ${c} años y ${adult} ${m}. ¿${fut ? "Dentro de cuántos años" : "Hace cuántos años"} ${Adult === "madre" ? "la madre" : "el padre"} ${fut ? "tendrá" : "tenía"} ${KW[k]} de la edad de ${kid}?`;
    cols = ["Hoy", col];
    rows = [[kid, [c], [`${c} ${s} ${X}`, c + (fut ? x : -x)]], [Cap, [m], [`${m} ${s} ${X}`, m + (fut ? x : -x)]]];
    const kc = k * c;
    steps = fut
      ? `${m} + ${X} = ${k} · (${c} + ${X}) → ${m} + ${X} = ${kc} + ${kx(k)} → ${m} ${M} ${kc} = ${kx(k)} ${M} ${X} → ${m - kc} = ${kx(k - 1)} → ${X} = ${x}`
      : `${m} ${M} ${X} = ${k} · (${c} ${M} ${X}) → ${m} ${M} ${X} = ${kc} ${M} ${kx(k)} → ${kx(k)} ${M} ${X} = ${kc} ${M} ${m} → ${kx(k - 1)} = ${kc - m}${k > 2 ? ` → ${X} = ${x}` : ""}`;
    const a = c + (fut ? x : -x), b = m + (fut ? x : -x);
    check = `${fut ? `dentro de ${x}` : `hace ${x}`} años, ${kid} ${fut ? "tendrá" : "tenía"} ${a} y ${adult} ${b} = ${k} · ${a} ✓`;
    answers = [x]; names = [`${X} =`];
  } else if (lv === 1) {
    let fut, x, c, m, T;
    do { fut = Math.random() < 0.6; x = randInt(1, 20); c = randInt(2, 30); m = c + randInt(20, 40); T = c + m + (fut ? 2 * x : -2 * x); } while (!fut && c - x < 1);
    const s = fut ? "+" : M;
    text = `${kid} tiene ${c} años y ${adult} ${m}. ¿${fut ? "Dentro de cuántos años sus edades sumarán" : "Hace cuántos años sus edades sumaban"} ${T}?`;
    cols = ["Hoy", fut ? `Dentro de ${X} años` : `Hace ${X} años`];
    rows = [[kid, [c], [`${c} ${s} ${X}`, c + (fut ? x : -x)]], [Cap, [m], [`${m} ${s} ${X}`, m + (fut ? x : -x)]]];
    steps = fut
      ? `(${c} + ${X}) + (${m} + ${X}) = ${T} → ${c + m} + 2${X} = ${T} → 2${X} = ${T - c - m} → ${X} = ${x}`
      : `(${c} ${M} ${X}) + (${m} ${M} ${X}) = ${T} → ${c + m} ${M} 2${X} = ${T} → 2${X} = ${c + m} ${M} ${T} = ${c + m - T} → ${X} = ${x}`;
    check = `${fut ? `dentro de ${x}` : `hace ${x}`} años, ${c + (fut ? x : -x)} + ${m + (fut ? x : -x)} = ${T} ✓`;
    answers = [x]; names = [`${X} =`];
  } else if (lv === 3) {
    let x, k, d, T;
    const mult = Math.random() < 0.55;
    do { x = randInt(3, 25); k = randInt(2, 4); d = randInt(20, 40); } while (mult && ((k - 1) * x < 20 || (k - 1) * x > 42));
    const m = mult ? k * x : x + d;
    T = x + m;
    text = mult
      ? `${The} tiene ${KW[k]} de edad que ${pron}, y entre ${both} suman ${T} años. ¿Qué edad tiene ${each}?`
      : `${The} tiene ${d} años más que ${pron}, y entre ${both} suman ${T} años. ¿Qué edad tiene ${each}?`;
    cols = ["Hoy"];
    rows = [[kid, [X, x]], [Cap, [mult ? kx(k) : `${X} + ${d}`, m]]];
    steps = mult ? `${X} + ${kx(k)} = ${T} → ${kx(k + 1)} = ${T} → ${X} = ${x}` : `${X} + (${X} + ${d}) = ${T} → 2${X} + ${d} = ${T} → 2${X} = ${T - d} → ${X} = ${x}`;
    check = `${kid} ${x} y ${Adult} ${m}: ${x} + ${m} = ${T} ✓${mult ? ` y ${m} = ${k} · ${x} ✓` : ""}`;
    answers = [x, m]; names = [`${kid}:`, `${Cap}:`];
  } else {
    let k1, k2, N, x;
    do { k1 = pick([3, 4, 5]); k2 = pick([2, 3]); N = randInt(2, 20); x = ((k2 - 1) * N) / (k1 - k2); } while (k2 >= k1 || !Number.isInteger(x) || x < 3 || (k1 - 1) * x < 20 || (k1 - 1) * x > 42);
    const m = k1 * x;
    text = `${The} tiene ${KW[k1]} de edad que ${pron}. Dentro de ${N} años tendrá ${KW[k2]}. ¿Qué edad tiene ${each} hoy?`;
    cols = ["Hoy", `Dentro de ${N} años`];
    rows = [[kid, [X, x], [`${X} + ${N}`, x + N]], [Cap, [kx(k1), m], [`${kx(k1)} + ${N}`, m + N]]];
    steps = `${kx(k1)} + ${N} = ${k2} · (${X} + ${N}) → ${kx(k1)} + ${N} = ${kx(k2)} + ${k2 * N} → ${kx(k1)} ${M} ${kx(k2)} = ${k2 * N} ${M} ${N} → ${kx(k1 - k2)} = ${(k2 - 1) * N}${k1 - k2 > 1 ? ` → ${X} = ${x}` : ""}`;
    check = `hoy ${x} y ${m}; dentro de ${N} años, ${x + N} y ${m + N} = ${k2} · ${x + N} ✓`;
    answers = [x, m]; names = [`${kid}:`, `${Cap}:`];
  }
  const hint = `${steps}. Compruebo: ${check}`;
  return { level: lv, text, cols, rows, answers, names, hint };
}

export function mountEdadesGame(container, { client, onExit }) {
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
    <div class="game-body ed-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  // La tabla del cuaderno; con solved, cada expresión lleva "= número".
  function table(solved) {
    const cell = ([e, v]) => `<td>${e}${solved && v !== undefined ? ` <b class="ed-val">= ${v}</b>` : ""}</td>`;
    return `<table class="ed-table"><tr><th></th>${round.cols.map((c) => `<th>${c}</th>`).join("")}</tr>${round.rows
      .map(([who, ...cells]) => `<tr><th>${who}</th>${cells.map(cell).join("")}</tr>`)
      .join("")}</table>`;
  }

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    const last = round && round.text;
    do round = buildRound(Math.min(4, Math.floor(hits / 2))); while (round.text === last);
    typed = round.answers.map(() => "");
    active = 0;
    busy = false;
    body.innerHTML = `
      <p class="prompt ed-prompt">Problema de edades</p>
      <div class="ed-cuaderno">
        <p class="ed-text">${round.text}</p>
        <div data-table>${table(false)}</div>
        <div class="ed-sol">${round.names.map((n, i) => `<span class="ed-pair">${n} <button type="button" class="ed-slot" data-slot="${i}"></button> años</span>`).join("")}</div>
      </div>
      <div class="keypad ed-keypad" data-keypad></div>
      <div class="feedback ed-feedback" data-feedback></div>
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

  function pressKey(key) {
    if (finished || busy) return;
    const t = typed[active];
    if (key === "✓") return check();
    if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (t.length < 3) typed[active] = t + key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    if (!typed.every((t) => t !== "")) {
      if (typed[active] !== "") { active = typed.findIndex((t) => t === ""); return paint(); }
      feedback.textContent = "Escribe un número en la casilla";
      feedback.className = "feedback bad ed-feedback";
      return;
    }
    busy = true;
    rounds++;
    let ok = true;
    body.querySelectorAll("[data-slot]").forEach((s) => {
      const i = +s.dataset.slot, want = round.answers[i];
      const good = Number(typed[i]) === want;
      ok = ok && good;
      s.classList.remove("active");
      s.classList.add(good ? "good" : "bad");
      if (!good) s.innerHTML = `<s>${typed[i]}</s><span class="ed-want">${want}</span>`;
    });
    body.querySelector("[data-table]").innerHTML = table(true);
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.innerHTML = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok ed-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const after = () => (lives <= 0 ? finish(false) : nextRound());
      feedback.innerHTML = `💡 ${round.hint} <button type="button" class="ed-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad ed-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", () => { clearTimeout(pending); after(); });
      pending = setTimeout(after, 4000); // el 💡 lleva planteamiento, resolución y comprobación
    }
  }

  // Teclado físico: cifras, ⌫, Enter y flechas.
  function onKey(e) {
    if (finished || !round) return;
    if (busy) {
      if (e.key === "Enter") body.querySelector("[data-next]")?.click();
      return;
    }
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
    else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      active = (active + 1) % typed.length;
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
    saveScore(client, "edades", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎂</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} problemas resueltos de ${rounds}</p>
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
