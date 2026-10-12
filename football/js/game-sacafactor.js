// "Saca factor común": la expresión y su factorización con casillas, como
// en el libro: "6x + 9 = □(□x + □)", "4x² + 6x = □x(□x + □)". Primero se
// escribe el factor común (el MÁXIMO, el mcd) y luego lo que queda dentro
// del paréntesis. ✓ pasa a la siguiente casilla y, con todas llenas,
// corrige. En el último nivel aparece debajo la línea "Compruebo:" que se
// va escribiendo sola al desarrollar lo que pones. El 💡: "mcd(6, 9) = 3:
// 6x = 3 · 2x y 9 = 3 · 3 → 3(2x + 3)".
import { randInt, pick, saveScore } from "./utils.js";

const M = "−";
const X = "<i>x</i>";
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const xp = (e) => (e === 0 ? "" : e === 1 ? X : `${X}<sup>${e}</sup>`);
const sg = (s) => (s < 0 ? ` ${M} ` : " + ");
const listY = (a) => (a.length > 1 ? `${a.slice(0, -1).join(", ")} y ${a.at(-1)}` : a[0]);

// Niveles: 0 solo números, 12 + 18 = □ · (□ + □) · 1 con x, 6x + 9 ·
// 2 con x², el factor lleva x (2x) · 3 tres términos · 4 números mayores y
// la comprobación desarrollando.
export function buildRound(level) {
  const kind = level >= 4 ? pick(["lin", "x2", "tres", "tres"]) : ["num", "lin", "x2", "tres"][level];
  const gMax = level >= 4 ? 12 : level === 0 ? 9 : 6;
  for (;;) {
    const n = kind === "tres" ? 3 : 2;
    const fx = kind === "x2" || (kind === "tres" && Math.random() < 0.5); // ¿sale también x?
    const pw = kind === "num" ? [0, 0] : n === 2 ? (fx ? [2, 1] : [1, 0]) : fx ? [3, 2, 1] : [2, 1, 0];
    const inner = pw.map((e) => e - (fx ? 1 : 0)); // exponentes dentro del paréntesis
    const g = randInt(2, gMax);
    // Dentro: coeficientes ≥ 2 si llevan x (1x no se escribe así), ≥ 1 sin x.
    const c = inner.map((e) => randInt(e > 0 ? 2 : 1, kind === "num" ? 12 : 9));
    const s = c.map((_, i) => (i === 0 ? 1 : pick([1, -1])));
    if (c.reduce(gcd) !== 1) continue; // g tiene que ser el máximo
    if (kind === "num" && c[0] === c[1]) continue;
    if (c.some((v) => v * g > 150)) continue;
    const outer = c.map((v) => v * g);
    const lhs = outer.map((v, i) => (i ? sg(s[i]) : "") + v + xp(pw[i])).join("");
    const rhs = `[0]${fx ? X : ""}${kind === "num" ? " · " : ""}(${c.map((_, i) => (i ? sg(s[i]) : "") + `[${i + 1}]` + xp(inner[i])).join("")})`;
    const factor = `${g}${fx ? X : ""}`;
    const ins = c.map((v, i) => (i ? sg(s[i]) : "") + (v === 1 && inner[i] ? "" : v) + xp(inner[i])).join("");
    const splits = outer.map((v, i) => `${v}${xp(pw[i])} = ${factor} · ${c[i] === 1 && inner[i] ? "" : c[i]}${xp(inner[i])}`);
    const hint = `mcd(${outer.join(", ")}) = ${g}${fx ? ` y todos llevan ${X}` : ""}: ${listY(splits)} → ${factor}${kind === "num" ? " · " : ""}(${ins})`;
    // "Compruebo": el factor por cada término de dentro, con lo que se escriba.
    const mirror = level >= 4
      ? `${c.map((_, i) => (i ? sg(s[i]) : "") + `{0}${fx ? X : ""} · {${i + 1}}${xp(inner[i])}`).join("")} = ${lhs}`
      : "";
    return { level, kind, fx, g, c, s, pw, outer, text: `${lhs} = ${rhs}`, answers: [g, ...c], hint, mirror };
  }
}

export function mountSacafactorGame(container, { client, onExit }) {
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
    <div class="game-body sf-body" data-body></div>
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
    const last = round && round.text;
    do round = buildRound(Math.min(4, Math.floor(hits / 3))); while (round.text === last);
    typed = round.answers.map(() => "");
    active = 0;
    busy = false;
    const mirror = round.mirror.replace(/\{(\d+)\}/g, (_, k) => `<span class="sf-m" data-m="${k}"></span>`);
    body.innerHTML = `
      <p class="prompt sf-prompt">Saca factor común (el mayor)</p>
      <div class="sf-cuaderno">
        <div class="sf-expr">${round.text.replace(/\[(\d+)\]/g, (_, k) => `<button type="button" class="sf-slot" data-slot="${k}"></button>`)}</div>
        ${mirror ? `<div class="sf-check" aria-hidden="true">Compruebo: ${mirror}</div>` : ""}
      </div>
      <div class="keypad sf-keypad" data-keypad></div>
      <div class="feedback sf-feedback" data-feedback></div>
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
    body.querySelectorAll("[data-m]").forEach((m) => (m.textContent = typed[+m.dataset.m] || "□"));
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    if (key === "⌫") typed[active] = typed[active].slice(0, -1);
    else if (typed[active].length < 3) typed[active] += key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    // ✓ con casillas vacías: el foco pasa a la siguiente que falte (en orden).
    if (typed.some((t) => t === "")) {
      if (typed[active] !== "") {
        active = typed.map((_, k) => (active + 1 + k) % typed.length).find((k) => typed[k] === "");
        return paint();
      }
      feedback.textContent = "Escribe un número en la casilla";
      feedback.className = "feedback bad sf-feedback";
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
      if (!good) s.innerHTML = `<s>${typed[i]}</s><span class="sf-want">${round.answers[i]}</span>`;
    });
    body.querySelector(".sf-check")?.classList.add(ok ? "good" : "bad");
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.innerHTML = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok sf-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      // ¿Lo escrito desarrolla bien pero el factor no es el máximo?
      const G = Number(typed[0]), inner = typed.slice(1).map(Number);
      const smaller = G > 0 && G < round.g && inner.every((v, i) => v * G === round.outer[i]);
      const why = smaller ? `${G} es común, pero no el mayor: dentro aún se puede sacar ${round.g / G}. ` : "";
      const after = () => (lives <= 0 ? finish(false) : nextRound());
      feedback.innerHTML = `${why}💡 ${round.hint} <button type="button" class="sf-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad sf-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", () => { clearTimeout(pending); after(); });
      pending = setTimeout(after, 2500);
    }
  }

  // Teclado físico: cifras, ⌫, Enter y flechas.
  function onKey(e) {
    if (finished || !round) return;
    if (busy) {
      if (e.key === "Enter") body.querySelector("[data-next]")?.click();
      return;
    }
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
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
    saveScore(client, "sacafactor", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧲</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} factores comunes bien sacados de ${rounds}</p>
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
