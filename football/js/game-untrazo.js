// "De un solo trazo" (🏠): dibujar un recorrido continuo sin levantar el
// dedo, gastando cada línea una sola vez (la casita de San Nicolás y los
// puentes de Königsberg de Euler).
//
// Pantalla: un dibujo de 5-9 puntos unidos por líneas (SVG). El pulgar
// sale de un punto y recorre líneas: pasar cerca del siguiente punto
// unido por una línea sin gastar la gasta y la pinta. Levantar el dedo
// termina el intento. Bien si se gastan todas; si no, −1 vida, cada punto
// enseña cuántas líneas le llegan, los impares brillan, se marcan las
// líneas sin gastar y se reintenta el MISMO dibujo.
//
// Niveles: 1) dibujos con todos los puntos pares (se puede empezar en
// cualquiera); 2) dibujos con exactamente 2 impares (la casita clásica la
// primera): solo sale empezando en un impar; 3) dibujos "imposibles" con
// 4 impares: primero hay que añadir con el lápiz rojo la línea mínima
// (arrastrar entre dos puntos impares) y luego dibujarlo.
//
// Generación: paseo aleatorio por una red de 3×3 o 3×4 puntos que no
// repite línea ni cruza otra (solo pasos a vecinos, y como mucho una
// diagonal por casilla) → el propio paseo es un recorrido euleriano.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const SP = 90; // separación entre puntos de la red (unidades SVG)
const PAD = 36; // margen del dibujo
const HIT = 30; // radio de "pasar cerca" de un punto (unidades SVG)
const NEAR_LINE = 0.35 * SP; // una línea roja no puede rozar otro punto
const DIRS = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [-1, -1], [1, -1], [-1, 1],
];

// ---------- Generación ----------

// Paseo aleatorio sin repetir arista ni cruzar diagonales. closed=true
// exige volver al punto de salida. Devuelve la lista de puntos visitados.
function randomTrail(cols, rows, closed, minE, maxE) {
  for (let tries = 0; tries < 4000; tries++) {
    const start = [randInt(0, cols - 1), randInt(0, rows - 1)];
    const used = new Set();
    const diagCells = new Set();
    const path = [start];
    let cur = start;
    const goal = randInt(minE, maxE);
    let ok = false;
    while (path.length - 1 < maxE) {
      const opts = [];
      for (const [dx, dy] of DIRS) {
        const nx = cur[0] + dx;
        const ny = cur[1] + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const ek = edgeKeyXY(cur, [nx, ny]);
        if (used.has(ek)) continue;
        if (dx && dy) {
          const cell = `${Math.min(cur[0], nx)},${Math.min(cur[1], ny)}`;
          if (diagCells.has(cell)) continue; // cruzaría la otra diagonal
        }
        opts.push([nx, ny, dx, dy]);
      }
      if (!opts.length) break;
      // En los cerrados, si ya se puede volver a la salida y hay líneas
      // suficientes, a veces se vuelve a propósito.
      let choice = pick(opts);
      if (closed && path.length - 1 >= minE - 1) {
        const back = opts.find(([x, y]) => x === start[0] && y === start[1]);
        if (back && Math.random() < 0.6) choice = back;
      }
      const [nx, ny, dx, dy] = choice;
      used.add(edgeKeyXY(cur, [nx, ny]));
      if (dx && dy) diagCells.add(`${Math.min(cur[0], nx)},${Math.min(cur[1], ny)}`);
      cur = [nx, ny];
      path.push(cur);
      const atStart = cur[0] === start[0] && cur[1] === start[1];
      if (closed && atStart && path.length - 1 >= minE) {
        ok = true;
        break;
      }
      if (!closed && path.length - 1 >= goal) {
        ok = !atStart;
        break;
      }
    }
    if (ok) return path;
  }
  return null;
}

function edgeKeyXY(a, b) {
  const s = `${a[0]},${a[1]}`;
  const t = `${b[0]},${b[1]}`;
  return s < t ? `${s}|${t}` : `${t}|${s}`;
}

