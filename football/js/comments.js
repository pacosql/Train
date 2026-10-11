// Comentarios generales de Paco: sobre la app o el proceso, no sobre un
// ejercicio concreto (para eso está 🔧 Revisar en cada juego). Viven en
// `football_comentarios`; el audio, en el bucket `football-audios`
// (carpeta general/). Quien trabaje en la app (la rutina, o Claude cuando
// Paco dice "actualiza") lee los pendientes, actúa, y los marca como
// atendidos con una línea de respuesta, que se ve en el menú.
import { AUDIO_BUCKET } from "./ratings.js";

const TIMEOUT = 15000;
const withTimeout = (p, ms = TIMEOUT) =>
  Promise.race([
    Promise.resolve(p),
    new Promise((r) => setTimeout(() => r({ data: null, error: { message: "timeout" } }), ms)),
  ]);

export async function fetchComments(client, limit = 8) {
  if (!client) return [];
  const { data, error } = await withTimeout(
    client
      .from("football_comentarios")
      .select("id,created_at,note,audio_path,transcripcion,estado,respuesta,atendido_at")
      .order("created_at", { ascending: false })
      .limit(limit)
  );
  return error || !data ? [] : data;
}

export function audioUrl(client, path) {
  return path && client ? client.storage.from(AUDIO_BUCKET).getPublicUrl(path).data.publicUrl : "";
}

// Guarda un comentario (texto y/o audio { blob, mime }). Devuelve "" o el error.
export async function saveComment(client, { note, audio }) {
  if (!client) return "Sin conexión.";
  let audio_path = null;
  let audio_mime = null;
  if (audio && audio.blob) {
    const ext = audio.mime.includes("mp4") ? "m4a" : audio.mime.includes("ogg") ? "ogg" : "webm";
    audio_path = `general/${new Date().toISOString().replace(/[:.]/g, "-")}.${ext}`;
    const up = await withTimeout(
      client.storage.from(AUDIO_BUCKET).upload(audio_path, audio.blob, { contentType: audio.mime, upsert: false }),
      30000
    );
    if (up.error) return "No se pudo subir el audio: " + up.error.message;
    audio_mime = audio.mime;
  }
  const row = { note: note || null, audio_path, audio_mime };
  let res = await withTimeout(client.from("football_comentarios").insert(row));
  if (res && res.error) res = await withTimeout(client.from("football_comentarios").insert(row));
  if (res && res.error) {
    if (audio_path) withTimeout(client.storage.from(AUDIO_BUCKET).remove([audio_path]));
    return "No se ha podido guardar (¿sin conexión?). Inténtalo otra vez.";
  }
  return "";
}
