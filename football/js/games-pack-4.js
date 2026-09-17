// Cuarta tanda: ejercicios #66-#85. Se AÑADEN al final del array GAMES
// de app.js — nunca se insertan en medio, porque el número de cada
// ejercicio es su posición y tiene que ser estable para siempre.
// Agrupados por tramo temático, que es también su fichero CSS.
import { mountPentominosGame } from "./game-pentominos.js";
import { mountFutoshikiGame } from "./game-futoshiki.js";
import { mountKakuroGame } from "./game-kakuro.js";
import { mountShikakuGame } from "./game-shikaku.js";
import { mountMagicoGame } from "./game-magico.js";

import { mountCifrasGame } from "./game-cifras.js";
import { mountTodasGame } from "./game-todas.js";
import { mountInventaGame } from "./game-inventa.js";
import { mountCribaGame } from "./game-criba.js";
import { mountNimGame } from "./game-nim.js";

import { mountBarras2Game } from "./game-barras2.js";
import { mountDoblecesGame } from "./game-dobleces.js";
import { mountProbetasGame } from "./game-probetas.js";
import { mountLupaGame } from "./game-lupa.js";
import { mountRebajasGame } from "./game-rebajas.js";

import { mountEscalasGame } from "./game-escalas.js";
import { mountConjuntosGame } from "./game-conjuntos.js";
import { mountFlotaGame } from "./game-flota.js";
import { mountPintorGame } from "./game-pintor.js";
import { mountEngranajesGame } from "./game-engranajes.js";

export const GAMES_PACK_4 = [
  // Puzzles de lápiz y papel
  { id: "pentominos", title: "Pentominós", emoji: "🟧", topic: "Área y teselado", custom: mountPentominosGame },
  { id: "futoshiki", title: "Mayor que", emoji: "🔼", topic: "Orden y lógica", custom: mountFutoshikiGame },
  { id: "kakuro", title: "Kakuro", emoji: "➕", topic: "Sumas con restricción", custom: mountKakuroGame },
  { id: "shikaku", title: "Shikaku", emoji: "⬛", topic: "Multiplicación y área", custom: mountShikakuGame },
  { id: "magico", title: "Cuadrado mágico", emoji: "🔯", topic: "Sumas", custom: mountMagicoGame },

  // Números, descomposición y estrategia
  { id: "cifras", title: "Cifras", emoji: "🔟", topic: "Operaciones", custom: mountCifrasGame },
  { id: "todas", title: "Todas las formas", emoji: "🔀", topic: "Descomposición", custom: mountTodasGame },
  { id: "inventa", title: "Inventa la regla", emoji: "🪛", topic: "Patrones", custom: mountInventaGame },
  { id: "criba", title: "Criba de primos", emoji: "🧹", topic: "Primos", custom: mountCribaGame },
  { id: "nim", title: "Nim de palillos", emoji: "🎋", topic: "Paridad y restos", custom: mountNimGame },

  // Manipulativos y proporción
  { id: "barras2", title: "La misma cantidad", emoji: "🥖", topic: "Fracciones equivalentes", custom: mountBarras2Game },
  { id: "dobleces", title: "Dobleces de masa", emoji: "🥐", topic: "Potencias de 2", custom: mountDoblecesGame },
  { id: "probetas", title: "Mezcla las probetas", emoji: "🧪", topic: "Media ponderada", custom: mountProbetasGame },
  { id: "lupa", title: "La lupa decimal", emoji: "🔬", topic: "Decimales", custom: mountLupaGame },
  { id: "rebajas", title: "Rebajas", emoji: "💸", topic: "Porcentajes", custom: mountRebajasGame },

  // Mundo real y deducción
  { id: "escalas", title: "Escalas", emoji: "✈️", topic: "Tiempo y horarios", custom: mountEscalasGame },
  { id: "conjuntos", title: "Cuántos conjuntos", emoji: "👕", topic: "Combinatoria", custom: mountConjuntosGame },
  { id: "flota", title: "Hundir la flota", emoji: "🚢", topic: "Coordenadas y deducción", custom: mountFlotaGame },
  { id: "pintor", title: "El pintor", emoji: "🪣", topic: "Área", custom: mountPintorGame },
  { id: "engranajes", title: "Engranajes", emoji: "⚙️", topic: "Mínimo común múltiplo", custom: mountEngranajesGame },
];
