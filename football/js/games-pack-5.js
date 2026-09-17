// Tanda del 17-09-2026 (tarde) — tramo 1 de ejercicios nuevos.
// Fuentes de cada mecánica: ver football/README.md.
import { mountCodigoGame } from "./game-codigo.js";
import { mountTrioGame } from "./game-trio.js";
import { mountDesplegableGame } from "./game-desplegable.js";
import { mountSuma10Game } from "./game-suma10.js";
import { mountJarrasGame } from "./game-jarras.js";
import { mountGolpevistaGame } from "./game-golpevista.js";

export const GAMES_PACK_5 = [
  { id: "codigo", title: "Rompe el código", emoji: "🔑", topic: "Valor posicional", custom: mountCodigoGame },
  { id: "trio", title: "Trío", emoji: "🎴", topic: "Lógica y atributos", custom: mountTrioGame },
  { id: "desplegable", title: "¿Qué cubo sale?", emoji: "📦", topic: "Geometría espacial", custom: mountDesplegableGame },
  { id: "suma10", title: "Caen diez", emoji: "🧲", topic: "Sumas", custom: mountSuma10Game },
  { id: "jarras", title: "Las jarras", emoji: "🫙", topic: "Capacidad y lógica", custom: mountJarrasGame },
  { id: "golpevista", title: "Golpe de vista", emoji: "👁️", topic: "Número sense", custom: mountGolpevistaGame },
];
