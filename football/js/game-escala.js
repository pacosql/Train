// __BUILD_ID__
// "La escala del mapa": leer una escala gráfica (una barra graduada que
// representa una distancia real conocida) y usarla para calcular la
// distancia real entre dos puntos A y B, contando las marcas de una
// misma cuadrícula — igual que se cuentan cuadros en papel cuadriculado,
// sin necesitar medir con una regla física.
import { randInt, pick, clamp, saveScore } from "./utils.js";

const SCALES = [10, 20, 25, 50, 100]; // km que representa la barra de escala completa

// Distancia real (km) que representan M marcas de mapa cuando N marcas
// de esa misma cuadrícula equivalen a R km. Función pura, sin
// aleatoriedad ni DOM: (M/N) partes de la escala completa R.
export function distanciaReal(R, N, M) {
  const km = (M / N) * R;
  return Math.round(km * 100) / 100;
}

// Sortea una ronda completa: R (km de la escala), N (marcas de la barra
// de escala, 2 a 5) y M (marcas del segmento A-B). M es siempre un
// múltiplo de N/4 -mismo truco que usar "cuartos de cuadro"- entre N/2
// y N*4 marcas, así el mapa nunca cabe en menos de media escala ni en
// más de cuatro escalas completas, y (M/N)*R sale siempre con como
// mucho 2 decimales limpios (M/N = k/4 con k entero).
function generarRonda() {
  const R = pick(SCALES);
  const N = randInt(2, 5);
  const k = randInt(2, 16); // M = k * (N/4) marcas
  const M = Math.round(((k * N) / 4) * 100) / 100;
  const km = distanciaReal(R, N, M);
  return { R, N, M, km };
}

// Formatea un número quitando ceros/decimales sobrantes y con coma
// decimal (convención española), p. ej. 12.50 -> "12,5", 6 -> "6".
function formatKm(n) {
  let s = n.toFixed(2);
  while (s.endsWith("0")) s = s.slice(0, -1);
  if (s.endsWith(".")) s = s.slice(0, -1);
  return s.replace(".", ",");
}

// Ancho útil del panel de medida en píxeles (cabe de sobra en 400px de
// pantalla con márgenes); cada ronda calcula su propio "px por cuarto de
// marca" para que la escala y el mapa quepan siempre con la misma
// cuadrícula, por pequeña o grande que sea la diferencia entre ambos.
const TRACK_BUDGET_PX = 260;
const MIN_QPX = 6;
const MAX_QPX = 34;

function quarterPx(scaleQuarters, mapQuarters) {
  const maxQuarters = Math.max(scaleQuarters, mapQuarters, 1);
  return clamp(Math.floor(TRACK_BUDGET_PX / maxQuarters), MIN_QPX, MAX_QPX);
}

// Dibuja las marcas de una regla: una raya por cada cuarto de marca,
// más gruesa (mayor) cada 4 cuartos = 1 marca entera; opcionalmente
// numera las marcas enteras (se usa en la barra de escala, no en el
// segmento del mapa, que hay que contar a ojo).
function buildTicks(totalQuarters, qpx, withLabels) {
  let html = "";
  for (let i = 0; i <= totalQuarters; i++) {
    const major = i % 4 === 0;
    html += `<span class="es2-tick${major ? " es2-tick-major" : ""}" style="left:${i * qpx}px"></span>`;
    if (withLabels && major) {
      html += `<span class="es2-tick-label" style="left:${i * qpx}px">${i / 4}</span>`;
    }
  }
  return html;
}

export function mountEscalaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let typed = "";
  let locked = false;
  let displayEl;
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

  function nextRound() {
    round = generarRonda();
    typed = "";
    locked = false;
    const scaleQuarters = round.N * 4;
    const mapQuarters = Math.round(round.M * 4);
    const qpx = quarterPx(scaleQuarters, mapQuarters);

    body.innerHTML = `
      <p class="prompt">¿Qué distancia real hay entre A y B?<small>Cuenta las marcas de la cuadrícula: son la misma unidad en la escala y en el mapa</small></p>
      <div class="es2-board" data-board>
        <div class="es2-scalebox">
          <div class="es2-box-label">📏 Escala del mapa</div>
          <div class="es2-track-scroll"><div class="es2-track" style="width:${scaleQuarters * qpx}px">
            <div class="es2-ruler-line"></div>
            ${buildTicks(scaleQuarters, qpx, true)}
          </div></div>
          <div class="es2-scale-caption">${round.N} marca${round.N === 1 ? "" : "s"} de la cuadrícula = <b>${round.R} km</b> reales</div>
        </div>
        <div class="es2-mapbox">
          <div class="es2-box-label">🗾 Mapa</div>
          <div class="es2-map-row">
            <span class="es2-point">📍<b>A</b></span>
            <div class="es2-track-scroll"><div class="es2-track es2-track-map" style="width:${mapQuarters * qpx}px">
              <div class="es2-ruler-line"></div>
              ${buildTicks(mapQuarters, qpx, false)}
            </div></div>
            <span class="es2-point">📍<b>B</b></span>
          </div>
        </div>
      </div>
      <div class="es2-display-row">
        <div class="keypad-display" data-display>&nbsp;</div>
        <button type="button" class="choice-btn es2-comma-btn" data-comma>,</button>
      </div>
      <div class="keypad" data-keypad></div>
      <div class="feedback" data-feedback></div>
    `;

    displayEl = body.querySelector("[data-display]");
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn keypad-key";
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
    body.querySelector("[data-comma]").addEventListener("click", () => pressKey(","));
  }

  function pressKey(key) {
    if (finished || locked) return;
    if (key === "⌫") {
      typed = typed.slice(0, -1);
    } else if (key === "✓") {
      return submit();
    } else if (key === ",") {
      if (typed.length === 0 || typed.includes(",")) return;
      typed += ",";
    } else if (typed.replace(",", "").length < 5) {
      typed += key;
    }
    displayEl.textContent = typed ? `${typed} km` : " ";
  }

  function submit() {
    if (finished || locked || typed === "" || typed === ",") return;
    locked = true;
    rounds++;
    const { R, N, M, km } = round;
    const value = Math.round(Number(typed.replace(",", ".")) * 100) / 100;
    const feedback = body.querySelector("[data-feedback]");
    const perMark = Math.round((R / N) * 100) / 100;
    const exactPerMark = Math.abs(perMark * N - R) < 1e-9;
    const eq = exactPerMark ? "=" : "≈";
    if (Math.abs(value - km) < 0.005) {
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! ${formatKm(M)} marcas × ${formatKm(perMark)} km/marca ${eq} ${formatKm(km)} km.`;
      feedback.className = "feedback ok";
      later(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `La escala dice que las ${N} marcas son ${R} km (cada marca ${eq} ${formatKm(perMark)} km); el mapa mide ${formatKm(M)} marcas, así que la distancia real es ${formatKm(M)} × ${formatKm(perMark)} ${eq} ${formatKm(km)} km.`;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 1600);
      later(nextRound, 1600);
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
    saveScore(client, "escala", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🗾</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} distancias calculadas</p>
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
