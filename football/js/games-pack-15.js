// Undécima tanda del 17-09-2026 (noche) — tramo único de ejercicios nuevos.
// Fuentes de cada mecánica: ver football/README.md.
import { mountBachetGame } from "./game-bachet.js";
import { mountSumafilaGame } from "./game-sumafila.js";
import { mountHileraGame } from "./game-hilera.js";
import { mountCrecimientoGame } from "./game-crecimiento.js";

export const GAMES_PACK_15 = [
  { id: "bachet", title: "Pesas de Bachet", emoji: "⚖️", topic: "Numeración en base 3", custom: mountBachetGame },
  { id: "sumafila", title: "La fila que cuadra", emoji: "🧮", topic: "Múltiplos", custom: mountSumafilaGame },
  { id: "hilera", title: "La hilera que sube", emoji: "🪜", topic: "Secuencias y puntuación", custom: mountHileraGame },
  { id: "crecimiento", title: "Lineal contra exponencial", emoji: "🐢", topic: "Crecimiento exponencial", custom: mountCrecimientoGame },
];
