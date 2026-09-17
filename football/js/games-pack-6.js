// Tanda del 17-09-2026 (tarde) — tramo 2 de ejercicios nuevos.
// Fuentes de cada mecánica: ver football/README.md.
import { mountAgujasGame } from "./game-agujas.js";
import { mountTelaGame } from "./game-tela.js";
import { mountVallaGame } from "./game-valla.js";
import { mountReboteGame } from "./game-rebote.js";
import { mountEscalaGame } from "./game-escala.js";
import { mountSombraGame } from "./game-sombra.js";

export const GAMES_PACK_6 = [
  { id: "agujas", title: "El ángulo de las agujas", emoji: "🕰️", topic: "Ángulos", custom: mountAgujasGame },
  { id: "tela", title: "Dobla la tela", emoji: "🧣", topic: "Simetría", custom: mountTelaGame },
  { id: "valla", title: "La valla del huerto", emoji: "🐑", topic: "Perímetro y área", custom: mountVallaGame },
  { id: "rebote", title: "Tiro con rebote", emoji: "🎱", topic: "Ángulos", custom: mountReboteGame },
  { id: "escala", title: "La escala del mapa", emoji: "🗾", topic: "Proporción", custom: mountEscalaGame },
  { id: "sombra", title: "La sombra", emoji: "🕶️", topic: "Proporcionalidad", custom: mountSombraGame },
];
