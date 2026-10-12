// "La tabla de los dos dados": la tabla 6 × 6 de las sumas de dos dados,
// como en el libro (dado rojo arriba, dado azul a la izquierda). Primero
// se completan casillas de la tabla; luego se cuentan casos ("¿cuántos
// casos suman 7?"), se escribe la probabilidad sobre 36, se simplifica y,
// al final, "¿qué suma es la más probable?". Al responder se iluminan las
// casillas que cuentan. 💡 "Hay 6 casillas con 7 de 36: 6/36 = 1/6".
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const PIPS = { 1: [[2, 2]], 2: [[1, 1], [3, 3]], 3: [[1, 1], [2, 2], [3, 3]], 4: [[1, 1], [3, 1], [1, 3], [3, 3]], 5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]], 6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]] };
const die = (n, cls) => `<svg class="dd-die ${cls}" viewBox="0 0 24 24"><rect x="1" y="1" width="22" height="22" rx="5"/>${PIPS[n].map(([x, y]) => `<circle cx="${x * 6}" cy="${y * 6}" r="2.2"/>`).join("")}</svg>`;

// Sucesos que se preguntan (todos con fracción simplificable sobre 36).
const EVENTS = [
  { txt: "sacar dobles", f: (a, b) => a === b },
  { txt: "sumar más de 9", f: (a, b) => a + b > 9 },
  { txt: "sumar menos de 5", f: (a, b) => a + b < 5 },
  { txt: "sumar un número par", f: (a, b) => (a + b) % 2 === 0 },
  { txt: "sumar más de 8", f: (a, b) => a + b > 8 },
];
const sumEvent = (s) => ({ txt: `sumar ${s}`, f: (a, b) => a + b === s });
const ALL = [];
for (let b = 1; b <= 6; b++) for (let a = 1; a <= 6; a++) ALL.push([a, b]);
const cellsOf = (ev) => ALL.filter(([a, b]) => ev.f(a, b));

// Niveles: 0 completar casillas · 1 contar casos · 2 probabilidad sobre 36 ·
// 3 probabilidad simplificada · 4 "¿qué suma es más probable?" y mezcla.
export function buildRound(level) {
  const S = (i) => ({ slot: i });
  let kind = ["huecos", "casos", "p36", "simple"][level] || pick(["masprob", "igual", "simple", "simple"]);
  let prompt, line, want, hint, lit = [], blanks = [];
  if (kind === "huecos") {
    blanks = shuffle(ALL).slice(0, randInt(2, 3)).sort((x, y) => x[1] - y[1] || x[0] - y[0]);
    prompt = "Completa la tabla de los dos dados";
    want = blanks.map(([a, b]) => a + b);
    line = null;
    hint = `Cada casilla suma su dado de arriba y el de la izquierda: ${blanks.map(([a, b]) => `${a} + ${b} = ${a + b}`).join("; ")}`;
    lit = blanks;
  } else if (kind === "masprob") {
    prompt = "¿Qué suma es la más probable?";
    line = ["La suma ", S(0)];
    want = [7];
    lit = cellsOf(sumEvent(7));
    hint = "El 7 está en 6 casillas (la diagonal más larga): 6/36 = 1/6; ninguna otra suma sale tantas veces";
  } else if (kind === "igual") {
    const s = pick([2, 3, 4, 5, 6, 8, 9, 10, 11, 12]), n = cellsOf(sumEvent(s)).length;
    prompt = `¿Qué otra suma es igual de probable que sumar ${s}?`;
    line = ["La suma ", S(0)];
    want = [14 - s];
    lit = [...cellsOf(sumEvent(s)), ...cellsOf(sumEvent(14 - s))];
    hint = `El ${s} está en ${n} casilla${n > 1 ? "s" : ""} y el ${14 - s} también: la tabla es simétrica alrededor del 7 (${s} + ${14 - s} = 14)`;
  } else {
    // Suceso: una suma (en los primeros niveles) o los de la lista.
    let ev, c;
    do {
      ev = kind === "simple" && Math.random() < 0.5 ? pick(EVENTS) : sumEvent(randInt(2, 12));
      c = cellsOf(ev).length;
    } while (kind === "simple" && gcd(c, 36) === 1);
    lit = cellsOf(ev);
    const g = gcd(c, 36);
    if (kind === "casos") {
      prompt = `¿Cuántos casos hay de ${ev.txt}?`;
      line = ["Casos: ", S(0)];
      want = [c];
    } else if (kind === "p36") {
      prompt = `¿Cuál es la probabilidad de ${ev.txt}?`;
      line = ["P = ", S(0), " / 36"];
      want = [c];
    } else {
      prompt = `Probabilidad de ${ev.txt}, simplificada`;
      line = ["P = ", S(0), " / 36 = ", S(1), " / ", S(2)];
      want = [c, c / g, 36 / g];
    }
    hint = `Hay ${c} casilla${c > 1 ? "s" : ""} de 36 (${lit.map(([a, b]) => `${a}+${b}`).join(", ")}): ${c}/36${kind === "simple" ? ` = ${c / g}/${36 / g} (divido entre ${g})` : ""}`;
    if (kind === "casos") hint = `Hay ${c} casilla${c > 1 ? "s" : ""}: ${lit.map(([a, b]) => `${a}+${b}`).join(", ")}`;
  }
  return { kind, prompt, line, want, hint, lit, blanks };
}

