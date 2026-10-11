// Valoración de ejercicios.
//
// Dos cosas independientes por ejercicio:
//   · la valoración: 👍 me gusta / 👎 no me gusta / 🏁 final (o ninguna);
//   · la marca 🔧 revisar, que se combina con cualquiera de ellas
//     (👍+🔧, 👎+🔧, 🏁+🔧 o 🔧 sola), con su comentario escrito y/o un
//     audio grabado (y su transcripción, que es lo que puede leer el
//     agente que mejora los ejercicios: él no puede escuchar audios).
//
// Vive en Supabase (tabla `football_ratings`, audios en el bucket
// `football-audios`), no en el navegador: así se ve desde cualquier
// dispositivo y la lee el agente revisor. En memoria se guarda una copia
// para que el menú pinte sin esperar a la red.
const LEGACY_PREFIX = "mathgames.rating.";
const LEGACY_GEN_KEY = "mathgames.reworkGeneration";
export const AUDIO_BUCKET = "football-audios";

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

const EMPTY = { rating: null, review: false, note: "", audio_path: null, audio_mime: null, transcripcion: "" };
const entry = (id) => cache.get(id) || EMPTY;

// Valoración base: "like" | "dislike" | "final" | "new" (sin valorar).
export function getRating(id) {
  return entry(id).rating || "new";
}

export function isReview(id) {
  return !!entry(id).review;
}

// Comentario de 🔧 (escrito o transcrito del audio).
export function getRatingNote(id) {
  return entry(id).note || "";
}

// Transcripción del audio hecha después, fuera del móvil (Whisper, con
// football/tools/transcribir.py): rellena lo que el navegador no pudo.
export function getTranscript(id) {
  return entry(id).transcripcion || "";
}

export function getAudioUrl(id) {
  const path = entry(id).audio_path;
  if (!path || !client) return "";
  return client.storage.from(AUDIO_BUCKET).getPublicUrl(path).data.publicUrl;
}

// ¿Tiene alguna fila? (si no, el ejercicio está en 🆕 Nuevos)
export function isRated(id) {
  const e = entry(id);
  return !!(e.rating || e.review);
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
  const { data, error } = await withTimeout(
    client.from("football_ratings").select("game,rating,review,note,audio_path,audio_mime,transcripcion")
  );
  if (error || !data) return;
  cache = new Map(
    data.map((row) => [
      row.game,
      {
        rating: row.rating || null,
        review: !!row.review,
        note: row.note || "",
        audio_path: row.audio_path || null,
        audio_mime: row.audio_mime || null,
        transcripcion: row.transcripcion || "",
      },
    ])
  );
  loaded = true;
}

// Guarda los campos indicados y conserva el resto. Si el ejercicio se
// queda sin valoración y sin 🔧, se borra su fila (vuelve a 🆕 Nuevos).
// Devuelve "" si Supabase lo confirma, o el error: en ese caso la copia
// en memoria vuelve a como estaba, para no aparentar algo que no se ha
// guardado (con mala cobertura en el móvil se perdían comentarios).
async function save(id, patch) {
  const prev = entry(id);
  const next = { ...prev, ...patch };
  if (!next.review) {
    next.note = "";
    next.audio_path = null;
    next.audio_mime = null;
  }
  const audioChanged = prev.audio_path !== next.audio_path;
  if (audioChanged) next.transcripcion = "";
  const remove = !next.rating && !next.review;
  if (remove) cache.delete(id);
  else cache.set(id, next);
  if (!client) return "";
  const write = () =>
    remove
      ? withTimeout(client.from("football_ratings").delete().eq("game", id))
      : withTimeout(
          client.from("football_ratings").upsert(
            {
              game: id,
              rating: next.rating,
              review: next.review,
              note: next.note || null,
              audio_path: next.audio_path,
              audio_mime: next.audio_mime,
              // La transcripción la escribe el script del servidor: solo se
              // borra si cambia el audio (si no, ni se envía, para no pisarla).
              ...(audioChanged ? { transcripcion: null, transcrito_at: null } : {}),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "game" }
          )
        );
  let res = await write();
  if (res && res.error) res = await write(); // un reintento
  if (res && res.error) {
    if (prev === EMPTY) cache.delete(id);
    else cache.set(id, prev);
    return "No se ha podido guardar (¿sin conexión?). Inténtalo otra vez.";
  }
  if (prev.audio_path && prev.audio_path !== next.audio_path) removeAudio(prev.audio_path);
  return "";
}

// value: "like" | "dislike" | "final" | "new". No toca la marca 🔧.
// Devuelve "" o el mensaje de error.
export function setRating(id, value) {
  return save(id, { rating: value === "new" ? null : value });
}

// Marca o quita 🔧 con su comentario (y, si se pasa `rating`, cambia a la
// vez la valoración, en una sola escritura). `audio` es { blob, mime } si hay
// una grabación nueva, `null` para quitar la que hubiera, o undefined
// para dejar la que ya estaba. Devuelve un mensaje de error o "".
export async function setReview(id, { review, note = "", audio, rating } = {}) {
  const patch = { review: !!review, note };
  if (rating !== undefined) patch.rating = rating === "new" ? null : rating;
  if (audio === null) {
    patch.audio_path = null;
    patch.audio_mime = null;
  } else if (audio && audio.blob) {
    if (!client) return "Sin conexión: el audio no se ha podido guardar.";
    const ext = audio.mime.includes("mp4") ? "m4a" : audio.mime.includes("ogg") ? "ogg" : "webm";
    const path = `${id}/${new Date().toISOString().replace(/[:.]/g, "-")}.${ext}`;
    const up = await withTimeout(
      client.storage.from(AUDIO_BUCKET).upload(path, audio.blob, { contentType: audio.mime, upsert: false }),
      30000
    );
    if (up.error) return "No se pudo subir el audio: " + up.error.message;
    patch.audio_path = path;
    patch.audio_mime = audio.mime;
  }
  const err = await save(id, patch);
  // Si no se guardó la fila, el audio recién subido queda huérfano: fuera.
  if (err && patch.audio_path) removeAudio(patch.audio_path);
  return err;
}

function removeAudio(path) {
  if (client) withTimeout(client.storage.from(AUDIO_BUCKET).remove([path]));
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
    const rows = valid.map(([, game, rating]) => ({
      game,
      rating: rating === "review" ? null : rating,
      review: rating === "review",
      updated_at: new Date().toISOString(),
    }));
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
