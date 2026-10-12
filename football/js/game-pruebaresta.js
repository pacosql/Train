// "La prueba de la resta": una resta ya hecha en columna (minuendo,
// sustraendo y diferencia) y a su lado el recuadro de "Prueba" con la suma
// sustraendo + diferencia en columna y casillas para el resultado (se
// rellenan de derecha a izquierda). Desde el nivel 2 la resta puede estar
// mal hecha: tras escribir la prueba se toca "✓ está bien" o "✗ está mal".
// En el último nivel, la prueba de la división: d × c + r = D.
import { randInt, pick, saveScore } from "./utils.js";

const dig = (n, i) => Math.floor(n / 10 ** i) % 10;
const len = (n) => String(n).length;
const noCarry = (x, y) => Array.from({ length: 4 }, (_, i) => dig(x, i) + dig(y, i) < 10).every(Boolean);

// Errores típicos al restar: olvidar la llevada, restar la pequeña de la
// grande en cada columna, o equivocarse en una unidad o una decena.
function wrongDiff(a, b) {
  const r = a - b;
  let forgot = 0, swap = 0;
  for (let i = 0; i < len(a); i++) {
    forgot += ((dig(a, i) - dig(b, i) + 10) % 10) * 10 ** i;
    swap += Math.abs(dig(a, i) - dig(b, i)) * 10 ** i;
  }
  const opts = [forgot, swap, r + 1, r - 1, r + 10, r - 10].filter((x) => x !== r && x > 0 && len(x) <= len(a));
  return pick(opts);
}

// Niveles: 0 prueba sin llevada · 1 con llevada · 2 a veces la resta está
// mal · 3 prueba de la división (d × c + r = D).
export function buildRound(level) {
  if (level >= 3) {
    const d = randInt(2, 9);
    let c = randInt(11, 99);
    if (c % 10 === 0) c++;
    const r = randInt(0, d - 1), D = d * c + r;
    let cs = c, rs = r;
    const wrong = Math.random() < 0.5;
    if (wrong) {
      const opts = [[c + 1, r], [c - 1, r], [c + 10, r], [c - 10, r], [c, (r + randInt(1, d - 1)) % d]].filter(([x, y]) => x > 9 && x < 100 && d * x + y !== D);
      [cs, rs] = pick(opts);
    }
    const prod = d * cs, total = prod + rs;
    const ok = total === D;
    const hint = `d × c + r = D: ${d} × ${cs} = ${prod}, ${prod} + ${rs} = ${total}` +
      (ok ? `, igual que el dividendo ✓` : `, y no ${D} ✗: la división está mal (era ${D} : ${d} = ${c}, resto ${r})`);
    return { kind: "div", D, d, cs, rs, prod, total, ok, verdict: true, lines: [prod, total], hint };
  }
  let a, b;
  for (;;) {
    b = randInt(level === 0 ? 11 : 12, level === 0 ? 48 : 499);
    const r0 = randInt(level === 0 ? 11 : 12, level === 0 ? 50 : 499);
    a = b + r0;
    if (a > 999 || b % 10 === 0 || r0 % 10 === 0) continue;
    if (level === 0 && !noCarry(b, r0)) continue;
    if (level === 1 && noCarry(b, r0)) continue;
    break;
  }
  const verdict = level >= 2;
  const wrong = verdict && Math.random() < 0.5;
  const rs = wrong ? wrongDiff(a, b) : a - b;
  const total = b + rs, ok = total === a;
  const hint = `Si sumo lo que quito y lo que queda, me tiene que dar lo que tenía: ${b} + ${rs} = ${total}` +
    (ok ? ` ✓` : `, y no ${a} ✗: la resta está mal (era ${a} − ${b} = ${a - b})`);
  return { kind: "sub", a, b, rs, total, ok, verdict, lines: [total], hint };
}

