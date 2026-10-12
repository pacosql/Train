// "Escribe la fracción": una figura del libro (rectángulo, círculo,
// triángulo, hexágono o un grupo de peces) partida en partes iguales con
// algunas pintadas, y al lado las casillas apiladas □/□ como en
// "Simplifica". Se escribe el numerador y el denominador (✓ o tocar la
// casilla: foco arriba → abajo). A veces se pregunta qué fracción NO está
// pintada. Al final, fracciones impropias con varias figuras (5/4).
// El 💡: "Partes pintadas 3, partes totales 5: 3/5. Se lee tres quintos".
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const NUM = ["cero", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete"];
const DEN = { 2: "medio", 3: "tercio", 4: "cuarto", 5: "quinto", 6: "sexto", 7: "séptimo", 8: "octavo", 9: "noveno", 10: "décimo" };
export const read = (a, b) => `${NUM[a]} ${DEN[b]}${a === 1 ? "" : "s"}`;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

// Formas que admiten cada número de partes iguales
const SHAPES = {
  tiras: [2, 3, 4, 5, 6, 7, 8], circulo: [2, 3, 4, 5, 6, 7, 8, 9, 10], triangulo: [2, 3, 4],
  hexagono: [2, 3, 6], rejilla: [4, 6, 8, 9, 10],
};

// Niveles: 0 hasta 4 partes · 1 de 5 a 10 partes · 2 grupos de peces (3 de
// 7) · 3 impropias con 2 o 3 figuras iguales (5/4). En 0-2, a veces "NO".
export function buildRound(level) {
  let shape, d, n, wholes = 1;
  if (level <= 1) {
    for (;;) {
      shape = pick(Object.keys(SHAPES));
      const ds = SHAPES[shape].filter((x) => (level === 0 ? x <= 4 : x >= 5));
      if (ds.length) { d = pick(ds); break; }
    }
    n = randInt(1, d - 1);
  } else if (level === 2) {
    shape = "peces"; d = randInt(3, 10); n = randInt(1, d - 1);
  } else {
    shape = pick(["circulo", "tiras"]); wholes = pick([2, 3]); d = randInt(2, wholes === 3 ? 4 : 6);
    do n = randInt(d + 1, wholes * d - 1); while (n % d === 0);
  }
  const not = level <= 2 && Math.random() < 0.35;
  const a = not ? d - n : n, b = d;
  // Partes pintadas: al azar en una figura; en las impropias, en orden (se llena una figura y se sigue)
  const on = new Set(wholes > 1 ? Array.from({ length: n }, (_, i) => i) : shuffle(Array.from({ length: d }, (_, i) => i)).slice(0, n));
  const what = shape === "peces" ? "Peces" : "Partes";
  const hint = wholes > 1
    ? `Cada ${shape === "circulo" ? "círculo" : "rectángulo"} está partido en ${d}: cuento ${n} ${DEN[d]}s pintados: ${a}/${b}. Se lee ${read(a, b)}`
    : `${what} ${not ? "sin pintar" : "pintad" + (shape === "peces" ? "os" : "as")} ${a}, ${what.toLowerCase()} en total ${b}: ${a}/${b}. Se lee ${read(a, b)}`;
  return { shape, d, n, wholes, not, a, b, on: [...on].sort((x, y) => x - y), hint };
}

// ---------- dibujo: cada figura es una lista de polígonos/caminos ----------
const P = (pts) => `M${pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join("L")}Z`;
const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
export function parts(shape, d) {
  if (shape === "tiras") return Array.from({ length: d }, (_, i) => P([[10 + (i * 180) / d, 30], [10 + ((i + 1) * 180) / d, 30], [10 + ((i + 1) * 180) / d, 150], [10 + (i * 180) / d, 150]]));
  if (shape === "rejilla") {
    const rows = d === 9 ? 3 : 2, cols = d / rows, w = 180 / cols, h = 120 / rows;
    return Array.from({ length: d }, (_, i) => { const x = 10 + (i % cols) * w, y = 30 + Math.floor(i / cols) * h; return P([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]); });
  }
  if (shape === "circulo") {
    const pt = (k) => [100 + 75 * Math.sin((2 * Math.PI * k) / d), 90 - 75 * Math.cos((2 * Math.PI * k) / d)];
    return Array.from({ length: d }, (_, i) => { const [p, q] = [pt(i), pt(i + 1)]; return `M100,90L${p[0].toFixed(1)},${p[1].toFixed(1)}A75,75 0 0 1 ${q[0].toFixed(1)},${q[1].toFixed(1)}Z`; });
  }
  if (shape === "triangulo") {
    const A = [100, 12], B = [10, 168], C = [190, 168];
    if (d === 2) { const M = mid(B, C); return [P([A, B, M]), P([A, M, C])]; }
    if (d === 3) { const G = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3]; return [P([A, B, G]), P([B, C, G]), P([C, A, G])]; }
    const [ab, bc, ca] = [mid(A, B), mid(B, C), mid(C, A)];
    return [P([A, ab, ca]), P([ab, B, bc]), P([ca, bc, C]), P([ab, bc, ca])];
  }
  // hexágono regular centrado en (100,90)
  const V = Array.from({ length: 6 }, (_, k) => [100 + 82 * Math.cos((Math.PI * k) / 3), 90 + 82 * Math.sin((Math.PI * k) / 3)]);
  const O = [100, 90];
  if (d === 6) return V.map((v, k) => P([O, v, V[(k + 1) % 6]]));
  if (d === 3) return [0, 2, 4].map((k) => P([O, V[k], V[k + 1], V[(k + 2) % 6]]));
  return [P([V[0], V[1], V[2], V[3]]), P([V[3], V[4], V[5], V[0]])];
}
// Un pez: cuerpo, cola y ojo (pintado = relleno de color; si no, solo contorno)
const fish = (x, y, on) => `<g class="ef-part${on ? " on" : ""}" transform="translate(${x},${y})"><path d="M4,20 C14,4 40,4 50,20 C40,36 14,36 4,20Z M50,20 L64,8 L64,32Z"/><circle class="ef-eye" cx="16" cy="17" r="2.5"/></g>`;

