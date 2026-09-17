// Cuarta tanda: ejercicios #66-#70. Se AÑADEN al final del array GAMES
// de app.js — nunca se insertan en medio, porque el número de cada
// ejercicio es su posición y tiene que ser estable para siempre.
// Agrupados por tramo temático, que es también su fichero CSS.
import { mountPentominosGame } from "./game-pentominos.js";
import { mountFutoshikiGame } from "./game-futoshiki.js";
import { mountKakuroGame } from "./game-kakuro.js";
import { mountShikakuGame } from "./game-shikaku.js";
import { mountMagicoGame } from "./game-magico.js";

export const GAMES_PACK_4 = [
  // Puzzles de lápiz y papel
  { id: "pentominos", title: "Pentominós", emoji: "🟧", topic: "Área y teselado", custom: mountPentominosGame },
  { id: "futoshiki", title: "Mayor que", emoji: "🔼", topic: "Orden y lógica", custom: mountFutoshikiGame },
  { id: "kakuro", title: "Kakuro", emoji: "➕", topic: "Sumas con restricción", custom: mountKakuroGame },
  { id: "shikaku", title: "Shikaku", emoji: "⬛", topic: "Multiplicación y área", custom: mountShikakuGame },
  { id: "magico", title: "Cuadrado mágico", emoji: "🔯", topic: "Sumas", custom: mountMagicoGame },
];
