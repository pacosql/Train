// "Resuelve paso a paso" (1º-2º ESO): la ecuación y debajo las líneas de
// la resolución como en el cuaderno, con los "=" alineados y casillas en
// cada línea ("2x + 3 = 11 / 2x = 11 − □ / 2x = □ / x = □/2 = □"). Se
// rellena línea a línea: ✓ (o Enter) pasa a la casilla siguiente y, con
// todas llenas, corrige. Tras corregir, cada línea lleva su 💡 de
// transposición: "lo que suma pasa restando, lo que multiplica pasa dividiendo".
import { randInt, pick, saveScore } from "./utils.js";

const M = "−";
const SUMA = "Lo que suma pasa restando";
const RESTA = "Lo que resta pasa sumando";

// Niveles: 0 x + a = b · 1 ax = b (o x/a = b) · 2 ax + b = c ·
// 3 x en los dos lados · 4 con paréntesis · 5 de todo (2-4).
// Marcado de las líneas: [i] casilla, F{num|den} fracción, x en cursiva.
export function buildRound(level) {
  if (level >= 5) level = randInt(2, 4);
  if (level === 0) {
    const a = randInt(2, 9), x = randInt(1, 15);
    if (Math.random() < 0.5) {
      const b = x + a;
      return mk(level, x, `x + ${a} = ${b}`, [
        [`x = ${b} ${M} [0]`, `${SUMA}: el +${a} pasa como ${M}${a}`, a],
        [`x = [1]`, `${b} ${M} ${a} = ${x}`, x]]);
    }
    const b = x - a;
    if (b < 1) return buildRound(0);
    return mk(level, x, `x ${M} ${a} = ${b}`, [
      [`x = ${b} + [0]`, `${RESTA}: el ${M}${a} pasa como +${a}`, a],
      [`x = [1]`, `${b} + ${a} = ${x}`, x]]);
  }
  if (level === 1) {
    const a = randInt(2, 9), x = randInt(2, 12);
    if (Math.random() < 0.6) {
      return mk(level, x, `${a}x = ${a * x}`, [
        [`x = F{${a * x}|[0]} = [1]`, `Lo que multiplica pasa dividiendo: ${a * x} : ${a} = ${x}`, a, x]]);
    }
    const b = randInt(2, 9);
    return mk(level, b * a, `F{x|${a}} = ${b}`, [
      [`x = ${b} · [0] = [1]`, `Lo que divide pasa multiplicando: ${b} · ${a} = ${a * b}`, a, a * b]]);
  }
  if (level === 2) {
    const a = randInt(2, 6), x = randInt(1, 10), b = randInt(1, 12), plus = Math.random() < 0.6;
    const c = plus ? a * x + b : a * x - b;
    if (c < 1) return buildRound(2);
    return mk(level, x, `${a}x ${plus ? "+" : M} ${b} = ${c}`, [
      [`${a}x = ${c} ${plus ? M : "+"} [0]`, plus ? `${SUMA}: +${b} → ${M}${b}` : `${RESTA}: ${M}${b} → +${b}`, b],
      [`${a}x = [1]`, `${c} ${plus ? M : "+"} ${b} = ${a * x}`, a * x],
      [`x = F{[2]|${a}} = [3]`, `Lo que multiplica pasa dividiendo: ${a * x} : ${a} = ${x}`, a * x, x]]);
  }
  if (level === 3) {
    // ax ± b = cx + d → ax − cx = d ∓ b → kx = v → x
    const c = randInt(2, 5), k = randInt(2, 5), a = c + k, x = randInt(1, 9), b = randInt(1, 9), plus = Math.random() < 0.7;
    const d = plus ? k * x + b : k * x - b;
    if (d < 1 || d === b) return buildRound(3);
    return mk(level, x, `${a}x ${plus ? "+" : M} ${b} = ${c}x + ${d}`, [
      [`${a}x ${M} [0]x = ${d} ${plus ? M : "+"} [1]`, `Las x a la izquierda y los números a la derecha: +${c}x pasa como ${M}${c}x y ${plus ? "+" : M}${b} como ${plus ? M : "+"}${b}`, c, b],
      [`[2]x = [3]`, `${a} ${M} ${c} = ${k} y ${d} ${plus ? M : "+"} ${b} = ${k * x}`, k, k * x],
      [`x = [4]`, `Lo que multiplica pasa dividiendo: ${k * x} : ${k} = ${x}`, x]]);
  }
  // Nivel 4: a(x ± b) = c → primero se quita el paréntesis.
  const a = randInt(2, 5), b = randInt(1, 6), x = randInt(1, 9), plus = Math.random() < 0.6;
  if (!plus && x <= b) return buildRound(4);
  const c = a * (plus ? x + b : x - b), ab = a * b;
  return mk(level, x, `${a}(x ${plus ? "+" : M} ${b}) = ${c}`, [
    [`[0]x ${plus ? "+" : M} [1] = ${c}`, `Primero quito el paréntesis: ${a} · x = ${a}x y ${a} · ${b} = ${ab}`, a, ab],
    [`${a}x = ${c} ${plus ? M : "+"} [2]`, plus ? `${SUMA}: +${ab} → ${M}${ab}` : `${RESTA}: ${M}${ab} → +${ab}`, ab],
    [`${a}x = [3]`, `${c} ${plus ? M : "+"} ${ab} = ${a * x}`, a * x],
    [`x = [4]`, `Lo que multiplica pasa dividiendo: ${a * x} : ${a} = ${x}`, x]]);
}

