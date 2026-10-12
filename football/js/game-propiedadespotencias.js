// "Propiedades de las potencias": la igualdad escrita como en el libro de
// 1º-2º ESO ("2³ · 2⁴ = 2^□", con la casilla en el exponente) sobre papel
// cuadriculado. Se toca la casilla, se escribe con el teclado y ✓; si hay
// dos casillas, el foco pasa a la siguiente (de izquierda a derecha).
// El 💡 dice la propiedad con los números de la ronda:
// "Misma base, multiplico: sumo exponentes 3 + 4 = 7 → 2⁷".
import { randInt, pick, saveScore } from "./utils.js";

const SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
const sup = (n) => String(n).split("").map((c) => SUP[c]).join("");
const M = "−";
const neg = (n) => String(n).replace("-", M);

// Marcado mínimo: b^{e} exponente, F{num|den} fracción, [i] casilla i.
// Ejemplo: "2^{3} · 2^{4} = 2^{[0]}".
const pw = (b, e) => `${b}^{${e}}`;

// Niveles: 0 producto · 1 cociente · 2 potencia de potencia · 3 mezcla con
// paréntesis y mismo exponente · 4 exponente 0 y negativo · 5 de todo.
export function buildRound(level) {
  if (level >= 5) level = randInt(0, 4);
  const b = level < 4 && Math.random() < 0.25 ? "x" : pick([2, 3, 5, 7, 10]);
  const bt = b === "x" ? "x" : b; // en el 💡
  if (level === 0) {
    const m = randInt(2, 7), n = randInt(2, 7);
    return { level, neg: false, text: `${pw(b, m)} · ${pw(b, n)} = ${pw(b, "[0]")}`, answers: [m + n],
      hint: `Misma base, multiplico: sumo exponentes ${m} + ${n} = ${m + n} → ${bt}${sup(m + n)}` };
  }
  if (level === 1) {
    const m = randInt(5, 12), n = randInt(2, m - 1);
    return { level, neg: false, text: `${pw(b, m)} : ${pw(b, n)} = ${pw(b, "[0]")}`, answers: [m - n],
      hint: `Misma base, divido: resto exponentes ${m} − ${n} = ${m - n} → ${bt}${sup(m - n)}` };
  }
  if (level === 2) {
    const m = randInt(2, 6), n = randInt(2, 5);
    return { level, neg: false, text: `(${pw(b, m)})^{${n}} = ${pw(b, "[0]")}`, answers: [m * n],
      hint: `Potencia de una potencia: multiplico exponentes ${m} · ${n} = ${m * n} → ${bt}${sup(m * n)}` };
  }
  if (level === 3) {
    const kind = randInt(0, 3);
    if (kind === 0) {
      const m = randInt(2, 5), n = randInt(2, 5), p = randInt(2, 3), s = m + n;
      return { level, neg: false, text: `(${pw(b, m)} · ${pw(b, n)})^{${p}} = ${pw(b, "[0]")}`, answers: [s * p],
        hint: `Primero el paréntesis: ${m} + ${n} = ${s}; luego potencia de potencia: ${s} · ${p} = ${s * p}` };
    }
    if (kind === 1) {
      const m = randInt(2, 5), n = randInt(2, 4), p = randInt(1, m * n - 1), s = m * n;
      return { level, neg: false, text: `(${pw(b, m)})^{${n}} : ${pw(b, p)} = ${pw(b, "[0]")}`, answers: [s - p],
        hint: `(${bt}${sup(m)})${sup(n)} = ${bt}${sup(s)} (${m} · ${n} = ${s}); luego divido: ${s} − ${p} = ${s - p}` };
    }
    const e = randInt(2, 5);
    if (kind === 2) {
      // Mismo exponente: se multiplican las bases (2³ · 5³ = 10³).
      const [a, c] = pick([[2, 5], [2, 3], [3, 3], [2, 4], [5, 4], [3, 5], [2, 2]]);
      return { level, neg: false, text: `${pw(a, e)} · ${pw(c, e)} = ${pw("[0]", e)}`, answers: [a * c],
        hint: `Mismo exponente: multiplico las bases ${a} · ${c} = ${a * c} → ${a * c}${sup(e)}` };
    }
    const c = randInt(2, 5), k = randInt(2, 4);
    return { level, neg: false, text: `${pw(c * k, e)} : ${pw(c, e)} = ${pw("[0]", e)}`, answers: [k],
      hint: `Mismo exponente: divido las bases ${c * k} : ${c} = ${k} → ${k}${sup(e)}` };
  }
  // Nivel 4: exponente 0 y exponente negativo (aquí sale el botón de signo).
  const kind = randInt(0, 4);
  if (kind === 0) {
    const c = randInt(2, 15);
    return { level, neg: true, text: `${pw(c, 0)} = [0]`, answers: [1],
      hint: `Todo número (distinto de 0) elevado a 0 vale 1: ${c}⁰ = 1` };
  }
  if (kind === 1) {
    const c = pick([2, 3, 5, 7]), m = randInt(2, 6);
    return { level, neg: true, text: `${pw(c, m)} : ${pw(c, m)} = ${pw(c, "[0]")}`, answers: [0],
      hint: `Resto exponentes: ${m} − ${m} = 0 → ${c}⁰, que vale 1 (algo entre sí mismo)` };
  }
  if (kind === 2) {
    const c = pick([2, 3, 5, 7]), m = randInt(1, 5), n = randInt(m + 1, 8);
    return { level, neg: true, text: `${pw(c, m)} : ${pw(c, n)} = ${pw(c, "[0]")}`, answers: [m - n],
      hint: `Resto exponentes: ${m} − ${n} = ${neg(m - n)} → ${c}${sup(m - n)} = 1/${c}${sup(n - m)}` };
  }
  const [c, n] = pick([[2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [3, 1], [3, 2], [3, 3], [4, 2], [5, 2], [5, 3], [10, 2], [10, 3]]);
  const v = c ** n;
  if (kind === 3) {
    return { level, neg: true, text: `${pw(c, -n)} = F{1|[0]}`, answers: [v],
      hint: `Exponente negativo: le doy la vuelta: ${c}${sup(-n)} = 1/${c}${sup(n)} = 1/${v}` };
  }
  return { level, neg: true, text: `${pw(c, -n)} = F{1|${pw(c, "[0]")}} = F{1|[1]}`, answers: [n, v],
    hint: `Exponente negativo: ${c}${sup(-n)} = 1/${c}${sup(n)}, y ${c}${sup(n)} = ${v}` };
}

// Pinta el marcado como en el libro: exponentes en superíndice, x en
// cursiva, fracciones con raya y casillas que se tocan.
function render(s) {
  let out = "", i = 0;
  const close = (j) => { for (let d = 0, k = j; k < s.length; k++) { if (s[k] === "{") d++; else if (s[k] === "}" && --d === 0) return k; } return s.length; };
  while (i < s.length) {
    const c = s[i];
    if (c === "^") { const j = close(i + 1); out += `<sup class="pp2-sup">${render(s.slice(i + 2, j))}</sup>`; i = j + 1; }
    else if (c === "F") {
      const j = close(i + 1), inner = s.slice(i + 2, j);
      let d = 0, cut = 0;
      for (let k = 0; k < inner.length; k++) { if (inner[k] === "{") d++; else if (inner[k] === "}") d--; else if (inner[k] === "|" && !d) cut = k; }
      out += `<span class="pp2-frac"><span>${render(inner.slice(0, cut))}</span><span>${render(inner.slice(cut + 1))}</span></span>`;
      i = j + 1;
    } else if (c === "[") { const j = s.indexOf("]", i); out += `<button type="button" class="pp2-slot" data-slot="${s.slice(i + 1, j)}"></button>`; i = j + 1; }
    else if (c === "x") { out += `<i>x</i>`; i++; }
    else { out += c === "-" ? M : c; i++; }
  }
  return out;
}

export function mountPropiedadespotenciasGame(container, { client, onExit }) {
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
    <div class="game-body pp2-body" data-body></div>
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
    body.innerHTML = `
      <p class="prompt pp2-prompt">Completa la igualdad</p>
      <div class="pp2-cuaderno"><div class="pp2-expr" data-expr>${render(round.text)}</div></div>
      <div class="keypad pp2-keypad" data-keypad></div>
      ${round.neg ? `<button type="button" class="choice-btn keypad-sign pp2-sign" data-sign>${M} cambiar signo</button>` : ""}
      <div class="feedback pp2-feedback" data-feedback></div>
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
    body.querySelector("[data-sign]")?.addEventListener("click", () => pressKey("±"));
    paint();
  }

  function paint() {
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const i = +b.dataset.slot;
      b.textContent = neg(typed[i]);
      b.classList.toggle("active", i === active);
    });
  }

  function pressKey(key) {
    if (finished || busy) return;
    const t = typed[active];
    if (key === "✓") return check();
    if (key === "±") { if (round.neg) typed[active] = t.startsWith("-") ? t.slice(1) : "-" + t; }
    else if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (t.replace("-", "").length < 3) typed[active] = t + key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const filled = (v) => v !== "" && v !== "-";
    // ✓ con casillas vacías: el foco pasa a la siguiente que falte.
    if (!typed.every(filled)) {
      const order = typed.map((_, k) => (active + 1 + k) % typed.length);
      if (filled(typed[active])) { active = order.find((k) => !filled(typed[k])); paint(); return; }
      feedback.textContent = "Escribe un número en la casilla";
      feedback.className = "feedback bad pp2-feedback";
      return;
    }
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((s) => {
      const i = +s.dataset.slot, ok = Number(typed[i]) === round.answers[i];
      allOk = allOk && ok;
      s.classList.remove("active");
      s.classList.add(ok ? "good" : "bad");
      if (!ok) s.innerHTML = `<s>${neg(typed[i])}</s><em>${neg(round.answers[i])}</em>`;
    });
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok pp2-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Era ${round.answers.map(neg).join(" y ")}. 💡 ${round.hint}`;
      feedback.className = "feedback bad pp2-feedback";
      body.querySelector("[data-sign]")?.remove();
      const nxt = document.createElement("button");
      nxt.type = "button";
      nxt.className = "secondary pp2-next";
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
    saveScore(client, "propiedadespotencias", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔺</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} potencias bien de ${rounds}</p>
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
