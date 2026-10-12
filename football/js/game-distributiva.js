// "Propiedades de las operaciones": una igualdad del libro con casillas
// vacías en el lado derecho — conmutativa (4 × 7 = 7 × □), asociativa,
// distributiva (3 × (4 + 5) = 3 × 4 + 3 × □) y sacar factor común. Se
// escribe con el teclado; se acepta cualquier relleno que haga CIERTA la
// igualdad (se evalúa de verdad) usando los mismos números del libro (así
// "3 × 4 + 4 × 3" vale, pero "9 × (1 + 2)" no), y al responder aparece el
// nombre de la propiedad y un 💡 que la explica con los números de la ronda.
import { randInt, pick, saveScore } from "./utils.js";

const NAMES = { con: "Propiedad conmutativa", aso: "Propiedad asociativa", dis: "Propiedad distributiva", fac: "Sacar factor común" };

// Evalúa "3 × (4 + 5) − 2" con la notación del libro (+, −, ×, paréntesis).
export function evalExpr(s) {
  const t = s.replace(/\s+/g, "");
  let i = 0;
  const num = () => { let j = i; while (j < t.length && /\d/.test(t[j])) j++; const v = Number(t.slice(i, j)); i = j; return v; };
  const atom = () => { if (t[i] === "(") { i++; const v = sum(); i++; return v; } return num(); };
  const prod = () => { let v = atom(); while (t[i] === "×") { i++; v *= atom(); } return v; };
  const sum = () => { let v = prod(); while (t[i] === "+" || t[i] === "−") { const o = t[i++]; const w = prod(); v = o === "+" ? v + w : v - w; } return v; };
  return sum();
}
// Sustituye los □ de la plantilla, en orden, por lo escrito.
export const fill = (tpl, vals) => { let k = 0; return tpl.replace(/□/g, () => String(vals[k++])); };
const sorted = (v) => v.map(Number).sort((x, y) => x - y).join(",");
// ¿Es correcta la respuesta? Igualdad cierta y con los números de la ronda.
export const accepts = (round, vals) =>
  vals.every((v) => /^\d+$/.test(String(v))) && evalExpr(fill(round.right, vals)) === round.value && sorted(vals) === sorted(round.expected);

function conmutativa() {
  const op = pick(["+", "×"]), max = op === "+" ? 40 : 9;
  const a = randInt(2, max); let b; do b = randInt(2, max); while (b === a);
  const r = evalExpr(`${a} ${op} ${b}`);
  const right = Math.random() < 0.5 ? { t: `${b} ${op} □`, e: [a] } : { t: `□ ${op} ${a}`, e: [b] };
  const what = op === "+" ? "sumandos no cambia la suma" : "factores no cambia el producto";
  return { prop: "con", left: `${a} ${op} ${b}`, right: right.t, expected: right.e, hint: `Conmutativa: el orden de los ${what}: ${a} ${op} ${b} = ${b} ${op} ${a} = ${r}` };
}

function asociativa(slots) {
  // Con tres casillas todos los números son de una cifra (el foco avanza solo).
  const op = pick(["+", "×"]), max = op === "+" ? (slots === 3 ? 9 : 30) : 6;
  const a = randInt(2, max), b = randInt(2, max), c = randInt(2, max);
  const r = evalExpr(`${a} ${op} ${b} ${op} ${c}`);
  const forms = slots === 3
    ? [{ l: `(${a} ${op} ${b}) ${op} ${c}`, t: `□ ${op} (□ ${op} □)`, e: [a, b, c] }, { l: `${a} ${op} (${b} ${op} ${c})`, t: `(□ ${op} □) ${op} □`, e: [a, b, c] }]
    : [
        { l: `(${a} ${op} ${b}) ${op} ${c}`, t: `${a} ${op} (□ ${op} ${c})`, e: [b] },
        { l: `(${a} ${op} ${b}) ${op} ${c}`, t: `□ ${op} (${b} ${op} ${c})`, e: [a] },
        { l: `${a} ${op} (${b} ${op} ${c})`, t: `(${a} ${op} □) ${op} ${c}`, e: [b] },
        { l: `${a} ${op} (${b} ${op} ${c})`, t: `(□ ${op} ${b}) ${op} ${c}`, e: [a] },
      ];
  const f = pick(forms), what = op === "+" ? "sumandos" : "factores";
  return { prop: "aso", left: f.l, right: f.t, expected: f.e, hint: `Asociativa: puedo agrupar los ${what} como quiera, el resultado no cambia: (${a} ${op} ${b}) ${op} ${c} = ${a} ${op} (${b} ${op} ${c}) = ${r}` };
}

