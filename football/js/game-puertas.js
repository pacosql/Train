// "Pasillo de puertas" — juego grande multipantalla sobre probabilidad
// COMPUESTA y diagramas de árbol: el jugador camina físicamente el árbol.
// Cada pasillo tiene varias puertas; al atravesar una, el pasillo que sigue
// se dibuja MÁS ESTRECHO (su anchura es la probabilidad acumulada), de
// modo que multiplicar fracciones se ve como un embudo que se cierra
// (inspirado en el tablero de Galton y el Monty Hall de Mathigon).
//
// Pantallas (máquina de estados `screen`): portada → tutorial (2 puertas y
// luego 3: 1/2 × 1/3 = 1/6) → nivel 1 (dos sucesos independientes seguidos)
// → nivel 2 (bolsa sin reposición: el denominador baja) → nivel 3
// (construir el árbol asignando fracciones a las ramas) → reto Monty Hall
// (6 partidas, enumeración de los 3 casos y pregunta puntuable) →
// resultados + repaso. Vidas solo en los niveles 1-3; +10 por acierto en
// todas las pantallas (y +10 al completar el tutorial). El progreso se
// guarda en localStorage y en la tabla football_progress.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const ROUNDS_PER_LEVEL = { 1: 3, 2: 3, 3: 2 };
const MONTY_PLAYS = 6;
const STORAGE_KEY = "football_puertas_progress";
const PLAYER_KEY = "football_player_id";
const COLORS = [
  { key: "rojo", hex: "#e5484d", una: "roja", dos: "rojas" },
  { key: "azul", hex: "#2ea3c4", una: "azul", dos: "azules" },
  { key: "verde", hex: "#3fb950", una: "verde", dos: "verdes" },
  { key: "amarillo", hex: "#f5c518", una: "amarilla", dos: "amarillas" },
];

// ---------------- fracciones ----------------

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}
export function reduce(f) {
  const g = gcd(f.n, f.d) || 1;
  return { n: f.n / g, d: f.d / g };
}
export function fracKey(f) {
  const r = reduce(f);
  return `${r.n}/${r.d}`;
}
function F(n, d) {
  return { n, d };
}
function fs(f) {
  return `${f.n}/${f.d}`;
}
function fsRed(f) {
  const r = reduce(f);
  return r.n === f.n ? fs(f) : `${fs(f)} = ${fs(r)}`;
}

// Elige hasta `count` distractores del pool, todos distintos como números
// entre sí y respecto a los valores prohibidos, con 0 < valor < 1 y
// denominador ≤ 36. Devuelve null si no hay suficientes.
function pickDistractors(pool, forbidden, count) {
  const used = new Set(forbidden.map(fracKey));
  const out = [];
  for (const f of pool) {
    if (out.length >= count) break;
    if (f.n <= 0 || f.d <= 0 || f.n >= f.d || f.d > 36) continue;
    const k = fracKey(f);
    if (used.has(k)) continue;
    used.add(k);
    out.push(f);
  }
  return out.length >= count ? out : null;
}

// ---------------- generadores puros (verificados en verify_puertas.mjs) ----------------

// Nivel 1: dos sucesos independientes a/b y c/d; correcta a·c/(b·d).
export function genIndep() {
  for (let guard = 0; guard < 500; guard++) {
    const b = randInt(2, 6);
    const d = randInt(2, 6);
    const a = randInt(1, b - 1);
    const c = randInt(1, d - 1);
    if (b * d > 36) continue;
    const correct = F(a * c, b * d);
    const pool = [
      F(a * d + c * b, b * d), // sumar en vez de multiplicar
      F(a * c, b + d), // multiplicar arriba, sumar abajo
      F(a + c, b * d), // sumar arriba, multiplicar abajo
      F(a * c + 1, b * d),
      F(b * d - a * c, b * d),
      F(a, b * d),
      F(c, b * d),
      F(a + c, b + d),
      F(1, b + d),
      F(a * c, b * d - 1),
    ];
    const dis = pickDistractors(pool, [correct], 3);
    if (!dis) continue;
    return { a, b, c, d, correct, options: shuffle([correct, ...dis]) };
  }
  throw new Error("genIndep: sin ronda válida");
}

// Nivel 2: bolsa con N bolas, n del color pedido (n ≥ 2); dos extracciones
// sin reposición; correcta n(n−1)/(N(N−1)) con N ≤ 6 para que el
// denominador no pase de 36.
export function genSinRepo() {
  for (let guard = 0; guard < 500; guard++) {
    const N = randInt(4, 6);
    const n = randInt(2, N - 1);
    const m = N - n;
    const [c1, c2] = shuffle(COLORS).slice(0, 2);
    const correct = F(n * (n - 1), N * (N - 1));
    const pool = [
      F(n * n, N * N), // con reposición
      F(n * (n - 1), N * N), // olvida bajar el denominador
      F(n * n, N * (N - 1)), // olvida bajar el numerador
      F(n, N),
      F(n - 1, N - 1),
      F(2, N),
      F(n * (n - 1) + 1, N * (N - 1)),
      F(2 * n - 1, N + N - 1), // sumar
      F(1, N * (N - 1)),
      F(n + n - 1, N * (N - 1)),
    ];
    const dis = pickDistractors(pool, [correct], 3);
    if (!dis) continue;
    const balls = shuffle([...Array(n).fill(c1.key), ...Array(m).fill(c2.key)]);
    return { N, n, m, target: c1.key, other: c2.key, balls, correct, options: shuffle([correct, ...dis]) };
  }
  throw new Error("genSinRepo: sin ronda válida");
}

