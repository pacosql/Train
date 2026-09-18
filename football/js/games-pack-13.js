// Novena tanda del 17-09-2026 (tarde) — tramo único de ejercicios nuevos.
// Fuentes de cada mecánica: ver football/README.md.
import { mountTirasGame } from "./game-tiras.js";
import { mountEnigmaGame } from "./game-enigma.js";
import { mountMaxminGame } from "./game-maxmin.js";
import { mountIgualaGame } from "./game-iguala.js";
import { mountHornadaGame } from "./game-hornada.js";

export const GAMES_PACK_13 = [
  { id: "tiras", title: "Diagrama de tiras", emoji: "📊", topic: "Razones y reparto proporcional", custom: mountTirasGame },
  { id: "enigma", title: "Máquina de cifrado", emoji: "🔐", topic: "Aritmética modular", custom: mountEnigmaGame },
  { id: "maxmin", title: "Panel de vuelos", emoji: "✈️", topic: "Valor posicional", custom: mountMaxminGame },
  { id: "iguala", title: "Iguala el relleno", emoji: "🎚️", topic: "Porcentajes", custom: mountIgualaGame },
  { id: "hornada", title: "La hornada con un fallo", emoji: "🥐", topic: "Secuencias", custom: mountHornadaGame },
];
