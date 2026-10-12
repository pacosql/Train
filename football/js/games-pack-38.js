// Ejercicios #198-#222: 25 juegos de PREGUNTA para preparar la clase (primaria
// y ESO). Una pregunta por ronda, gesto simple y una línea 💡 que enseña el
// porqué con los números de esa pregunta. Tanda pedida por Paco el 11-10-2026.
import { mountDictadoGame } from "./game-dictado.js";
import { mountMayornumeroGame } from "./game-mayornumero.js";
import { mountHuecoGame } from "./game-hueco.js";
import { mountPlanteaGame } from "./game-plantea.js";
import { mountGalletasGame } from "./game-galletas.js";
import { mountEquivalentesGame } from "./game-equivalentes.js";
import { mountCienGame } from "./game-cien.js";
import { mountGradosGame } from "./game-grados.js";
import { mountParpadeoGame } from "./game-parpadeo.js";
import { mountCintasGame } from "./game-cintas.js";
import { mountColumnaGame } from "./game-columna.js";
import { mountRestoGame } from "./game-resto.js";
import { mountDivisoresGame } from "./game-divisores.js";
import { mountCarasGame } from "./game-caras.js";
import { mountSimplificaGame } from "./game-simplifica.js";
import { mountTerceranguloGame } from "./game-tercerangulo.js";
import { mountJerarquiaGame } from "./game-jerarquia.js";
import { mountParentesisGame } from "./game-parentesis.js";
import { mountComaGame } from "./game-coma.js";
import { mountRaizGame } from "./game-raiz.js";
import { mountSignosGame } from "./game-signos.js";
import { mountTantoGame } from "./game-tanto.js";
import { mountTablaGame } from "./game-tabla.js";
import { mountDespejaGame } from "./game-despeja.js";
import { mountElevadoGame } from "./game-elevado.js";

export const GAMES_PACK_38 = [
  { id: "dictado", title: "Dictado de números", emoji: "🔤", topic: "Numeración", custom: mountDictadoGame },
  { id: "mayornumero", title: "Forma el número", emoji: "🏆", topic: "Valor posicional", custom: mountMayornumeroGame },
  { id: "hueco", title: "El número escondido", emoji: "🕳️", topic: "Operaciones inversas", custom: mountHuecoGame },
  { id: "plantea", title: "Plantea el problema", emoji: "🧾", topic: "Problemas", custom: mountPlanteaGame },
  { id: "galletas", title: "Fracción de una cantidad", emoji: "🍪", topic: "Fracciones", custom: mountGalletasGame },
  { id: "equivalentes", title: "Fracciones equivalentes", emoji: "🟰", topic: "Fracciones", custom: mountEquivalentesGame },
  { id: "cien", title: "La cuadrícula del 100", emoji: "💯", topic: "Porcentajes y decimales", custom: mountCienGame },
  { id: "grados", title: "¿Cuántos grados?", emoji: "📐", topic: "Ángulos", custom: mountGradosGame },
  { id: "parpadeo", title: "Las dos luces", emoji: "🚨", topic: "Mínimo común múltiplo", custom: mountParpadeoGame },
  { id: "cintas", title: "Las cintas", emoji: "🎀", topic: "Máximo común divisor", custom: mountCintasGame },
  { id: "columna", title: "En columna", emoji: "🧱", topic: "Sumas y restas", custom: mountColumnaGame },
  { id: "resto", title: "División con resto", emoji: "➗", topic: "División", custom: mountRestoGame },
  { id: "divisores", title: "Toca los divisores", emoji: "🔢", topic: "Divisores y múltiplos", custom: mountDivisoresGame },
  { id: "caras", title: "Caras, aristas y vértices", emoji: "🧊", topic: "Cuerpos geométricos", custom: mountCarasGame },
  { id: "simplifica", title: "Simplifica", emoji: "✂️", topic: "Fracciones", custom: mountSimplificaGame },
  { id: "tercerangulo", title: "El tercer ángulo", emoji: "🔺", topic: "Ángulos de polígonos", custom: mountTerceranguloGame },
  { id: "jerarquia", title: "Paso a paso", emoji: "1️⃣", topic: "Jerarquía de operaciones", custom: mountJerarquiaGame },
  { id: "parentesis", title: "Pon el paréntesis", emoji: "🧷", topic: "Jerarquía de operaciones", custom: mountParentesisGame },
  { id: "coma", title: "Pon la coma", emoji: "🔘", topic: "Decimales", custom: mountComaGame },
  { id: "raiz", title: "¿Entre qué números?", emoji: "🪜", topic: "Raíces", custom: mountRaizGame },
  { id: "signos", title: "La regla de los signos", emoji: "➖", topic: "Números enteros", custom: mountSignosGame },
  { id: "tanto", title: "Tanto por ciento", emoji: "💲", topic: "Porcentajes", custom: mountTantoGame },
  { id: "tabla", title: "Completa la tabla", emoji: "📋", topic: "Proporcionalidad", custom: mountTablaGame },
  { id: "despeja", title: "¿Cuánto vale x?", emoji: "❎", topic: "Ecuaciones", custom: mountDespejaGame },
  { id: "elevado", title: "Potencias", emoji: "⚡", topic: "Potencias", custom: mountElevadoGame },
];
