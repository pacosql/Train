// "Continúa la gráfica": antes era un test de cuatro puntos candidatos —
// la gráfica era decoración y el patrón se podía acertar a ojo mirando qué
// punto seguía la recta. Ahora está invertido: el jugador DIBUJA la
// gráfica. Se da un enunciado ("empieza con 3 litros y entran 4 cada
// hora") y el primer punto ya colocado; el resto de puntos salen planos y
// hay que arrastrarlos a su altura. Arrastrar es la variación: el alto de
// cada punto es la cantidad y la pendiente aparece sola al acertar.
// El eje x puede ir de 2 en 2 (niveles altos), así que hay que aplicar la
// variación por unidad al intervalo real: leer el eje forma parte.
// Al fallar se dibuja encima la gráfica correcta con sus valores y la
// cadena de sumas, para ver dónde se desvió.
import { randInt, pick, saveScore } from "./utils.js";

const W = 300;
const H = 224;
const PAD_L = 30;
const PAD_R = 14;
const PAD_T = 26;
const PAD_B = 32;
const PLOT_H = H - PAD_T - PAD_B;
const TOPE = 24; // ningún valor pasa de aquí, así la rejilla es legible
const Y_NICE = [8, 10, 12, 16, 20, 24];

// Niveles por racha: más puntos que dibujar, variación mayor, y al final
// aparecen la duplicación y el eje de 2 en 2.
const NIVELES = [
  { n: 3, paso: [2, 3], tipos: ["sube"], intervalos: [1] },
  { n: 3, paso: [2, 4], tipos: ["sube", "baja"], intervalos: [1] },
  { n: 4, paso: [2, 4], tipos: ["sube", "baja"], intervalos: [1] },
  { n: 4, paso: [2, 5], tipos: ["sube", "baja", "dobla"], intervalos: [1, 2] },
];

const CONTEXTOS = {
  sube: [
    { emoji: "🪣", uy: "L", ux: "h", frase: (v0, p) => `El depósito tiene ${v0} litros y entran ${p} litros cada hora` },
    { emoji: "💰", uy: "€", ux: "sem", frase: (v0, p) => `Ana tiene ${v0} € y ahorra ${p} € cada semana` },
    { emoji: "🌱", uy: "cm", ux: "días", frase: (v0, p) => `La planta mide ${v0} cm y crece ${p} cm cada día` },
    { emoji: "📚", uy: "pág", ux: "días", frase: (v0, p) => `Lleva ${v0} páginas leídas y lee ${p} páginas cada día` },
  ],
  baja: [
    { emoji: "🪣", uy: "L", ux: "h", frase: (v0, p) => `El depósito tiene ${v0} litros y se van ${p} litros cada hora` },
    { emoji: "🍬", uy: "🍬", ux: "días", frase: (v0, p) => `Hay ${v0} caramelos y cada día se comen ${p}` },
    { emoji: "🚚", uy: "km", ux: "h", frase: (v0, p) => `Faltan ${v0} km y el camión hace ${p} km cada hora` },
  ],
  dobla: [
    { emoji: "🦠", uy: "🦠", ux: "h", frase: (v0) => `Hay ${v0} bacterias y se duplican cada hora` },
    { emoji: "❤️", uy: "❤️", ux: "h", frase: (v0) => `El vídeo tiene ${v0} me gusta y se duplican cada hora` },
  ],
};

// Genera la ronda entera. Se exporta para que el script de simulación
// pruebe exactamente los mismos números que corren en el juego.
export function buildRondaGrafica(nivel) {
  const cfg = NIVELES[nivel];
  let tipo = "sube";
  let intervalo = 1;
  let n = cfg.n;
  let paso = 0;
  let v0 = 0;
  let valores = [];
  let guard = 0;
  do {
    guard++;
    tipo = pick(cfg.tipos);
    intervalo = tipo === "dobla" ? 1 : pick(cfg.intervalos);
    n = tipo === "dobla" ? 3 : cfg.n;
    if (tipo === "dobla") {
      // v0 · 2³ tiene que caber: v0 como máximo 3.
      paso = 2;
      v0 = randInt(1, Math.floor(TOPE / 8));
      valores = [v0];
      for (let i = 1; i <= n; i++) valores.push(valores[i - 1] * 2);
    } else {
      // El salto entre puntos es paso · intervalo; se acota el paso para
      // que la serie entera quepa entre 1 y TOPE sin rechazos en balde.
      const saltoMax = Math.floor((TOPE - 1) / n);
      const pasoMax = Math.max(cfg.paso[0], Math.min(cfg.paso[1], Math.floor(saltoMax / intervalo)));
      paso = randInt(cfg.paso[0], pasoMax);
      const salto = paso * intervalo;
      v0 = tipo === "sube"
        ? randInt(1, Math.max(1, Math.min(6, TOPE - n * salto)))
        : randInt(n * salto + 1, Math.min(TOPE, n * salto + 6));
      valores = [v0];
      for (let i = 1; i <= n; i++) {
        valores.push(tipo === "sube" ? valores[i - 1] + salto : valores[i - 1] - salto);
      }
    }
  } while (
    (Math.min(...valores) < 1 || Math.max(...valores) > TOPE ||
      valores.slice(1).some((v) => v === v0)) && guard < 200
  );

  const maximo = Math.max(...valores);
  const yMax = Y_NICE.find((y) => y >= maximo) || TOPE;
  const ctx = pick(CONTEXTOS[tipo]);
  return { tipo, intervalo, n, paso, v0, valores, yMax, ctx, guard };
}

