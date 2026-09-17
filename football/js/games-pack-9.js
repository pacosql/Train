// Segunda tanda del 17-09-2026 — tramo 1 de ejercicios nuevos.
// Fuentes de cada mecánica: ver football/README.md.
import { mountKenkenGame } from "./game-kenken.js";
import { mountHitoriGame } from "./game-hitori.js";
import { mountClaveGame } from "./game-clave.js";
import { mountPujaGame } from "./game-puja.js";
import { mountAnzueloGame } from "./game-anzuelo.js";

export const GAMES_PACK_9 = [
  { id: "kenken", title: "KenKen mini", emoji: "🔷", topic: "Operaciones y lógica", custom: mountKenkenGame },
  { id: "hitori", title: "Hitori", emoji: "⚫", topic: "Lógica de eliminación", custom: mountHitoriGame },
  { id: "clave", title: "La clave secreta", emoji: "🔐", topic: "Criptaritmos", custom: mountClaveGame },
  { id: "puja", title: "Sin pasarse de precio", emoji: "💵", topic: "Estimación y comparación", custom: mountPujaGame },
  { id: "anzuelo", title: "Pesca de factores", emoji: "🐟", topic: "Factores y divisores", custom: mountAnzueloGame },
];
