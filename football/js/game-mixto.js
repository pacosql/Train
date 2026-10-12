// "Número mixto": como en el libro de 5.º-1.º ESO. "7/3 = □ □/□" con las
// tartas dibujadas (2 enteras y 1/3) y al lado la caja pequeña de la
// división española 7 | 3, donde el cociente y el resto se van escribiendo
// a la vez que el entero y el numerador. La inversa: "2 1/3 = □/3".
// Se rellena con el teclado; el foco va entero → numerador → denominador.
import { randInt, saveScore } from "./utils.js";

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

// Niveles: 0 hasta 10 · 1 hasta 30 · 2 inversa (mixto → fracción) ·
// 3 sin dibujo, mezclando las dos direcciones.
export function buildRound(level, turn = 0) {
  const inverse = level === 2 || (level === 3 && turn % 2 === 1);
  let n, d;
  if (inverse) {
    d = randInt(2, level === 3 ? 9 : 6);
    const w = randInt(1, level === 3 ? 5 : 4);
    let r;
    do r = randInt(1, d - 1); while (gcd(r, d) !== 1); // 2 1/3 sí, 2 2/4 no (sin simplificar)
    n = w * d + r;
  } else {
    const max = level === 0 ? 10 : level === 1 ? 30 : 50;
    do { d = randInt(2, level === 0 ? 5 : 9); n = randInt(d + 1, max); } while (gcd(n, d) !== 1); // irreducible: el resto queda ya simplificado
  }
  const q = Math.floor(n / d), r = n % d;
  const ent = q === 1 ? "entero" : "enteros";
  const hint = inverse
    ? `Cada entero son ${d}/${d}: ${q} × ${d} + ${r} = ${n} → ${n}/${d}`
    : `${n} ÷ ${d} = ${q} y sobra ${r}: ${q} ${ent} y ${r}/${d}. El cociente es el entero, el resto el numerador y el divisor se queda abajo`;
  const slots = inverse
    ? [{ k: "n", want: n, len: 2 }]
    : [{ k: "w", want: q, len: String(Math.floor((level === 0 ? 10 : level === 1 ? 30 : 50) / 2)).length }, { k: "r", want: r, len: 1 }, { k: "d", want: d, len: 1 }];
  const draw = level < 3 && Math.ceil(n / d) <= 6;
  return { inverse, n, d, q, r, slots, draw, hint };
}

