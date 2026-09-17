// "Mezclas y proporciones": antes era una regla de tres con cuatro
// botones — los iconos de la receta eran decoración y la pregunta habría
// funcionado igual preguntando capitales. Ahora la mecánica ES la
// proporción: hay dos torres de bloques, la del ingrediente que te dan
// está clavada y la otra se ESTIRA con el dedo hasta que la mezcla sabe
// igual que la receta base. Estirar es multiplicar: el alto de la torre
// es la cantidad.
// Inversión: la mitad de las rondas te dan el ingrediente "grande", así
// que para hallar el otro hay que repartir primero (dividir) y luego
// multiplicar — se buscan los operandos, no el resultado.
// Al fallar, las dos torres se parten en las k raciones de la receta:
// ahí se ve de dónde sale el número.
import { randInt, pick, saveScore } from "./utils.js";

const RECETAS = [
  { a: { e: "🍋", n: "limones" }, b: { e: "🍯", n: "cucharadas de miel" }, titulo: "limonada" },
  { a: { e: "🥛", n: "vasos de leche" }, b: { e: "🍫", n: "onzas de chocolate" }, titulo: "batido" },
  { a: { e: "🍓", n: "fresas" }, b: { e: "🍬", n: "terrones de azúcar" }, titulo: "mermelada" },
  { a: { e: "🍅", n: "tomates" }, b: { e: "🧄", n: "dientes de ajo" }, titulo: "salsa" },
  { a: { e: "🌾", n: "puñados de harina" }, b: { e: "🥚", n: "huevos" }, titulo: "bizcocho" },
  { a: { e: "🔵", n: "bolas azules" }, b: { e: "🔴", n: "bolas rojas" }, titulo: "collar" },
  { a: { e: "🧊", n: "cubitos" }, b: { e: "🧉", n: "cucharadas de sirope" }, titulo: "granizado" },
];

const MAX_BLOQUES = 12;
// Rango de raciones (k) y tope de la razón base por nivel de racha.
const RANGO_K = [[2, 3], [2, 4], [2, 5], [2, 6]];
const MAX_RAZON = [4, 5, 6, 6];

// Geometría del dibujo: el alto de un bloque es la unidad de medida.
const W = 300;
const H = 236;
const BASE = 196;
const U = 15;
const TOW_W = 58;
const X_DADO = 52;
const X_LIBRE = 190;

function mcd(x, y) {
  return y === 0 ? x : mcd(y, x % y);
}

// Genera la ronda entera. Se exporta para que el script de simulación
// pruebe exactamente los mismos números que corren en el juego.
export function buildRondaProporciones(nivel) {
  const [kmin, kmax] = RANGO_K[nivel];
  const tope = MAX_RAZON[nivel];
  let ra = 0;
  let rb = 0;
  let k = 0;
  let guard = 0;
  // La razón base tiene que ser irreducible y con los dos lados
  // distintos: con 2:2 o 2:4 colaría "el mismo número" o "el doble" sin
  // entender la razón. Y las dos torres escaladas deben caber en 12.
  do {
    ra = randInt(1, tope);
    rb = randInt(1, tope);
    k = randInt(kmin, kmax);
    guard++;
  } while (
    (ra === rb || mcd(ra, rb) !== 1 || ra * k > MAX_BLOQUES || rb * k > MAX_BLOQUES) &&
    guard < 400
  );

  const dadoEsA = randInt(0, 1) === 0;
  const dado = dadoEsA ? ra * k : rb * k;
  const correcto = dadoEsA ? rb * k : ra * k;
  // La torre libre arranca lejos de la solución: nunca vale de salida ni
  // se acierta con un solo toque del botón +/−.
  let inicio = 0;
  let guardIni = 0;
  do {
    inicio = randInt(1, MAX_BLOQUES);
    guardIni++;
  } while (Math.abs(inicio - correcto) < 2 && guardIni < 200);

  return { ra, rb, k, dadoEsA, dado, correcto, inicio, guard, guardIni };
}

