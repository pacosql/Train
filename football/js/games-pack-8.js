// Tanda del 17-09-2026 (tarde) — tramo 4 (último) de ejercicios nuevos.
// Fuentes de cada mecánica: ver football/README.md.
import { mountBlobsGame } from "./game-blobs.js";
import { mountPrefieresGame } from "./game-prefieres.js";
import { mountCoheteGame } from "./game-cohete.js";
import { mountTuercasGame } from "./game-tuercas.js";
import { mountMalabaresGame } from "./game-malabares.js";

export const GAMES_PACK_8 = [
  { id: "blobs", title: "Blobs de suma", emoji: "🫐", topic: "Sumas", custom: mountBlobsGame },
  { id: "prefieres", title: "¿Qué prefieres?", emoji: "🤔", topic: "Comparación y sentido numérico", custom: mountPrefieresGame },
  { id: "cohete", title: "Cohete exponencial", emoji: "🚀", topic: "Potencias", custom: mountCoheteGame },
  { id: "tuercas", title: "Pares de tuercas", emoji: "🔩", topic: "Paridad", custom: mountTuercasGame },
  { id: "malabares", title: "Malabares", emoji: "🤹", topic: "Múltiplos comunes", custom: mountMalabaresGame },
];
