// "Valor absoluto y opuesto" (1º ESO): una mini recta de −10 a 10 sobre
// papel cuadriculado y debajo la cuenta como en el libro ("|−5| = □",
// "opuesto de −3 = □", "−(−4) = □"). Se escribe con el teclado (el signo
// con "− cambiar signo") y al responder se dibuja en la recta la distancia
// al 0 o el salto simétrico. 💡 "El valor absoluto es la distancia al 0: 5".
import { randInt, saveScore } from "./utils.js";

const M = "−";
const s = (n) => String(n).replace("-", M); // −5 con el signo del libro
const nz = (lo, hi) => { let v; do v = randInt(lo, hi); while (v === 0); return v; };

// Niveles: 0 valor absoluto · 1 opuesto · 2 −(−a) · 3 "a 4 del 0 y es
// negativo" · 4 combinados (|−3| + |2|, |2 − 7|, −|−6|) · 5 de todo.
// marks: lo que se dibuja al responder — d: distancia del 0 a v (con su
// número) · j: salto simétrico de a a b · p: punto.
export function buildRound(level) {
  if (level >= 5) level = randInt(0, 4);
  if (level === 0) {
    const a = Math.random() < 0.75 ? randInt(-10, -1) : randInt(1, 10);
    return { level, text: `|${s(a)}| = [0]`, answers: [Math.abs(a)], dot: [a], marks: [{ d: a }],
      hint: `El valor absoluto es la distancia al 0: |${s(a)}| = ${Math.abs(a)}` };
  }
  if (level === 1) {
    const a = nz(-10, 10);
    return { level, text: `opuesto de ${s(a)} = [0]`, answers: [-a], dot: [a], marks: [{ j: [a, -a] }],
      hint: `El opuesto está a la misma distancia del 0, pero al otro lado: opuesto de ${s(a)} = ${s(-a)}` };
  }
  if (level === 2) {
    const a = randInt(1, 10), inner = Math.random() < 0.7 ? -a : a;
    return { level, text: `${M}(${inner < 0 ? s(inner) : "+" + inner}) = [0]`, answers: [-inner], dot: [inner], marks: [{ j: [inner, -inner] }],
      hint: inner < 0 ? `${M}(${s(inner)}) es el opuesto de ${s(inner)}: menos por menos, más → ${a}` : `${M}(+${a}) es el opuesto de ${a}: menos por más, menos → ${s(-a)}` };
  }
  if (level === 3) {
    const d = randInt(1, 10), kind = randInt(0, 2);
    if (kind === 2) return { level, text: `A ${d} del 0 están [0] y [1]`, answers: [-d, d], any: true, dot: [], marks: [{ d: -d }, { d }],
      hint: `Hay dos números a ${d} del 0, uno a cada lado: ${s(-d)} y ${d} (los dos tienen valor absoluto ${d})` };
    const v = kind ? -d : d;
    return { level, text: `Está a ${d} del 0 y es ${v < 0 ? "negativo" : "positivo"}: [0]`, answers: [v], dot: [], marks: [{ d: v }],
      hint: `A ${d} del 0 están ${s(-d)} y ${d}; el ${v < 0 ? "negativo" : "positivo"} es ${s(v)}` };
  }
  const kind = randInt(0, 3);
  if (kind === 0) {
    const a = nz(-9, 9), c = nz(-9, 9);
    if (Math.abs(a) + Math.abs(c) > 10) return buildRound(4);
    return { level, text: `|${s(a)}| + |${s(c)}| = [0]`, answers: [Math.abs(a) + Math.abs(c)], dot: [a, c], marks: [{ d: a }, { d: c }],
      hint: `|${s(a)}| = ${Math.abs(a)} y |${s(c)}| = ${Math.abs(c)} → ${Math.abs(a)} + ${Math.abs(c)} = ${Math.abs(a) + Math.abs(c)}` };
  }
  if (kind === 1) {
    const a = nz(-10, 10), c = nz(-10, 10), r = Math.abs(a) - Math.abs(c);
    return { level, text: `|${s(a)}| ${M} |${s(c)}| = [0]`, answers: [r], dot: [a, c], marks: [{ d: a }, { d: c }],
      hint: `|${s(a)}| = ${Math.abs(a)} y |${s(c)}| = ${Math.abs(c)} → ${Math.abs(a)} ${M} ${Math.abs(c)} = ${s(r)}` };
  }
  if (kind === 2) {
    const a = randInt(1, 9), c = randInt(1, 10), r = a - c;
    if (r === 0 || r < -10) return buildRound(4);
    return { level, text: `|${a} ${M} ${c}| = [0]`, answers: [Math.abs(r)], dot: [r], marks: [{ d: r }],
      hint: `Primero lo de dentro: ${a} ${M} ${c} = ${s(r)}; y |${s(r)}| = ${Math.abs(r)}` };
  }
  const a = nz(-10, 10);
  return { level, text: `${M}|${s(a)}| = [0]`, answers: [-Math.abs(a)], dot: [a], marks: [{ d: a }, { p: -Math.abs(a) }],
    hint: `|${s(a)}| = ${Math.abs(a)}, y el ${M} de fuera lo cambia de signo: ${s(-Math.abs(a))}` };
}

