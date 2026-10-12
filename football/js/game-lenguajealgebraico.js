// "Del lenguaje al álgebra" (1º-2º ESO): una frase como las del libro
// («el doble de un número más tres») y debajo, en el cuaderno, 3-6 huecos
// que se rellenan tocando fichas (2, 3, x, +, −, ·, /, ², ( ), x + 1…).
// La ficha cae en el hueco marcado y el foco avanza a la derecha. Se
// corrige por equivalencia (se compara el valor en varios x), así que
// "x · 2 + 3" también vale. 💡 "Doble → 2x; más tres → + 3".
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const M = "−";
const W = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];

// Plantillas por nivel: [frase, fichas de la respuesta, 💡]. b = número al azar.
const T = [
  [ // 0: ax + b
    (b) => [`el doble de un número más ${W[b]}`, ["2", "x", "+", `${b}`], `Doble → 2x; más ${W[b]} → + ${b}`],
    (b) => [`el triple de un número menos ${W[b]}`, ["3", "x", M, `${b}`], `Triple → 3x; menos ${W[b]} → ${M} ${b}`],
    (b) => [`el cuádruple de un número más ${W[b]}`, ["4", "x", "+", `${b}`], `Cuádruple → 4x; más ${W[b]} → + ${b}`],
    (b) => [`un número más ${W[b]}`, ["x", "+", `${b}`], `Un número → x; más ${W[b]} → + ${b}`],
    (b) => [`${W[b]} menos un número`, [`${b}`, M, "x"], `Primero el ${b} y le quito el número: ${b} ${M} x (el orden importa)`],
  ],
  [ // 1: fracciones
    (b) => [`la mitad de un número menos ${W[b]}`, ["x", "/", "2", M, `${b}`], `La mitad → x/2; menos ${W[b]} → ${M} ${b}`],
    (b) => [`la tercera parte de un número más ${W[b]}`, ["x", "/", "3", "+", `${b}`], `La tercera parte → x/3; más ${W[b]} → + ${b}`],
    (b) => [`la mitad de un número más ${W[b]}`, ["x", "/", "2", "+", `${b}`], `La mitad → x/2; más ${W[b]} → + ${b}`],
    (b) => [`la cuarta parte de un número menos ${W[b]}`, ["x", "/", "4", M, `${b}`], `La cuarta parte → x/4; menos ${W[b]} → ${M} ${b}`],
    () => [`la mitad de un número`, ["x", "/", "2"], `La mitad → divido entre 2: x/2`],
    () => [`la cuarta parte de un número`, ["x", "/", "4"], `La cuarta parte → divido entre 4: x/4`],
  ],
  [ // 2: cuadrados
    () => [`el doble del cuadrado de un número`, ["2", "x", "²"], `Primero el cuadrado, x², y luego el doble: 2x²`],
    () => [`el cuadrado del doble de un número`, ["(", "2", "x", ")", "²"], `Primero el doble, 2x, y todo al cuadrado: (2x)²`],
    () => [`el triple del cuadrado de un número`, ["3", "x", "²"], `Primero el cuadrado, x², y luego el triple: 3x²`],
    () => [`el cuadrado del triple de un número`, ["(", "3", "x", ")", "²"], `Primero el triple, 3x, y todo al cuadrado: (3x)²`],
    (b) => [`${W[b]} más el cuadrado de un número`, [`${b}`, "+", "x", "²"], `${b} más el cuadrado → ${b} + x²`],
    () => [`la suma de un número y su cuadrado`, ["x", "+", "x", "²"], `Un número → x; su cuadrado → x²; la suma: x + x²`],
    () => [`el cuadrado de un número menos su doble`, ["x", "²", M, "2", "x"], `El cuadrado → x²; su doble → 2x; menos: x² ${M} 2x`],
  ],
  [ // 3: paréntesis
    (b) => [`el doble de la suma de un número y ${W[b]}`, ["2", "(", "x", "+", `${b}`, ")"], `La suma va entre paréntesis, (x + ${b}), y luego el doble: 2(x + ${b})`],
    (b) => [`el triple de la diferencia entre un número y ${W[b]}`, ["3", "(", "x", M, `${b}`, ")"], `La diferencia entre paréntesis, (x ${M} ${b}), y luego el triple: 3(x ${M} ${b})`],
    (b) => [`el cuadrado de la suma de un número y ${W[b]}`, ["(", "x", "+", `${b}`, ")", "²"], `La suma entre paréntesis y todo al cuadrado: (x + ${b})²`],
  ],
  [ // 4: dos números (x y x + 1) y edades
    () => [`la suma de un número y su siguiente`, ["x", "+", "x + 1"], `Un número → x; su siguiente → x + 1; la suma: x + x + 1`],
    () => [`el producto de un número y su siguiente`, ["x", "·", "(x + 1)"], `Un número → x; su siguiente → x + 1; el producto: x · (x + 1)`],
    () => [`la suma de un número y su anterior`, ["x", "+", `x ${M} 1`], `Un número → x; su anterior → x ${M} 1; la suma: x + x ${M} 1`],
    (b) => [`Ana tiene x años: su edad dentro de ${W[b]} años`, ["x", "+", `${b}`], `Dentro de ${b} años → sumo: x + ${b}`],
    (b) => [`Ana tiene x años: su edad hace ${W[b]} años`, ["x", M, `${b}`], `Hace ${b} años → resto: x ${M} ${b}`],
    (b) => [`Ana tiene x años: el triple de su edad dentro de ${W[b]} años`, ["3", "(", "x", "+", `${b}`, ")"], `Dentro de ${b} años → x + ${b}; el triple, con paréntesis: 3(x + ${b})`],
  ],
];
const OPS = ["+", M, "·", "/", "²"];

