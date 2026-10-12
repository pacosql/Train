// "Suma y resta de polinomios": la operación escrita en una línea como en
// el libro, "(2x² + 3x − 1) + (x² − x + 4) =", y debajo el resultado con
// casillas para los coeficientes: "□x² + □x + □" (tecla − para los
// negativos, un 0 si un término se anula). Al corregir, los términos
// semejantes se colorean del mismo color arriba y abajo. El 💡 junta:
// "Junto los x²: 2 + 1 = 3; las x: 3 − 1 = 2; los números: −1 + 4 = 3";
// en la resta avisa del cambio de signo. Nivel final: monomio · polinomio.
import { randInt, pick, saveScore } from "./utils.js";

const M = "−";
const neg = (n) => String(n).replace("-", M);
const nz = (a, b) => { let v; do v = randInt(a, b); while (v === 0); return v; };
const xp = (g) => (g === 0 ? "" : g === 1 ? "<i>x</i>" : `<i>x</i><sup>${g}</sup>`);
const NAME = ["los números", "las <i>x</i>", "los <i>x</i><sup>2</sup>", "los <i>x</i><sup>3</sup>"];
// Un término suelto: 3x², −x, 4…
const term = (c, g) => (c < 0 ? M : "") + (Math.abs(c) === 1 && g ? "" : Math.abs(c)) + xp(g);
const degs = (p) => p.map((_, g) => g).filter((g) => p[g] !== 0).reverse();
// Polinomio p[g] = coeficiente de grado g, del mayor al menor, cada término
// en un <span> con su color de grado (para colorear los semejantes).
const poly = (p, color = true) =>
  degs(p).map((g, i) => {
    const c = p[g], s = i === 0 ? (c < 0 ? M : "") : c < 0 ? ` ${M} ` : " + ";
    const t = s + (Math.abs(c) === 1 && g ? "" : Math.abs(c)) + xp(g);
    return color ? `<span class="sp2-t sp2-g${g}">${t}</span>` : t;
  }).join("");
const comb = (a, b) => `${neg(a)} ${b < 0 ? M : "+"} ${Math.abs(b)} = ${neg(a + b)}`;

// Niveles: 0 suma de grado 1 · 1 suma de grado 2 · 2 resta (cambio de
// signo) · 3 términos que faltan o que se anulan (0x) · 4 monomio · polinomio.
export function buildRound(level) {
  if (level >= 4) {
    const k = pick([2, 3, 4, 5, -2, -3, -4, 1, -1]);
    const q = Math.random() < 0.6 ? [nz(-9, 9), nz(1, 5)] : [nz(-9, 9), nz(-6, 6), nz(1, 4)];
    const r = [0, ...q.map((c) => k * c)];
    const ds = degs(r);
    const mono = term(k, 1);
    const prods = degs(q).map((g) => `${mono} · ${q[g] < 0 ? `(${term(q[g], g)})` : term(q[g], g)} = ${term(k * q[g], g + 1)}`);
    return { level, op: "·", p: [0, k], q, r, ds, answers: ds.map((g) => r[g]),
      problem: `<span class="sp2-t sp2-mono">${mono}</span>(${poly(q, false)}) =`,
      hint: `Multiplico ${mono} por cada término: ${prods.join("; ")}${k < 0 ? " (menos por menos, más)" : ""}` };
  }
  const op = level === 2 || (level === 3 && Math.random() < 0.5) ? "−" : "+";
  const deg = level === 0 ? 1 : 2;
  let p, q, r;
  for (;;) {
    p = Array.from({ length: deg + 1 }, (_, g) => (g === deg ? randInt(1, 6) : nz(-9, 9)));
    q = Array.from({ length: deg + 1 }, (_, g) => (g === deg ? nz(-4, 6) : nz(-9, 9)));
    if (level === 3) {
      // Falta un término en uno de los dos (no el principal), o se anula uno.
      if (Math.random() < 0.6) pick([p, q])[randInt(0, 1)] = 0;
      else { const g = randInt(0, 1); q[g] = op === "+" ? -p[g] : p[g]; }
    }
    r = p.map((c, g) => (op === "+" ? c + q[g] : c - q[g]));
    if (r[deg] === 0) continue; // el resultado debe seguir teniendo el mismo grado
    const zeros = r.filter((c) => c === 0).length + p.filter((c) => c === 0).length + q.filter((c) => c === 0).length;
    if ((level === 3) === (zeros > 0)) break;
  }
  const ds = Array.from({ length: deg + 1 }, (_, i) => deg - i);
  const qq = op === "+" ? q : q.map((c) => -c);
  const parts = ds.map((g) => {
    if (p[g] === 0 && qq[g] === 0) return `${NAME[g]}: no hay, 0`;
    if (p[g] === 0 || qq[g] === 0) return `${NAME[g]}: solo está ${term(p[g] || qq[g], g)}, así que ${neg(p[g] || qq[g])}`;
    return `${NAME[g]}: ${comb(p[g], qq[g])}${p[g] + qq[g] === 0 ? " (se anulan)" : ""}`;
  });
  const change = op === "−" ? `Al restar cambio el signo de todo el segundo paréntesis: ${M}(${poly(q, false)}) = ${poly(qq, false)}. ` : "";
  return { level, op, p, q, r, ds, answers: ds.map((g) => r[g]),
    problem: `(${poly(p)}) ${op === "+" ? "+" : M} (${poly(q)}) =`, hint: `${change}Junto ${parts.join("; ")}` };
}

