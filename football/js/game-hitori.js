// "Hitori": puzzle de eliminación lógica en una rejilla 5x5.
// El puzzle se construye SIEMPRE al revés a partir de una solución conocida
// (primero se decide qué queda sombreado, luego se rellenan los números),
// así se garantiza que cada ronda tiene solución antes de mostrarla.
import { randInt, shuffle, saveScore } from "./utils.js";

const N = 5; // tamaño de la rejilla (pequeña a propósito, para jugar con el pulgar)

// --- Generación del puzzle -------------------------------------------------

// Cuadrado latino 5x5: cada fila y cada columna es una permutación de 1..5.
// Al ser un cuadrado latino completo, cualquier subconjunto de sus celdas
// (por ejemplo, solo las blancas) mantiene los valores distintos por
// fila/columna, así que la regla 1 queda garantizada de fábrica.
function generarCuadradoLatino() {
  const valores = shuffle([1, 2, 3, 4, 5]);
  const permFilas = shuffle([0, 1, 2, 3, 4]);
  const permCols = shuffle([0, 1, 2, 3, 4]);
  const grid = [];
  for (let i = 0; i < N; i++) {
    const fila = [];
    for (let j = 0; j < N; j++) {
      const r = permFilas[i];
      const c = permCols[j];
      fila.push(valores[(r + c) % N]);
    }
    grid.push(fila);
  }
  return grid;
}

// Comprueba que todas las celdas NO sombreadas forman un único grupo
// conectado (movimientos horizontales/verticales).
function blancasConectadas(mask) {
  const blancas = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (!mask[r][c]) blancas.push([r, c]);
    }
  }
  if (blancas.length === 0) return false;
  const visitado = new Set([`${blancas[0][0]},${blancas[0][1]}`]);
  const pila = [blancas[0]];
  while (pila.length) {
    const [r, c] = pila.pop();
    for (const [nr, nc] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]) {
      if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
      if (mask[nr][nc]) continue;
      const clave = `${nr},${nc}`;
      if (!visitado.has(clave)) {
        visitado.add(clave);
        pila.push([nr, nc]);
      }
    }
  }
  return visitado.size === blancas.length;
}

// Genera un patrón de sombreado válido (reglas 2 y 3) por reintentos:
// va sombreando celdas al azar mientras no queden dos negras pegadas y
// para cuando llega al objetivo de celdas sombreadas; si al final las
// blancas no quedan conectadas, se descarta el intento y se prueba otro.
function generarSombreado() {
  for (let intento = 0; intento < 500; intento++) {
    const mask = Array.from({ length: N }, () => Array(N).fill(false));
    const objetivo = randInt(3, 5);
    const celdas = shuffle(
      Array.from({ length: N * N }, (_, i) => [Math.floor(i / N), i % N])
    );
    let sombreadas = 0;
    for (const [r, c] of celdas) {
      if (sombreadas >= objetivo) break;
      const chocaConNegra = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].some(
        ([nr, nc]) => nr >= 0 && nr < N && nc >= 0 && nc < N && mask[nr][nc]
      );
      if (chocaConNegra) continue;
      mask[r][c] = true;
      sombreadas++;
    }
    if (sombreadas < 3) continue;
    if (!blancasConectadas(mask)) continue;
    return mask;
  }
  // Salvaguarda extremadamente improbable con N=5: sin sombreado, el
  // puzzle sigue siendo válido (todas las reglas se cumplen trivialmente
  // salvo que la regla 1 exija que el cuadrado latino completo ya sea
  // válido, cosa que es cierto por construcción).
  return Array.from({ length: N }, () => Array(N).fill(false));
}

