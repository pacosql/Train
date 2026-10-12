// "Sistema de ecuaciones": el sistema escrito como en el libro, con su
// llave a la izquierda ({ x + y = 7 ; x − y = 1 }) y debajo las casillas
// "x = □   y = □". Se toca una casilla, se escribe con el teclado (con
// "− cambiar signo" para las soluciones negativas) y ✓. El 💡 lo resuelve
// por reducción (o por sustitución en el nivel 1) con los números de la
// ronda y termina con la comprobación en las dos ecuaciones.
import { randInt, pick, saveScore } from "./utils.js";

const M = "−";
const X = "<i>x</i>", Y = "<i>y</i>";
const neg = (n) => String(n).replace("-", M);
const par = (n) => (n < 0 ? `(${neg(n)})` : neg(n));
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const nz = (a, b) => { let v; do v = randInt(a, b); while (v === 0); return v; };
// a·x + b·y = c escrito como en el libro (1x → x, sin términos nulos).
function lin(a, b, c) {
  const t = [[a, X], [b, Y]].filter(([v]) => v !== 0);
  return t.map(([v, s], i) => (i ? (v < 0 ? ` ${M} ` : " + ") : v < 0 ? M : "") + (Math.abs(v) === 1 ? "" : Math.abs(v)) + s).join("") + ` = ${neg(c)}`;
}
// Sustituir números: "2 · 4 − 3" (comprobación).
function num(a, b, x, y) {
  const tx = a === 1 ? neg(x) : `${neg(a)} · ${par(x)}`;
  const ty = Math.abs(b) === 1 ? par(y) : `${Math.abs(b)} · ${par(y)}`;
  return `${tx} ${b < 0 ? M : "+"} ${ty}`;
}
// Despejar y en a·x + b·y = c sabiendo x: "4 + y = 7 → y = 3".
function backY(a, b, c, x, y, which) {
  const tx = a === 1 ? neg(x) : `${neg(a)} · ${par(x)}`;
  const ty = `${Math.abs(b) === 1 ? "" : Math.abs(b)}${Y}`;
  const by = `${b === 1 ? "" : b === -1 ? M : neg(b)}${Y}`;
  const rest = c - a * x;
  const step = b === 1 ? "" : ` → ${by} = ${neg(rest)}`;
  return `Sustituyo en la ${which}: ${tx} ${b < 0 ? M : "+"} ${ty} = ${neg(c)}${step} → ${Y} = ${neg(y)}`;
}
const checkTxt = (E, x, y) => `Compruebo: ${E.map(([a, b, c]) => `${num(a, b, x, y)} = ${neg(c)} ✓`).join(" y ")}`;

// Reducción eliminando la y: multiplico cada ecuación para igualar los
// coeficientes de y y sumo (signos opuestos) o resto (mismo signo).
function reduction(E, x, y) {
  const [[a1, b1, c1], [a2, b2, c2]] = E;
  const L = (Math.abs(b1) * Math.abs(b2)) / gcd(b1, b2);
  const m1 = L / Math.abs(b1), m2 = L / Math.abs(b2);
  const r1 = [a1 * m1, b1 * m1, c1 * m1], r2 = [a2 * m2, b2 * m2, c2 * m2];
  const steps = [];
  if (m1 > 1 && m2 > 1) steps.push(`Multiplico la 1ª por ${m1} y la 2ª por ${m2}: ${lin(...r1)} ; ${lin(...r2)}`);
  else if (m1 > 1) steps.push(`Multiplico la 1ª por ${m1}: ${lin(...r1)}`);
  else if (m2 > 1) steps.push(`Multiplico la 2ª por ${m2}: ${lin(...r2)}`);
  let k, rhs;
  if (b1 * b2 < 0) { k = r1[0] + r2[0]; rhs = r1[2] + r2[2]; steps.push(`Sumo las dos (las ${Y} se van): ${neg(k)}${X} = ${neg(rhs)}`); }
  else if (r1[0] >= r2[0]) { k = r1[0] - r2[0]; rhs = r1[2] - r2[2]; steps.push(`Resto la 2ª a la 1ª (las ${Y} se van): ${k === 1 ? "" : neg(k)}${X} = ${neg(rhs)}`); }
  else { k = r2[0] - r1[0]; rhs = r2[2] - r1[2]; steps.push(`Resto la 1ª a la 2ª (las ${Y} se van): ${k === 1 ? "" : neg(k)}${X} = ${neg(rhs)}`); }
  steps[steps.length - 1] += k === 1 ? "" : ` → ${X} = ${neg(x)}`;
  // Para hallar y, la ecuación con el coeficiente de y más sencillo.
  steps.push(Math.abs(b2) < Math.abs(b1) ? backY(a2, b2, c2, x, y, "2ª") : backY(a1, b1, c1, x, y, "1ª"));
  return steps;
}

