// "Las cintas": corta dos (o tres) cintas en trozos iguales lo más largos
// posible sin que sobre nada. Un deslizador (y − / +) fija el largo del
// trozo; las marcas de corte se redibujan en vivo y se ve si sobra; ✓.
// Bien si el largo es el mcd. Niveles: mcd ≤ 6 → hasta 60 cm → tres
// cintas → sin dibujo (teclado, mcd de dos números). 5º-1º ESO.
import { randInt, shuffle, saveScore } from "./utils.js";

const gcd2 = (a, b) => (b ? gcd2(b, a % b) : a);
export const gcd = (arr) => arr.reduce(gcd2);

// Nivel → { lengths, g (mcd), draw }. Los multiplicadores tienen mcd 1
// entre sí, así que el mcd de las cintas es exactamente g.
export function buildRound(level) {
  for (;;) {
    let g, mults, max, n = 2, draw = true;
    if (level === 0) { g = randInt(2, 6); mults = [randInt(2, 5), randInt(2, 5)]; max = 30; }
    else if (level === 1) { g = randInt(2, 15); mults = [randInt(2, 6), randInt(2, 6)]; max = 60; }
    else if (level === 2) { g = randInt(2, 10); mults = [randInt(2, 6), randInt(2, 6), randInt(2, 6)]; max = 60; n = 3; }
    else { g = randInt(2, 12); mults = [randInt(2, 7), randInt(2, 7)]; max = 84; draw = false; }
    if (new Set(mults).size !== n || gcd(mults) !== 1) continue;
    const lengths = shuffle(mults.map((m) => m * g));
    if (Math.max(...lengths) > max) continue;
    return { lengths, g, draw };
  }
}

const list = (arr) => arr.slice(0, -1).join(", ") + " y " + arr[arr.length - 1];

export function hintFor(r, k) {
  const L = r.lengths;
  const fits = L.map((l) => `${r.g} cabe ${l / r.g} veces en ${l}`).join(", ");
  if (k === r.g || k === undefined) return `${fits}, sin sobras: mcd(${L.join(", ")}) = ${r.g}`;
  const bad = L.filter((l) => l % k !== 0);
  if (bad.length) return `${list(L)} no se pueden cortar en ${k}: en ${bad[0]} sobra ${bad[0] % k}. El trozo más largo sin sobras es ${r.g}: ${fits}`;
  return `${k} cabe sin sobras, pero hay un trozo más largo: ${r.g} (${fits})`;
}

export function mountCintasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let hits = 0;
  let finished = false;
  let busy = false;
  let pending = null;
  let round = null;
  let k = 1; // largo del trozo elegido
  let typed = "";

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body cn2-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    round = buildRound(Math.min(3, Math.floor(hits / 3)));
    k = 1;
    typed = "";
    busy = false;
    const L = round.lengths;
    const prompt = `<p class="prompt cn2-prompt">Corta las cintas (${list(L.map((l) => `${l} cm`))}) en trozos iguales
      <small>Lo más largos posible, sin que sobre nada</small></p>`;
    if (!round.draw) {
      body.innerHTML = `${prompt}
        <div class="keypad-display cn2-display" data-display>_ cm</div>
        <div class="keypad cn2-keypad" data-keypad></div>
        <div class="feedback" data-feedback></div>`;
      const pad = body.querySelector("[data-keypad]");
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
        const btn = document.createElement("button");
        btn.className = `choice-btn keypad-key${key === "✓" ? " primary" : ""}`;
        btn.textContent = key;
        btn.addEventListener("click", () => pressKey(key));
        pad.appendChild(btn);
      });
      return;
    }
    const maxK = Math.min(...L);
    body.innerHTML = `${prompt}
      <div class="cn2-ribbons" data-ribbons></div>
      <div class="cn2-size">Trozo: <b data-k>1</b> cm</div>
      <div class="cn2-ctrl">
        <button type="button" class="cn2-step" data-minus>−</button>
        <input type="range" class="cn2-range" min="1" max="${maxK}" value="1" data-range aria-label="Largo del trozo" />
        <button type="button" class="cn2-step" data-plus>+</button>
      </div>
      <button type="button" class="primary cn2-check" data-check>✓</button>
      <div class="feedback" data-feedback></div>`;
    body.querySelector("[data-minus]").addEventListener("click", () => setK(k - 1));
    body.querySelector("[data-plus]").addEventListener("click", () => setK(k + 1));
    body.querySelector("[data-range]").addEventListener("input", (e) => setK(Number(e.target.value)));
    body.querySelector("[data-check]").addEventListener("click", () => check(k));
    drawRibbons(k, "on");
  }

  function setK(v) {
    if (busy || finished) return;
    k = Math.max(1, Math.min(Math.min(...round.lengths), v));
    body.querySelector("[data-range]").value = k;
    body.querySelector("[data-k]").textContent = k;
    drawRibbons(k, "on");
  }

  // Cada cinta a escala; trozos de largo `size` y, si sobra, un resto rojo.
  function drawRibbons(size, cls) {
    const maxL = Math.max(...round.lengths);
    body.querySelector("[data-ribbons]").innerHTML = round.lengths
      .map((l) => {
        const q = Math.floor(l / size);
        const rest = l % size;
        const pieces = Array.from({ length: q }, () => `<i class="cn2-piece ${cls}" style="flex:${size}"></i>`).join("");
        const restHtml = rest ? `<i class="cn2-piece rest" style="flex:${rest}">${rest}</i>` : "";
        return `<div class="cn2-row"><span class="cn2-len">${l} cm</span>
          <div class="cn2-ribbon" style="width:${(100 * l) / maxL}%" data-ribbon>${pieces}${restHtml}</div>
          <span class="cn2-note ${rest ? "bad" : ""}" data-note>${rest ? `sobra ${rest}` : `${q} trozos`}</span></div>`;
      })
      .join("");
  }

  function pressKey(key) {
    if (busy || finished) return;
    if (key === "✓") return typed !== "" && check(Number(typed));
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (typed.length < 2) typed += key;
    body.querySelector("[data-display]").textContent = `${typed || "_"} cm`;
  }

  function check(value) {
    if (busy || finished) return;
    busy = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const tip = `<span class="cn2-tip">💡 ${hintFor(round, value)}</span>`;
    if (value === round.g) {
      score += 10;
      hits++;
      renderScore();
      feedback.innerHTML = `¡Bien! Trozos de ${round.g} cm ${tip}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
      return;
    }
    lives--;
    renderLives();
    // Lo correcto en verde sobre el propio dibujo.
    if (round.draw) {
      drawRibbons(round.g, "good");
      body.querySelector("[data-k]").textContent = round.g;
      body.querySelector("[data-range]").value = round.g;
    }
    feedback.innerHTML = `Eran trozos de ${round.g} cm, no de ${value} ${tip}`;
    feedback.className = "feedback bad";
    pending = setTimeout(() => (lives <= 0 ? finish(false) : nextRound()), 2200);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "cintas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎀</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} cortes perfectos</p>
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
