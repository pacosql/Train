// "Calendario": dos rondas manipulativas sobre un mes REAL (año, mes y
// días de verdad). Antes era mitad búsqueda visual ("toca el tercer
// martes") y mitad resta disfrazada ("¿cuántos días del 4 al 17?", que se
// respondía sin mirar el calendario). Ahora el dedo hace la aritmética:
//   1) "Coloca el 1": dado el día de la semana de una fecha del mes, hay
//      que colocar la ficha del día 1 en su columna. Eso es módulo 7:
//      quitar semanas completas y retroceder los días que sobran.
//   2) "Planifica los ensayos": marcar en la rejilla todos los días de un
//      evento que se repite cada N días. Contar de N en N sobre siete
//      columnas es donde se ve el patrón (la diagonal del calendario).
// Todas las fechas se construyen con Date.UTC para que ninguna zona
// horaria mueva un día.
import { randInt, pick, saveScore } from "./utils.js";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
// Semana que empieza en lunes (como en España), no en domingo.
const DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const DIAS_CORTOS = ["L", "M", "X", "J", "V", "S", "D"];
// Se incluye 2024 a propósito: es bisiesto, así febrero sale de 28 y de 29.
const ANIOS = [2024, 2025, 2026, 2027];
// La pista se aleja del día 1 según la racha: cuanto más lejos, más
// semanas completas hay que descontar antes de retroceder columnas.
const MIN_PISTA = [9, 13, 17];
// Paso del evento que se repite: pasos cortos = más ensayos que contar.
const RANGO_PASO = [[8, 12], [6, 12], [4, 12]];
const MIN_MARCAS = 3;
const MAX_MARCAS = 6;

function diasDelMes(anio, mes) {
  // Día 0 del mes siguiente = último día de este mes.
  return new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
}

// Columna de la rejilla (lunes = 0); Date.getUTCDay() usa domingo = 0.
function columna(anio, mes, dia) {
  return (new Date(Date.UTC(anio, mes, dia)).getUTCDay() + 6) % 7;
}

// Genera la ronda entera. Se exporta para que el script de simulación
// pruebe exactamente los mismos números que corren en el juego.
export function buildRondaCalendario(modo, nivel) {
  const anio = pick(ANIOS);
  const mes = randInt(0, 11);
  const dias = diasDelMes(anio, mes);
  const col1 = columna(anio, mes, 1);

  if (modo === "columna") {
    // Se descarta la pista que cae en la misma columna que el 1: ahí no
    // habría nada que contar (la respuesta sería "la misma columna").
    let pista = 0;
    let guard = 0;
    do {
      pista = randInt(MIN_PISTA[nivel], dias);
      guard++;
    } while ((pista - 1) % 7 === 0 && guard < 200);
    return {
      modo, anio, mes, dias, col1, pista, guard,
      colPista: columna(anio, mes, pista),
      semanas: Math.floor((pista - 1) / 7),
      resto: (pista - 1) % 7,
    };
  }

  // Paso múltiplo de 7 fuera: repetiría siempre la misma columna y se
  // resolvería mirando, no contando. Y entre 3 y 6 marcas: menos no es un
  // patrón y más se vuelve tedioso con el pulgar.
  let paso = 0;
  let inicio = 0;
  let objetivo = [];
  let guard = 0;
  const [pmin, pmax] = RANGO_PASO[nivel];
  do {
    paso = randInt(pmin, pmax);
    inicio = randInt(1, 12);
    objetivo = [];
    for (let d = inicio; d <= dias; d += paso) objetivo.push(d);
    guard++;
  } while (
    (paso % 7 === 0 || objetivo.length < MIN_MARCAS || objetivo.length > MAX_MARCAS) &&
    guard < 400
  );
  return { modo, anio, mes, dias, col1, paso, inicio, objetivo, guard };
}

