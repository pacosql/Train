// "Forma compleja e incompleja": "3 m 25 cm = □ cm" (compleja → incompleja)
// y "425 cm = □ m □ cm" (incompleja → compleja), escritas en el cuaderno
// con las casillas y la unidad al lado, como en el libro, con el recuadro
// recordatorio "1 m = 100 cm". Se toca una casilla, se escribe con el
// teclado y el foco salta a la siguiente de izquierda a derecha. Niveles:
// m y cm → km y m → kg y g → l y ml → tres unidades (m dm cm). 4º-6º.
import { randInt, pick, saveScore } from "./utils.js";

const miles = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const fmt = (n) => miles(String(n));
// Unidades de mayor a menor y el factor que separa cada una de la siguiente.
const SETS = [
  { units: ["m", "cm"], f: [100] },
  { units: ["km", "m"], f: [1000] },
  { units: ["kg", "g"], f: [1000] },
  { units: ["l", "ml"], f: [1000] },
  { units: ["m", "dm", "cm"], f: [10, 10] },
];
const list = (arr) => (arr.length > 1 ? arr.slice(0, -1).join(", ") + " y " + arr[arr.length - 1] : arr[0]);

// Niveles 0-4 = SETS. dir "ci": compleja → incompleja (una casilla con el
// total); "ic": incompleja → compleja (una casilla por unidad).
export function buildRound(level) {
  const set = SETS[Math.min(4, Math.max(0, level))];
  const { units, f } = set;
  const n = units.length;
  const dir = Math.random() < 0.5 ? "ci" : "ic";
  let parts;
  if (n === 2) {
    // La parte pequeña a veces es corta (3 m 5 cm = 305 cm): el 0 intermedio es la trampa clásica.
    const small = pick([randInt(1, f[0] - 1), randInt(1, f[0] - 1), randInt(1, 9), f[0] === 1000 ? randInt(10, 99) : randInt(1, 9)]);
    parts = [randInt(1, 9), small];
  } else parts = [randInt(1, 9), randInt(1, 9), randInt(1, 9)];
  let total = parts[0];
  for (let i = 1; i < n; i++) total = total * f[i - 1] + parts[i];
  // Cuánto vale cada parte grande en la unidad pequeña (3 m → 300 cm).
  const toSmall = parts.map((p, i) => f.slice(i).reduce((t, x) => t * x, p));
  const small = units[n - 1];
  const compleja = parts.map((p, i) => `${p} ${units[i]}`).join(" ");
  let hint;
  if (dir === "ci") {
    const conv = parts.slice(0, -1).map((p, i) => `${p} ${units[i]} son ${fmt(toSmall[i])} ${small}`);
    hint = `${list(conv)}; ${toSmall.map(fmt).join(" + ")} = ${fmt(total)} ${small}`;
  } else {
    const conv = parts.slice(0, -1).map((p, i) => `${fmt(toSmall[i])} ${small} son ${p} ${units[i]}`);
    hint = `${fmt(total)} ${small}: ${conv.join(", ")} y ${n > 2 ? "quedan" : "sobran"} ${parts[n - 1]} ${small} → ${compleja}`;
  }
  const boxes = dir === "ci"
    ? [{ unit: small, ans: total, maxLen: 5, wide: true }]
    : parts.map((p, i) => ({ unit: units[i], ans: p, maxLen: i ? String(f[i - 1] - 1).length : 1, wide: false }));
  const badge = f.map((x, i) => `1 ${units[i]} = ${fmt(x)} ${units[i + 1]}`).join(" · ");
  const given = dir === "ci" ? compleja : `${fmt(total)} ${small}`;
  return { dir, units, parts, total, boxes, given, badge, hint, answer: dir === "ci" ? `${fmt(total)} ${small}` : compleja };
}

export function mountMedidascomplejasGame(container, { client, onExit }) {
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
    <div class="game-body mc-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    // Nunca dos rondas iguales seguidas.
    const prev = round?.hint;
    for (let t = 0; t < 20 && (!t || round.hint === prev); t++) round = buildRound(Math.min(4, Math.floor(hits / 2)));
    typed = round.boxes.map(() => "");
    active = 0;
    busy = false;
    body.innerHTML = `
      <p class="prompt mc-prompt">${round.dir === "ci" ? "Pasa a forma incompleja" : "Pasa a forma compleja"}</p>
      <div class="mc-badge">${round.badge}</div>
      <div class="mc-cuaderno${round.boxes.length > 2 ? " mc-tight" : ""}"><span class="mc-line">${round.given} = ${round.boxes
        .map((b, i) => `<button type="button" class="mc-box${b.wide ? " wide" : ""}" data-box="${i}"></button> <span class="mc-unit">${b.unit}</span>`)
        .join(" ")}</span></div>
      <div class="keypad mc-keypad" data-keypad></div>
      <div class="feedback mc-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-box]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.box), paint())));
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
    body.querySelectorAll("[data-box]").forEach((b, i) => {
      b.textContent = round.boxes[i].wide ? miles(typed[i]) : typed[i];
      b.classList.toggle("active", i === active);
    });
  }

  function pressKey(key) {
    if (finished) return;
    if (busy) { if (key === "✓") body.querySelector("[data-next]")?.click(); return; }
    if (key === "✓") return check();
    if (key === "⌫") {
      if (typed[active] === "" && active > 0) active--;
      typed[active] = typed[active].slice(0, -1);
    } else if (typed[active].length < round.boxes[active].maxLen) {
      typed[active] += key;
      // Casilla llena → el foco pasa solo a la siguiente, de izquierda a derecha.
      if (typed[active].length === round.boxes[active].maxLen && active < typed.length - 1) active++;
    }
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const empty = typed.findIndex((t) => t === "");
    if (empty !== -1) {
      active = empty;
      paint();
      feedback.textContent = `Falta la casilla de ${round.boxes[empty].unit}`;
      feedback.className = "feedback bad mc-feedback";
      return;
    }
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-box]").forEach((b, i) => {
      const ok = Number(typed[i]) === round.boxes[i].ans;
      allOk = allOk && ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) {
        b.innerHTML = `<s>${miles(typed[i])}</s>`;
        b.insertAdjacentHTML("afterend", `<b class="mc-right">${fmt(round.boxes[i].ans)}</b>`);
      }
    });
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${round.answer}. 💡 ${round.hint}`;
      feedback.className = "feedback ok mc-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.innerHTML = `Era ${round.answer}. 💡 ${round.hint}<button type="button" class="secondary mc-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad mc-feedback";
      const go = () => (lives <= 0 ? finish(false) : nextRound());
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 2500);
    }
  }

  // Teclado físico: cifras, Backspace y Enter.
  const onKey = (e) => {
    if (finished) return;
    const k = /^\d$/.test(e.key) ? e.key : e.key === "Backspace" ? "⌫" : e.key === "Enter" ? "✓" : null;
    if (k) { e.preventDefault(); pressKey(k); }
  };
  window.addEventListener("keydown", onKey);

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "medidascomplejas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📏</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} medidas bien pasadas de ${rounds}</p>
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
