// "Monomios" (1º-2º ESO): la operación escrita como en el libro, con
// casillas para el coeficiente y para el exponente ("3x² · 2x³ = □x^□",
// "3x + 5x − 2x = □x", "grado de 4x³y²: □") sobre papel cuadriculado.
// Teclado numérico (y "− cambiar signo" cuando hay negativos); el foco va
// de izquierda a derecha. 💡 "Sumo coeficientes y dejo la parte literal:
// 3 + 5 − 2 = 6 → 6x".
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
const sup = (n) => String(n).split("").map((c) => SUP[c]).join("");
const M = "−";
const s = (n) => String(n).replace("-", M);
// Monomio en marcado (b^{e}) y en texto del 💡 (con superíndices).
const lit = (l, e) => (e === 1 ? l : `${l}^{${e}}`);
const mono = (c, l, e = 1) => `${c === 1 ? "" : c === -1 ? M : s(c)}${lit(l, e)}`;
const monoT = (c, l, e = 1) => `${c === 1 ? "" : c === -1 ? M : s(c)}${l}${e === 1 ? "" : sup(e)}`;
const nz = (lo, hi) => { let v; do v = randInt(lo, hi); while (v === 0); return v; };

// Suma de términos semejantes en marcado: "3x + 5x − 2x".
function sum(terms) {
  return terms.map(([c, l, e], i) => (i === 0 ? mono(c, l, e) : `${c < 0 ? M : "+"} ${mono(Math.abs(c), l, e)}`)).join(" ");
}
const part = (cs, l, r) => (cs.length > 1 ? `${sumT(cs)} = ${r} → ${r}${l}` : `solo está ${r}${l}`);
const sumT = (cs) => cs.map((c, i) => (i === 0 ? s(c) : `${c < 0 ? M : "+"} ${Math.abs(c)}`)).join(" ");

// Niveles: 0 suma de semejantes · 1 con dos letras · 2 producto ·
// 3 cociente · 4 grado · 5 de todo (con negativos).
export function buildRound(level) {
  const mix = level >= 5;
  if (mix) level = randInt(0, 4);
  const negOk = mix || level >= 2;
  if (level === 0) {
    const [l, e] = pick([["x", 1], ["x", 1], ["x", 2], ["a", 1], ["y", 3]]);
    const n = randInt(2, 3), cs = [randInt(1, 9)];
    for (let i = 1; i < n; i++) cs.push(Math.random() < 0.35 ? -randInt(1, 6) : randInt(1, 9));
    const r = cs.reduce((a, b) => a + b, 0);
    if (r === 0 || r === 1 || (!mix && r < 0) || Math.abs(r) > 25) return buildRound(mix ? 5 : 0);
    return { level, neg: mix, text: `${sum(cs.map((c) => [c, l, e]))} = [0]${lit(l, e)}`, answers: [r],
      hint: `Sumo coeficientes y dejo la parte literal: ${sumT(cs)} = ${s(r)} → ${monoT(r, l, e)}` };
  }
  if (level === 1) {
    // 3-4 términos mezclando x e y; se agrupan por letras.
    const terms = shuffle([["x", randInt(1, 7)], ["y", randInt(1, 7)], [pick(["x", "y"]), Math.random() < 0.3 ? -randInt(1, 3) : randInt(1, 6)]]);
    if (Math.random() < 0.4) terms.push([pick(["x", "y"]), randInt(1, 5)]);
    const cx = terms.filter((t) => t[0] === "x").map((t) => t[1]), cy = terms.filter((t) => t[0] === "y").map((t) => t[1]);
    const rx = cx.reduce((a, b) => a + b, 0), ry = cy.reduce((a, b) => a + b, 0);
    if (rx < 2 || ry < 2 || terms[0][1] < 0) return buildRound(mix ? 5 : 1);
    return { level, neg: mix, text: `${sum(terms.map(([l, c]) => [c, l, 1]))} = [0]x + [1]y`, answers: [rx, ry],
      hint: `Junto las x: ${part(cx, "x", rx)}; y las y: ${part(cy, "y", ry)}` };
  }
  if (level === 2) {
    const a = nz(-5, 6), b = randInt(2, 6), m = randInt(1, 5), n = randInt(1, 5);
    if (Math.abs(a) < 2) return buildRound(mix ? 5 : 2);
    const A = a < 0 ? `(${mono(a, "x", m)})` : mono(a, "x", m);
    return { level, neg: negOk, text: `${A} · ${mono(b, "x", n)} = [0]x^{[1]}`, answers: [a * b, m + n],
      hint: `Multiplico coeficientes ${s(a)} · ${b} = ${s(a * b)} y sumo exponentes ${m} + ${n} = ${m + n} → ${monoT(a * b, "x", m + n)}` };
  }
  if (level === 3) {
    const c = randInt(2, 5), q = nz(-5, 6), n = randInt(1, 3), m = randInt(n + 2, 8);
    if (Math.abs(q) < 2) return buildRound(mix ? 5 : 3);
    return { level, neg: negOk, text: `(${mono(c * q, "x", m)}) : (${mono(c, "x", n)}) = [0]x^{[1]}`, answers: [q, m - n],
      hint: `Divido coeficientes ${s(c * q)} : ${c} = ${s(q)} y resto exponentes ${m} − ${n} = ${m - n} → ${monoT(q, "x", m - n)}` };
  }
  // Grado: suma de los exponentes de todas las letras (x sin exponente es x¹).
  const c = nz(-9, 9), ex = randInt(1, 5), ey = pick([0, 1, 2, 3, 4]), ez = ey && Math.random() < 0.2 ? randInt(1, 3) : 0;
  const parts = [["x", ex], ["y", ey], ["z", ez]].filter((p) => p[1] > 0);
  const text = `${c === 1 ? "" : c === -1 ? M : s(c)}${parts.map(([l, e]) => lit(l, e)).join("")}`;
  const g = ex + ey + ez;
  return { level, neg: negOk, text: `grado de ${text}: [0]`, answers: [g],
    hint: parts.length === 1 ? `El grado es el exponente de la letra: ${g}${ex === 1 ? " (x es x¹)" : ""}`
      : `El grado es la suma de los exponentes de las letras: ${parts.map((p) => p[1]).join(" + ")} = ${g}${parts.some((p) => p[1] === 1) ? " (sin exponente es 1)" : ""}` };
}

