// Decimosexta tanda del 18-09-2026 — tramo único de ejercicios nuevos.
// Fuentes de cada mecánica: ver football/README.md.
import { mountPitagorasGame } from "./game-pitagoras.js";
import { mountCaminosGame } from "./game-caminos.js";

export const GAMES_PACK_20 = [
  { id: "pitagoras", title: "Escalera y pared", emoji: "📐", topic: "Teorema de Pitágoras", custom: mountPitagorasGame },
  { id: "caminos", title: "Cuadrícula de caminos", emoji: "🧩", topic: "Combinatoria", custom: mountCaminosGame },
];
