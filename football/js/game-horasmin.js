// "Horas y minutos": "2 h 30 min = □ min" (compleja → incompleja) y
// "150 min = □ h □ min" (incompleja → compleja), escritas en el cuaderno
// con la unidad al lado de cada casilla. Debajo, relojitos que enseñan las
// vueltas: cada vuelta entera es 1 h (60 min) y la última, a medias, es lo
// que sobra. Si la pregunta da la forma compleja las vueltas se ven desde
// el principio; si da los minutos sueltos se descubren al responder.
// Niveles: horas enteras → h y min → min a h y min (÷ 60) → min y s →
// días y horas. 3º-5º.
import { randInt, pick, saveScore } from "./utils.js";

const miles = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
// Cada nivel: unidad grande, unidad pequeña, cuántas pequeñas hay en una grande.
const LEVELS = [
  { big: "h", small: "min", f: 60 },
  { big: "h", small: "min", f: 60 },
  { big: "h", small: "min", f: 60 },
  { big: "min", small: "s", f: 60 },
  { big: "día", small: "h", f: 24 },
];
const name = (u, n) => (u === "día" && n !== 1 ? "días" : u);

// dir "ci": compleja → incompleja (una casilla); "ic": incompleja → compleja.
export function buildRound(level) {
  const lv = Math.min(4, Math.max(0, level));
  const { big, small, f } = LEVELS[lv];
  const dir = lv === 1 ? "ci" : lv === 2 ? "ic" : Math.random() < 0.5 ? "ci" : "ic";
  const B = randInt(1, lv === 0 ? 6 : lv === 4 ? 3 : 4);
  // En el nivel 0 no hay resto; en los demás sí (5, 10… o cualquiera).
  const R = lv === 0 ? 0 : lv === 1 ? randInt(1, 11) * 5 : lv === 4 ? randInt(1, 23) : pick([randInt(1, 11) * 5, randInt(1, 59)]);
  const total = B * f + R;
  const compleja = `${B} ${name(big, B)}${R ? ` ${R} ${small}` : ""}`;
  let hint;
  if (dir === "ci") hint = `1 ${big} = ${f} ${small}: ${B} × ${f} = ${miles(B * f)}${R ? `, + ${R} = ${miles(total)}` : ""}`;
  else if (!R) hint = `1 ${big} = ${f} ${small}: ${miles(total)} ÷ ${f} = ${B} ${name(big, B)}`;
  else hint = `1 ${big} = ${f} ${small}: en ${miles(total)} ${B === 1 ? "cabe 1 vez" : `caben ${B} veces`} ${f} (${B} × ${f} = ${miles(B * f)}) y sobran ${total} − ${miles(B * f)} = ${R} → ${compleja}`;
  const boxes = dir === "ci"
    ? [{ unit: small, ans: total }]
    : R ? [{ unit: name(big, B), ans: B }, { unit: small, ans: R }] : [{ unit: name(big, B), ans: B }];
  boxes.forEach((b) => (b.maxLen = String(b.ans).length));
  return { lv, dir, big, small, f, B, R, total, boxes, compleja, given: dir === "ci" ? compleja : `${miles(total)} ${small}`,
    answer: dir === "ci" ? `${miles(total)} ${small}` : compleja, hint };
}

// Relojito: vuelta entera (lleno) o a medias (sector de "part" sobre f).
function clockSvg(part, f, label) {
  const r = 18, c = 21;
  let fill;
  if (part >= f) fill = `<circle class="hm-fill" cx="${c}" cy="${c}" r="${r}"/>`;
  else {
    const a = (part / f) * 2 * Math.PI, x = c + r * Math.sin(a), y = c - r * Math.cos(a);
    fill = `<path class="hm-fill" d="M${c} ${c} L${c} ${c - r} A${r} ${r} 0 ${part / f > 0.5 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z"/>`;
  }
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * 2 * Math.PI;
    return `<line class="hm-tick" x1="${c + 15 * Math.sin(a)}" y1="${c - 15 * Math.cos(a)}" x2="${c + r * Math.sin(a)}" y2="${c - r * Math.cos(a)}"/>`;
  }).join("");
  return `<span class="hm-clock"><svg viewBox="0 0 42 42"><circle class="hm-face" cx="${c}" cy="${c}" r="${r}"/>${fill}${ticks}<circle class="hm-pin" cx="${c}" cy="${c}" r="2"/></svg><small>${label}</small></span>`;
}
function turnsHtml(r) {
  const clocks = Array.from({ length: r.B }, () => clockSvg(r.f, r.f, `${r.f} ${r.small}`));
  if (r.R) clocks.push(clockSvg(r.R, r.f, `${r.R} ${r.small}`));
  return clocks.join("");
}

export function mountHorasminGame(container, { client, onExit }) {
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
    <div class="game-body hm-body" data-body></div>
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
    const ref = round.dir === "ci" ? turnsHtml(round) : clockSvg(round.f, round.f, `1 ${round.big} = ${round.f} ${round.small}`);
    body.innerHTML = `
      <p class="prompt hm-prompt">${round.dir === "ci" ? `Pásalo todo a <b>${round.small}</b>` : `Pásalo a <b>${name(round.big, 2)}</b>${round.R ? ` y <b>${round.small}</b>` : ""}`}</p>
      <div class="hm-cuaderno"><span class="hm-line">${round.given} = ${round.boxes
        .map((b, i) => `<button type="button" class="hm-box" data-box="${i}"></button> <span class="hm-unit">${b.unit}</span>`)
        .join(" ")}</span></div>
      <div class="hm-turns" data-turns>${ref}</div>
      <div class="keypad hm-keypad" data-keypad></div>
      <div class="feedback hm-feedback" data-feedback></div>
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
      b.textContent = miles(typed[i]);
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
    } else if (typed[active].length < 4) {
      typed[active] += key;
      // Casilla con sus cifras → el foco pasa solo a la siguiente (de izquierda a derecha).
      if (typed[active].length >= round.boxes[active].maxLen && active < typed.length - 1) active++;
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
      feedback.className = "feedback bad hm-feedback";
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
        b.insertAdjacentHTML("afterend", `<b class="hm-right">${miles(round.boxes[i].ans)}</b>`);
      }
    });
    // Al responder se ven siempre las vueltas del reloj.
    body.querySelector("[data-turns]").innerHTML = turnsHtml(round);
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${round.answer}. 💡 ${round.hint}`;
      feedback.className = "feedback ok hm-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.innerHTML = `Era ${round.answer}. 💡 ${round.hint}<button type="button" class="secondary hm-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad hm-feedback";
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
    saveScore(client, "horasmin", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>⏰</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} cambios de horas y minutos bien hechos de ${rounds}</p>
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
