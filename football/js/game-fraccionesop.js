// "Opera con fracciones": la operación escrita como en el cuaderno de
// 5.º-2.º ESO, "3/4 + 5/6 = □/□", con el paso intermedio a la vista en los
// niveles bajos ("= 9/12 + 10/12 = □/□"). Se rellena numerador y luego
// denominador con el teclado. Vale cualquier fracción equivalente a la
// correcta (sin simplificar o simplificada); el 💡 enseña los pasos y la
// simplificada. Producto "·" en línea y división ":" en cruz.
import { randInt, pick, saveScore } from "./utils.js";

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a * b) / gcd(a, b);
const simp = (n, d) => { const g = gcd(n, d); return [n / g, d / g]; };
// "= 19/12" o, si se puede, "= 18/12 = 3/2 simplificando (÷ 6)" o "= 8/4 = 2"
function tail(n, d) {
  const [a, b] = simp(n, d), g = n / a;
  if (g === 1) return `${n}/${d}`;
  return `${n}/${d} = ${b === 1 ? a : `${a}/${b}`} simplificando (÷ ${g})`;
}

// Niveles: 0 + − mismo denominador · 1 distinto denominador con paso intermedio ·
// 2 producto · 3 división · 4 con un número entero (2 + 3/4, 3 − 2/5, 3 · 2/7).
export function buildRound(level) {
  let text, step = "", N, D, hint;
  const op = level <= 1 || level === 4 ? pick(["+", "−", ...(level === 4 ? ["·"] : [])]) : level === 2 ? "·" : ":";
  if (level === 0) {
    const d = randInt(3, 12);
    let a = randInt(1, d - 1), b = randInt(1, d - 1);
    if (op === "−") { if (a === b) b = a === 1 ? 2 : a - 1; if (a < b) [a, b] = [b, a]; if (a === b) return buildRound(level); }
    N = op === "+" ? a + b : a - b; D = d;
    text = `${a}/${d} ${op} ${b}/${d}`;
    hint = `Mismo denominador: ${op === "+" ? "sumo" : "resto"} los numeradores y dejo el ${d}: ${a} ${op} ${b} = ${N} → ${tail(N, D)}`;
  } else if (level === 1) {
    let d1, d2, m;
    do { d1 = randInt(2, 9); d2 = randInt(2, 9); m = lcm(d1, d2); } while (d1 === d2 || m > 36);
    let a, b;
    do { a = randInt(1, d1 - 1); b = randInt(1, d2 - 1); } while (gcd(a, d1) !== 1 || gcd(b, d2) !== 1 || (op === "−" && a * m / d1 <= b * m / d2));
    const A = (a * m) / d1, B = (b * m) / d2;
    N = op === "+" ? A + B : A - B; D = m;
    text = `${a}/${d1} ${op} ${b}/${d2}`;
    step = `${A}/${m} ${op} ${B}/${m}`;
    hint = `m.c.m.(${d1}, ${d2}) = ${m}: ${a}/${d1} = ${A}/${m} y ${b}/${d2} = ${B}/${m}; ${A} ${op} ${B} = ${N} → ${tail(N, D)}`;
  } else if (level === 2 || level === 3) {
    const a = randInt(1, 9), b = randInt(2, 9), c = randInt(1, 9), d = randInt(2, 9);
    if (a === b || c === d || gcd(a, b) !== 1 || gcd(c, d) !== 1) return buildRound(level);
    text = `${a}/${b} ${op} ${c}/${d}`;
    if (op === "·") {
      N = a * c; D = b * d;
      hint = `Multiplico en línea: arriba ${a} · ${c} = ${N}, abajo ${b} · ${d} = ${D} → ${tail(N, D)}`;
    } else {
      N = a * d; D = b * c;
      hint = `Divido en cruz: ${a} · ${d} = ${N} arriba y ${b} · ${c} = ${D} abajo → ${tail(N, D)}`;
    }
  } else {
    const w = randInt(1, 5), d = randInt(2, 9);
    let a = randInt(1, d - 1);
    if (gcd(a, d) !== 1) return buildRound(level);
    if (op === "·") {
      if (w === 1) return buildRound(level);
      N = w * a; D = d;
      text = `${w} · ${a}/${d}`;
      hint = `El entero multiplica solo al numerador (${w} = ${w}/1): ${w} · ${a} = ${N} → ${tail(N, D)}`;
    } else {
      N = op === "+" ? w * d + a : w * d - a; D = d;
      text = `${w} ${op} ${a}/${d}`;
      hint = `${w} = ${w * d}/${d} (cada entero son ${d}/${d}): ${w * d} ${op} ${a} = ${N} → ${tail(N, D)}`;
    }
  }
  return { level, op, text, step, N, D, simple: simp(N, D), hint };
}

