// "Los primeros múltiplos": "Escribe los 5 primeros múltiplos de 7" con
// cinco casillas en fila sobre papel cuadriculado, como la tabla del
// cuaderno. Se escriben en orden con el teclado (el foco avanza solo). En
// niveles altos: "los múltiplos de 6 entre 20 y 50" (tantas casillas como
// haya) y "el múltiplo de 8 más cercano a 50" (una casilla). El 💡 recita la
// tabla: "7 × 1, 7 × 2, … → 7, 14, 21, 28, 35".
import { randInt, saveScore } from "./utils.js";

const seq = (t, a, b) => { const r = []; for (let k = a; k <= b; k++) r.push(k * t); return r; };

// Niveles: 0 los 5 primeros (tablas del 2 al 10) · 1 tablas del 11 al 15 ·
// 2 los múltiplos entre dos números · 3 el múltiplo más cercano.
export function buildRound(level) {
  const L = Math.min(3, level);
  if (L <= 1) {
    const t = L ? randInt(11, 15) : randInt(2, 10), ans = seq(t, 1, 5);
    return { kind: "primeros", t, ans, ks: [1, 2, 3, 4, 5], level: L, prompt: `Escribe los 5 primeros múltiplos de <b>${t}</b>`,
      hint: `Múltiplos de ${t}: ${[1, 2, 3, 4, 5].map((k) => `${t} × ${k}`).join(", ")} → ${ans.join(", ")}` };
  }
  if (L === 2) {
    for (;;) {
      const t = randInt(3, 9), lo = randInt(10, 60), hi = lo + randInt(15, 35);
      // Los extremos no son múltiplos, para que "entre" no deje dudas.
      if (hi > 99 || lo % t === 0 || hi % t === 0) continue;
      const k0 = Math.floor(lo / t), k1 = Math.ceil(hi / t);
      const ans = seq(t, k0 + 1, k1 - 1);
      if (ans.length < 3 || ans.length > 5) continue;
      return { kind: "entre", t, lo, hi, ans, ks: ans.map((v) => v / t), level: L, prompt: `Múltiplos de <b>${t}</b> entre <b>${lo}</b> y <b>${hi}</b>`,
        hint: `Voy por la tabla del ${t}: ${seq(t, Math.max(1, k0), k1).join(", ")} → entre ${lo} y ${hi} están ${ans.join(", ")}` };
    }
  }
  for (;;) {
    const t = randInt(3, 12), n = randInt(10, 95);
    if (n % t === 0) continue;
    const k = Math.floor(n / t), below = k * t, above = below + t;
    if (n - below === above - n) continue; // empate: no habría respuesta única
    if (below === 0 || above > 99 || k + 1 > 12) continue; // dentro de las tablas y de dos cifras
    const ans = n - below < above - n ? below : above;
    return { kind: "cercano", t, n, ans: [ans], ks: [ans / t], below, above, level: L, prompt: `El múltiplo de <b>${t}</b> más cercano a <b>${n}</b>`,
      hint: `${n} está entre ${t} × ${k} = ${below} y ${t} × ${k + 1} = ${above}; ${n} − ${below} = ${n - below} y ${above} − ${n} = ${above - n} → el más cercano es ${ans}` };
  }
}

export function mountCincomultiplosGame(container, { client, onExit }) {
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
    <div class="game-body cm2-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const slots = () => body.querySelectorAll("[data-slot]");

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.floor(hits / 2));
    typed = round.ans.map(() => "");
    active = 0;
    busy = false;
    body.innerHTML = `
      <p class="prompt cm2-prompt">${round.prompt}</p>
      <div class="cm2-cuaderno">
        <div class="cm2-row" style="--cm2-n:${round.ans.length}">${round.ans
          .map((_, i) => `<button type="button" class="cm2-slot" data-slot="${i}"></button>`)
          .join("")}</div>
        <div class="cm2-row cm2-labels" style="--cm2-n:${round.ans.length}" data-labels>${round.ans
          .map(() => "<span></span>")
          .join("")}</div>
      </div>
      <div class="keypad cm2-keypad" data-keypad></div>
      <div class="feedback cm2-feedback" data-feedback></div>
    `;
    slots().forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
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
    slots().forEach((b, i) => {
      b.textContent = typed[i];
      b.classList.toggle("active", i === active);
    });
  }

  // Cada casilla admite tantas cifras como tiene su múltiplo; al llenarla el
  // foco salta a la siguiente vacía (de izquierda a derecha, como se escribe
  // la tabla). ✓ también salta si quedan huecos y corrige cuando no.
  function pressKey(key) {
    if (finished || busy) return;
    const empty = typed.map((t, i) => (t === "" ? i : -1)).filter((i) => i >= 0);
    if (key === "✓") {
      if (!empty.length) return check();
      if (typed[active] === "") {
        const fb = body.querySelector("[data-feedback]");
        fb.textContent = "Escribe un número en la casilla marcada";
        fb.className = "feedback bad";
      } else active = empty[0];
    } else if (key === "⌫") typed[active] = typed[active].slice(0, -1);
    else {
      const cap = String(round.ans[active]).length;
      typed[active] = typed[active] === "0" || typed[active].length >= cap ? key : typed[active] + key;
      const rest = empty.filter((i) => i !== active);
      if (typed[active].length >= cap && rest.length) active = rest.find((i) => i > active) ?? rest[0];
    }
    paint();
  }

  function check() {
    busy = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    let ok = true;
    slots().forEach((b, i) => {
      b.classList.remove("active");
      const good = Number(typed[i]) === round.ans[i];
      ok = ok && good;
      b.classList.add(good ? "good" : "bad");
      if (!good) b.innerHTML = `<s>${typed[i]}</s><em class="cm2-want">${round.ans[i]}</em>`;
    });
    // Debajo de cada casilla, la cuenta de la tabla: 7 × 1, 7 × 2…
    body.querySelectorAll("[data-labels] span").forEach((el, i) => (el.textContent = `${round.t}×${round.ks[i]}`));
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.innerHTML = `${round.ans.length > 1 ? "Eran" : "Era"} ${round.ans.join(", ")}. 💡 ${round.hint} <button type="button" class="cm2-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad";
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 2500);
    }
  }

  // Teclado físico: cifras, retroceso e Intro.
  const onKey = (e) => {
    if (finished || busy) return;
    if (/^\d$/.test(e.key)) pressKey(e.key);
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
    saveScore(client, "cincomultiplos", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>✖️</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} series de múltiplos bien de ${rounds}</p>
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
