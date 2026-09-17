// "Caen diez": tablero de fichas 1-9 al estilo Sum10 — se tocan dos fichas
// ADYACENTES (nunca en diagonal) y si suman exactamente 10 desaparecen, las
// de arriba caen para tapar el hueco y llegan fichas nuevas por arriba.
// Solo se pierde una vida cuando el tablero se queda sin ninguna pareja
// adyacente posible que sume 10 ("atascado"): entonces se renueva entero.
import { randInt, saveScore } from "./utils.js";

const ROWS = 6;
const COLS = 5;

// ¿Existe en `grid` al menos una pareja de celdas ADYACENTES (arriba, abajo,
// izquierda o derecha — nunca en diagonal) cuyos valores sumen 10?
// `grid` es un array de arrays [fila][columna]; una celda puede ser `null`
// mientras cae, y esas celdas nunca cuentan como jugada posible.
export function hayJugada(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = grid[r][c];
      if (v == null) continue;
      const der = grid[r][c + 1];
      if (c + 1 < cols && der != null && v + der === 10) return true;
      const abajo = grid[r + 1] ? grid[r + 1][c] : null;
      if (r + 1 < rows && abajo != null && v + abajo === 10) return true;
    }
  }
  return false;
}

function crearGridAleatorio(rows, cols) {
  const g = [];
  for (let r = 0; r < rows; r++) {
    g.push(Array.from({ length: cols }, () => randInt(1, 9)));
  }
  return g;
}

// Genera una cuadrícula que SIEMPRE tiene alguna jugada posible: se prueba
// al azar y, si tras muchos intentos no sale ninguna con pareja que sume 10
// (estadísticamente muy raro), se fuerza una pareja a propósito en la
// esquina para no depender solo de la suerte.
function crearGridJugable(rows, cols) {
  let grid;
  let intentos = 0;
  do {
    grid = crearGridAleatorio(rows, cols);
    intentos++;
  } while (!hayJugada(grid) && intentos < 60);
  if (!hayJugada(grid)) {
    const a = randInt(1, 9);
    grid[0][0] = a;
    grid[0][1] = 10 - a;
  }
  return grid;
}

// Aplica la gravedad a una columna: las fichas que quedan caen hacia abajo
// manteniendo su orden relativo y arriba entran fichas nuevas al azar.
function colapsarColumna(columna) {
  const restantes = columna.filter((v) => v != null);
  const faltan = columna.length - restantes.length;
  const nuevas = Array.from({ length: faltan }, () => randInt(1, 9));
  return { columna: nuevas.concat(restantes), nuevasFilas: faltan };
}

export function mountSuma10Game(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false; // evita tocar fichas mientras el tablero se está renovando
  let grid = [];
  let selected = null; // { r, c } de la ficha elegida primero
  let nuevasTrasColapso = new Set(); // celdas "r,c" recién llegadas, para animarlas
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

  function setFeedback(text, kind) {
    const feedback = body.querySelector("[data-feedback]");
    if (!feedback) return;
    feedback.textContent = text;
    feedback.className = kind ? `feedback ${kind}` : "feedback";
  }

  // Pinta la interfaz fija (una sola vez por partida/reinicio).
  function initUI() {
    body.innerHTML = `
      <p class="prompt">Toca dos fichas <b>adyacentes</b> que sumen 10<small>Arriba, abajo, izquierda o derecha — nunca en diagonal</small></p>
      <div class="s10-board" data-board></div>
      <div class="feedback" data-feedback></div>
    `;
  }

  // Redibuja solo el contenido del tablero a partir de `grid`.
  function renderBoard() {
    const boardEl = body.querySelector("[data-board]");
    if (!boardEl) return;
    boardEl.innerHTML = "";
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const valor = grid[r][c];
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "s10-cell";
        if (nuevasTrasColapso.has(`${r},${c}`)) btn.classList.add("s10-new");
        if (selected && selected.r === r && selected.c === c) btn.classList.add("s10-selected");
        btn.textContent = String(valor);
        btn.addEventListener("click", () => onCellClick(r, c));
        boardEl.appendChild(btn);
      }
    }
    nuevasTrasColapso = new Set();
  }

  // Quita las fichas de las coordenadas indicadas y hace caer el resto,
  // rellenando por arriba con fichas nuevas al azar.
  function eliminarYColapsar(a, b) {
    grid[a.r][a.c] = null;
    grid[b.r][b.c] = null;
    nuevasTrasColapso = new Set();
    for (let c = 0; c < COLS; c++) {
      const columna = [];
      for (let r = 0; r < ROWS; r++) columna.push(grid[r][c]);
      const { columna: nueva, nuevasFilas } = colapsarColumna(columna);
      for (let r = 0; r < ROWS; r++) {
        grid[r][c] = nueva[r];
        if (r < nuevasFilas) nuevasTrasColapso.add(`${r},${c}`);
      }
    }
  }

  function onCellClick(r, c) {
    if (finished || locked) return;
    if (grid[r][c] == null) return;

    if (!selected) {
      selected = { r, c };
      renderBoard();
      return;
    }
    if (selected.r === r && selected.c === c) {
      selected = null; // segundo toque sobre la misma ficha: se deselecciona
      renderBoard();
      return;
    }
    const esAdyacente = Math.abs(selected.r - r) + Math.abs(selected.c - c) === 1;
    if (!esAdyacente) {
      // No son vecinas: cambiamos la selección a esta ficha, más cómodo
      // que obligar a deseleccionar primero con el pulgar.
      selected = { r, c };
      renderBoard();
      return;
    }

    const v1 = grid[selected.r][selected.c];
    const v2 = grid[r][c];
    const suma = v1 + v2;
    if (suma === 10) {
      rounds++;
      score += 10;
      renderScore();
      setFeedback(`${v1} + ${v2} = 10 → ¡fichas eliminadas!`, "ok");
      eliminarYColapsar(selected, { r, c });
      selected = null;
      renderBoard();
      comprobarAtasco();
    } else {
      setFeedback(`${v1} + ${v2} = ${suma}, no es 10 — prueba otra pareja`, "bad");
      selected = null;
      renderBoard();
    }
  }

  // Tras cada movimiento, si ya no queda ninguna pareja adyacente que sume
  // 10 en todo el tablero, se pierde una vida y se renueva la cuadrícula.
  function comprobarAtasco() {
    if (hayJugada(grid)) return;
    lives--;
    renderLives();
    if (lives <= 0) {
      setFeedback("No quedan parejas que sumen 10 en el tablero: sin vidas.", "bad");
      return later(() => finish(false), 900);
    }
    locked = true;
    setFeedback("No quedan parejas que sumen 10 en el tablero: pierdes 1 vida y se renueva.", "bad");
    later(() => {
      grid = crearGridJugable(ROWS, COLS);
      selected = null;
      locked = false;
      renderBoard();
      setFeedback("", "");
    }, 1100);
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "suma10", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧲</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} parejas de 10 encontradas</p>
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
    locked = false;
    selected = null;
    nuevasTrasColapso = new Set();
    grid = crearGridJugable(ROWS, COLS);
    renderLives();
    renderScore();
    initUI();
    renderBoard();
  }

  start();
  return () => {
    finished = true;
    timers.forEach(clearTimeout);
  };
}
