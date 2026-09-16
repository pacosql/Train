// "Laberinto numérico": navega una cuadrícula tocando casillas
// adyacentes que cumplan una regla (p.ej. múltiplos de 3) para llegar
// de la salida a la meta. Mecánica de recorrido/pathfinding por toques.
import { randInt, pick, saveScore } from "./utils.js";

const SIZE = 5;

function buildRule() {
  const n = pick([2, 3, 5]);
  return { label: `Solo múltiplos de ${n}`, test: (v) => v % n === 0, n };
}

function buildMaze(rule) {
  // Genera un camino válido serpenteante de salida a meta, y rellena el
  // resto de casillas con valores que NO cumplen la regla (para que solo
  // el camino sea transitable).
  const path = [[0, 0]];
  let x = 0, y = 0;
  const visited = new Set(["0,0"]);
  while (x !== SIZE - 1 || y !== SIZE - 1) {
    const options = [];
    if (x < SIZE - 1) options.push([x + 1, y]);
    if (y < SIZE - 1) options.push([x, y + 1]);
    const [nx, ny] = options[randInt(0, options.length - 1)];
    x = nx; y = ny;
    visited.add(`${x},${y}`);
    path.push([x, y]);
  }
  const grid = [];
  for (let row = 0; row < SIZE; row++) {
    grid.push([]);
    for (let col = 0; col < SIZE; col++) {
      const onPath = visited.has(`${col},${row}`);
      let v;
      if (onPath) {
        v = rule.n * randInt(1, 12);
      } else {
        do { v = randInt(1, rule.n * 12); } while (rule.test(v));
      }
      grid[row].push(v);
    }
  }
  return { grid, path, visited };
}

export function mountLaberintoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let rule = null;
  let maze = null;
  let curX = 0, curY = 0;
  let visitedCells = new Set();

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

  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function nextRound() {
    rule = buildRule();
    maze = buildMaze(rule);
    curX = 0; curY = 0;
    visitedCells = new Set(["0,0"]);
    body.innerHTML = `
      <p class="prompt">${rule.label}<small>Del 🚩 a la 🏁 pisando solo casillas válidas y adyacentes</small></p>
      <div class="coord-grid maze-grid" data-grid></div>
      <div class="feedback" data-feedback></div>
    `;
    const grid = body.querySelector("[data-grid]");
    grid.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const cell = document.createElement("button");
        cell.className = "coord-cell maze-cell";
        cell.dataset.x = col;
        cell.dataset.y = row;
        if (col === 0 && row === 0) { cell.textContent = "🚩"; cell.classList.add("maze-current"); }
        else if (col === SIZE - 1 && row === SIZE - 1) cell.textContent = "🏁";
        else cell.textContent = maze.grid[row][col];
        cell.addEventListener("click", () => tapCell(col, row, cell));
        grid.appendChild(cell);
      }
    }
  }

  function tapCell(x, y, el) {
    if (finished) return;
    const isAdjacent = Math.abs(x - curX) + Math.abs(y - curY) === 1;
    if (!isAdjacent || visitedCells.has(`${x},${y}`)) return;
    rounds++;
    const isGoal = x === SIZE - 1 && y === SIZE - 1;
    const value = maze.grid[y][x];
    const ok = isGoal || rule.test(value);
    const feedback = body.querySelector("[data-feedback]");
    if (ok) {
      body.querySelector(`[data-x="${curX}"][data-y="${curY}"]`).classList.remove("maze-current");
      el.classList.add("maze-current", "correct");
      curX = x; curY = y;
      visitedCells.add(`${x},${y}`);
      if (isGoal) {
        score += 10;
        renderScore();
        feedback.textContent = "¡Meta alcanzada!";
        feedback.className = "feedback ok";
        setTimeout(nextRound, 700);
      }
    } else {
      lives--;
      renderLives();
      el.classList.add("wrong");
      setTimeout(() => el.classList.remove("wrong"), 300);
      feedback.textContent = "Esa casilla no cumple la regla…";
      feedback.className = "feedback bad";
      if (lives <= 0) setTimeout(() => finish(false), 450);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "laberinto", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🌀</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} pasos</p>
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
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
  };
}