// Convierte un paseo en grafo { pts:[[x,y]], edges:[[i,j]] } (red).
function trailToGraph(path) {
  const idx = new Map();
  const pts = [];
  const id = (p) => {
    const k = `${p[0]},${p[1]}`;
    if (!idx.has(k)) {
      idx.set(k, pts.length);
      pts.push(p.slice());
    }
    return idx.get(k);
  };
  const edges = [];
  for (let i = 0; i < path.length - 1; i++) edges.push([id(path[i]), id(path[i + 1])]);
  return { pts, edges, start: id(path[0]), end: id(path[path.length - 1]) };
}

function degrees(n, edges) {
  const d = new Array(n).fill(0);
  for (const [a, b] of edges) {
    d[a]++;
    d[b]++;
  }
  return d;
}

function connected(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    adj[a].push(b);
    adj[b].push(a);
  }
  const seen = new Set([0]);
  const stack = [0];
  while (stack.length) {
    const v = stack.pop();
    for (const w of adj[v]) if (!seen.has(w)) seen.add(w), stack.push(w);
  }
  return seen.size === n;
}

// La casita de San Nicolás: 5 puntos, 8 líneas, las dos esquinas de
// abajo impares. Las diagonales se cruzan en un sitio que NO es punto.
function nicolasHouse() {
  return {
    pts: [[1, 0], [0, 1], [2, 1], [0, 3], [2, 3]],
    edges: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4], [1, 4], [2, 3]],
    house: true,
  };
}

// tier 0: todos pares · tier 1: 2 impares · tier 2: 4 impares (lápiz rojo)
export function buildRound(tier, opts = {}) {
  if (tier === 1 && opts.house) return { tier, ...nicolasHouse() };
  for (let guard = 0; guard < 500; guard++) {
    const cols = 3;
    const rows = pick([3, 4]);
    const path =
      tier === 0 ? randomTrail(cols, rows, true, 7, 11) : randomTrail(cols, rows, false, tier === 2 ? 8 : 6, tier === 2 ? 12 : 10);
    if (!path) continue;
    const g = trailToGraph(path);
    const n = g.pts.length;
    if (n < 5 || n > 9) continue;
    let edges = g.edges;
    const deg = degrees(n, edges);
    // Que no sea una simple cadena o un simple anillo: algún cruce de caminos.
    if (Math.max(...deg) < 3) continue;
    if (tier === 2) {
      // Se quita una línea entre dos puntos de paso → 4 impares.
      const cands = shuffle(edges.map((e, i) => i)).filter((i) => {
        const [a, b] = edges[i];
        return a !== g.start && a !== g.end && b !== g.start && b !== g.end;
      });
      let removed = -1;
      for (const i of cands) {
        const rest = edges.filter((_, j) => j !== i);
        if (connected(n, rest)) {
          removed = i;
          break;
        }
      }
      if (removed < 0) continue;
      edges = edges.filter((_, j) => j !== removed);
    }
    const odd = degrees(n, edges).filter((d) => d % 2).length;
    if (odd !== [0, 2, 4][tier]) continue;
    // Recentrar en la esquina (0,0).
    const mx = Math.min(...g.pts.map((p) => p[0]));
    const my = Math.min(...g.pts.map((p) => p[1]));
    return { tier, pts: g.pts.map(([x, y]) => [x - mx, y - my]), edges };
  }
  // Respaldo (no debería usarse): la casita.
  return { tier: 1, ...nicolasHouse() };
}

// Distancia de un punto a un segmento.
function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const L = dx * dx + dy * dy;
  let t = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// ---------- Juego ----------

