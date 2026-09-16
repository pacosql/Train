// Segunda tanda de juegos basados en el motor de quiz (js/quiz-engine.js).
// Igual que games-data.js, pero con temas nuevos: problemas de palabras,
// números romanos, redondeo, precios, gráficos, factores, tiempo y
// negativos. Los distractores siempre se sortean en todo el rango
// plausible (nunca en una ventana estrecha ±1/±2) — un rango estrecho
// puede no alcanzar suficientes valores distintos según el punto de
// partida, como se descubrió y corrigió en games-data.js.
import { randInt, pick, shuffle, buildChoices } from "./utils.js";

// ---------- 21. Problemas de palabras ----------
function wordProblemQuestion() {
  const type = pick(["add", "sub", "mult", "div"]);
  let prompt, correct;
  if (type === "add") {
    const a = randInt(5, 40), b = randInt(3, 30);
    prompt = `Ana tiene ${a} caramelos y le regalan ${b} más. ¿Cuántos tiene ahora?`;
    correct = a + b;
  } else if (type === "sub") {
    const a = randInt(15, 50), b = randInt(3, a - 2);
    prompt = `Había ${a} pájaros en el árbol y se fueron volando ${b}. ¿Cuántos quedan?`;
    correct = a - b;
  } else if (type === "mult") {
    const a = randInt(3, 9), b = randInt(3, 9);
    prompt = `Hay ${a} cajas con ${b} manzanas cada una. ¿Cuántas manzanas hay en total?`;
    correct = a * b;
  } else {
    const b = randInt(2, 9), correctDiv = randInt(2, 9);
    const a = b * correctDiv;
    prompt = `Se reparten ${a} caramelos entre ${b} niños a partes iguales. ¿Cuántos le tocan a cada uno?`;
    correct = correctDiv;
  }
  const choices = buildChoices(correct, () => Math.max(0, correct + randInt(-6, 6))).map(String);
  return { prompt, choices, correctIndex: choices.indexOf(String(correct)) };
}