// Nivel 3: enunciado → árbol con 5 huecos (4 ramas + resultado) y 8 fichas
// (5 correctas + 3 distractores), todas distintas como números.
export function genArbol() {
  const mode = pick(["indep", "sinrepo"]);
  for (let guard = 0; guard < 2000; guard++) {
    let slots;
    let params;
    let pool;
    if (mode === "indep") {
      const b = randInt(2, 6);
      const d = randInt(2, 6);
      const a = randInt(1, b - 1);
      const c = randInt(1, d - 1);
      if (b * d > 36) continue;
      params = { a, b, c, d };
      slots = [
        { role: "p1", label: "Premio en el pasillo 1", frac: F(a, b) },
        { role: "q1", label: "Nada en el pasillo 1", frac: F(b - a, b) },
        { role: "p2", label: "Premio en el pasillo 2", frac: F(c, d) },
        { role: "q2", label: "Nada en el pasillo 2", frac: F(d - c, d) },
        { role: "prod", label: "Premio en los dos", frac: F(a * c, b * d) },
      ];
      pool = [F(a * d + c * b, b * d), F(a * c, b + d), F(a + c, b * d), F(a * c + 1, b * d), F(b * d - a * c, b * d), F(a, b * d), F(c, b * d), F(1, b + d), F(a + c, b + d), F(a * c, b * d - 1), F(1, b * d)];
    } else {
      const N = randInt(4, 6);
      const n = randInt(2, N - 1);
      const m = N - n;
      const [c1, c2] = shuffle(COLORS).slice(0, 2);
      params = { N, n, m, target: c1.key, other: c2.key };
      slots = [
        { role: "r1", label: `1ª bola ${c1.una}`, frac: F(n, N) },
        { role: "b1", label: `1ª bola ${c2.una}`, frac: F(m, N) },
        { role: "r2", label: `2ª bola ${c1.una} (tras una ${c1.una})`, frac: F(n - 1, N - 1) },
        { role: "b2", label: `2ª bola ${c2.una} (tras una ${c1.una})`, frac: F(m, N - 1) },
        { role: "prod", label: `Dos bolas ${c1.dos}`, frac: F(n * (n - 1), N * (N - 1)) },
      ];
      pool = [F(n * n, N * N), F(n * (n - 1), N * N), F(n * n, N * (N - 1)), F(2, N), F(n * (n - 1) + 1, N * (N - 1)), F(1, N * (N - 1)), F(2 * n - 1, N + N - 1), F(m - 1, N - 1), F(n, N - 1), F(1, N), F(m, N * (N - 1))];
    }
    const keys = slots.map((s) => fracKey(s.frac));
    if (new Set(keys).size !== keys.length) continue;
    if (slots.some((s) => s.frac.n <= 0 || s.frac.n >= s.frac.d || s.frac.d > 36)) continue;
    const dis = pickDistractors(pool, slots.map((s) => s.frac), 3);
    if (!dis) continue;
    return { mode, ...params, slots, chips: shuffle([...slots.map((s) => s.frac), ...dis]) };
  }
  throw new Error("genArbol: sin ronda válida");
}

// Reto Monty Hall: 6 partidas con el premio colocado al azar y la pregunta
// final (cambiar gana 2/3) con cuatro opciones fijas.
export function genMonty() {
  const prizes = [];
  for (let i = 0; i < MONTY_PLAYS; i++) prizes.push(randInt(0, 2));
  return { prizes, correct: F(2, 3), options: shuffle([F(1, 3), F(1, 2), F(2, 3), F(3, 4)]) };
}

// ---------------- dibujo: el pasillo que se estrecha ----------------

function colorOf(key) {
  return COLORS.find((c) => c.key === key);
}

