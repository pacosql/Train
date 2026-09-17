// "Escalas": montar un itinerario de 2-3 vuelos comprobando que el tiempo
// de conexión da. Todo el cálculo se hace en MINUTOS desde medianoche
// (enteros, nunca objetos Date) y ningún vuelo cruza la medianoche.
// La mecánica ES la aritmética del reloj: las tarjetas sólo dicen hora de
// salida y duración, así que para saber si se llega hay que sumar.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const MIN_CONN = 45;        // minutos mínimos de conexión en el aeropuerto
const DAY_START = 6 * 60;   // 06:00
const DAY_END = 23 * 60;    // 23:00 — nada se sale del día

const CITIES = [
  "Madrid", "Roma", "Berlín", "Oslo", "Lisboa", "Viena",
  "Dublín", "Atenas", "Praga", "Zúrich", "París", "Tánger",
];
const AIRLINES = ["IB", "VY", "LH", "AF", "FR", "UX"];

export function fmtHora(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function fmtDur(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

// Cuenta cuántos itinerarios completos cumplen la conexión mínima.
// Es la fuerza bruta que garantiza que la ronda tiene UNA sola solución.
export function countValidItineraries(round) {
  let count = 0;
  const segs = round.segments;
  const walk = (i, prevArr) => {
    if (i === segs.length) { count++; return; }
    for (const o of segs[i].options) {
      if (prevArr !== null && o.dep - prevArr < MIN_CONN) continue;
      walk(i + 1, o.dep + o.dur);
    }
  };
  walk(0, null);
  return count;
}

// Itinerario de emergencia (válido y único) si la guarda se agotara.
function fallbackRound() {
  const segments = [
    {
      from: "Madrid", to: "Zúrich",
      options: [
        { dep: 8 * 60, dur: 120, ok: true, code: "IB 314" },
        { dep: 9 * 60 + 40, dur: 120, ok: false, code: "VY 220" },
      ],
    },
    {
      from: "Zúrich", to: "Praga",
      options: [
        { dep: 11 * 60 + 30, dur: 95, ok: true, code: "LH 508" },
        { dep: 10 * 60 + 20, dur: 95, ok: false, code: "AF 771" },
      ],
    },
  ];
  return { from: "Madrid", to: "Praga", segments, minConn: MIN_CONN };
}

function tryRound(segCount, optCount) {
  const path = shuffle(CITIES).slice(0, segCount + 1);
  const durs = [];
  const gaps = [];
  for (let i = 0; i < segCount; i++) durs.push(randInt(9, 30) * 5);      // 45..150 min
  for (let i = 0; i < segCount - 1; i++) gaps.push(randInt(10, 30) * 5); // 50..150 min
  const total = durs.reduce((a, b) => a + b, 0) + gaps.reduce((a, b) => a + b, 0);
  if (DAY_START + total > DAY_END) return null;

  // Primero el itinerario VÁLIDO, encadenado de verdad.
  const dep0 = randInt(DAY_START / 5, (DAY_END - total) / 5) * 5;
  const valid = [];
  let t = dep0;
  for (let i = 0; i < segCount; i++) {
    valid.push({ dep: t, dur: durs[i] });
    t += durs[i];
    if (i < segCount - 1) t += gaps[i];
  }

  // Después los señuelos, construidos para que NINGUNA combinación cuadre:
  // en el primer tramo llegan demasiado tarde, en los siguientes salen
  // antes de que se pueda llegar.
  const segments = [];
  for (let i = 0; i < segCount; i++) {
    const opts = [{ dep: valid[i].dep, dur: valid[i].dur, ok: true }];
    let guard = 0;
    while (opts.length < optCount && guard++ < 60) {
      const d = randInt(9, 30) * 5;
      let dep;
      if (i === 0) {
        const late = (gaps[0] - MIN_CONN) + randInt(1, 12) * 5;
        dep = valid[0].dep + late + (durs[0] - d);
      } else {
        const early = (gaps[i - 1] - MIN_CONN) + randInt(1, 12) * 5;
        dep = valid[i].dep - early;
      }
      if (dep < DAY_START || dep + d > DAY_END) continue;
      if (opts.some((o) => o.dep === dep || o.dep + o.dur === dep + d)) continue;
      opts.push({ dep, dur: d, ok: false });
    }
    if (opts.length < optCount) return null;
    segments.push({
      from: path[i],
      to: path[i + 1],
      options: shuffle(opts).map((o) => ({ ...o, code: `${pick(AIRLINES)} ${randInt(100, 989)}` })),
    });
  }
  return { from: path[0], to: path[segCount], segments, minConn: MIN_CONN };
}

// La dificultad sube con la racha: más tramos y más señuelos por tramo.
export function makeEscalasRound(streak) {
  const segCount = streak >= 4 ? 3 : (streak >= 2 ? pick([2, 3]) : 2);
  const optCount = streak >= 3 ? 3 : 2;
  let guard = 0;
  while (guard++ < 400) {
    const round = tryRound(segCount, optCount);
    if (round && countValidItineraries(round) === 1) return round;
  }
  return fallbackRound();
}

export function mountEscalasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let round = null;
  let chosen = [];      // índice elegido en cada tramo (-1 = sin elegir)
  let locked = false;
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
    round = makeEscalasRound(streak);
    chosen = round.segments.map(() => -1);
    locked = false;

    body.innerHTML = `
      <div class="es-wrap">
        <p class="prompt es-prompt">✈️ ${round.from} → ${round.to}
          <small>Elige un vuelo de cada tramo. Conexión mínima ${MIN_CONN} min.
          Las tarjetas dan la salida y lo que dura: la llegada la sumas tú.</small></p>
        <div class="es-segs" data-segs></div>
        <div class="es-tl" data-tl></div>
        <div class="feedback" data-feedback></div>
        <button class="primary es-go" data-go disabled>Confirmar itinerario</button>
      </div>
    `;

    const segsEl = body.querySelector("[data-segs]");
    round.segments.forEach((seg, si) => {
      const block = document.createElement("div");
      block.className = "es-seg";
      block.innerHTML = `<div class="es-seg-head"><b>${si + 1}</b> ${seg.from} → ${seg.to}</div>
        <div class="es-seg-opts" data-opts></div>`;
      const optsEl = block.querySelector("[data-opts]");
      seg.options.forEach((opt, oi) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn es-card";
        btn.type = "button";
        btn.innerHTML = `<span class="es-code">${opt.code}</span>
          <b class="es-dep">${fmtHora(opt.dep)}</b>
          <small class="es-dur">vuela ${fmtDur(opt.dur)}</small>`;
        btn.addEventListener("click", () => choose(si, oi));
        optsEl.appendChild(btn);
      });
      segsEl.appendChild(block);
    });
    renderCards();
    renderTimeline(null);
  }

  function renderCards() {
    const blocks = body.querySelectorAll(".es-seg");
    blocks.forEach((block, si) => {
      block.querySelectorAll(".es-card").forEach((btn, oi) => {
        btn.classList.toggle("es-sel", chosen[si] === oi);
        btn.disabled = locked;
      });
    });
    const go = body.querySelector("[data-go]");
    if (go) go.disabled = locked || chosen.some((c) => c < 0);
  }

  // La línea de tiempo coloca los vuelos elegidos a escala: el hueco entre
  // barras se VE. Los minutos del hueco sólo se escriben al confirmar.
  function renderTimeline(result) {
    const tl = body.querySelector("[data-tl]");
    if (!tl) return;
    let min = Infinity;
    let max = -Infinity;
    round.segments.forEach((seg) => seg.options.forEach((o) => {
      min = Math.min(min, o.dep);
      max = Math.max(max, o.dep + o.dur);
    }));
    const span = Math.max(max - min, 1);
    let html = "";
    round.segments.forEach((seg, si) => {
      if (si > 0) {
        let cls = "es-tl-gap";
        let text = "⏱ hueco · · · ·";
        if (result) {
          const g = result.gaps[si - 1];
          const okGap = g >= MIN_CONN;
          cls += okGap ? " ok" : " bad";
          text = okGap
            ? `⏱ hueco de ${g} min en ${seg.from} ✔`
            : `⏱ sólo ${g} min en ${seg.from} — hacen falta ${MIN_CONN}`;
        }
        html += `<div class="${cls}">${text}</div>`;
      }
      const oi = chosen[si];
      if (oi < 0) {
        html += `<div class="es-tl-row"><span class="es-tl-tag">${si + 1}</span>
          <div class="es-tl-track"><div class="es-tl-empty">elige un vuelo</div></div></div>`;
      } else {
        const o = seg.options[oi];
        const left = ((o.dep - min) / span) * 100;
        const width = Math.max((o.dur / span) * 100, 8);
        const bad = result && !result.legOk[si];
        html += `<div class="es-tl-row"><span class="es-tl-tag">${si + 1}</span>
          <div class="es-tl-track">
            <div class="es-tl-bar${bad ? " bad" : ""}" style="left:${left}%;width:${Math.min(width, 100 - left)}%">
              <span class="es-tl-dep">${fmtHora(o.dep)}</span>
              ${result ? `<span class="es-tl-arr">${fmtHora(o.dep + o.dur)}</span>` : ""}
            </div>
          </div></div>`;
      }
    });
    tl.innerHTML = html;
  }

  function choose(si, oi) {
    if (finished || locked) return;
    chosen[si] = chosen[si] === oi ? -1 : oi;
    renderCards();
    renderTimeline(null);
    const feedback = body.querySelector("[data-feedback]");
    feedback.textContent = "";
    feedback.className = "feedback";
  }

  function check() {
    if (finished || locked || chosen.some((c) => c < 0)) return;
    const legs = round.segments.map((seg, si) => seg.options[chosen[si]]);
    const gaps = [];
    const legOk = legs.map(() => true);
    let firstBad = -1;
    for (let i = 1; i < legs.length; i++) {
      const g = legs[i].dep - (legs[i - 1].dep + legs[i - 1].dur);
      gaps.push(g);
      if (g < MIN_CONN && firstBad < 0) {
        firstBad = i;
        legOk[i] = false;
        legOk[i - 1] = false;
      }
    }
    const result = { gaps, legOk };
    locked = true;
    rounds++;
    renderCards();
    renderTimeline(result);
    const feedback = body.querySelector("[data-feedback]");

    if (firstBad < 0) {
      score += 10;
      streak++;
      renderScore();
      feedback.textContent = "¡Itinerario que encaja! Llegas a las " +
        fmtHora(legs[legs.length - 1].dep + legs[legs.length - 1].dur);
      feedback.className = "feedback ok";
      later(nextRound, 1400);
      return;
    }

    // Al fallar se explica el POR QUÉ: qué hora llegabas, a qué hora salía
    // el siguiente y cuántos minutos tenías de verdad.
    streak = 0;
    lives--;
    renderLives();
    const prev = legs[firstBad - 1];
    const next = legs[firstBad];
    const arr = prev.dep + prev.dur;
    const g = gaps[firstBad - 1];
    feedback.innerHTML = `Llegabas a ${round.segments[firstBad].from} a las ${fmtHora(arr)}
      y el vuelo salía a las ${fmtHora(next.dep)}:
      ${g < 0 ? `salía ${-g} min <b>antes</b> de que aterrizaras` : `sólo <b>${g} min</b> de conexión (hacen falta ${MIN_CONN})`}.`;
    feedback.className = "feedback bad";
    // Y se marca en verde el itinerario que sí cuadraba.
    body.querySelectorAll(".es-seg").forEach((block, si) => {
      block.querySelectorAll(".es-card").forEach((btn, oi) => {
        if (round.segments[si].options[oi].ok) btn.classList.add("correct");
      });
    });
    if (lives <= 0) return later(() => finish(false), 2600);
    later(nextRound, 2600);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "escalas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🛫</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} itinerarios montados</p>
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

  // Un solo listener delegado para el botón de confirmar, que se repinta
  // en cada ronda.
  body.addEventListener("click", (ev) => {
    if (ev.target.closest("[data-go]")) check();
  });

  start();
  return () => {
    finished = true;
    timers.forEach(clearTimeout);
  };
}
