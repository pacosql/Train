// "Salta de fecha" (Calendario v3): UN gesto por ronda sobre un mes REAL.
// La v2 alternaba dos modos densos (colocar la ficha del 1 deduciendo su
// columna por módulo 7 y marcar todos los ensayos "cada N días") con
// enunciados largos, y el usuario la marcó "demasiado complejo, no es
// nutritivo". La v3 reduce todo a saltar de fecha, con una progresión
// por niveles en la que cada uno enseña una sola cosa del calendario:
//   1 Salta: "hoy es el 9, ¿dentro de 12 días?" → tocar el 21.
//   2 Semanas: las semanas completas no cambian el día de la semana;
//     solo cuenta el resto (2 semanas y 3 días → martes + 3).
//   3 Cruza el mes: el salto se pasa al mes siguiente y hay que usar los
//     28/29/30/31 días que tiene el mes.
//   4 Cuántos faltan: la resta inversa ("del 7 al 23"), también cruzando.
//   5 Sin rejilla: módulo 7 puro de cabeza ("jueves + 20 días").
// Cada ronda tiene exactamente una respuesta correcta. Todas las fechas
// se construyen con Date.UTC para que ninguna zona horaria mueva un día.
import { randInt, pick, saveScore } from "./utils.js";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
// Semana que empieza en lunes (como en España), no en domingo.
const DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const DIAS_CORTOS = ["L", "M", "X", "J", "V", "S", "D"];
const DIAS_ABREV = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
// Se incluye 2024 a propósito: es bisiesto, así febrero sale de 28 y de 29.
const ANIOS = [2024, 2025, 2026, 2027];
const NOMBRE_NIVEL = ["", "Salta", "Semanas", "Cruza el mes", "Cuántos faltan", "Sin rejilla"];
const MAX_DIGITS = 2;

function diasDelMes(anio, mes) {
  // Día 0 del mes siguiente = último día de este mes.
  return new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
}

// Columna de la rejilla (lunes = 0); Date.getUTCDay() usa domingo = 0.
function columna(anio, mes, dia) {
  return (new Date(Date.UTC(anio, mes, dia)).getUTCDay() + 6) % 7;
}

// Nivel según la racha: 0-1 → 1, 2-3 → 2, 4-5 → 3, 6-7 → 4, 8+ → 5.
export function calendarioLevelFor(streak) {
  return Math.min(5, Math.floor(Math.max(streak, 0) / 2) + 1);
}

// Genera la ronda entera con todos sus datos (año, mes, hoy, salto,
// respuesta...). Se exporta para que la simulación pruebe exactamente
// los mismos números que corren en el juego. `origen`/`destino` son los
// dos extremos del camino que se pinta en el feedback; `destinoOffset`
// vale 1 cuando el destino cae en el mes siguiente.
export function buildRondaCalendario(nivel) {
  const anio = pick(ANIOS);
  // En los niveles que cruzan de mes no sale diciembre: así el mes
  // siguiente es del mismo año y la segunda rejilla no cambia de año.
  const cruza = nivel === 3 || nivel === 4;
  const mes = randInt(0, cruza ? 10 : 11);
  const dias = diasDelMes(anio, mes);
  const base = { nivel, anio, mes, dias, col1: columna(anio, mes, 1) };
  const siguiente = () => ({
    mes2: mes + 1,
    dias2: diasDelMes(anio, mes + 1),
    col1b: columna(anio, mes + 1, 1),
  });

  if (nivel === 1) {
    // Salto de 4 a 20 días sin salir del mes.
    const hoy = randInt(1, dias - 6);
    const salto = randInt(4, Math.min(dias - hoy, 20));
    const destino = hoy + salto;
    return {
      ...base, tipo: "salta", hoy, colHoy: columna(anio, mes, hoy), salto,
      origen: hoy, destino, destinoOffset: 0, respuesta: destino,
    };
  }

  if (nivel === 2) {
    // 1-3 semanas completas y 1-6 días de resto (nunca 0: sería trivial).
    const semanas = randInt(1, 3);
    const extra = randInt(1, 6);
    const salto = semanas * 7 + extra; // como mucho 27 < 28 días de febrero
    const hoy = randInt(1, dias - salto);
    const destino = hoy + salto;
    return {
      ...base, tipo: "semanas", hoy, colHoy: columna(anio, mes, hoy), semanas, extra, salto,
      origen: hoy, destino, destinoOffset: 0, respuesta: columna(anio, mes, destino),
    };
  }

  if (nivel === 3) {
    // Hoy está en los últimos 13 días del mes y el salto entra 1-14 días
    // en el siguiente: siempre cae en el mes siguiente, nunca dos más allá.
    const hoy = randInt(dias - 13, dias - 1);
    const resto = randInt(1, 14);
    const salto = dias - hoy + resto;
    return {
      ...base, ...siguiente(), tipo: "cruza", hoy, colHoy: columna(anio, mes, hoy), salto, resto,
      origen: hoy, destino: resto, destinoOffset: 1, respuesta: resto,
    };
  }

  if (nivel === 4) {
    if (pick([false, true])) {
      const desde = randInt(1, dias - 4);
      const hasta = randInt(desde + 3, Math.min(dias, desde + 24));
      return {
        ...base, tipo: "cuantos", desde, hasta, hastaOffset: 0,
        origen: desde, destino: hasta, destinoOffset: 0, respuesta: hasta - desde,
      };
    }
    const desde = randInt(dias - 12, dias - 1);
    const hasta = randInt(1, 12);
    return {
      ...base, ...siguiente(), tipo: "cuantos", desde, hasta, hastaOffset: 1,
      origen: desde, destino: hasta, destinoOffset: 1, respuesta: dias - desde + hasta,
    };
  }

  // Nivel 5: sin rejilla. Solo se da el día de la semana; el salto va de
  // 8 a 30 y nunca es múltiplo de 7 (la respuesta sería "el mismo día").
  const colHoy = randInt(0, 6);
  let salto = 0;
  do salto = randInt(8, 30); while (salto % 7 === 0);
  // Se fija también una fecha real con ese día de la semana para que la
  // simulación pueda recalcular la respuesta con Date.UTC.
  const hoy = ((colHoy - base.col1 + 7) % 7) + 1 + 7 * randInt(0, 3);
  return {
    ...base, tipo: "mental", hoy, colHoy, salto,
    semanas: Math.floor(salto / 7), extra: salto % 7,
    respuesta: (colHoy + salto) % 7,
  };
}

