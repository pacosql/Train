// Ejercicios #186-#197: 12 TIPOS de interacción nuevos sacados de buscar
// en apps y juegos (DragonBox, Refraction, Euclidea, Mathigon, Desmos,
// NRICH, IXL, PISA, Exploding Dots y clásicos de lápiz y papel), siempre
// con el criterio de Paco: tipos de juego, no temas, y nada de elegir 1 de 4.
import { mountCompasGame } from "./game-compas.js";
import { mountLucesGame } from "./game-luces.js";
import { mountLaserGame } from "./game-laser.js";
import { mountParesceroGame } from "./game-parescero.js";
import { mountDesenredaGame } from "./game-desenreda.js";
import { mountMonedafalsaGame } from "./game-monedafalsa.js";
import { mountExplotaGame } from "./game-explota.js";
import { mountCerillasGame } from "./game-cerillas.js";
import { mountMontadatosGame } from "./game-montadatos.js";
import { mountCajanegraGame } from "./game-cajanegra.js";
import { mountVistasGame } from "./game-vistas.js";
import { mountPuntoscajasGame } from "./game-puntoscajas.js";

export const GAMES_PACK_37 = [
  { id: "compas", title: "Regla y compás", emoji: "⭕", topic: "Construcciones geométricas", custom: mountCompasGame },
  { id: "luces", title: "Apaga las luces", emoji: "🔆", topic: "Paridad", custom: mountLucesGame },
  { id: "laser", title: "Reparte el láser", emoji: "🔦", topic: "Fracciones", custom: mountLaserGame },
  { id: "parescero", title: "Fichas que se anulan", emoji: "🟡", topic: "Números enteros", custom: mountParesceroGame },
  { id: "desenreda", title: "Desenreda la red", emoji: "🕸️", topic: "Grafos y topología", custom: mountDesenredaGame },
  { id: "monedafalsa", title: "La moneda falsa", emoji: "🥇", topic: "Lógica e información", custom: mountMonedafalsaGame },
  { id: "explota", title: "Máquina de explosiones", emoji: "💥", topic: "Valor posicional y bases", custom: mountExplotaGame },
  { id: "cerillas", title: "Mueve una cerilla", emoji: "🔥", topic: "Igualdades", custom: mountCerillasGame },
  { id: "montadatos", title: "Monta los datos", emoji: "📌", topic: "Estadística", custom: mountMontadatosGame },
  { id: "cajanegra", title: "La caja negra", emoji: "🎛️", topic: "Funciones", custom: mountCajanegraGame },
  { id: "vistas", title: "Construye según las vistas", emoji: "🏯", topic: "Visión espacial", custom: mountVistasGame },
  { id: "puntoscajas", title: "Puntos y cajas", emoji: "🔳", topic: "Estrategia", custom: mountPuntoscajasGame },
];