// Marcado → HTML: exponentes en superíndice, letras en cursiva y casillas.
function render(t) {
  let out = "", i = 0;
  while (i < t.length) {
    const c = t[i];
    if (c === "^") {
      let d = 0, j = i + 1;
      for (; j < t.length; j++) { if (t[j] === "{") d++; else if (t[j] === "}" && --d === 0) break; }
      out += `<sup class="mo-sup">${render(t.slice(i + 2, j))}</sup>`;
      i = j + 1;
    } else if (c === "[") { const j = t.indexOf("]", i); out += `<button type="button" class="mo-slot" data-slot="${t.slice(i + 1, j)}"></button>`; i = j + 1; }
    else if (/[xyza]/.test(c)) { out += `<i>${c}</i>`; i++; }
    else { out += c; i++; }
  }
  return out;
}

export function mountMonomiosGame(container, { client, onExit }) {
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
    <div class="game-body mo-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    if (finished) return;
    const last = round && round.text;
    do round = buildRound(Math.min(5, Math.floor(hits / 3))); while (round.text === last);
    typed = round.answers.map(() => "");
    active = 0;
    busy = false;
    const grado = round.text.startsWith("grado");
    body.innerHTML = `
      <p class="prompt mo-prompt">${grado ? "¿Qué grado tiene el monomio?" : round.text.includes("·") ? "Multiplica los monomios" : round.text.includes(":") ? "Divide los monomios" : "Reduce los términos semejantes"}</p>
      <div class="mo-cuaderno"><div class="mo-expr" data-expr>${grado ? `grado de ${render(round.text.slice(9))}` : render(round.text)}</div></div>
      <div class="keypad mo-keypad" data-keypad></div>
      ${round.neg ? `<button type="button" class="choice-btn keypad-sign mo-sign" data-sign>${M} cambiar signo</button>` : ""}
      <div class="feedback mo-feedback" data-feedback></div>
    `;
    // Si la cuenta no cabe en una línea, se achica la letra (como escribir más pequeño).
    const ex = body.querySelector("[data-expr]");
    for (let f = 2.1; ex.scrollWidth > ex.clientWidth + 1 && f > 1.2; f -= 0.1) ex.style.fontSize = `${f.toFixed(1)}rem`;
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
    body.querySelector("[data-sign]")?.addEventListener("click", () => pressKey("±"));
    paint();
  }

  function paint() {
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const i = +b.dataset.slot;
      b.textContent = s(typed[i]);
      b.classList.toggle("active", i === active);
    });
  }

  function pressKey(key) {
    if (finished || busy) return;
    const t = typed[active];
    if (key === "✓") return check();
    if (key === "±") { if (round.neg) typed[active] = t.startsWith("-") ? t.slice(1) : "-" + t; }
    else if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (t.replace("-", "").length < 2) typed[active] = t + key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const filled = (v) => v !== "" && v !== "-";
    // ✓ con una casilla vacía: el foco pasa a la siguiente (coeficiente → exponente).
    if (!typed.every(filled)) {
      if (filled(typed[active])) { active = typed.findIndex((v) => !filled(v)); paint(); return; }
      feedback.textContent = "Escribe un número en la casilla";
      feedback.className = "feedback bad mo-feedback";
      return;
    }
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((el) => {
      const i = +el.dataset.slot, ok = Number(typed[i]) === round.answers[i];
      allOk = allOk && ok;
      el.classList.remove("active");
      el.classList.add(ok ? "good" : "bad");
      if (!ok) el.innerHTML = `<s>${s(typed[i])}</s><em>${s(round.answers[i])}</em>`;
    });
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok mo-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Era ${round.answers.map(s).join(" y ")}. 💡 ${round.hint}`;
      feedback.className = "feedback bad mo-feedback";
      body.querySelector("[data-sign]")?.remove();
      const nxt = document.createElement("button");
      nxt.type = "button";
      nxt.className = "secondary mo-next";
      nxt.textContent = "Siguiente →";
      nxt.addEventListener("click", advance);
      body.querySelector("[data-keypad]").replaceWith(nxt);
      pending = setTimeout(advance, 2500);
    }
  }

  // Tras un fallo: se acaba la partida si no quedan vidas, si no, otra ronda.
  function advance() {
    if (finished) return;
    clearTimeout(pending);
    lives <= 0 ? finish(false) : nextRound();
  }

  // Teclado físico: cifras, retroceso, Enter y "-" para el signo.
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
    saveScore(client, "monomios", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧮</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} monomios bien de ${rounds}</p>
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
    round = null;
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
