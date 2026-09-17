// Definición de los 9 juegos basados en el motor de preguntas (quiz-engine.js).
// El juego de globos (balloons-game.js) es el único con mecánica propia.
import { randInt, pick, buildChoices, shuffle } from "./utils.js";

// ---------- 1. Comparador mayor / menor (contrarreloj) ----------
// v2: los dos números ya no se leen sueltos sobre una balanza decorativa;
// se sitúan sobre una recta numérica compartida, que es lo que de verdad
// explica por qué uno es mayor que otro (y sostiene los negativos).
function compareLineSvg(a, b) {
  const min = -50, max = 99;
  const pos = (v) => ((v - min) / (max - min)) * 100;
  const zero = pos(0);
  return `
    <svg class="cmp-line" viewBox="0 0 100 34" preserveAspectRatio="none">
      <line x1="0" y1="20" x2="100" y2="20" stroke="var(--border)" stroke-width="1.2"/>
      <line x1="${zero}" y1="15" x2="${zero}" y2="25" stroke="var(--muted)" stroke-width="0.8"/>
      <circle cx="${pos(a)}" cy="20" r="3.4" fill="var(--accent)"/>
      <circle cx="${pos(b)}" cy="20" r="3.4" fill="var(--accent-2)"/>
      <text x="${pos(a)}" y="11" font-size="7" text-anchor="middle" fill="var(--accent)">${a}</text>
      <text x="${pos(b)}" y="32" font-size="7" text-anchor="middle" fill="var(--accent-2)">${b}</text>
    </svg>`;
}
function compareQuestion() {
  const a = randInt(-50, 99);
  const b = randInt(-50, 99);
  const symbol = a === b ? "=" : a > b ? ">" : "<";
  const labels = { ">": "A es mayor", "<": "B es mayor", "=": "Son iguales" };
  const correctLabel = labels[symbol];
  const choices = shuffle([labels[">"], labels["<"], labels["="]]);
  return {
    prompt: `${compareLineSvg(a, b)}<br><span class="cmp-a">A = ${a}</span> &nbsp; <span class="cmp-b">B = ${b}</span>`,
    sub: "¿Qué relación es correcta?",
    choices,
    correctIndex: choices.indexOf(correctLabel),
  };
}

// ---------- 2. Cálculo mental (contrarreloj) ----------
function mentalMathQuestion() {
  const op = pick(["+", "-", "×"]);
  let a, b, correct;
  if (op === "+") { a = randInt(2, 60); b = randInt(2, 60); correct = a + b; }
  else if (op === "-") { a = randInt(10, 90); b = randInt(2, a); correct = a - b; }
  else { a = randInt(2, 12); b = randInt(2, 12); correct = a * b; }
  const choices = buildChoices(correct, () => correct + pick([-10, -5, -3, -2, -1, 1, 2, 3, 5, 10]), 4)
    .map(String);
  return {
    prompt: `${a} ${op} ${b} = ?`,
    choices,
    correctIndex: choices.indexOf(String(correct)),
  };
}

// ---------- 3. Geometría ----------
const SHAPES = [
  { name: "Triángulo", sides: 3, svg: `<polygon points="50,8 92,88 8,88"/>` },
  { name: "Cuadrado", sides: 4, svg: `<rect x="12" y="12" width="76" height="76"/>` },
  { name: "Rectángulo", sides: 4, svg: `<rect x="6" y="24" width="88" height="52"/>` },
  { name: "Pentágono", sides: 5, svg: `<polygon points="50,6 92,38 76,90 24,90 8,38"/>` },
  { name: "Hexágono", sides: 6, svg: `<polygon points="28,6 72,6 94,50 72,94 28,94 6,50"/>` },
  { name: "Círculo", sides: 0, svg: `<circle cx="50" cy="50" r="44"/>` },
];
function shapeSvg(shape) {
  return `<svg width="110" height="110" viewBox="0 0 100 100" fill="var(--accent)">${shape.svg}</svg>`;
}
function geometryQuestion() {
  const shape = pick(SHAPES);
  if (shape.sides > 0 && Math.random() < 0.5) {
    const choices = buildChoices(shape.sides, () => randInt(3, 8)).map(String);
    return {
      prompt: `${shapeSvg(shape)}<br>¿Cuántos lados tiene?`,
      choices,
      correctIndex: choices.indexOf(String(shape.sides)),
    };
  }
  const others = SHAPES.filter((s) => s.name !== shape.name);
  const choices = shuffle([shape.name, ...shuffle(others).slice(0, 3).map((s) => s.name)]);
  return {
    prompt: `${shapeSvg(shape)}<br>¿Qué figura es?`,
    choices,
    correctIndex: choices.indexOf(shape.name),
  };
}

