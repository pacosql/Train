// Ejercicios #176-#185: 10 TIPOS de interacción nuevos (no temas nuevos),
// buscados por ahí siguiendo el criterio de Paco: nada de "pregunta + elige
// 1 de 4" otra vez. Cada uno tiene su propio archivo game-*.js.
import { mountCortesGame } from "./game-cortes.js";
import { mountUntrazoGame } from "./game-untrazo.js";
import { mountCaminagraficaGame } from "./game-caminagrafica.js";
import { mountOjoGame } from "./game-ojo.js";
import { mountTunelGame } from "./game-tunel.js";
import { mountVoladizoGame } from "./game-voladizo.js";
import { mountTendederoGame } from "./game-tendedero.js";
import { mountVectoresGame } from "./game-vectores.js";
import { mountJarronGame } from "./game-jarron.js";
import { mountProgramaGame } from "./game-programa.js";

export const GAMES_PACK_36 = [
  { id: "cortes", title: "Corta a partes iguales", emoji: "✂️", topic: "Fracciones y área", custom: mountCortesGame },
  { id: "untrazo", title: "De un solo trazo", emoji: "🏠", topic: "Grafos", custom: mountUntrazoGame },
  { id: "caminagrafica", title: "Camina la gráfica", emoji: "🚶", topic: "Gráficas", custom: mountCaminagraficaGame },
  { id: "ojo", title: "Ojo de geómetra", emoji: "🧐", topic: "Geometría", custom: mountOjoGame },
  { id: "tunel", title: "¿Cuándo sale del túnel?", emoji: "🚇", topic: "Velocidad", custom: mountTunelGame },
  { id: "voladizo", title: "La torre que sobresale", emoji: "🪵", topic: "Centro de masas", custom: mountVoladizoGame },
  { id: "tendedero", title: "El tendedero", emoji: "🧷", topic: "Recta numérica", custom: mountTendederoGame },
  { id: "vectores", title: "Carrera de vectores", emoji: "🏎️", topic: "Vectores", custom: mountVectoresGame },
  { id: "jarron", title: "Dibuja cómo se llena", emoji: "🏺", topic: "Tasa de cambio", custom: mountJarronGame },
  { id: "programa", title: "La abeja programadora", emoji: "🐝", topic: "Ángulos y programación", custom: mountProgramaGame },
];
