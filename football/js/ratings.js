// Valoración de juegos (👍 me gusta / 👎 no me gusta / nuevo) guardada en
// localStorage — es una preferencia personal de navegación, no necesita
// vivir en Supabase ni compartirse entre dispositivos.
const KEY_PREFIX = "mathgames.rating.";

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
