// "Grupos y escaleras": inspirado en las combinaciones válidas de Rummikub.
// Cada ficha tiene un VALOR (1-13) y un COLOR (rojo/azul/amarillo/negro).
// Hay dos tipos de conjunto válido:
//  - GRUPO: 3 o 4 fichas del mismo valor, todas de color distinto entre sí.
//  - ESCALERA: 3 o más fichas del mismo color, con valores consecutivos.
// En cada mano el jugador debe tocar exactamente las fichas del conjunto
// válido más largo posible (puede haber varios sueltos, pero solo cuenta
// el/los de tamaño máximo).
import { randInt, pick, shuffle, saveScore } from "./utils.js";

export const COLORS = [
  { id: "rojo", label: "Rojo", fem: "roja", hex: "#e5484d", shape: "●" },
  { id: "azul", label: "Azul", fem: "azul", hex: "#2f6fed", shape: "▲" },
  { id: "amarillo", label: "Amarillo", fem: "amarilla", hex: "#e6b800", shape: "■" },
  { id: "negro", label: "Negro", fem: "negra", hex: "#23262e", shape: "◆" },
];
const COLOR_IDS = COLORS.map((c) => c.id);

function key(t) {
  return `${t.value}-${t.color}`;
}

// Localiza TODOS los conjuntos válidos (grupos y escaleras) presentes en una
// mano, agrupando por valor (grupos) y por color+consecutividad (escaleras).
// No hace falta recorrer los 2^n subconjuntos: un grupo solo puede ser "todas
// las fichas de un mismo valor" (a lo más 4, una por color) y una escalera
// solo puede ser "una tirada consecutiva de valores dentro de un color".
function findCombos(tiles) {
  const combos = [];

  const byValue = new Map();
  tiles.forEach((t, i) => {
    if (!byValue.has(t.value)) byValue.set(t.value, []);
    byValue.get(t.value).push(i);
  });
  for (const [value, idxs] of byValue) {
    if (idxs.length >= 3) {
      combos.push({ type: "grupo", size: idxs.length, value, idxs: idxs.slice() });
    }
  }

  const byColor = new Map();
  tiles.forEach((t, i) => {
    if (!byColor.has(t.color)) byColor.set(t.color, []);
    byColor.get(t.color).push({ value: t.value, idx: i });
  });
  for (const [color, arr] of byColor) {
    arr.sort((a, b) => a.value - b.value);
    let run = [arr[0]];
    for (let k = 1; k < arr.length; k++) {
      if (arr[k].value === run[run.length - 1].value + 1) {
        run.push(arr[k]);
      } else {
        if (run.length >= 3) {
          combos.push({ type: "escalera", size: run.length, color, values: run.map((r) => r.value), idxs: run.map((r) => r.idx) });
        }
        run = [arr[k]];
      }
    }
    if (run.length >= 3) {
      combos.push({ type: "escalera", size: run.length, color, values: run.map((r) => r.value), idxs: run.map((r) => r.idx) });
    }
  }

  return combos;
}

function maxComboSize(tiles) {
  return findCombos(tiles).reduce((m, c) => Math.max(m, c.size), 0);
}

// Comprueba si un subconjunto concreto de fichas (las que tocó el jugador)
// forma por sí mismo, en bloque, un grupo o una escalera válida. Se evalúa
// por PROPIEDAD (estructura de las fichas elegidas), no por identidad con
// la combinación que generó la ronda.
function isValidCombo(tiles) {
  if (tiles.length < 3) return null;
  const allSameValue = tiles.every((t) => t.value === tiles[0].value);
  if (allSameValue) {
    const colors = new Set(tiles.map((t) => t.color));
    if (colors.size === tiles.length && tiles.length <= 4) {
      return { type: "grupo", value: tiles[0].value, size: tiles.length };
    }
    return null;
  }
  const allSameColor = tiles.every((t) => t.color === tiles[0].color);
  if (allSameColor) {
    const values = tiles.map((t) => t.value).slice().sort((a, b) => a - b);
    for (let i = 1; i < values.length; i++) {
      if (values[i] !== values[i - 1] + 1) return null;
    }
    return { type: "escalera", color: tiles[0].color, values, size: tiles.length };
  }
  return null;
}

function numberWord(n) {
  return { 3: "tres", 4: "cuatro", 5: "cinco" }[n] || String(n);
}

function colorInfo(id) {
  return COLORS.find((c) => c.id === id);
}

// Texto explicativo de un combo, en el formato pedido:
// "el grupo de 8-8-8-8 en cuatro colores distintos, de tamaño 4"
// "la escalera roja 4-5-6-7, de tamaño 4"
function describeCombo(combo) {
  if (combo.type === "grupo") {
    const repetido = Array(combo.size).fill(combo.value).join("-");
    return `el grupo de ${repetido} en ${numberWord(combo.size)} colores distintos, de tamaño ${combo.size}`;
  }
  const valores = combo.values.join("-");
  return `la escalera ${colorInfo(combo.color).fem} ${valores}, de tamaño ${combo.size}`;
}