export function mountCalendarioGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let locked = false;
  let timers = [];
  let ronda = null;
  let typed = "";

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

  function cabeceraHTML() {
    return DIAS_CORTOS
      .map((d, i) => `<div class="cl-head${i > 4 ? " cl-weekend" : ""}">${d}</div>`)
      .join("");
  }

  // Una rejilla de mes. `marcas` es {día: clase} (hoy, camino, destino…).
  function rejillaHTML(g, o) {
    const marcas = o.marcas || {};
    let celdas = "";
    for (let i = 0; i < g.col1; i++) celdas += `<div class="cl-cell cl-empty"></div>`;
    for (let d = 1; d <= g.dias; d++) {
      const clases = "cl-cell cl-day" + (marcas[d] ? ` ${marcas[d]}` : "");
      celdas += o.interactivo
        ? `<button class="${clases}" type="button" data-day="${d}" data-month-offset="${g.offset}">${d}</button>`
        : `<div class="${clases}">${d}</div>`;
    }
    return `
      <div class="cl-mes${o.dim ? " cl-dim" : ""}">
        <div class="cl-month" data-year="${g.anio}" data-month="${g.mes}"><span>${MESES[g.mes]}</span> ${g.anio} · ${g.dias} días</div>
        <div class="cl-grid">${cabeceraHTML()}${celdas}</div>
      </div>`;
  }

  function tableroHTML(marcas0, marcas1, interactivo, dim) {
    const dos = ronda.mes2 !== undefined;
    let html = rejillaHTML(
      { anio: ronda.anio, mes: ronda.mes, dias: ronda.dias, col1: ronda.col1, offset: 0 },
      { marcas: marcas0, interactivo, dim }
    );
    if (dos) {
      html += rejillaHTML(
        { anio: ronda.anio, mes: ronda.mes2, dias: ronda.dias2, col1: ronda.col1b, offset: 1 },
        { marcas: marcas1, interactivo, dim }
      );
    }
    return `<div class="cl-months${dos ? " cl-two" : ""}">${html}</div>`;
  }

  // Marcas iniciales: solo "hoy" (y en "cuántos faltan", también el final).
  function marcasInicio() {
    const m0 = {};
    const m1 = {};
    m0[ronda.origen] = "cl-today";
    if (ronda.tipo === "cuantos") (ronda.destinoOffset ? m1 : m0)[ronda.destino] = "cl-target";
    return [m0, m1];
  }

  // Marcas del feedback: el camino completo de origen a destino.
  function marcasCamino(malo) {
    const m0 = {};
    const m1 = {};
    const fin0 = ronda.destinoOffset ? ronda.dias : ronda.destino;
    for (let d = ronda.origen + 1; d <= fin0; d++) m0[d] = "cl-path";
    if (ronda.destinoOffset) for (let d = 1; d <= ronda.destino; d++) m1[d] = "cl-path";
    if (malo) (malo.offset ? m1 : m0)[malo.dia] = "cl-bad";
    m0[ronda.origen] = "cl-today";
    (ronda.destinoOffset ? m1 : m0)[ronda.destino] = "cl-target";
    return [m0, m1];
  }

  function enunciado() {
    const r = ronda;
    switch (r.tipo) {
      case "salta":
        return `Hoy es el <b>${r.hoy}</b>: ¿qué día es dentro de <b>${r.salto} días</b>?`;
      case "semanas":
        return `Hoy es <b>${DIAS[r.colHoy]} ${r.hoy}</b>: ¿qué día de la semana es dentro de <b>${r.semanas} semana${r.semanas === 1 ? "" : "s"} y ${r.extra} día${r.extra === 1 ? "" : "s"}</b>?`;
      case "cruza":
        return `Hoy es el <b>${r.hoy} de ${MESES[r.mes]}</b>: ¿qué fecha es dentro de <b>${r.salto} días</b>?`;
      case "cuantos":
        return r.hastaOffset
          ? `¿Cuántos días hay del <b>${r.desde} de ${MESES[r.mes]}</b> al <b>${r.hasta} de ${MESES[r.mes2]}</b>?`
          : `¿Cuántos días hay del <b>${r.desde}</b> al <b>${r.hasta}</b>?`;
      default:
        return `Hoy es <b>${DIAS[r.colHoy]}</b>: ¿qué día de la semana es dentro de <b>${r.salto} días</b>?`;
    }
  }

  // Una línea que explica el truco del nivel, con los números de la ronda.
  function explicacion() {
    const r = ronda;
    switch (r.tipo) {
      case "salta":
        return `Del <b>${r.hoy}</b> al <b>${r.destino}</b> van ${r.salto} días: ${r.hoy} + ${r.salto} = ${r.destino}.`;
      case "semanas":
        return `${r.semanas} semana${r.semanas === 1 ? "" : "s"} no cambia${r.semanas === 1 ? "" : "n"} el día: ${DIAS[r.colHoy]} + ${r.extra} = <b>${DIAS[r.respuesta]}</b> (el ${r.destino}).`;
      case "cruza":
        return `${MESES[r.mes]} tiene ${r.dias} días: ${r.hoy} + ${r.salto} = ${r.hoy + r.salto}, y ${r.hoy + r.salto} − ${r.dias} = <b>${r.resto} de ${MESES[r.mes2]}</b>.`;
      case "cuantos":
        return r.hastaOffset
          ? `Del ${r.desde} al ${r.dias} van ${r.dias - r.desde}, más ${r.hasta} de ${MESES[r.mes2]} = <b>${r.respuesta}</b>.`
          : `${r.hasta} − ${r.desde} = <b>${r.respuesta}</b>.`;
      default:
        return `${r.salto} = ${r.semanas} semanas y ${r.extra} día${r.extra === 1 ? "" : "s"}: ${DIAS[r.colHoy]} + ${r.extra} = <b>${DIAS[r.respuesta]}</b>.`;
    }
  }

  function respuestaHumana() {
    const r = ronda;
    switch (r.tipo) {
      case "salta": return `Era el ${r.destino}`;
      case "semanas": return `Era ${DIAS[r.respuesta]}`;
      case "cruza": return `Era el ${r.resto} de ${MESES[r.mes2]}`;
      case "cuantos": return `Eran ${r.respuesta} días`;
      default: return `Era ${DIAS[r.respuesta]}`;
    }
  }

  function semanaHTML() {
    return `<div class="cl-weekdays" data-weekdays>${DIAS_ABREV
      .map((d, i) => `<button class="cl-wd" type="button" data-weekday="${i}" aria-label="${DIAS[i]}">${d}</button>`)
      .join("")}</div>`;
  }

  function tecladoHTML() {
    return `<div class="keypad-display" data-display>&nbsp;</div><div class="keypad" data-keypad></div>`;
  }

  function atributosRonda() {
    const r = ronda;
    const a = [
      `data-ronda`, `data-nivel="${r.nivel}"`, `data-tipo="${r.tipo}"`,
      `data-year="${r.anio}"`, `data-month="${r.mes}"`,
    ];
    if (r.tipo === "cuantos") {
      a.push(`data-desde="${r.desde}"`, `data-hasta="${r.hasta}"`, `data-hasta-offset="${r.hastaOffset}"`);
    } else {
      a.push(`data-hoy="${r.hoy}"`, `data-salto="${r.salto}"`);
    }
    return a.join(" ");
  }

  function nextRound() {
    if (finished) return;
    ronda = buildRondaCalendario(calendarioLevelFor(streak));
    locked = false;
    typed = "";
    const [m0, m1] = marcasInicio();
    const tocaDia = ronda.tipo === "salta" || ronda.tipo === "cruza";
    const tocaSemana = ronda.tipo === "semanas" || ronda.tipo === "mental";

    body.innerHTML = `
      <div class="cl-wrap" ${atributosRonda()}>
        <div class="cl-level">Nivel ${ronda.nivel} · ${NOMBRE_NIVEL[ronda.nivel]}</div>
        <p class="prompt cl-prompt">${enunciado()}</p>
        <div class="cl-board" data-board>${ronda.tipo === "mental" ? "" : tableroHTML(m0, m1, tocaDia, ronda.tipo === "semanas")}</div>
        <div class="cl-answer" data-answer>${tocaSemana ? semanaHTML() : ronda.tipo === "cuantos" ? tecladoHTML() : ""}</div>
        <div class="cl-note" data-note></div>
        <div class="feedback" data-feedback></div>
      </div>
    `;

    if (tocaDia) {
      body.querySelector("[data-board]").addEventListener("click", (e) => {
        const btn = e.target.closest("[data-day]");
        if (!btn || finished || locked) return;
        const dia = Number(btn.dataset.day);
        const offset = Number(btn.dataset.monthOffset);
        const ok = dia === ronda.destino && offset === ronda.destinoOffset;
        const [c0, c1] = marcasCamino(ok ? null : { dia, offset });
        body.querySelector("[data-board]").innerHTML = tableroHTML(c0, c1, false, false);
        resolver(ok);
      });
    } else if (tocaSemana) {
      body.querySelector("[data-weekdays]").addEventListener("click", (e) => {
        const btn = e.target.closest("[data-weekday]");
        if (!btn || finished || locked) return;
        const col = Number(btn.dataset.weekday);
        const ok = col === ronda.respuesta;
        body.querySelectorAll("[data-weekday]").forEach((b) => {
          const c = Number(b.dataset.weekday);
          b.classList.toggle("cl-wd-ok", c === ronda.respuesta);
          b.classList.toggle("cl-wd-bad", !ok && c === col);
          b.disabled = true;
        });
        if (ronda.tipo === "semanas") {
          const [c0, c1] = marcasCamino(null);
          body.querySelector("[data-board]").innerHTML = tableroHTML(c0, c1, false, false);
        }
        resolver(ok);
      });
    } else {
      const pad = body.querySelector("[data-keypad]");
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn keypad-key";
        btn.type = "button";
        btn.textContent = key;
        if (key === "⌫") {
          btn.setAttribute("data-backspace", "");
          btn.addEventListener("click", pressBackspace);
        } else if (key === "✓") {
          btn.setAttribute("data-submit", "");
          btn.addEventListener("click", submitTeclado);
        } else {
          btn.setAttribute("data-digit", key);
          btn.addEventListener("click", () => pressDigit(key));
        }
        pad.appendChild(btn);
      });
    }
  }

  function renderDisplay() {
    const el = body.querySelector("[data-display]");
    if (el) el.textContent = typed || " ";
  }
  function pressDigit(d) {
    if (finished || locked || typed.length >= MAX_DIGITS) return;
    typed = typed === "0" ? d : typed + d;
    renderDisplay();
  }
  function pressBackspace() {
    if (finished || locked) return;
    typed = typed.slice(0, -1);
    renderDisplay();
  }
  function submitTeclado() {
    if (finished || locked || typed === "") return;
    const ok = Number(typed) === ronda.respuesta;
    const [c0, c1] = marcasCamino(null);
    body.querySelector("[data-board]").innerHTML = tableroHTML(c0, c1, false, false);
    body.querySelectorAll("[data-keypad] button").forEach((b) => { b.disabled = true; });
    resolver(ok);
  }

  function resolver(ok) {
    locked = true;
    rounds++;
    body.querySelector("[data-note]").innerHTML = explicacion();
    const feedback = body.querySelector("[data-feedback]");
    if (ok) {
      streak++;
      score += 10;
      renderScore();
      feedback.textContent = "¡Eso es!";
      feedback.className = "feedback ok";
      later(nextRound, 1500);
    } else {
      // Al fallar se baja un nivel (dos puntos de racha), no al principio.
      streak = Math.max(0, streak - 2);
      lives--;
      renderLives();
      feedback.textContent = respuestaHumana();
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 2200);
      later(nextRound, 2600);
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
        <p>${rounds} saltos</p>
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
    finished = false;
    locked = false;
    typed = "";
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
