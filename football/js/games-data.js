// Definición de los 9 juegos basados en el motor de preguntas (quiz-engine.js).
// El juego de globos (balloons-game.js) es el único con mecánica propia.
import { randInt, pick, buildChoices, shuffle } from "./utils.js";

// ---------- 1. Comparador mayor / menor (contrarreloj) ----------
function compareQuestion() {
  const a = randInt(-50, 99);
  const b = randInt(-50, 99);
  const symbol = a === b ? "=" : a > b ? ">" : "<";
  const labels = { ">": "Mayor (>)", "<": "Menor (<)", "=": "Igual (=)" };
  const correctLabel = labels[symbol];
  const choices = shuffle([labels[">"], labels["<"], labels["="]]);
  return {
    prompt: `${a} &nbsp;⚖️&nbsp; ${b}`,
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
    nums[3] = nums[0]; // garantiza una moda clara
    const counts = {};
    nums.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
    correct = Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
  }
  const choices = buildChoices(correct, () => Math.max(1, correct + pick([-3, -2, -1, 1, 2, 3]))).map(String);
  return {
    prompt: `Datos: ${nums.join(", ")}`,
    sub: `¿Cuál es la ${stat}?`,
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
  const from = pick(units);
  let to = pick(units);
  while (to === from) to = pick(units);
  const value = randInt(1, 20) * (from.name === "km" ? 1 : from.name === "m" ? 10 : 1);
  const meters = value * from.toM;
  let correct = meters / to.toM;
  correct = Math.round(correct * 1000) / 1000;
  const correctStr = Number.isInteger(correct) ? String(correct) : correct.toFixed(correct < 1 ? 3 : 1);
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
  const from = pick(units);
  let to = pick(units);
  while (to === from) to = pick(units);
  const value = randInt(1, 20) * (from.name === "g" ? 100 : 1);
  const kg = value * from.toKg;
  let correct = kg / to.toKg;
  correct = Math.round(correct * 1000) / 1000;
  const correctStr = Number.isInteger(correct) ? String(correct) : correct.toFixed(3);
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
  const total = pick([3, 4, 5, 6, 8]);
  const shaded = randInt(1, total - 1);
  const g = gcd(shaded, total);
  const correct = `${shaded / g}/${total / g}`;
  const choices = buildChoices(correct, () => {
    const s = Math.max(1, Math.min(total - 1, shaded + pick([-2, -1, 1, 2])));
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
  { id: "comparador", title: "Mayor o menor", emoji: "⚖️", topic: "Comparación", mode: "timeAttack", timeLimit: 30, generateQuestion: compareQuestion },
  { id: "calculo", title: "Cálculo veloz", emoji: "🧮", topic: "Cálculo mental", mode: "timeAttack", timeLimit: 30, generateQuestion: mentalMathQuestion },
  { id: "geometria", title: "Formas", emoji: "🔺", topic: "Geometría", mode: "lives", lives: 3, generateQuestion: geometryQuestion },
  { id: "algebra", title: "Encuentra la x", emoji: "🧩", topic: "Álgebra", mode: "lives", lives: 3, generateQuestion: algebraQuestion },
  { id: "estadistica", title: "Media y moda", emoji: "📊", topic: "Estadística", mode: "lives", lives: 3, generateQuestion: statsQuestion },
  { id: "distancias", title: "Distancias", emoji: "📏", topic: "Medidas", mode: "lives", lives: 3, generateQuestion: distanceQuestion },
  { id: "pesos", title: "Pesos", emoji: "🐘", topic: "Medidas", mode: "lives", lives: 3, generateQuestion: weightQuestion },
  { id: "fracciones", title: "La tarta", emoji: "🍕", topic: "Fracciones", mode: "lives", lives: 3, generateQuestion: fractionsQuestion },
  { id: "secuencias", title: "Secuencias", emoji: "🔢", topic: "Patrones", mode: "lives", lives: 3, generateQuestion: sequenceQuestion },
];
