// __BUILD_ID__
// "¿Qué prefieres?": comparación y sentido numérico al estilo "Would You
// Rather Math" (John Stevens). Cada ronda plantea dos escenarios con
// números concretos y solo uno es matemáticamente mejor tras hacer la
// cuenta — no es cuestión de gustos.
//
// Para evitar empates exactos y errores de redondeo, todas las
// comparaciones se hacen SIEMPRE por productos cruzados con enteros
// (a/b vs c/d  <=>  a*d vs c*b), nunca dividiendo y comparando floats.
import { randInt, pick, saveScore } from "./utils.js";

// Céntimos/valor entero -> "X,XX €" (siempre 2 decimales, estilo precio).
function formatMoney(centValue) {
  return `${(centValue / 100).toFixed(2).replace(".", ",")} €`;
}

// Número -> string en español con hasta 2 decimales, sin ceros sobrantes.
function formatDecimal(n) {
  let s = n.toFixed(2);
  while (s.endsWith("0")) s = s.slice(0, -1);
  if (s.endsWith(".")) s = s.slice(0, -1);
  return s.replace(".", ",");
}

// Medias horas (entero) -> "1 hora" / "1,5 horas" / "3 horas".
function formatHoras(halfHours) {
  const hours = halfHours / 2;
  if (Number.isInteger(hours)) return `${hours} hora${hours === 1 ? "" : "s"}`;
  return `${Math.floor(hours)},5 horas`;
}

// ---------- Generadores de escenarios (cada uno evita el empate exacto
// con un do/while que compara por productos cruzados) ----------

const ITEMS_PRECIO = [
  ["bolígrafos", "✏️"],
  ["chocolatinas", "🍫"],
  ["zumos", "🧃"],
  ["cuadernos", "📒"],
  ["yogures", "🥛"],
  ["cromos", "🎴"],
  ["naranjas", "🍊"],
  ["pegatinas", "⭐"],
];

// Precio por unidad: gana quien paga menos por unidad.
// precioA/cantidadA < precioB/cantidadB  <=>  precioA*cantidadB < precioB*cantidadA
function generarPrecio() {
  const [nombre, emoji] = pick(ITEMS_PRECIO);
  let qty1, cents1, qty2, cents2;
  do {
    qty1 = randInt(2, 8);
    qty2 = randInt(2, 8);
    cents1 = randInt(60, 900);
    cents2 = randInt(60, 900);
  } while (cents1 * qty2 === cents2 * qty1);
  const oneWins = cents1 * qty2 < cents2 * qty1;
  const unit1 = cents1 / qty1;
  const unit2 = cents2 / qty2;
  return {
    emoji,
    textOne: `${qty1} ${nombre} por ${formatMoney(cents1)}`,
    textTwo: `${qty2} ${nombre} por ${formatMoney(cents2)}`,
    oneWins,
    explain:
      `${qty1} ${nombre} por ${formatMoney(cents1)} = ${formatMoney(unit1)} cada uno; ` +
      `${qty2} ${nombre} por ${formatMoney(cents2)} = ${formatMoney(unit2)} cada uno — ` +
      `la ${oneWins ? "primera" : "segunda"} opción sale más barata por unidad.`,
  };
}

// Velocidad media: gana quien va más rápido de media (más km por hora).
// El tiempo se genera en medias horas (entero) para poder comparar por
// productos cruzados sin perder precisión: distA*tiempoB vs distB*tiempoA.
function generarVelocidad() {
  let dist1, dist2, half1, half2;
  do {
    dist1 = randInt(40, 320);
    dist2 = randInt(40, 320);
    half1 = randInt(2, 10);
    half2 = randInt(2, 10);
  } while (dist1 * half2 === dist2 * half1);
  const oneWins = dist1 * half2 > dist2 * half1;
  const speed1 = (dist1 * 2) / half1;
  const speed2 = (dist2 * 2) / half2;
  return {
    emoji: "🚗",
    textOne: `Recorrer ${dist1} km en ${formatHoras(half1)}`,
    textTwo: `Recorrer ${dist2} km en ${formatHoras(half2)}`,
    oneWins,
    explain:
      `Recorrer ${dist1} km en ${formatHoras(half1)} = ${formatDecimal(speed1)} km/h de media; ` +
      `recorrer ${dist2} km en ${formatHoras(half2)} = ${formatDecimal(speed2)} km/h de media — ` +
      `la ${oneWins ? "primera" : "segunda"} opción va más rápido.`,
  };
}