export function mountCalendarioGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let roundIndex = 0;
  let finished = false;
  let locked = false;
  let timers = [];
  let ronda = null;
  let eleccion = -1; // columna elegida en el modo "columna"
  let marcados = new Set(); // días marcados en el modo "planifica"

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
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }
  function nivelActual() {
    return Math.min(Math.floor(streak / 2), MIN_PISTA.length - 1);
  }

  function cabeceraHTML() {
    return DIAS_CORTOS
      .map((d, i) => `<div class="cl-head${i > 4 ? " cl-weekend" : ""}">${d}</div>`)
      .join("");
  }

  // Rejilla del mes con el día 1 en la columna `col`. `col` es parámetro
  // (y no siempre el real) porque al fallar se enseña también el mes que
  // habría salido con la columna elegida.
  function rejillaHTML(col, opts) {
    const o = opts || {};
    const marcas = o.marcas || new Set();
    const buenos = o.buenos || [];
    const malos = o.malos || [];
    let celdas = "";
    for (let i = 0; i < col; i++) celdas += `<div class="cl-cell cl-empty"></div>`;
    for (let d = 1; d <= ronda.dias; d++) {
      const clases = ["cl-cell", "cl-day"];
      if (marcas.has(d)) clases.push("cl-mark");
      if (buenos.includes(d)) clases.push("cl-ok");
      if (malos.includes(d)) clases.push("cl-bad");
      if (o.destacado === d) clases.push("cl-hl");
      const fijo = d === ronda.inicio ? " cl-fixed" : "";
      celdas += o.interactivo && d !== ronda.inicio
        ? `<button class="${clases.join(" ")}" type="button" data-day="${d}">${d}</button>`
        : `<div class="${clases.join(" ")}${fijo}">${d}</div>`;
    }
    return `<div class="cl-grid">${cabeceraHTML()}${celdas}</div>`;
  }

  function cadenaHTML() {
    return ronda.objetivo.join(" → ");
  }

  function nextRound() {
    if (finished) return;
    const modo = roundIndex % 2 === 0 ? "columna" : "planifica";
    roundIndex++;
    ronda = buildRondaCalendario(modo, nivelActual());
    locked = false;
    eleccion = -1;
    marcados = new Set();

    if (modo === "columna") {
      body.innerHTML = `
        <div class="cl-wrap">
          <p class="prompt cl-prompt">El <b>${ronda.pista}</b> de ${MESES[ronda.mes]} de ${ronda.anio}
            es <b>${DIAS[ronda.colPista]}</b><small>¿En qué columna empieza el mes? Coloca ahí la ficha del 1</small></p>
          <div class="cl-month"><span>${MESES[ronda.mes]}</span> ${ronda.anio} · ${ronda.dias} días</div>
          <div class="cl-board" data-board>
            <div class="cl-grid">
              ${cabeceraHTML()}
              ${DIAS_CORTOS.map((_, i) => `<button class="cl-cell cl-slot" type="button" data-col="${i}">·</button>`).join("")}
            </div>
          </div>
          <div class="cl-note" data-note>Quita las semanas completas y retrocede lo que sobre.</div>
          <button class="primary cl-confirm" data-confirm disabled>Montar el mes</button>
          <div class="feedback" data-feedback></div>
        </div>
      `;
      const board = body.querySelector("[data-board]");
      board.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-col]");
        if (!btn || finished || locked) return;
        eleccion = Number(btn.dataset.col);
        board.querySelectorAll("[data-col]").forEach((b) => {
          const puesto = Number(b.dataset.col) === eleccion;
          b.classList.toggle("cl-chip", puesto);
          b.textContent = puesto ? "1" : "·";
        });
        body.querySelector("[data-confirm]").disabled = false;
      });
      body.querySelector("[data-confirm]").addEventListener("click", resolverColumna);
      return;
    }

    marcados = new Set([ronda.inicio]);
    body.innerHTML = `
      <div class="cl-wrap">
        <p class="prompt cl-prompt">Ensayo el día <b>${ronda.inicio}</b>, y luego <b>cada ${ronda.paso} días</b><small>Marca todos los ensayos que caen en el mes</small></p>
        <div class="cl-month"><span>${MESES[ronda.mes]}</span> ${ronda.anio} · ${ronda.dias} días</div>
        <div class="cl-board" data-board>${rejillaHTML(ronda.col1, { interactivo: true, marcas: marcados })}</div>
        <div class="cl-note" data-note>Marcados: <b data-count>1</b></div>
        <button class="primary cl-confirm" data-confirm>Listo</button>
        <div class="feedback" data-feedback></div>
      </div>
    `;
    const board = body.querySelector("[data-board]");
    board.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-day]");
      if (!btn || finished || locked) return;
      const d = Number(btn.dataset.day);
      if (marcados.has(d)) marcados.delete(d);
      else marcados.add(d);
      btn.classList.toggle("cl-mark", marcados.has(d));
      body.querySelector("[data-count]").textContent = String(marcados.size);
    });
    body.querySelector("[data-confirm]").addEventListener("click", resolverPlanifica);
  }

  function resolverColumna() {
    if (finished || locked || eleccion < 0) return;
    const ok = eleccion === ronda.col1;
    // Se monta el mes de verdad: ahí se ve si el día de la pista cae
    // donde decía el enunciado, que es la comprobación que enseña.
    body.querySelector("[data-board]").innerHTML =
      rejillaHTML(ronda.col1, { destacado: ronda.pista }) +
      (ok ? "" : `<div class="cl-extra">Tú lo empezaste en <b>${DIAS[eleccion]}</b></div>`);
    const semanas = ronda.semanas === 1 ? "1 semana" : `${ronda.semanas} semanas`;
    body.querySelector("[data-note]").innerHTML =
      `Del 1 al ${ronda.pista} hay ${ronda.pista - 1} días = ${semanas} y ${ronda.resto} día${ronda.resto === 1 ? "" : "s"}: ` +
      `retrocede ${ronda.resto} desde el ${DIAS[ronda.colPista]} → el 1 es <b>${DIAS[ronda.col1]}</b>`;
    resolver(ok, "¡El mes encaja!", `El 1 era ${DIAS[ronda.col1]}`);
  }

  function resolverPlanifica() {
    if (finished || locked) return;
    const malos = Array.from(marcados).filter((d) => !ronda.objetivo.includes(d));
    const faltan = ronda.objetivo.filter((d) => !marcados.has(d));
    const ok = malos.length === 0 && faltan.length === 0;
    body.querySelector("[data-board]").innerHTML = rejillaHTML(ronda.col1, {
      marcas: marcados,
      buenos: ronda.objetivo,
      malos,
    });
    body.querySelector("[data-note]").innerHTML =
      `Sumando ${ronda.paso}: <b>${cadenaHTML()}</b> (el siguiente, ${ronda.objetivo[ronda.objetivo.length - 1] + ronda.paso}, ya es del mes siguiente)`;
    const partes = [];
    if (faltan.length) partes.push(`faltaban ${faltan.join(", ")}`);
    if (malos.length) partes.push(`sobraban ${malos.join(", ")}`);
    resolver(
      ok,
      `¡Los ${ronda.objetivo.length} ensayos!`,
      partes.join(" y ").replace(/^./, (c) => c.toUpperCase())
    );
  }

  function resolver(ok, msgOk, msgBad) {
    locked = true;
    rounds++;
    const confirmar = body.querySelector("[data-confirm]");
    if (confirmar) confirmar.disabled = true;
    const feedback = body.querySelector("[data-feedback]");
    if (ok) {
      streak++;
      score += 10;
      renderScore();
      feedback.textContent = msgOk;
      feedback.className = "feedback ok";
      later(nextRound, 1300);
    } else {
      streak = 0;
      lives--;
      renderLives();
      feedback.textContent = msgBad;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 1900);
      later(nextRound, 2400);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimers();
    if (userExited) return onExit();
    saveScore(client, "calendario", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📅</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} rondas</p>
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
    clearTimers();
    lives = startLives;
    score = 0;
    rounds = 0;
    streak = 0;
    roundIndex = 0;
    finished = false;
    locked = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    clearTimers();
  };
}
