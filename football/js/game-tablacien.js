// "La tabla del 100": la tabla de 10×10 del aula (1 arriba a la izquierda)
// con 1-3 casillas en blanco. Para que quepa en el móvil se ve solo un
// bloque de 5 filas: la de arriba y la de abajo son contexto (más tenues)
// y los huecos están en las tres del medio, así siempre se ve el número
// de encima. Se toca un hueco, se escribe el número y el foco salta al
// siguiente hueco; ✓ corrige. 💡 "A la derecha se suma 1, hacia abajo se
// suma 10: 47 está debajo del 37".
import { randInt, saveScore } from "./utils.js";

// Niveles: 0 un hueco con vecinos visibles · 1 dos huecos · 2 tres huecos
// con algunos vecinos de al lado también tapados (hay que usar la fila de
// arriba) · 3 la tabla del 101 al 200 (dos huecos).
export function buildRound(level) {
  const base = level === 3 ? 100 : 0;
  const r0 = randInt(0, 5); // primera fila del bloque (filas r0..r0+4 de la tabla)
  const nGaps = [1, 2, 3, 2][level];
  const kind = Array(50).fill("num");
  const gaps = [];
  while (gaps.length < nGaps) {
    const r = randInt(1, 3), c = randInt(0, 9), i = r * 10 + c;
    // Nunca dos huecos uno encima de otro: el de arriba debe verse para explicar.
    if (kind[i] !== "num" || kind[i - 10] === "gap" || kind[i + 10] === "gap") continue;
    kind[i] = "gap";
    gaps.push(i);
  }
  gaps.sort((a, b) => a - b); // orden de lectura: de izquierda a derecha y de arriba abajo
  if (level === 2) {
    // Se tapan vecinos de al lado (izquierda/derecha) que no sean el de encima o debajo de un hueco.
    const cand = [];
    for (const g of gaps) for (const d of [-1, 1]) {
      const j = g + d;
      if (Math.floor(j / 10) !== Math.floor(g / 10) || kind[j] !== "num") continue;
      if (gaps.some((h) => h - 10 === j || h + 10 === j)) continue;
      if (!cand.includes(j)) cand.push(j);
    }
    const nHide = Math.min(cand.length, randInt(2, 4));
    for (let k = 0; k < nHide; k++) kind[cand.splice(randInt(0, cand.length - 1), 1)[0]] = "hidden";
  }
  const value = (i) => base + (r0 + Math.floor(i / 10)) * 10 + (i % 10) + 1;
  const cells = kind.map((k, i) => ({ v: value(i), kind: k, ctx: i < 10 || i >= 40 }));
  const hint = `A la derecha se suma 1, hacia abajo se suma 10: ${gaps.map((g) => `${value(g)} está debajo del ${value(g) - 10}`).join("; ")}`;
  return { base, r0, cells, gaps, digits: base ? 3 : 2, hint };
}

export function mountTablacienGame(container, { client, onExit }) {
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
    <div class="game-body tc-body" data-body></div>
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
    round = buildRound(Math.min(3, Math.floor(hits / 3)));
    typed = round.gaps.map(() => "");
    active = 0;
    busy = false;
    const cell = (c, i) => {
      if (c.kind === "gap") return `<button type="button" class="tc-slot" data-g="${round.gaps.indexOf(i)}"></button>`;
      if (c.kind === "hidden") return `<span class="tc-cell tc-hidden" data-h="${i}"></span>`;
      return `<span class="tc-cell${c.ctx ? " tc-ctx" : ""}">${c.v}</span>`;
    };
    body.innerHTML = `
      <p class="prompt tc-prompt">${round.base ? "La tabla del 101 al 200" : "La tabla del 100"}: ${round.gaps.length === 1 ? "¿qué número falta?" : "¿qué números faltan?"}</p>
      <div class="tc-cuaderno">
        <div class="tc-grid" data-grid>${round.cells.map(cell).join("")}</div>
        <div class="tc-legend"><span>→ se suma 1</span><span>↓ se suma 10</span></div>
      </div>
      <div class="keypad tc-keypad" data-keypad></div>
      <div class="feedback tc-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-g]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.g), paint())));
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
    body.querySelectorAll("[data-g]").forEach((b) => {
      b.textContent = typed[+b.dataset.g];
      b.classList.toggle("active", +b.dataset.g === active);
    });
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    if (key === "⌫") typed[active] = typed[active].slice(0, -1);
    else if (typed[active].length < round.digits) {
      typed[active] += key;
      // Con el número completo el foco salta al siguiente hueco vacío (orden de lectura).
      if (typed[active].length === round.digits) {
        const next = typed.findIndex((t, i) => i > active && t === "");
        if (next !== -1) active = next;
      }
    }
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const empty = typed.findIndex((t) => t === "");
    if (empty !== -1) {
      active = empty;
      paint();
      feedback.textContent = round.gaps.length === 1 ? "Escribe el número que falta" : "Falta algún hueco por rellenar";
      feedback.className = "feedback bad";
      return;
    }
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-g]").forEach((b) => {
      const g = +b.dataset.g, want = round.cells[round.gaps[g]].v;
      const ok = Number(typed[g]) === want;
      allOk = allOk && ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${typed[g]}</s><em>${want}</em>`;
    });
    // Los vecinos tapados se destapan para que se vea la tabla entera.
    body.querySelectorAll("[data-h]").forEach((c) => ((c.textContent = round.cells[+c.dataset.h].v), c.classList.remove("tc-hidden")));
    const answers = round.gaps.map((g) => round.cells[g].v).join(", ");
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${answers}. 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Era ${answers}. 💡 ${round.hint}`;
      feedback.className = "feedback bad";
      const nxt = document.createElement("button");
      nxt.type = "button";
      nxt.className = "secondary tc-next";
      nxt.textContent = "Siguiente →";
      nxt.addEventListener("click", advance);
      body.querySelector("[data-keypad]").replaceWith(nxt);
      pending = setTimeout(advance, 2500);
    }
  }

  function advance() {
    if (finished) return;
    clearTimeout(pending);
    lives <= 0 ? finish(false) : nextRound();
  }

  // Teclado físico: cifras, retroceso y Enter.
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
    saveScore(client, "tablacien", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>💯</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} tablas completadas de ${rounds}</p>
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
