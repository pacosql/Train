// Juegos basados en el motor de preguntas (js/quiz-engine.js): cada uno
// solo aporta generateQuestion(). Primera tanda (#1-#5 de este fichero,
// numerados según su posición en js/app.js).
import { WORDS, CATEGORIES, wordsByCategory } from "./data/words.js";
import { pick, pickN, shuffle } from "./utils.js";

// Distractores sin texto duplicado (algunas palabras comparten "en" entre
// categorías: fish/orange/hot/cold/teacher) — evita dos botones idénticos
// en la misma pregunta.
function pickDistractorsByText(target, count, extraExcludeTexts = []) {
  const seen = new Set([target.en.toLowerCase(), ...extraExcludeTexts.map((t) => t.toLowerCase())]);
  const results = [];
  for (const cand of shuffle(wordsByCategory(target.cat))) {
    if (results.length >= count) break;
    const t = cand.en.toLowerCase();
    if (seen.has(t)) continue;
    seen.add(t);
    results.push(cand);
  }
  if (results.length < count) {
    for (const cand of shuffle(WORDS)) {
      if (results.length >= count) break;
      const t = cand.en.toLowerCase();
      if (seen.has(t)) continue;
      seen.add(t);
      results.push(cand);
    }
  }
  return results;
}

// Distractores con emoji distinto del objetivo (y entre sí) — algunas
// palabras comparten emoji dentro de una categoría (p.ej. bed/bedroom).
function pickDistractorsByEmoji(target, count) {
  const seen = new Set([target.emoji]);
  const results = [];
  for (const cand of shuffle(wordsByCategory(target.cat))) {
    if (results.length >= count) break;
    if (seen.has(cand.emoji)) continue;
    seen.add(cand.emoji);
    results.push(cand);
  }
  if (results.length < count) {
    for (const cand of shuffle(WORDS)) {
      if (results.length >= count) break;
      if (cand.cat === target.cat) continue;
      if (seen.has(cand.emoji)) continue;
      seen.add(cand.emoji);
      results.push(cand);
    }
  }
  return results;
}

function blankSentence(sentence, phrase) {
  const idx = sentence.toLowerCase().indexOf(phrase.toLowerCase());
  if (idx === -1) return sentence;
  return sentence.slice(0, idx) + "<b>_____</b>" + sentence.slice(idx + phrase.length);
}

// "profesor/a" -> también acepta "profesor" y "profesora"; "primo/prima"
// -> también acepta "primo" y "prima". Heurística simple para las pocas
// palabras cuya traducción varía en género.
function esAccepts(es) {
  const parts = es.split("/").map((s) => s.trim());
  if (parts.length === 1) return parts;
  const [first, second] = parts;
  const combined = second.length <= 2 ? first.slice(0, -1) + second : second;
  return [...new Set([es, first, second, combined])];
}

function genEligeImagen() {
  const w1 = pick(WORDS);
  const distractors = pickDistractorsByEmoji(w1, 3);
  const options = shuffle([w1, ...distractors]);
  return {
    prompt: `"${w1.en}"`,
    sub: CATEGORIES[w1.cat],
    choices: options.map((o) => o.emoji),
    correctIndex: options.indexOf(w1),
  };
}

function genLaIntrusa() {
  const catKeys = Object.keys(CATEGORIES);
  const catA = pick(catKeys);
  let catB = pick(catKeys);
  while (catB === catA) catB = pick(catKeys);
  const groupA = pickN(wordsByCategory(catA), 3);
  const excludeTexts = groupA.map((w) => w.en.toLowerCase());
  const oddPool = shuffle(wordsByCategory(catB));
  const odd = oddPool.find((w) => !excludeTexts.includes(w.en.toLowerCase())) || oddPool[0];
  const options = shuffle([...groupA, odd]);
  return {
    prompt: "¿Cuál es la intrusa?",
    sub: `Las otras tres son "${CATEGORIES[catA]}"`,
    choices: options.map((o) => o.en),
    correctIndex: options.indexOf(odd),
  };
}

function genEscribePalabra() {
  const w1 = pick(WORDS);
  const noSpace = w1.en.replace(/\s+/g, "");
  const hyphen = w1.en.replace(/\s+/g, "-");
  return {
    prompt: `${w1.emoji}<br><b>${w1.es}</b>`,
    sub: "Escribe la palabra en inglés",
    answer: w1.en,
    accepts: [...new Set([w1.en, noSpace, hyphen])],
  };
}

function genTraduce() {
  const w1 = pick(WORDS);
  if (Math.random() < 0.5) {
    return {
      prompt: `<b>${w1.en}</b>`,
      sub: "Traduce al español",
      answer: w1.es,
      accepts: esAccepts(w1.es),
    };
  }
  const noSpace = w1.en.replace(/\s+/g, "");
  const hyphen = w1.en.replace(/\s+/g, "-");
  return {
    prompt: `<b>${w1.es.split("/")[0]}</b>`,
    sub: "Traduce al inglés",
    answer: w1.en,
    accepts: [...new Set([w1.en, noSpace, hyphen])],
  };
}

function genCompletaFrase() {
  const w1 = pick(WORDS);
  const distractors = pickDistractorsByText(w1, 3);
  const options = shuffle([w1, ...distractors]);
  return {
    prompt: blankSentence(w1.ex, w1.en),
    sub: w1.exEs,
    choices: options.map((o) => o.en),
    correctIndex: options.indexOf(w1),
  };
}

export const QUIZ_GAMES = [
  {
    id: "elige-imagen",
    title: "Elige la imagen",
    emoji: "🖼️",
    topic: "Reconocer el significado",
    mode: "lives",
    input: "choices",
    generateQuestion: genEligeImagen,
  },
  {
    id: "la-intrusa",
    title: "La intrusa",
    emoji: "🚫",
    topic: "Campos semánticos",
    mode: "lives",
    input: "choices",
    generateQuestion: genLaIntrusa,
  },
  {
    id: "escribe-palabra",
    title: "Escribe la palabra",
    emoji: "✍️",
    topic: "Ortografía / recuerdo activo",
    mode: "lives",
    input: "text",
    inputPlaceholder: "escribe en inglés…",
    generateQuestion: genEscribePalabra,
  },
  {
    id: "traduce",
    title: "Traduce ES ↔ EN",
    emoji: "🔁",
    topic: "Traducción en las dos direcciones",
    mode: "lives",
    input: "text",
    inputPlaceholder: "escribe la traducción…",
    generateQuestion: genTraduce,
  },
  {
    id: "completa-frase",
    title: "Completa la frase",
    emoji: "🧵",
    topic: "Uso en contexto",
    mode: "lives",
    input: "choices",
    generateQuestion: genCompletaFrase,
  },
];
