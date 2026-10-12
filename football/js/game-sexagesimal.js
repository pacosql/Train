// "Horas, minutos y segundos en columna": la suma o resta sexagesimal
// como en el cuaderno, con las columnas h | min | s (o ° ′ ″) alineadas,
// la raya y una casilla por columna para el resultado. Encima de cada
// columna, la flecha del cambio ("← 60 s = 1 min" al sumar, "1 min = 60 s →"
// al restar); al corregir se iluminan las que se han usado. El foco va de
// derecha a izquierda (segundos, minutos, horas) y salta solo al escribir
// dos cifras. Niveles: min y s sin llevar → con llevada → h min s →
// restas pidiendo → ángulos → mezcla.
import { randInt, pick, saveScore } from "./utils.js";

const UNITS = { t: ["h", "min", "s"], a: ["°", "′", "″"] };

// Suma o resta columna a columna (de derecha a izquierda), como en clase,
// anotando dónde se cambia 60 de una unidad por 1 de la siguiente.
function solve(op, A, B) {
  const n = A.length, res = Array(n).fill(0), conv = Array(n).fill(false);
  let carry = 0;
  for (let i = n - 1; i >= 0; i--) {
    if (op === "+") {
      const s = A[i] + B[i] + carry;
      carry = i > 0 && s >= 60 ? 1 : 0;
      conv[i] = !!carry;
      res[i] = s - 60 * carry;
    } else {
      let top = A[i] - carry;
      carry = top < B[i] ? 1 : 0;
      conv[i] = !!carry;
      res[i] = top + 60 * carry - B[i];
    }
  }
  return { res, conv };
}

// Niveles: 0 min s sin llevar · 1 min s llevando · 2 h min s sumando ·
// 3 restas pidiendo · 4 ángulos (suma o resta) · 5 mezcla.
export function buildRound(level) {
  const kind = level === 5 ? pick([1, 2, 3, 4]) : level;
  const sys = kind === 4 ? "a" : "t";
  let op, A, B, sol;
  for (;;) {
    const n = kind <= 1 ? 2 : kind === 3 ? pick([2, 3]) : 3;
    op = kind === 3 || (kind === 4 && Math.random() < 0.5) ? "−" : "+";
    const big = () => (sys === "a" ? randInt(10, 170) : randInt(1, 9));
    const mk = () => Array.from({ length: n }, (_, i) => (i === 0 && n === 3 ? big() : i === 0 ? randInt(1, 45) : randInt(1, 59)));
    A = mk(); B = mk();
    if (op === "−" && A[0] <= B[0]) [A, B] = [B, A];
    if (op === "−" && A[0] === B[0]) continue;
    sol = solve(op, A, B);
    const nConv = sol.conv.filter(Boolean).length;
    if (sol.res[0] <= 0 || (sys === "a" && sol.res[0] >= 360) || (sys === "t" && n === 2 && sol.res[0] >= 60)) continue;
    if (kind === 0 ? nConv === 0 : kind === 1 ? nConv === 1 : nConv >= 1) break;
  }
  const U = UNITS[sys], n = A.length, u0 = U.slice(3 - n);
  const q = (v, i) => (sys === "a" ? `${v}${u0[i]}` : `${v} ${u0[i]}`);
  const text = (V) => V.map(q).join(" ");
  // 💡: las columnas donde se cambia, contadas como lo diría la profe.
  const parts = [], plain = [];
  let carry = 0;
  for (let i = n - 1; i >= 0; i--) {
    const extra = carry ? (op === "+" ? ` + ${q(1, i)}` : ` − ${q(1, i)}`) : "";
    if (op === "+") {
      const s = A[i] + B[i] + carry;
      const t = `${q(A[i], i)} + ${q(B[i], i)}${extra} = ${q(s, i)}`;
      if (sol.conv[i]) parts.push(`${t} = ${q(1, i - 1)} ${q(s - 60, i)}: escribo ${s - 60} y me llevo ${q(1, i - 1)}`);
      else plain.push(t);
    } else {
      const top = A[i] - carry;
      if (sol.conv[i]) parts.push(`${q(top, i)} − ${q(B[i], i)} no se puede: pido ${q(1, i - 1)} = ${q(60, i)} → ${q(top + 60, i)} − ${q(B[i], i)} = ${q(sol.res[i], i)}`);
      else plain.push(`${q(A[i], i)}${extra} − ${q(B[i], i)} = ${q(sol.res[i], i)}`);
    }
    carry = sol.conv[i] ? 1 : 0;
  }
  const hint = parts.length ? parts.join("; ") : `Sin cambiar nada: ${plain.join(" y ")}`;
  const verb = op === "+" ? "Suma" : "Resta";
  return {
    op, sys, A, B, n, units: u0, res: sol.res, conv: sol.conv, hint,
    prompt: sys === "a" ? `${verb} los ángulos en columna` : `${verb} los tiempos en columna`,
    answer: text(sol.res),
  };
}

