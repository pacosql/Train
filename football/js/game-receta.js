// "Ajusta la receta": escalar los ingredientes de una receta al cambiar
// el número de raciones, multiplicando todos por el mismo factor. El
// factor se genera siempre como una fracción sencilla (num/den, con
// num y den entre 1 y 4) y las cantidades base se construyen como
// múltiplos exactos de ese denominador, así la cantidad pedida siempre
// sale limpia (entera o, como mucho, con .5) — nunca un decimal
// periódico.
import { randInt, pick, shuffle, buildChoices, saveScore } from "./utils.js";

// Factores de escalado permitidos (todos entre 1/3 y 3, para que ningún
// resultado sea absurdamente grande ni absurdamente pequeño). num !== den
// siempre, para que la ronda nunca sea trivial (factor 1 = no cambia nada).
const FACTORS = [
  { num: 1, den: 2 }, // ×1/2
  { num: 2, den: 1 }, // ×2
  { num: 3, den: 1 }, // ×3
  { num: 3, den: 2 }, // ×3/2
  { num: 1, den: 3 }, // ×1/3
  { num: 2, den: 3 }, // ×2/3
  { num: 3, den: 4 }, // ×3/4
  { num: 4, den: 3 }, // ×4/3
];

// Banco de ingredientes. `unitSize` es la cantidad que representa "1
// unidad" de ese ingrediente en su propia escala (p.ej. 50 g, o media
// taza). Las cantidades base siempre se generan como un múltiplo entero
// de `unitSize`, así toda la aritmética queda en enteros y el resultado
// escalado nunca tiene errores de coma flotante.
const INGREDIENTS = [
  { key: "harina", label: "harina", kind: "g", unitSize: 50, maxCount: 16 },
  { key: "azucar", label: "azúcar", kind: "g", unitSize: 25, maxCount: 12 },
  { key: "mantequilla", label: "mantequilla", kind: "g", unitSize: 25, maxCount: 12 },
  { key: "queso", label: "queso rallado", kind: "g", unitSize: 25, maxCount: 12 },
  { key: "chocolate", label: "chispas de chocolate", kind: "g", unitSize: 25, maxCount: 12 },
  { key: "aceite", label: "aceite", kind: "ml", unitSize: 25, maxCount: 12 },
  { key: "agua", label: "agua", kind: "ml", unitSize: 50, maxCount: 8 },
  {
    key: "leche", label: "leche", kind: "taza", unitSize: 0.5, maxCount: 6,
    unitWord: "taza", unitWordPlural: "tazas",
  },
  { key: "huevos", label: "huevo", plural: "huevos", kind: "unidad", unitSize: 1, maxCount: 6 },
  {
    key: "levadura", label: "levadura", kind: "cucharadita", unitSize: 1, maxCount: 4,
    unitWord: "cucharadita", unitWordPlural: "cucharaditas",
  },
  {
    key: "sal", label: "sal", kind: "cucharadita", unitSize: 1, maxCount: 3,
    unitWord: "cucharadita", unitWordPlural: "cucharaditas",
  },
  {
    key: "vainilla", label: "esencia de vainilla", kind: "cucharadita", unitSize: 1, maxCount: 3,
    unitWord: "cucharadita", unitWordPlural: "cucharaditas",
  },
];

function formatFactor({ num, den }) {
  return den === 1 ? `×${num}` : `×${num}/${den}`;
}

function racionesLabel(n) {
  return `${n} ${n === 1 ? "ración" : "raciones"}`;
}

// Redondea al múltiplo de `g` más cercano (g = "granularidad" propia del
// ingrediente: 0.5 para tazas, 1 para el resto).
function snap(v, g) {
  return Math.round(v / g) * g;
}

// Compara dos cantidades evitando el típico error de coma flotante de JS
// (nunca `a === b` directo cuando puede haber decimales): se comparan
// como enteros tras escalar por 100.
function sameQty(a, b) {
  return Math.round(a * 100) === Math.round(b * 100);
}

function formatTaza(qty) {
  const whole = Math.floor(qty + 1e-9);
  const frac = Math.round((qty - whole) * 2) / 2;
  if (frac === 0) return `${whole}`;
  if (whole === 0) return "1/2";
  return `${whole} 1/2`;
}

function formatIntQty(qty) {
  return `${Math.round(qty)}`;
}

// Frase completa lista para mostrar: "200 g de harina", "1/2 taza de
// leche", "3 huevos", "1 cucharadita de sal"...
function formatIngredientPhrase(qty, ing) {
  if (ing.kind === "taza") {
    const word = qty === 1 ? ing.unitWord : ing.unitWordPlural;
    return `${formatTaza(qty)} ${word} de ${ing.label}`;
  }
  if (ing.kind === "unidad") {
    const word = qty === 1 ? ing.label : ing.plural;
    return `${formatIntQty(qty)} ${word}`;
  }
  if (ing.kind === "cucharadita") {
    const word = qty === 1 ? ing.unitWord : ing.unitWordPlural;
    return `${formatIntQty(qty)} ${word} de ${ing.label}`;
  }
  // "g" o "ml"
  return `${formatIntQty(qty)} ${ing.kind} de ${ing.label}`;
}

