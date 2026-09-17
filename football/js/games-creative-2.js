// Segunda tanda de juegos "creativos" (mecánica propia), ejercicios 30-40.
import { mountRuletaGame } from "./game-ruleta.js";
import { mountClasificaGame } from "./game-clasifica.js";
import { mountEstimaGame } from "./game-estima.js";
import { mountTecladoGame } from "./game-teclado.js";
import { mountBarrasGame } from "./game-barras.js";
import { mountMonedasGame } from "./game-monedas.js";
import { mountCoordenadasGame } from "./game-coordenadas.js";
import { mountSimetriaGame } from "./game-simetria.js";
import { mountAmigos10Game } from "./game-amigos10.js";
import { mountAreaGame } from "./game-area.js";
import { mountLaberintoGame } from "./game-laberinto.js";

export const CREATIVE_GAMES_2 = [
  { id: "ruleta", title: "Ruleta de probabilidad", emoji: "🎡", topic: "Probabilidad", custom: mountRuletaGame },
  { id: "clasifica", title: "Clasifica los números", emoji: "🧺", topic: "Clasificación", custom: mountClasificaGame },
  { id: "estima", title: "Estima el resultado", emoji: "🎚️", topic: "Estimación", custom: mountEstimaGame },
  { id: "teclado", title: "Teclado numérico", emoji: "⌨️", topic: "Cálculo mental", custom: mountTecladoGame },
  { id: "barras", title: "Compara fracciones", emoji: "🍫", topic: "Fracciones", custom: mountBarrasGame },
  { id: "monedas", title: "Cuenta las monedas", emoji: "💰", topic: "Dinero", custom: mountMonedasGame },
  { id: "coordenadas", title: "Plano cartesiano", emoji: "🗺️", topic: "Coordenadas", v: 2, custom: mountCoordenadasGame },
  { id: "simetria", title: "Simetría", emoji: "🪞", topic: "Geometría", custom: mountSimetriaGame },
  { id: "amigos10", title: "Amigos del 10", emoji: "🔗", topic: "Cálculo mental", custom: mountAmigos10Game },
  { id: "area", title: "Área y perímetro", emoji: "🔲", topic: "Geometría", custom: mountAreaGame },
  { id: "laberinto", title: "Laberinto numérico", emoji: "🌀", topic: "Múltiplos y reglas", custom: mountLaberintoGame },
];