// Rellena las celdas sombreadas con un valor que YA aparece entre las
// blancas de su misma fila o columna, para que sean pistas reales de
// duplicado (las negras no cuentan para la regla 1, así que esto nunca
// rompe la validez del cuadrado latino subyacente en las blancas).
function rellenarSombreadas(mask, grid) {
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (!mask[r][c]) continue;
      const candidatos = [];
      for (let cc = 0; cc < N; cc++) {
        if (cc !== c && !mask[r][cc]) candidatos.push(grid[r][cc]);
      }
      for (let rr = 0; rr < N; rr++) {
        if (rr !== r && !mask[rr][c]) candidatos.push(grid[rr][c]);
      }
      if (candidatos.length) {
        grid[r][c] = candidatos[randInt(0, candidatos.length - 1)];
      }
    }
  }
}

// Construye una ronda completa (rejilla de números + solución de
// sombreado) y verifica con `esSolucionValida` que esa solución es
// correcta antes de entregarla. Con la construcción de arriba siempre
// debería serlo, pero se reintenta por seguridad.
function generarPuzzle() {
  for (let intento = 0; intento < 50; intento++) {
    const grid = generarCuadradoLatino();
    const solucion = generarSombreado();
    rellenarSombreadas(solucion, grid);
    if (esSolucionValida(solucion, grid)) {
      return { grid, solucion };
    }
  }
  // No debería llegar aquí nunca; como último recurso, sombreado vacío
  // sobre un cuadrado latino (siempre válido).
  const grid = generarCuadradoLatino();
  const solucion = Array.from({ length: N }, () => Array(N).fill(false));
  return { grid, solucion };
}

// --- Validación de las 3 reglas (funciones puras) --------------------------

// Regla 2: ¿hay dos celdas sombreadas ortogonalmente pegadas? Devuelve la
// pareja de coordenadas en conflicto, o null si no hay ninguna.
function buscarAdyacentesNegras(mask) {
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (!mask[r][c]) continue;
      if (c + 1 < N && mask[r][c + 1]) return { r1: r, c1: c, r2: r, c2: c + 1 };
      if (r + 1 < N && mask[r + 1][c]) return { r1: r, c1: c, r2: r + 1, c2: c };
    }
  }
  return null;
}

// Regla 1: ¿algún número queda sin sombrear más de una vez en su fila o
// columna? Devuelve el detalle del primer choque encontrado, o null.
function buscarDuplicadoSinSombrear(mask, grid) {
  for (let r = 0; r < N; r++) {
    const vistos = new Map();
    for (let c = 0; c < N; c++) {
      if (mask[r][c]) continue;
      const v = grid[r][c];
      if (vistos.has(v)) return { tipo: "fila", indice: r, valor: v };
      vistos.set(v, c);
    }
  }
  for (let c = 0; c < N; c++) {
    const vistos = new Map();
    for (let r = 0; r < N; r++) {
      if (mask[r][c]) continue;
      const v = grid[r][c];
      if (vistos.has(v)) return { tipo: "columna", indice: c, valor: v };
      vistos.set(v, r);
    }
  }
  return null;
}

// Regla 3: ¿queda alguna celda blanca aislada del resto? Devuelve sus
// coordenadas, o null si todas las blancas están conectadas.
function buscarBlancaAislada(mask) {
  const blancas = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (!mask[r][c]) blancas.push([r, c]);
    }
  }
  if (blancas.length === 0) return null;
  const visitado = new Set([`${blancas[0][0]},${blancas[0][1]}`]);
  const pila = [blancas[0]];
  while (pila.length) {
    const [r, c] = pila.pop();
    for (const [nr, nc] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]) {
      if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
      if (mask[nr][nc]) continue;
      const clave = `${nr},${nc}`;
      if (!visitado.has(clave)) {
        visitado.add(clave);
        pila.push([nr, nc]);
      }
    }
  }
  if (visitado.size === blancas.length) return null;
  const aislada = blancas.find(([r, c]) => !visitado.has(`${r},${c}`));
  return aislada ? { r: aislada[0], c: aislada[1] } : null;
}

// Función pura: ¿este sombreado concreto cumple las 3 reglas de Hitori
// sobre esta rejilla de números? No compara contra ninguna solución de
// referencia, así que acepta cualquier sombreado válido del jugador
// aunque no coincida celda a celda con el que generó el puzzle.
function esSolucionValida(mask, grid) {
  return (
    !buscarAdyacentesNegras(mask) &&
    !buscarDuplicadoSinSombrear(mask, grid) &&
    !buscarBlancaAislada(mask)
  );
}