export function mountUntrazoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let pending = null;
  let round = null;
  let edges = []; // [a, b, esRoja]
  let spent = []; // booleano por línea
  let phase = "draw"; // "red" (lápiz rojo) | "draw" | "busy"
  let showDeg = false;
  let houseShown = false;
  let drag = null; // { pointerId, cur, start, path:[], lastX, lastY, red }
  let svg = null;

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

  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  const P = (i) => [PAD + round.pts[i][0] * SP, PAD + round.pts[i][1] * SP];
  const degs = () => degrees(round.pts.length, edges);

  function tierFor(lv) {
    if (lv < 2) return 0;
    if (lv < 5) return 1;
    return Math.random() < 0.75 ? 2 : 1;
  }

  function nextRound() {
    const tier = tierFor(level);
    const house = tier === 1 && !houseShown;
    if (house) houseShown = true;
    round = buildRound(tier, { house });
    edges = round.edges.map(([a, b]) => [a, b, false]);
    spent = edges.map(() => false);
    phase = round.tier === 2 ? "red" : "draw";
    showDeg = false;
    const W = 2 * PAD + Math.max(...round.pts.map((p) => p[0])) * SP;
    const H = 2 * PAD + Math.max(...round.pts.map((p) => p[1])) * SP;
    body.innerHTML = `
      <p class="prompt ut-prompt" data-prompt></p>
      <div class="ut-wrap">
        <svg class="ut-svg" data-svg viewBox="0 0 ${W} ${H}" style="max-width:${Math.round(W * 1.3)}px">
          <g data-lines></g>
          <line class="ut-band" data-band x1="0" y1="0" x2="0" y2="0" visibility="hidden"></line>
          <g data-pts></g>
        </svg>
      </div>
      <div class="ut-legend" data-legend></div>
      <div class="feedback" data-feedback></div>
    `;
    svg = body.querySelector("[data-svg]");
    bindSvg();
    setPrompt();
    paint();
  }

  function setPrompt() {
    const el = body.querySelector("[data-prompt]");
    if (phase === "red") {
      el.innerHTML = `Así es imposible de un trazo ✏️<small>Añade con el lápiz rojo la línea que lo arregla: arrastra de un punto a otro</small>`;
    } else if (round.tier === 1) {
      el.innerHTML = `Dibújalo de un solo trazo<small>${
        round.house ? "La casita de San Nicolás. " : ""
      }Ojo: no vale empezar en cualquier punto</small>`;
    } else if (round.tier === 2) {
      el.innerHTML = `Ahora sí: dibújalo de un solo trazo<small>La línea roja también hay que gastarla</small>`;
    } else {
      el.innerHTML = `Dibújalo de un solo trazo<small>Sin levantar el dedo y sin repetir ninguna línea</small>`;
    }
  }

  function paint(unspentMark = false) {
    const d = degs();
    const linesEl = svg.querySelector("[data-lines]");
    linesEl.innerHTML = edges
      .map(([a, b, red], i) => {
        const [x1, y1] = P(a);
        const [x2, y2] = P(b);
        const cls = ["ut-edge", red ? "ut-red" : "", spent[i] ? "ut-spent" : "", unspentMark && !spent[i] ? "ut-left" : ""]
          .filter(Boolean)
          .join(" ");
        return `<line class="${cls}" data-edge="${i}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>`;
      })
      .join("");
    const ptsEl = svg.querySelector("[data-pts]");
    ptsEl.innerHTML = round.pts
      .map((_, i) => {
        const [x, y] = P(i);
        const odd = d[i] % 2 === 1;
        const glow = showDeg && odd ? `<circle class="ut-glow" cx="${x}" cy="${y}" r="21"></circle>` : "";
        const cur = drag && !drag.red && drag.cur === i ? " ut-cur" : "";
        const st = drag && !drag.red && drag.start === i ? " ut-start" : "";
        const lbl = showDeg
          ? `<text class="ut-deg${odd ? " odd" : ""}" x="${x + 15}" y="${y - 13}">${d[i]}</text>`
          : "";
        return `${glow}<circle class="ut-pt${cur}${st}" data-pt="${i}" cx="${x}" cy="${y}" r="10"></circle>${lbl}`;
      })
      .join("");
    const legend = body.querySelector("[data-legend]");
    legend.textContent = showDeg ? "El número es cuántas líneas llegan a cada punto. Los impares brillan." : "";
  }

  function toSvg(e) {
    const m = svg.getScreenCTM();
    if (!m) return [0, 0];
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return [p.x, p.y];
  }
  function nearestPt(x, y, r) {
    let best = -1;
    let bd = r;
    round.pts.forEach((_, i) => {
      const [px, py] = P(i);
      const dd = Math.hypot(px - x, py - y);
      if (dd < bd) {
        bd = dd;
        best = i;
      }
    });
    return best;
  }

  function band(x1, y1, x2, y2, red) {
    const b = svg.querySelector("[data-band]");
    b.setAttribute("x1", x1);
    b.setAttribute("y1", y1);
    b.setAttribute("x2", x2);
    b.setAttribute("y2", y2);
    b.setAttribute("visibility", "visible");
    b.classList.toggle("red", !!red);
  }
  function hideBand() {
    svg.querySelector("[data-band]").setAttribute("visibility", "hidden");
  }

  function bindSvg() {
    svg.addEventListener("pointerdown", (e) => {
      if (finished || phase === "busy" || drag) return;
      const [x, y] = toSvg(e);
      const i = nearestPt(x, y, HIT + 6);
      if (i < 0) return;
      e.preventDefault();
      try {
        svg.setPointerCapture(e.pointerId);
      } catch (_) {}
      if (phase === "red") {
        drag = { pointerId: e.pointerId, cur: i, start: i, red: true };
        band(...P(i), x, y, true);
        return;
      }
      // Nuevo intento: se borra lo gastado y se empieza desde este punto.
      spent = edges.map(() => false);
      drag = { pointerId: e.pointerId, cur: i, start: i, red: false, lastX: x, lastY: y, steps: 0 };
      const fb = body.querySelector("[data-feedback]");
      fb.textContent = "";
      fb.className = "feedback";
      paint();
      band(...P(i), x, y);
    });
    svg.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.pointerId || finished) return;
      const [x, y] = toSvg(e);
      if (drag.red) {
        band(...P(drag.cur), x, y, true);
        return;
      }
      // ¿Ha pasado el dedo cerca de un punto unido al actual por una
      // línea sin gastar? (se mira el tramo recorrido desde el último
      // evento, por si el dedo va rápido)
      let moved = true;
      let guard = 0;
      while (moved && guard++ < 10) {
        moved = false;
        for (let k = 0; k < edges.length; k++) {
          if (spent[k]) continue;
          const [a, b] = edges[k];
          if (a !== drag.cur && b !== drag.cur) continue;
          const w = a === drag.cur ? b : a;
          const [wx, wy] = P(w);
          if (distSeg(wx, wy, drag.lastX, drag.lastY, x, y) < HIT) {
            spent[k] = true;
            drag.cur = w;
            drag.steps++;
            moved = true;
            break;
          }
        }
      }
      drag.lastX = x;
      drag.lastY = y;
      if (guard > 1) paint();
      band(...P(drag.cur), x, y);
    });
    const end = (e) => {
      if (!drag || e.pointerId !== drag.pointerId) return;
      const d = drag;
      drag = null;
      hideBand();
      if (finished) return;
      if (d.red) {
        const [x, y] = toSvg(e);
        const j = nearestPt(x, y, HIT + 6);
        paint();
        if (j >= 0 && j !== d.start) tryRedLine(d.start, j);
        return;
      }
      if (d.steps === 0) {
        paint();
        return; // un toque sin moverse no cuenta como intento
      }
      judge(d);
    };
    svg.addEventListener("pointerup", end);
    svg.addEventListener("pointercancel", end);
  }

  function tryRedLine(a, b) {
    const fb = body.querySelector("[data-feedback]");
    if (edges.some(([p, q]) => (p === a && q === b) || (p === b && q === a))) {
      fb.textContent = "Ahí ya hay una línea. Elige otros dos puntos.";
      fb.className = "feedback";
      return;
    }
    const [ax, ay] = P(a);
    const [bx, by] = P(b);
    const crosses = round.pts.some((_, i) => {
      if (i === a || i === b) return false;
      const [px, py] = P(i);
      return distSeg(px, py, ax, ay, bx, by) < NEAR_LINE;
    });
    if (crosses) {
      fb.textContent = "Esa línea pasaría por encima de otro punto. Elige otros dos.";
      fb.className = "feedback";
      return;
    }
    const d = degs();
    const oddA = d[a] % 2 === 1;
    const oddB = d[b] % 2 === 1;
    if (oddA && oddB) {
      edges.push([a, b, true]);
      spent.push(false);
      phase = "draw";
      setPrompt();
      paint();
      fb.textContent = "¡Bien! Esos dos impares pasan a ser pares: quedan solo 2 impares.";
      fb.className = "feedback ok";
      return;
    }
    // Línea que no arregla nada: −1 vida y se enseña la cuenta.
    rounds++;
    lives--;
    renderLives();
    showDeg = true;
    paint();
    const after = d.filter((v, i) => (i === a || i === b ? (v + 1) % 2 : v % 2)).length;
    fb.innerHTML = `✗ Cada línea nueva suma 1 a sus dos extremos. Has unido ${
      oddA || oddB ? "un impar con un par" : "dos pares"
    }: quedarían ${after} impares. Hay 4 impares y un trazo solo admite 2 (el principio y el final): une dos impares.`;
    fb.className = "feedback bad";
    if (lives <= 0) {
      phase = "busy";
      pending = setTimeout(() => finish(false), 2600);
    }
  }

  function judge(d) {
    const left = spent.filter((s) => !s).length;
    const fb = body.querySelector("[data-feedback]");
    rounds++;
    if (left === 0) {
      phase = "busy";
      score += 10;
      level++;
      renderScore();
      paint();
      fb.textContent =
        round.tier === 0
          ? "¡Dibujo completo! Todos los puntos eran pares: se sale y se vuelve al mismo."
          : "¡Dibujo completo! Empezaste en un impar y acabaste en el otro.";
      fb.className = "feedback ok";
      pending = setTimeout(nextRound, 1300);
      return;
    }
    lives--;
    renderLives();
    showDeg = true;
    paint(true);
    const deg = degs();
    const odd = deg.filter((v) => v % 2).length;
    const startOdd = deg[d.start] % 2 === 1;
    const stuck = !edges.some(([a, b], k) => !spent[k] && (a === d.cur || b === d.cur));
    const tail = `Quedaron ${left} ${left === 1 ? "línea" : "líneas"} sin gastar (en rojo).`;
    let why;
    if (odd === 2 && !startOdd) {
      why =
        "En un punto de paso entras y sales: gastas 2. Con número impar, ahí hay que empezar o acabar. Tú empezaste en uno par. " +
        tail;
    } else if (!stuck) {
      why = `Levantaste el dedo antes de acabar. ${tail}`;
    } else if (odd === 2) {
      why = `Empezaste bien, en un impar, pero te quedaste encerrado. ${tail} No dejes líneas sueltas detrás: acabarás en el otro impar.`;
    } else {
      why = `Aquí todos los puntos son pares: se puede salir de cualquiera, pero se acaba en el mismo. Te quedaste encerrado. ${tail} No dejes un trozo aislado detrás.`;
    }
    fb.textContent = `✗ ${why} Vuelve a intentarlo.`;
    fb.className = "feedback bad";
    if (lives <= 0) {
      phase = "busy";
      pending = setTimeout(() => finish(false), 2600);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    drag = null;
    if (userExited) return onExit();
    saveScore(client, "untrazo", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🏠</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} ${score === 10 ? "dibujo" : "dibujos"} de un solo trazo</p>
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
    clearTimeout(pending);
    lives = startLives;
    score = 0;
    rounds = 0;
    level = 0;
    houseShown = false;
    finished = false;
    drag = null;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    drag = null;
    clearTimeout(pending);
  };
}
