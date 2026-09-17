// "El horario de trenes": lee una tabla de horarios (estaciones x trenes,
// todos con el mismo recorrido y las mismas duraciones de tramo, solo
// cambia la hora de salida de cada uno) y responde tres tipos de
// pregunta sobre ella, al estilo del clásico "NRICH Train Timetable".
import { randInt, pick, shuffle, clamp, saveScore } from "./utils.js";

const STATION_POOL = [
  "Central", "Norte", "Sur", "Este", "Oeste",
  "Playa", "Bosque", "Mercado", "Universidad", "Puerto",
];
const TRAIN_LETTERS = ["A", "B", "C", "D"];
const TRAIN_EMOJIS = ["🚆", "🚄", "🚅", "🚈"];

function formatHM(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Construye un horario coherente: 3-4 estaciones, 3-4 trenes que hacen la
// misma ruta con las mismas duraciones de tramo (así ningún tren adelanta
// a otro), cada uno con su propia hora de salida. Todo el día cae dentro
// de 05:00-23:59.
export function buildSchedule() {
  const numStations = randInt(3, 4);
  const numTrains = randInt(3, 4);
  const stationNames = shuffle(STATION_POOL).slice(0, numStations);

  const legDurations = [];
  for (let i = 0; i < numStations - 1; i++) legDurations.push(randInt(4, 20));
  const cumulative = [0];
  for (let i = 0; i < legDurations.length; i++) cumulative.push(cumulative[i] + legDurations[i]);
  const totalDuration = cumulative[cumulative.length - 1];

  const gaps = [];
  for (let i = 0; i < numTrains - 1; i++) gaps.push(randInt(8, 30));
  const offsets = [0];
  for (let i = 0; i < gaps.length; i++) offsets.push(offsets[i] + gaps[i]);
  const maxOffset = offsets[offsets.length - 1];

  const earliestBase = 5 * 60 + 20; // 05:20 — deja margen para la espera del tipo 3
  const latestBase = 23 * 60 + 59 - totalDuration - maxOffset;
  const base = randInt(earliestBase, Math.max(earliestBase, latestBase));

  // times[trenIdx][estacionIdx] en minutos desde medianoche.
  const times = [];
  for (let t = 0; t < numTrains; t++) {
    const dep = base + offsets[t];
    times.push(cumulative.map((c) => dep + c));
  }

  const trains = [];
  for (let t = 0; t < numTrains; t++) {
    trains.push({ letter: TRAIN_LETTERS[t], emoji: TRAIN_EMOJIS[t], name: `Tren ${TRAIN_LETTERS[t]}` });
  }

  return { stationNames, trains, times, legDurations };
}

// Genera una ronda completa: el horario y una pregunta sorteada entre los
// 3 tipos. Exportada aparte para poder simularla en Node sin montar DOM.
export function generateHorarioRound() {
  const type = pick(["read", "limit", "wait"]);
  const schedule = buildSchedule();
  const { stationNames, trains, times } = schedule;
  const numStations = stationNames.length;
  const numTrains = trains.length;

  if (type === "read") {
    const trainIdx = randInt(0, numTrains - 1);
    const stationIdx = randInt(0, numStations - 1);
    return {
      type,
      schedule,
      trainIdx,
      stationIdx,
      answer: formatHM(times[trainIdx][stationIdx]),
      blank: { trainIdx, stationIdx },
    };
  }

  if (type === "limit") {
    const stationIdx = randInt(0, numStations - 1);
    // Los trenes están generados en orden de salida creciente, y como
    // todos comparten las mismas duraciones de tramo, las llegadas a
    // CUALQUIER estación conservan ese mismo orden creciente sin empates
    // posibles (cada tren mantiene su desfase constante frente a los
    // demás). Por eso basta con elegir un tren k y poner el límite justo
    // por encima de su llegada, sin poder alcanzar la del siguiente.
    const k = randInt(0, numTrains - 1);
    const arrivals = times.map((row) => row[stationIdx]);
    const baseArrival = arrivals[k];
    const nextGap = k < numTrains - 1 ? arrivals[k + 1] - baseArrival : Infinity;
    const roomToMidnight = 1439 - baseArrival;
    const maxOffset = Math.max(0, Math.min(nextGap - 1, roomToMidnight, 15));
    const offset = randInt(0, maxOffset);
    const limitMinutes = baseArrival + offset;
    return {
      type,
      schedule,
      stationIdx,
      limitMinutes,
      limitLabel: formatHM(limitMinutes),
      answerTrainIdx: k,
    };
  }

  // wait: subir en una estación que no sea la última (si no, no hay
  // trayecto que esperar) y calcular una espera siempre positiva.
  const stationIdx = randInt(0, numStations - 2);
  const trainIdx = randInt(0, numTrains - 1);
  const trainTime = times[trainIdx][stationIdx];
  const waitMax = clamp(trainTime - 5 * 60, 1, 30);
  const waitMinutes = randInt(1, waitMax);
  const platformMinutes = trainTime - waitMinutes;
  return {
    type,
    schedule,
    stationIdx,
    trainIdx,
    platformLabel: formatHM(platformMinutes),
    answerWait: waitMinutes,
  };
}

function renderTableHTML(schedule, blank) {
  const { stationNames, trains, times } = schedule;
  const header =
    `<th class="hr-corner"></th>` +
    trains.map((tr) => `<th class="hr-head">${tr.emoji}<br>${tr.name}</th>`).join("");
  const rows = stationNames
    .map((name, sIdx) => {
      const cells = trains
        .map((tr, tIdx) => {
          const isBlank = blank && blank.trainIdx === tIdx && blank.stationIdx === sIdx;
          const label = isBlank ? `<span class="hr-blank">?</span>` : formatHM(times[tIdx][sIdx]);
          return `<td class="hr-cell${isBlank ? " hr-cell-blank" : ""}">${label}</td>`;
        })
        .join("");
      return `<tr><th class="hr-station">${name}</th>${cells}</tr>`;
    })
    .join("");
  return `<table class="hr-table"><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table>`;
}

export function mountHorarioGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false; // evita responder mientras se resuelve la ronda
  let round = null;
  let typedTime = "";
  let typedWait = "";
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

  function digitAllowedForTime(key) {
    const pos = typedTime.length;
    const d = Number(key);
    if (pos === 0) return d <= 2; // decena de la hora: 00-23
    if (pos === 1) {
      const first = Number(typedTime[0]);
      return first === 2 ? d <= 3 : true;
    }
    if (pos === 2) return d <= 5; // decena de los minutos: 00-59
    return true;
  }

  function updateTimeDisplay(el) {
    const chars = typedTime.padEnd(4, "_").split("");
    el.querySelector("[data-time-display]").textContent = `${chars[0]}${chars[1]}:${chars[2]}${chars[3]}`;
  }

  function renderTimeKeypad(el) {
    typedTime = "";
    el.innerHTML = `
      <div class="keypad-display" data-time-display>__:__</div>
      <div class="keypad" data-time-keypad></div>
    `;
    const pad = el.querySelector("[data-time-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn keypad-key";
      btn.type = "button";
      btn.textContent = key;
      if (key === "⌫") {
        btn.addEventListener("click", () => {
          if (finished || locked) return;
          typedTime = typedTime.slice(0, -1);
          updateTimeDisplay(el);
        });
      } else if (key === "✓") {
        btn.addEventListener("click", () => submitTimeAnswer());
      } else {
        btn.addEventListener("click", () => {
          if (finished || locked) return;
          if (typedTime.length >= 4) return;
          if (!digitAllowedForTime(key)) return;
          typedTime += key;
          updateTimeDisplay(el);
        });
      }
      pad.appendChild(btn);
    });
    updateTimeDisplay(el);
  }

  function submitTimeAnswer() {
    if (finished || locked || typedTime.length < 4) return;
    const guess = `${typedTime.slice(0, 2)}:${typedTime.slice(2, 4)}`;
    evaluate(guess === round.answer, `La hora correcta era ${round.answer}.`);
  }

  function renderTrainChoices(el, trains) {
    el.innerHTML = `<div class="choices hr-train-choices"></div>`;
    const wrap = el.querySelector(".hr-train-choices");
    trains.forEach((tr, idx) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.type = "button";
      btn.textContent = `${tr.emoji} ${tr.name}`;
      btn.addEventListener("click", () => {
        if (finished || locked) return;
        const correctTrain = trains[round.answerTrainIdx];
        evaluate(idx === round.answerTrainIdx, `El tren correcto era ${correctTrain.emoji} ${correctTrain.name}.`);
      });
      wrap.appendChild(btn);
    });
  }

  function updateWaitDisplay(el) {
    el.querySelector("[data-wait-display]").textContent = typedWait ? `${typedWait} min` : " ";
  }

  function renderMinuteKeypad(el) {
    typedWait = "";
    el.innerHTML = `
      <div class="keypad-display" data-wait-display>&nbsp;</div>
      <div class="keypad" data-wait-keypad></div>
    `;
    const pad = el.querySelector("[data-wait-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn keypad-key";
      btn.type = "button";
      btn.textContent = key;
      if (key === "⌫") {
        btn.addEventListener("click", () => {
          if (finished || locked) return;
          typedWait = typedWait.slice(0, -1);
          updateWaitDisplay(el);
        });
      } else if (key === "✓") {
        btn.addEventListener("click", () => submitWaitAnswer());
      } else {
        btn.addEventListener("click", () => {
          if (finished || locked) return;
          if (typedWait.length >= 2) return;
          typedWait += key;
          updateWaitDisplay(el);
        });
      }
      pad.appendChild(btn);
    });
    updateWaitDisplay(el);
  }

  function submitWaitAnswer() {
    if (finished || locked || typedWait === "") return;
    const guess = Number(typedWait);
    evaluate(guess === round.answerWait, `Tenías que esperar ${round.answerWait} minutos.`);
  }

  function evaluate(isCorrect, wrongMessage) {
    if (finished || locked) return;
    locked = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    if (isCorrect) {
      score += 10;
      renderScore();
      feedback.textContent = "¡Correcto!";
      feedback.className = "feedback ok";
      later(nextRound, 1100);
      return;
    }
    lives--;
    renderLives();
    feedback.textContent = `Incorrecto. ${wrongMessage}`;
    feedback.className = "feedback bad";
    if (lives <= 0) return later(() => finish(false), 1300);
    later(nextRound, 1700);
  }

  function nextRound() {
    round = generateHorarioRound();
    locked = false;
    const { schedule, type } = round;

    let promptText;
    let promptSmall;
    if (type === "read") {
      const trainName = schedule.trains[round.trainIdx].name;
      const stationName = schedule.stationNames[round.stationIdx];
      promptText = `¿A qué hora llega el ${trainName} a ${stationName}?`;
      promptSmall = "Falta un dato en la tabla — míralo con atención.";
    } else if (type === "limit") {
      const stationName = schedule.stationNames[round.stationIdx];
      promptText = `Quieres estar en ${stationName} como muy tarde a las ${round.limitLabel} — ¿qué tren coges?`;
      promptSmall = "Elige el tren que llegue más tarde sin pasarse de esa hora.";
    } else {
      const trainName = schedule.trains[round.trainIdx].name;
      const stationName = schedule.stationNames[round.stationIdx];
      promptText = `Vas a tomar el ${trainName} en ${stationName}. Llegas al andén a las ${round.platformLabel} — ¿cuántos minutos esperas?`;
      promptSmall = "Calcula la diferencia con la salida real del tren en esa estación.";
    }

    const tableHTML = renderTableHTML(schedule, type === "read" ? round.blank : null);

    body.innerHTML = `
      <p class="prompt">${promptText}<small>${promptSmall}</small></p>
      <div class="hr-table-scroll">${tableHTML}</div>
      <div class="hr-answer" data-answer></div>
      <div class="feedback" data-feedback></div>
    `;

    const answerEl = body.querySelector("[data-answer]");
    if (type === "read") {
      renderTimeKeypad(answerEl);
    } else if (type === "limit") {
      renderTrainChoices(answerEl, schedule.trains);
    } else {
      renderMinuteKeypad(answerEl);
    }
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "horario", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🚉</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} horarios resueltos</p>
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