// Diagnóstico legible para el feedback: igual que esSolucionValida pero
// explicando CONCRETAMENTE qué regla se rompe y dónde (1-indexado, como
// lo ve el jugador).
function diagnosticarSombreado(mask, grid) {
  const negras = buscarAdyacentesNegras(mask);
  if (negras) {
    return `Hay dos celdas negras pegadas en (${negras.r1 + 1},${negras.c1 + 1})-(${negras.r2 + 1},${negras.c2 + 1}).`;
  }
  const duplicado = buscarDuplicadoSinSombrear(mask, grid);
  if (duplicado) {
    const zona = duplicado.tipo === "fila" ? "fila" : "columna";
    return `En la ${zona} ${duplicado.indice + 1} el número ${duplicado.valor} aparece sin sombrear dos veces.`;
  }
  const aislada = buscarBlancaAislada(mask);
  if (aislada) {
    return `La celda (${aislada.r + 1},${aislada.c + 1}) ha quedado aislada, sin camino hasta el resto de celdas blancas.`;
  }
  return "¡Correcto! Se cumplen las tres reglas de Hitori.";
}

// --- Juego -------------------------------------------------------------

export function mountHitoriGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let grid = null;
  let solucion = null; // sombreado de referencia (solo para generar/verificar)
  let sombreadoJugador = null;
  const timers = [];

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body ht-root" data-body></div>
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

  function nextRound() {
    const puzzle = generarPuzzle();
    grid = puzzle.grid;
    solucion = puzzle.solucion;
    sombreadoJugador = Array.from({ length: N }, () => Array(N).fill(false));

    body.innerHTML = `
      <p class="prompt">
        Sombrea celdas para que ningún número se repita SIN sombrear en su
        fila o columna
        <small>Dos negras nunca pueden quedar pegadas y las blancas deben quedar todas conectadas</small>
      </p>
      <div class="ht-grid" data-grid></div>
      <div class="feedback" data-feedback></div>
      <div class="ht-actions">
        <button class="secondary" data-clear>↺ Quitar sombreado</button>
        <button class="primary" data-check>Comprobar</button>
      </div>
    `;

    const gridEl = body.querySelector("[data-grid]");
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const celda = document.createElement("button");
        celda.type = "button";
        celda.className = "ht-cell";
        celda.dataset.cell = `${r}-${c}`;
        celda.textContent = String(grid[r][c]);
        celda.addEventListener("click", () => alternarCelda(r, c, celda));
        gridEl.appendChild(celda);
      }
    }

    body.querySelector("[data-clear]").addEventListener("click", () => {
      if (finished) return;
      sombreadoJugador = Array.from({ length: N }, () => Array(N).fill(false));
      gridEl.querySelectorAll(".ht-cell").forEach((el) => el.classList.remove("ht-cell--shaded"));
      const feedback = body.querySelector("[data-feedback]");
      feedback.textContent = "";
      feedback.className = "feedback";
    });
    body.querySelector("[data-check]").addEventListener("click", comprobar);
  }

  function alternarCelda(r, c, el) {
    if (finished) return;
    sombreadoJugador[r][c] = !sombreadoJugador[r][c];
    el.classList.toggle("ht-cell--shaded", sombreadoJugador[r][c]);
  }

  function comprobar() {
    if (finished) return;
    const feedback = body.querySelector("[data-feedback]");
    const mensaje = diagnosticarSombreado(sombreadoJugador, grid);
    const correcto = esSolucionValida(sombreadoJugador, grid);
    if (correcto) {
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = mensaje;
      feedback.className = "feedback ok";
      later(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.textContent = mensaje;
      feedback.className = "feedback bad";
      if (lives <= 0) later(() => finish(false), 900);
    }
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "hitori", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>⚫</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} puzzles de Hitori resueltos</p>
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
    timers.forEach(clearTimeout);
  };
}