// Genera una ronda al revés: primero decide una combinación válida objetivo
// (grupo de 3-4 o escalera de 3-5), la coloca en la mano y añade 3-5 fichas
// señuelo verificando, tras cada una, que el tamaño máximo real de la mano
// completa no supera ni iguala en empate al de la combinación generada.
export function generateCombinaRound() {
  for (let outerTry = 0; outerTry < 2000; outerTry++) {
    const type = pick(["grupo", "escalera"]);
    let comboTiles;
    if (type === "grupo") {
      const size = pick([3, 4]);
      const value = randInt(1, 13);
      const colors = shuffle(COLOR_IDS.slice()).slice(0, size);
      comboTiles = colors.map((color) => ({ value, color }));
    } else {
      const size = pick([3, 4, 5]);
      const color = pick(COLOR_IDS);
      const start = randInt(1, 13 - size + 1);
      comboTiles = Array.from({ length: size }, (_, i) => ({ value: start + i, color }));
    }
    const targetSize = comboTiles.length;

    // Mantiene la mano final entre 7 y 9 fichas con 3-5 señuelos.
    const decoysMin = Math.max(3, 7 - targetSize);
    const decoysMax = Math.min(5, 9 - targetSize);
    const decoysCount = randInt(decoysMin, decoysMax);

    const used = new Set(comboTiles.map(key));
    let hand = comboTiles.slice();
    let ok = true;

    for (let d = 0; d < decoysCount; d++) {
      let placed = false;
      for (let attempt = 0; attempt < 300 && !placed; attempt++) {
        const candidate = { value: randInt(1, 13), color: pick(COLOR_IDS) };
        const k = key(candidate);
        if (used.has(k)) continue;
        const candidateHand = hand.concat([candidate]);
        const combos = findCombos(candidateHand);
        const maxSize = combos.reduce((m, c) => Math.max(m, c.size), 0);
        if (maxSize > targetSize) continue; // el señuelo crearía algo mayor
        const tiedAtMax = combos.filter((c) => c.size === maxSize).length;
        if (maxSize === targetSize && tiedAtMax > 1) continue; // empataría
        hand = candidateHand;
        used.add(k);
        placed = true;
      }
      if (!placed) { ok = false; break; }
    }
    if (!ok) continue;

    // Verificación final independiente antes de aceptar la ronda.
    const finalCombos = findCombos(hand);
    const finalMax = finalCombos.reduce((m, c) => Math.max(m, c.size), 0);
    const finalTied = finalCombos.filter((c) => c.size === finalMax).length;
    if (finalMax !== targetSize || finalTied !== 1) continue;

    return { tiles: shuffle(hand), comboSize: targetSize, comboType: type };
  }
  // Red de seguridad extremadamente improbable: combinación mínima sin señuelos.
  const value = randInt(1, 13);
  const colors = shuffle(COLOR_IDS.slice()).slice(0, 3);
  const tiles = colors.map((color) => ({ value, color }));
  return { tiles, comboSize: 3, comboType: "grupo" };
}

export function mountCombinaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false;
  let ronda = null;
  let selected = new Set(); // índices de fichas tocadas en esta ronda
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
    ronda = generateCombinaRound();
    selected = new Set();
    locked = false;

    body.innerHTML = `
      <p class="prompt">Toca el GRUPO o la ESCALERA más larga posible
        <small>
          Grupo: mismo valor, colores todos distintos (3 o 4 fichas).
          Escalera: mismo color, valores consecutivos (3 o más).
          ${COLORS.map((c) => `${c.shape} ${c.label}`).join(" · ")}
        </small>
      </p>
      <div class="cmb-hand" data-hand></div>
      <div class="feedback" data-feedback></div>
      <button class="primary cmb-done-btn" type="button" data-done>¡Listo!</button>
    `;

    const handEl = body.querySelector("[data-hand]");
    ronda.tiles.forEach((tile, idx) => {
      const info = colorInfo(tile.color);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `cmb-tile cmb-color-${tile.color}`;
      btn.dataset.idx = String(idx);
      btn.setAttribute("aria-label", `Ficha ${tile.value} ${info.label}`);
      btn.innerHTML = `<span class="cmb-tile-shape">${info.shape}</span><span class="cmb-tile-value">${tile.value}</span>`;
      btn.addEventListener("click", () => toggleTile(idx, btn));
      handEl.appendChild(btn);
    });
    body.querySelector("[data-done]").addEventListener("click", evaluar);
  }

  function toggleTile(idx, btn) {
    if (finished || locked) return;
    if (selected.has(idx)) {
      selected.delete(idx);
      btn.classList.remove("cmb-selected");
    } else {
      selected.add(idx);
      btn.classList.add("cmb-selected");
    }
  }

  function evaluar() {
    if (finished || locked) return;
    locked = true;
    const feedback = body.querySelector("[data-feedback]");
    const selectedTiles = Array.from(selected).map((i) => ronda.tiles[i]);
    const submitted = isValidCombo(selectedTiles);

    const allCombos = findCombos(ronda.tiles);
    const maxSize = allCombos.reduce((m, c) => Math.max(m, c.size), 0);
    const referencia = allCombos.find((c) => c.size === maxSize);

    rounds++;
    if (submitted && submitted.size === maxSize) {
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! Formaste ${describeCombo(submitted)}.`;
      feedback.className = "feedback ok";
      later(() => { locked = false; nextRound(); }, 900);
      return;
    }

    lives--;
    renderLives();
    feedback.textContent = `No era esa. La combinación más larga era ${describeCombo(referencia)}.`;
    feedback.className = "feedback bad";
    if (lives <= 0) return later(() => finish(false), 1400);
    later(() => { locked = false; nextRound(); }, 1800);
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "combina", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔢</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} manos resueltas</p>
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
