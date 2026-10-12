// "Raíz cuadrada entera": la caja de la raíz como en el libro. El número
// bajo el signo √ (con su raya por encima), a su derecha la raya vertical,
// la raíz arriba a la derecha con una raya debajo, y bajo esa raya las
// cuentas de ayuda ("66 × 6 = 396"). A la izquierda se restan los
// cuadrados y quedan los restos. Niveles bajos: raíz entera y resto por
// tanteo (√60 → 7, −49, resto 11). Niveles altos: el algoritmo de 4 cifras
// con los grupos de dos cifras separados (12'96): raíz del primer grupo,
// resta, bajar el grupo siguiente, doble de la raíz, la cifra que cabe y
// el resto final; en el último nivel, además, la prueba r² + resto = n.
import { randInt, saveScore } from "./utils.js";

const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const digitsOf = (n) => String(n).split("");

// Niveles: 0 número de 2 cifras · 1 de 3 cifras (tanteo) · 2 algoritmo de
// 4 cifras guiado · 3 algoritmo + prueba.
export function buildRound(level) {
  const algo = level >= 2;
  let N, a, r1, R, b, prod, r2, root, rest;
  for (;;) {
    N = level === 0 ? randInt(10, 99) : level === 1 ? randInt(100, 999) : randInt(1000, 9999);
    if (!algo) {
      root = Math.floor(Math.sqrt(N));
      while (root * root > N) root--;
      while ((root + 1) * (root + 1) <= N) root++;
      rest = N - root * root;
      break;
    }
    const g1 = Math.floor(N / 100), g2 = N % 100;
    for (a = 9; a * a > g1; a--);
    r1 = g1 - a * a;
    R = r1 * 100 + g2;
    for (b = 9; (20 * a + b) * b > R; b--);
    if (b === 0) continue; // la cifra 0 no enseña el paso "cuánto cabe"
    prod = (20 * a + b) * b;
    r2 = R - prod;
    root = 10 * a + b;
    rest = r2;
    break;
  }
  const W = String(N).length;
  const slots = [];
  // Cifras de n alineadas a la derecha en la columna `end` (filas de la izquierda).
  const put = (kind, n, end, row) => digitsOf(n).forEach((ch, j, arr) => slots.push({ kind, row, col: end - arr.length + 1 + j, want: ch }));
  let hint;
  if (!algo) {
    digitsOf(root).forEach((ch, j) => slots.push({ kind: "r", col: j, want: ch }));
    put("sq", root * root, W - 1, 1);
    put("rest", rest, W - 1, 2);
    hint = `${root}² = ${fmt(root * root)} ≤ ${fmt(N)} < ${fmt((root + 1) ** 2)} = ${root + 1}²; ${fmt(N)} − ${fmt(root * root)} = ${rest}`;
  } else {
    slots.push({ kind: "a", want: String(a) });
    put("sq", a * a, 1, 1);
    put("r1", r1, 1, 2);
    digitsOf(2 * a).forEach((ch, j) => slots.push({ kind: "d", col: j, want: ch }));
    slots.push({ kind: "b", want: String(b) });
    digitsOf(prod).forEach((ch, j) => slots.push({ kind: "p", col: j, want: ch }));
    put("r2", r2, 3, 4);
    if (level >= 3) digitsOf(root * root).forEach((ch, j) => slots.push({ kind: "pr", col: j, want: ch }));
    const g1 = Math.floor(N / 100), g2 = String(N % 100).padStart(2, "0");
    const nxt = b < 9 ? ` (${2 * a}${b + 1} × ${b + 1} = ${fmt((20 * a + b + 1) * (b + 1))} no cabe)` : "";
    hint = `Separo en grupos de dos: ${g1}'${g2}. √${g1} → ${a} (${a}² = ${a * a} ≤ ${g1} < ${(a + 1) ** 2}); ${g1} − ${a * a} = ${r1} y bajo el ${g2} → ${R}. Doble de ${a} = ${2 * a}; ${2 * a}□ × □ ≤ ${R}: ${2 * a}${b} × ${b} = ${fmt(prod)}${nxt} → ${b} sube a la raíz; ${fmt(R)} − ${fmt(prod)} = ${r2}`;
    if (level >= 3) hint += `. Prueba: ${root}² + ${r2} = ${fmt(root * root)} + ${r2} = ${fmt(N)} ✓`;
  }
  return { N, W, algo, level, a, r1, R, b, prod, r2, root, rest, slots, hint, prueba: level >= 3 };
}