export function mountSexagesimalGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, active, busy, goNext = null;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body sx-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  // Casilla k = columna n-1-k: el orden del foco es de derecha a izquierda.
  const col = (k) => round.n - 1 - k;

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    goNext = null;
    round = buildRound(Math.min(5, Math.floor(hits / 2)));
    const { n, units: U, op } = round;
    typed = Array(n).fill("");
    active = 0;
    busy = false;
    const sp = round.sys === "a" ? "" : " ";
    // Flechas del cambio, sobre la columna que da (resta) o que se pasa de 60 (suma).
    const notes = U.map((u, i) => {
      if (op === "+" && i > 0) return `<span class="sx-note" data-note="${i}">← 60${sp}${u} = 1${sp}${U[i - 1]}</span>`;
      if (op === "−" && i < n - 1) return `<span class="sx-note" data-note="${i + 1}">1${sp}${u} = 60${sp}${U[i + 1]} →</span>`;
      return `<span></span>`;
    });
    const row = (V, sign) => `<span class="sx-sign">${sign}</span>${V.map((v, i) => `<span class="sx-num">${v}</span><span class="sx-u">${U[i]}</span>`).join("")}`;
    body.innerHTML = `
      <p class="prompt sx-prompt">${round.prompt}</p>
      <div class="sx-cuaderno">
        <div class="sx-sheet" style="--sx-n:${n}">
          <span></span>${notes.map((t) => `<span class="sx-notecell">${t}</span>`).join("")}
          ${row(round.A, "")}
          ${row(round.B, op)}
          <span class="sx-sign sx-res"></span>${U.map((u, i) => `<button type="button" class="sx-slot sx-res" data-slot="${n - 1 - i}"></button><span class="sx-u sx-res">${u}</span>`).join("")}
        </div>
      </div>
      <div class="keypad sx-keypad" data-keypad></div>
      <div class="feedback sx-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
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
      b.textContent = typed[+b.dataset.slot];
      b.classList.toggle("active", +b.dataset.slot === active);
    });
  }

  function say(html, cls) {
    const fb = body.querySelector("[data-feedback]");
    fb.innerHTML = html;
    fb.className = `feedback sx-feedback ${cls}`;
    return fb;
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return enter();
    const t = typed[active], last = active === round.n - 1;
    if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (t.length < (last ? 3 : 2)) {
      typed[active] = t === "0" ? key : t + key;
      // Minutos y segundos tienen como mucho dos cifras: al escribir la
      // segunda, el foco pasa solo a la columna de la izquierda.
      if (!last && typed[active].length === 2 && typed[active + 1] === "") active++;
    }
    paint();
  }

  function enter() {
    const n = typed.length;
    const next = [...Array(n).keys()].map((i) => (active + 1 + i) % n).find((i) => typed[i] === "");
    if (next === undefined) return check();
    if (typed[active] === "") return say("Escribe un número en la casilla marcada", "bad");
    active = next;
    paint();
  }

  function check() {
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot, want = round.res[col(k)];
      const ok = Number(typed[k]) === want;
      allOk = allOk && ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${typed[k]}</s><em class="sx-fix">${want}</em>`;
    });
    // Se marcan las flechas de los cambios que había que hacer.
    body.querySelectorAll("[data-note]").forEach((el) => el.classList.toggle("sx-used", round.conv[+el.dataset.note]));
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      say(`✓ 💡 ${round.hint}`, "ok");
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      goNext = () => { clearTimeout(pending); goNext = null; lives <= 0 ? finish(false) : nextRound(); };
      say(`Era ${round.answer}. 💡 ${round.hint} <button type="button" class="sx-next" data-next>Siguiente →</button>`, "bad")
        .querySelector("[data-next]").addEventListener("click", goNext);
      pending = setTimeout(goNext, 4000);
    }
  }

  // Teclado físico: cifras, borrar, Enter.
  function onKey(e) {
    if (finished || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Enter" && goNext) return e.preventDefault(), goNext();
    const key = /^[0-9]$/.test(e.key) ? e.key : e.key === "Backspace" ? "⌫" : e.key === "Enter" ? "✓" : null;
    if (key) { e.preventDefault(); pressKey(key); }
  }

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "sexagesimal", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>⏱️</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} cuentas de horas y ángulos bien de ${rounds}</p>
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
