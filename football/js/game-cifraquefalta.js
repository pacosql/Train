// "La cifra que falta": una cuenta en columna ya resuelta, pero con 1-3
// cifras tapadas por casillas (en los números de arriba o en el
// resultado): "4□ + 27 = 72". Hay que deducirlas columna a columna y
// escribirlas con el teclado; el foco va de derecha a izquierda, como se
// hace la cuenta. El 💡 explica cada columna: "□ + 7 acaba en 2 → □ = 5".
import { randInt, shuffle, saveScore } from "./utils.js";

const dig = (n, i) => Math.floor(n / 10 ** i) % 10;
const len = (n) => String(n).length;
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const COLS = ["Unidades", "Decenas", "Centenas", "Millares"];
const calc = (op, a, b) => (op === "+" ? a + b : op === "−" ? a - b : a * b);

// ¿Cuántas formas hay de rellenar las casillas para que la cuenta salga?
// (sin ceros a la izquierda). Una ronda vale solo si hay exactamente una.
function solutions(op, rows, hidden) {
  let count = 0;
  for (let m = 0; m < 10 ** hidden.length; m++) {
    const v = rows.slice();
    let ok = true;
    hidden.forEach(({ row, i }, j) => {
      const x = Math.floor(m / 10 ** j) % 10;
      if (x === 0 && i > 0 && i === len(rows[row]) - 1) ok = false;
      v[row] += (x - dig(rows[row], i)) * 10 ** i;
    });
    if (ok && calc(op, v[0], v[1]) === v[2]) count++;
  }
  return count;
}

// Explica una suma columna a columna; hid: casillas como "fila:posición"
// (filas 0..n-1 sumandos, n el resultado).
function explainSum(nums, R, hid) {
  const out = [];
  let cin = 0;
  for (let i = 0; i < len(R); i++) {
    const here = nums.map((v, k) => (i < len(v) ? k : -1)).filter((k) => k >= 0);
    const s = here.reduce((t, k) => t + dig(nums[k], i), 0) + cin;
    const cout = Math.floor(s / 10);
    const h = [...hid].find((x) => +x.split(":")[1] === i);
    if (h) {
      const row = +h.split(":")[0];
      const x = row === nums.length ? dig(R, i) : dig(nums[row], i);
      const parts = [...here.map((k) => (k === row ? "□" : String(dig(nums[k], i)))), ...(cin ? [`${cin} (llevada)`] : [])];
      const carry = cout && i < len(R) - 1 ? `, me llevo ${cout}` : "";
      let t;
      if (!here.length) t = `me llevaba ${cin} → □ = ${cin}`;
      else if (parts.length === 1) t = row === nums.length ? `baja el ${parts[0]} → □ = ${x}` : `el □ baja tal cual → □ = ${x}`;
      else if (row === nums.length) t = `${parts.join(" + ")} = ${s} → □ = ${x}${carry}`;
      else {
        const full = here.map((k) => dig(nums[k], i)).concat(cin ? [cin] : []).join(" + ");
        t = cout ? `${parts.join(" + ")} acaba en ${dig(R, i)} → □ = ${x} (${full} = ${s}${carry})` : `${parts.join(" + ")} = ${s} → □ = ${x}`;
      }
      out.push(`${COLS[i]}: ${t}`);
    }
    cin = cout;
  }
  return out.join(". ");
}

// Explica a × m (m de una cifra); hid como arriba (fila 0 = a, 2 = resultado).
function explainMul(a, m, R, hid) {
  if (hid.has("1:0")) return `${a} × □ = ${fmt(R)} → □ = ${m}, porque ${fmt(R)} : ${a} = ${m}`;
  const out = [];
  let cin = 0;
  for (let i = 0; i < len(R); i++) {
    const t = i < len(a) ? m * dig(a, i) + cin : cin;
    if (hid.has(`2:${i}`)) out.push(i < len(a) ? `${COLS[i]}: ${m} × ${dig(a, i)}${cin ? ` + ${cin}` : ""} = ${t} → □ = ${t % 10}` : `${COLS[i]}: me llevaba ${cin} → □ = ${cin}`);
    if (hid.has(`0:${i}`)) out.push(`${COLS[i]}: ${m} × □${cin ? ` + ${cin}` : ""} acaba en ${dig(R, i)} → □ = ${dig(a, i)} (${m} × ${dig(a, i)}${cin ? ` + ${cin}` : ""} = ${t})`);
    cin = Math.floor(t / 10);
  }
  return out.join(". ");
}