// stages: [{ n, sel, k, kind: "door"|"ball", colors, label }]. Cada fila
// ocupa la anchura acumulada; si `sel` está definido, las `k` celdas desde
// `sel` continúan hacia abajo como un pasillo más estrecho.
function corridorSvg(stages, { finalLabel = null, tapStage = -1 } = {}) {
  const W = 250;
  const X0 = 10;
  const ROW = 40;
  const GAP = 24;
  const LX = 270;
  let y = 6;
  let x = X0;
  let w = W;
  let out = "";
  stages.forEach((st, si) => {
    const cw = w / st.n;
    const chosen = st.sel != null;
    for (let j = 0; j < st.n; j++) {
      const cx = x + j * cw;
      const inSel = chosen && j >= st.sel && j < st.sel + st.k;
      const tap = si === tapStage;
      const cls = `prt-cell${inSel ? " prt-cell-sel" : ""}${chosen && !inSel ? " prt-cell-off" : ""}${tap ? " prt-cell-tap" : ""}`;
      const attrs = tap ? ` data-door="${j}" data-stage="${si}"` : "";
      if (st.kind === "ball") {
        const r = Math.max(3, Math.min(cw / 2 - 1.5, ROW / 2 - 4));
        out += `<circle cx="${(cx + cw / 2).toFixed(1)}" cy="${y + ROW / 2}" r="${r.toFixed(1)}" class="${cls} prt-ball-cell" style="fill:${colorOf(st.colors[j]).hex}"${attrs} />`;
      } else {
        const gw = Math.max(cw - 3, 2);
        out += `<rect x="${cx.toFixed(1)}" y="${y}" width="${gw.toFixed(1)}" height="${ROW}" rx="4" class="${cls}"${attrs} />`;
        if (cw >= 16) out += `<circle cx="${(cx + gw - 6).toFixed(1)}" cy="${y + ROW / 2}" r="2.2" class="prt-knob" />`;
      }
    }
    out += `<text x="${LX}" y="${y + ROW / 2 + 5}" class="prt-lbl">${st.label}</text>`;
    if (chosen) {
      const nx = x + st.sel * cw;
      const nw = st.k * cw;
      if (si < stages.length - 1 || finalLabel != null) {
        out += `<rect x="${nx.toFixed(1)}" y="${y + ROW}" width="${Math.max(nw - 3, 2).toFixed(1)}" height="${GAP}" class="prt-band" />`;
      }
      x = nx;
      w = nw;
    }
    y += ROW + GAP;
  });
  if (finalLabel != null) {
    out += `<rect x="${x.toFixed(1)}" y="${y}" width="${Math.max(w - 3, 2).toFixed(1)}" height="16" rx="3" class="prt-final" />`;
    out += `<text x="${LX}" y="${y + 13}" class="prt-lbl prt-lbl-final">${finalLabel}</text>`;
    y += 22;
  }
  return `<svg class="prt-corridor" viewBox="0 0 340 ${y + 4}" width="340" height="${y + 4}" data-corridor>${out}</svg>`;
}

function bagSvg(balls, { tappable = false } = {}) {
  const cols = 3;
  const size = 26;
  const rows = Math.ceil(balls.length / cols);
  const W = 120;
  const H = 30 + rows * (size + 4) + 12;
  let out = `<path d="M 18 22 Q 60 4 102 22 L 108 ${H - 8} Q 60 ${H + 4} 12 ${H - 8} Z" class="prt-bag-shape" />`;
  balls.forEach((c, i) => {
    const cx = 60 + ((i % cols) - 1) * (size + 6);
    const cy = 34 + Math.floor(i / cols) * (size + 4) + size / 2;
    out += `<circle cx="${cx}" cy="${cy}" r="${size / 2 - 1}" class="prt-ball${tappable ? " prt-ball-tap" : ""}" style="fill:${colorOf(c).hex}" data-ball="${i}" data-color="${c}" />`;
  });
  return `<svg class="prt-bag" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" data-bag>${out}</svg>`;
}

function fracBtn(f) {
  return `<button type="button" class="choice-btn prt-frac" data-frac="${fs(f)}">${fs(f)}</button>`;
}

// ---------------- progreso ----------------

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { nivelMax: 0, fallosPorTipo: {}, partidas: 0 };
  } catch (_) {
    return { nivelMax: 0, fallosPorTipo: {}, partidas: 0 };
  }
}

