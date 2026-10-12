// "Pinta la fracción": como en el libro, una figura partida en partes
// iguales (barra, círculo o rectángulo en cuadrícula) y "Pinta 3/5": se
// tocan las partes (se pintan / se despintan) y ✓. En algunas rondas,
// además, "y di qué otra fracción es": 2/4 = □/2 con el teclado. Las
// impropias (5/4) traen dos figuras. El 💡: "5 partes iguales, pinto 3: 3/5".
import { randInt, pick, saveScore } from "./utils.js";

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
// Rectángulo en cuadrícula: filas × columnas para p partes (null si no queda bonito)
const GRID = { 4: [2, 2], 6: [2, 3], 8: [2, 4], 9: [3, 3], 10: [2, 5], 12: [3, 4] };

// Niveles: 0 hasta 5 partes · 1 hasta 10 (en turnos impares, además □/k) ·
// 2 impropias con dos figuras · 3 equivalente escrita ("Pinta 2/3" en 6 partes, 2/3 = □/6).
export function buildRound(level, turn = 0) {
  let n, d, parts, figs = 1, eq = null, hint;
  if (level === 0) {
    d = randInt(2, 5); n = randInt(1, d - 1); parts = d;
    hint = `${d} partes iguales, pinto ${n}: ${n}/${d}. Abajo, en cuántas partes se parte; arriba, cuántas pinto`;
  } else if (level === 1 && turn % 2) {
    do { d = pick([4, 6, 8, 9, 10]); n = randInt(2, d - 1); } while (gcd(n, d) === 1);
    const g = gcd(n, d), divs = [];
    for (let x = 2; x <= g; x++) if (g % x === 0) divs.push(x);
    const j = pick(divs);
    parts = d;
    eq = { num: n / j, den: d / j };
    hint = `${d} partes, pinto ${n}: ${n}/${d}. Si junto las partes de ${j} en ${j}, quedan ${d / j} partes y ${n / j} pintadas: ${n}/${d} = ${n / j}/${d / j}`;
  } else if (level === 1) {
    d = randInt(6, 10); n = randInt(1, d - 1); parts = d;
    hint = `${d} partes iguales, pinto ${n}: ${n}/${d}`;
  } else if (level === 2) {
    d = randInt(2, 6); n = randInt(d + 1, 2 * d - 1); parts = d; figs = 2;
    hint = `Cada figura tiene ${d} partes: ${n}/${d} = ${d}/${d} (una figura entera) + ${n - d}/${d}. Pinto ${n} partes`;
  } else {
    let b, m;
    do { b = randInt(2, 6); m = randInt(2, 3); } while (b * m > 12);
    const a = randInt(1, b - 1);
    if (gcd(a, b) !== 1) return buildRound(level, turn);
    n = a; d = b; parts = b * m;
    eq = { num: a * m, den: b * m };
    const piece = { 2: "mitad", 3: "tercio", 4: "cuarto", 5: "quinto", 6: "sexto" }[b];
    hint = `La figura tiene ${b * m} partes: cada ${piece} está ${b === 2 ? "partida" : "partido"} en ${m}. Multiplico arriba y abajo por ${m}: ${a}/${b} = ${a * m}/${b * m}, pinto ${a * m}`;
  }
  const target = level === 3 ? eq.num : n;
  const shapes = ["bar", "circle"].concat(GRID[parts] && !(figs === 2 && parts > 6) ? ["grid"] : []);
  return { n, d, parts, figs, target, eq, shape: pick(shapes), hint };
}

