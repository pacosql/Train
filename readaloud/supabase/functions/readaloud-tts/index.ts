// Supabase Edge Function: readaloud-tts
//
// Convierte texto en MP3 para el botón "⬇ MP3" de Read Aloud con Google
// Cloud Text-to-Speech. La clave vive solo como secreto GOOGLE_TTS_KEY en
// Supabase (nunca en el repo ni en el cliente).
//
// POST { text, voice?, rate? }  →  audio/mpeg

// La app ya parte los textos largos en "Part 1", "Part 2"… de ~18 000
// caracteres; esto es solo un tope de seguridad, nunca un recorte normal.
const MAX_TEXT = 60000;
// Las mismas que ofrece el desplegable de la app, de mejor a peor:
// Chirp 3 HD (lo más natural), Studio (calidad narrador) y Neural2.
const VOICES = [
  "en-US-Chirp3-HD-Aoede", "en-US-Chirp3-HD-Kore", "en-US-Chirp3-HD-Leda", "en-US-Chirp3-HD-Zephyr",
  "en-US-Chirp3-HD-Charon", "en-US-Chirp3-HD-Puck", "en-US-Chirp3-HD-Fenrir", "en-US-Chirp3-HD-Orus",
  "en-US-Studio-O", "en-US-Studio-Q",
  "en-US-Neural2-F", "en-US-Neural2-H", "en-US-Neural2-D", "en-US-Neural2-J",
];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, status: number) =>
  new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Trozos de hasta max caracteres cortando en fin de frase o espacio
// (Google admite como mucho 5000 bytes por petición).
function split(text: string, max: number) {
  const out: string[] = [];
  let s = text.trim();
  while (s.length > max) {
    const seg = s.slice(0, max);
    let cut = Math.max(seg.lastIndexOf(". "), seg.lastIndexOf("! "), seg.lastIndexOf("? "), seg.lastIndexOf("\n"));
    if (cut < max / 2) cut = seg.lastIndexOf(" ");
    if (cut < 1) cut = max - 1;
    out.push(s.slice(0, cut + 1).trim());
    s = s.slice(cut + 1).trim();
  }
  if (s) out.push(s);
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const key = Deno.env.get("GOOGLE_TTS_KEY");
    if (!key) return json({ error: "MP3 download isn't set up yet (missing Google key)" }, 503);
    const { text, voice, rate } = await req.json();
    const t = String(text || "");
    if (!t.trim()) return json({ error: "empty text" }, 400);
    if (t.length > MAX_TEXT) return json({ error: `text too long for one request (${t.length} chars, max ${MAX_TEXT})` }, 413);
    const v = VOICES.includes(voice) ? voice : VOICES[0];
    const r = Math.min(2, Math.max(0.5, Number(rate) || 1));

    const parts: Uint8Array[] = [];
    for (const c of split(t, 2000)) {
      const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: { text: c }, voice: { languageCode: "en-US", name: v }, audioConfig: { audioEncoding: "MP3", speakingRate: r } }),
      });
      const d = await res.json();
      if (!res.ok) return json({ error: "Google: " + (d.error?.message || res.status) }, 502);
      parts.push(Uint8Array.from(atob(d.audioContent), (ch) => ch.charCodeAt(0)));
    }
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let o = 0;
    for (const p of parts) { out.set(p, o); o += p.length; }
    return new Response(out, { headers: { ...cors, "Content-Type": "audio/mpeg" } });
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
