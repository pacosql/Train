// Construye la lista "Recomendadas por Cristóbal Terrer Mota" (Seriemaniac)
// a partir de cristobal.json: calcula las estrellas, completa cada serie
// con TVmaze (cartel, reparto, episodios, estado) y la carga en
// series_cristobal con la Management API (upsert por slug).
//
//   node series/tools/cristobal.mjs            # calcula, enriquece y carga
//   node series/tools/cristobal.mjs --dry      # solo imprime el resultado
import { readFileSync } from "node:fs";

const src = JSON.parse(readFileSync(new URL("./cristobal.json", import.meta.url), "utf8"));
const hoy = new Date().toISOString().slice(0, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slugify = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const ESTADO = { Ended: "finalizada", Running: "en_emision" };

// 1) Estrellas: nota de su crítica si la hay; si no, por posición en sus
//    listas, quedándose con la mayor. Ver la nota en cristobal.json.
const porHistoria = (p) => (p <= 10 ? 5 : p <= 30 ? 4 : 3);
const porActuales = (p) => (p <= 10 ? 5 : p <= 20 ? 4 : 3);
const series = new Map();
const add = (s, patch) => {
  const k = slugify(s.titulo);
  const cur = series.get(k) || { slug: k, titulo: s.titulo, q: s.q, id: s.id, plataformas: s.plataformas, anio_fin: s.anio_fin, fuentes: [] };
  if (s.id) cur.id = s.id;
  if (s.plataformas?.length) cur.plataformas = s.plataformas;
  Object.assign(cur, patch, { fuentes: [...cur.fuentes, patch.fuente] });
  cur.estrellas = Math.max(cur.estrellas || 0, patch.estrellasFuente);
  series.set(k, cur);
};
src.historia.forEach((s, i) => add(s, { fuente: `Top 50 de la historia, nº ${i + 1}`, posicion_historia: i + 1, estrellasFuente: porHistoria(i + 1) }));
src.actuales.forEach((s, i) => add(s, { fuente: `30 mejores series actuales, nº ${i + 1}`, posicion_actuales: i + 1, estrellasFuente: porActuales(i + 1) }));
src.criticas.forEach((s) => add(s, { fuente: `crítica: ${"🧡".repeat(s.estrellas)}${"🤍".repeat(5 - s.estrellas)}`, nota_critica: s.estrellas, url_critica: s.url, cita: s.cita, imagen_critica: s.imagen_critica, estrellasFuente: s.estrellas }));
// La nota explícita de su crítica manda sobre la posición en listas.
for (const s of series.values()) if (s.nota_critica) s.estrellas = s.nota_critica;

// 2) TVmaze.
async function get(url) {
  for (let i = 0; i < 5; i++) {
    const r = await fetch(url);
    if (r.status === 429) { await sleep(2000); continue; }
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    return r.json();
  }
}
const out = [];
for (const s of series.values()) {
  const show = s.id
    ? await get(`https://api.tvmaze.com/shows/${s.id}?embed[]=cast&embed[]=episodes`)
    : await get(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(s.q)}&embed[]=cast&embed[]=episodes`);
  const emitidos = (show?._embedded?.episodes || []).filter((e) => e.airdate && e.airdate <= hoy);
  out.push({
    slug: s.slug,
    titulo: s.titulo,
    titulo_original: show?.name || null,
    poster_url: show?.image?.original || s.imagen_critica || null,
    plataformas: s.plataformas || [],
    actores: (show?._embedded?.cast || []).slice(0, 3).map((c) => c.person.name),
    genero: (show?.genres || []).join(", ") || null,
    anio_inicio: show?.premiered ? +show.premiered.slice(0, 4) : null,
    anio_fin: s.anio_fin ?? (show?.status === "Ended" && show.ended ? +show.ended.slice(0, 4) : null),
    estado: ESTADO[show?.status] || "pendiente",
    temporadas: new Set(emitidos.map((e) => e.season)).size || null,
    episodios: emitidos.length || null,
    minutos_episodio: show?.averageRuntime || show?.runtime || null,
    nota: show?.rating?.average ?? null,
    tvmaze_id: show?.id || null,
    estrellas: s.estrellas,
    fuentes: s.fuentes,
    posicion_historia: s.posicion_historia || null,
    posicion_actuales: s.posicion_actuales || null,
    url_critica: s.url_critica || null,
    cita: s.cita || null,
  });
  process.stderr.write(`${"★".repeat(s.estrellas)} ${s.titulo} → ${show?.name || "SIN TVMAZE"} (${show?.premiered?.slice(0, 4) || "?"})\n`);
  await sleep(300);
}
out.sort((a, b) => b.estrellas - a.estrellas || (a.posicion_historia || 99) - (b.posicion_historia || 99) || (a.posicion_actuales || 99) - (b.posicion_actuales || 99));
out.forEach((s, i) => (s.orden = i + 1));
if (process.argv.includes("--dry")) { console.log(JSON.stringify(out, null, 1)); process.exit(0); }

// 3) Carga.
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) throw new Error("Falta SUPABASE_ACCESS_TOKEN");
const COLS = Object.keys(out[0]);
const JSONB = new Set(["plataformas", "actores", "fuentes"]);
const lit = (v) => (v === null || v === undefined ? "null" : typeof v === "number" ? String(v) : "'" + (typeof v === "object" ? JSON.stringify(v) : String(v)).replace(/'/g, "''") + "'");
const rows = out.map((s) => "(" + COLS.map((c) => lit(s[c]) + (JSONB.has(c) ? "::jsonb" : "")).join(", ") + ")");
const query = `delete from public.series_cristobal where slug not in (${out.map((s) => lit(s.slug)).join(", ")});
insert into public.series_cristobal (${COLS.join(", ")}) values\n${rows.join(",\n")}
on conflict (slug) do update set ${COLS.filter((c) => c !== "slug").map((c) => `${c} = excluded.${c}`).join(", ")};`;
const r = await fetch("https://api.supabase.com/v1/projects/dzlhsdpgyxnjwudmrnul/database/query", {
  method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ query }),
});
console.log(r.status, await r.text());
if (!r.ok) process.exit(1);
