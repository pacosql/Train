// "El triángulo de Pascal": el triángulo dibujado en la hoja cuadriculada,
// con los ladrillos escalonados como en el libro y algunas casillas vacías.
// Cada número es la suma de los dos que tiene encima. Niveles: huecos en
// las filas 3-4 → filas 5-6 → fila 7 → "¿cuánto suma la fila n?" (2ⁿ) →
// los coeficientes de (a + b)ⁿ sacados de la fila n.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const SUP = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
export const tri = (rows) => {
  const t = [[1]];
  for (let r = 1; r < rows; r++) t.push(Array.from({ length: r + 1 }, (_, k) => (k === 0 || k === r ? 1 : t[r - 1][k - 1] + t[r - 1][k])));
  return t;
};
const interior = (r) => Array.from({ length: r - 1 }, (_, i) => [r, i + 1]);
// Un término de (a + b)ⁿ sin coeficiente: aⁿ⁻ⁱ bⁱ con la x en cursiva
const term = (n, i) => (n - i ? `<i>a</i>${n - i > 1 ? SUP[n - i] : ""}` : "") + (i ? `<i>b</i>${i > 1 ? SUP[i] : ""}` : "");

// Niveles: 0 huecos filas 3-4 · 1 filas 5-6 · 2 fila 7 · 3 suma de una fila · 4 (a + b)ⁿ
export function buildRound(level) {
  if (level >= 5) level = randInt(1, 4);
  if (level <= 2) {
    const rows = [5, 7, 8][level];
    const t = tri(rows);
    let cand = level === 0 ? [...interior(3), ...interior(4)] : level === 1 ? [...interior(5), ...interior(6)] : interior(7);
    let holes = shuffle(cand).slice(0, level === 0 ? randInt(1, 2) : randInt(2, 3));
    if (level === 2 && Math.random() < 0.5) holes.push(pick(interior(6)));
    holes.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const ans = holes.map(([r, k]) => t[r][k]);
    const why = holes.map(([r, k]) => `${t[r - 1][k - 1]} + ${t[r - 1][k]} = ${t[r][k]}`);
    return { level, kind: "holes", t, holes, ans, prompt: "Completa el triángulo de Pascal", hint: `Cada número es la suma de los dos de arriba: ${why.join(" · ")}` };
  }
  if (level === 3) {
    const n = randInt(4, 6);
    const t = tri(n + 1);
    return { level, kind: "sum", t, n, holes: [], ans: [2 ** n], prompt: `¿Cuánto suma la fila ${n}?`,
      hint: `${t[n].join(" + ")} = ${2 ** n} = 2${SUP[n]}: cada fila suma el doble que la de arriba (${2 ** (n - 1)} × 2)` };
  }
  const n = pick([2, 3, 3, 4]);
  const t = tri(6);
  const ans = t[n].slice(1, -1);
  const full = t[n].map((c, i) => (c > 1 ? c : "") + term(n, i)).join(" + ");
  return { level, kind: "binom", t, n, holes: [], ans, prompt: `Desarrolla (<i>a</i> + <i>b</i>)${SUP[n]} con el triángulo`,
    hint: `(a + b)${SUP[n]} sale de la fila ${n}: ${t[n].join(" ")} → ${full.replace(/<\/?i>/g, "")}` };
}

export function mountPascalGame(container, { client, onExit }) {
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
    <div class="game-body pc2-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const slot = (i) => `<button type="button" class="pc2-slot" data-slot="${i}"></button>`;

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.floor(hits / 2));
    typed = round.ans.map(() => "");
    active = 0;
    busy = false;
    const { t } = round;
    const holeIdx = (r, k) => round.holes.findIndex(([hr, hk]) => hr === r && hk === k);
    // Cada fila es una tira de ladrillos centrada: así cada número queda
    // justo debajo de los dos que suma.
    const rowsHTML = t.map((row, r) => {
      const cells = row.map((v, k) => {
        const h = holeIdx(r, k);
        return h >= 0 ? slot(h) : `<span class="pc2-cell" data-v="${v}">${v}</span>`;
      }).join("");
      const sum = round.kind === "sum" ? `<span class="pc2-sum">${r < round.n ? `= ${2 ** r}` : `= ${slot(0)}`}</span>` : "";
      const hl = round.kind === "sum" && r === round.n ? " pc2-hl" : "";
      return `<div class="pc2-row${hl}"><span class="pc2-lab">${r}</span><div class="pc2-bricks">${cells}</div>${sum}</div>`;
    }).join("");
    let extra = "";
    if (round.kind === "binom") {
      const { n } = round;
      const terms = t[n].map((c, i) => (i === 0 || i === n ? "" : slot(i - 1)) + `<span class="pc2-t">${term(n, i)}</span>`);
      extra = `<div class="pc2-binom"><span>(<i>a</i> + <i>b</i>)${SUP[n]} =</span> ${terms.join(" + ")}</div>`;
    }
    body.innerHTML = `
      <p class="prompt pc2-prompt">${round.prompt}</p>
      <div class="pc2-cuaderno${round.kind === "sum" ? " pc2-narrow" : ""}">
        <div class="pc2-tri">${rowsHTML}</div>${extra}
      </div>
      <div class="keypad pc2-keypad" data-keypad></div>
      <div class="feedback pc2-feedback" data-feedback></div>
      <button type="button" class="secondary pc2-next" data-next>Siguiente →</button>
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
    if (key === "✓") return check();
    if (key === "⌫") typed[active] = typed[active].slice(0, -1);
    else if (typed[active].length < 3) typed[active] = (typed[active] + key).replace(/^0+(?=\d)/, "");
    paint();
  }

  function check() {
    const fb = body.querySelector("[data-feedback]");
    // ✓ con huecos vacíos: el foco pasa al siguiente hueco (de arriba abajo, de izquierda a derecha).
    if (typed.some((x) => x === "")) {
      const after = typed.findIndex((x, i) => x === "" && i > active);
      active = after >= 0 ? after : typed.indexOf("");
      paint();
      fb.textContent = "";
      return;
    }
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const i = +b.dataset.slot, want = round.ans[i];
      const ok = Number(typed[i]) === want;
      allOk = allOk && ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${typed[i]}</s>${want}`;
    });
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      fb.textContent = `✓ 💡 ${round.hint}`;
      fb.className = "feedback pc2-feedback ok";
      pending = setTimeout(nextRound, 1000);
    } else {
      lives--;
      renderLives();
      fb.textContent = `✗ 💡 ${round.hint}`;
      fb.className = "feedback pc2-feedback bad";
      const nb = body.querySelector("[data-next]");
      nb.classList.add("show");
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      nb.onclick = go;
      pending = setTimeout(go, 2600);
    }
  }

  // Teclado físico: cifras, retroceso y Enter hacen lo mismo que el teclado en pantalla.
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
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "pascal", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔺</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} triángulos completados de ${rounds}</p>
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
