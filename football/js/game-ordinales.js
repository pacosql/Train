// "Ordinales": una cola de animales (emojis) hacia una meta 🏁; el 1.º es
// el que está pegado a la meta. Dos rondas alternas: "Toca el que va 3.º"
// (se toca el animal) y "¿En qué posición va el 🐱?" (se escribe 1-10 con
// el teclado). Al responder, debajo de cada animal aparece su ordinal y
// el 💡 cuenta desde la meta: "1.º 🐶, 2.º 🐭, 3.º 🐱".
import { randInt, shuffle, saveScore } from "./utils.js";

const ANIMALS = ["🐶", "🐱", "🐭", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧"];
const ord = (n) => `${n}.º`;

// Niveles: 0 cola de 5-6 hasta el 5.º · 1 cola de 7-10 hasta el 10.º ·
// 2 la meta está a la izquierda · 3 "el último / el penúltimo" (meta a un lado u otro).
// `mode` fuerza el tipo de ronda ("tap" o "type"); si no, se elige al azar.
export function buildRound(level, mode) {
  const count = level === 0 ? randInt(5, 6) : randInt(7, 10);
  const metaRight = level === 2 ? false : level === 3 ? Math.random() < 0.5 : true;
  const queue = shuffle(ANIMALS).slice(0, count); // queue[0] es el 1.º (junto a la meta)
  mode = mode || (Math.random() < 0.5 ? "tap" : "type");
  let ask = null, pos, hint, prompt;
  if (level === 3 && mode === "tap") {
    ask = Math.random() < 0.5 ? "último" : "penúltimo";
    pos = ask === "último" ? count : count - 1;
    prompt = `Toca al <b>${ask}</b> de la cola`;
    hint = ask === "último"
      ? `El último es el que va más lejos de la meta: ${queue[pos - 1]}, el ${ord(count)} de ${count}`
      : `El penúltimo va justo delante del último (${queue[count - 1]}): ${queue[pos - 1]}, el ${ord(pos)} de ${count}`;
  } else {
    pos = randInt(1, level === 0 ? 5 : count);
    prompt = mode === "tap" ? `Toca el que va <b>${ord(pos)}</b>` : `¿En qué posición va el <b>${queue[pos - 1]}</b>?`;
    hint = `Contamos desde la meta: ${queue.slice(0, pos).map((a, i) => `${ord(i + 1)} ${a}`).join(", ")}`;
  }
  return { count, metaRight, queue, mode, ask, pos, animal: queue[pos - 1], prompt, hint };
}

export function mountOrdinalesGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, busy, posOf;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body or-body" data-body></div>
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
    round = buildRound(Math.min(3, Math.floor(hits / 3)), rounds % 2 === 0 ? "tap" : "type");
    typed = "";
    busy = false;
    // La cola se pinta de izquierda a derecha: con la meta a la derecha el
    // 1.º es el último dibujado; con la meta a la izquierda, el primero.
    const animal = (a, p) =>
      `<button type="button" class="or-animal${round.mode === "type" && p === round.pos ? " or-ask" : ""}" data-i="${round.metaRight ? round.count - p : p - 1}" aria-label="animal ${a}">
        <span class="or-emoji">${a}</span><span class="or-ord" data-ord></span></button>`;
    const items = round.queue.map((a, i) => animal(a, i + 1));
    const row = round.metaRight ? [...items.reverse(), `<span class="or-flag">🏁</span>`] : [`<span class="or-flag">🏁</span>`, ...items];
    // posición en la cola (1.º junto a la meta) a partir del índice visual
    posOf = (i) => (round.metaRight ? round.count - i : i + 1);
    body.innerHTML = `
      <p class="prompt or-prompt">${round.prompt}</p>
      <div class="or-cuaderno">
        <div class="or-track" data-track>${row.join("")}</div>
        <div class="or-ground"></div>
        ${round.mode === "type" ? `<div class="or-line"><span>Va en la posición</span><button type="button" class="or-slot active" data-slot></button></div>` : ""}
      </div>
      ${round.mode === "type" ? `<div class="keypad or-keypad" data-keypad></div>` : `<div class="or-tap">Toca un animal de la cola</div>`}
      <div class="feedback or-feedback" data-feedback></div>
    `;
    if (round.mode === "tap") {
      body.querySelectorAll("[data-i]").forEach((b) => b.addEventListener("click", () => !busy && check(posOf(+b.dataset.i))));
    } else {
      const pad = body.querySelector("[data-keypad]");
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `choice-btn keypad-key${key === "✓" ? " primary" : ""}`;
        btn.textContent = key;
        btn.addEventListener("click", () => pressKey(key));
        pad.appendChild(btn);
      });
    }
  }

  function pressKey(key) {
    if (finished || busy || round.mode !== "type") return;
    if (key === "✓") return typed === "" ? warn() : check(Number(typed));
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (typed.length < 2) typed += key;
    body.querySelector("[data-slot]").textContent = typed;
  }

  function warn() {
    const feedback = body.querySelector("[data-feedback]");
    feedback.textContent = "Escribe la posición (1, 2, 3…)";
    feedback.className = "feedback bad";
  }

  // `given` es la posición tocada (ronda de tocar) o escrita (ronda de teclado).
  function check(given) {
    busy = true;
    rounds++;
    const ok = given === round.pos;
    const feedback = body.querySelector("[data-feedback]");
    // Corrección dibujada: el ordinal bajo cada animal, el bueno en verde y el tocado en rojo.
    body.querySelectorAll("[data-i]").forEach((b) => {
      const p = posOf(+b.dataset.i);
      b.querySelector("[data-ord]").textContent = ord(p);
      b.classList.remove("or-ask");
      if (p === round.pos) b.classList.add("good");
      else if (round.mode === "tap" && p === given) b.classList.add("bad");
    });
    const slot = body.querySelector("[data-slot]");
    if (slot) {
      slot.classList.remove("active");
      slot.classList.add(ok ? "good" : "bad");
      slot.innerHTML = ok ? ord(given) : `<s>${given}</s><em>${ord(round.pos)}</em>`;
    }
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${round.animal} va ${ord(round.pos)}. 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Era ${round.animal}, el ${ord(round.pos)}. 💡 ${round.hint}`;
      feedback.className = "feedback bad";
      const nxt = document.createElement("button");
      nxt.type = "button";
      nxt.className = "secondary or-next";
      nxt.textContent = "Siguiente →";
      nxt.addEventListener("click", advance);
      (body.querySelector("[data-keypad]") || body.querySelector(".or-tap")).replaceWith(nxt);
      pending = setTimeout(advance, 2500);
    }
  }

  function advance() {
    if (finished) return;
    clearTimeout(pending);
    lives <= 0 ? finish(false) : nextRound();
  }

  // Teclado físico: cifras, retroceso y Enter (solo en rondas de escribir).
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
    saveScore(client, "ordinales", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🏁</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} posiciones bien de ${rounds}</p>
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
