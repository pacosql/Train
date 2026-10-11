// "Opción múltiple" (#175): el clásico "2 × 2 = ?" con cuatro respuestas,
// que pidió Paco tal cual como referencia de ese TIPO de ejercicio (una
// pregunta, cuatro opciones, una correcta y al acertar pasa a la
// siguiente). Usa el motor común de quiz.
//
// Los distractores no son números al azar: son los errores típicos de
// cada multiplicación (sumar en vez de multiplicar, una fila de más o de
// menos en la tabla, la tabla vecina), así que fallar dice algo.
import { randInt, shuffle } from "./utils.js";

function classicQuestion() {
  const a = randInt(2, 9);
  const b = randInt(2, 9);
  const correct = a * b;
  const typical = [a + b, a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, correct + 1, correct - 1, correct + 10];
  const set = new Set([correct]);
  for (const d of shuffle(typical)) {
    if (set.size === 4) break;
    if (d > 0) set.add(d);
  }
  const choices = shuffle([...set]);
  return {
    prompt: `<span style="font-size:2.2rem;font-weight:800">${a} × ${b} = ?</span>`,
    choices,
    correctIndex: choices.indexOf(correct),
  };
}

export const GAMES_PACK_35 = [
  { id: "opcion", title: "Opción múltiple", emoji: "☑️", topic: "Tablas de multiplicar", mode: "lives", lives: 3, generateQuestion: classicQuestion },
];