export function mountRaizalgoritmoGame(container, { client, onExit }) {
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
    <div class="game-body ra-body" data-body></div>
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

  const cell = (txt = "", cls = "") => `<span class="ra-cell ${cls}">${txt}</span>`;
  const slotBtn = (i) => `<button type="button" class="ra-cell ra-slot" data-slot="${i}"></button>`;
  const slotsOf = (kind) => round.slots.map((s, i) => [s, i]).filter(([s]) => s.kind === kind);
  const echo = (kind) => `<span class="ra-echo" data-echo="${kind}"></span>`;

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(3, Math.floor(hits / 2)));
    typed = round.slots.map(() => "");
    active = 0;
    busy = false;
    const { N, W, algo, slots } = round;
    const nRows = algo ? 5 : 3;
    // Rejilla de la izquierda: columna del signo + W columnas de cifras.
    const grid = Array.from({ length: nRows }, () => Array.from({ length: W + 1 }, () => cell()));
    slots.forEach((s, i) => s.row !== undefined && (grid[s.row][s.col + 1] = slotBtn(i)));
    // El "−" va justo a la izquierda de la primera cifra que se resta.
    const sqEnd = algo ? 1 : W - 1, sqLen = String(algo ? round.a * round.a : round.root ** 2).length;
    grid[1][sqEnd - sqLen + 1] = cell("−", "ra-minus");
    if (algo) {
      digitsOf(N).slice(2).forEach((ch, j) => (grid[2][3 + j] = cell(ch, "ra-baja")));
      grid[3][4 - String(round.prod).length] = cell("−", "ra-minus");
      digitsOf(round.prod).forEach((_, j, arr) => (grid[3][4 - arr.length + 1 + j] = `<span class="ra-cell ra-copy" data-copy="${j}"></span>`));
    }
    const rad = digitsOf(N).map((ch, j) => cell(ch, `ra-fixed${algo && j === 1 ? " ra-tick" : ""}`)).join("");
    const rows = grid.map((r, k) =>
      k === 0
        ? `<div class="ra-row"><span class="ra-cell ra-signo"><svg viewBox="0 0 28 34" width="28" height="34"><path d="M2 21 L7 18 L13.5 32 L24.5 1.5 L28 1.5"/></svg></span><span class="ra-num">${rad}</span></div>`
        : `<div class="ra-row" data-row="${k}">${r.join("")}</div>`
    );
    let rootHtml, aux;
    if (!algo) {
      rootHtml = slotsOf("r").map(([, i]) => slotBtn(i)).join("");
      aux = `<div class="ra-auxrow">${echo("rr")}</div>`;
    } else {
      rootHtml = slotBtn(slotsOf("a")[0][1]) + `<span class="ra-cell ra-copy" data-echo="b2"></span>`;
      aux = `<div class="ra-auxrow">${slotsOf("d").map(([, i]) => slotBtn(i)).join("")}${slotBtn(slotsOf("b")[0][1])}<span class="ra-op">×</span>${echo("b")}</div>
        <div class="ra-auxrow"><span class="ra-op">=</span>${slotsOf("p").map(([, i]) => slotBtn(i)).join("")}</div>`;
    }
    const prueba = round.prueba
      ? `<div class="ra-prueba">Prueba: ${echo("root")}² = ${slotsOf("pr").map(([, i]) => slotBtn(i)).join("")}<span data-prfin></span></div>`
      : "";
    body.innerHTML = `
      <p class="prompt ra-prompt">${algo ? "Haz la raíz cuadrada" : "Raíz cuadrada entera y resto"}</p>
      <div class="ra-cuaderno">
        <div class="ra-caja">
          <div class="ra-izq">${rows.join("")}</div>
          <div class="ra-der"><div class="ra-raiz">${rootHtml}</div>${aux}</div>
        </div>
        ${prueba}
      </div>
      <div class="keypad ra-keypad" data-keypad></div>
      <div class="feedback ra-feedback" data-feedback></div>
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

  // Lo que el niño ha escrito en un tipo de casilla (o "?" si falta algo).
  const typedOf = (kind) => {
    const v = slotsOf(kind).map(([, i]) => typed[i]);
    return v.every((x) => x !== "") ? v.join("") : "";
  };

  function paint() {
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot;
      if (!busy) b.textContent = typed[k];
      b.classList.toggle("active", !busy && k === active);
    });
    // Copias: lo escrito una vez aparece donde se vuelve a escribir en el libro.
    const set = (sel, txt) => body.querySelectorAll(sel).forEach((e) => (e.textContent = txt));
    if (!round.algo) {
      const r = typedOf("r");
      set('[data-echo="rr"]', r ? `${r} × ${r}` : "");
    } else {
      set('[data-echo="b"]', typed[slotsOf("b")[0][1]]);
      set('[data-echo="b2"]', typed[slotsOf("b")[0][1]]);
      const p = typedOf("p");
      body.querySelectorAll("[data-copy]").forEach((e, j) => (e.textContent = p ? p[j] : ""));
      const r1 = busy || typedOf("r1") !== "";
      body.querySelectorAll(".ra-baja").forEach((e) => e.classList.toggle("ra-show", r1));
      const a = typed[slotsOf("a")[0][1]], b = typed[slotsOf("b")[0][1]];
      set('[data-echo="root"]', a && b ? a + b : "□□");
    }
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return check();
    if (key === "⌫") {
      if (typed[active] === "" && active > 0) active--;
      typed[active] = "";
    } else {
      typed[active] = key;
      if (active < typed.length - 1) active++;
    }
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const missing = typed.indexOf("");
    if (missing >= 0) {
      active = missing;
      paint();
      feedback.textContent = "Faltan casillas por rellenar";
      feedback.className = "feedback bad ra-feedback";
      return;
    }
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot, s = round.slots[k];
      const ok = typed[k] === s.want;
      allOk = allOk && ok;
      b.classList.add(ok ? "good" : "bad");
      if (ok) b.textContent = typed[k];
      else b.innerHTML = `<s>${typed[k]}</s><i class="ra-fix">${s.want}</i>`;
    });
    paint();
    const fin = body.querySelector("[data-prfin]");
    if (fin) fin.textContent = ` → ${fmt(round.root ** 2)} + ${round.rest} = ${fmt(round.N)}`;
    const text = `√${fmt(round.N)} = ${round.root}, resto ${round.rest}`;
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${text}. 💡 ${round.hint}`;
      feedback.className = "feedback ok ra-feedback";
      pending = setTimeout(nextRound, round.algo ? 1400 : 900);
    } else {
      lives--;
      renderLives();
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.innerHTML = `Era ${text}. 💡 ${round.hint} <button type="button" class="ra-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad ra-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, round.algo ? 6000 : 3000);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "raizalgoritmo", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>√</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} raíces bien hechas de ${rounds}</p>
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
