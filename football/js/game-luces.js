// "Apaga las luces" (Lights Out, Tiger Electronics, 1995).
//
// Rejilla de bombillas: tocar una cambia ella y sus 4 vecinas (en cruz).
// Hay que apagarlas todas. Es paridad / álgebra módulo 2 con el dedo: el
// ORDEN de los toques no importa y tocar dos veces la misma casilla es
// como no tocarla, así que cada solución es un CONJUNTO de casillas.
//
// Generación: desde todo apagado se aplican k toques distintos al azar
// (siempre resoluble). El mínimo real se calcula resolviendo el sistema
// lineal A·x = −b sobre GF(p) y recorriendo todo el núcleo (en 4×4 y 5×5
// hay estados con varias soluciones; la de menos toques no tiene por qué
// ser la que se usó para generar).
//
// Una ronda se gana apagando todo con toques ≤ mínimo + margen (margen
// generoso al principio, 0 en los niveles altos). Si se llega al límite
// sin apagarlo todo, se pierde una vida y se explica: cuántas veces tocó
// cada casilla, tachadas las tocadas un número par de veces (se anulan) y
// superpuesto el conjunto mínimo de casillas a tocar.
//
// Niveles: 3×3 → 4×4 → 5×5 → variante "×" (cambian las diagonales) →
// variante de 3 estados (apagada → ámbar → roja → apagada, módulo 3).
import { randInt, shuffle, saveScore } from "./utils.js";

export const LEVELS = [
  { n: 3, nb: "+", p: 2, k: [2, 2], margin: 3 },
  { n: 3, nb: "+", p: 2, k: [3, 3], margin: 2 },
  { n: 3, nb: "+", p: 2, k: [4, 5], margin: 2 },
  { n: 4, nb: "+", p: 2, k: [3, 4], margin: 2 },
  { n: 4, nb: "+", p: 2, k: [5, 6], margin: 1 },
  { n: 5, nb: "+", p: 2, k: [4, 5], margin: 1 },
  { n: 5, nb: "+", p: 2, k: [6, 7], margin: 0 },
  { n: 3, nb: "x", p: 2, k: [3, 3], margin: 1 },
  { n: 4, nb: "x", p: 2, k: [4, 5], margin: 0 },
  { n: 3, nb: "+", p: 3, k: [2, 3], margin: 1 },
  { n: 4, nb: "+", p: 3, k: [3, 4], margin: 0 },
];
// Pasado el último nivel se sigue al azar entre los difíciles (margen 0).
const HARD = [6, 8, 10];