// ---------- 4. Álgebra: encuentra la x ----------
function algebraQuestion() {
  const x = randInt(1, 12);
  const b = randInt(1, 15);
  const op = pick(["+", "-", "×"]);
  let prompt, correct = x;
  if (op === "+") prompt = `x + ${b} = ${x + b}`;
  else if (op === "-") prompt = `x - ${b} = ${x - b}`;
  else prompt = `x × ${b} = ${x * b}`;
  const choices = buildChoices(correct, () => correct + pick([-3, -2, -1, 1, 2, 3])).map(String);
  return {
    prompt: `⚖️ ${prompt}`,
    sub: "¿Cuánto vale x?",
    choices,
    correctIndex: choices.indexOf(String(correct)),
  };
}

// ---------- 5. Estadística: media / mediana / moda ----------
function statsQuestion() {
  const n = 5;
  const nums = Array.from({ length: n }, () => randInt(1, 20));
  const stat = pick(["media", "mediana", "moda"]);
  let correct;
  if (stat === "media") {
    correct = Math.round((nums.reduce((s, v) => s + v, 0) / n) * 10) / 10;
  } else if (stat === "mediana") {
    const sorted = [...nums].sort((a, b) => a - b);
    correct = sorted[Math.floor(n / 2)];
  } else {
    // Fuerza una moda inequívoca: nums[0] repetido dos veces y el resto de
    // valores pairwise distintos entre sí (si no, con nums al azar hay ~15%
    // de rondas donde dos números "de relleno" coinciden por casualidad y
    // crean un empate de moda ambiguo).
    nums[3] = nums[0];
    for (let i = 1; i < n; i++) {
      if (i === 3) continue;
      let guard = 0;
      while (nums.some((v, j) => j !== i && v === nums[i]) && guard < 50) {
        nums[i] = randInt(1, 20);
        guard++;
      }
    }
    const counts = {};
    nums.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
    correct = Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
  }
  const choices = buildChoices(correct, () => Math.max(1, correct + pick([-3, -2, -1, 1, 2, 3]))).map(String);
  // v2: los datos se presentan como fichas y, en las rondas de mediana,
  // ordenados de menor a mayor — leerlos en fila apelotonados hacía la
  // pregunta más de lectura que de estadística.
  const shownNums = stat === "mediana" ? [...nums].sort((a, b) => a - b) : nums;
  const cards = shownNums.map((v) => `<span class="data-chip">${v}</span>`).join("");
  return {
    prompt: `<span class="data-row">${cards}</span>`,
    sub: `¿Cuál es la ${stat}?${stat === "mediana" ? " (ya están ordenados)" : ""}`,
    choices,
    correctIndex: choices.indexOf(String(correct)),
  };
}

// ---------- 6. Distancias: conversión de unidades ----------
function distanceQuestion() {
  const units = [
    { name: "mm", toM: 0.001 },
    { name: "cm", toM: 0.01 },
    { name: "m", toM: 1 },
    { name: "km", toM: 1000 },
  ];
  // Saltos de magnitud grandes (p.ej. mm → km) hacen que el resultado
  // redondeado a 3 decimales colapse a "0" — una pregunta rota con una
  // única opción posible. Regenera la ronda hasta obtener un resultado
  // real y no degenerado.
  let from, to, value, correct, correctStr;
  let guard = 0;
  do {
    from = pick(units);
    to = pick(units);
    while (to === from) to = pick(units);
    value = randInt(1, 20) * (from.name === "km" ? 1 : from.name === "m" ? 10 : 1);
    const meters = value * from.toM;
    correct = Math.round((meters / to.toM) * 1000) / 1000;
    correctStr = Number.isInteger(correct) ? String(correct) : correct.toFixed(correct < 1 ? 3 : 1);
    guard++;
  } while (correct === 0 && guard < 30);
  const choices = buildChoices(correctStr, () => {
    const factor = pick([0.1, 0.5, 2, 10]);
    const d = correct * factor;
    return Number.isInteger(d) ? String(d) : d.toFixed(correct < 1 ? 3 : 1);
  }).map(String);
  return {
    prompt: `${value} ${from.name} = ? ${to.name}`,
    choices,
    correctIndex: choices.indexOf(correctStr),
  };
}

// ---------- 7. Pesos: conversión de unidades ----------
function weightQuestion() {
  const units = [
    { name: "g", toKg: 0.001 },
    { name: "kg", toKg: 1 },
    { name: "t", toKg: 1000 },
  ];
  // Mismo problema que en distancias: g → t con valores pequeños puede
  // redondear a "0". Regenera hasta obtener un resultado no degenerado.
  let from, to, value, correct, correctStr;
  let guard = 0;
  do {
    from = pick(units);
    to = pick(units);
    while (to === from) to = pick(units);
    value = randInt(1, 20) * (from.name === "g" ? 100 : 1);
    const kg = value * from.toKg;
    correct = Math.round((kg / to.toKg) * 1000) / 1000;
    correctStr = Number.isInteger(correct) ? String(correct) : correct.toFixed(3);
    guard++;
  } while (correct === 0 && guard < 30);
  const choices = buildChoices(correctStr, () => {
    const factor = pick([0.1, 0.5, 2, 10]);
    const d = correct * factor;
    return Number.isInteger(d) ? String(d) : d.toFixed(3);
  }).map(String);
  return {
    prompt: `${value} ${from.name} = ? ${to.name}`,
    choices,
    correctIndex: choices.indexOf(correctStr),
  };
}

