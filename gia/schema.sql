-- Tablas de la app GIA (prefijo gia_). Un solo usuario, sin login.
-- La app (anon) inserta sesiones y lee todo; el plan y el banco de
-- palabras solo los escribe la rutina horaria con la Management API.

create table if not exists public.gia_sesiones (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  modo text not null,               -- simulacro | tarea | plan | aprendizaje
  tarea text not null,              -- razonamiento | perceptiva | numerica | palabras | espacial
  simulacro_id text,                -- agrupa las 5 tareas de un simulacro
  duracion_s int not null,          -- duración configurada (s)
  usado_s numeric not null,         -- tiempo real usado (s)
  intentadas int not null,
  correctas int not null,
  fallos int not null,
  neta numeric not null,            -- correctas - penalización*fallos
  neta_norm numeric not null,       -- neta escalada a la duración oficial
  percentil int not null,           -- percentil estimado (orientativo)
  ms_medio int,
  detalle jsonb not null default '[]'::jsonb,  -- [{s: subtipo, ok, ms, q}]
  version text
);
alter table public.gia_sesiones enable row level security;
drop policy if exists "allow anon read" on public.gia_sesiones;
create policy "allow anon read" on public.gia_sesiones for select to anon using (true);
drop policy if exists "allow anon insert" on public.gia_sesiones;
create policy "allow anon insert" on public.gia_sesiones for insert to anon with check (true);

create table if not exists public.gia_plan (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  listo boolean not null default false,
  nivel text not null default 'sin datos',   -- sin datos | empezando | progresando | casi | listo
  veredicto text not null,                   -- frase corta para la portada
  mensaje text not null default '',          -- explicación (texto plano, párrafos)
  plan jsonb not null default '{}'::jsonb    -- {orden:[tareas], foco:{tarea:{subtipo:peso}}, duracion_s, nota}
);
alter table public.gia_plan enable row level security;
drop policy if exists "allow anon read" on public.gia_plan;
create policy "allow anon read" on public.gia_plan for select to anon using (true);

create table if not exists public.gia_palabras (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  a text not null,            -- par relacionado
  b text not null,
  intruso text not null,      -- la que sobra
  relacion text not null default 'sin',  -- sin (sinónimos) | ant (contrarios) | fam (misma familia)
  activo boolean not null default true,
  unique (a, b, intruso)
);
alter table public.gia_palabras enable row level security;
drop policy if exists "allow anon read" on public.gia_palabras;
create policy "allow anon read" on public.gia_palabras for select to anon using (true);