const ITEMS_REPARTO = [
  ["caramelos", "🍬"],
  ["cromos", "🎴"],
  ["galletas", "🍪"],
  ["globos", "🎈"],
  ["canicas", "🔵"],
];

// Reparto/ración: gana el reparto que da más unidades por persona.
// totalA/amigosA > totalB/amigosB  <=>  totalA*amigosB > totalB*amigosA
function generarReparto() {
  const [nombre, emoji] = pick(ITEMS_REPARTO);
  let total1, amigos1, total2, amigos2;
  do {
    total1 = randInt(10, 60);
    amigos1 = randInt(2, 10);
    total2 = randInt(10, 60);
    amigos2 = randInt(2, 10);
  } while (total1 * amigos2 === total2 * amigos1);
  const oneWins = total1 * amigos2 > total2 * amigos1;
  const per1 = total1 / amigos1;
  const per2 = total2 / amigos2;
  return {
    emoji,
    textOne: `Repartir ${total1} ${nombre} entre ${amigos1} amigos`,
    textTwo: `Repartir ${total2} ${nombre} entre ${amigos2} amigos`,
    oneWins,
    explain:
      `Repartir ${total1} ${nombre} entre ${amigos1} amigos = ${formatDecimal(per1)} por persona; ` +
      `repartir ${total2} ${nombre} entre ${amigos2} amigos = ${formatDecimal(per2)} por persona — ` +
      `la ${oneWins ? "primera" : "segunda"} opción da más por persona.`,
  };
}

// Exportados aparte para poder simular miles de rondas desde un script
// de verificación sin montar el DOM.
export { generarPrecio, generarVelocidad, generarReparto };

const GENERADORES = [generarPrecio, generarVelocidad, generarReparto];

export function mountPrefieresGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false; // evita doble toque mientras se resuelve la ronda
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
    locked = false;
    const data = pick(GENERADORES)();
    // Se sortea qué escenario cae en la casilla A y cuál en la B para que
    // la respuesta correcta no esté siempre en el mismo lado.
    const aIsOne = randInt(0, 1) === 0;
    const textA = aIsOne ? data.textOne : data.textTwo;
    const textB = aIsOne ? data.textTwo : data.textOne;
    const correct = data.oneWins === aIsOne ? "a" : "b";

    body.innerHTML = `
      <p class="prompt">🤔 ¿Qué prefieres?<small>Haz la cuenta y toca la opción que más conviene</small></p>
      <div class="choices pf-options">
        <button class="choice-btn pf-option" type="button" data-option="a">
          <span class="pf-emoji">${data.emoji}</span>
          <span class="pf-text">${textA}</span>
        </button>
        <button class="choice-btn pf-option" type="button" data-option="b">
          <span class="pf-emoji">${data.emoji}</span>
          <span class="pf-text">${textB}</span>
        </button>
      </div>
      <div class="feedback" data-feedback></div>
    `;
    const buttons = Array.from(body.querySelectorAll("[data-option]"));
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => choose(btn.dataset.option, correct, data.explain, buttons));
    });
  }

  function choose(picked, correct, explain, buttons) {
    if (finished || locked) return;
    locked = true;
    rounds++;
    buttons.forEach((b) => { b.disabled = true; });
    const feedback = body.querySelector("[data-feedback]");
    const correctBtn = buttons.find((b) => b.dataset.option === correct);
    correctBtn.classList.add("correct");

    if (picked === correct) {
      score += 10;
      renderScore();
      feedback.textContent = explain;
      feedback.className = "feedback ok";
      later(nextRound, 2600);
    } else {
      const wrongBtn = buttons.find((b) => b.dataset.option === picked);
      wrongBtn.classList.add("wrong");
      lives--;
      renderLives();
      feedback.textContent = explain;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 2600);
      later(nextRound, 2600);
    }
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "prefieres", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🤔</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} comparaciones resueltas</p>
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