export function mountDosdadosGame(container, { client, onExit }) {
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
    <div class="game-body dd-body" data-body></div>
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
    else if (e.key === "Enter") { e.preventDefault(); pressKey("✓"); }
  };

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 2)));
    typed = round.want.map(() => "");
    active = 0;
    busy = false;
    const slot = (i) => `<button type="button" class="dd-slot" data-slot="${i}"></button>`;
    const blankAt = (a, b) => round.blanks.findIndex(([x, y]) => x === a && y === b);
    let head = `<tr><th class="dd-corner">+</th>${[1, 2, 3, 4, 5, 6].map((a) => `<th>${die(a, "dd-red")}</th>`).join("")}</tr>`;
    for (let b = 1; b <= 6; b++)
      head += `<tr><th>${die(b, "dd-blue")}</th>${[1, 2, 3, 4, 5, 6].map((a) => `<td data-a="${a}" data-b="${b}">${blankAt(a, b) >= 0 ? slot(blankAt(a, b)) : a + b}</td>`).join("")}</tr>`;
    const line = round.line ? `<div class="dd-cuaderno dd-line">${round.line.map((t) => (typeof t === "string" ? `<span>${t}</span>` : slot(t.slot))).join("")}</div>` : "";
    body.innerHTML = `
      <p class="prompt dd-prompt">${round.prompt}</p>
      <table class="dd-table">${head}</table>
      ${line}
      <div class="keypad dd-keypad" data-keypad></div>
      <div class="feedback dd-feedback" data-feedback></div>
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

  const nextEmpty = () => {
    const after = typed.findIndex((t, i) => i > active && t === "");
    return after >= 0 ? after : typed.indexOf("");
  };

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") {
      if (typed.indexOf("") < 0) return check();
      if (typed[active] !== "") { active = nextEmpty(); return paint(); }
      active = typed.indexOf("");
      paint();
      const fb = body.querySelector("[data-feedback]");
      fb.textContent = "Faltan casillas por rellenar";
      fb.className = "feedback bad dd-feedback";
      return;
    }
    if (key === "⌫") {
      if (typed[active] === "" && active > 0) active--;
      else typed[active] = typed[active].slice(0, -1);
    } else if (typed[active].length < 2) {
      typed[active] += key;
      // En la tabla, una suma de una cifra mayor que 1 ya está completa.
      if (round.kind === "huecos" && (typed[active].length === 2 || +typed[active] >= 2) && nextEmpty() >= 0) active = nextEmpty();
    }
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const i = +b.dataset.slot;
      const ok = Number(typed[i]) === round.want[i];
      allOk = allOk && ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${typed[i]}</s><i class="dd-fix">${round.want[i]}</i>`;
    });
    // Se iluminan las casillas que cuentan.
    body.querySelectorAll("td[data-a]").forEach((td) => td.classList.toggle("dd-hit", round.lit.some(([a, b]) => a === +td.dataset.a && b === +td.dataset.b)));
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok dd-feedback";
      pending = setTimeout(nextRound, 1100);
    } else {
      lives--;
      renderLives();
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.innerHTML = `💡 ${round.hint} <button type="button" class="dd-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad dd-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 3200);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "dosdados", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎲</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} preguntas bien de ${rounds}</p>
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
