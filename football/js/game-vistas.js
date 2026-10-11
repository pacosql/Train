// "Construye según las vistas" (visión espacial, inspirado en los ítems
// de Nelson Math "Building Houses").
//
// Lo inverso del reto "Vistas" (elegir la vista de una pila dada): aquí
// se dan las VISTAS (frente, lado y, en algunos niveles, planta) y el
// jugador CONSTRUYE el sólido sobre una planta tocable. Cada casilla es
// una torre de cubos: tocar sube un cubo; en modo «− Quitar», tocar baja
// uno. La pila se dibuja en isométrica en vivo y su silueta se superpone
// tenue sobre las vistas objetivo, así se ve al momento qué columna
// sobra o falta.
//
// Corrección por PROPIEDAD: vale cualquier sólido cuyas vistas coincidan
// (hay muchas soluciones). En los niveles «mínimo» y «máximo» además se
// exige ese número exacto de cubos:
//   · máximo = Σ min(frente[col], lado[fila]) — cada casilla sube como
//     mucho hasta el menor de los dos topes que le imponen las vistas;
//   · mínimo = búsqueda sobre qué casilla "da la cara" por cada columna
//     y por cada fila (ver minSolution).
import { randInt, saveScore } from "./utils.js";

// Coordenadas: h[r][c] = altura de la torre en la fila r (0 = fondo,
// n-1 = delante) y columna c (0 = izquierda). La vista de frente mira
// desde delante (columnas de izquierda a derecha); la de lado mira desde
// la DERECHA, así que a su izquierda queda la fila de delante (A) y a su
// derecha la del fondo.
export const LEVELS = [
  { n: 3, mode: "fs" },
  { n: 3, mode: "fs" },
  { n: 3, mode: "fsp" },
  { n: 3, mode: "fsp" },
  { n: 4, mode: "fs" },
  { n: 4, mode: "fsp" },
  { n: 3, mode: "min" },
  { n: 4, mode: "min" },
  { n: 3, mode: "max" },
  { n: 4, mode: "max" },
];

export function levelCfg(level) {
  if (level < LEVELS.length) return LEVELS[level];
  // Tras la escalera: mezcla de los retos de 4×4 y mínimo/máximo.
  return LEVELS[randInt(4, LEVELS.length - 1)];
}

const zeros = (n) => Array.from({ length: n }, () => Array(n).fill(0));
const rowLetter = (n, r) => String.fromCharCode(65 + (n - 1 - r)); // A = fila de delante

export function views(h) {
  const n = h.length;
  const F = Array(n).fill(0);
  const S = Array(n).fill(0);
  const P = h.map((row) => row.map((v) => v > 0));
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      F[c] = Math.max(F[c], h[r][c]);
      S[r] = Math.max(S[r], h[r][c]);
    }
  return { F, S, P };
}

export const total = (h) => h.reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0);

// Máximo: cada casilla al tope min(F[c], S[r]). Es la única solución con
// el máximo de cubos (cualquier otra queda por debajo casilla a casilla).
export function maxSolution(F, S) {
  const n = F.length;
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => Math.min(F[c], S[r])));
}

