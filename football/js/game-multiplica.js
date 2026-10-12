// "Multiplica en columna": la multiplicación vertical del cuaderno sobre
// papel cuadriculado: 234 × 6 con la raya, casillas para el resultado (se
// rellenan de derecha a izquierda) y una fila pequeña de llevadas que es
// un bloc de notas (se toca para ciclar 1-5). Con multiplicador de dos
// cifras aparecen las dos filas de productos parciales (la segunda corrida
// un lugar, con el hueco marcado) y la fila de la suma. El 💡 narra la
// cuenta cifra a cifra: "6 × 4 = 24: escribo 4 y me llevo 2…".
import { randInt, saveScore } from "./utils.js";

const dig = (n, i) => Math.floor(n / 10 ** i) % 10;
const len = (n) => String(n).length;
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const fmtDec = (n, dec) => (dec ? `${fmt(Math.floor(n / 10 ** dec))},${String(n % 10 ** dec).padStart(dec, "0")}` : fmt(n));

// Narra a × m (m de una cifra) tal y como se dice en clase.
function narrate(a, m) {
  const parts = [];
  let carry = 0;
  for (let i = 0; i < len(a); i++) {
    const p = m * dig(a, i);
    const t = p + carry;
    const last = i === len(a) - 1;
    let s = `${m} × ${dig(a, i)} = ${p}` + (carry ? ` + ${carry} = ${t}` : "");
    if (last || t < 10) s += `: escribo ${t}`;
    else s += `: escribo ${t % 10} y me llevo ${Math.floor(t / 10)}`;
    carry = Math.floor(t / 10);
    parts.push(s);
  }
  return parts.join("; ");
}

// Niveles: 0 dos cifras × 1 · 1 tres cifras × 1 · 2 dos × dos cifras con
// parciales · 3 tres × dos cifras · 4 con decimales (23,4 × 6).
export function buildRound(level) {
  let a, b, dec = 0;
  for (;;) {
    if (level === 0) { a = randInt(12, 99); b = randInt(2, 9); }
    else if (level === 1) { a = randInt(102, 999); b = randInt(2, 9); }
    else if (level === 2) { a = randInt(12, 99); b = randInt(1, 9) * 10 + randInt(1, 9); }
    else if (level === 3) { a = randInt(102, 999); b = randInt(1, 9) * 10 + randInt(1, 9); }
    else { a = randInt(101, 999); b = randInt(2, 9); dec = 1; }
    // 40 × 6 o × 11 no enseñan la cuenta; 23,5 × 2 = 47,0 deja un 0 que sobra
    if (a % 10 !== 0 && (b < 10 || b > 11) && !(dec && (a * b) % 10 === 0)) break;
  }
  const result = a * b;
  const w = len(result);
  // Filas que se rellenan (en orden): parciales y suma, o solo el resultado.
  const lines = b < 10 ? [{ value: result, shift: 0, sum: true }] : [
    { value: a * (b % 10), shift: 0 },
    { value: a * Math.floor(b / 10), shift: 1 },
    { value: result, shift: 0, sum: true },
  ];
  const slots = [];
  lines.forEach((ln, li) => {
    for (let i = 0; i < len(ln.value); i++) slots.push({ line: li, col: w - 1 - ln.shift - i, want: String(dig(ln.value, i)) });
  });
  let hint;
  if (dec) hint = `Multiplico sin la coma, ${a} × ${b}: ${narrate(a, b)}. Como ${fmtDec(a, 1)} tiene 1 decimal, el resultado también: ${fmtDec(result, 1)}`;
  else if (b < 10) hint = narrate(a, b);
  else hint = `Por el ${b % 10} (unidades): ${a} × ${b % 10} = ${fmt(lines[0].value)}. Por el ${Math.floor(b / 10)} (decenas): ${a} × ${Math.floor(b / 10)} = ${fmt(lines[1].value)}, un lugar a la izquierda. Sumo: ${fmt(lines[0].value)} + ${fmt(lines[1].value * 10)} = ${fmt(result)}`;
  return { a, b, dec, w, lines, slots, result, hint, text: `${fmtDec(a, dec)} × ${b} = ${fmtDec(result, dec)}` };
}

export function mountMultiplicaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, carries, active, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body mu-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  // Teclado físico: cifras, retroceso y Enter hacen lo mismo que el teclado en pantalla.
  const onKey = (e) => {
    if (/^\d$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
  };
  window.addEventListener("keydown", onKey);

  // Una fila del cuaderno: w celdas; `cells` da el contenido de cada columna.
  const row = (cls, sign, cells) => `<div class="mu-row ${cls}"><span class="mu-sign">${sign}</span>${cells.join("")}</div>`;
  const fixed = (n, dec) =>
    Array.from({ length: round.w }, (_, c) => {
      const i = round.w - 1 - c;
      const show = i < len(n);
      return `<span class="mu-cell mu-fixed${dec && i === dec ? " mu-comma" : ""}">${show ? dig(n, i) : ""}</span>`;
    });

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 2)));
    typed = round.slots.map(() => "");
    carries = Array(round.w).fill("");
    active = 0;
    busy = false;
    const lineRow = (ln, li) =>
      row(`mu-line${li === 0 ? " mu-first" : ""}${ln.sum && li ? " mu-sum" : ""}`, li === 1 ? "+" : "", Array.from({ length: round.w }, (_, c) => {
        const k = round.slots.findIndex((s) => s.line === li && s.col === c);
        if (k >= 0) return `<button type="button" class="mu-cell mu-slot${round.dec && round.w - 1 - c === round.dec ? " mu-comma" : ""}" data-slot="${k}"></button>`;
        return `<span class="mu-cell${ln.shift && c === round.w - 1 ? " mu-hole" : ""}">${ln.shift && c === round.w - 1 ? "·" : ""}</span>`;
      }));
    body.innerHTML = `
      <p class="prompt mu-prompt">Multiplica en columna</p>
      <div class="mu-sheet mu-cuaderno" style="--mu-w:${round.w}">
        ${row("mu-carries", "", carries.map((_, c) => `<button type="button" class="mu-carry" data-carry="${c}" title="llevada"></button>`))}
        ${row("", "", fixed(round.a, round.dec))}
        ${row("", "×", fixed(round.b, 0))}
        ${round.lines.map(lineRow).join("")}
      </div>
      <div class="keypad mu-keypad" data-keypad></div>
      <div class="feedback mu-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
    body.querySelectorAll("[data-carry]").forEach((b) =>
      b.addEventListener("click", () => {
        if (busy) return;
        const c = +b.dataset.carry;
        carries[c] = carries[c] === "" ? "1" : carries[c] === "5" ? "" : String(+carries[c] + 1);
        paint();
      })
    );
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
      const k = +b.dataset.slot;
      b.textContent = typed[k];
      b.classList.toggle("active", k === active);
    });
    body.querySelectorAll("[data-carry]").forEach((b, i) => (b.textContent = carries[i]));
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
      feedback.className = "feedback bad mu-feedback";
      return;
    }
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot;
      const ok = typed[k] === round.slots[k].want;
      allOk = allOk && ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${typed[k]}</s><i class="mu-fix">${round.slots[k].want}</i>`;
    });
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${round.text}. 💡 ${round.hint}`;
      feedback.className = "feedback ok mu-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.innerHTML = `Era ${round.text}. 💡 ${round.hint} <button type="button" class="mu-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad mu-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 2500);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "multiplica", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>✖️</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} multiplicaciones bien de ${rounds}</p>
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
