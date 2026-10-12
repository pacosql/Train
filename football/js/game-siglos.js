// "¿Qué siglo es?": una línea del tiempo con los siglos marcados (rayas
// cada 100 años) y el año señalado, y debajo la frase del cuaderno con su
// casilla: "1492 → siglo □" (se escribe el número; el 💡 lo dice en
// romano), "siglo XIX → del año □ al □", "de 1492 a 1812 van □ años" y,
// al final, años antes de Cristo. Al corregir se colorea en la línea del
// tiempo el tramo del siglo con su número romano.
import { randInt, pick, saveScore } from "./utils.js";

const ROM = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
export function roman(n) {
  let s = "";
  ROM.forEach(([v, r]) => { while (n >= v) { s += r; n -= v; } });
  return s;
}
export const centuryOf = (y) => Math.ceil(y / 100);

// Niveles: 0 años sin 00 · 1 también acabados en 00 · 2 de siglo a años ·
// 3 años que pasan entre dos fechas · 4 antes de Cristo.
export function buildRound(level) {
  const year = (zeros) => (zeros ? 100 * randInt(3, 20) : Math.random() < 0.2 ? randInt(250, 999) : randInt(1001, 2099));
  let type = ["siglo", "siglo", "rango", "dif"][level] || pick(["sigloac", "difac"]);
  let y, y2, c, answers, hint;
  if (type === "siglo" || type === "sigloac") {
    if (type === "siglo") { do y = year(level === 1 && Math.random() < 0.5); while (level === 0 && y % 100 === 0); }
    else y = Math.random() < 0.25 ? 100 * randInt(3, 9) : randInt(250, 999);
    c = centuryOf(y);
    answers = [c];
    const ac = type === "sigloac" ? " a. C." : "";
    hint = y % 100 === 0
      ? `${y}${ac} acaba en 00: es la excepción, el último año del siglo ${c} → quito los dos ceros y no sumo nada: siglo ${roman(c)}${ac}`
      : `Quito las dos últimas cifras (${Math.floor(y / 100)}) y sumo 1 → siglo ${c} (${roman(c)}${ac})`;
    if (ac) hint = `Con los años a. C. se hace igual. ${hint}`;
  } else if (type === "rango") {
    c = randInt(3, 21);
    answers = [(c - 1) * 100 + 1, c * 100];
    hint = `El siglo ${roman(c)} es el ${c}: empieza justo después del ${(c - 1) * 100}, en el ${answers[0]}, y acaba en el ${answers[1]} (100 años)`;
  } else if (type === "dif") {
    y = randInt(1000, 1950);
    y2 = randInt(y + 20, 2025);
    answers = [y2 - y];
    hint = `Al año más reciente le resto el más antiguo: ${y2} − ${y} = ${y2 - y} años`;
  } else {
    y = randInt(300, 999);
    y2 = randInt(100, y - 20);
    answers = [y - y2];
    hint = `Los dos son a. C.: el ${y} a. C. es más antiguo (está más lejos del año 1). Resto: ${y} − ${y2} = ${y - y2} años`;
  }
  return { type, level, y, y2, c, answers, hint, ac: type.endsWith("ac") };
}

