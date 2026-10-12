// "Regla de Ruffini": la tabla del libro de 3.º-4.º ESO. Arriba los
// coeficientes, abajo a la izquierda el número (raya vertical), debajo la
// fila de productos y, tras la raya horizontal, la fila de resultados con
// el resto separado. Se rellena como en clase: bajo el primero, multiplico,
// sumo… y al final cociente y resto (o P(a), o "¿es raíz?" con SÍ/NO).
import { randInt, pick, saveScore } from "./utils.js";

const M = "−";
const sg = (n) => (n < 0 ? M + Math.abs(n) : String(n));
const par = (n) => (n < 0 ? `(${sg(n)})` : String(n));
const SUP = ["", "", "²", "³", "⁴"];

// Polinomio escrito como en el libro (sin términos nulos, sin "1x").
export function polyText(c, X = "x") {
  const deg = c.length - 1;
  let s = "";
  c.forEach((a, i) => {
    const e = deg - i, abs = Math.abs(a);
    if (a === 0) return;
    const body = e === 0 ? String(abs) : (abs === 1 ? "" : abs) + X + SUP[e];
    s += s === "" ? (a < 0 ? M : "") + body : (a < 0 ? ` ${M} ` : " + ") + body;
  });
  return s || "0";
}
const divisor = (r, X = "x") => `${X} ${r < 0 ? "+" : M} ${Math.abs(r)}`;

// Ruffini puro: fila de productos y fila de resultados.
export function ruffini(c, r) {
  const prod = [null], res = [c[0]];
  for (let i = 1; i < c.length; i++) { prod.push(res[i - 1] * r); res.push(c[i] + prod[i]); }
  return { prod, res };
}

// Niveles: 0 grado 2 entre (x − 1) · 1 grado 3 · 2 con negativos ·
// 3 teorema del resto (P(a) = resto) · 4 ¿es x = a raíz? (SÍ/NO).
export function buildRound(level) {
  const mode = level <= 2 ? "cociente" : level === 3 ? "resto" : "raiz";
  let c, r;
  for (;;) {
    if (level === 0) { r = 1; c = [1, randInt(1, 6), randInt(1, 9)]; }
    else if (level === 1) { r = randInt(1, 3); c = [randInt(1, 2), randInt(0, 5), randInt(0, 6), randInt(1, 9)]; }
    else if (level === 4 && Math.random() < 0.5) {
      // Raíz de verdad: P = (x − r)·Q
      r = pick([-3, -2, -1, 1, 2, 3]);
      const q = [pick([1, 1, -1, 2]), randInt(-4, 4), randInt(-5, 5)];
      if (q[2] === 0) continue;
      c = [q[0], q[1] - r * q[0], q[2] - r * q[1], -r * q[2]];
    } else {
      r = pick([-3, -2, -1, 1, 2, 3]);
      c = [pick([1, 1, -1, 2]), randInt(-6, 6), randInt(-6, 6), randInt(-9, 9)];
      if (c[3] === 0) continue;
      if (r > 0 && c.every((a) => a >= 0)) continue; // en este nivel, con negativos
    }
    const { prod, res } = ruffini(c, r);
    if ([...prod.slice(1), ...res, ...c].some((v) => Math.abs(v) > 60)) continue;
    if (level === 0 && res[2] === 0) continue;
    break;
  }
  const { prod, res } = ruffini(c, r);
  const n = c.length, R = res[n - 1], q = res.slice(0, -1);
  // Orden de clase: bajo el primero; luego, por columnas, producto y suma.
  const slots = [{ k: "res", i: 0, want: res[0] }];
  for (let i = 1; i < n; i++) slots.push({ k: "prod", i, want: prod[i] }, { k: "res", i, want: res[i] });
  if (mode === "cociente") q.forEach((v, i) => slots.push({ k: "q", i, want: v })), slots.push({ k: "R", i: 0, want: R });
  if (mode === "resto") slots.push({ k: "P", i: 0, want: R });
  // Términos que faltan: se escribe un 0 en su sitio (como en el libro)
  const gaps = c.map((a, i) => (i > 0 && a === 0 ? (n - 1 - i ? "en x" + SUP[n - 1 - i] : "independiente") : null)).filter(Boolean);
  const note = gaps.length ? `Falta${gaps.length > 1 ? "n los términos" : " el término"} ${gaps.join(" y ")}: pongo 0 en su sitio. ` : "";
  const steps = [`${note}Bajo el ${sg(c[0])}`];
  for (let i = 1; i < n; i++) steps.push(`${sg(res[i - 1])} · ${par(r)} = ${sg(prod[i])}, ${sg(prod[i])} + ${par(c[i])} = ${sg(res[i])}`);
  const tail = mode === "cociente" ? `cociente ${polyText(q)}, resto ${sg(R)}`
    : mode === "resto" ? `el resto es P(${sg(r)}) = ${sg(R)} (teorema del resto)`
    : R === 0 ? `resto 0: x = ${sg(r)} SÍ es raíz` : `resto ${sg(R)} ≠ 0: x = ${sg(r)} NO es raíz`;
  return { mode, c, r, prod, res, q, R, slots, root: R === 0, hint: `${steps.join("; ")} → ${tail}` };
}