// ¿La respuesta escrita vale lo mismo que N/D? (sin simplificar o simplificada)
export const accepts = (r, n, d) => d > 0 && n * r.D === r.N * d;

export function mountFraccionesopGame(container, { client, onExit }) {
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
    <div class="game-body fo-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  // "3/4 + 2" → fracciones apiladas, enteros y signos tal cual
  const pretty = (t) => t.split(" ").map((p) => (p.includes("/") ? `<span class="fo-frac"><span>${p.split("/")[0]}</span><span>${p.split("/")[1]}</span></span>` : /\d/.test(p) ? `<span class="fo-int">${p}</span>` : `<span class="fo-op">${p}</span>`)).join("");

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    const last = round && round.text;
    do round = buildRound(Math.min(4, Math.floor(hits / 3))); while (round.text === last);
    typed = { n: "", d: "" };
    active = "n";
    busy = false;
    body.innerHTML = `
      <p class="prompt fo-prompt">${{ "+": "Suma", "−": "Resta", "·": "Multiplica", ":": "Divide" }[round.op]}</p>
      <div class="fo-cuaderno">
        <div class="fo-row">${pretty(round.text)}<span class="fo-op">=</span>${round.step ? `${pretty(round.step)}<span class="fo-op">=</span>` : ""}<span class="fo-frac fo-ans"><button type="button" class="fo-slot" data-slot="n" aria-label="numerador"></button><button type="button" class="fo-slot" data-slot="d" aria-label="denominador"></button></span></div>
        <div class="fo-after" data-after></div>
      </div>
      <div class="keypad fo-keypad" data-keypad></div>
      <div class="feedback fo-feedback" data-feedback></div>`;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = b.dataset.slot), paint())));
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
      b.textContent = typed[b.dataset.slot];
      b.classList.toggle("active", b.dataset.slot === active);
    });
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    if (key === "⌫") typed[active] = typed[active].slice(0, -1);
    else if (typed[active].length < 3) {
      typed[active] += key;
      if (typed[active].length === 3 && active === "n" && typed.d === "") active = "d";
    }
    paint();
  }

  function check() {
    if (finished || busy) return;
    const feedback = body.querySelector("[data-feedback]");
    // ✓ con una casilla vacía: el foco pasa a ella (numerador → denominador)
    const empty = ["n", "d"].find((k) => typed[k] === "");
    if (empty) {
      active = empty;
      paint();
      if (empty === "n" || typed.n === "") { feedback.textContent = "Escribe el numerador y el denominador"; feedback.className = "feedback bad"; }
      return;
    }
    busy = true;
    rounds++;
    const n = Number(typed.n), d = Number(typed.d);
    const ok = accepts(round, n, d);
    const [sn, sd] = round.simple;
    body.querySelectorAll("[data-slot]").forEach((s) => {
      const k = s.dataset.slot, want = k === "n" ? round.N : round.D;
      s.classList.remove("active");
      s.classList.add(ok ? "good" : "bad");
      if (!ok) s.innerHTML = `<s>${typed[k]}</s><em>${want}</em>`;
    });
    const simpler = sn !== round.N;
    body.querySelector("[data-after]").textContent = simpler ? `${round.N}/${round.D} = ${sd === 1 ? sn : `${sn}/${sd}`}` : "";
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${n}/${d}. 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Era ${round.N}/${round.D}. 💡 ${round.hint}`;
      feedback.className = "feedback bad";
      const nxt = document.createElement("button");
      nxt.type = "button";
      nxt.className = "secondary fo-next";
      nxt.textContent = "Siguiente →";
      nxt.addEventListener("click", advance);
      body.querySelector("[data-keypad]").replaceWith(nxt);
      pending = setTimeout(advance, 2500);
    }
  }

  // Tras un fallo: fin si no quedan vidas; si no, otra ronda.
  function advance() {
    if (finished) return;
    clearTimeout(pending);
    lives <= 0 ? finish(false) : nextRound();
  }

  // Teclado físico: cifras, retroceso y Enter, igual que el de pantalla.
  const onKey = (e) => {
    if (finished) return;
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
    else return;
    e.preventDefault();
  };
  window.addEventListener("keydown", onKey);

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "fraccionesop", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>➗</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} operaciones bien de ${rounds}</p>
        <div class="end-actions">
          <button class="primary" data-retry>Jugar otra vez</button>
          <button class="secondary" data-menu>Volver al menú</button>
        </div>
      </div>`;
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