export function mountPruebarestaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, slots, typed, active, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body pr-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const onKey = (e) => {
    if (/^\d$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
  };

  // Una fila de w celdas con un número fijo alineado a la derecha.
  const cells = (n, w) => Array.from({ length: w }, (_, c) => `<span class="pr-cell">${w - 1 - c < len(n) ? dig(n, w - 1 - c) : ""}</span>`).join("");
  const row = (sign, inner, cls = "") => `<div class="pr-row ${cls}"><span class="pr-sign">${sign}</span>${inner}</div>`;
  const slotRow = (line, w) =>
    Array.from({ length: w }, (_, c) => {
      const k = slots.findIndex((s) => s.line === line && s.i === w - 1 - c);
      return k >= 0 ? `<button type="button" class="pr-cell pr-slot" data-slot="${k}"></button>` : `<span class="pr-cell"></span>`;
    }).join("");

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(3, Math.floor(hits / 2)));
    // Casillas: cada línea de la prueba, de derecha a izquierda.
    slots = [];
    round.lines.forEach((v, line) => { for (let i = 0; i < len(v); i++) slots.push({ line, i, want: String(dig(v, i)) }); });
    typed = slots.map(() => "");
    active = 0;
    busy = false;
    let left, proof;
    if (round.kind === "sub") {
      const w = len(round.a), pw = len(round.total) > len(round.a) ? len(round.total) : w;
      left = `<div class="pr-sheet">${row("", cells(round.a, w))}${row("−", cells(round.b, w))}${row("", cells(round.rs, w), "pr-line")}</div>`;
      proof = `${row("", cells(round.b, pw))}${row("+", cells(round.rs, pw))}${row("", slotRow(0, pw), "pr-line")}`;
    } else {
      const { D, d, cs, rs } = round;
      const w = Math.max(len(round.prod), len(round.total));
      left = `<div class="pr-caja"><div class="pr-dd">${D}</div><div class="pr-dv">${d}</div><div class="pr-rr">${rs}</div><div class="pr-cc">${cs}</div></div>`;
      proof = `${row("", cells(cs, w))}${row("×", cells(d, w))}${row("", slotRow(0, w), "pr-line")}${row("+", cells(rs, w))}${row("", slotRow(1, w), "pr-line")}`;
    }
    const what = round.kind === "sub" ? "resta" : "división";
    body.innerHTML = `
      <p class="prompt pr-prompt">${round.verdict ? `¿Está bien la ${what}? Haz la prueba` : "Haz la prueba de la resta"}</p>
      <div class="pr-wrap pr-cuaderno">
        ${left}
        <div class="pr-proof"><div class="pr-title">Prueba</div>${proof}</div>
      </div>
      <div class="keypad pr-keypad" data-keypad></div>
      ${round.verdict ? `<div class="pr-verdict"><button type="button" class="choice-btn pr-yes" data-verdict="1">✓ está bien</button><button type="button" class="choice-btn pr-no" data-verdict="0">✗ está mal</button></div>` : ""}
      <div class="feedback pr-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
    body.querySelectorAll("[data-verdict]").forEach((b) => b.addEventListener("click", () => check(b.dataset.verdict === "1")));
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
      const k = +b.dataset.slot;
      if (!busy) b.textContent = typed[k];
      b.classList.toggle("active", !busy && k === active);
    });
    // Los botones de veredicto se activan cuando la prueba está escrita.
    const full = !typed.includes("");
    body.querySelectorAll("[data-verdict]").forEach((b) => (b.disabled = busy || !full));
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return check(null);
    if (key === "⌫") {
      if (typed[active] === "" && active > 0) active--;
      typed[active] = "";
    } else {
      typed[active] = key;
      if (active < typed.length - 1) active++;
    }
    paint();
  }

  // said: true = "está bien", false = "está mal", null = ✓ del teclado.
  function check(said) {
    if (finished || busy) return;
    const feedback = body.querySelector("[data-feedback]");
    const missing = typed.indexOf("");
    if (missing >= 0 || (round.verdict && said === null)) {
      if (missing >= 0) active = missing;
      paint();
      feedback.textContent = missing >= 0 ? "Faltan casillas por rellenar" : "Ahora toca ✓ está bien o ✗ está mal";
      feedback.className = "feedback bad pr-feedback";
      return;
    }
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot;
      const ok = typed[k] === slots[k].want;
      allOk = allOk && ok;
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${typed[k]}</s><i class="pr-fix">${slots[k].want}</i>`;
    });
    if (round.verdict) {
      const right = said === round.ok;
      allOk = allOk && right;
      body.querySelector(`[data-verdict="${round.ok ? 1 : 0}"]`).classList.add("correct");
      if (!right) body.querySelector(`[data-verdict="${said ? 1 : 0}"]`).classList.add("wrong");
    }
    paint();
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok pr-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.innerHTML = `✗ ${round.verdict ? (round.ok ? "La cuenta estaba bien. " : "La cuenta estaba mal. ") : ""}💡 ${round.hint} <button type="button" class="pr-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad pr-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 2500);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "pruebaresta", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧾</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} pruebas bien hechas de ${rounds}</p>
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
