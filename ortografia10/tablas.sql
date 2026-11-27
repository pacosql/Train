-- Tablas de Ortografía 10 (prefijo ortografia10_). Ejecutar con la
-- Management API y $SUPABASE_ACCESS_TOKEN (ver CLAUDE.md de la raíz).
create table if not exists public.ortografia10_votos (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  tipo text not null,          -- id del tipo de ejercicio (caza, bienmal, …)
  valor smallint not null,     -- 1 = 👍, -1 = 👎, 0 = voto quitado
  dispositivo text not null    -- id aleatorio del móvil (cuenta el último voto de cada uno)
);
create table if not exists public.ortografia10_respuestas (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  tipo text not null,
  acierto boolean not null,
  dispositivo text not null
);
-- Para la pestaña Nota (2026-11-27):
alter table public.ortografia10_respuestas add column if not exists categoria text;
alter table public.ortografia10_respuestas add column if not exists comp text;
alter table public.ortografia10_votos enable row level security;
alter table public.ortografia10_respuestas enable row level security;
drop policy if exists "allow anon read" on public.ortografia10_votos;
drop policy if exists "allow anon insert" on public.ortografia10_votos;
drop policy if exists "allow anon read" on public.ortografia10_respuestas;
drop policy if exists "allow anon insert" on public.ortografia10_respuestas;
create policy "allow anon read" on public.ortografia10_votos for select to anon using (true);
create policy "allow anon insert" on public.ortografia10_votos for insert to anon with check (true);
create policy "allow anon read" on public.ortografia10_respuestas for select to anon using (true);
create policy "allow anon insert" on public.ortografia10_respuestas for insert to anon with check (true);