// Niveles: 0 una cifra en el resultado · 1 una en un sumando · 2 dos
// cifras · 3 restas · 4 multiplicación por una cifra.
export function buildRound(level) {
  for (;;) {
    let op = "+", a, b, k;
    if (level <= 1) { a = randInt(12, 89); b = randInt(12, 89); k = 1; }
    else if (level === 2) { a = randInt(15, 499); b = randInt(15, 499); k = 2; }
    else if (level === 3) { op = "−"; a = randInt(31, 999); b = randInt(12, a - 10); k = randInt(1, 2); }
    else { op = "×"; a = randInt(12, 299); b = randInt(2, 9); k = randInt(1, 2); }
    const rows = [a, b, calc(op, a, b)];
    if (rows.some((v) => v % 10 === 0)) continue; // con ceros al final no hay nada que pensar
    // Candidatos a casilla: (fila, posición) según el nivel.
    let cand = [];
    rows.forEach((v, row) => {
      for (let i = 0; i < len(v); i++) cand.push({ row, i });
    });
    if (level === 0) cand = cand.filter((c) => c.row === 2);
    if (level === 1) cand = cand.filter((c) => c.row < 2);
    if (op === "×") cand = cand.filter((c) => c.row === 2 || (c.row === 0 && b % 2 && b !== 5));
    let hidden;
    if (op === "×" && Math.random() < 0.2) hidden = [{ row: 1, i: 0 }];
    else {
      hidden = [];
      for (const c of shuffle(cand)) if (hidden.length < k && !hidden.some((h) => h.i === c.i)) hidden.push(c);
    }
    if (hidden.length < k && !(op === "×" && hidden[0].row === 1)) continue;
    if (solutions(op, rows, hidden) !== 1) continue;
    hidden.sort((x, y) => x.i - y.i || x.row - y.row);
    const hid = new Set(hidden.map((h) => `${h.row}:${h.i}`));
    let hint;
    if (op === "+") hint = explainSum([a, b], rows[2], hid);
    else if (op === "×") hint = explainMul(a, b, rows[2], hid);
    else {
      // La resta se razona con su prueba: lo que quito + lo que queda = lo que tenía.
      const map = { 0: 2, 1: 0, 2: 1 };
      const sh = new Set(hidden.map((h) => `${map[h.row]}:${h.i}`));
      hint = `Lo que quito + lo que queda = lo que tenía: ${b} + ${rows[2]} = ${a}. ${explainSum([b, rows[2]], a, sh)}`;
    }
    const w = Math.max(...rows.map(len));
    return { op, rows, hidden, slots: hidden.map((h) => ({ ...h, want: String(dig(rows[h.row], h.i)) })), w, hint, text: `${fmt(a)} ${op} ${fmt(b)} = ${fmt(rows[2])}` };
  }
}

export function mountCifraquefaltaGame(container, { client, onExit }) {
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
    <div class="game-body cf-body" data-body></div>
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

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 2)));
    typed = round.slots.map(() => "");
    active = 0;
    busy = false;
    const row = (v, r) => {
      const cells = Array.from({ length: round.w }, (_, c) => {
        const i = round.w - 1 - c;
        if (i >= len(v)) return `<span class="cf-cell"></span>`;
        const k = round.slots.findIndex((s) => s.row === r && s.i === i);
        return k >= 0 ? `<button type="button" class="cf-cell cf-slot" data-slot="${k}"></button>` : `<span class="cf-cell cf-fixed">${dig(v, i)}</span>`;
      });
      return `<div class="cf-row${r === 2 ? " cf-result" : ""}"><span class="cf-sign">${r === 1 ? round.op : ""}</span>${cells.join("")}</div>`;
    };
    body.innerHTML = `
      <p class="prompt cf-prompt">¿Qué cifra${round.slots.length > 1 ? "s faltan" : " falta"}?</p>
      <div class="cf-sheet cf-cuaderno" style="--cf-w:${round.w}">${round.rows.map(row).join("")}</div>
      <div class="keypad cf-keypad" data-keypad></div>
      <div class="feedback cf-feedback" data-feedback></div>
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
      const k = +b.dataset.slot;
      if (!busy) b.textContent = typed[k];
      b.classList.toggle("active", !busy && k === active);
    });
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
      feedback.className = "feedback bad cf-feedback";
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
      if (!ok) b.innerHTML = `<s>${typed[k]}</s><i class="cf-fix">${round.slots[k].want}</i>`;
    });
    paint();
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${round.text}. 💡 ${round.hint}`;
      feedback.className = "feedback ok cf-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.innerHTML = `Era ${round.text}. 💡 ${round.hint} <button type="button" class="cf-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad cf-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 2500);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "cifraquefalta", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔍</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} cuentas completadas de ${rounds}</p>
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