// Cada línea: [marcado, 💡 de esa línea, ...valores de sus casillas].
function mk(level, x, eq, rows) {
  // La comprobación: se sustituye x en la ecuación de partida.
  const L = eq.slice(0, eq.indexOf(" = ")), R = eq.slice(eq.indexOf(" = ") + 3);
  const sub = (t) => t.replace(/F\{x\|(\d+)\}/, `${x} : $1`).replace(/(\d)x/g, `$1 · ${x}`).replace(/(\d)\(/g, "$1 · (").replace(/x/g, String(x));
  const val = (t) => sub(t).replace(/·/g, "*").replace(/:/g, "/").replace(new RegExp(M, "g"), "-").split(/(?=[+-])/).reduce((acc, term) => acc + evalTerm(term), 0);
  const proof = /x/.test(R) ? `${sub(L)} = ${val(L)} y ${sub(R)} = ${val(R)}` : `${sub(L)} = ${R}`;
  const lines = rows.map(([text, note, ...vals]) => ({ text, note, vals }));
  const answers = lines.flatMap((l) => l.vals);
  const hint = lines.map((l) => l.note).join(" · ");
  return { level, x, eq, lines, answers, hint, proof };
}
// Valor de un término sencillo ("+2 * 4", "-14", "3 * (4 + 2)").
function evalTerm(t) {
  t = t.replace(/\s/g, "");
  const m = t.match(/^([+-]?)(\d+)\*\((\d+)([+-])(\d+)\)$/);
  if (m) return (m[1] === "-" ? -1 : 1) * +m[2] * (m[4] === "+" ? +m[3] + +m[5] : +m[3] - +m[5]);
  const sign = t[0] === "-" ? -1 : 1, body = t.replace(/^[+-]/, "");
  return sign * body.split("*").reduce((p, f) => (f.includes("/") ? p * (+f.split("/")[0] / +f.split("/")[1]) : p * +f), 1);
}

// Marcado → HTML: x en cursiva, fracciones con raya y casillas.
function render(s) {
  let out = "", i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === "F") {
      const end = matchClose(s, i + 1), [n, d] = s.slice(i + 2, end).split("|");
      out += `<span class="ps-frac"><span>${render(n)}</span><span>${render(d)}</span></span>`;
      i = end + 1;
    } else if (c === "[") { const j = s.indexOf("]", i); out += `<button type="button" class="ps-slot" data-slot="${s.slice(i + 1, j)}"></button>`; i = j + 1; }
    else if (c === "x") { out += `<i>x</i>`; i++; }
    else { out += c; i++; }
  }
  return out;
}
function matchClose(s, j) { for (let d = 0, k = j; k < s.length; k++) { if (s[k] === "{") d++; else if (s[k] === "}" && --d === 0) return k; } return s.length; }
// Una fila del cuaderno: lado izquierdo | = | lado derecho (los "=" en columna).
function row(text, cls, note) {
  const k = text.indexOf(" = ");
  return `<div class="ps-line ${cls}"><span class="ps-l">${render(text.slice(0, k))}</span><span class="ps-eq">=</span><span class="ps-r">${render(text.slice(k + 3))}</span></div>${note === undefined ? "" : `<div class="ps-note" data-note="${note}"></div>`}`;
}