// Niveles: 0 sumar directamente (las y ya son opuestas) · 1 sustitución
// sencilla (y = 2x, y = x + 3) · 2 reducción multiplicando una ecuación ·
// 3 coeficientes mayores (se multiplican las dos) · 4 soluciones negativas.
export function buildRound(level) {
  let x, y, E, steps, method;
  for (;;) {
    if (level === 0) {
      x = randInt(2, 12); y = randInt(1, x - 1);
      const a1 = pick([1, 1, 2]), a2 = pick([1, 1, 2]);
      E = [[a1, 1, a1 * x + y], [a2, -1, a2 * x - y]];
      if (Math.random() < 0.4) E.reverse();
      steps = reduction(E, x, y);
      method = "reducción";
    } else if (level === 1) {
      x = randInt(1, 9);
      const a = pick([1, 1, 2, 3]), b = pick([1, 1, 2]);
      const kind = pick(["k", "k", "+"]), k = kind === "k" ? randInt(2, 4) : randInt(1, 9);
      y = kind === "k" ? k * x : x + k;
      const sub = kind === "k" ? `${k}${X}` : `${X} + ${k}`;
      E = [kind === "k" ? [-k, 1, 0] : [-1, 1, k], [a, b, a * x + b * y]];
      if (E[1][2] > 60) continue;
      const rowsTop = `${Y} = ${sub}`;
      const into = `${a === 1 ? "" : a}${X} + ${b === 1 ? (kind === "k" ? sub : sub) : `${b} · (${sub})`} = ${E[1][2]}`;
      const coef = kind === "k" ? a + b * k : a + b;
      const rhs = kind === "k" ? E[1][2] : E[1][2] - b * k;
      steps = [
        `Sustituyo ${Y} = ${sub} en la 2ª: ${into}` + (kind === "+" ? ` → ${coef}${X} + ${b * k} = ${E[1][2]}` : ""),
        `${coef}${X} = ${rhs} → ${X} = ${x}`,
        `Entonces ${Y} = ${kind === "k" ? `${k} · ${x}` : `${x} + ${k}`} = ${y}`,
      ];
      E.top = rowsTop;
      E.chk = `Compruebo: ${y} = ${kind === "k" ? `${k} · ${x}` : `${x} + ${k}`} ✓ y ${num(a, b, x, y)} = ${E[1][2]} ✓`;
      method = "sustitución";
    } else {
      const big = level === 3 || (level === 4 && Math.random() < 0.5);
      if (level === 4) { do { x = nz(-9, 9); y = nz(-9, 9); } while (x > 0 && y > 0); }
      else { x = randInt(1, 9); y = randInt(1, 9); }
      const a1 = randInt(big ? 2 : 1, big ? 7 : 4), a2 = randInt(big ? 2 : 1, big ? 7 : 5);
      const b1 = (big ? randInt(2, 5) : randInt(2, 3)) * pick([1, -1]);
      const b2 = (big ? randInt(2, 5) : 1) * pick([1, -1]);
      if (a1 === a2 || a1 * b2 - a2 * b1 === 0 || (big && (Math.abs(b1) === Math.abs(b2) || Math.abs(b1) % Math.abs(b2) === 0 || Math.abs(b2) % Math.abs(b1) === 0))) continue;
      E = [[a1, b1, a1 * x + b1 * y], [a2, b2, a2 * x + b2 * y]];
      if (Math.abs(E[0][2]) > 60 || Math.abs(E[1][2]) > 60) continue;
      steps = reduction(E, x, y);
      method = "reducción";
    }
    break;
  }
  const rows = [E.top || lin(...E[0]), lin(...E[1])];
  const hint = `${steps.join("<br>")}<br>${E.chk || checkTxt(E, x, y)}`;
  return { level, E, x, y, rows, method, hint, answers: [x, y], neg: x < 0 || y < 0 };
}