// Casillas que cambian al tocar i (ella incluida).
export function affected(n, nb, i) {
  const r = Math.floor(i / n);
  const c = i % n;
  const d = nb === "+" ? [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] : [[0, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  return d.map(([dr, dc]) => [r + dr, c + dc]).filter(([a, b]) => a >= 0 && a < n && b >= 0 && b < n).map(([a, b]) => a * n + b);
}
export function applyTap(state, n, nb, p, i, times = 1) {
  for (const j of affected(n, nb, i)) state[j] = (state[j] + times) % p;
}

// Resuelve A·x = −b (mod p). Devuelve el mínimo de toques y TODAS las
// soluciones de toques mínimos (recorriendo el núcleo entero).
export function solveLights(n, nb, p, b) {
  const N = n * n;
  const inv = (a) => {
    for (let x = 1; x < p; x++) if ((a * x) % p === 1) return x;
    throw new Error("sin inverso");
  };
  // Fila i: cómo afecta cada toque j a la casilla i, y lo que hace falta.
  const M = [];
  for (let i = 0; i < N; i++) {
    const row = new Array(N + 1).fill(0);
    for (let j = 0; j < N; j++) if (affected(n, nb, j).includes(i)) row[j] = 1;
    row[N] = (p - (b[i] % p)) % p;
    M.push(row);
  }
  const pivCol = [];
  let r = 0;
  for (let c = 0; c < N && r < N; c++) {
    let s = r;
    while (s < N && M[s][c] === 0) s++;
    if (s === N) continue;
    [M[r], M[s]] = [M[s], M[r]];
    const iv = inv(M[r][c]);
    for (let k = 0; k <= N; k++) M[r][k] = (M[r][k] * iv) % p;
    for (let t = 0; t < N; t++) {
      if (t === r || M[t][c] === 0) continue;
      const f = M[t][c];
      for (let k = 0; k <= N; k++) M[t][k] = (((M[t][k] - f * M[r][k]) % p) + p) % p;
    }
    pivCol.push(c);
    r++;
  }
  for (let t = r; t < N; t++) if (M[t][N] !== 0) return { solvable: false, min: Infinity, sols: [], kernelDim: N - r };
  const isPiv = new Set(pivCol);
  const free = [];
  for (let c = 0; c < N; c++) if (!isPiv.has(c)) free.push(c);
  // x = particular + Σ t_f · v_f ; con las libres fijadas, las pivote salen solas.
  let min = Infinity;
  let sols = [];
  const total = p ** free.length;
  for (let code = 0; code < total; code++) {
    const x = new Array(N).fill(0);
    let cc = code;
    for (const fc of free) {
      x[fc] = cc % p;
      cc = Math.floor(cc / p);
    }
    for (let k = 0; k < pivCol.length; k++) {
      let v = M[k][N];
      for (const fc of free) v -= M[k][fc] * x[fc];
      x[pivCol[k]] = ((v % p) + p) % p;
    }
    const w = x.reduce((a, v) => a + v, 0);
    if (w < min) {
      min = w;
      sols = [x];
    } else if (w === min && sols.length < 64) sols.push(x);
  }
  return { solvable: true, min, sols, kernelDim: free.length };
}

// Ronda: k toques distintos al azar desde todo apagado; mínimo ≥ 2 (≥ 3
// si k ≥ 4) para que no salga trivial.
export function makeLucesRound(lv) {
  for (;;) {
    const N = lv.n * lv.n;
    const k = randInt(lv.k[0], lv.k[1]);
    const taps = shuffle([...Array(N).keys()]).slice(0, k);
    const start = new Array(N).fill(0);
    for (const t of taps) applyTap(start, lv.n, lv.nb, lv.p, t);
    if (start.every((v) => v === 0)) continue;
    const sol = solveLights(lv.n, lv.nb, lv.p, start);
    if (!sol.solvable) continue; // no puede pasar (viene de toques), pero por si acaso
    if (sol.min < (k >= 4 ? 3 : 2)) continue;
    return { start, taps, min: sol.min, sols: sol.sols, limit: sol.min + lv.margin };
  }
}

export function mountLucesGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let lv = null;
  let round = null;
  let state = [];
  let counts = [];
  let taps = 0;
  let busy = false;
  const timers = new Set();
  const later = (fn, ms) => {
    const t = setTimeout(() => {
      timers.delete(t);
      if (!finished) fn();
    }, ms);
    timers.add(t);
  };

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  let gridEl, infoEl, feedbackEl, hintEl, explainEl;

  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function levelDef() {
    if (level < LEVELS.length) return LEVELS[level];
    return { ...LEVELS[HARD[randInt(0, HARD.length - 1)]], margin: 0 };
  }

  // Icono 3×3 con el dibujo de qué cambia al tocar el centro.
  function patternIcon() {
    const on = new Set(affected(3, lv.nb, 4));
    return `<span class="lz-icon" aria-hidden="true">${[...Array(9).keys()]
      .map((i) => `<i class="${i === 4 ? "lz-ic-c" : on.has(i) ? "lz-ic-on" : ""}"></i>`)
      .join("")}</span>`;
  }
  function ruleText() {
    const who = lv.nb === "+" ? "y sus vecinas de arriba, abajo y los lados (+)" : "y sus vecinas en diagonal (×)";
    return lv.p === 2
      ? `Tocar una bombilla la cambia a ella ${who}`
      : `Cada toque avanza ella ${who}: apagada → ámbar → roja → apagada`;
  }

  function nextRound() {
    lv = levelDef();
    round = makeLucesRound(lv);
    state = round.start.slice();
    counts = new Array(state.length).fill(0);
    taps = 0;
    busy = false;
    body.innerHTML = `
      <p class="prompt lz-prompt">Apaga todas las luces<small>${ruleText()}</small></p>
      <div class="lz-info">${patternIcon()}<span data-info></span></div>
      <div class="lz-grid" data-grid style="--lz-n:${lv.n}"></div>
      <div class="feedback" data-feedback></div>
      <div class="lz-explain" data-explain hidden></div>
      <div class="lz-actions">
        <button type="button" class="secondary lz-hint-btn" data-hint-btn>💡 Pista${lv.nb === "+" && lv.p === 2 ? ": persigue las luces" : ""}</button>
        <button type="button" class="primary" data-next hidden>Seguir →</button>
      </div>
      <p class="lz-hint" data-hint hidden></p>
    `;
    gridEl = body.querySelector("[data-grid]");
    infoEl = body.querySelector("[data-info]");
    feedbackEl = body.querySelector("[data-feedback]");
    hintEl = body.querySelector("[data-hint]");
    explainEl = body.querySelector("[data-explain]");
    gridEl.innerHTML = state
      .map((_, i) => `<button type="button" class="lz-cell" data-i="${i}" aria-label="bombilla ${i + 1}"><span class="lz-bulb"></span></button>`)
      .join("");
    gridEl.querySelectorAll("[data-i]").forEach((b) => b.addEventListener("click", () => tap(Number(b.dataset.i))));
    body.querySelector("[data-hint-btn]").addEventListener("click", () => {
      hintEl.hidden = !hintEl.hidden;
      hintEl.innerHTML = hintText();
    });
    paint();
  }

  function hintText() {
    if (lv.p === 3)
      return "Cada toque suma 1 (apagada → ámbar → roja → apagada): tocar 3 veces es como no tocar. El orden no importa. Truco: persigue las luces bajando fila a fila — para que una casilla de arriba quede apagada, toca la de justo debajo 1 vez si está roja y 2 si está ámbar.";
    if (lv.nb === "x")
      return "Aquí cada toque cambia las diagonales, así que las casillas «blancas» y «negras» del tablero de ajedrez nunca se mezclan: resuelve cada color por separado. Tocar dos veces es como no tocar, y el orden no importa.";
    return "Persigue las luces: mira la fila de arriba y, por cada luz encendida, toca la casilla de justo DEBAJO; esa luz se apaga. Baja así fila a fila: al final solo quedan luces en la última fila. Para apagarlas, hay que volver a empezar tocando la fila de arriba en las columnas adecuadas. No es lo más corto, pero siempre funciona. Y recuerda: el orden no importa y tocar dos veces es como no tocar.";
  }

  function paint(flash = []) {
    const fl = new Set(flash);
    gridEl.querySelectorAll("[data-i]").forEach((b) => {
      const i = Number(b.dataset.i);
      b.className = `lz-cell lz-s${state[i]}${lv.p === 3 ? " lz-p3" : ""}${fl.has(i) ? " lz-flash" : ""}`;
    });
    infoEl.innerHTML = `Toques <b>${taps}</b> / ${round.limit} · mínimo: <b>${round.min}</b>`;
  }

  function tap(i) {
    if (busy || finished) return;
    applyTap(state, lv.n, lv.nb, lv.p, i);
    counts[i]++;
    taps++;
    paint(affected(lv.n, lv.nb, i));
    if (state.every((v) => v === 0)) return win();
    if (taps >= round.limit) fail();
  }

  function win() {
    busy = true;
    rounds++;
    score += 10;
    level++;
    renderScore();
    gridEl.classList.add("lz-done");
    feedbackEl.textContent =
      taps === round.min ? `¡Todo apagado en ${taps} toques! Es el mínimo.` : `¡Todo apagado en ${taps} toques! (se podía en ${round.min})`;
    feedbackEl.className = "feedback ok";
    later(nextRound, 1300);
  }

  function fail() {
    busy = true;
    rounds++;
    lives--;
    renderLives();
    const p = lv.p;
    // Lo que de verdad cuenta de cada casilla es el número de toques mod p.
    const net = counts.map((c) => c % p);
    const netTotal = net.reduce((a, v) => a + v, 0);
    // De las soluciones mínimas, la más parecida a lo que hizo el jugador.
    const best = round.sols.reduce((b, s) => {
      const diff = s.reduce((a, v, i) => a + (v !== net[i] ? 1 : 0), 0);
      return !b || diff < b.diff ? { s, diff } : b;
    }, null).s;
    // Se vuelve al tablero del principio con los toques del jugador encima.
    state = round.start.slice();
    gridEl.classList.add("lz-review");
    gridEl.querySelectorAll("[data-i]").forEach((b) => {
      const i = Number(b.dataset.i);
      const c = counts[i];
      const cancel = c > 0 && c % p === 0;
      b.className = `lz-cell lz-s${state[i]}${p === 3 ? " lz-p3" : ""}${best[i] ? " lz-need" : ""}${cancel ? " lz-cancel" : ""}`;
      b.innerHTML = `<span class="lz-bulb"></span>${c ? `<span class="lz-count">×${c}</span>` : ""}${
        best[i] ? `<span class="lz-mark">${best[i] === 1 ? "✓" : "✓✓"}</span>` : ""
      }`;
    });
    const need = best.filter((v) => v).length;
    const verb = p === 2 ? "tocar 2 veces es como no tocar" : "tocar 3 veces es como no tocar";
    feedbackEl.textContent = `Llegaste al límite de ${round.limit} toques sin apagarlo todo.`;
    feedbackEl.className = "feedback bad";
    explainEl.hidden = false;
    explainEl.innerHTML = `
      <p>Este es el tablero del principio. El número de cada casilla es cuántas veces la tocaste${
        counts.some((c) => c > 0 && c % p === 0) ? `; las <s>tachadas</s> se anulan: ${verb}` : ""
      }. Y el <b>orden no importa</b>: solo cuenta cuántas veces tocas cada casilla.</p>
      <p>Tus ${taps} toques equivalen a ${netTotal}. Bastaba con ${
        p === 2
          ? `tocar las <b>${need}</b> casillas verdes, una vez cada una`
          : `tocar las <b>${need}</b> casillas verdes (✓ una vez, ✓✓ dos veces)`
      }, en cualquier orden: <b>${round.min}</b> toques.</p>`;
    const next = body.querySelector("[data-next]");
    next.hidden = false;
    next.textContent = lives > 0 ? "Otro tablero →" : "Ver puntuación";
    next.addEventListener("click", () => (lives > 0 ? nextRound() : finish(false)));
    infoEl.innerHTML = `Toques <b>${taps}</b> / ${round.limit} · mínimo: <b>${round.min}</b>`;
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    timers.clear();
    if (userExited) return onExit();
    saveScore(client, "luces", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>💡</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} tableros apagados</p>
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
    level = 0;
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    timers.forEach(clearTimeout);
    timers.clear();
  };
}