// ---------- 22. Números romanos ----------
const ROMAN_MAP = [[50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
function toRoman(n) {
  let out = "";
  let rem = n;
  for (const [val, sym] of ROMAN_MAP) {
    while (rem >= val) {
      out += sym;
      rem -= val;
    }
  }
  return out;
}
function romanQuestion() {
  const n = randInt(1, 49);
  const toValue = Math.random() < 0.5;
  if (toValue) {
    const choices = buildChoices(n, () => Math.max(1, n + randInt(-8, 8))).map(String);
    return {
      prompt: `¿Qué número es <b>${toRoman(n)}</b>?`,
      choices,
      correctIndex: choices.indexOf(String(n)),
    };
  }
  const correct = toRoman(n);
  const choices = buildChoices(correct, () => toRoman(Math.max(1, n + randInt(-8, 8)))).map(String);
  return {
    prompt: `¿Cómo se escribe <b>${n}</b> en números romanos?`,
    choices,
    correctIndex: choices.indexOf(correct),
  };
}

// ---------- 23. Redondea ----------
function roundingQuestion() {
  const toHundred = Math.random() < 0.4;
  const n = toHundred ? randInt(105, 985) : randInt(11, 985);
  const unit = toHundred ? 100 : 10;
  const correct = Math.round(n / unit) * unit;
  const choices = buildChoices(correct, () => Math.max(0, correct + pick([-unit, -unit * 2, unit, unit * 2]))).map(String);
  return {
    prompt: `Redondea <b>${n}</b> a la ${toHundred ? "centena" : "decena"} más cercana`,
    choices,
    correctIndex: choices.indexOf(String(correct)),
  };
}

// ---------- 24. ¿Qué es más barato? ----------
function priceQuestion() {
  const qtyA = randInt(2, 8), qtyB = randInt(2, 8);
  const priceA = Math.round((randInt(10, 30) * qtyA) / 10) / 10 + randInt(0, 2);
  const priceB = Math.round((randInt(10, 30) * qtyB) / 10) / 10 + randInt(0, 2);
  const unitA = Math.round((priceA / qtyA) * 100) / 100;
  const unitB = Math.round((priceB / qtyB) * 100) / 100;
  let correctLabel;
  if (Math.abs(unitA - unitB) < 0.01) correctLabel = "Cuestan igual";
  else correctLabel = unitA < unitB ? "Paquete A" : "Paquete B";
  const choices = shuffle(["Paquete A", "Paquete B", "Cuestan igual"]);
  return {
    prompt: `📦 A: ${qtyA} unidades por ${priceA.toFixed(2)} €<br>📦 B: ${qtyB} unidades por ${priceB.toFixed(2)} €`,
    sub: "¿Cuál sale más barato por unidad?",
    choices,
    correctIndex: choices.indexOf(correctLabel),
  };
}

// ---------- 25. Lee el gráfico ----------
const CHART_ITEMS = ["🍎 Manzanas", "🍌 Plátanos", "🍇 Uvas", "🍊 Naranjas"];
function barsSvg(values) {
  const max = Math.max(...values);
  const w = 22, gap = 8, h = 90;
  let bars = "";
  values.forEach((v, i) => {
    const barH = (v / max) * h;
    const x = i * (w + gap) + 6;
    bars += `<rect x="${x}" y="${h - barH + 8}" width="${w}" height="${barH}" fill="var(--accent-2)" rx="3"/>`;
    bars += `<text x="${x + w / 2}" y="${h + 22}" font-size="8" text-anchor="middle" fill="var(--muted)">${i + 1}</text>`;
  });
  return `<svg width="140" height="120" viewBox="0 0 140 120">${bars}</svg>`;
}
function distinctValues() {
  // 4 valores únicos: si hay dos barras empatadas en el valor máximo o
  // mínimo, "¿qué barra es la más alta?" no tiene una única respuesta
  // correcta — se descubrió que pasaba en ~7% de las rondas.
  const set = new Set();
  while (set.size < 4) set.add(randInt(2, 15));
  return Array.from(set);
}
function chartQuestion() {
  const values = distinctValues();
  const askValue = Math.random() < 0.5;
  if (askValue) {
    const idx = randInt(0, 3);
    const correct = values[idx];
    const choices = buildChoices(correct, () => Math.max(1, correct + randInt(-5, 5))).map(String);
    return {
      prompt: `${barsSvg(values)}<br>¿Cuál es el valor de la barra ${idx + 1}?`,
      choices,
      correctIndex: choices.indexOf(String(correct)),
    };
  }
  const wantMax = Math.random() < 0.5;
  const target = wantMax ? Math.max(...values) : Math.min(...values);
  const correctIdx = values.indexOf(target);
  const choices = ["1", "2", "3", "4"];
  return {
    prompt: `${barsSvg(values)}<br>¿Qué barra es la ${wantMax ? "más alta" : "más baja"}?`,
    choices,
    correctIndex: correctIdx,
  };
}

// ---------- 26. Árbol de factores ----------
function factorsQuestion() {
  // n al azar en [12,60] puede salir primo (sin factores propios) ~25% de
  // las veces, dejando la pregunta sin respuesta correcta posible.
  // Construir n como producto de dos factores garantiza que sea compuesto,
  // pero un n pequeño (p.ej. 4 = 2×2) apenas deja números entre 2 y n-1
  // para sacar 3 distractores que no sean factores — hace falta también
  // un n con margen suficiente.
  let n, factors;
  let guard = 0;
  do {
    n = randInt(2, 9) * randInt(2, 9);
    factors = [];
    for (let i = 2; i < n; i++) if (n % i === 0) factors.push(i);
    guard++;
  } while (n - 2 - factors.length < 3 && guard < 30);
  const correct = pick(factors);
  const choices = buildChoices(correct, () => {
    let d = randInt(2, n - 1);
    let guard = 0;
    while (n % d === 0 && guard < 20) {
      d = randInt(2, n - 1);
      guard++;
    }
    return d;
  }).map(String);
  return {
    prompt: `¿Cuál de estos números es un factor de <b>${n}</b>?`,
    sub: `(divide a ${n} exactamente, sin resto)`,
    choices,
    correctIndex: choices.indexOf(String(correct)),
  };
}

// ---------- 27. Tiempo transcurrido ----------
function elapsedQuestion() {
  const h1 = randInt(1, 10);
  const m1 = pick([0, 15, 30, 45]);
  const durMin = pick([15, 30, 45, 60, 75, 90, 120]);
  const totalStart = h1 * 60 + m1;
  const totalEnd = totalStart + durMin;
  const h2 = Math.floor(totalEnd / 60) % 24;
  const m2 = totalEnd % 60;
  const fmt = (h, m) => `${h}:${String(m).padStart(2, "0")}`;
  const correct = durMin;
  const label = (mins) => (mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60 ? (mins % 60) + "min" : ""}`.trim() : `${mins} min`);
  const choices = buildChoices(correct, () => Math.max(5, correct + pick([-30, -15, 15, 30, 45]))).map(label);
  return {
    prompt: `Un tren sale a las ${fmt(h1, m1)} y llega a las ${fmt(h2, m2)}`,
    sub: "¿Cuánto dura el viaje?",
    choices,
    correctIndex: choices.indexOf(label(correct)),
  };
}

// ---------- 28. Temperaturas (negativos) ----------
function temperatureQuestion() {
  const start = randInt(-10, 15);
  const drop = Math.random() < 0.5;
  const delta = randInt(3, 20);
  const correct = drop ? start - delta : start + delta;
  const choices = buildChoices(correct, () => correct + randInt(-6, 6)).map(String);
  return {
    prompt: `🌡️ Hacía ${start}°C y la temperatura ${drop ? "bajó" : "subió"} ${delta}°C`,
    sub: "¿Qué temperatura hay ahora?",
    choices,
    correctIndex: choices.indexOf(String(correct)),
    // El resultado puede ser bajo cero: el teclado necesita el botón ±.
    allowNegative: true,
  };
}

// ---------- 29. Completa el patrón (visual, no numérico) ----------
const TILE_POOL = ["🔴", "🔵", "🟢", "🟡", "🟣", "🟠"];
function patternQuestion() {
  const unitLen = pick([2, 3]);
  const unit = shuffle(TILE_POOL).slice(0, unitLen);
  const seqLen = 7;
  const seq = Array.from({ length: seqLen }, (_, i) => unit[i % unitLen]);
  const correct = unit[seqLen % unitLen];
  const others = TILE_POOL.filter((t) => t !== correct);
  const choices = shuffle([correct, ...shuffle(others).slice(0, 3)]);
  return {
    prompt: `${seq.join(" ")} &nbsp; <b>?</b>`,
    sub: "¿Qué sigue en el patrón?",
    choices,
    correctIndex: choices.indexOf(correct),
  };
}

export const QUIZ_GAMES_2 = [
  { id: "problemas", title: "Problemas de palabras", emoji: "📖", topic: "Problemas", mode: "lives", lives: 3, v: 2, input: "keypad", generateQuestion: wordProblemQuestion },
  { id: "romanos", title: "Números romanos", emoji: "🏛️", topic: "Numeración", mode: "lives", lives: 3, generateQuestion: romanQuestion },
  { id: "redondeo", title: "Redondea", emoji: "🔘", topic: "Redondeo", mode: "lives", lives: 3, generateQuestion: roundingQuestion },
  { id: "precios", title: "¿Qué es más barato?", emoji: "🏷️", topic: "Dinero", mode: "lives", lives: 3, generateQuestion: priceQuestion },
  { id: "grafico", title: "Lee el gráfico", emoji: "📈", topic: "Datos", mode: "lives", lives: 3, generateQuestion: chartQuestion },
  { id: "factores", title: "Árbol de factores", emoji: "🌳", topic: "Divisibilidad", mode: "lives", lives: 3, generateQuestion: factorsQuestion },
  { id: "transcurrido", title: "Tiempo transcurrido", emoji: "⏳", topic: "Tiempo", mode: "lives", lives: 3, generateQuestion: elapsedQuestion },
  { id: "temperaturas", title: "Temperaturas", emoji: "🌡️", topic: "Negativos", mode: "lives", lives: 3, v: 2, input: "keypad", generateQuestion: temperatureQuestion },
  { id: "patron", title: "Completa el patrón", emoji: "🧵", topic: "Patrones visuales", mode: "lives", lives: 3, generateQuestion: patternQuestion },
];
