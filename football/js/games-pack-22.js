// Decimoctava tanda del 18-09-2026 — tramo único de ejercicios nuevos.
// Fuentes de cada mecánica: ver football/README.md.
import { mountRascacielosGame } from "./game-rascacielos.js";
import { mountDardosGame } from "./game-dardos.js";

export const GAMES_PACK_22 = [
  { id: "rascacielos", title: "Skyline de rascacielos", emoji: "🏙️", topic: "Visibilidad y máximos", custom: mountRascacielosGame },
  { id: "dardos", title: "Cierra la partida", emoji: "🎯", topic: "Resta con restricción", custom: mountDardosGame },
];
