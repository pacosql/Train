// Séptima tanda del 17-09-2026 (noche) — tramo único de ejercicios nuevos.
// Fuentes de cada mecánica: ver football/README.md.
import { mountColorprimosGame } from "./game-colorprimos.js";
import { mountCategoriasGame } from "./game-categorias.js";
import { mountMosaicoGame } from "./game-mosaico.js";
import { mountCombinaGame } from "./game-combina.js";
import { mountButacasGame } from "./game-butacas.js";
import { mountVistazoGame } from "./game-vistazo.js";

export const GAMES_PACK_11 = [
  { id: "colorprimos", title: "Fábrica de colores primos", emoji: "🎨", topic: "Factores primos", custom: mountColorprimosGame },
  { id: "categorias", title: "Elige tu categoría", emoji: "🎲", topic: "Combinatoria y patrones de dados", custom: mountCategoriasGame },
  { id: "mosaico", title: "Escalera de mosaicos", emoji: "🀄", topic: "Números triangulares y reparto", custom: mountMosaicoGame },
  { id: "combina", title: "Grupos y escaleras", emoji: "🔢", topic: "Secuencias y valores iguales", custom: mountCombinaGame },
  { id: "butacas", title: "Sesión de cine", emoji: "🎬", topic: "Combinatoria", custom: mountButacasGame },
  { id: "vistazo", title: "¿Cuál es más grande?", emoji: "👀", topic: "Estimación visual de ángulos", custom: mountVistazoGame },
];
