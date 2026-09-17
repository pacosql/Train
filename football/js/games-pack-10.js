// Segunda tanda del 17-09-2026 — tramo 2 (último) de ejercicios nuevos.
// Fuentes de cada mecánica: ver football/README.md.
import { mountRecetaGame } from "./game-receta.js";
import { mountHorarioGame } from "./game-horario.js";
import { mountAlmacenGame } from "./game-almacen.js";
import { mountTruequeGame } from "./game-trueque.js";
import { mountConversionGame } from "./game-conversion.js";

export const GAMES_PACK_10 = [
  { id: "receta", title: "Ajusta la receta", emoji: "🍳", topic: "Fracciones y proporción", custom: mountRecetaGame },
  { id: "horario", title: "El horario de trenes", emoji: "🚉", topic: "Tiempo y horarios", custom: mountHorarioGame },
  { id: "almacen", title: "Apila cajas", emoji: "🏬", topic: "Volumen", custom: mountAlmacenGame },
  { id: "trueque", title: "El trueque", emoji: "🤝", topic: "Ecuaciones", custom: mountTruequeGame },
  { id: "conversion", title: "Conversión deslizante", emoji: "🔁", topic: "Unidades", custom: mountConversionGame },
];
