// Décima tanda del 17-09-2026 — tramo único de ejercicios nuevos.
// Fuentes de cada mecánica: ver football/README.md.
import { mountNonogramaGame } from "./game-nonograma.js";
import { mountCriptaritmoGame } from "./game-criptaritmo.js";
import { mountBolsaGame } from "./game-bolsa.js";
import { mountFacturaGame } from "./game-factura.js";
import { mountOcaGame } from "./game-oca.js";

export const GAMES_PACK_14 = [
  { id: "nonograma", title: "Nonograma mini", emoji: "▢", topic: "Lógica", custom: mountNonogramaGame },
  { id: "criptaritmo", title: "Descifra la suma", emoji: "🔢", topic: "Aritmética con letras", custom: mountCriptaritmoGame },
  { id: "bolsa", title: "Compra y vende", emoji: "📉", topic: "Finanzas", custom: mountBolsaGame },
  { id: "factura", title: "La factura por tramos", emoji: "🧾", topic: "Tarifas por tramos", custom: mountFacturaGame },
  { id: "oca", title: "La oca numérica", emoji: "🦆", topic: "Operaciones con reglas", custom: mountOcaGame },
];