export function mountPasosGame(container, { client, onExit }) {
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
    <div class="game-body ps-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    if (finished) return;
    const last = round && round.eq;
    do round = buildRound(Math.min(5, Math.floor(hits / 3))); while (round.eq === last);
    typed = round.answers.map(() => "");
    active = 0;
    busy = false;
    body.innerHTML = `
      <p class="prompt ps-prompt">${pick(["Resuelve paso a paso", "Despeja la x paso a paso"])}</p>
      <div class="ps-cuaderno" data-sheet>
        ${row(round.eq, "ps-given")}<div class="ps-rule"></div>
        ${round.lines.map((l, i) => row(l.text, "", i)).join("")}
      </div>
      <div class="keypad ps-keypad" data-keypad></div>
      <div class="feedback ps-feedback" data-feedback></div>
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
      const i = +b.dataset.slot;
      b.textContent = typed[i];
      b.classList.toggle("active", i === active);
    });
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    if (key === "⌫") {
      // Con la casilla vacía, ⌫ vuelve a la anterior (como al escribir en el cuaderno).
      if (typed[active] === "" && active > 0) active--;
      typed[active] = typed[active].slice(0, -1);
    } else if (typed[active].length < 3) typed[active] += key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    // ✓ con casillas vacías: el foco baja a la siguiente que falte (línea a línea).
    if (typed.some((v) => v === "")) {
      if (typed[active] === "") {
        feedback.textContent = "Escribe un número en la casilla marcada";
        feedback.className = "feedback bad ps-feedback";
        return;
      }
      const n = typed.length;
      active = Array.from({ length: n }, (_, k) => (active + 1 + k) % n).find((k) => typed[k] === "");
      feedback.textContent = "";
      feedback.className = "feedback ps-feedback";
      return paint();
    }
    busy = true;
    rounds++;
    let allOk = true, firstBad = -1, k = 0;
    round.lines.forEach((l, li) => {
      l.vals.forEach(() => {
        const el = body.querySelector(`[data-slot="${k}"]`), ok = Number(typed[k]) === round.answers[k];
        if (!ok && firstBad < 0) firstBad = li;
        allOk = allOk && ok;
        el.classList.remove("active");
        el.classList.add(ok ? "good" : "bad");
        if (!ok) el.innerHTML = `<s>${typed[k]}</s><em>${round.answers[k]}</em>`;
        k++;
      });
    });
    // 💡 de cada línea, debajo de ella.
    body.querySelectorAll("[data-note]").forEach((n) => (n.textContent = `💡 ${round.lines[+n.dataset.note].note}`));
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ x = ${round.x}. 💡 Compruebo: ${round.proof} ✓`;
      feedback.className = "feedback ok ps-feedback";
      pending = setTimeout(nextRound, 1000);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Era x = ${round.x}. 💡 En la línea ${firstBad + 1}: ${round.lines[firstBad].note}`;
      feedback.className = "feedback bad ps-feedback";
      const nxt = document.createElement("button");
      nxt.type = "button";
      nxt.className = "secondary ps-next";
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

  // Teclado físico: cifras, retroceso y Enter.
  const onKey = (e) => {
    if (finished) return;
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
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
    saveScore(client, "pasos", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🪜</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} ecuaciones resueltas de ${rounds}</p>
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
