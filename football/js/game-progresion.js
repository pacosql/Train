// "Progresiones": la progresión escrita como en el libro de 3.º ESO
// ("3, 7, 11, 15, …") y debajo los pasos con casillas: d = □, la fórmula
// aₙ = a₁ + (n − 1) · d y la sustitución con los números de la ronda.
// Se toca una casilla, se escribe con el teclado (tecla − para el signo) y
// ✓ pasa a la siguiente casilla vacía; con todas llenas, corrige. El 💡
// repite la cuenta: "La diferencia es 4; a₁₀ = 3 + 9 · 4 = 39".
import { randInt, pick, saveScore } from "./utils.js";

const M = "−";
// Números como en el libro: signo menos tipográfico y punto de miles.
const fmt = (n) => (n < 0 ? M : "") + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const par = (n) => (n < 0 ? `(${fmt(n)})` : fmt(n));
const pm = (n) => `${n < 0 ? M : "+"} ${fmt(Math.abs(n))}`;
const A = (k) => `<i>a</i><sub>${k}</sub>`;
const N = "<i>n</i>";
const AN = `<i>a</i><sub>${N}</sub>`;
const row = (s) => `<div class="pg-row">${s}</div>`;
const frac = (n, d) => `<span class="pg-frac"><span>${n}</span><span>${d}</span></span>`;
const FORMULA_AR = row(`${AN} = ${A(1)} + (${N} ${M} 1) · <i>d</i>`);

// Niveles: 0 diferencia y siguiente término · 1 un término lejano ·
// 2 término general aₙ = □n + □ · 3 geométrica (r y un término) ·
// 4 suma de los n primeros términos. Desde el 1, d puede ser negativa.
export function buildRound(level) {
  if (level === 3) {
    let a1, r, n, an;
    do { a1 = randInt(1, 5); r = randInt(2, 5); n = randInt(5, 8); an = a1 * r ** (n - 1); } while (an > 50000);
    const terms = [0, 1, 2, 3].map((i) => a1 * r ** i);
    return {
      level, kind: "geo", prompt: "Geométrica: halla r y el término",
      html: `<div class="pg-seq">${terms.map(fmt).join(", ")}, …</div>` + row(`<i>r</i> = [0]`) +
        row(`${AN} = ${A(1)} · <i>r</i><sup>${N} ${M} 1</sup>`) + row(`${A(n)} = [1]`),
      answers: [r, an],
      hint: `Cada término se multiplica por ${r} (<i>r</i> = ${fmt(terms[1])} : ${fmt(terms[0])} = ${r}); ${A(n)} = ${a1} · ${r}<sup>${n - 1}</sup> = ${fmt(an)}`,
    };
  }
  let a1, d;
  do {
    a1 = randInt(level === 0 ? 1 : -10, level === 0 ? 20 : 30);
    d = level > 0 && Math.random() < 0.3 ? -randInt(2, 9) : randInt(2, level === 0 ? 9 : 12);
  } while (level === 2 && a1 === d); // aₙ = dn + 0 no enseña nada
  const term = (k) => a1 + (k - 1) * d;
  const terms = [1, 2, 3, 4].map(term);
  const seq = `<div class="pg-seq">${terms.map(fmt).join(", ")}, …</div>`;
  const dRow = row(`<i>d</i> = [0]`);
  const dWhy = `<i>d</i> = ${fmt(terms[1])} ${M} ${par(terms[0])} = ${fmt(d)}`;
  if (level === 0) {
    return {
      level, kind: "sig", prompt: "Halla la diferencia y el siguiente",
      html: seq + dRow + row(`${A(5)} = [1]`), answers: [d, term(5)],
      hint: `Cada término suma ${d} (${dWhy}); el siguiente: ${fmt(terms[3])} + ${d} = ${fmt(term(5))}`,
    };
  }
  if (level === 1) {
    const n = Math.random() < 0.15 ? pick([50, 100]) : randInt(8, 30);
    return {
      level, kind: "lejano", prompt: "Halla un término lejano",
      html: seq + dRow + FORMULA_AR + row(`${A(n)} = ${fmt(a1)} + [1] · [2] = [3]`), answers: [d, n - 1, d, term(n)],
      hint: `La diferencia es ${fmt(d)} (${dWhy}); ${A(n)} = ${fmt(a1)} + ${n - 1} · ${par(d)} = ${fmt(term(n))}`,
    };
  }
  if (level === 2) {
    const c = a1 - d;
    return {
      level, kind: "general", prompt: "Escribe el término general",
      html: seq + dRow + FORMULA_AR + row(`${AN} = [1]${N} + [2]`), answers: [d, d, c],
      hint: `${dWhy}; ${AN} = ${fmt(a1)} + (${N} ${M} 1) · ${par(d)} = ${fmt(d)}${N} ${pm(-d)} ${pm(a1)} = ${fmt(d)}${N} ${pm(c)}`,
    };
  }
  const n = randInt(8, 20), an = term(n), S = ((a1 + an) * n) / 2;
  return {
    level, kind: "suma", prompt: "Suma los primeros términos",
    html: seq + dRow + row(`${A(n)} = [1]`) + row(`<i>S</i><sub>${n}</sub> = ${frac(`(${A(1)} + ${A(n)}) · ${n}`, "2")} = [2]`),
    answers: [d, an, S],
    hint: `${dWhy}; ${A(n)} = ${fmt(a1)} + ${n - 1} · ${par(d)} = ${fmt(an)}; <i>S</i><sub>${n}</sub> = (${fmt(a1)} + ${par(an)}) · ${n} : 2 = ${fmt(S)}`,
  };
}