export function mountPintafraccionGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, painted, typed, busy, turn = 0;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body pf-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  // Dibuja la(s) figura(s) en SVG; cada parte es un <path data-part="i"> que se toca.
  function figure() {
    const { parts: p, figs, shape } = round;
    const two = figs === 2, W = 300;
    let out = "", H;
    for (let f = 0; f < figs; f++) {
      const id = (i) => `data-part="${f * p + i}"`;
      if (shape === "bar") {
        const h = two ? 54 : 70, y = f * (h + 14);
        H = y + h;
        for (let i = 0; i < p; i++) out += `<rect class="pf-part" ${id(i)} x="${(i * W) / p}" y="${y}" width="${W / p}" height="${h}"/>`;
      } else if (shape === "circle") {
        const r = two ? 66 : 92, cx = two ? 75 + f * 150 : 150, cy = r + 4;
        H = 2 * r + 8;
        for (let i = 0; i < p; i++) {
          const a0 = (2 * Math.PI * i) / p - Math.PI / 2, a1 = (2 * Math.PI * (i + 1)) / p - Math.PI / 2;
          const pt = (a) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
          out += p === 1 ? "" : `<path class="pf-part" ${id(i)} d="M${cx} ${cy} L${pt(a0)} A${r} ${r} 0 0 1 ${pt(a1)} Z"/>`;
        }
      } else {
        const [rows, cols] = GRID[p], cw = two ? 140 / cols : 260 / cols, ch = Math.min(cw, two ? 60 : 56);
        const x0 = two ? 5 + f * 155 : (W - cw * cols) / 2;
        H = rows * ch;
        for (let i = 0; i < p; i++) out += `<rect class="pf-part" ${id(i)} x="${x0 + (i % cols) * cw}" y="${Math.floor(i / cols) * ch}" width="${cw}" height="${ch}"/>`;
      }
    }
    return `<svg class="pf-svg" viewBox="-3 -3 ${W + 6} ${H + 6}">${out}</svg>`;
  }

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    const last = round && `${round.n}/${round.d}/${round.parts}`;
    do round = buildRound(Math.min(3, Math.floor(hits / 3)), turn); while (`${round.n}/${round.d}/${round.parts}` === last);
    turn++;
    painted = new Set();
    typed = "";
    busy = false;
    const { n, d, eq } = round;
    const frac = (a, b) => `<span class="pf-frac"><span>${a}</span><span>${b}</span></span>`;
    const eqLine = eq
      ? `<div class="pf-eq">${frac(n, d)}<span>=</span><span class="pf-frac"><button type="button" class="pf-slot active" data-slot></button><span>${eq.den}</span></span></div>`
      : "";
    body.innerHTML = `
      <p class="prompt pf-prompt">Pinta ${frac(n, d)}${eq ? " y completa" : ""}</p>
      <div class="pf-cuaderno">
        ${figure()}
        <div class="pf-count" data-count></div>
        ${eqLine}
      </div>
      ${eq ? `<div class="keypad pf-keypad" data-keypad></div>` : `<button type="button" class="primary pf-ok" data-keypad data-ok>✓ Comprobar</button>`}
      <div class="feedback pf-feedback" data-feedback></div>`;
    body.querySelectorAll("[data-part]").forEach((el) =>
      el.addEventListener("click", () => {
        if (busy) return;
        const i = +el.dataset.part;
        painted.has(i) ? painted.delete(i) : painted.add(i);
        paint();
      })
    );
    if (eq) {
      const pad = body.querySelector("[data-keypad]");
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `choice-btn keypad-key${key === "✓" ? " primary" : ""}`;
        btn.textContent = key;
        btn.addEventListener("click", () => pressKey(key));
        pad.appendChild(btn);
      });
    } else body.querySelector("[data-ok]").addEventListener("click", check);
    paint();
  }

  function paint() {
    body.querySelectorAll("[data-part]").forEach((el) => el.classList.toggle("on", painted.has(+el.dataset.part)));
    body.querySelector("[data-count]").textContent = `Pintadas: ${painted.size} de ${round.parts * round.figs}`;
    const slot = body.querySelector("[data-slot]");
    if (slot) slot.textContent = typed;
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    if (!round.eq) return;
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (typed.length < 2) typed += key;
    paint();
  }

  function check() {
    if (finished || busy) return;
    const feedback = body.querySelector("[data-feedback]");
    if (painted.size === 0) { feedback.textContent = "Toca las partes para pintarlas"; feedback.className = "feedback bad"; return; }
    if (round.eq && typed === "") { feedback.textContent = "Escribe el numerador que falta"; feedback.className = "feedback bad"; return; }
    busy = true;
    rounds++;
    const paintOk = painted.size === round.target;
    const slotOk = !round.eq || Number(typed) === round.eq.num;
    if (!paintOk) {
      // Corrección dibujada: sobran → en rojo; faltan → en verde las que había que pintar.
      const on = [...painted].sort((a, b) => a - b);
      const extra = new Set(on.slice(round.target));
      let missing = round.target - painted.size;
      body.querySelectorAll("[data-part]").forEach((el) => {
        const i = +el.dataset.part;
        if (extra.has(i)) el.classList.add("bad");
        else if (!painted.has(i) && missing > 0) { el.classList.add("miss"); missing--; }
      });
    }
    const slot = body.querySelector("[data-slot]");
    if (slot) {
      slot.classList.remove("active");
      slot.classList.add(slotOk ? "good" : "bad");
      if (!slotOk) slot.innerHTML = `<s>${typed}</s><em>${round.eq.num}</em>`;
    }
    const what = `${round.n}/${round.d}${round.eq ? ` = ${round.eq.num}/${round.eq.den}` : ""}`;
    if (paintOk && slotOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${what}. 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const why = paintOk ? "" : `Has pintado ${painted.size} y eran ${round.target}. `;
      feedback.textContent = `${why}💡 ${round.hint}`;
      feedback.className = "feedback bad";
      const nxt = document.createElement("button");
      nxt.type = "button";
      nxt.className = "secondary pf-next";
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
    saveScore(client, "pintafraccion", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🖍️</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} fracciones bien pintadas de ${rounds}</p>
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
