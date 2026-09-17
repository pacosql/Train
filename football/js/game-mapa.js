// "Colorea el mapa": teorema de los cuatro colores en pequeño (divulgación
// de Clara Grima). El mapa se genera como regiones contiguas sobre una
// cuadrícula, se calcula su número cromático REAL por fuerza bruta y solo
// se te dan exactamente esos colores: colorear sin que dos vecinas
// coincidan ES resolver el grafo.
import { clamp, pick, shuffle, saveScore } from "./utils.js";

const W = 4;
const H = 5;

const LEVELS = [
  { regions: 4, wantK: [2, 3] },
  { regions: 6, wantK: [3] },
  { regions: 7, wantK: [3, 4] },
];

const PALETTE = ["#e8743b", "#3f8fd6", "#5ec26a", "#f0c23c"];

function neighborsOf(idx) {
  const x = idx % W;
  const y = Math.floor(idx / W);
  const out = [];
  if (x > 0) out.push(idx - 1);
  if (x < W - 1) out.push(idx + 1);
  if (y > 0) out.push(idx - W);
  if (y < H - 1) out.push(idx + W);
  return out;
}

// ¿Se puede colorear el grafo con k colores? Backtracking exhaustivo
// (fijamos el color de la primera región para no repetir permutaciones).
function canColor(n, adj, k) {
  const colors = new Array(n).fill(-1);
  function bt(i) {
    if (i === n) return true;
    const top = i === 0 ? 1 : k;
    for (let c = 0; c < top; c++) {
      let ok = true;
      for (let j = 0; j < i; j++) {
        if (adj[i][j] && colors[j] === c) { ok = false; break; }
      }
      if (ok) {
        colors[i] = c;
        if (bt(i + 1)) return true;
        colors[i] = -1;
      }
    }
    return false;
  }
  return bt(0);
}

// Número cromático exacto (1..4; los mapas planos nunca piden más).
export function chromaticNumber(n, adj) {
  for (let k = 1; k <= 4; k++) if (canColor(n, adj, k)) return k;
  return 5;
}

export function adjacencyOf(cells, n) {
  const adj = Array.from({ length: n }, () => new Array(n).fill(false));
  for (let idx = 0; idx < cells.length; idx++) {
    neighborsOf(idx).forEach((nb) => {
      const a = cells[idx];
      const b = cells[nb];
      if (a !== b) { adj[a][b] = true; adj[b][a] = true; }
    });
  }
  return adj;
}

// Regiones contiguas por crecimiento aleatorio desde semillas.
function growRegions(n) {
  const cells = new Array(W * H).fill(-1);
  const seeds = shuffle(Array.from({ length: W * H }, (_, i) => i)).slice(0, n);
  seeds.forEach((c, i) => { cells[c] = i; });
  let left = W * H - n;
  let spin = 0;
  while (left > 0 && spin++ < 200) {
    let moved = false;
    shuffle(Array.from({ length: n }, (_, i) => i)).forEach((rg) => {
      if (left <= 0) return;
      const frontier = [];
      cells.forEach((owner, idx) => {
        if (owner !== rg) return;
        neighborsOf(idx).forEach((nb) => { if (cells[nb] === -1) frontier.push(nb); });
      });
      if (!frontier.length) return;
      cells[pick(frontier)] = rg;
      left--;
      moved = true;
    });
    if (!moved) break;
  }
  return left === 0 ? cells : null;
}

function graphConnected(n, adj) {
  const seen = [0];
  const queue = [0];
  while (queue.length) {
    const cur = queue.shift();
    for (let j = 0; j < n; j++) {
      if (adj[cur][j] && !seen.includes(j)) { seen.push(j); queue.push(j); }
    }
  }
  return seen.length === n;
}

// Genera un mapa válido: todas las regiones con al menos 2 casillas (para
// poder tocarlas con el dedo), todas con alguna vecina, grafo conexo y
// número cromático dentro del rango del nivel.
export function makeMapaRound(level) {
  const cfg = LEVELS[clamp(level, 0, LEVELS.length - 1)];
  const n = cfg.regions;
  let guard = 0;
  do {
    guard++;
    const cells = growRegions(n);
    if (!cells) continue;
    const sizes = new Array(n).fill(0);
    cells.forEach((r) => { sizes[r]++; });
    if (sizes.some((s) => s < 2)) continue;
    const adj = adjacencyOf(cells, n);
    if (adj.some((row) => !row.includes(true))) continue;
    if (!graphConnected(n, adj)) continue;
    const k = chromaticNumber(n, adj);
    if (!cfg.wantK.includes(k)) continue;
    return { cells, n, adj, k };
  } while (guard < 400);
  // Guarda agotada: mapa fijo válido (su k se calcula igual, nunca se
  // anuncia un mínimo que no sea el real).
  const cells = [0, 0, 1, 1, 0, 0, 1, 1, 2, 2, 3, 3, 2, 2, 3, 3, 4, 4, 4, 4];
  const adj = adjacencyOf(cells, 5);
  return { cells, n: 5, adj, k: chromaticNumber(5, adj) };
}