function playerId() {
  try {
    let id = localStorage.getItem(PLAYER_KEY);
    if (!id) {
      id = `p_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(PLAYER_KEY, id);
    }
    return id;
  } catch (_) {
    return "anon";
  }
}

async function saveProgress(client, progress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (_) { /* sin almacenamiento */ }
  if (!client) return;
  try {
    await client.from("football_progress").upsert({ game: "puertas", player: playerId(), data: progress, updated_at: new Date().toISOString() });
  } catch (_) { /* el progreso remoto es una guinda */ }
}

// ---------------- juego ----------------

export function mountPuertasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false;
  let screen = "portada";
  let level = 1;
  let roundInLevel = 0;
  let levelReached = 0;
  let errors = [];
  let reviewQueue = [];
  let progress = loadProgress();
  const timers = [];

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

  function later(fn, ms) {
    timers.push(setTimeout(() => { if (!finished) fn(); }, ms));
  }
  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }
  function award() {
    rounds++;
    score += 10;
    renderScore();
  }
  function feedback(text, ok) {
    const el = body.querySelector("[data-feedback]");
    if (!el) return;
    el.textContent = text;
    el.className = `feedback ${ok ? "ok" : "bad"}`;
  }
  function recordError(tipo, explicacion) {
    errors.push({ tipo, explicacion });
  }
  function loseLife(next) {
    lives--;
    renderLives();
    if (lives <= 0) later(() => { screen = "resultados"; render(); }, 2800);
    else later(next, 2800);
  }
  function header(title, sub) {
    return `<p class="prompt">${title}${sub ? `<small>${sub}</small>` : ""}</p>`;
  }
  function badge(review, name) {
    if (review) return '<div class="prt-badge">Repaso</div>';
    return `<div class="prt-badge">Nivel ${level} · ${name} · ronda ${roundInLevel + 1} de ${ROUNDS_PER_LEVEL[level]}</div>`;
  }
  function advanceLevel() {
    roundInLevel++;
    if (roundInLevel >= ROUNDS_PER_LEVEL[level]) {
      roundInLevel = 0;
      levelReached = Math.max(levelReached, level);
      level++;
    }
    screen = level > 3 ? "monty" : `nivel${level}`;
    render();
  }
  // Resultado común de una pregunta con opciones de fracción.
  function resolve({ ok, tipo, expl, review, retry, delayOk = 2000 }) {
    if (ok) {
      award();
      feedback(`¡Correcto! ${expl}`, true);
      later(() => { locked = false; review ? nextReview() : advanceLevel(); }, delayOk);
    } else if (review) {
      feedback(`No: ${expl} Inténtalo con otra ronda.`, false);
      later(() => { locked = false; retry(); }, 2600);
    } else {
      recordError(tipo, expl);
      feedback(`No es correcto. ${expl}`, false);
      loseLife(() => { locked = false; advanceLevel(); });
    }
  }
  function bindFracButtons(correct, onPick) {
    body.querySelectorAll("[data-frac]").forEach((b) => b.addEventListener("click", () => {
      if (locked || finished) return;
      locked = true;
      body.querySelectorAll("[data-frac]").forEach((x) => (x.disabled = true));
      const picked = b.getAttribute("data-frac").split("/").map(Number);
      const ok = fracKey(F(picked[0], picked[1])) === fracKey(correct);
      b.classList.add(ok ? "correct" : "wrong");
      onPick(ok);
    }));
  }

  // ---- pantallas ----
  function renderPortada() {
    const cont = progress.nivelMax >= 1
      ? `<button class="primary prt-cta" data-continue>Continuar en el nivel ${Math.min(progress.nivelMax + 1, 3)}</button>`
      : "";
    const fallos = Object.entries(progress.fallosPorTipo || {}).filter(([, v]) => v > 0);
    body.innerHTML = `
      <div class="prt-cover">
        <div class="prt-cover-emoji">🚪</div>
        ${header("Pasillo de puertas", "Cada puerta que atraviesas estrecha el pasillo: así se multiplican las probabilidades. Aprende a caminar el árbol, a construirlo y a ganar en el concurso de las tres puertas.")}
        <p class="prt-progress">${progress.partidas ? `Has jugado ${progress.partidas} ${progress.partidas === 1 ? "vez" : "veces"}. Nivel máximo: ${progress.nivelMax} de 3.` : "Primera partida: empezamos por el tutorial."}
        ${fallos.length ? `<br>Pendiente de repasar: ${fallos.map(([t, v]) => `${t} (${v})`).join(", ")}.` : ""}</p>
        <button class="primary prt-cta" data-start>Empezar desde el tutorial</button>
        ${cont}
      </div>`;
    body.querySelector("[data-start]").addEventListener("click", () => { screen = "tutorial"; render(); });
    const c = body.querySelector("[data-continue]");
    if (c) c.addEventListener("click", () => { level = Math.min(progress.nivelMax + 1, 3); roundInLevel = 0; screen = `nivel${level}`; render(); });
  }

  function renderTutorial() {
    const prize = [randInt(0, 1), randInt(0, 2)];
    const stages = [{ n: 2, kind: "door", label: "1/2" }];
    let step = 0;
    body.innerHTML = `
      ${header("Tutorial: camina el árbol", "Un pasillo con 2 puertas; solo una lleva al premio. Toca una puerta para entrar.")}
      <div class="prt-wrap" data-wrap></div>
      <div class="prt-formula" data-formula>P(acertar la 1ª) = <b>1/2</b></div>
      <div class="prt-note" data-note>La anchura del pasillo es tu probabilidad de ir por el buen camino.</div>
      <div class="prt-actions" data-actions></div>
      <div class="feedback" data-feedback></div>`;
    const draw = (opts) => {
      body.querySelector("[data-wrap]").innerHTML = corridorSvg(stages, opts);
      body.querySelectorAll(".prt-cell-tap").forEach((el) => el.addEventListener("click", () => onDoor(Number(el.getAttribute("data-door")))));
    };
    const onDoor = (i) => {
      if (finished) return;
      if (step === 0) {
        step = 1;
        stages[0].sel = i;
        stages[0].k = 1;
        stages.push({ n: 3, kind: "door", label: "1/3" });
        body.querySelector("[data-formula]").innerHTML = `<b>1/2</b> × <b>?</b> = <b>?</b>`;
        body.querySelector("[data-note]").textContent = "El pasillo se ha estrechado a la MITAD. Ahora hay 3 puertas y solo 1 lleva al premio: toca una.";
        feedback(`Has entrado por la puerta ${i + 1}: 1 de 2. Fíjate en lo que le pasa al pasillo.`, true);
        draw({ tapStage: 1 });
      } else if (step === 1) {
        step = 2;
        stages[1].sel = i;
        stages[1].k = 1;
        body.querySelector("[data-formula]").innerHTML = `<b>1/2</b> × <b>1/3</b> = <b>1/6</b>`;
        const won = prize[0] === stages[0].sel && prize[1] === i;
        body.querySelector("[data-note]").textContent = "Cada puerta que atraviesas MULTIPLICA: el pasillo final es 1/6 del inicial. De los 6 caminos posibles, solo uno lleva al premio.";
        award();
        feedback(won
          ? "¡Premio! Has acertado el único camino de 6: tenías 1/6 de probabilidad."
          : `Sin premio: estaba tras la puerta ${prize[0] + 1} y luego la ${prize[1] + 1}. Lo normal: solo 1 camino de 6 lo tenía.`, true);
        draw({ finalLabel: "1/6" });
        body.querySelector("[data-actions]").innerHTML = `<button class="primary" data-next>Al nivel 1 →</button>`;
        body.querySelector("[data-next]").addEventListener("click", () => { level = 1; roundInLevel = 0; screen = "nivel1"; render(); });
      }
    };
    draw({ tapStage: 0 });
  }

  function renderNivel1(review = false) {
    const r = genIndep();
    const stages = [
      { n: r.b, sel: 0, k: r.a, kind: "door", label: fs(F(r.a, r.b)) },
      { n: r.d, sel: 0, k: r.c, kind: "door", label: fs(F(r.c, r.d)) },
    ];
    body.innerHTML = `
      ${badge(review, "Dos puertas seguidas")}
      ${header(`Pasillo 1: P(premio) = <b>${fs(F(r.a, r.b))}</b>. Pasillo 2: P(premio) = <b>${fs(F(r.c, r.d))}</b>. ¿Probabilidad de acertar en los DOS?`, "Las puertas moradas llevan al premio; el pasillo sigue solo por ellas")}
      <div class="prt-wrap">${corridorSvg(stages, { finalLabel: "?" })}</div>
      <div class="prt-formula">${fs(F(r.a, r.b))} × ${fs(F(r.c, r.d))} = ?</div>
      <div class="prt-options" data-options>${r.options.map(fracBtn).join("")}</div>
      <div class="feedback" data-feedback></div>`;
    const expl = `${r.a}/${r.b} × ${r.c}/${r.d} = ${fsRed(r.correct)}: se multiplican numeradores y denominadores (nunca se suman).`;
    bindFracButtons(r.correct, (ok) => resolve({ ok, tipo: "dos puertas seguidas", expl, review, retry: () => renderNivel1(true) }));
  }

  function renderNivel2(review = false) {
    const r = genSinRepo();
    const col = colorOf(r.target);
    const balls = r.balls.slice();
    const sorted = (arr) => [...arr].sort((a, b) => (a === r.target ? -1 : b === r.target ? 1 : 0));
    let drawn = false;
    body.innerHTML = `
      ${badge(review, "Sin reposición")}
      ${header(`Sacas dos bolas seguidas SIN devolver la primera. ¿Probabilidad de que las dos sean <b data-target="${r.target}">${col.dos}</b>?`, `Primero toca una bola ${col.una} de la bolsa para sacarla`)}
      <div class="prt-row">
        <div class="prt-bagwrap" data-bagwrap>${bagSvg(balls, { tappable: true })}</div>
        <div class="prt-wrap prt-wrap-side" data-tree>${corridorSvg([{ n: r.N, sel: 0, k: r.n, kind: "ball", colors: sorted(balls), label: `${r.n}/${r.N}` }])}</div>
      </div>
      <div class="prt-formula" data-formula>${r.n}/${r.N} × <b>?</b> = ?</div>
      <div class="prt-options prt-hidden" data-options>${r.options.map(fracBtn).join("")}</div>
      <div class="feedback" data-feedback></div>`;
    const bindBag = () => body.querySelectorAll(".prt-ball-tap").forEach((el) => el.addEventListener("click", () => {
      if (locked || finished || drawn) return;
      const i = Number(el.getAttribute("data-ball"));
      if (balls[i] !== r.target) { feedback(`Esa bola es ${colorOf(balls[i]).una}: queremos sacar una ${col.una}.`, false); return; }
      drawn = true;
      balls.splice(i, 1);
      body.querySelector("[data-bagwrap]").innerHTML = bagSvg(balls);
      body.querySelector("[data-tree]").innerHTML = corridorSvg([
        { n: r.N, sel: 0, k: r.n, kind: "ball", colors: sorted(r.balls), label: `${r.n}/${r.N}` },
        { n: r.N - 1, sel: 0, k: r.n - 1, kind: "ball", colors: sorted(balls), label: `${r.n - 1}/${r.N - 1}` },
      ], { finalLabel: "?" });
      body.querySelector("[data-formula]").innerHTML = `${r.n}/${r.N} × <b>${r.n - 1}/${r.N - 1}</b> = ?`;
      body.querySelector("[data-options]").classList.remove("prt-hidden");
      feedback(`Fuera una ${col.una}: quedan ${r.n - 1} ${col.dos} de ${r.N - 1} bolas. El denominador también baja. Elige la probabilidad de las dos.`, true);
    }));
    bindBag();
    const expl = `${r.n}/${r.N} × ${r.n - 1}/${r.N - 1} = ${fsRed(r.correct)}: tras sacar una ${col.una} quedan ${r.n - 1} ${col.dos} entre ${r.N - 1} bolas, así que bajan numerador y denominador.`;
    bindFracButtons(r.correct, (ok) => {
      if (!drawn) { locked = false; body.querySelectorAll("[data-frac]").forEach((x) => (x.disabled = false)); return; }
      resolve({ ok, tipo: "sin reposición", expl, review, retry: () => renderNivel2(true), delayOk: 2200 });
    });
  }

  function renderNivel3(review = false) {
    const r = genArbol();
    const assigned = Array(r.slots.length).fill(null);
    let active = 0;
    const st = r.mode === "indep"
      ? `Pasillo 1: P(premio) = <b>${r.a}/${r.b}</b>. Pasillo 2: P(premio) = <b>${r.c}/${r.d}</b>.`
      : `Bolsa con <b>${r.n}</b> bolas <b data-target="${r.target}">${colorOf(r.target).dos}</b> y <b>${r.m}</b> ${colorOf(r.other).dos}; sacas dos SIN devolver.`;
    const slot = (i) => `<button type="button" class="prt-slot" data-branch="${i}" data-role="${r.slots[i].role}">?</button>`;
    const root = r.mode === "indep" ? "Pasillo 1" : "1ª bola";
    const sub = r.mode === "indep" ? "Pasillo 2" : "2ª bola";
    body.innerHTML = `
      ${badge(review, "Construye el árbol")}
      ${header(st, "Toca un hueco del árbol y luego la fracción que le corresponde; al final, comprueba")}
      <div class="prt-tree" data-tree data-mode="${r.mode}">
        <div class="prt-tree-root">${root}</div>
        <ul class="prt-branches">
          <li><div class="prt-branch"><span>${r.slots[0].label}</span>${slot(0)}</div>
            <div class="prt-tree-root prt-tree-sub">${sub}</div>
            <ul class="prt-branches">
              <li><div class="prt-branch"><span>${r.slots[2].label}</span>${slot(2)}</div></li>
              <li><div class="prt-branch"><span>${r.slots[3].label}</span>${slot(3)}</div></li>
            </ul>
          </li>
          <li><div class="prt-branch"><span>${r.slots[1].label}</span>${slot(1)}</div></li>
        </ul>
        <div class="prt-branch prt-branch-result"><span>${r.slots[4].label} =</span>${slot(4)}</div>
      </div>
      <div class="prt-chips" data-chips>${r.chips.map((f) => `<button type="button" class="prt-chip" data-pick="${fs(f)}">${fs(f)}</button>`).join("")}</div>
      <div class="prt-actions"><button class="primary" data-check disabled>Comprobar</button></div>
      <div class="feedback" data-feedback></div>`;
    const slots = Array.from(body.querySelectorAll("[data-branch]"));
    const chips = Array.from(body.querySelectorAll("[data-pick]"));
    const paint = () => {
      slots.forEach((s, i) => {
        s.textContent = assigned[i] ? assigned[i] : "?";
        s.classList.toggle("prt-slot-active", i === active);
        s.classList.toggle("prt-slot-filled", !!assigned[i]);
      });
      chips.forEach((c) => c.classList.toggle("prt-chip-used", assigned.includes(c.getAttribute("data-pick"))));
      body.querySelector("[data-check]").disabled = assigned.some((a) => !a);
    };
    slots.forEach((s, i) => s.addEventListener("click", () => { if (locked || finished) return; active = i; paint(); }));
    chips.forEach((c) => c.addEventListener("click", () => {
      if (locked || finished || active == null) return;
      const v = c.getAttribute("data-pick");
      const prev = assigned.indexOf(v);
      if (prev >= 0) assigned[prev] = null;
      assigned[active] = v;
      const nextEmpty = assigned.findIndex((a) => !a);
      active = nextEmpty >= 0 ? nextEmpty : active;
      paint();
    }));
    paint();
    body.querySelector("[data-check]").addEventListener("click", () => {
      if (locked || finished || assigned.some((a) => !a)) return;
      locked = true;
      let allOk = true;
      slots.forEach((s, i) => {
        const [n, d] = assigned[i].split("/").map(Number);
        const ok = fracKey(F(n, d)) === fracKey(r.slots[i].frac);
        if (!ok) allOk = false;
        s.classList.add(ok ? "prt-slot-ok" : "prt-slot-bad");
      });
      chips.forEach((c) => (c.disabled = true));
      body.querySelector("[data-check]").disabled = true;
      const expl = `Árbol correcto: ${r.slots.map((s) => `${s.label} = ${fs(s.frac)}`).join("; ")}.`;
      resolve({ ok: allOk, tipo: "construir el árbol", expl, review, retry: () => renderNivel3(true), delayOk: 2400 });
    });
  }

  function renderMonty() {
    levelReached = Math.max(levelReached, 3);
    const r = genMonty();
    let play = 0;
    let chosen = null;
    let opened = null;
    let phase = "elige";
    const wins = { cambiar: [0, 0], quedarse: [0, 0] };
    const draw = () => {
      const prize = r.prizes[play];
      const doors = [0, 1, 2].map((i) => {
        const isOpen = phase === "revela" || opened === i;
        const cls = `prt-door${chosen === i ? " prt-door-chosen" : ""}${isOpen ? " prt-door-open" : ""}`;
        const inner = isOpen ? (prize === i ? "🏆" : "🐐") : `${i + 1}`;
        return `<button type="button" class="${cls}" data-door="${i}" ${phase !== "elige" ? "disabled" : ""}><span class="prt-door-face">${inner}</span><span class="prt-door-num">Puerta ${i + 1}</span></button>`;
      }).join("");
      let actions = "";
      if (phase === "cambia") {
        const other = [0, 1, 2].find((i) => i !== chosen && i !== opened);
        actions = `<button class="primary" data-switch="1">Cambiar a la ${other + 1}</button><button class="secondary" data-switch="0">Quedarme con la ${chosen + 1}</button>`;
      } else if (phase === "revela") {
        actions = `<button class="primary" data-next-play>${play + 1 < MONTY_PLAYS ? "Siguiente partida →" : "Ver los 3 casos →"}</button>`;
      }
      body.innerHTML = `
        <div class="prt-badge">Reto Monty Hall · partida ${play + 1} de ${MONTY_PLAYS}</div>
        ${header("Tres puertas: una esconde el premio", phase === "elige" ? "Elige una puerta. Aquí no se pierden vidas." : phase === "cambia" ? "El presentador, que sabe dónde está el premio, abre una puerta vacía. ¿Cambias?" : "Resultado de esta partida")}
        <div class="prt-doors">${doors}</div>
        <div class="prt-actions" data-actions>${actions}</div>
        <div class="prt-tally"><span>Cambiar: <b>${wins.cambiar[0]}</b> de ${wins.cambiar[1]}</span><span>Quedarse: <b>${wins.quedarse[0]}</b> de ${wins.quedarse[1]}</span></div>
        <div class="feedback" data-feedback></div>`;
      body.querySelectorAll("[data-door]").forEach((b) => b.addEventListener("click", () => {
        if (finished || phase !== "elige") return;
        chosen = Number(b.getAttribute("data-door"));
        const empties = [0, 1, 2].filter((i) => i !== chosen && i !== prize);
        opened = pick(empties);
        phase = "cambia";
        draw();
        feedback(`Has elegido la ${chosen + 1}. El presentador abre la ${opened + 1}: vacía.`, true);
      }));
      body.querySelectorAll("[data-switch]").forEach((b) => b.addEventListener("click", () => {
        if (finished || phase !== "cambia") return;
        const sw = b.getAttribute("data-switch") === "1";
        const final = sw ? [0, 1, 2].find((i) => i !== chosen && i !== opened) : chosen;
        const won = final === prize;
        const k = sw ? "cambiar" : "quedarse";
        wins[k][1]++;
        if (won) wins[k][0]++;
        chosen = final;
        phase = "revela";
        draw();
        feedback(`${sw ? "Has cambiado" : "Te has quedado"} con la ${final + 1}: ${won ? "¡PREMIO!" : "vacía."} El premio estaba en la ${prize + 1}.`, won);
      }));
      const nx = body.querySelector("[data-next-play]");
      if (nx) nx.addEventListener("click", () => {
        if (finished) return;
        play++;
        chosen = null;
        opened = null;
        phase = "elige";
        if (play >= MONTY_PLAYS) renderMontyCasos(r, wins);
        else draw();
      });
    };
    draw();
  }

  function montyTable() {
    const row = (p, abre, cambia, queda) => `<tr><td>${p}</td><td>1</td><td>${abre}</td><td class="${cambia ? "prt-win" : "prt-lose"}">${cambia ? "gana" : "pierde"}</td><td class="${queda ? "prt-win" : "prt-lose"}">${queda ? "gana" : "pierde"}</td></tr>`;
    return `<table class="prt-table"><thead><tr><th>Premio en</th><th>Eliges</th><th>Abre</th><th>Si cambias</th><th>Si te quedas</th></tr></thead><tbody>${row(1, "2 o 3", false, true)}${row(2, "3", true, false)}${row(3, "2", true, false)}</tbody></table>`;
  }

  function renderMontyCasos(r, wins) {
    body.innerHTML = `
      <div class="prt-badge">Reto Monty Hall · los 3 casos</div>
      ${header("Todos los casos posibles si eliges la puerta 1", "El premio puede estar en 1, 2 o 3 con la misma probabilidad. Cuenta en cuántos casos gana cambiar.")}
      ${montyTable()}
      <div class="prt-tally"><span>Tus partidas · cambiar: <b>${wins.cambiar[0]}</b> de ${wins.cambiar[1]}</span><span>quedarse: <b>${wins.quedarse[0]}</b> de ${wins.quedarse[1]}</span></div>
      <div class="prt-actions"><button class="primary" data-next>A la pregunta →</button></div>`;
    body.querySelector("[data-next]").addEventListener("click", () => renderMontyPregunta(false, r));
  }

  function renderMontyPregunta(review = false, r = genMonty()) {
    body.innerHTML = `
      <div class="prt-badge">${review ? "Repaso" : "Reto Monty Hall · pregunta"}</div>
      ${header("¿Qué probabilidad de ganar tiene <b>cambiar</b> de puerta?", "Mira la tabla: de los 3 casos igual de probables, ¿en cuántos gana cambiar?")}
      ${montyTable()}
      <div class="prt-options" data-options>${r.options.map(fracBtn).join("")}</div>
      <div class="feedback" data-feedback></div>`;
    const expl = "Cambiar gana en 2 de los 3 casos (siempre que tu primera elección fue una puerta vacía, y eso pasa 2 de cada 3 veces): P = 2/3.";
    bindFracButtons(r.correct, (ok) => {
      if (ok) {
        award();
        feedback(`¡Correcto! ${expl}`, true);
        later(() => { locked = false; if (review) nextReview(); else { screen = "resultados"; render(); } }, 2400);
      } else if (review) {
        feedback(`No: ${expl}`, false);
        later(() => { locked = false; renderMontyPregunta(true); }, 2600);
      } else {
        recordError("Monty Hall", expl);
        feedback(`No es correcto. ${expl}`, false);
        later(() => { locked = false; screen = "resultados"; render(); }, 2800);
      }
    });
  }

  function renderResultados() {
    const byType = {};
    errors.forEach((e) => { byType[e.tipo] = (byType[e.tipo] || 0) + 1; });
    progress = {
      nivelMax: Math.max(progress.nivelMax || 0, levelReached),
      fallosPorTipo: { ...(progress.fallosPorTipo || {}) },
      partidas: (progress.partidas || 0) + 1,
    };
    Object.entries(byType).forEach(([t, v]) => { progress.fallosPorTipo[t] = (progress.fallosPorTipo[t] || 0) + v; });
    saveProgress(client, progress);
    const items = errors.length
      ? `<ul class="prt-errors">${errors.map((e) => `<li><b>${e.tipo}:</b> ${e.explicacion}</li>`).join("")}</ul>`
      : `<p class="prt-progress">Sin fallos: has caminado el árbol sin perderte ni una vez.</p>`;
    body.innerHTML = `
      ${header("Resultados", `${rounds} aciertos · nivel alcanzado ${levelReached} de 3`)}
      <div class="prt-learned">Lo que has practicado: dos sucesos seguidos se MULTIPLICAN (el pasillo se estrecha); sin reposición bajan numerador y denominador; el árbol reparte las fracciones por ramas; y en Monty Hall cambiar gana 2/3 porque el presentador te regala información.</div>
      ${items}
      <div class="prt-actions" data-actions>${errors.length ? '<button class="primary" data-review>Repasar lo fallado</button>' : ""}<button class="secondary" data-end>Terminar</button></div>`;
    const rv = body.querySelector("[data-review]");
    if (rv) rv.addEventListener("click", () => { reviewQueue = [...new Set(errors.map((e) => e.tipo))]; nextReview(); });
    body.querySelector("[data-end]").addEventListener("click", () => finish(false));
  }

  function nextReview() {
    const tipo = reviewQueue.shift();
    if (!tipo) { finish(false); return; }
    if (tipo === "dos puertas seguidas") renderNivel1(true);
    else if (tipo === "sin reposición") renderNivel2(true);
    else if (tipo === "construir el árbol") renderNivel3(true);
    else if (tipo === "Monty Hall") renderMontyPregunta(true);
    else nextReview();
  }

  function render() {
    if (finished) return;
    locked = false;
    if (screen === "portada") renderPortada();
    else if (screen === "tutorial") renderTutorial();
    else if (screen === "nivel1") renderNivel1();
    else if (screen === "nivel2") renderNivel2();
    else if (screen === "nivel3") renderNivel3();
    else if (screen === "monty") renderMonty();
    else if (screen === "resultados") renderResultados();
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "puertas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🚪</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} aciertos · nivel ${levelReached} de 3</p>
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
    finished = false;
    locked = false;
    level = 1;
    roundInLevel = 0;
    levelReached = 0;
    errors = [];
    reviewQueue = [];
    progress = loadProgress();
    screen = "portada";
    renderLives();
    renderScore();
    render();
  }

  start();
  return () => {
    finished = true;
    timers.forEach(clearTimeout);
  };
}