export function mountProgresionGame(container, { client, onExit }) {
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
    <div class="game-body pg-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const valid = (t) => /^-?\d+$/.test(t);
  const show = (t) => t.replace("-", M);

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    const last = round && round.html;
    do round = buildRound(Math.min(4, Math.floor(hits / 3))); while (round.html === last);
    typed = round.answers.map(() => "");
    active = 0;
    busy = false;
    body.innerHTML = `
      <p class="prompt pg-prompt">${round.prompt}</p>
      <div class="pg-cuaderno">${round.html.replace(/\[(\d+)\]/g, (_, k) => `<button type="button" class="pg-slot" data-slot="${k}"></button>`)}</div>
      <div class="keypad pg-keypad" data-keypad></div>
      <div class="feedback pg-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", M, "0", "⌫", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary pg-ok" : ""}`;
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
    paint();
  }

  function paint() {
    body.querySelectorAll("[data-slot]").forEach((b) => {
      b.textContent = show(typed[+b.dataset.slot]);
      b.classList.toggle("active", +b.dataset.slot === active);
    });
  }

  function pressKey(key) {
    if (finished || busy) return;
    const t = typed[active];
    if (key === "✓") return check();
    if (key === M) typed[active] = t.startsWith("-") ? t.slice(1) : "-" + t;
    else if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (t.replace("-", "").length < 6) typed[active] = t + key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    if (!typed.every(valid)) {
      // ✓ con la casilla llena: el foco salta a la siguiente vacía (en orden).
      if (valid(typed[active])) {
        active = typed.map((_, k) => (active + 1 + k) % typed.length).find((k) => !valid(typed[k]));
        return paint();
      }
      feedback.textContent = "Escribe un número en la casilla";
      feedback.className = "feedback bad pg-feedback";
      return;
    }
    busy = true;
    rounds++;
    let ok = true;
    body.querySelectorAll("[data-slot]").forEach((s) => {
      const i = +s.dataset.slot, good = Number(typed[i]) === round.answers[i];
      ok = ok && good;
      s.classList.remove("active");
      s.classList.add(good ? "good" : "bad");
      if (!good) s.innerHTML = `<s>${show(typed[i])}</s><span class="pg-want">${fmt(round.answers[i])}</span>`;
    });
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.innerHTML = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok pg-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const after = () => (lives <= 0 ? finish(false) : nextRound());
      feedback.innerHTML = `💡 ${round.hint} <button type="button" class="pg-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad pg-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", () => { clearTimeout(pending); after(); });
      pending = setTimeout(after, 4000);
    }
  }

  // Teclado físico: cifras, ⌫, Enter, "-" para el signo y flechas.
  function onKey(e) {
    if (finished || !round) return;
    if (busy) {
      if (e.key === "Enter") body.querySelector("[data-next]")?.click();
      return;
    }
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
    else if (e.key === "-") pressKey(M);
    else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      active = (active + (e.key === "ArrowRight" ? 1 : typed.length - 1)) % typed.length;
      paint();
    } else return;
    e.preventDefault();
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "progresion", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🪜</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} progresiones resueltas de ${rounds}</p>
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
    round = null;
    finished = false;
    window.removeEventListener("keydown", onKey);
    window.addEventListener("keydown", onKey);
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