// Niveles: 0 ax + b · 1 fracciones · 2 cuadrados · 3 paréntesis · 4 dos números · 5 de todo.
export function buildRound(level) {
  const lv = level >= 5 ? randInt(0, 4) : level;
  const b = randInt(2, 9);
  const [phrase, answer, hint] = pick(T[lv])(b);
  // Fichas: las de la respuesta + operaciones + números parecidos (+ paréntesis/compuestas según nivel).
  const tiles = new Set([...answer, "x", ...OPS]);
  if (lv >= 2) ["(", ")"].forEach((t) => tiles.add(t));
  if (lv === 4) ["x + 1", "(x + 1)", `x ${M} 1`].forEach((t) => tiles.add(t));
  for (const n of shuffle(["2", "3", "4", `${b}`, `${b === 9 ? 1 : b + 1}`, `${b - 1}`])) if (tiles.size < (lv === 4 ? 15 : 12)) tiles.add(n);
  return { level: lv, phrase, answer, hint, tiles: shuffle([...tiles]) };
}

// Lee las fichas como expresión: suma de términos, producto (también sin
// "·", como en 2x o 3(x + 1)), "/", "²" y paréntesis. Devuelve f(x) o null.
export function parseTiles(tiles) {
  const t = tiles.flatMap((s) => (s.length > 2 ? s.replace(/\s/g, "").split("") : [s])).map((s) => (s === "-" ? M : s));
  let i = 0;
  const atom = () => {
    const s = t[i];
    if (s === "(") { i++; const e = expr(); if (t[i++] !== ")") throw 0; return e; }
    if (s === "x") { i++; return (x) => x; }
    if (/^\d+$/.test(s || "")) { i++; const v = +s; return () => v; }
    throw 0;
  };
  // Un solo "²" por base ("x²²" no se escribe).
  const power = () => { const a = atom(); if (t[i] !== "²") return a; i++; return (x) => a(x) ** 2; };
  const unary = () => { if (t[i] === M) { i++; const f = unary(); return (x) => -f(x); } return power(); };
  const term = () => {
    let a = unary();
    for (;;) {
      const s = t[i];
      if (s === "·" || s === "/") { i++; const f = a, g = unary(); a = s === "·" ? (x) => f(x) * g(x) : (x) => f(x) / g(x); }
      else if (s === "x" || s === "(") { const f = a, g = power(); a = (x) => f(x) * g(x); }
      else return a;
    }
  };
  const expr = () => {
    let a = term();
    while (t[i] === "+" || t[i] === M) { const s = t[i++], f = a, g = term(); a = s === "+" ? (x) => f(x) + g(x) : (x) => f(x) - g(x); }
    return a;
  };
  try { const f = expr(); return i === t.length && t.length ? f : null; } catch { return null; }
}
const XS = [1.5, 2.25, 3.7, -1.3, 5];
export const same = (f, g) => !!f && XS.every((x) => Math.abs(f(x) - g(x)) < 1e-9 * Math.max(1, Math.abs(g(x))));
const show = (s) => s.replace(/x/g, "<i>x</i>");