// La recta: −10 en x = 20, 10 en x = 340 (16 px por unidad).
const X = (v) => 20 + (v + 10) * 16;
function line(dots) {
  const ticks = Array.from({ length: 21 }, (_, i) => i - 10).map((v) =>
    `<line x1="${X(v)}" y1="${v ? 55 : 51}" x2="${X(v)}" y2="${v ? 65 : 69}"/><text x="${X(v)}" y="80" class="${v ? "" : "ab-zero"}">${s(v)}</text>`).join("");
  const pts = dots.map((v) => `<circle class="ab-dot" cx="${X(v)}" cy="60" r="5"/>`).join("");
  return `<svg class="ab-line" viewBox="0 0 360 86" aria-label="recta numérica de −10 a 10"><line class="ab-axis" x1="8" y1="60" x2="352" y2="60"/><g class="ab-ticks">${ticks}</g>${pts}<g data-marks></g></svg>`;
}
function drawMarks(marks) {
  return marks.map((m, i) => {
    if (m.p !== undefined) return `<circle class="ab-dot ab-res" cx="${X(m.p)}" cy="60" r="6"/>`;
    if (m.d !== undefined) {
      const y = 44 - i * 18, a = Math.min(X(0), X(m.d)), b = Math.max(X(0), X(m.d));
      return `<g class="ab-dist ab-c${i}"><line x1="${a}" y1="${y}" x2="${b}" y2="${y}"/><line x1="${a}" y1="${y - 5}" x2="${a}" y2="${y + 5}"/><line x1="${b}" y1="${y - 5}" x2="${b}" y2="${y + 5}"/><text x="${(a + b) / 2}" y="${y - 4}">${Math.abs(m.d)}</text></g><circle class="ab-dot ab-res" cx="${X(m.d)}" cy="60" r="6"/>`;
    }
    const [a, b] = m.j, h = 10 + Math.abs(a - b) * 1.9;
    return `<g class="ab-jump"><path d="M ${X(a)} 54 Q ${(X(a) + X(b)) / 2} ${54 - h * 2} ${X(b)} 54"/><path d="M ${X(b) - 5} 46 L ${X(b)} 54 L ${X(b) + 5} 46"/></g><circle class="ab-dot ab-res" cx="${X(b)}" cy="60" r="6"/>`;
  }).join("");
}

export function mountAbsolutoGame(container, { client, onExit }) {
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
    <div class="game-body ab-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    if (finished) return;
    const last = round && round.text;
    do round = buildRound(Math.min(5, Math.floor(hits / 3))); while (round.text === last);
    typed = round.answers.map(() => "");
    active = 0;
    busy = false;
    const expr = round.text.replace(/\[(\d)\]/g, (_, i) => `<button type="button" class="ab-slot" data-slot="${i}"></button>`);
    body.innerHTML = `
      <p class="prompt ab-prompt">Mira la recta y completa</p>
      <div class="ab-cuaderno">${line(round.dot)}<div class="ab-expr" data-expr>${expr}</div></div>
      <div class="keypad ab-keypad" data-keypad></div>
      <button type="button" class="choice-btn keypad-sign ab-sign" data-sign>${M} cambiar signo</button>
      <div class="feedback ab-feedback" data-feedback></div>
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
      const i = +b.dataset.slot;
      b.textContent = s(typed[i]);
      b.classList.toggle("active", i === active);
    });
  }

  function pressKey(key) {
    if (finished || busy) return;
    const t = typed[active];
    if (key === "✓") return check();
    if (key === "±") typed[active] = t.startsWith("-") ? t.slice(1) : "-" + t;
    else if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (t.replace("-", "").length < 2) typed[active] = t + key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const filled = (v) => v !== "" && v !== "-";
    if (!typed.every(filled)) {
      if (filled(typed[active])) { active = typed.findIndex((v) => !filled(v)); paint(); return; }
      feedback.textContent = "Escribe un número en la casilla";
      feedback.className = "feedback bad ab-feedback";
      return;
    }
    busy = true;
    rounds++;
    let want = round.answers;
    // "A 6 del 0 están □ y □": vale en cualquier orden.
    if (round.any && Number(typed[0]) === want[1] && Number(typed[1]) === want[0]) want = [want[1], want[0]];
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((el) => {
      const i = +el.dataset.slot, ok = Number(typed[i]) === want[i];
      allOk = allOk && ok;
      el.classList.remove("active");
      el.classList.add(ok ? "good" : "bad");
      if (!ok) el.innerHTML = `<s>${s(typed[i])}</s><em>${s(want[i])}</em>`;
    });
    body.querySelector("[data-marks]").innerHTML = drawMarks(round.marks);
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok ab-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Era ${want.map(s).join(" y ")}. 💡 ${round.hint}`;
      feedback.className = "feedback bad ab-feedback";
      body.querySelector("[data-sign]").remove();
      const nxt = document.createElement("button");
      nxt.type = "button";
      nxt.className = "secondary ab-next";
      nxt.textContent = "Siguiente →";
      nxt.addEventListener("click", advance);
      body.querySelector("[data-keypad]").replaceWith(nxt);
      pending = setTimeout(advance, 2500);
    }
  }

  // Tras un fallo: se acaba la partida si no quedan vidas, si no, otra ronda.
  function advance() {
    if (finished) return;
    clearTimeout(pending);
    lives <= 0 ? finish(false) : nextRound();
  }

  // Teclado físico: cifras, retroceso, Enter y "-" para el signo.
  const onKey = (e) => {
    if (finished) return;
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
    else if (e.key === "-") pressKey("±");
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
    saveScore(client, "absoluto", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📏</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} bien de ${rounds}</p>
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