// Mínimo por búsqueda. Toda solución necesita, por cada columna c con
// F[c] > 0, una casilla "testigo" de altura exactamente F[c] en una fila
// con S[r] ≥ F[c]; y por cada fila, otra de altura S[r]. Quitar todo lo
// que no sea testigo no rompe las vistas y no añade cubos, así que basta
// con recorrer las elecciones de testigos de columna (≤ 4^4 = 256) y,
// para cada una, resolver cada fila por separado: si ya tiene un testigo
// de columna de altura S[r], le sale gratis; si no, cuesta S[r] cubos
// nuevos en una casilla vacía de una columna con F[c] ≥ S[r].
export function minSolution(F, S) {
  const n = F.length;
  const cols = [];
  for (let c = 0; c < n; c++) if (F[c] > 0) cols.push(c);
  let best = null;
  let bestSum = Infinity;
  const pickRow = new Array(n).fill(-1);
  function rec(k) {
    if (k === cols.length) {
      const h = zeros(n);
      for (const c of cols) {
        const r = pickRow[c];
        if (h[r][c] !== 0) return; // dos columnas no pueden compartir casilla
        h[r][c] = F[c];
      }
      for (let r = 0; r < n; r++) {
        if (S[r] === 0) continue;
        if (h[r].some((v) => v === S[r])) continue;
        let done = false;
        for (let c = 0; c < n && !done; c++) {
          if (F[c] >= S[r] && h[r][c] === 0) {
            h[r][c] = S[r];
            done = true;
          }
        }
        if (!done) return; // imposible con estos testigos
      }
      const sum = total(h);
      if (sum < bestSum) {
        bestSum = sum;
        best = h;
      }
      return;
    }
    const c = cols[k];
    for (let r = 0; r < n; r++) {
      if (S[r] >= F[c]) {
        pickRow[c] = r;
        rec(k + 1);
      }
    }
  }
  rec(0);
  return best;
}

// Genera un reto: se inventa un sólido al azar y se sacan sus vistas.
// Como las vistas salen de un sólido real, siempre hay solución.
export function genRound(cfg) {
  const { n, mode } = cfg;
  const H = n; // alturas de 0 a 3 (3×3) o de 0 a 4 (4×4)
  for (let guard = 0; guard < 10000; guard++) {
    const h = Array.from({ length: n }, () =>
      Array.from({ length: n }, () => (Math.random() < 0.4 ? 0 : randInt(1, H)))
    );
    const { F, S, P } = views(h);
    if (total(h) < 3) continue;
    if (F.filter((v) => v > 0).length < 2 || S.filter((v) => v > 0).length < 2) continue;
    if (Math.max(...F) < 2) continue;
    // La planta debe aportar algo: al menos una casilla vacía.
    if (mode === "fsp" && P.every((row) => row.every(Boolean))) continue;
    const minH = minSolution(F, S);
    const maxH = maxSolution(F, S);
    const min = total(minH);
    const max = total(maxH);
    // En mínimo/máximo tiene que haber margen real entre ambos.
    if ((mode === "min" || mode === "max") && max - min < 3) continue;
    // En «máximo» hay que tocar una vez por cubo: que no sean demasiados.
    if (mode === "max" && max > (n === 3 ? 18 : 28)) continue;
    return { n, H, mode, h, F, S, P, min, max, minH, maxH };
  }
  throw new Error("genRound: sin reto");
}

// Solución que se enseña al fallar.
export function shownSolution(round) {
  if (round.mode === "min") return round.minH;
  if (round.mode === "max") return round.maxH;
  return round.h;
}

// Corrección por propiedad.
export function judge(round, g) {
  const n = round.n;
  const v = views(g);
  const badF = [];
  const badS = [];
  const badP = [];
  for (let c = 0; c < n; c++) if (v.F[c] !== round.F[c]) badF.push(c);
  for (let r = 0; r < n; r++) if (v.S[r] !== round.S[r]) badS.push(r);
  if (round.mode === "fsp")
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (v.P[r][c] !== round.P[r][c]) badP.push([r, c]);
  const count = total(g);
  if (badF.length || badS.length || badP.length) return { ok: false, kind: "views", badF, badS, badP, v, count };
  if (round.mode === "min" && count !== round.min) return { ok: false, kind: "min", badF, badS, badP, v, count };
  if (round.mode === "max" && count !== round.max) return { ok: false, kind: "max", badF, badS, badP, v, count };
  return { ok: true, badF, badS, badP, v, count };
}

// ---------- Dibujo ----------