// ---------- 8. Fracciones: la tarta ----------
function pieSvg(total, shaded) {
  const r = 46, cx = 50, cy = 50;
  let paths = "";
  for (let i = 0; i < total; i++) {
    const a0 = (i / total) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / total) * 2 * Math.PI - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const fill = i < shaded ? "var(--accent)" : "var(--border)";
    paths += `<path d="M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} Z" fill="${fill}" stroke="var(--card)" stroke-width="1.5"/>`;
  }
  return `<svg width="110" height="110" viewBox="0 0 100 100">${paths}</svg>`;
}
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function fractionsQuestion() {
  // total=3 solo admite 2 fracciones distintas posibles (1/3, 2/3) y
  // total=4 solo 3 (1/4, 1/2, 3/4) — con menos de 4 opciones reales,
  // buildChoices no puede rellenar el cuadro de 4 respuestas y la ronda
  // sale con menos botones de los que debería. Se excluyen ambos.
  const total = pick([5, 6, 8, 10, 12]);
  const shaded = randInt(1, total - 1);
  const g = gcd(shaded, total);
  const correct = `${shaded / g}/${total / g}`;
  // Un offset estrecho (±1/±2) no siempre alcanza a "ver" las 3 fracciones
  // distintas que hacen falta desde algunos valores de shaded (p.ej. desde
  // 1/5 solo se alcanzaban 2/5 y 3/5, nunca 4/5) — sorteando en todo el
  // rango [1, total-1] sí se garantizan 4 opciones distintas siempre.
  const choices = buildChoices(correct, () => {
    const s = randInt(1, total - 1);
    const gg = gcd(s, total);
    return `${s / gg}/${total / gg}`;
  }).map(String);
  return {
    prompt: `${pieSvg(total, shaded)}<br>¿Qué fracción está sombreada?`,
    choices,
    correctIndex: choices.indexOf(correct),
  };
}

// ---------- 9. Secuencias: ¿qué número sigue? ----------
function sequenceQuestion() {
  const type = pick(["arith", "geom", "fib-like"]);
  let seq = [], correct;
  if (type === "arith") {
    const start = randInt(1, 20);
    const step = randInt(2, 9) * pick([1, -1]);
    seq = Array.from({ length: 4 }, (_, i) => start + step * i);
    correct = start + step * 4;
  } else if (type === "geom") {
    const start = randInt(1, 5);
    const ratio = randInt(2, 3);
    seq = Array.from({ length: 4 }, (_, i) => start * ratio ** i);
    correct = start * ratio ** 4;
  } else {
    let a = randInt(1, 5), b = randInt(1, 5);
    seq = [a, b];
    for (let i = 0; i < 2; i++) { const c = a + b; seq.push(c); a = b; b = c; }
    correct = seq[seq.length - 1] + seq[seq.length - 2];
  }
  const choices = buildChoices(correct, () => correct + pick([-4, -3, -2, -1, 1, 2, 3, 4])).map(String);
  return {
    prompt: `${seq.join(",  ")},  ?`,
    sub: "¿Qué número sigue?",
    choices,
    correctIndex: choices.indexOf(String(correct)),
  };
}

export const QUIZ_GAMES = [
  { id: "comparador", title: "Mayor o menor", emoji: "⚖️", topic: "Comparación", mode: "timeAttack", timeLimit: 30, v: 2, generateQuestion: compareQuestion },
  { id: "calculo", title: "Cálculo veloz", emoji: "🧮", topic: "Cálculo mental", mode: "timeAttack", timeLimit: 30, v: 2, input: "keypad", generateQuestion: mentalMathQuestion },
  { id: "geometria", title: "Formas", emoji: "🔺", topic: "Geometría", mode: "lives", lives: 3, generateQuestion: geometryQuestion },
  { id: "algebra", title: "Encuentra la x", emoji: "🧩", topic: "Álgebra", mode: "lives", lives: 3, generateQuestion: algebraQuestion },
  { id: "estadistica", title: "Media y moda", emoji: "📊", topic: "Estadística", mode: "lives", lives: 3, v: 2, generateQuestion: statsQuestion },
  { id: "distancias", title: "Distancias", emoji: "📏", topic: "Medidas", mode: "lives", lives: 3, generateQuestion: distanceQuestion },
  { id: "pesos", title: "Pesos", emoji: "🐘", topic: "Medidas", mode: "lives", lives: 3, generateQuestion: weightQuestion },
  { id: "fracciones", title: "La tarta", emoji: "🍕", topic: "Fracciones", mode: "lives", lives: 3, generateQuestion: fractionsQuestion },
  { id: "secuencias", title: "Secuencias", emoji: "🔢", topic: "Patrones", mode: "lives", lives: 3, generateQuestion: sequenceQuestion },
];
