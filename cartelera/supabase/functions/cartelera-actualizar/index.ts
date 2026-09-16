// Edge Function: cartelera-actualizar
//
// Se invoca desde el botón "Actualizar cartelera" de la app. Busca en
// varias webs de cartelera de cine qué películas hay en cines de Murcia
// ciudad ahora mismo (agregando todos los cines, sin separarlas por
// sala), extrae ficha de cada película y guarda el resultado en
// `cartelera_peliculas` / `cartelera_estado`. Usa la service role key
// (variable de entorno inyectada automáticamente por Supabase) para
// poder escribir saltándose RLS; el cliente (anon) solo puede leer.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// La app se sirve desde GitHub Pages (otro origen que el de Supabase), así
// que el navegador hace primero una preflight OPTIONS y luego exige
// Access-Control-Allow-Origin en la respuesta real.
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

function db(path: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
      ...(init.headers || {}),
    },
  });
}

async function fetchText(url: string, timeoutMs = 12000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": UA,
        "Accept-Language": "es-ES,es;q=0.9",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function metaContent(html: string, prop: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`,
    "i"
  );
  const m = html.match(re) || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${prop}["']`, "i"));
  return m ? decodeEntities(m[1]) : null;
}

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface MovieRef {
  slug: string; // identificador estable dentro de la fuente (para dedupe)
  detailUrl: string;
  guessedTitle?: string;
  guessedPoster?: string;
}

interface MovieData {
  slug: string;
  titulo: string;
  poster_url: string | null;
  fotos: string[];
  sinopsis: string | null;
  critica: string | null;
  clasificacion_edad: string | null;
  genero: string | null;
  duracion_min: number | null;
  director: string | null;
  reparto: string | null;
  fuente: string;
  fuente_url: string;
}

const SOURCE_NAME = "SensaCine";
const MURCIA_CINEMAS_URL = "https://www.sensacine.com/cines/cines-en-72480/";

async function findMurciaCinemaUrls(): Promise<string[]> {
  const html = await fetchText(MURCIA_CINEMAS_URL);
  const urls = new Set<string>();
  const re = /href="(\/cines\/cine\/[A-Za-z0-9]+\/)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) urls.add(`https://www.sensacine.com${m[1]}`);
  return [...urls].slice(0, 10);
}

async function findMoviesInCinema(cinemaUrl: string): Promise<MovieRef[]> {
  const html = await fetchText(cinemaUrl);
  const found = new Map<string, MovieRef>();
  const re = /href="(\/peliculas\/pelicula-(\d+)\/?)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const [, path, id] = m;
    if (found.has(id)) continue;
    const start = Math.max(0, m.index - 400);
    const end = Math.min(html.length, m.index + 600);
    const window = html.slice(start, end);
    const altMatch = window.match(/alt="([^"]{2,120})"/);
    const imgMatch = window.match(/src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/);
    found.set(id, {
      slug: id,
      detailUrl: `https://www.sensacine.com${path.endsWith("/") ? path : path + "/"}`,
      guessedTitle: altMatch ? decodeEntities(altMatch[1]) : undefined,
      guessedPoster: imgMatch ? imgMatch[1] : undefined,
    });
  }
  return [...found.values()];
}

function extractClasificacion(html: string): string | null {
  if (/no\s+recomendada\s+para\s+menores\s+de\s+(\d{1,2})\s+a[ñn]os/i.test(html)) {
    const m = html.match(/no\s+recomendada\s+para\s+menores\s+de\s+(\d{1,2})\s+a[ñn]os/i)!;
    return `No recomendada para menores de ${m[1]} años`;
  }
  if (/todos\s+los\s+p[uú]blicos|autorizada\s+para\s+todos\s+los\s+p[uú]blicos/i.test(html)) {
    return "Todos los públicos (TP)";
  }
  const m2 = html.match(/\+(\d{1,2})\s*a[ñn]os/i);
  if (m2) return `+${m2[1]} años`;
  return null;
}

function extractDuracion(html: string): number | null {
  // Formato habitual "1h 50min" / "2h05min" — evita confundir con "8 min de
  // lectura" u otros contadores sueltos que no son la duración del filme.
  const combo = html.match(/(\d{1,2})\s*h\s*(\d{1,2})?\s*min/i);
  if (combo) {
    const total = parseInt(combo[1], 10) * 60 + (combo[2] ? parseInt(combo[2], 10) : 0);
    if (total >= 40 && total <= 240) return total;
  }
  const bare = html.match(/(\d{2,3})\s*min(?:uto)?s?\b/i);
  if (bare) {
    const total = parseInt(bare[1], 10);
    if (total >= 60 && total <= 240) return total;
  }
  return null;
}

function extractGenero(html: string): string | null {
  const m = html.match(/G[ée]nero[^:<]*:?\s*<\/[^>]+>\s*((?:<a[^>]*>[^<]+<\/a>\s*,?\s*)+)/i);
  if (m) {
    const names = [...m[1].matchAll(/<a[^>]*>([^<]+)<\/a>/g)].map((x) => decodeEntities(x[1]));
    const joined = names.filter((n) => /[a-zA-ZÀ-ÿ]/.test(n)).join(", ");
    if (joined) return joined;
  }
  const m2 = html.match(/"genre"\s*:\s*"([^"]+)"/i);
  if (m2 && /[a-zA-ZÀ-ÿ]/.test(m2[1]) && !/^\d/.test(m2[1])) return decodeEntities(m2[1]);
  return null;
}