// Isométrica: el punto (c, r, z) va a X = (c − r)·a, Y = (c + r)·b − z·s.
// Se mira desde delante-derecha-arriba, así que se ven la cara de arriba,
// la de delante (+r) y la derecha (+c). Orden del pintor: de atrás hacia
// delante por c + r + z (los cubos con la misma suma no se solapan).
const IS = 20;
const IA = IS * Math.cos(Math.PI / 6);
const IB = IS / 2;
const P3 = (c, r, z) => `${((c - r) * IA).toFixed(1)},${((c + r) * IB - z * IS).toFixed(1)}`;

export function isoSVG(h, H, cls = "") {
  const n = h.length;
  const cubes = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) for (let z = 0; z < h[r][c]; z++) cubes.push([c, r, z]);
  cubes.sort((p, q) => p[0] + p[1] + p[2] - (q[0] + q[1] + q[2]));
  const poly = (k, pts) => `<polygon class="${k}" points="${pts.join(" ")}"/>`;
  let floor = poly("vs-floor", [P3(0, 0, 0), P3(n, 0, 0), P3(n, n, 0), P3(0, n, 0)]);
  for (let i = 1; i < n; i++) {
    floor += `<polyline class="vs-floorline" points="${P3(i, 0, 0)} ${P3(i, n, 0)}"/>`;
    floor += `<polyline class="vs-floorline" points="${P3(0, i, 0)} ${P3(n, i, 0)}"/>`;
  }
  const faces = cubes
    .map(
      ([c, r, z]) =>
        poly("vs-ft", [P3(c, r, z + 1), P3(c + 1, r, z + 1), P3(c + 1, r + 1, z + 1), P3(c, r + 1, z + 1)]) +
        poly("vs-ff", [P3(c, r + 1, z), P3(c + 1, r + 1, z), P3(c + 1, r + 1, z + 1), P3(c, r + 1, z + 1)]) +
        poly("vs-fr", [P3(c + 1, r, z), P3(c + 1, r + 1, z), P3(c + 1, r + 1, z + 1), P3(c + 1, r, z + 1)])
    )
    .join("");
  const x0 = -n * IA - 6;
  const w = 2 * n * IA + 12;
  const y0 = -H * IS - 6;
  const hgt = H * IS + n * IS + 26;
  const ly = 1.5 * n * IB + 16;
  const labels = `<text class="vs-isolab" x="${(-n * IA) / 2 - 4}" y="${ly}" text-anchor="middle">frente</text>
    <text class="vs-isolab" x="${(n * IA) / 2 + 4}" y="${ly}" text-anchor="middle">lado</text>`;
  return `<svg class="vs-iso ${cls}" viewBox="${x0.toFixed(1)} ${y0} ${w.toFixed(1)} ${hgt}" aria-label="Pila en isométrica">${floor}${faces}${labels}</svg>`;
}

// Vista de alzado (frente o lado) como silueta en cuadrícula.
//   target[j], mine[j]: alturas por columna de la vista (j de izq. a der.)
//   bad: índices j en rojo; hl: índice resaltado; labels: rótulos
function elevSVG(kind, target, mine, H, bad, hl, labels) {
  const n = target.length;
  const u = 14;
  const W = n * u;
  const Ht = H * u;
  let s = "";
  for (let j = 0; j < n; j++) {
    if (bad.includes(j)) s += `<rect class="vs-badcol" x="${j * u}" y="0" width="${u}" height="${Ht}"/>`;
    if (hl === j) s += `<rect class="vs-hlcol" x="${j * u}" y="0" width="${u}" height="${Ht}"/>`;
    for (let k = 0; k < H; k++) {
      const filled = k < target[j];
      s += `<rect class="${filled ? "vs-t" : "vs-cell"}" data-${kind}="${j}" x="${j * u + 0.5}" y="${Ht - (k + 1) * u + 0.5}" width="${u - 1}" height="${u - 1}"/>`;
    }
    if (mine && mine[j] > 0) {
      const m = Math.min(mine[j], H);
      s += `<rect class="vs-p" x="${j * u + 2.5}" y="${Ht - m * u + 2.5}" width="${u - 5}" height="${m * u - 5}"/>`;
    }
    s += `<text class="vs-lab${bad.includes(j) ? " bad" : ""}" x="${j * u + u / 2}" y="${Ht + 11}" text-anchor="middle">${labels[j]}</text>`;
  }
  s += `<line class="vs-ground" x1="0" y1="${Ht}" x2="${W}" y2="${Ht}"/>`;
  return `<svg class="vs-elev" viewBox="-1 -1 ${W + 2} ${Ht + 15}">${s}</svg>`;
}