export function mountSistemaGame(container, { client, onExit }) {
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
    <div class="game-body si-body" data-body></div>
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
    const last = round && round.rows.join();
    do round = buildRound(Math.min(4, Math.floor(hits / 2))); while (round.rows.join() === last);
    typed = ["", ""];
    active = 0;
    busy = false;
    body.innerHTML = `
      <p class="prompt si-prompt">Resuelve el sistema</p>
      <div class="si-cuaderno">
        <div class="si-sys" data-sys>
          <svg class="si-brace" viewBox="0 0 20 80" preserveAspectRatio="none" aria-hidden="true"><path d="M18 2 C11 2 10 5 10 12 L10 32 C10 37 7 40 2 40 C7 40 10 43 10 48 L10 68 C10 75 11 78 18 78" vector-effect="non-scaling-stroke"/></svg>
          <div class="si-eqs"><div>${round.rows[0]}</div><div>${round.rows[1]}</div></div>
        </div>
        <div class="si-sol">${X} = <button type="button" class="si-slot" data-slot="0"></button>
          <span class="si-gap"></span>${Y} = <button type="button" class="si-slot" data-slot="1"></button></div>
      </div>
      <div class="keypad si-keypad" data-keypad></div>
      <button type="button" class="choice-btn keypad-sign si-sign" data-sign>${M} cambiar signo</button>
      <div class="feedback si-feedback" data-feedback></div>
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
    else if (t.replace("-", "").length < 3) typed[active] = t + key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    if (!typed.every(filled)) {
      // ✓ con la x escrita salta a la y (como un Enter); si no, avisa.
      if (filled(typed[active])) { active = typed.findIndex((t) => !filled(t)); return paint(); }
      feedback.textContent = "Escribe un número en la casilla";
      feedback.className = "feedback bad si-feedback";
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
      if (!good) s.innerHTML = `<s>${neg(typed[i])}</s><span class="si-want">${neg(want)}</span>`;
    });
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.innerHTML = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok si-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      // ¿Cumple al menos una ecuación? Se le dice cuál falla.
      const tx = Number(typed[0]), ty = Number(typed[1]);
      const bad = round.E.map(([a, b, c], k) => (a * tx + b * ty !== c ? k + 1 : 0)).filter(Boolean);
      const why = bad.length === 1 ? `${X} = ${neg(tx)}, ${Y} = ${neg(ty)} cumple una ecuación pero no la ${bad[0]}ª. ` : "";
      const after = () => (lives <= 0 ? finish(false) : nextRound());
      feedback.innerHTML = `${why}💡 ${round.hint} <button type="button" class="si-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad si-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", () => { clearTimeout(pending); after(); });
      pending = setTimeout(after, 4000); // el 💡 lleva la resolución entera: más tiempo para leerlo
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
    else if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "Tab") { active = 1 - active; paint(); }
    else return;
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
    saveScore(client, "sistema", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧮</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} sistemas resueltos de ${rounds}</p>
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
