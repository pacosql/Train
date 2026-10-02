-- Tabla de la app Series (prefijo series_). Las fichas las carga
-- series/tools/cargar.mjs con el token de gestión; desde la app (anon)
-- solo se puede leer y cambiar la valoración.
create table if not exists public.series_series (
  id bigint generated always as identity primary key,
  slug text unique not null,
  titulo text not null,
  titulo_original text,
  poster_url text,
  por_que text,
  plataformas jsonb not null default '[]'::jsonb,
  actores jsonb not null default '[]'::jsonb,
  genero text,
  anio_inicio int,
  anio_fin int,
  estado text check (estado in ('finalizada', 'en_emision', 'pendiente')),
  temporadas int,
  episodios int,
  minutos_episodio int,
  nota numeric,
  tvmaze_id int,
  orden int,
  valoracion text check (valoracion in ('me_gusta', 'no_me_gusta')),
  valorada_en timestamptz,
  created_at timestamptz not null default now()
);
alter table public.series_series enable row level security;
drop policy if exists "allow anon read" on public.series_series;
create policy "allow anon read" on public.series_series for select to anon using (true);
drop policy if exists "allow anon rate" on public.series_series;
create policy "allow anon rate" on public.series_series for update to anon using (true) with check (true);
revoke insert, update, delete, truncate on public.series_series from anon, authenticated;
grant select on public.series_series to anon, authenticated;
grant update (valoracion, valorada_en) on public.series_series to anon;
