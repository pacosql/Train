// Completa catalogo.json con datos de TVmaze (API pública, sin clave):
// carátula, tres actores principales, temporadas, episodios emitidos,
// minutos por episodio, años y estado (finalizada / en emisión).
//
//   node series/tools/enriquecer.mjs > /tmp/series.json
//
// Cada entrada del catálogo puede llevar "id" (id de TVmaze) para fijar
// la serie exacta cuando la búsqueda por nombre devuelve otra, y "actores",
// "estado" o "anio_fin" para corregir a mano lo que TVmaze trae mal.
import { readFileSync } from "node:fs";

const catalogo = JSON.parse(readFileSync(new URL("./catalogo.json", import.meta.url), "utf8"));
const hoy = new Date().toISOString().slice(0, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  for (let i = 0; i < 5; i++) {
    const r = await fetch(url);
    if (r.status === 429) { await sleep(2000); continue; }
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    return r.json();
  }
  throw new Error(`429 persistente ${url}`);
}

const ESTADO = { Ended: "finalizada", Running: "en_emision", "To Be Determined": "pendiente", "In Development": "pendiente" };
const slugify = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const out = [];
for (const [i, s] of catalogo.entries()) {
  const show = s.id
    ? await get(`https://api.tvmaze.com/shows/${s.id}?embed[]=cast&embed[]=episodes`)
    : await get(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(s.q)}&embed[]=cast&embed[]=episodes`);
  const emitidos = (show._embedded.episodes || []).filter((e) => e.airdate && e.airdate <= hoy);
  const temporadas = new Set(emitidos.map((e) => e.season)).size;
  const actores = s.actores || (show._embedded.cast || []).slice(0, 3).map((c) => c.person.name);
  out.push({
    slug: slugify(s.titulo),
    titulo: s.titulo,
    titulo_original: show.name,
    poster_url: show.image?.original || show.image?.medium || null,
    por_que: s.por_que,
    plataformas: s.plataformas,
    actores,
    genero: (show.genres || []).join(", ") || null,
    anio_inicio: show.premiered ? +show.premiered.slice(0, 4) : null,
    anio_fin: "anio_fin" in s ? s.anio_fin : show.status === "Ended" && show.ended ? +show.ended.slice(0, 4) : null,
    estado: s.estado || ESTADO[show.status] || "pendiente",
    temporadas,
    episodios: emitidos.length,
    minutos_episodio: show.averageRuntime || show.runtime || null,
    nota: show.rating?.average ?? null,
    tvmaze_id: show.id,
    orden: i + 1,
    _red: show.network?.name || show.webChannel?.name || null,
  });
  await sleep(300);
}
console.log(JSON.stringify(out, null, 1));
