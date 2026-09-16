// Los 10 juegos "creativos": cada uno con su propia mecánica de
// interacción (arrastrar, tocar en orden, emparejar, construir…), en
// lugar del motor genérico de "pregunta + 4 opciones".
import { mountParejasGame } from "./game-parejas.js";
import { mountOrdenGame } from "./game-orden.js";
import { mountRectaGame } from "./game-recta.js";
import { mountRelojGame } from "./game-reloj.js";
import { mountBalanzaGame } from "./game-balanza.js";
import { mountMemoriaGame } from "./game-memoria.js";
import { mountAtrapaGame } from "./game-atrapa.js";
import { mountBloquesGame } from "./game-bloques.js";
import { mountAnguloGame } from "./game-angulo.js";
import { mountPuntosGame } from "./game-puntos.js";

export const CREATIVE_GAMES = [
  { id: "parejas", title: "Parejas que suman", emoji: "🫧", topic: "Cálculo mental", custom: mountParejasGame },
  { id: "orden", title: "Ordena los números", emoji: "📶", topic: "Orden numérico", custom: mountOrdenGame },
  { id: "recta", title: "Recta numérica", emoji: "📍", topic: "Sentido numérico", custom: mountRectaGame },
  { id: "reloj", title: "Pon en hora el reloj", emoji: "🕐", topic: "Tiempo", custom: mountRelojGame },
  { id: "balanza", title: "Equilibra la balanza", emoji: "🏋️", topic: "Igualdad y pesos", custom: mountBalanzaGame },
  { id: "memoria", title: "Memoria matemática", emoji: "🃏", topic: "Memoria y cálculo", custom: mountMemoriaGame },
  { id: "atrapa", title: "Atrapa los múltiplos", emoji: "🎯", topic: "Múltiplos y reglas", custom: mountAtrapaGame },
  { id: "bloques", title: "Construye el número", emoji: "🧱", topic: "Valor posicional", custom: mountBloquesGame },
  { id: "angulo", title: "Ajusta el ángulo", emoji: "📐", topic: "Geometría", custom: mountAnguloGame },
  { id: "puntos", title: "Une los puntos", emoji: "✏️", topic: "Conteo salteado", custom: mountPuntosGame },
];