export function figure(r) {
  if (r.shape === "peces") {
    const perRow = r.d <= 5 ? r.d : Math.ceil(r.d / 2), rows = Math.ceil(r.d / perRow);
    const items = Array.from({ length: r.d }, (_, i) => fish(6 + (i % perRow) * 72, 6 + Math.floor(i / perRow) * 48, r.on.includes(i))).join("");
    return `<svg class="ef-svg" viewBox="0 0 ${perRow * 72 + 6} ${rows * 48 + 8}">${items}</svg>`;
  }
  const ps = parts(r.shape, r.d);
  const one = (w) => ps.map((p, i) => `<path class="ef-part${r.on.includes(w * r.d + i) ? " on" : ""}" d="${p}"/>`).join("");
  const g = Array.from({ length: r.wholes }, (_, w) => `<g transform="translate(${w * 205},0)">${one(w)}</g>`).join("");
  return `<svg class="ef-svg${r.wholes > 1 ? " ef-many" : ""}" viewBox="0 0 ${r.wholes * 205 - 5} 180">${g}</svg>`;
}

export function mountEscribefraccionGame(container, { client, onExit }) {
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
    <div class="game-body ef-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function onKeyDown(e) {
    const k = e.key === "Enter" ? "✓" : e.key === "Backspace" ? "⌫" : e.key;
    if (!/^[0-9]$/.test(k) && k !== "✓" && k !== "⌫") return;
    e.preventDefault();
    pressKey(k);
  }
  window.addEventListener("keydown", onKeyDown);

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(3, Math.floor(hits / 3)));
    typed = { a: "", b: "" };
    active = "a";
    busy = false;
    const thing = round.shape === "peces" ? " de los peces" : "";
    const prompt = round.not ? `¿Qué fracción${thing} <b>NO</b> está pintada?` : `¿Qué fracción${thing} está pintada?`;
    body.innerHTML = `
      <p class="prompt ef-prompt">${prompt}</p>
      <div class="ef-cuaderno${round.wholes > 1 || round.shape === "peces" ? " ef-col" : ""}">
        ${figure(round)}
        <div class="ef-frac">
          <button type="button" class="ef-slot" data-slot="a"></button>
          <span class="ef-bar"></span>
          <button type="button" class="ef-slot" data-slot="b"></button>
        </div>
      </div>
      <div class="keypad ef-keypad" data-keypad></div>
      <div class="feedback ef-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = b.dataset.slot), paint())));
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
      b.textContent = typed[b.dataset.slot];
      b.classList.toggle("active", b.dataset.slot === active);
    });
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    if (key === "⌫") {
      if (typed[active] === "" && active === "b") active = "a";
      typed[active] = typed[active].slice(0, -1);
    } else if (typed[active].length < 2) typed[active] += key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    // ✓ con el numerador escrito y el denominador vacío: baja al denominador
    const empty = ["a", "b"].find((k) => typed[k] === "");
    if (empty) {
      const silent = active === "a" && typed.a !== "";
      active = empty;
      paint();
      if (!silent) { feedback.textContent = "Escribe el numerador y el denominador"; feedback.className = "feedback bad"; }
      return;
    }
    busy = true;
    rounds++;
    const a = Number(typed.a), b = Number(typed.b);
    const ok = a === round.a && b === round.b;
    body.querySelectorAll("[data-slot]").forEach((s) => {
      const k = s.dataset.slot, good = Number(typed[k]) === round[k];
      s.classList.remove("active");
      s.classList.add(good ? "good" : "bad");
      if (!good) s.innerHTML = `<s>${typed[k]}</s><em>${round[k]}</em>`;
    });
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      // Errores típicos: equivalente, total de todas las figuras, la parte contraria
      let why = "";
      if (b > 0 && a * round.b === round.a * b) why = `${a}/${b} vale lo mismo, pero aquí se cuentan las partes. `;
      else if (round.wholes > 1 && b === round.wholes * round.d) why = `El denominador es en cuántas partes se parte UNA figura (${round.d}), no todas juntas. `;
      else if (b === round.b && a === round.b - round.a && round.wholes === 1) why = `${a} son las partes ${round.not ? "pintadas" : "sin pintar"}. `;
      feedback.innerHTML = `${why}💡 ${round.hint} <button type="button" class="primary ef-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad";
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 2500);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "escribefraccion", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🍕</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} fracciones bien escritas de ${rounds}</p>
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
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKeyDown);
  };
}
