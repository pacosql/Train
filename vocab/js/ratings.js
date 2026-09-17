// Valoración de ejercicios (👍 me gusta / 👎 no me gusta / 🔧 revisar).
//
// Copia exacta del patrón de football/js/ratings.js (tabla `vocab_ratings`
// en vez de `football_ratings`) — vive en Supabase, no en el navegador,
// para que la misma valoración se vea desde cualquier dispositivo y la
// pueda leer el agente que revisa y mejora los ejercicios.
let client = null;
let cache = new Map();
let loaded = false;

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

export function getRatingNote(id) {
  return cache.get(id)?.note || "";
}

export function ratingsLoaded() {
  return loaded;
}

export async function initRatings(supabaseClient) {
  client = supabaseClient;
  if (!client) return;
  await reloadRatings();
}

export async function reloadRatings() {
  if (!client) return;
  const { data, error } = await withTimeout(client.from("vocab_ratings").select("game,rating,note"));
  if (error || !data) return;
  cache = new Map(data.map((row) => [row.game, { rating: row.rating, note: row.note || "" }]));
  loaded = true;
}

export async function setRating(id, value, note = "") {
  if (value === "new") {
    cache.delete(id);
    if (client) await withTimeout(client.from("vocab_ratings").delete().eq("game", id));
    return;
  }
  cache.set(id, { rating: value, note });
  if (client) {
    await withTimeout(
      client
        .from("vocab_ratings")
        .upsert(
          { game: id, rating: value, note: note || null, updated_at: new Date().toISOString() },
          { onConflict: "game" }
        )
    );
  }
}

// Nota de la última tanda de mejoras, que escribe el agente al publicar.
export async function fetchReworkNote() {
  if (!client) return null;
  const { data, error } = await withTimeout(
    client.from("vocab_meta").select("value").eq("key", "last_rework").maybeSingle()
  );
  if (error || !data) return null;
  return data.value;
}