export function mountGraficaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let locked = false;
  let timers = [];
  let ronda = null;
  let puntos = []; // altura actual de cada punto arrastrable (índice 1..n)
  let svgEl = null;

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
    return Math.min(Math.floor(streak / 2), NIVELES.length - 1);
  }

  function xFor(i) {
    return PAD_L + (i * (W - PAD_L - PAD_R)) / ronda.n;
  }
  function yFor(v) {
    return H - PAD_B - (v / ronda.yMax) * PLOT_H;
  }

  function nextRound() {
    if (finished) return;
    ronda = buildRondaGrafica(nivelActual());
    locked = false;
    // Salida plana a la altura del primer dato: con variación distinta de
    // cero, ningún punto empieza ya acertado.
    puntos = [];
    for (let i = 0; i <= ronda.n; i++) puntos.push(ronda.v0);

    const pasoY = ronda.yMax <= 12 ? 2 : 4;
    let rejilla = "";
    for (let v = 0; v <= ronda.yMax; v += pasoY) {
      rejilla += `<line class="gf-grid" x1="${PAD_L}" y1="${yFor(v)}" x2="${W - PAD_R}" y2="${yFor(v)}"/>` +
        `<text class="gf-lbl" x="${PAD_L - 6}" y="${yFor(v) + 4}" text-anchor="end">${v}</text>`;
    }
    let ejeX = "";
    for (let i = 0; i <= ronda.n; i++) {
      ejeX += `<text class="gf-lbl" x="${xFor(i)}" y="${H - PAD_B + 15}" text-anchor="middle">${i * ronda.intervalo}</text>`;
    }
    let manos = "";
    for (let i = 1; i <= ronda.n; i++) {
      manos += `
        <g class="gf-h" data-i="${i}">
          <circle class="gf-hit" data-hit cx="${xFor(i)}" cy="${yFor(ronda.v0)}" r="19" fill="transparent"/>
          <circle class="gf-dot" cx="${xFor(i)}" cy="${yFor(ronda.v0)}" r="9"/>
          <text class="gf-val" x="${xFor(i)}" y="${yFor(ronda.v0) - 15}" text-anchor="middle">${ronda.v0}</text>
        </g>`;
    }
    let meta = `<polyline class="gf-target" data-target points="${ronda.valores.map((v, i) => `${xFor(i)},${yFor(v)}`).join(" ")}"/>`;
    for (let i = 1; i <= ronda.n; i++) {
      // El último valor se etiqueta a la izquierda para no salirse del lienzo.
      const der = i < ronda.n;
      meta += `<text class="gf-tval" x="${xFor(i) + (der ? 13 : -13)}" y="${yFor(ronda.valores[i]) + 4}" text-anchor="${der ? "start" : "end"}">${ronda.valores[i]}</text>`;
    }

    body.innerHTML = `
      <div class="gf-wrap">
        <p class="prompt gf-prompt">${ronda.ctx.emoji} ${ronda.ctx.frase(ronda.v0, ronda.paso)}<small>Arrastra cada punto a su altura${ronda.intervalo > 1 ? ` — ojo: el eje va de ${ronda.intervalo} en ${ronda.intervalo}` : ""}</small></p>
        <svg class="gf-svg" data-svg viewBox="0 0 ${W} ${H}" role="img" aria-label="gráfica para dibujar">
          ${rejilla}
          <line class="gf-axis" x1="${PAD_L}" y1="${PAD_T - 6}" x2="${PAD_L}" y2="${H - PAD_B}"/>
          <line class="gf-axis" x1="${PAD_L}" y1="${H - PAD_B}" x2="${W - PAD_R}" y2="${H - PAD_B}"/>
          <text class="gf-unit" x="${PAD_L - 6}" y="${PAD_T - 8}" text-anchor="end">${ronda.ctx.uy}</text>
          <text class="gf-unit" x="${W - PAD_R}" y="${H - 6}" text-anchor="end">${ronda.ctx.ux}</text>
          ${ejeX}
          ${meta}
          <polyline class="gf-line" data-line points=""/>
          <circle class="gf-fixed" cx="${xFor(0)}" cy="${yFor(ronda.v0)}" r="7"/>
          <text class="gf-val gf-val-fixed" x="${xFor(0) + 4}" y="${yFor(ronda.v0) - 13}" text-anchor="middle">${ronda.v0}</text>
          ${manos}
        </svg>
        <div class="gf-chain" data-chain></div>
        <button class="primary gf-ok" type="button" data-confirm>Listo</button>
        <div class="feedback" data-feedback></div>
      </div>
    `;

    svgEl = body.querySelector("[data-svg]");
    pintar();
    bindArrastre();
    body.querySelector("[data-confirm]").addEventListener("click", resolver);
  }

  function pintar() {
    svgEl.querySelector("[data-line]").setAttribute(
      "points",
      puntos.map((v, i) => `${xFor(i)},${yFor(v)}`).join(" ")
    );
    svgEl.querySelectorAll(".gf-h").forEach((g) => {
      const i = Number(g.dataset.i);
      const y = yFor(puntos[i]);
      g.querySelector(".gf-hit").setAttribute("cy", String(y));
      g.querySelector(".gf-dot").setAttribute("cy", String(y));
      const t = g.querySelector(".gf-val");
      t.setAttribute("y", String(y - 15));
      t.textContent = String(puntos[i]);
    });
  }

  function bindArrastre() {
    let activo = 0;
    function aValor(clientY) {
      const rect = svgEl.getBoundingClientRect();
      const escala = rect.height / H; // el viewBox mantiene la proporción
      const y0 = rect.top + (H - PAD_B) * escala;
      const v = Math.round(((y0 - clientY) / (PLOT_H * escala)) * ronda.yMax);
      return Math.max(0, Math.min(ronda.yMax, v));
    }
    svgEl.querySelectorAll(".gf-h").forEach((g) => {
      const hit = g.querySelector("[data-hit]");
      function onDown(e) {
        if (finished || locked) return;
        activo = Number(g.dataset.i);
        puntos[activo] = aValor(e.clientY);
        pintar();
        hit.setPointerCapture(e.pointerId);
      }
      function onMove(e) {
        if (!activo || finished || locked) return;
        puntos[activo] = aValor(e.clientY);
        pintar();
      }
      function onUp() {
        activo = 0;
      }
      hit.addEventListener("pointerdown", onDown);
      hit.addEventListener("pointermove", onMove);
      hit.addEventListener("pointerup", onUp);
      hit.addEventListener("pointercancel", onUp);
    });
  }

  function resolver() {
    if (finished || locked) return;
    locked = true;
    rounds++;
    const fallos = [];
    for (let i = 1; i <= ronda.n; i++) {
      if (puntos[i] !== ronda.valores[i]) fallos.push(i);
    }
    const ok = fallos.length === 0;
    body.querySelector("[data-confirm]").disabled = true;
    svgEl.querySelectorAll(".gf-h").forEach((g) => {
      g.classList.add(fallos.includes(Number(g.dataset.i)) ? "gf-bad" : "gf-good");
    });
    // Siempre se enseña la cadena: al acertar confirma el razonamiento y
    // al fallar es la explicación de por qué.
    const salto = ronda.tipo === "dobla" ? null : ronda.paso * ronda.intervalo;
    const regla = ronda.tipo === "dobla"
      ? "cada hora se dobla"
      : `${ronda.tipo === "sube" ? "suma" : "resta"} ${salto} de un punto al siguiente` +
        (ronda.intervalo > 1 ? ` (${ronda.paso} × ${ronda.intervalo})` : "");
    body.querySelector("[data-chain]").innerHTML =
      `<b>${ronda.valores.join(" → ")}</b><span>${regla}</span>`;
    const feedback = body.querySelector("[data-feedback]");

    if (ok) {
      streak++;
      score += 10;
      renderScore();
      feedback.textContent = "¡Gráfica clavada!";
      feedback.className = "feedback ok";
      later(nextRound, 1400);
    } else {
      streak = 0;
      lives--;
      renderLives();
      svgEl.classList.add("gf-reveal"); // saca la gráfica correcta encima
      feedback.textContent = fallos.length === 1
        ? `1 punto fuera de sitio: el ${fallos[0] * ronda.intervalo} era ${ronda.valores[fallos[0]]}`
        : `${fallos.length} puntos fuera de sitio`;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 2200);
      later(nextRound, 2600);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    clearTimers();
    if (userExited) return onExit();
    saveScore(client, "grafica", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📈</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} gráficas</p>
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
