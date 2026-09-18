// Decimotercera tanda del 18-09-2026 — tramo único de ejercicios nuevos.
// Fuentes de cada mecánica: ver football/README.md.
import { mountPatronfigurasGame } from "./game-patronfiguras.js";
import { mountEsquivaGame } from "./game-esquiva.js";

export const GAMES_PACK_17 = [
  { id: "patronfiguras", title: "El patrón que crece", emoji: "🌱", topic: "Patrones crecientes", custom: mountPatronfigurasGame },
  { id: "esquiva", title: "Esquiva a tiempo", emoji: "🏃", topic: "Velocidad y tiempo", custom: mountEsquivaGame },
];