const CRITICA_BOILERPLATE = /^(sigue sus publicaciones|ver todo|ver m[aá]s|leer m[aá]s)$/i;

function extractCritica(html: string): string | null {
  const patterns = [
    /Cr[ií]tica[^:<]*:?\s*<\/[^>]+>\s*<[^>]*>([^<]{25,600})</i,
    /"reviewBody"\s*:\s*"([^"]{25,600})"/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (!m) continue;
    const text = decodeEntities(m[1]).trim();
    if (text.length >= 25 && !CRITICA_BOILERPLATE.test(text) && /[.!?]/.test(text)) return text;
  }
  return null;
}

function extractPersona(html: string, label: RegExp): string | null {
  const m = html.match(label);
  if (!m) return null;
  const value = decodeEntities(m[1]).trim();
  return value.length > 0 ? value : null;
}

function extractFotos(html: string, poster: string | null): string[] {
  const urls = new Set<string>();
  const re = /https?:\/\/[^"'\s]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s]*)?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && urls.size < 30) {
    const u = m[0];
    if (poster && u === poster) continue;
    if (/logo|icon|sprite|avatar|favicon/i.test(u)) continue;
    urls.add(u);
  }
  return [...urls].slice(0, 5);
}

async function fetchMovieData(ref: MovieRef): Promise<MovieData | null> {
  let html: string;
  try {
    html = await fetchText(ref.detailUrl, 12000);
  } catch {
    return null;
  }
  const ogTitle = metaContent(html, "og:title");
  let titulo = ogTitle || ref.guessedTitle || null;
  if (titulo) titulo = titulo.replace(/\s*[-|]\s*SensaCine.*$/i, "").trim();
  if (!titulo) return null;

  const poster = metaContent(html, "og:image") || ref.guessedPoster || null;
  const sinopsis = metaContent(html, "og:description") || metaContent(html, "description");

  return {
    slug: slugify(`sensacine-${ref.slug}-${titulo}`),
    titulo,
    poster_url: poster,
    fotos: extractFotos(html, poster),
    sinopsis: sinopsis ? sinopsis.slice(0, 2000) : null,
    critica: extractCritica(html),
    clasificacion_edad: extractClasificacion(html),
    genero: extractGenero(html),
    duracion_min: extractDuracion(html),
    director: extractPersona(html, /Dirigida\s+por[^:<]*:?\s*<\/?[^>]*>\s*<a[^>]*>([^<]+)</i),
    reparto: extractPersona(html, /Reparto[^:<]*:?\s*<\/[^>]+>\s*([^<]{3,300})</i),
    fuente: SOURCE_NAME,
    fuente_url: ref.detailUrl,
  };
}

async function setEstado(fields: Record<string, unknown>) {
  await db("cartelera_estado?id=eq.1", {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const iniciado_en = new Date().toISOString();
  await setEstado({ estado: "actualizando", mensaje: "Buscando cines en Murcia…", iniciado_en, terminado_en: null });

  try {
    const cinemaUrls = await findMurciaCinemaUrls();
    if (cinemaUrls.length === 0) throw new Error("No se encontraron cines de Murcia en la fuente");

    await setEstado({ mensaje: `Encontrados ${cinemaUrls.length} cines. Buscando películas…` });

    const refsByKey = new Map<string, MovieRef>();
    for (const cinemaUrl of cinemaUrls) {
      try {
        const refs = await findMoviesInCinema(cinemaUrl);
        for (const r of refs) refsByKey.set(r.slug, r);
      } catch {
        // un cine individual puede fallar (bloqueo puntual, cambio de página...);
        // seguimos con el resto para no perder toda la actualización.
      }
    }

    const refs = [...refsByKey.values()].slice(0, 24);
    if (refs.length === 0) throw new Error("No se encontraron películas en los cines de Murcia");

    await setEstado({ mensaje: `${refs.length} películas encontradas. Descargando fichas…` });

    const movies: MovieData[] = [];
    for (const ref of refs) {
      const data = await fetchMovieData(ref);
      if (data) movies.push(data);
    }

    if (movies.length === 0) throw new Error("No se pudo extraer información de ninguna película");

    const keepSlugs = movies.map((m) => m.slug);
    const existingRes = await db("cartelera_peliculas?select=slug");
    const existing: { slug: string }[] = await existingRes.json();
    const toDelete = existing.map((e) => e.slug).filter((s) => !keepSlugs.includes(s));
    if (toDelete.length > 0) {
      await db(`cartelera_peliculas?slug=in.(${toDelete.map((s) => `"${s}"`).join(",")})`, { method: "DELETE" });
    }

    const upsertRes = await db("cartelera_peliculas?on_conflict=slug", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(movies.map((m) => ({ ...m, actualizado_en: new Date().toISOString() }))),
    });
    if (!upsertRes.ok) {
      throw new Error(`Error guardando en la base de datos: ${await upsertRes.text()}`);
    }

    await setEstado({
      estado: "ok",
      mensaje: `Cartelera de Murcia actualizada: ${movies.length} película(s).`,
      num_peliculas: movies.length,
      fuente: SOURCE_NAME,
      terminado_en: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ ok: true, count: movies.length }), {
      headers: { "content-type": "application/json", ...CORS_HEADERS },
    });
  } catch (err) {
    await setEstado({
      estado: "error",
      mensaje: err instanceof Error ? err.message : String(err),
      terminado_en: new Date().toISOString(),
    });
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json", ...CORS_HEADERS },
    });
  }
});