export function mountSiglosGame(container, { client, onExit }) {
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
    <div class="game-body sl-body" data-body></div>
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

  // Línea del tiempo en SVG. t = año (d. C.) o −año (a. C.): el pasado a la izquierda.
  function timeline(reveal) {
    const { type, y, y2, c, ac } = round;
    const W = 330, H = 92, x0 = 16, x1 = W - 16, axisY = 58;
    const t = (yy) => (ac ? -yy : yy);
    let lo, hi, step = 100;
    if (type === "dif" || type === "difac") {
      const [a, b] = [t(y), t(y2)];
      lo = Math.floor(a / 100) * 100;
      hi = Math.ceil(b / 100) * 100;
      if (hi - lo < 300) hi = lo + 300;
      step = hi - lo > 1200 ? 200 : 100;
    } else if (ac) { lo = -(c + 1) * 100; hi = -(c - 2) * 100; }
    else { lo = (c - 2) * 100; hi = (c + 1) * 100; }
    const X = (v) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
    const out = [];
    // Tramo del siglo (se ve desde el principio solo en "de siglo a años").
    if (type !== "dif" && type !== "difac" && (reveal || type === "rango")) {
      const [s0, s1] = ac ? [-c * 100, -(c - 1) * 100] : [(c - 1) * 100, c * 100];
      out.push(`<rect class="sl-band${reveal ? " sl-" + reveal : ""}" x="${X(s0)}" y="${axisY - 26}" width="${X(s1) - X(s0)}" height="26" rx="4"/>`);
      out.push(`<text class="sl-rom" x="${(X(s0) + X(s1)) / 2}" y="${axisY - 8}">${roman(c)}${ac ? " a. C." : ""}</text>`);
    }
    out.push(`<line class="sl-axis" x1="${x0 - 8}" y1="${axisY}" x2="${x1 + 8}" y2="${axisY}"/>`);
    for (let v = lo; v <= hi; v += step) {
      out.push(`<line class="sl-tick" x1="${X(v)}" y1="${axisY - 6}" x2="${X(v)}" y2="${axisY + 6}"/>`);
      if (type === "dif" || type === "difac") continue; // ahí se rotulan solo las dos fechas
      const label = type === "rango" && !reveal ? "?" : String(Math.abs(v));
      out.push(`<text class="sl-lab" x="${X(v)}" y="${axisY + 22}">${label}</text>`);
    }
    if (ac) out.push(`<text class="sl-ac" x="${x0 - 6}" y="12">años a. C.</text>`);
    const mark = (v, txt) => `<circle class="sl-dot" cx="${X(t(v))}" cy="${axisY}" r="6"/><text class="sl-year" x="${X(t(v))}" y="${axisY - 34}">${txt}</text><line class="sl-pin" x1="${X(t(v))}" y1="${axisY - 30}" x2="${X(t(v))}" y2="${axisY - 6}"/>`;
    if (type === "dif" || type === "difac") {
      out.push(`<path class="sl-arc" d="M${X(t(y))} ${axisY - 8} Q${(X(t(y)) + X(t(y2))) / 2} ${axisY - 46} ${X(t(y2))} ${axisY - 8}"/>`);
      out.push(`<text class="sl-gap" x="${(X(t(y)) + X(t(y2))) / 2}" y="${axisY - 30}">${reveal ? round.answers[0] : "?"} años</text>`);
      // Si las dos fechas quedan muy juntas, cada rótulo se aparta hacia su lado.
      const close = Math.abs(X(t(y2)) - X(t(y))) < 40;
      [y, y2].forEach((v, i) => out.push(`<circle class="sl-dot" cx="${X(t(v))}" cy="${axisY}" r="6"/><text class="sl-lab sl-labdot" x="${X(t(v)) + (close ? (i ? 3 : -3) : 0)}" y="${axisY + 24}" style="text-anchor:${close ? (i ? "start" : "end") : "middle"}">${v}</text>`));
    } else if (type !== "rango") out.push(mark(y, y));
    return `<svg class="sl-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${out.join("")}</svg>`;
  }

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 2)));
    typed = round.answers.map(() => "");
    active = 0;
    busy = false;
    const { type, y, y2, c } = round;
    const box = (i) => `<button type="button" class="sl-slot" data-slot="${i}"></button>`;
    const frase = {
      siglo: `<b>${y}</b> → siglo ${box(0)}`,
      sigloac: `<b>${y} a. C.</b> → siglo ${box(0)} a. C.`,
      rango: `siglo <b>${roman(c)}</b> → del año ${box(0)} al ${box(1)}`,
      dif: `De <b>${y}</b> a <b>${y2}</b> van ${box(0)} años`,
      difac: `De <b>${y} a. C.</b> a <b>${y2} a. C.</b> van ${box(0)} años`,
    }[type];
    const prompt = { siglo: "¿En qué siglo cae?", sigloac: "¿En qué siglo cae?", rango: "¿Qué años tiene el siglo?", dif: "¿Cuántos años pasaron?", difac: "¿Cuántos años pasaron?" }[type];
    body.innerHTML = `
      <p class="prompt sl-prompt">${prompt}</p>
      <div class="sl-cuaderno">
        <div class="sl-linea" data-line>${timeline(null)}</div>
        <div class="sl-frase">${frase}</div>
      </div>
      <div class="keypad sl-keypad" data-keypad></div>
      <div class="feedback sl-feedback" data-feedback></div>
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
      const k = +b.dataset.slot;
      if (!busy) b.textContent = typed[k];
      b.classList.toggle("active", !busy && k === active);
    });
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return check();
    if (key === "⌫") {
      if (typed[active] === "" && active > 0) active--;
      typed[active] = typed[active].slice(0, -1);
    } else if (typed[active].length < 4) {
      typed[active] += key;
      if (typed[active].length === 4 && active < typed.length - 1) active++;
    }
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    // ✓ con una casilla vacía: el foco pasa a ella (como un Enter).
    const n = typed.length;
    const next = Array.from({ length: n }, (_, j) => (active + j) % n).find((i) => typed[i] === "");
    if (next !== undefined) {
      const wasEmpty = typed[active] === "";
      active = next;
      paint();
      if (wasEmpty) {
        feedback.textContent = "Escribe el número en la casilla";
        feedback.className = "feedback bad sl-feedback";
      }
      return;
    }
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot, want = String(round.answers[k]);
      const ok = String(+typed[k]) === want;
      allOk = allOk && ok;
      b.classList.add(ok ? "good" : "bad");
      if (ok) b.textContent = typed[k];
      else b.innerHTML = `<s>${typed[k]}</s><i class="sl-fix">${want}</i>`;
    });
    paint();
    body.querySelector("[data-line]").innerHTML = timeline(allOk ? "good" : "bad");
    const { type, y, c, ac } = round;
    const text = type === "rango" ? `del ${round.answers[0]} al ${round.answers[1]}`
      : type.startsWith("siglo") ? `${y}${ac ? " a. C." : ""} es del siglo ${roman(c)}${ac ? " a. C." : ""}` : `${round.answers[0]} años`;
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${text}. 💡 ${round.hint}`;
      feedback.className = "feedback ok sl-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.innerHTML = `Era: ${text}. 💡 ${round.hint} <button type="button" class="sl-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad sl-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 3000);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "siglos", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🏛️</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} fechas bien situadas de ${rounds}</p>
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
