// "Fracciones de hora": un reloj con el trozo de hora pintado y, en el
// cuaderno, "¼ de hora = □ min" (fracción → minutos) o, al revés,
// "20 min = □/□ de hora" con las dos casillas apiladas sobre la raya de
// fracción. En el sentido directo el reloj sale partido en partes iguales;
// en el inverso solo se ven las marcas de 5 min y las partes aparecen al
// responder. Niveles: ½ y ¼ → ¾ → tercios y sextos → inversa (fracción
// simplificada). 3º-5º.
import { pick, saveScore } from "./utils.js";

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const WORD = { "1/2": "media hora", "1/4": "un cuarto de hora", "3/4": "tres cuartos de hora", "1/3": "un tercio de hora",
  "2/3": "dos tercios de hora", "1/6": "un sexto de hora", "5/6": "cinco sextos de hora" };
const PART = { 2: "la mitad", 3: "un tercio", 4: "un cuarto", 6: "un sexto" };
const POOLS = [
  [[1, 2], [1, 4]],
  [[3, 4], [3, 4], [1, 2], [1, 4]],
  [[1, 3], [2, 3], [1, 6], [5, 6], [3, 4]],
];
const INV = [10, 15, 20, 30, 40, 45, 50];
const fracHtml = (n, d) => `<span class="fh-frac"><i>${n}</i><i>${d}</i></span>`;

// dir "fm": fracción → minutos (una casilla); "mf": minutos → fracción (dos apiladas).
export function buildRound(level) {
  const lv = Math.min(3, Math.max(0, level));
  if (lv === 3) {
    const m = pick(INV), g = gcd(m, 60), n = m / g, d = 60 / g;
    const hint = `Una hora son 60 min: ${m} min son ${m}/60 de hora; divido arriba y abajo entre ${g} → ${n}/${d}`;
    return { lv, dir: "mf", m, n, d, hint, answer: `${n}/${d} de hora`, boxes: [{ ans: n }, { ans: d }] };
  }
  const [n, d] = pick(POOLS[lv]), m = (60 / d) * n;
  const hint = n === 1
    ? `Una hora son 60 min; ${PART[d]} es 60 ÷ ${d} = ${m}`
    : `Una hora son 60 min; ${PART[d]} es 60 ÷ ${d} = ${60 / d}, y ${n}/${d} son ${n} × ${60 / d} = ${m}`;
  return { lv, dir: "fm", m, n, d, hint, answer: `${m} min`, boxes: [{ ans: m }] };
}

// Reloj: sector pintado de "m" minutos; si "parts", rayas que lo dividen en "d" partes iguales.
function clockSvg(r, parts) {
  const R = 70, C = 80, pt = (min, rad) => [C + rad * Math.sin((min / 60) * 2 * Math.PI), C - rad * Math.cos((min / 60) * 2 * Math.PI)];
  const [x, y] = pt(r.m, R);
  const sector = `<path class="fh-sector" d="M${C} ${C} L${C} ${C - R} A${R} ${R} 0 ${r.m > 30 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z"/>`;
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const [x1, y1] = pt(i, i % 5 ? 66 : 61), [x2, y2] = pt(i, R);
    return `<line class="fh-tick${i % 5 ? "" : " big"}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }).join("");
  const nums = [[12, 0], [3, 15], [6, 30], [9, 45]].map(([t, min]) => {
    const [tx, ty] = pt(min, 50);
    return `<text class="fh-num" x="${tx.toFixed(1)}" y="${(ty + 5).toFixed(1)}">${t}</text>`;
  }).join("");
  const cuts = parts ? Array.from({ length: r.d }, (_, i) => {
    const [x2, y2] = pt((60 / r.d) * i, R);
    return `<line class="fh-cut" x1="${C}" y1="${C}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }).join("") : "";
  // Dos agujas: minutero en el final del trozo pintado, horario en las 12.
  const [hx, hy] = pt(r.m, 58);
  return `<svg class="fh-clock" viewBox="0 0 160 160" aria-label="reloj"><circle class="fh-face" cx="${C}" cy="${C}" r="${R}"/>${sector}${cuts}${ticks}${nums}
    <line class="fh-hand" x1="${C}" y1="${C}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}"/><line class="fh-hand short" x1="${C}" y1="${C}" x2="${C}" y2="${C - 34}"/><circle class="fh-pin" cx="${C}" cy="${C}" r="4"/></svg>`;
}

export function mountFracciondehoraGame(container, { client, onExit }) {
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
    <div class="game-body fh-body" data-body></div>
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
    for (let t = 0; t < 20 && (!t || round.hint === prev); t++) round = buildRound(Math.min(3, Math.floor(hits / 2)));
    typed = round.boxes.map(() => "");
    active = 0;
    busy = false;
    const line = round.dir === "fm"
      ? `${fracHtml(round.n, round.d)}<span class="fh-txt">de hora =</span> <button type="button" class="fh-box" data-box="0"></button> <span class="fh-txt">min</span>`
      : `<span class="fh-txt">${round.m} min =</span> <span class="fh-frac fh-ask"><button type="button" class="fh-box" data-box="0"></button><i class="fh-bar"></i><button type="button" class="fh-box" data-box="1"></button></span> <span class="fh-txt">de hora</span>`;
    body.innerHTML = `
      <p class="prompt fh-prompt">${round.dir === "fm" ? `¿Cuántos minutos son <b>${WORD[`${round.n}/${round.d}`]}</b>?` : `¿Qué fracción de hora son <b>${round.m} min</b>?`}</p>
      <div class="fh-clockwrap" data-clock>${clockSvg(round, round.dir === "fm")}</div>
      <div class="fh-cuaderno"><span class="fh-line">${line}</span></div>
      <div class="keypad fh-keypad" data-keypad></div>
      <div class="feedback fh-feedback" data-feedback></div>
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
      b.textContent = typed[i];
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
    } else if (typed[active].length < 2) {
      typed[active] += key;
      // En la fracción, tras el numerador (siempre de una cifra) el foco baja al denominador.
      if (round.dir === "mf" && active === 0) active = 1;
    }
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const empty = typed.findIndex((t) => t === "");
    if (empty !== -1) {
      active = empty;
      paint();
      feedback.textContent = round.dir === "fm" ? "Escribe los minutos en la casilla" : `Falta el ${empty ? "denominador" : "numerador"}`;
      feedback.className = "feedback bad fh-feedback";
      return;
    }
    const v = typed.map(Number);
    // Fracción igual pero sin simplificar: no es un fallo, se pide simplificarla.
    if (round.dir === "mf" && v[0] && v[1] && v[0] * round.d === v[1] * round.n && v[0] !== round.n) {
      feedback.textContent = `${v[0]}/${v[1]} vale lo mismo, pero simplifícala (divide arriba y abajo)`;
      feedback.className = "feedback bad fh-feedback";
      typed = ["", ""];
      active = 0;
      paint();
      return;
    }
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-box]").forEach((b, i) => {
      const ok = v[i] === round.boxes[i].ans;
      allOk = allOk && ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${typed[i]}</s><b class="fh-right">${round.boxes[i].ans}</b>`;
    });
    // Al responder, el reloj se parte en partes iguales para ver el porqué.
    body.querySelector("[data-clock]").innerHTML = clockSvg(round, true);
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${round.answer}. 💡 ${round.hint}`;
      feedback.className = "feedback ok fh-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.innerHTML = `Era ${round.answer}. 💡 ${round.hint}<button type="button" class="secondary fh-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad fh-feedback";
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
    saveScore(client, "fracciondehora", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🕒</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} fracciones de hora bien hechas de ${rounds}</p>
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
