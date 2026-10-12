// "En columna": una suma o resta escrita en vertical como en el cuaderno,
// con casillas vacías para el resultado y una fila pequeña arriba para
// anotar las llevadas (opcional). Se toca una casilla del resultado (por
// defecto las unidades), se escribe la cifra con el teclado y el foco
// pasa solo a la izquierda. El 💡 explica la columna donde se lleva o se
// pide prestado con los números de la ronda.
import { randInt, saveScore } from "./utils.js";

const COLS = ["unidades", "decenas", "centenas", "millares"];
const dig = (n, i) => Math.floor(n / 10 ** i) % 10;
const width = (nums) => Math.max(...nums.map((n) => String(n).length));

// ¿Alguna columna suma 10 o más? (si ninguna lo hace, no hay llevadas)
function hasCarry(nums) {
  for (let i = 0; i < width(nums); i++) if (nums.reduce((t, n) => t + dig(n, i), 0) >= 10) return true;
  return false;
}
// ¿Alguna cifra del minuendo es menor que la del sustraendo? (hay que pedir)
function hasBorrow(a, b) {
  for (let i = 0; i < width([a, b]); i++) if (dig(a, i) < dig(b, i)) return true;
  return false;
}

// La columna que se explica es la primera (desde la derecha) con llevada
// o préstamo; por ser la primera, no recibe nada de la columna anterior.
function explain(op, nums) {
  const w = width(nums);
  const plain = [];
  for (let i = 0; i < w; i++) {
    const parts = nums.map((n) => dig(n, i));
    if (op === "+") {
      const s = parts.reduce((t, d) => t + d, 0);
      if (s >= 10) return `${parts.join(" + ")} = ${s}: escribo ${s % 10} y me llevo ${Math.floor(s / 10)} a las ${COLS[i + 1]}`;
      plain.push(`${parts.join(" + ")} = ${s}`);
    } else {
      const [a, b] = parts;
      if (a < b) return `${a} − ${b} no se puede: pido 1 a las ${COLS[i + 1]} → ${10 + a} − ${b} = ${10 + a - b}`;
      plain.push(`${a} − ${b} = ${a - b}`);
    }
  }
  return `${op === "+" ? "Sin llevadas" : "Sin pedir prestado"}: ${plain.map((t, i) => `${t} (${COLS[i]})`).join(", ")}`;
}

// Niveles: 0 sumas sin llevar · 1 con llevada · 2 restas sin pedir ·
// 3 restas pidiendo · 4 tres cifras (suma o resta) · 5 tres sumandos.
export function buildRound(level) {
  let op, nums;
  for (;;) {
    op = level === 2 || level === 3 || (level === 4 && Math.random() < 0.5) ? "−" : "+";
    if (level === 5) nums = [randInt(10, 99), randInt(10, 99), randInt(10, 99)];
    else if (op === "+") nums = level === 4 ? [randInt(100, 899), randInt(100, 899)] : [randInt(10, level ? 99 : 89), randInt(10, level ? 99 : 89)];
    else {
      const a = randInt(level === 4 ? 200 : 21, level === 4 ? 999 : 99);
      nums = [a, randInt(level === 4 ? 100 : 10, a - 1)];
    }
    if (nums.every((n) => n % 10 === 0)) continue; // 10 + 10 no enseña nada
    if (level === 5) break;
    const special = op === "+" ? hasCarry(nums) : hasBorrow(nums[0], nums[1]);
    if (special === (level !== 0 && level !== 2)) break;
  }
  const result = op === "+" ? nums.reduce((s, n) => s + n, 0) : nums[0] - nums[1];
  return { op, nums, result, w: width([...nums, result]), hint: explain(op, nums) };
}

export function mountColumnaGame(container, { client, onExit }) {
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
    <div class="game-body co-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(5, Math.floor(hits / 2)));
    typed = Array(round.w).fill("");
    carries = Array(round.w).fill("");
    active = round.w - 1;
    busy = false;
    const row = (n, i) =>
      `<div class="co-row"><span class="co-sign">${i === round.nums.length - 1 ? round.op : ""}</span>${Array.from(
        { length: round.w },
        (_, c) => `<span class="co-cell co-fixed">${String(n).padStart(round.w, " ")[c].trim()}</span>`
      ).join("")}</div>`;
    body.innerHTML = `
      <p class="prompt co-prompt">${round.op === "+" ? "Suma" : "Resta"} en columna</p>
      <div class="co-sheet" style="--co-w:${round.w}">
        <div class="co-row co-carries"><span class="co-sign"></span>${typed
          .map((_, c) => `<button type="button" class="co-carry" data-carry="${c}" title="llevada"></button>`)
          .join("")}</div>
        ${round.nums.map(row).join("")}
        <div class="co-row co-result"><span class="co-sign">=</span>${typed
          .map((_, c) => `<button type="button" class="co-cell co-slot" data-res="${c}"></button>`)
          .join("")}</div>
      </div>
      <div class="keypad co-keypad" data-keypad></div>
      <div class="feedback co-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-res]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.res), paint())));
    // La fila de llevadas es un bloc de notas: tocar alterna vacío → 1 → 2.
    body.querySelectorAll("[data-carry]").forEach((b) =>
      b.addEventListener("click", () => {
        if (busy) return;
        const c = +b.dataset.carry;
        carries[c] = carries[c] === "" ? "1" : carries[c] === "1" ? "2" : "";
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
    body.querySelectorAll("[data-res]").forEach((b, i) => {
      b.textContent = typed[i];
      b.classList.toggle("active", i === active);
    });
    body.querySelectorAll("[data-carry]").forEach((b, i) => (b.textContent = carries[i]));
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    if (key === "⌫") {
      if (typed[active] === "" && active < round.w - 1) active++;
      typed[active] = "";
    } else {
      typed[active] = key;
      if (active > 0) active--;
    }
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const first = typed.findIndex((t) => t !== "");
    // Se admiten casillas vacías solo a la izquierda (ceros que no se escriben).
    if (first === -1 || typed.slice(first).some((t) => t === "")) {
      active = typed.lastIndexOf("");
      paint();
      feedback.textContent = "Faltan casillas por rellenar";
      feedback.className = "feedback bad";
      return;
    }
    busy = true;
    rounds++;
    const exp = String(round.result).padStart(round.w, " ");
    let allOk = true;
    body.querySelectorAll("[data-res]").forEach((b, i) => {
      const want = exp[i].trim();
      const ok = (typed[i] || "0") === (want || "0");
      allOk = allOk && ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${typed[i] || "·"}</s>${want || "0"}`;
    });
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${round.result}. 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Era ${round.result}. 💡 ${round.hint}`;
      feedback.className = "feedback bad";
      pending = setTimeout(() => (lives <= 0 ? finish(false) : nextRound()), 2200);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "columna", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📝</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} cuentas bien hechas de ${rounds}</p>
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
  };
}