// Números de la distributiva: a × (b ± c) con b ≠ c y b > c si se resta.
function abc(minus) {
  const a = randInt(2, 9); let b = randInt(2, 9), c; do c = randInt(2, 9); while (c === b);
  if (minus && b < c) [b, c] = [c, b];
  return [a, b, c];
}
function distributiva(slots, allowMinus) {
  const s = allowMinus && Math.random() < 0.35 ? "−" : "+";
  const [a, b, c] = abc(s === "−");
  const left = `${a} × (${b} ${s} ${c})`, r = evalExpr(left);
  const forms = slots === 3
    ? [{ t: `□ × □ ${s} ${a} × □`, e: [a, b, c] }, { t: `${a} × □ ${s} □ × □`, e: [b, a, c] }]
    : [{ t: `${a} × ${b} ${s} ${a} × □`, e: [c] }, { t: `${a} × □ ${s} ${a} × ${c}`, e: [b] }, { t: `□ × ${b} ${s} ${a} × ${c}`, e: [a] }];
  const f = pick(forms), what = s === "+" ? "sumandos" : "términos de la resta";
  return { prop: "dis", left, right: f.t, expected: f.e, hint: `Distributiva: el ${a} multiplica a los dos ${what}: ${a} × (${b} ${s} ${c}) = ${a} × ${b} ${s} ${a} × ${c} = ${a * b} ${s} ${a * c} = ${r}` };
}
function factorComun(slots, allowMinus) {
  const s = allowMinus && Math.random() < 0.35 ? "−" : "+";
  const [a, b, c] = abc(s === "−");
  const left = `${a} × ${b} ${s} ${a} × ${c}`, r = evalExpr(left);
  const forms = slots === 3
    ? [{ t: `□ × (□ ${s} □)`, e: [a, b, c] }]
    : [{ t: `${a} × (□ ${s} □)`, e: [b, c] }, { t: `□ × (${b} ${s} ${c})`, e: [a] }, { t: `${a} × (${b} ${s} □)`, e: [c] }, { t: `${a} × (□ ${s} ${c})`, e: [b] }];
  const f = pick(forms);
  return { prop: "fac", left, right: f.t, expected: f.e, hint: `Factor común: el ${a} se repite en los dos productos, lo saco fuera del paréntesis: ${a} × ${b} ${s} ${a} × ${c} = ${a} × (${b} ${s} ${c}) = ${a} × ${evalExpr(`${b} ${s} ${c}`)} = ${r}` };
}

// Niveles: 0 conmutativa · 1 asociativa · 2 distributiva · 3 sacar factor
// común · 4 tres casillas (distributiva, asociativa o factor común).
export function buildRound(level) {
  const L = Math.min(4, level);
  const r = L === 0 ? conmutativa() : L === 1 ? asociativa(1) : L === 2 ? distributiva(1, true) : L === 3 ? factorComun(1, true)
    : pick([() => distributiva(3, true), () => asociativa(3), () => factorComun(3, true)])();
  return { ...r, level: L, value: evalExpr(r.left), name: NAMES[r.prop] };
}

export function mountDistributivaGame(container, { client, onExit }) {
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
    <div class="game-body ds-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const slots = () => body.querySelectorAll("[data-slot]");

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.floor(hits / 2));
    typed = round.expected.map(() => "");
    active = 0;
    busy = false;
    let k = 0;
    const rightHtml = round.right.replace(/□/g, () => `<button type="button" class="ds-slot" data-slot="${k++}"></button>`);
    body.innerHTML = `
      <p class="prompt ds-prompt">Completa la igualdad</p>
      <div class="ds-cuaderno">
        <div class="ds-line">${round.left}</div>
        <div class="ds-line">= ${rightHtml}</div>
      </div>
      <div class="ds-prop" data-prop>&nbsp;</div>
      <div class="keypad ds-keypad" data-keypad></div>
      <div class="feedback ds-feedback" data-feedback></div>
    `;
    slots().forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
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
    slots().forEach((b, i) => {
      b.textContent = typed[i];
      b.classList.toggle("active", i === active);
    });
  }

  // Con una casilla caben dos cifras; con varias, cada número es de una
  // cifra y el foco salta solo a la siguiente vacía (de izquierda a
  // derecha, como se lee). ✓ también salta si quedan huecos y corrige si no.
  function pressKey(key) {
    if (finished || busy) return;
    const empty = typed.map((t, i) => (t === "" ? i : -1)).filter((i) => i >= 0);
    if (key === "✓") {
      if (!empty.length) return check();
      if (typed[active] === "") {
        const fb = body.querySelector("[data-feedback]");
        fb.textContent = "Escribe un número en la casilla marcada";
        fb.className = "feedback bad";
      } else active = empty[0];
    } else if (key === "⌫") typed[active] = typed[active].slice(0, -1);
    else {
      const cap = typed.length === 1 ? 2 : 1;
      typed[active] = typed[active] === "0" || typed[active].length >= cap ? key : typed[active] + key;
      const rest = empty.filter((i) => i !== active);
      if (typed[active].length >= cap && rest.length) active = rest.find((i) => i > active) ?? rest[0];
    }
    paint();
  }

  function check() {
    busy = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const ok = accepts(round, typed);
    slots().forEach((b, i) => {
      b.classList.remove("active");
      const good = ok || Number(typed[i]) === round.expected[i];
      b.classList.add(good ? "good" : "bad");
      if (!good) b.innerHTML = `<s>${typed[i]}</s><em class="ds-want">${round.expected[i]}</em>`;
    });
    const prop = body.querySelector("[data-prop]");
    prop.textContent = round.name;
    prop.classList.add("on");
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.innerHTML = `Era ${fill(round.right, round.expected)}. 💡 ${round.hint} <button type="button" class="ds-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad";
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 2500);
    }
  }

  // Teclado físico: cifras, retroceso e Intro.
  const onKey = (e) => {
    if (finished || busy) return;
    if (/^\d$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
    else return;
    e.preventDefault();
  };
  window.addEventListener("keydown", onKey);

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "distributiva", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>⚖️</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} igualdades completadas de ${rounds}</p>
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
