// Carga (o actualiza) las fichas en series_series vía la Management API.
// Nunca toca las columnas de valoración, así que se puede re-ejecutar
// para añadir series nuevas al catálogo sin perder lo ya votado.
//
//   node series/tools/enriquecer.mjs > /tmp/series.json
//   node series/tools/cargar.mjs /tmp/series.json
//
// Necesita SUPABASE_ACCESS_TOKEN en el entorno (nunca en el repo).
import { readFileSync } from "node:fs";

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) throw new Error("Falta SUPABASE_ACCESS_TOKEN");
const series = JSON.parse(readFileSync(process.argv[2], "utf8"));

const COLS = ["slug", "titulo", "titulo_original", "poster_url", "por_que", "plataformas", "actores", "genero",
  "anio_inicio", "anio_fin", "estado", "temporadas", "episodios", "minutos_episodio", "nota", "tvmaze_id", "orden"];
const lit = (v) =>
  v === null || v === undefined ? "null"
  : typeof v === "number" ? String(v)
  : "'" + (typeof v === "object" ? JSON.stringify(v) : String(v)).replace(/'/g, "''") + "'";
const rows = series.map((s) => "(" + COLS.map((c) => lit(s[c]) + (c === "plataformas" || c === "actores" ? "::jsonb" : "")).join(", ") + ")");
const query = `insert into public.series_series (${COLS.join(", ")}) values\n${rows.join(",\n")}
on conflict (slug) do update set ${COLS.filter((c) => c !== "slug").map((c) => `${c} = excluded.${c}`).join(", ")};`;

const r = await fetch("https://api.supabase.com/v1/projects/dzlhsdpgyxnjwudmrnul/database/query", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});
console.log(r.status, await r.text());
if (!r.ok) process.exit(1);
