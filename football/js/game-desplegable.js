// "¿Qué cubo sale?": desarrollo plano de un cubo (en cruz) y hay que
// adivinar, entre 3 cubos ya plegados en pseudo-3D, cuál es el resultado
// real de plegarlo. El desarrollo usa SIEMPRE el mismo layout en cruz:
//
//        [ ][T][ ][ ]
//        [L][F][R][B]
//        [ ][Bo][ ][ ]
//
// (T=arriba, L=izquierda, F=central-2/frontal, R=derecha, B=detrás,
// Bo=abajo). Al plegar esta cruz concreta, las tres caras que quedan
// visibles y mutuamente adyacentes en una vista isométrica estándar
// (compartiendo un mismo vértice) son siempre F, T y R — eso es una
// tabla fija, no se recalcula ronda a ronda, solo cambian los colores
// que caen en cada posición. Las caras opuestas por construcción de la
// cruz son: top/bottom, left/right, front/back.
import { pick, shuffle, saveScore } from "./utils.js";

const CARAS = [
  { id: 0, nombre: "Rojo", color: "#e5484d" },
  { id: 1, nombre: "Azul", color: "#2ea3c4" },
  { id: 2, nombre: "Verde", color: "#16a34a" },
  { id: 3, nombre: "Amarillo", color: "#eab308" },
  { id: 4, nombre: "Naranja", color: "#f97316" },
  { id: 5, nombre: "Morado", color: "#8b5cf6" },
];

const POSICIONES = ["top", "left", "front", "right", "back", "bottom"];
const OPUESTA = { top: "bottom", bottom: "top", left: "right", right: "left", front: "back", back: "front" };
// Tabla fija (precalculada a mano): estas 3 posiciones del desarrollo son
// las que se ven a la vez, mutuamente adyacentes, en el cubo plegado.
const SLOTS_VISIBLES = ["top", "front", "right"];

// Reparte las 6 caras al azar por las 6 posiciones de la cruz.
export function generarDesarrollo() {
  const barajadas = shuffle(CARAS);
  const desarrollo = {};
  POSICIONES.forEach((pos, i) => {
    desarrollo[pos] = barajadas[i];
  });
  return desarrollo;
}

// El único cubo plegado coherente con el desarrollo: en sus 3 huecos
// visibles pone exactamente la cara que el desarrollo tiene en top/front/right.
function cuboDesdeDesarrollo(desarrollo) {
  return { top: desarrollo.top, front: desarrollo.front, right: desarrollo.right };
}

function mismoCubo(a, b) {
  return a.top.id === b.top.id && a.front.id === b.front.id && a.right.id === b.right.id;
}

// ¿Es `cubo` el resultado real de plegar `desarrollo`? Compara, hueco a
// hueco (arriba/frontal/derecha), con la única combinación posible.
export function esValido(desarrollo, cubo) {
  return mismoCubo(cubo, cuboDesdeDesarrollo(desarrollo));
}

// Distractor tipo "opuestas": mete en un hueco visible la cara que en el
// desarrollo real queda justo opuesta a esa posición — dos caras que
// nunca pueden verse juntas al plegar.
function generarDistractorOpuesto(desarrollo) {
  const correcto = cuboDesdeDesarrollo(desarrollo);
  const slot = pick(SLOTS_VISIBLES);
  const posOpuesta = OPUESTA[slot];
  const cubo = { ...correcto, [slot]: desarrollo[posOpuesta] };
  return { cubo, motivo: { tipo: "opuestas", a: desarrollo[slot], b: desarrollo[posOpuesta] } };
}

// Distractor tipo "orden": usa las 3 caras correctas (sí quedan juntas)
// pero las coloca en huecos intercambiados, un plegado que esta cruz no
// puede producir.
function generarDistractorOrden(desarrollo) {
  const correcto = cuboDesdeDesarrollo(desarrollo);
  const valores = SLOTS_VISIBLES.map((s) => correcto[s]);
  let mezcla;
  let guard = 0;
  do {
    mezcla = shuffle(valores);
    guard++;
  } while (guard < 30 && SLOTS_VISIBLES.every((s, i) => mezcla[i].id === correcto[s].id));
  const cubo = {};
  SLOTS_VISIBLES.forEach((s, i) => {
    cubo[s] = mezcla[i];
  });
  return { cubo, motivo: { tipo: "orden" } };
}

function generarDistractor(desarrollo) {
  return pick(["opuestas", "orden"]) === "opuestas"
    ? generarDistractorOpuesto(desarrollo)
    : generarDistractorOrden(desarrollo);
}