export function mountSumapolinomiosGame(container, { client, onExit }) {
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
    <div class="game-body sp2-body" data-body></div>
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
    const last = round && round.problem;
    do round = buildRound(Math.min(4, Math.floor(hits / 3))); while (round.problem === last);
    typed = round.answers.map(() => "");
    active = 0;
    busy = false;
    const answerRow = round.ds
      .map((g, i) => `${i ? " + " : ""}<span class="sp2-t sp2-g${g}"><button type="button" class="sp2-slot" data-slot="${i}"></button>${xp(g)}</span>`)
      .join("");
    body.innerHTML = `
      <p class="prompt sp2-prompt">${round.op === "·" ? "Multiplica" : round.op === "+" ? "Suma" : "Resta"} los polinomios</p>
      <div class="sp2-cuaderno" data-sheet>
        <div class="sp2-problem">${round.problem}</div>
        <div class="sp2-answer">${answerRow}</div>
      </div>
      <div class="keypad sp2-keypad" data-keypad></div>
      <button type="button" class="choice-btn keypad-sign sp2-sign" data-sign>${M} cambiar signo</button>
      <div class="feedback sp2-feedback" data-feedback></div>
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
    body.querySelector("[data-sign]").addEventListener("click", () => pressKey("±"));
    paint();
  }

  function paint() {
    body.querySelectorAll("[data-slot]").forEach((b) => {
      b.textContent = neg(typed[+b.dataset.slot]);
      b.classList.toggle("active", +b.dataset.slot === active);
    });
  }

  function pressKey(key) {
    if (finished || busy) return;
    const t = typed[active];
    if (key === "✓") return check();
    if (key === "±") typed[active] = t.startsWith("-") ? t.slice(1) : "-" + t;
    else if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (t.replace("-", "").length < 3) typed[active] = t + key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const filled = (v) => v !== "" && v !== "-";
    // ✓ con casillas vacías: el foco pasa a la siguiente que falte (en orden).
    if (!typed.every(filled)) {
      if (filled(typed[active])) {
        active = typed.map((_, k) => (active + 1 + k) % typed.length).find((k) => !filled(typed[k]));
        return paint();
      }
      feedback.textContent = "Escribe el coeficiente (0 si no queda ninguno)";
      feedback.className = "feedback bad sp2-feedback";
      return;
    }
    busy = true;
    rounds++;
    let ok = true;
    body.querySelector("[data-sheet]").classList.add("sp2-show"); // colorea los semejantes
    body.querySelectorAll("[data-slot]").forEach((s) => {
      const i = +s.dataset.slot, good = Number(typed[i]) === round.answers[i];
      ok = ok && good;
      s.classList.remove("active");
      s.classList.add(good ? "good" : "bad");
      if (!good) s.innerHTML = `<s>${neg(typed[i])}</s><span class="sp2-want">${neg(round.answers[i])}</span>`;
    });
    const result = poly(round.r, false);
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.innerHTML = `✓ ${result}. 💡 ${round.hint}`;
      feedback.className = "feedback ok sp2-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const after = () => (lives <= 0 ? finish(false) : nextRound());
      feedback.innerHTML = `Es ${result}. 💡 ${round.hint} <button type="button" class="sp2-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad sp2-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", () => { clearTimeout(pending); after(); });
      pending = setTimeout(after, 2500);
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
    else if (e.key === "-") pressKey("±");
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
    saveScore(client, "sumapolinomios", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧮</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} operaciones con polinomios bien hechas de ${rounds}</p>
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
