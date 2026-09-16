// Valoración de juegos (👍 me gusta / 👎 no me gusta / 🔧 revisar / nuevo)
// guardada en localStorage — es una preferencia personal de navegación, no
// necesita vivir en Supabase ni compartirse entre dispositivos.
const KEY_PREFIX = "mathgames.rating.";
const GEN_KEY = "mathgames.reworkGeneration";

// Sube este número cada vez que se publica una tanda de mejoras sobre los
// juegos marcados para revisar. Al detectar una generación más nueva que
// la vista por este navegador, la bandeja "🔧 Revisar" se vacía: esos
// juegos ya han recibido su vuelta y vuelven a estar "nuevos" para
// poder juzgarlos otra vez desde cero.
export const REWORK_GENERATION = 2;

export function getRating(id) {
  try {
    return localStorage.getItem(KEY_PREFIX + id) || "new";
  } catch (_) {
    return "new";
  }
}

export function setRating(id, value) {
  try {
    if (value === "new") localStorage.removeItem(KEY_PREFIX + id);
    else localStorage.setItem(KEY_PREFIX + id, value);
  } catch (_) {
    // localStorage no disponible (modo privado, etc.) — no es crítico.
  }
}

// Devuelve los ids que estaban en "Revisar" y acaban de volver a "Nuevos",
// o [] si esta generación ya se había aplicado en este navegador.
export function applyReworkReset() {
  try {
    const seen = Number(localStorage.getItem(GEN_KEY) || 0);
    if (seen >= REWORK_GENERATION) return [];
    // Recoge las claves primero: borrar mientras se recorre localStorage
    // por índice desplaza el resto y se saltaría entradas.
    const toClear = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(KEY_PREFIX) && localStorage.getItem(key) === "review") {
        toClear.push(key);
      }
    }
    toClear.forEach((key) => localStorage.removeItem(key));
    localStorage.setItem(GEN_KEY, String(REWORK_GENERATION));
    return toClear.map((key) => key.slice(KEY_PREFIX.length));
  } catch (_) {
    return [];
  }
}
