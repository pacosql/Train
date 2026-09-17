// Tanda del 17-09-2026 (tarde) — tramo 3 de ejercicios nuevos.
// Fuentes de cada mecánica: ver football/README.md.
import { mountCorralGame } from "./game-corral.js";
import { mountTicketGame } from "./game-ticket.js";
import { mountFermiGame } from "./game-fermi.js";
import { mountSobresGame } from "./game-sobres.js";
import { mountVelocidadGame } from "./game-velocidad.js";
import { mountIntrusoGame } from "./game-intruso.js";

export const GAMES_PACK_7 = [
  { id: "corral", title: "Hueveras", emoji: "🐔", topic: "División con resto", custom: mountCorralGame },
  { id: "ticket", title: "El ticket incompleto", emoji: "🧾", topic: "Resta e incógnita", custom: mountTicketGame },
  { id: "fermi", title: "¿De qué orden?", emoji: "🔭", topic: "Estimación", custom: mountFermiGame },
  { id: "sobres", title: "Reparte la paga", emoji: "💌", topic: "Porcentajes", custom: mountSobresGame },
  { id: "velocidad", title: "¿Dónde se cruzan?", emoji: "🚂", topic: "Velocidad", custom: mountVelocidadGame },
  { id: "intruso", title: "El intruso", emoji: "🕵️", topic: "Propiedades de los números", custom: mountIntrusoGame },
];