export function mountMapaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  const timers = [];

  let round = null;
  let colors = [];
  let locked = true;

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

  const S = 62; // px de casilla en el viewBox del SVG

  function glyph(cx, cy, c) {
    const r = 9;
    if (c === 0) return `<circle cx="${cx}" cy="${cy}" r="${r}" class="mp-glyph"/>`;
    if (c === 1) return `<polygon points="${cx},${cy - r} ${cx + r},${cy + r} ${cx - r},${cy + r}" class="mp-glyph"/>`;
    if (c === 2) return `<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" class="mp-glyph"/>`;
    return `<polygon points="${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}" class="mp-glyph"/>`;
  }

  function renderMap(conflict) {
    const svg = body.querySelector("[data-map]");
    if (!svg) return;
    let html = "";
    for (let rg = 0; rg < round.n; rg++) {
      const own = [];
      round.cells.forEach((owner, idx) => { if (owner === rg) own.push(idx); });
      const fill = colors[rg] >= 0 ? PALETTE[colors[rg]] : "var(--bg)";
      let rects = own.map((idx) => {
        const x = (idx % W) * S;
        const y = Math.floor(idx / W) * S;
        return `<rect x="${x}" y="${y}" width="${S}" height="${S}" fill="${fill}"/>`;
      }).join("");
      // Símbolo en la casilla más céntrica de la región (accesible también
      // para quien no distinga bien los colores).
      if (colors[rg] >= 0) {
        const ax = own.reduce((s, i) => s + (i % W), 0) / own.length;
        const ay = own.reduce((s, i) => s + Math.floor(i / W), 0) / own.length;
        let best = own[0];
        let bestD = Infinity;
        own.forEach((idx) => {
          const d = Math.abs((idx % W) - ax) + Math.abs(Math.floor(idx / W) - ay);
          if (d < bestD) { bestD = d; best = idx; }
        });
        rects += glyph((best % W) * S + S / 2, Math.floor(best / W) * S + S / 2, colors[rg]);
      }
      const bad = conflict && (conflict[0] === rg || conflict[1] === rg) ? " is-conflict" : "";
      html += `<g class="mp-region${bad}" data-region="${rg}">${rects}</g>`;
    }
    // Fronteras: solo entre casillas de regiones distintas.
    let lines = "";
    for (let idx = 0; idx < round.cells.length; idx++) {
      const x = (idx % W) * S;
      const y = Math.floor(idx / W) * S;
      if (idx % W < W - 1 && round.cells[idx] !== round.cells[idx + 1]) {
        lines += `<line x1="${x + S}" y1="${y}" x2="${x + S}" y2="${y + S}" class="mp-edge"/>`;
      }
      if (Math.floor(idx / W) < H - 1 && round.cells[idx] !== round.cells[idx + W]) {
        lines += `<line x1="${x}" y1="${y + S}" x2="${x + S}" y2="${y + S}" class="mp-edge"/>`;
      }
    }
    svg.innerHTML = `${html}${lines}<rect x="1.5" y="1.5" width="${W * S - 3}" height="${H * S - 3}" class="mp-frame"/>`;
    svg.querySelectorAll("[data-region]").forEach((g) => {
      g.addEventListener("click", () => cycle(Number(g.dataset.region)));
    });
  }

  function nextRound() {
    round = makeMapaRound(Math.floor(streak / 2));
    colors = new Array(round.n).fill(-1);
    locked = false;
    const swatches = PALETTE.slice(0, round.k)
      .map((c, i) => `<span class="mp-sw" style="background:${c}">
        <svg viewBox="0 0 30 30">${glyph(15, 15, i)}</svg></span>`).join("");

    body.innerHTML = `
      <p class="prompt">Coloréalo con ${round.k} colores
        <small>Dos regiones que se tocan nunca pueden llevar el mismo color</small></p>
      <div class="mp-wrap">
        <svg class="mp-svg" data-map viewBox="0 0 ${W * S} ${H * S}"></svg>
      </div>
      <div class="mp-palette">${swatches}<span class="mp-tip">toca una región para cambiarla</span></div>
      <div class="mp-actions">
        <button class="primary" data-check>✓ Comprobar</button>
        <button class="secondary" data-clear>↺ Borrar</button>
      </div>
      <div class="feedback" data-feedback></div>
    `;
    body.querySelector("[data-check]").addEventListener("click", check);
    body.querySelector("[data-clear]").addEventListener("click", () => {
      if (finished || locked) return;
      colors = new Array(round.n).fill(-1);
      renderMap(null);
      const feedback = body.querySelector("[data-feedback]");
      feedback.textContent = "";
      feedback.className = "feedback";
    });
    renderMap(null);
  }

  function cycle(rg) {
    if (finished || locked) return;
    colors[rg] = colors[rg] + 1 >= round.k ? -1 : colors[rg] + 1;
    renderMap(null);
    const feedback = body.querySelector("[data-feedback]");
    feedback.textContent = "";
    feedback.className = "feedback";
  }

  function firstConflict() {
    for (let i = 0; i < round.n; i++) {
      for (let j = i + 1; j < round.n; j++) {
        if (round.adj[i][j] && colors[i] >= 0 && colors[i] === colors[j]) return [i, j];
      }
    }
    return null;
  }

  function check() {
    if (finished || locked) return;
    const feedback = body.querySelector("[data-feedback]");
    const missing = colors.filter((c) => c < 0).length;
    if (missing > 0) {
      renderMap(null);
      feedback.textContent = `Te ${missing === 1 ? "queda 1 región" : `quedan ${missing} regiones`} sin color`;
      feedback.className = "feedback";
      return;
    }
    const conflict = firstConflict();
    if (conflict) {
      lives--;
      renderLives();
      renderMap(conflict);
      feedback.textContent = `Estas dos regiones son vecinas y llevan el mismo color: comparten frontera, así que una tiene que cambiar`;
      feedback.className = "feedback bad";
      if (lives <= 0) { locked = true; later(() => finish(false), 2200); }
      return;
    }
    locked = true;
    rounds++;
    streak++;
    score += 10;
    renderScore();
    feedback.textContent = `¡Mapa resuelto con ${round.k} colores! +10`;
    feedback.className = "feedback ok";
    later(nextRound, 1200);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "mapa", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🗺️</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} mapas coloreados</p>
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
    streak = 0;
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    timers.forEach(clearTimeout);
  };
}
