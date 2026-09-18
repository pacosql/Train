// Tercera tanda: ejercicios #41-#65, todos con mecánica propia.
// Agrupados por "packs" temáticos (movimiento, construir, lógica, mundo
// real, visual) que son también los ficheros CSS que los acompañan.
import { mountPescaGame } from "./game-pesca.js";
import { mountEscaleraGame } from "./game-escalera.js";
import { mountTragaperrasGame } from "./game-tragaperras.js";
import { mountDadosGame } from "./game-dados.js";
import { mountCarreraGame } from "./game-carrera.js";

import { mountAbacoGame } from "./game-abaco.js";
import { mountReparteGame } from "./game-reparte.js";
import { mountVasoGame } from "./game-vaso.js";
import { mountTorreGame } from "./game-torre.js";
import { mountReglaGame } from "./game-regla.js";

import { mountErrorGame } from "./game-error.js";
import { mountSemaforoGame } from "./game-semaforo.js";
import { mountLineasGame } from "./game-lineas.js";
import { mountColoreaGame } from "./game-colorea.js";
import { mountPuzleGame } from "./game-puzle.js";

import { mountCalendarioGame } from "./game-calendario.js";
import { mountCompraGame } from "./game-compra.js";
import { mountProporcionesGame } from "./game-proporciones.js";
import { mountTermometroGame } from "./game-termometro.js";
import { mountBrujulaGame } from "./game-brujula.js";

import { mountGraficaGame } from "./game-grafica.js";
import { mountTarta2Game } from "./game-tarta2.js";
import { mountRitmoGame } from "./game-ritmo.js";
import { mountBinarioGame } from "./game-binario.js";
import { mountCubosGame } from "./game-cubos.js";

export const GAMES_PACK_3 = [
  // Movimiento y velocidad
  { id: "pesca", title: "Pesca de números", emoji: "🎣", topic: "Multiplicación", custom: mountPescaGame },
  { id: "escalera", title: "Escalera de rachas", emoji: "🪜", topic: "Cálculo mental", custom: mountEscaleraGame },
  { id: "tragaperras", title: "Tragaperras de operaciones", emoji: "🎰", topic: "Operaciones", custom: mountTragaperrasGame },
  { id: "dados", title: "Dados", emoji: "🎲", topic: "Sumas rápidas", custom: mountDadosGame },
  { id: "carrera", title: "Carrera de cálculo", emoji: "🏁", topic: "Cálculo mental", custom: mountCarreraGame },
  // Manipular y construir
  { id: "abaco", title: "Ábaco", emoji: "🪀", topic: "Valor posicional", custom: mountAbacoGame },
  { id: "reparte", title: "Reparte en cajas", emoji: "📦", topic: "División", v: 2, custom: mountReparteGame },
  { id: "vaso", title: "Llena el vaso", emoji: "💧", topic: "Capacidad", custom: mountVasoGame },
  { id: "torre", title: "Construye la torre", emoji: "🏗️", topic: "Comparación", v: 2, custom: mountTorreGame },
  { id: "regla", title: "Mide con la regla", emoji: "🖍️", topic: "Medidas", v: 3, custom: mountReglaGame },
  // Lógica y detección
  { id: "error", title: "Encuentra el error", emoji: "🔍", topic: "Razonamiento", custom: mountErrorGame },
  { id: "semaforo", title: "Verdadero o falso", emoji: "🚦", topic: "Cálculo mental", custom: mountSemaforoGame },
  { id: "lineas", title: "Une con líneas", emoji: "🪢", topic: "Emparejar", custom: mountLineasGame },
  { id: "colorea", title: "Colorea por resultado", emoji: "🎨", topic: "Cálculo mental", custom: mountColoreaGame },
  { id: "puzle", title: "Puzle numérico", emoji: "🪄", topic: "Álgebra", custom: mountPuzleGame },
  // Medida y mundo real
  { id: "calendario", title: "Salta de fecha", emoji: "🗓️", topic: "Tiempo", v: 3, custom: mountCalendarioGame },
  { id: "compra", title: "La compra", emoji: "🛒", topic: "Dinero", custom: mountCompraGame },
  { id: "proporciones", title: "Mezclas y proporciones", emoji: "⚗️", topic: "Proporcionalidad", v: 2, custom: mountProporcionesGame },
  { id: "termometro", title: "Termómetro", emoji: "♨️", topic: "Negativos", custom: mountTermometroGame },
  { id: "brujula", title: "Giros y direcciones", emoji: "🧭", topic: "Ángulos", custom: mountBrujulaGame },
  // Visual y gráfico
  { id: "grafica", title: "Continúa la gráfica", emoji: "📉", topic: "Datos", v: 2, custom: mountGraficaGame },
  { id: "tarta2", title: "Reparte la tarta", emoji: "🍰", topic: "Fracciones", custom: mountTarta2Game },
  { id: "ritmo", title: "Compás musical", emoji: "🎵", topic: "Fracciones", custom: mountRitmoGame },
  { id: "binario", title: "Bombillas binarias", emoji: "💡", topic: "Valor posicional", v: 2, custom: mountBinarioGame },
  { id: "cubos", title: "Cuenta los cubos", emoji: "🧊", topic: "Volumen", custom: mountCubosGame },
];
