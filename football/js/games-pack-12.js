// Octava tanda del 17-09-2026 (tarde) — tramo único de ejercicios nuevos.
// Fuentes de cada mecánica: ver football/README.md.
import { mountRegletasGame } from "./game-regletas.js";
import { mountBonos10Game } from "./game-bonos10.js";
import { mountObjetivoGame } from "./game-objetivo.js";
import { mountFlashGame } from "./game-flash.js";
import { mountGeoclavosGame } from "./game-geoclavos.js";
import { mountEstadisticasGame } from "./game-estadisticas.js";

export const GAMES_PACK_12 = [
  { id: "regletas", title: "Regletas relativas", emoji: "🟧", topic: "Fracciones equivalentes", custom: mountRegletasGame },
  { id: "bonos10", title: "Bonos de agujeros", emoji: "🔵", topic: "Number bonds / subitizing", custom: mountBonos10Game },
  { id: "objetivo", title: "Da en el número", emoji: "🎯", topic: "Operaciones combinadas", custom: mountObjetivoGame },
  { id: "flash", title: "Vistazo relámpago", emoji: "⚡", topic: "Subitizing", custom: mountFlashGame },
  { id: "geoclavos", title: "Encierra el perímetro", emoji: "📐", topic: "Perímetro", custom: mountGeoclavosGame },
  { id: "estadisticas", title: "Estadísticas de fútbol", emoji: "⚽", topic: "Media, mediana y moda", custom: mountEstadisticasGame },
];
