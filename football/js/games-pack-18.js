// Decimocuarta tanda del 18-09-2026 — tramo único de ejercicios nuevos.
// Fuentes de cada mecánica: ver football/README.md.
import { mountAsesinoGame } from "./game-asesino.js";
import { mountClasificacionGame } from "./game-clasificacion.js";

export const GAMES_PACK_18 = [
  { id: "asesino", title: "Sudoku asesino mini", emoji: "🔪", topic: "Sudoku con jaulas", custom: mountAsesinoGame },
  { id: "clasificacion", title: "La clasificación", emoji: "⚽", topic: "Puntos por resultado", custom: mountClasificacionGame },
];