export function mountRuffiniGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, vals, active, phase, said;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats"><span class="lives" data-lives></span><span class="score" data-score>⭐ 0</span></div>
    </div>
    <div class="game-body rf-body" data-body></div>`;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const X = "<i>x</i>";
  const slotBtn = (k, i) => `<button type="button" class="rf-slot" data-k="${k}" data-i="${i}"></button>`;

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 2)));
    vals = round.slots.map(() => "");
    active = 0;
    phase = "fill";
    said = null;
    const { c, r, mode } = round, n = c.length;
    // Tabla: columna 0 = el número; columnas 1..n = coeficientes.
    let grid = `<span class="rf-c rf-left"></span>${c.map((a) => `<span class="rf-c rf-coef">${sg(a)}</span>`).join("")}`;
    grid += `<span class="rf-c rf-left rf-under rf-num">${sg(r)}</span><span class="rf-c rf-under"></span>`;
    for (let i = 1; i < n; i++) grid += `<span class="rf-c rf-under">${slotBtn("prod", i)}</span>`;
    grid += `<span class="rf-c"></span>`;
    for (let i = 0; i < n; i++) grid += `<span class="rf-c${i === n - 1 ? " rf-resto" : ""}">${slotBtn("res", i)}</span>`;
    const qLine = round.q.map((_, i) => {
      const e = round.q.length - 1 - i;
      return `${i ? " + " : ""}${slotBtn("q", i)}${e ? X + SUP[e] : ""}`;
    }).join("");
    const head = mode === "cociente"
      ? `(${polyText(c, X)}) : (${divisor(r, X)})`
      : `P(${X}) = ${polyText(c, X)}`;
    const tail = mode === "cociente"
      ? `<div class="rf-line">C(${X}) = ${qLine}</div><div class="rf-line">R = ${slotBtn("R", 0)}</div>`
      : mode === "resto" ? `<div class="rf-line">P(${sg(r)}) = ${slotBtn("P", 0)}</div>`
      : `<div class="rf-yesno" data-yesno hidden><span>¿Es ${X} = ${sg(r)} raíz?</span>
          <button type="button" class="choice-btn rf-yn" data-yn="si">SÍ</button><button type="button" class="choice-btn rf-yn" data-yn="no">NO</button></div>`;
    const prompt = mode === "cociente" ? "Divide por Ruffini" : mode === "resto" ? `Halla P(${sg(r)}) con Ruffini` : `¿Es ${X} = ${sg(r)} raíz de P(${X})?`;
    body.innerHTML = `
      <p class="prompt rf-prompt">${prompt}</p>
      <div class="rf-cuaderno">
        <div class="rf-head">${head}</div>
        <div class="rf-table" style="--rf-n:${n}">${grid}</div>
        ${tail}
      </div>
      <div class="keypad rf-keypad" data-keypad></div>
      <button type="button" class="choice-btn keypad-sign rf-sign" data-sign>${M} cambiar signo</button>
      <div class="feedback rf-feedback" data-feedback></div>`;
    body.querySelectorAll(".rf-slot").forEach((b) => b.addEventListener("click", () => {
      if (phase !== "fill") return;
      active = round.slots.findIndex((s) => s.k === b.dataset.k && s.i === +b.dataset.i);
      paint();
    }));
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
    body.querySelectorAll("[data-yn]").forEach((b) => b.addEventListener("click", () => {
      if (phase !== "ask") return;
      said = b.dataset.yn;
      b.classList.add("rf-said");
      check();
    }));
    paint();
  }

  const slotEl = (s) => body.querySelector(`.rf-slot[data-k="${s.k}"][data-i="${s.i}"]`);
  function paint() {
    round.slots.forEach((s, j) => {
      const b = slotEl(s);
      b.textContent = vals[j].replace("-", M);
      b.classList.toggle("active", phase === "fill" && j === active);
    });
  }
  const filled = (v) => /\d/.test(v);
  const say = (text, cls) => {
    const fb = body.querySelector("[data-feedback]");
    fb.textContent = text;
    fb.className = `feedback rf-feedback ${cls}`;
  };

  function pressKey(key) {
    if (finished) return;
    if (phase === "done") return key === "✓" && body.querySelector("[data-next]")?.click();
    if (phase !== "fill") return;
    const v = vals[active];
    if (key === "✓") {
      if (vals.every(filled)) return round.mode === "raiz" ? askRoot() : check();
      if (!filled(v)) return say("Escribe un número en la casilla marcada", "bad");
      for (let k = 1; k <= vals.length; k++) if (!filled(vals[(active + k) % vals.length])) { active = (active + k) % vals.length; break; }
    } else if (key === "⌫") vals[active] = v === "-" ? "" : v.slice(0, -1);
    else if (key === "±") vals[active] = v.startsWith("-") ? v.slice(1) : "-" + v;
    else if (v.replace("-", "").length < 3) vals[active] = v + key;
    say("", "");
    paint();
  }

  // Nivel "¿es raíz?": con la tabla rellena aparece la pregunta SÍ/NO.
  function askRoot() {
    phase = "ask";
    paint();
    body.querySelector("[data-yesno]").hidden = false;
    say("Mira el resto y contesta", "");
  }

  function check() {
    phase = "done";
    rounds++;
    let allOk = true;
    round.slots.forEach((s, j) => {
      const b = slotEl(s), ok = Number(vals[j]) === s.want;
      allOk &&= ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${vals[j].replace("-", M)}</s><b>${sg(s.want)}</b>`;
    });
    if (round.mode === "raiz") {
      const want = round.root ? "si" : "no";
      body.querySelectorAll("[data-yn]").forEach((b) => b.dataset.yn === want ? b.classList.add("correct") : b.dataset.yn === said && b.classList.add("wrong"));
      allOk &&= said === want;
    }
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      say(`✓ 💡 ${round.hint}`, "ok");
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      say(`✗ 💡 ${round.hint}`, "bad");
      const btn = document.createElement("button");
      btn.className = "primary rf-next";
      btn.dataset.next = "";
      btn.textContent = lives <= 0 ? "Ver resultado →" : "Siguiente →";
      btn.addEventListener("click", () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); });
      body.querySelector("[data-feedback]").appendChild(btn);
    }
  }

  // Teclado físico: cifras, retroceso, Enter, "-" para el signo.
  const onKey = (e) => {
    if (finished) return;
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
    else if (e.key === "-") pressKey("±");
    else return;
    e.preventDefault();
  };
  window.addEventListener("keydown", onKey);

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "ruffini", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📐</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} divisiones por Ruffini bien hechas de ${rounds}</p>
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
