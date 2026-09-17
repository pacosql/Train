// Valoración de ejercicios (👍 me gusta / 👎 no me gusta / 🔧 revisar).
//
// Vive en Supabase (tabla `football_ratings`), no en el navegador: así la
// misma valoración se ve desde cualquier dispositivo y, sobre todo, la
// puede leer el agente que revisa y mejora los ejercicios — cuando estaba
// en localStorage no había forma de saber desde fuera qué se había
// marcado para revisar.
//
// En memoria se guarda una copia para que el menú pinte sin esperar a la
// red; la escritura va a Supabase en cuanto se pulsa.
const LEGACY_PREFIX = "mathgames.rating.";
const LEGACY_GEN_KEY = "mathgames.reworkGeneration";

let client = null;
let cache = new Map();
let loaded = false;

// Una petición que nunca resuelve (red móvil regular, proxy a medias) no
// puede dejar la app esperando: todas las llamadas llevan tope de tiempo.
const NET_TIMEOUT_MS = 12000;
function withTimeout(promise, ms = NET_TIMEOUT_MS) {
  return Promise.race([
    Promise.resolve(promise),
    new Promise((resolve) => setTimeout(() => resolve({ data: null, error: { message: "timeout" } }), ms)),
  ]);
}

export function getRating(id) {
  return cache.get(id)?.rating || "new";
}

// Consejo/nota que el jugador escribió al marcar "🔧 Revisar" — explica
// qué falla, para que quien mejore el ejercicio no tenga que adivinarlo.
export function getRatingNote(id) {
  return cache.get(id)?.note || "";
}

export function ratingsLoaded() {
  return loaded;
}

export async function initRatings(supabaseClient) {
  client = supabaseClient;
  if (!client) return;
  await migrateLegacy();
  await reloadRatings();
}

export async function reloadRatings() {
  if (!client) return;
  const { data, error } = await withTimeout(client.from("football_ratings").select("game,rating,note"));
  if (error || !data) return;
  cache = new Map(data.map((row) => [row.game, { rating: row.rating, note: row.note || "" }]));
  loaded = true;
}

export async function setRating(id, value, note = "") {
  if (value === "new") {
    cache.delete(id);
    if (client) await withTimeout(client.from("football_ratings").delete().eq("game", id));
    return;
  }
  cache.set(id, { rating: value, note });
  if (client) {
    await withTimeout(
      client
        .from("football_ratings")
        .upsert(
          { game: id, rating: value, note: note || null, updated_at: new Date().toISOString() },
          { onConflict: "game" }
        )
    );
  }
}

// Sube una única vez lo que hubiera guardado en el navegador de antes y
// limpia esas claves, para no perder valoraciones al cambiar de sitio.
async function migrateLegacy() {
  let entries = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LEGACY_PREFIX)) {
        entries.push([key, key.slice(LEGACY_PREFIX.length), localStorage.getItem(key)]);
      }
    }
  } catch (_) {
    return;
  }
  const valid = entries.filter(([, , v]) => ["like", "dislike", "review"].includes(v));
  if (valid.length) {
    const rows = valid.map(([, game, rating]) => ({ game, rating, updated_at: new Date().toISOString() }));
    const { error } = await withTimeout(client.from("football_ratings").upsert(rows, { onConflict: "game" }));
    if (error) return; // si falla, no se borra nada del navegador
  }
  try {
    entries.forEach(([key]) => localStorage.removeItem(key));
    localStorage.removeItem(LEGACY_GEN_KEY);
  } catch (_) {
    // da igual: ya está en Supabase
  }
}

// Nota de la última tanda de mejoras, que escribe el agente al publicar.
export async function fetchReworkNote() {
  if (!client) return null;
  const { data, error } = await withTimeout(
    client.from("football_meta").select("value").eq("key", "last_rework").maybeSingle()
  );
  if (error || !data) return null;
  return data.value;
}
