// "Puzle numérico": una igualdad con huecos y una bandeja de piezas.
// Con dos huecos solo puede existir UNA pareja de piezas válida, si no
// la ronda tendría dos soluciones distintas igual de correctas.
import { randInt, pick, shuffle, clamp, buildChoices, saveScore } from "./utils.js";

const PIECES = 5;

function compute(a, sym, b) {
  if (sym === "+") return a + b;
  if (sym === "−") return a - b;
  return a * b;
}

// Un hueco: la respuesta es única porque todas las piezas son distintas.
function buildOneHole() {
  const sym = pick(["+", "−", "×"]);
  let a, b;
  if (sym === "+") {
    a = randInt(2, 30);
    b = randInt(2, 30);
  } else if (sym === "−") {
    a = randInt(10, 40);
    b = randInt(2, a - 1);
  } else {
    a = randInt(2, 9);
    b = randInt(2, 9);
  }
  const target = compute(a, sym, b);
  const hideLeft = Math.random() < 0.5;
  const answer = hideLeft ? a : b;
  let pieces;
  let guard = 0;
  do {
    pieces = buildChoices(answer, () => clamp(answer + randInt(-8, 8), 1, 99), PIECES);
    guard++;
  } while (pieces.length < PIECES && guard < 30);
  return {
    left: hideLeft ? null : a,
    right: hideLeft ? b : null,
    sym,
    target,
    pieces,
  };
}

// Dos huecos: solo con + y × (conmutativas), así cualquier orden de la
// pareja correcta vale y no hay que adivinar dónde va cada pieza.
function buildTwoHoles() {
  let a, b, sym, target, pieces;
  let guard = 0;
  do {
    guard++;
    sym = pick(["+", "×"]);
    if (sym === "+") {
      a = randInt(2, 20);
      b = randInt(2, 20);
    } else {
      a = randInt(2, 9);
      b = randInt(2, 9);
    }
    if (a === b) continue; // dos piezas iguales romperían la bandeja
    target = compute(a, sym, b);
    const set = new Set([a, b]);
    let g2 = 0;
    while (set.size < PIECES && g2 < 120) {
      set.add(sym === "+" ? randInt(1, Math.max(target - 1, 2)) : randInt(2, 12));
      g2++;
    }
    if (set.size < PIECES) continue;
    const arr = Array.from(set);
    // Cuenta cuántas parejas distintas resuelven la igualdad: debe ser 1.
    let solutions = 0;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (compute(arr[i], sym, arr[j]) === target) solutions++;
      }
    }
    if (solutions !== 1) continue;
    pieces = shuffle(arr);
  } while (!pieces && guard < 200);
  if (!pieces) return buildOneHole(); // salida segura, nunca sin ronda
  return { left: null, right: null, sym, target, pieces };
}

export function mountPuzleGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let slots = [];
  let tray = [];
  let checking = false;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");

  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function nextRound() {
    if (finished) return;
    checking = false;
    round = Math.random() < 0.5 ? buildOneHole() : buildTwoHoles();
    slots = [];
    if (round.left === null) slots.push({ side: "left", value: null });
    if (round.right === null) slots.push({ side: "right", value: null });
    tray = round.pieces.map((v) => ({ value: v, used: false }));
    // Con un solo hueco la comprobación salta al colocar la pieza, así
    // que el aviso de "sacar la pieza" solo vale para dos huecos.
    const hint =
      slots.length === 2
        ? "Coloca dos piezas; toca un hueco lleno para vaciarlo"
        : "Toca la pieza que encaja en el hueco";
    body.innerHTML = `
      <p class="prompt">Completa la igualdad<small>${hint}</small></p>
      <div class="puz-eq" data-eq></div>
      <div class="puz-tray" data-tray></div>
      <div class="feedback" data-feedback></div>
    `;
    renderBoard();
  }

  function slotFor(side) {
    return slots.find((s) => s.side === side);
  }

  function renderBoard() {
    const eq = body.querySelector("[data-eq]");
    const trayEl = body.querySelector("[data-tray]");
    eq.innerHTML = "";
    trayEl.innerHTML = "";

    const addToken = (text) => {
      const span = document.createElement("span");
      span.className = "puz-token";
      span.textContent = text;
      eq.appendChild(span);
    };
    const addSlot = (side) => {
      const slot = slotFor(side);
      const btn = document.createElement("button");
      btn.className = "puz-hole" + (slot.value !== null ? " filled" : "");
      btn.textContent = slot.value !== null ? slot.value : "?";
      btn.addEventListener("click", () => removeFromSlot(slot));
      eq.appendChild(btn);
    };

    if (round.left === null) addSlot("left");
    else addToken(round.left);
    addToken(round.sym);
    if (round.right === null) addSlot("right");
    else addToken(round.right);
    addToken("=");
    addToken(round.target);

    tray.forEach((piece, i) => {
      const btn = document.createElement("button");
      btn.className = "puz-piece" + (piece.used ? " used" : "");
      btn.textContent = piece.value;
      btn.disabled = piece.used;
      btn.addEventListener("click", () => placePiece(i));
      trayEl.appendChild(btn);
    });
  }

  function placePiece(i) {
    if (finished || checking) return;
    const piece = tray[i];
    if (piece.used) return;
    const slot = slots.find((s) => s.value === null);
    if (!slot) return;
    slot.value = piece.value;
    slot.pieceIndex = i;
    piece.used = true;
    renderBoard();
    if (slots.every((s) => s.value !== null)) {
      checking = true;
      setTimeout(check, 350);
    }
  }

  function removeFromSlot(slot) {
    if (finished || checking || slot.value === null) return;
    tray[slot.pieceIndex].used = false;
    slot.value = null;
    slot.pieceIndex = undefined;
    renderBoard();
  }

  function check() {
    if (finished) return;
    rounds++;
    const a = round.left !== null ? round.left : slotFor("left").value;
    const b = round.right !== null ? round.right : slotFor("right").value;
    const feedback = body.querySelector("[data-feedback]");
    const ok = compute(a, round.sym, b) === round.target;
    body.querySelectorAll(".puz-hole").forEach((h) => h.classList.add(ok ? "correct" : "wrong"));
    if (ok) {
      score += 10;
      renderScore();
      feedback.textContent = "¡Encaja!";
      feedback.className = "feedback ok";
      setTimeout(nextRound, 750);
    } else {
      lives--;
      renderLives();
      feedback.textContent = "Así no sale…";
      feedback.className = "feedback bad";
      if (lives <= 0) return setTimeout(() => finish(false), 600);
      setTimeout(() => {
        if (finished) return;
        slots.forEach((s) => {
          if (s.pieceIndex !== undefined) tray[s.pieceIndex].used = false;
          s.value = null;
          s.pieceIndex = undefined;
        });
        checking = false;
        renderBoard();
        feedback.textContent = "Prueba otra vez";
        feedback.className = "feedback bad";
      }, 700);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "puzle", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧩</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} igualdades completadas</p>
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
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
  };
}