// 3 opciones (1 correcta + 2 distractores) barajadas, garantizando que
// las tres son distintas entre sí y que solo una es válida.
export function generarOpciones(desarrollo) {
  const correcto = cuboDesdeDesarrollo(desarrollo);
  let d1;
  let d2;
  let guard = 0;
  do {
    d1 = generarDistractor(desarrollo);
    d2 = generarDistractor(desarrollo);
    guard++;
  } while (
    guard < 200 &&
    (mismoCubo(d1.cubo, correcto) || mismoCubo(d2.cubo, correcto) || mismoCubo(d1.cubo, d2.cubo))
  );
  return shuffle([
    { cubo: correcto, motivo: null },
    { cubo: d1.cubo, motivo: d1.motivo },
    { cubo: d2.cubo, motivo: d2.motivo },
  ]);
}

export function mountDesplegableGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let desarrollo = null;
  let opciones = [];
  let locked = false; // evita elegir mientras se resuelve la ronda
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

  function renderNet() {
    const casilla = (pos) =>
      pos
        ? `<div class="dp-net-face" style="background:${desarrollo[pos].color}">${desarrollo[pos].nombre}</div>`
        : `<div class="dp-net-empty"></div>`;
    // Layout fijo en cruz: fila de 4 (izq, frontal, der, detrás) con
    // arriba/abajo colgando de la 2ª casilla de esa fila (la frontal).
    return `
      <div class="dp-net">
        ${casilla(null)}${casilla("top")}${casilla(null)}${casilla(null)}
        ${casilla("left")}${casilla("front")}${casilla("right")}${casilla("back")}
        ${casilla(null)}${casilla("bottom")}${casilla(null)}${casilla(null)}
      </div>
    `;
  }

  function renderCubo(cubo) {
    // Solo se dibujan las 3 caras que se pueden ver a la vez (arriba,
    // frontal y derecha); las otras 3 quedan ocultas tras el cubo.
    return `
      <div class="dp-cube-scene">
        <div class="dp-cube">
          <div class="dp-face dp-face-top" style="background:${cubo.top.color}">${cubo.top.nombre}</div>
          <div class="dp-face dp-face-front" style="background:${cubo.front.color}">${cubo.front.nombre}</div>
          <div class="dp-face dp-face-right" style="background:${cubo.right.color}">${cubo.right.nombre}</div>
        </div>
      </div>
    `;
  }

  function nextRound() {
    desarrollo = generarDesarrollo();
    opciones = generarOpciones(desarrollo);
    locked = false;

    body.innerHTML = `
      <p class="prompt">Así queda el desarrollo de un cubo.<small>Toca el cubo que sale al plegarlo</small></p>
      ${renderNet()}
      <div class="dp-opciones" data-opciones></div>
      <div class="feedback" data-feedback></div>
    `;

    const opcionesEl = body.querySelector("[data-opciones]");
    opciones.forEach((opcion, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dp-cube-btn";
      btn.innerHTML = renderCubo(opcion.cubo);
      btn.addEventListener("click", () => elegir(i));
      opcionesEl.appendChild(btn);
    });
  }

  function elegir(i) {
    if (finished || locked) return;
    locked = true;
    rounds++;
    const opcion = opciones[i];
    const correcto = cuboDesdeDesarrollo(desarrollo);
    const feedback = body.querySelector("[data-feedback]");
    const botones = body.querySelectorAll(".dp-cube-btn");
    botones.forEach((btn, j) => {
      btn.disabled = true;
      if (esValido(desarrollo, opciones[j].cubo)) btn.classList.add("dp-correct");
    });

    if (esValido(desarrollo, opcion.cubo)) {
      score += 10;
      renderScore();
      feedback.textContent = `¡Exacto! Al plegar, arriba queda ${correcto.top.nombre} y a los lados ${correcto.front.nombre} y ${correcto.right.nombre}: las tres se tocan en el mismo vértice del cubo.`;
      feedback.className = "feedback ok";
      later(nextRound, 1300);
    } else {
      botones[i].classList.add("dp-wrong");
      lives--;
      renderLives();
      if (opcion.motivo.tipo === "opuestas") {
        feedback.textContent = `Ese cubo no puede salir de este desarrollo: la cara ${opcion.motivo.a.nombre} y la cara ${opcion.motivo.b.nombre} quedan opuestas al plegar, nunca se ven juntas.`;
      } else {
        feedback.textContent = `Esas tres caras sí quedan juntas al plegar, pero no en ese sitio: arriba va ${correcto.top.nombre}, y a los lados ${correcto.front.nombre} y ${correcto.right.nombre}.`;
      }
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 1700);
      later(nextRound, 1700);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "desplegable", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📦</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} desarrollos plegados</p>
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