export function mountMixtoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, active, busy, turn = 0;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body mx-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  // Tartas: tantas como hagan falta, cada una en d trozos; n trozos pintados.
  function tarts() {
    const { n, d } = round, count = Math.ceil(n / d), R = 24, step = 56;
    let out = "";
    for (let t = 0; t < count; t++) {
      const cx = t * step + R + 3, cy = R + 3;
      for (let i = 0; i < d; i++) {
        const a0 = (2 * Math.PI * i) / d - Math.PI / 2, a1 = (2 * Math.PI * (i + 1)) / d - Math.PI / 2;
        const pt = (a) => `${(cx + R * Math.cos(a)).toFixed(2)} ${(cy + R * Math.sin(a)).toFixed(2)}`;
        out += `<path class="mx-slice${t * d + i < n ? " on" : ""}" d="M${cx} ${cy} L${pt(a0)} A${R} ${R} 0 0 1 ${pt(a1)} Z"/>`;
      }
    }
    return `<svg class="mx-tarts" viewBox="0 0 ${count * step} ${2 * R + 6}" style="max-width:${count * step}px">${out}</svg>`;
  }
  const frac = (a, b) => `<span class="mx-frac"><span>${a}</span><span>${b}</span></span>`;
  const slot = (k) => `<button type="button" class="mx-slot" data-slot="${k}" aria-label="${k}"></button>`;

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    const last = round && `${round.n}/${round.d}`;
    do round = buildRound(Math.min(3, Math.floor(hits / 3)), turn); while (`${round.n}/${round.d}` === last);
    turn++;
    typed = Object.fromEntries(round.slots.map((s) => [s.k, ""]));
    active = round.slots[0].k;
    busy = false;
    const { n, d, q, r } = round;
    const sheet = round.inverse
      ? `<div class="mx-row"><span class="mx-whole">${q}</span>${frac(r, d)}<span class="mx-eq">=</span><span class="mx-frac">${slot("n")}<span>${d}</span></span></div>`
      : `<div class="mx-row">${frac(n, d)}<span class="mx-eq">=</span><span class="mx-wslot">${slot("w")}</span><span class="mx-frac">${slot("r")}${slot("d")}</span>
           <div class="mx-caja" aria-label="división"><span class="mx-dvd">${n}</span><span class="mx-dvs">${d}</span><span class="mx-res" data-mirror="r"></span><span class="mx-coc" data-mirror="w"></span></div></div>`;
    body.innerHTML = `
      <p class="prompt mx-prompt">${round.inverse ? "Pásalo a fracción" : "Escríbelo como número mixto"}</p>
      <div class="mx-cuaderno">
        ${sheet}
        ${round.draw ? tarts() : ""}
        <div class="mx-after" data-after></div>
      </div>
      <div class="keypad mx-keypad" data-keypad></div>
      <div class="feedback mx-feedback" data-feedback></div>`;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = b.dataset.slot), paint())));
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
      b.textContent = typed[b.dataset.slot];
      b.classList.toggle("active", b.dataset.slot === active);
    });
    // la caja de dividir copia el entero (cociente) y el numerador (resto)
    body.querySelectorAll("[data-mirror]").forEach((m) => (m.textContent = typed[m.dataset.mirror] || " "));
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    const s = round.slots.find((x) => x.k === active);
    if (key === "⌫") typed[active] = typed[active].slice(0, -1);
    else if (typed[active].length < Math.max(s.len, 2)) {
      typed[active] += key;
      const nextEmpty = round.slots.find((x) => typed[x.k] === "");
      if (typed[active].length >= s.len && nextEmpty && round.slots.length > 1) active = nextEmpty.k;
    }
    paint();
  }

  function check() {
    if (finished || busy) return;
    const feedback = body.querySelector("[data-feedback]");
    const empty = round.slots.find((s) => typed[s.k] === "");
    if (empty) {
      const wasEmpty = typed[active] === "";
      active = empty.k;
      paint();
      if (wasEmpty) { feedback.textContent = "Rellena todas las casillas"; feedback.className = "feedback bad"; }
      return;
    }
    busy = true;
    rounds++;
    let ok = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const s = round.slots.find((x) => x.k === b.dataset.slot);
      const good = Number(typed[s.k]) === s.want;
      ok = ok && good;
      b.classList.remove("active");
      b.classList.add(good ? "good" : "bad");
      if (!good) b.innerHTML = `<s>${typed[s.k]}</s><em>${s.want}</em>`;
    });
    body.querySelectorAll("[data-mirror]").forEach((m) => (m.textContent = m.dataset.mirror === "w" ? round.q : round.r));
    const { n, d, q, r } = round;
    body.querySelector("[data-after]").textContent = round.inverse ? `${q} × ${d} + ${r} = ${n}` : `${n} ÷ ${d} = ${q}, resto ${r}`;
    const shown = `${n}/${d} = ${q} ${r}/${d}`;
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${shown}. 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Era ${shown}. 💡 ${round.hint}`;
      feedback.className = "feedback bad";
      const nxt = document.createElement("button");
      nxt.type = "button";
      nxt.className = "secondary mx-next";
      nxt.textContent = "Siguiente →";
      nxt.addEventListener("click", advance);
      body.querySelector("[data-keypad]").replaceWith(nxt);
      pending = setTimeout(advance, 2500);
    }
  }

  // Tras un fallo: fin si no quedan vidas; si no, otra ronda.
  function advance() {
    if (finished) return;
    clearTimeout(pending);
    lives <= 0 ? finish(false) : nextRound();
  }

  // Teclado físico: cifras, retroceso y Enter, igual que el de pantalla.
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
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "mixto", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🥧</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} números mixtos bien de ${rounds}</p>
        <div class="end-actions">
          <button class="primary" data-retry>Jugar otra vez</button>
          <button class="secondary" data-menu>Volver al menú</button>
        </div>
      </div>`;
    body.querySelector("[data-retry]").addEventListener("click", start);
    body.querySelector("[data-menu]").addEventListener("click", onExit);
  }

  function start() {
    lives = startLives;
    score = 0;
    rounds = 0;
    hits = 0;
    turn = 0;
    round = null;
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