export function mountProporcionesGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let locked = false;
  let timers = [];
  let ronda = null;
  let receta = null;
  let valor = 0;
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
    return Math.min(Math.floor(streak / 2), RANGO_K.length - 1);
  }

  // Bloques de una torre: el bloque i (0 = el de abajo) lleva su banda de
  // ración marcada, para que al revelar se pinten las k raciones solas.
  function bloquesSVG(x, total, grupo, clase, dataAttr) {
    let out = "";
    for (let i = 0; i < total; i++) {
      const banda = Math.floor(i / grupo) % 2;
      out += `<rect class="pr-blk ${clase}" ${dataAttr ? `${dataAttr}="${i}"` : ""}` +
        ` data-band="${banda}" x="${x}" y="${BASE - (i + 1) * U + 1.5}"` +
        ` width="${TOW_W}" height="${U - 3}" rx="3"/>`;
    }
    return out;
  }

  function separadoresSVG(x, grupo, k) {
    let out = "";
    for (let g = 1; g < k; g++) {
      const y = BASE - g * grupo * U;
      out += `<line class="pr-sep" x1="${x - 4}" y1="${y}" x2="${x + TOW_W + 4}" y2="${y}"/>`;
    }
    return out;
  }

  function huecosSVG(x) {
    let out = "";
    for (let i = 0; i < MAX_BLOQUES; i++) {
      out += `<rect class="pr-hueco" x="${x}" y="${BASE - (i + 1) * U + 1.5}"` +
        ` width="${TOW_W}" height="${U - 3}" rx="3"/>`;
    }
    return out;
  }

  function nextRound() {
    if (finished) return;
    ronda = buildRondaProporciones(nivelActual());
    receta = pick(RECETAS);
    locked = false;
    valor = ronda.inicio;

    const ingDado = ronda.dadoEsA ? receta.a : receta.b;
    const ingLibre = ronda.dadoEsA ? receta.b : receta.a;
    const grupoDado = ronda.dadoEsA ? ronda.ra : ronda.rb;
    const grupoLibre = ronda.dadoEsA ? ronda.rb : ronda.ra;

    body.innerHTML = `
      <div class="pr-wrap">
        <p class="prompt pr-prompt">Receta de ${receta.titulo}<small>por cada <b>${ronda.ra} ${receta.a.e}</b> van <b>${ronda.rb} ${receta.b.e}</b></small></p>
        <div class="pr-base">
          <div class="pr-base-row"><span class="pr-base-num">${ronda.ra}</span><span class="pr-base-ico">${receta.a.e.repeat(ronda.ra)}</span></div>
          <div class="pr-base-row"><span class="pr-base-num">${ronda.rb}</span><span class="pr-base-ico">${receta.b.e.repeat(ronda.rb)}</span></div>
        </div>
        <p class="pr-task">En la olla hay <b>${ronda.dado} ${ingDado.e}</b><small>Estira la torre de ${ingLibre.n} hasta que sepa igual</small></p>
        <svg class="pr-svg" data-svg viewBox="0 0 ${W} ${H}" role="img" aria-label="dos torres de bloques">
          <line class="pr-floor" x1="30" y1="${BASE}" x2="${W - 30}" y2="${BASE}"/>
          ${huecosSVG(X_LIBRE)}
          ${bloquesSVG(X_DADO, ronda.dado, grupoDado, "pr-blk-dado")}
          ${bloquesSVG(X_LIBRE, MAX_BLOQUES, grupoLibre, "pr-blk-libre", "data-b")}
          ${separadoresSVG(X_DADO, grupoDado, ronda.k)}
          ${separadoresSVG(X_LIBRE, grupoLibre, ronda.k)}
          <line class="pr-mine" data-mine x1="${X_LIBRE - 10}" y1="${BASE}" x2="${X_LIBRE + TOW_W + 10}" y2="${BASE}"/>
          <text class="pr-cap" x="${X_DADO + TOW_W / 2}" y="${BASE + 22}" text-anchor="middle">${ronda.dado} ${ingDado.e}</text>
          <text class="pr-cap pr-cap-libre" data-cap x="${X_LIBRE + TOW_W / 2}" y="${BASE + 22}" text-anchor="middle"></text>
          <text class="pr-lock" x="${X_DADO + TOW_W / 2}" y="${BASE - ronda.dado * U - 8}" text-anchor="middle">🔒</text>
          <rect data-grab x="${X_LIBRE - 14}" y="${BASE - MAX_BLOQUES * U - 6}" width="${TOW_W + 28}" height="${MAX_BLOQUES * U + 12}" fill="transparent"/>
        </svg>
        <div class="pr-controls">
          <button class="secondary pr-step" type="button" data-menos>−</button>
          <button class="primary pr-ok" type="button" data-confirm>Confirmar</button>
          <button class="secondary pr-step" type="button" data-mas>+</button>
        </div>
        <div class="feedback" data-feedback></div>
      </div>
    `;

    svgEl = body.querySelector("[data-svg]");
    pintar(valor);
    bindArrastre();
    body.querySelector("[data-menos]").addEventListener("click", () => mover(-1));
    body.querySelector("[data-mas]").addEventListener("click", () => mover(1));
    body.querySelector("[data-confirm]").addEventListener("click", resolver);
  }

  function pintar(v) {
    const ingLibre = ronda.dadoEsA ? receta.b : receta.a;
    svgEl.querySelectorAll("[data-b]").forEach((r) => {
      r.classList.toggle("pr-off", Number(r.dataset.b) >= v);
    });
    svgEl.querySelector("[data-cap]").textContent = `${v} ${ingLibre.e}`;
  }

  function mover(d) {
    if (finished || locked) return;
    const v = valor + d;
    if (v < 0 || v > MAX_BLOQUES) return;
    valor = v;
    pintar(valor);
  }

  function bindArrastre() {
    const grab = svgEl.querySelector("[data-grab]");
    let arrastrando = false;
    function aValor(clientY) {
      const rect = svgEl.getBoundingClientRect();
      const escala = rect.height / H; // el viewBox mantiene la proporción
      const baseY = rect.top + BASE * escala;
      const v = Math.round((baseY - clientY) / (U * escala));
      return Math.max(0, Math.min(MAX_BLOQUES, v));
    }
    function onDown(e) {
      if (finished || locked) return;
      arrastrando = true;
      valor = aValor(e.clientY);
      pintar(valor);
      grab.setPointerCapture(e.pointerId);
    }
    function onMove(e) {
      if (!arrastrando || finished || locked) return;
      valor = aValor(e.clientY);
      pintar(valor);
    }
    function onUp() {
      arrastrando = false;
    }
    grab.addEventListener("pointerdown", onDown);
    grab.addEventListener("pointermove", onMove);
    grab.addEventListener("pointerup", onUp);
    grab.addEventListener("pointercancel", onUp);
  }

  function resolver() {
    if (finished || locked) return;
    locked = true;
    rounds++;
    const ok = valor === ronda.correcto;
    const elegido = valor;
    const feedback = body.querySelector("[data-feedback]");
    const ingDado = ronda.dadoEsA ? receta.a : receta.b;
    const ingLibre = ronda.dadoEsA ? receta.b : receta.a;
    const grupoDado = ronda.dadoEsA ? ronda.ra : ronda.rb;
    const grupoLibre = ronda.dadoEsA ? ronda.rb : ronda.ra;

    body.querySelectorAll("[data-menos],[data-mas],[data-confirm]").forEach((b) => { b.disabled = true; });
    // Se enseña la solución partida en las k raciones de la receta: el
    // porqué es ver que las dos torres tienen el MISMO número de grupos.
    valor = ronda.correcto;
    pintar(valor);
    svgEl.classList.add("pr-reveal");
    const mine = svgEl.querySelector("[data-mine]");
    mine.setAttribute("y1", String(BASE - elegido * U));
    mine.setAttribute("y2", String(BASE - elegido * U));
    if (!ok) mine.classList.add("pr-mine-on");

    const cuenta = `${ronda.dado} ${ingDado.e} son ${ronda.k} raciones de ${grupoDado} → ${ronda.k} × ${grupoLibre} = ${ronda.correcto} ${ingLibre.e}`;
    if (ok) {
      streak++;
      score += 10;
      renderScore();
      feedback.textContent = `¡Sabe igual! ${cuenta}`;
      feedback.className = "feedback ok";
      later(nextRound, 1500);
    } else {
      streak = 0;
      lives--;
      renderLives();
      feedback.textContent = `Pusiste ${elegido}. ${cuenta}`;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 2000);
      later(nextRound, 2500);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    clearTimers();
    if (userExited) return onExit();
    saveScore(client, "proporciones", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧪</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} mezclas</p>
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
