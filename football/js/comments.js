// Comentarios generales de Paco: sobre la app o el proceso, no sobre un
// ejercicio concreto (para eso está 🔧 Revisar en cada juego). Viven en
// `football_comentarios`; el audio, en el bucket `football-audios`
// (carpeta general/). Quien trabaje en la app (la rutina, o Claude cuando
// Paco dice "actualiza") lee los pendientes, actúa, y los marca como
// atendidos con una línea de respuesta, que se ve en el menú.
//
// Pueden llevar adjuntos (capturas, fotos, cualquier archivo) en el bucket
// `football-adjuntos`: p. ej. la captura de un ejercicio visto en otra app
// para que se proponga uno parecido. Las fotos grandes se reducen antes de
// subirlas (lado mayor 1600 px) para no gastar datos del móvil.
import { AUDIO_BUCKET } from "./ratings.js";

export const FILES_BUCKET = "football-adjuntos";
const MAX_BYTES = 20 * 1024 * 1024;

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
      .select("id,created_at,note,audio_path,transcripcion,estado,respuesta,atendido_at,adjuntos")
      .order("created_at", { ascending: false })
      .limit(limit)
  );
  return error || !data ? [] : data;
}

export function fileUrl(client, path) {
  return path && client ? client.storage.from(FILES_BUCKET).getPublicUrl(path).data.publicUrl : "";
}

// Reduce una foto a 1600 px de lado mayor (JPEG). Las capturas pequeñas,
// los GIF y lo que no sea imagen se suben tal cual.
async function shrink(file) {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } catch (_) {
    return file;
  }
}

export function audioUrl(client, path) {
  return path && client ? client.storage.from(AUDIO_BUCKET).getPublicUrl(path).data.publicUrl : "";
}

// Guarda un comentario (texto, audio { blob, mime } y/o adjuntos [File]).
// Devuelve "" o el error.
export async function saveComment(client, { note, audio, files = [] }) {
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
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const adjuntos = [];
  for (let i = 0; i < files.length; i++) {
    const f = await shrink(files[i]);
    if (f.size > MAX_BYTES) return `«${files[i].name}» pesa más de 20 MB.`;
    const ext = (f.name.match(/\.(\w{1,5})$/) || [, "bin"])[1].toLowerCase();
    const path = `general/${stamp}-${i + 1}.${ext}`;
    const up = await withTimeout(
      client.storage.from(FILES_BUCKET).upload(path, f, { contentType: f.type || "application/octet-stream", upsert: false }),
      60000
    );
    if (up.error) {
      if (adjuntos.length) withTimeout(client.storage.from(FILES_BUCKET).remove(adjuntos.map((a) => a.path)));
      return `No se pudo subir «${files[i].name}»: ${up.error.message}`;
    }
    adjuntos.push({ path, mime: f.type || "", name: files[i].name, size: f.size });
  }
  const row = { note: note || null, audio_path, audio_mime, adjuntos };
  let res = await withTimeout(client.from("football_comentarios").insert(row));
  if (res && res.error) res = await withTimeout(client.from("football_comentarios").insert(row));
  if (res && res.error) {
    if (audio_path) withTimeout(client.storage.from(AUDIO_BUCKET).remove([audio_path]));
    if (adjuntos.length) withTimeout(client.storage.from(FILES_BUCKET).remove(adjuntos.map((a) => a.path)));
    return "No se ha podido guardar (¿sin conexión?). Inténtalo otra vez.";
  }
  return "";
}