export function mountLenguajealgebraicoGame(container, { client, onExit }) {
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
    <div class="game-body la-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    if (finished) return;
    const last = round && round.phrase;
    do round = buildRound(Math.min(5, Math.floor(hits / 3))); while (round.phrase === last);
    typed = round.answer.map(() => "");
    active = 0;
    busy = false;
    body.innerHTML = `
      <p class="prompt la-prompt">Escríbelo en lenguaje algebraico</p>
      <div class="la-cuaderno">
        <p class="la-phrase" data-phrase>«${show(round.phrase)}»</p>
        <div class="la-slots">${typed.map((_, i) => `<button type="button" class="la-slot" data-slot="${i}"></button>`).join("")}</div>
      </div>
      <div class="la-tiles" data-tiles>${round.tiles.map((t) => `<button type="button" class="choice-btn la-tile" data-tile="${t}">${show(t)}</button>`).join("")}</div>
      <div class="la-actions" data-actions>
        <button type="button" class="choice-btn keypad-key la-del" data-del>⌫</button>
        <button type="button" class="choice-btn keypad-key primary la-ok" data-ok>✓</button>
      </div>
      <div class="feedback la-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
    body.querySelectorAll("[data-tile]").forEach((b) => b.addEventListener("click", () => put(b.dataset.tile)));
    body.querySelector("[data-del]").addEventListener("click", del);
    body.querySelector("[data-ok]").addEventListener("click", check);
    paint();
  }

  function paint() {
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const i = +b.dataset.slot;
      b.innerHTML = show(typed[i]);
      b.classList.toggle("active", i === active);
    });
  }

  // La ficha va al hueco marcado y el foco pasa al de la derecha.
  function put(tile) {
    if (finished || busy) return;
    typed[active] = tile;
    if (active < typed.length - 1) active++;
    paint();
  }
  function del() {
    if (finished || busy) return;
    if (typed[active] === "" && active > 0) active--;
    typed[active] = "";
    paint();
  }

  function check() {
    if (finished || busy) return;
    const feedback = body.querySelector("[data-feedback]");
    const filled = typed.filter((v) => v !== "");
    if (!filled.length) {
      feedback.textContent = "Toca las fichas para escribir la expresión";
      feedback.className = "feedback bad la-feedback";
      return;
    }
    busy = true;
    rounds++;
    const ok = same(parseTiles(filled), parseTiles(round.answer));
    body.querySelectorAll("[data-slot]").forEach((el) => {
      const i = +el.dataset.slot, good = ok || typed[i] === round.answer[i];
      el.classList.remove("active");
      el.classList.add(good ? "good" : "bad");
      if (!good) el.innerHTML = `<s>${show(typed[i] || "·")}</s><em>${show(round.answer[i])}</em>`;
    });
    const canon = show(round.answer.join(" ").replace(/ ²/g, "²").replace(/(\d) (x|\()/g, "$1$2").replace(/\( /g, "(").replace(/ \)/g, ")").replace(/ \/ /g, "/"));
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.innerHTML = `✓ ${canon}. 💡 ${show(round.hint)}`;
      feedback.className = "feedback ok la-feedback";
      pending = setTimeout(nextRound, 1000);
    } else {
      lives--;
      renderLives();
      feedback.innerHTML = `Era ${canon}. 💡 ${show(round.hint)}`;
      feedback.className = "feedback bad la-feedback";
      const nxt = document.createElement("button");
      nxt.type = "button";
      nxt.className = "secondary la-next";
      nxt.textContent = "Siguiente →";
      nxt.addEventListener("click", advance);
      body.querySelector("[data-tiles]").remove();
      body.querySelector("[data-actions]").replaceWith(nxt);
      pending = setTimeout(advance, 2500);
    }
  }

  // Tras un fallo: se acaba la partida si no quedan vidas, si no, otra ronda.
  function advance() {
    if (finished) return;
    clearTimeout(pending);
    lives <= 0 ? finish(false) : nextRound();
  }

  // Teclado físico: cifras, x, + - * / ( ) ^ escriben la ficha si está; ⌫ y Enter.
  const KEYS = { "-": M, "*": "·", "^": "²" };
  const onKey = (e) => {
    if (finished || busy) return;
    const k = KEYS[e.key] || e.key;
    if (e.key === "Backspace") del();
    else if (e.key === "Enter") check();
    else if (round.tiles.includes(k)) put(k);
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
    saveScore(client, "lenguajealgebraico", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔤</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} frases traducidas de ${rounds}</p>
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
