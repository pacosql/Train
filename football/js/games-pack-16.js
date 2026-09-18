// Duodécima tanda del 17-09-2026 (noche) — tramo único de ejercicios nuevos.
// Fuentes de cada mecánica: ver football/README.md.
import { mountConexionGame } from "./game-conexion.js";
import { mountSaltosGame } from "./game-saltos.js";
import { mountSumafracGame } from "./game-sumafrac.js";

export const GAMES_PACK_16 = [
  { id: "conexion", title: "Conexión numérica", emoji: "🔗", topic: "Propiedades de los números", custom: mountConexionGame },
  { id: "saltos", title: "Salta a la decena", emoji: "🦵", topic: "Estrategias de suma", custom: mountSaltosGame },
  { id: "sumafrac", title: "Suma de fracciones circulares", emoji: "🥧", topic: "Fracciones con denominador común", custom: mountSumafracGame },
];
