// "Estadísticas de fútbol": el cálculo estadístico (media o mediana) no es
// el objetivo final, es el MEDIO para decidir a qué jugador fichar. Se
// muestran 3 jugadores con sus goles en sus últimos 5 partidos y cada ronda
// sortea si hay que fichar al de mejor MEDIA o al de mejor MEDIANA — el
// jugador tiene que calcular esa estadística de cabeza para los 3 y tocar
// al ganador. Distinto del ejercicio "Media y moda" (id `estadistica`), que
// pregunta directamente "calcula la media de esta lista": aquí la
// estadística es una herramienta de decisión, nunca la pregunta en sí.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

// Banco de jugadores: nombre + emoji distinto para cada uno, así las 3
// tarjetas de una ronda siempre se distinguen a simple vista.
const PLAYERS = [
  { name: "Bruno", emoji: "🧑‍🦱" },
  { name: "Elena", emoji: "👩‍🦰" },
  { name: "Marco", emoji: "🧔" },
  { name: "Nadia", emoji: "👩‍🦱" },
  { name: "Diego", emoji: "👨‍🦲" },
  { name: "Sofía", emoji: "👩‍🦳" },
  { name: "Iván", emoji: "🧑‍🦰" },
  { name: "Carla", emoji: "👱‍♀️" },
  { name: "Rubén", emoji: "👨‍🦱" },
  { name: "Lucía", emoji: "👩‍🦲" },
];

const GAMES_PER_PLAYER = 5;

// Texto con el cálculo completo de la estadística pedida para un jugador,
// listo para el feedback ("Media de Bruno: (2+3+1+4+2)/5 = 2.4" o
// "Mediana de Elena: ordenados 0,1,2,3,4 → el del medio es 2").
function statCalcText(stat, player) {
  if (stat === "media") {
    return `Media de ${player.name}: (${player.goals.join("+")})/5 = ${player.mean.toFixed(1)}`;
  }
  const sorted = [...player.goals].sort((a, b) => a - b);
  return `Mediana de ${player.name}: ordenados ${sorted.join(",")} → el del medio es ${player.median}`;
}

// Genera una ronda completa: 3 jugadores distintos, sus goles en sus
// últimos 5 partidos (0-4 cada uno) y qué estadística se pregunta.
//
// Para decidir el ganador y detectar empates se comparan valores EXACTOS
// (la suma de goles para la media, el valor central ya entero para la
// mediana) en vez de comparar los `mean` decimales directamente — así se
// evita cualquier duda de precisión de coma flotante al comparar medias.
// Si hay empate entre dos o más jugadores en la estadística que toca
// preguntar esa ronda, se regenera toda la ronda (do/while con guarda)
// para que nunca haya ambigüedad sobre quién gana.
export function generateEstadisticasRound() {
  let round = null;
  let guard = 0;
  do {
    guard++;
    if (guard > 1000) {
      throw new Error("No se pudo generar una ronda sin empate tras 1000 intentos");
    }
    const chosen = shuffle(PLAYERS).slice(0, 3);
    const stat = pick(["media", "mediana"]);
    const players = chosen.map((p) => {
      const goals = Array.from({ length: GAMES_PER_PLAYER }, () => randInt(0, 4));
      const sum = goals.reduce((a, b) => a + b, 0);
      const mean = sum / GAMES_PER_PLAYER;
      const sorted = [...goals].sort((a, b) => a - b);
      const median = sorted[Math.floor(GAMES_PER_PLAYER / 2)]; // 5 valores: el del medio es el índice 2
      return { ...p, goals, sum, mean, median };
    });
    const compareValues = players.map((p) => (stat === "media" ? p.sum : p.median));
    const maxValue = Math.max(...compareValues);
    const winnerCount = compareValues.filter((v) => v === maxValue).length;
    if (winnerCount === 1) {
      round = { players, stat, winnerIndex: compareValues.indexOf(maxValue) };
    }
  } while (!round);
  return round;
}

export function mountEstadisticasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false; // evita fichar dos veces mientras se resuelve la ronda
  let round = null;
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
    round = generateEstadisticasRound();
    locked = false;
    const statLabel = round.stat === "media" ? "MEDIA" : "MEDIANA";

    body.innerHTML = `
      <p class="prompt">Ficha al jugador con mejor <strong>${statLabel}</strong> de goles
        <small>Goles marcados en sus últimos 5 partidos</small>
      </p>
      <div class="est-players" data-players></div>
      <div class="feedback" data-feedback></div>
    `;

    const playersEl = body.querySelector("[data-players]");
    const buttons = round.players.map((p) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn est-player-card";
      btn.innerHTML = `
        <div class="est-player-head">
          <span class="est-player-emoji">${p.emoji}</span>
          <span class="est-player-name">${p.name}</span>
        </div>
        <div class="est-goals-row">
          ${p.goals.map((g) => `<span class="est-goal-chip">${g}⚽</span>`).join("")}
        </div>
      `;
      playersEl.appendChild(btn);
      return btn;
    });
    buttons.forEach((btn, i) => {
      btn.addEventListener("click", () => selectChoice(i, btn, buttons));
    });
  }

  function selectChoice(idx, btn, buttons) {
    if (finished || locked) return;
    locked = true;
    buttons.forEach((b) => { b.disabled = true; });

    const feedback = body.querySelector("[data-feedback]");
    const winner = round.players[round.winnerIndex];
    const calc = `${statCalcText(round.stat, winner)}, la más alta.`;

    if (idx === round.winnerIndex) {
      btn.classList.add("correct");
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = `¡Fichaje acertado! ${calc}`;
      feedback.className = "feedback ok";
      later(nextRound, 1500);
      return;
    }

    btn.classList.add("wrong");
    buttons[round.winnerIndex].classList.add("correct");
    lives--;
    renderLives();
    feedback.textContent = `Fichaje equivocado. ${calc}`;
    feedback.className = "feedback bad";
    if (lives <= 0) return later(() => finish(false), 1900);
    later(nextRound, 2100);
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "estadisticas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>⚽</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} fichajes acertados</p>
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