// Distractor plausible: o bien un error de razonamiento típico (no
// escalar, invertir el factor, olvidar dividir entre el denominador), o
// bien un vecino cercano en la propia rejilla del ingrediente. Siempre
// se ajusta ("snap") a la granularidad natural del ingrediente para que
// nunca se vea un decimal raro entre las opciones.
function makeDistractor(ing, correctValue, factor) {
  const { num, den } = factor;
  const g = ing.unitSize;
  const pool = [
    ing.qtyX,
    snap((ing.qtyX * den) / num, g),
    snap(ing.qtyX * num, g),
    snap(correctValue + g * pick([1, 2, 3]), g),
    snap(correctValue - g * pick([1, 2, 3]), g),
  ];
  let v = pick(pool);
  if (sameQty(v, correctValue) || v <= 0) {
    v = correctValue + g * pick([1, -1, 2, -2, 3]);
    if (v <= 0) v = correctValue + g;
  }
  return snap(v, g);
}

// Genera una ronda completa. Exportada aparte de mountRecetaGame para
// poder testearla sin DOM (ver script de simulación).
export function generateRecetaRound() {
  const factor = pick(FACTORS);
  const { num, den } = factor;
  const k = randInt(2, 3); // raciones base entre 2 y 3 "tandas" del denominador
  const xServings = den * k;
  const yServings = k * num; // siempre entero: k * num

  const howMany = randInt(3, 4);
  const chosen = shuffle(INGREDIENTS).slice(0, howMany);

  const ingredients = chosen.map((ing) => {
    // `m` se acota por el mayor de num/den, porque la cantidad final
    // puede crecer (factor > 1) o encogerse (factor < 1): hay que dejar
    // margen en la dirección que más crezca para no acabar con
    // cantidades absurdas en ninguno de los dos sentidos.
    const mMax = Math.max(1, Math.floor(ing.maxCount / Math.max(num, den)));
    const m = randInt(1, mMax);
    const countUnits = den * m; // múltiplo exacto de den
    const qtyX = countUnits * ing.unitSize;
    const qtyY = m * num * ing.unitSize; // == qtyX * num / den, siempre limpio
    return { ...ing, qtyX, qtyY };
  });

  const askIndex = randInt(0, ingredients.length - 1);
  const asked = ingredients[askIndex];
  const correctValue = asked.qtyY;

  const choiceValues = buildChoices(correctValue, () => makeDistractor(asked, correctValue, factor), 4);

  return { xServings, yServings, factor, ingredients, askIndex, correctValue, choiceValues };
}

export function mountRecetaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false; // evita pulsar dos opciones mientras se resuelve la ronda
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
    round = generateRecetaRound();
    locked = false;
    const { xServings, yServings, factor, ingredients, askIndex } = round;
    const asked = ingredients[askIndex];

    body.innerHTML = `
      <div class="rcp-card">
        <div class="rcp-servings-row">
          <span class="rcp-servings-x">🍽️ ${racionesLabel(xServings)}</span>
          <span class="rcp-arrow">→</span>
          <span class="rcp-servings-y">${racionesLabel(yServings)}</span>
        </div>
        <div class="rcp-factor-badge">Factor ${formatFactor(factor)}</div>
        <ul class="rcp-ingredient-list">
          ${ingredients
            .map((ing, i) => `
              <li class="rcp-ingredient${i === askIndex ? " rcp-ingredient-asked" : ""}">
                ${formatIngredientPhrase(ing.qtyX, ing)}${i === askIndex ? ' <span class="rcp-ask-mark">❓</span>' : ""}
              </li>
            `)
            .join("")}
        </ul>
      </div>
      <p class="prompt">¿Qué cantidad de ${asked.label} necesitas para ${racionesLabel(yServings)}?
        <small>La receta de arriba es para ${racionesLabel(xServings)} — escala todos los ingredientes con el mismo factor.</small>
      </p>
      <div class="choices" data-choices></div>
      <div class="feedback" data-feedback></div>
    `;

    const choicesEl = body.querySelector("[data-choices]");
    const buttons = round.choiceValues.map((value) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = formatIngredientPhrase(value, asked);
      btn.dataset.value = String(value);
      choicesEl.appendChild(btn);
      return btn;
    });
    buttons.forEach((btn, i) => {
      btn.addEventListener("click", () => selectChoice(round.choiceValues[i], btn, buttons));
    });
  }

  function selectChoice(value, btn, buttons) {
    if (finished || locked) return;
    locked = true;
    buttons.forEach((b) => { b.disabled = true; });

    const { ingredients, askIndex, correctValue, yServings, factor } = round;
    const asked = ingredients[askIndex];
    const feedback = body.querySelector("[data-feedback]");
    const correct = sameQty(value, correctValue);

    if (correct) {
      btn.classList.add("correct");
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! Para ${racionesLabel(yServings)} necesitas ${formatIngredientPhrase(correctValue, asked)}.`;
      feedback.className = "feedback ok";
      later(nextRound, 1100);
      return;
    }

    btn.classList.add("wrong");
    buttons.forEach((b) => {
      if (sameQty(Number(b.dataset.value), correctValue)) b.classList.add("correct");
    });
    lives--;
    renderLives();
    feedback.textContent = `No es correcto. Para ${racionesLabel(yServings)} necesitas ${formatIngredientPhrase(correctValue, asked)} (factor ${formatFactor(factor)}).`;
    feedback.className = "feedback bad";
    if (lives <= 0) return later(() => finish(false), 1400);
    later(nextRound, 1800);
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "receta", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🍳</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} recetas ajustadas</p>
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