function planSVG(P, mineP, bad, hl) {
  const n = P.length;
  const u = 14;
  let s = "";
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      const isBad = bad.some(([br, bc]) => br === r && bc === c);
      if (isBad) s += `<rect class="vs-badcol" x="${c * u}" y="${r * u}" width="${u}" height="${u}"/>`;
      if (hl && hl.r === r && hl.c === c) s += `<rect class="vs-hlcol" x="${c * u}" y="${r * u}" width="${u}" height="${u}"/>`;
      s += `<rect class="${P[r][c] ? "vs-t" : "vs-cell"}" data-plan="${r},${c}" x="${c * u + 0.5}" y="${r * u + 0.5}" width="${u - 1}" height="${u - 1}"/>`;
      if (mineP && mineP[r][c]) s += `<rect class="vs-p" x="${c * u + 2.5}" y="${r * u + 2.5}" width="${u - 5}" height="${u - 5}"/>`;
    }
  return `<svg class="vs-elev vs-plansvg" viewBox="-1 -1 ${n * u + 2} ${n * u + 15}">${s}<text class="vs-lab" x="${(n * u) / 2}" y="${n * u + 11}" text-anchor="middle">delante</text></svg>`;
}

export function mountVistasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let round = null;
  let grid = null; // alturas del jugador
  let mode = "add";
  let busy = false;
  let hl = null; // casilla recién tocada (para resaltar su columna y su fila)
  let lastJudge = null;
  const timers = new Set();
  const later = (fn, ms) => {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
    return t;
  };
  const clearTimers = () => {
    timers.forEach(clearTimeout);
    timers.clear();
  };

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body vs-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");

  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function promptText() {
    const m = round.mode;
    if (m === "min") return `Construye estas vistas con el <b>MÍNIMO</b> de cubos`;
    if (m === "max") return `Construye estas vistas con el <b>MÁXIMO</b> de cubos`;
    if (m === "fsp") return `Construye un sólido con estas <b>tres</b> vistas`;
    return `Construye un sólido con estas vistas`;
  }

  function nextRound() {
    round = genRound(levelCfg(level));
    grid = zeros(round.n);
    mode = "add";
    busy = false;
    hl = null;
    lastJudge = null;
    body.innerHTML = `
      <p class="prompt vs-prompt">${promptText()}
        <small>Toca una casilla de la planta para subir su torre un cubo. Con «− Quitar» activado, tocarla la baja.</small></p>
      <div class="vs-views" data-views></div>
      <div class="vs-work">
        <div class="vs-planwrap" data-planwrap></div>
        <div class="vs-isowrap" data-iso></div>
      </div>
      <div class="vs-controls" data-controls>
        <div class="vs-mode" role="group" aria-label="Modo">
          <button type="button" data-mode="add">＋ Poner</button>
          <button type="button" data-mode="del">− Quitar</button>
        </div>
        <span class="vs-count" data-count></span>
        <button type="button" class="vs-clear" data-clear>Vaciar</button>
      </div>
      <button type="button" class="primary vs-check" data-check>Comprobar</button>
      <div class="feedback vs-feedback" data-feedback></div>
      <div class="vs-sol" data-sol></div>
    `;
    body.querySelectorAll("[data-mode]").forEach((b) =>
      b.addEventListener("click", () => {
        if (busy || finished) return;
        mode = b.dataset.mode;
        paintControls();
      })
    );
    body.querySelector("[data-clear]").addEventListener("click", () => {
      if (busy || finished) return;
      grid = zeros(round.n);
      hl = null;
      paintAll();
    });
    body.querySelector("[data-check]").addEventListener("click", check);
    paintAll();
  }

  function paintControls() {
    body.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("on", b.dataset.mode === mode));
    body.querySelector("[data-count]").textContent = `🧊 ${total(grid)} cubos`;
  }

  function paintViews() {
    const n = round.n;
    const v = views(grid);
    const j = lastJudge;
    // Vista de lado: de izquierda a derecha, de la fila de delante a la del fondo.
    const sideT = [];
    const sideM = [];
    const sideL = [];
    const sideBad = [];
    for (let k = 0; k < n; k++) {
      const r = n - 1 - k;
      sideT.push(round.S[r]);
      sideM.push(v.S[r]);
      sideL.push(rowLetter(n, r));
      if (j && j.badS.includes(r)) sideBad.push(k);
    }
    const colL = Array.from({ length: n }, (_, c) => String(c + 1));
    let html = `
      <figure class="vs-view"><figcaption>Frente</figcaption>
        ${elevSVG("front", round.F, v.F, round.H, j ? j.badF : [], hl ? hl.c : -1, colL)}</figure>
      <figure class="vs-view"><figcaption>Lado <span>(desde la derecha)</span></figcaption>
        ${elevSVG("side", sideT, sideM, round.H, sideBad, hl ? n - 1 - hl.r : -1, sideL)}</figure>`;
    if (round.mode === "fsp")
      html += `<figure class="vs-view"><figcaption>Planta <span>(desde arriba)</span></figcaption>
        ${planSVG(round.P, v.P, j ? j.badP : [], hl)}</figure>`;
    body.querySelector("[data-views]").innerHTML = html;
  }

  function paintPlan() {
    const n = round.n;
    let html = `<div class="vs-grid vs-n${n}" style="--vs-n:${n}">`;
    html += `<span></span>`;
    for (let c = 0; c < n; c++) html += `<span class="vs-axis">${c + 1}</span>`;
    for (let r = 0; r < n; r++) {
      html += `<span class="vs-axis">${rowLetter(n, r)}</span>`;
      for (let c = 0; c < n; c++) {
        const k = grid[r][c];
        html += `<button type="button" class="vs-cellbtn${k === 0 ? " z" : ""}${hl && hl.r === r && hl.c === c ? " hl" : ""}" data-r="${r}" data-c="${c}" style="--vs-h:${k}" aria-label="Casilla ${rowLetter(n, r)}${c + 1}, altura ${k}">${k}</button>`;
      }
    }
    html += `</div><div class="vs-front-mark">▲ delante</div>`;
    const wrap = body.querySelector("[data-planwrap]");
    wrap.innerHTML = html;
    wrap.querySelectorAll("[data-r]").forEach((b) => b.addEventListener("click", () => tapCell(+b.dataset.r, +b.dataset.c)));
  }

  function paintIso() {
    body.querySelector("[data-iso]").innerHTML = isoSVG(grid, round.H);
  }

  function paintAll() {
    paintViews();
    paintPlan();
    paintIso();
    paintControls();
  }

  function tapCell(r, c) {
    if (busy || finished) return;
    const fb = body.querySelector("[data-feedback]");
    if (mode === "add") {
      if (grid[r][c] >= round.H) {
        fb.textContent = `Las torres llegan como mucho a ${round.H} cubos.`;
        fb.className = "feedback vs-feedback";
        return;
      }
      grid[r][c]++;
    } else {
      if (grid[r][c] === 0) return;
      grid[r][c]--;
    }
    fb.textContent = "";
    lastJudge = null;
    hl = { r, c };
    paintAll();
  }

  function check() {
    if (busy || finished) return;
    rounds++;
    const res = judge(round, grid);
    lastJudge = res;
    hl = null;
    paintAll();
    const fb = body.querySelector("[data-feedback]");
    if (res.ok) {
      busy = true;
      score += 10;
      level++;
      renderScore();
      fb.textContent =
        round.mode === "min"
          ? `¡Mínimo! ${res.count} cubos y ni uno menos.`
          : round.mode === "max"
          ? `¡Máximo! Caben ${res.count} cubos y los has puesto todos.`
          : `¡Las vistas cuadran! (${res.count} cubos)`;
      fb.className = "feedback ok vs-feedback";
      body.querySelector("[data-check]").disabled = true;
      later(nextRound, 1300);
      return;
    }
    lives--;
    renderLives();
    busy = true;
    body.querySelector("[data-check]").disabled = true;
    body.querySelector("[data-controls]").classList.add("off");
    const n = round.n;
    const parts = [];
    if (res.kind === "views") {
      res.badF.slice(0, 2).forEach((c) =>
        parts.push(`Frente, columna ${c + 1}: debe medir ${round.F[c]} y la tuya mide ${res.v.F[c]}.`)
      );
      res.badS.slice(0, 2).forEach((r) =>
        parts.push(`Lado, fila ${rowLetter(n, r)}: debe medir ${round.S[r]} y la tuya mide ${res.v.S[r]}.`)
      );
      if (res.badP.length) {
        const [r, c] = res.badP[0];
        parts.push(
          `Planta: la casilla ${rowLetter(n, r)}${c + 1} debería estar ${round.P[r][c] ? "ocupada" : "vacía"}.`
        );
      }
      parts.push(
        `Ojo: cada vista solo enseña la torre MÁS ALTA de cada columna (o fila); las de detrás quedan escondidas. Por eso hay muchas soluciones.`
      );
    } else if (res.kind === "min") {
      parts.push(`Las vistas cuadran, pero usas ${res.count} cubos y bastan ${round.min}.`);
      parts.push(
        `Truco: pon cada torre donde sirva a la vez para el frente y para el lado (misma altura en su columna y en su fila); el resto, vacío.`
      );
    } else {
      parts.push(`Las vistas cuadran, pero caben ${round.max} cubos y has puesto ${res.count}.`);
      parts.push(
        `Cada casilla puede subir hasta el menor de dos números: lo que pide su columna en el frente y lo que pide su fila en el lado. Los cubos de más quedan escondidos detrás.`
      );
    }
    fb.innerHTML = parts.map((p) => `<span>${p}</span>`).join("");
    fb.className = "feedback bad vs-feedback";
    showSolution();
  }

  function showSolution() {
    const sol = shownSolution(round);
    const n = round.n;
    let g = `<div class="vs-grid vs-mini" style="--vs-n:${n}"><span></span>`;
    for (let c = 0; c < n; c++) g += `<span class="vs-axis">${c + 1}</span>`;
    for (let r = 0; r < n; r++) {
      g += `<span class="vs-axis">${rowLetter(n, r)}</span>`;
      for (let c = 0; c < n; c++) g += `<span class="vs-cellbtn${sol[r][c] === 0 ? " z" : ""}" style="--vs-h:${sol[r][c]}">${sol[r][c]}</span>`;
    }
    g += `</div>`;
    const last = lives <= 0;
    body.querySelector("[data-sol]").innerHTML = `
      <div class="vs-soltitle">Una solución (${total(sol)} cubos):</div>
      <div class="vs-solrow">${g}<div class="vs-isowrap">${isoSVG(sol, round.H)}</div></div>
      <button type="button" class="primary" data-next>${last ? "Ver resultado" : "Siguiente reto →"}</button>`;
    body.querySelector("[data-next]").addEventListener("click", () => {
      if (finished) return;
      if (last) finish(false);
      else nextRound();
    });
    body.querySelector("[data-sol]").scrollIntoView?.({ block: "nearest" });
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimers();
    if (userExited) return onExit();
    saveScore(client, "vistas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧊</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} sólidos construidos en ${rounds} intentos</p>
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
    clearTimers();
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
    clearTimers();
  };
}
