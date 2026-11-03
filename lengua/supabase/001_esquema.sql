-- Lengua (oposición Lengua Castellana y Literatura, Murcia) — esquema.
-- Todas las tablas llevan el prefijo lengua_. Se aplica con la Management
-- API (ver CLAUDE.md). Idempotente.

create table if not exists public.lengua_alumno (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  objetivo int not null default 50,          -- preguntas al día
  created_at timestamptz not null default now()
);

create table if not exists public.lengua_pregunta (
  id text primary key,                       -- <area>-<nnn>
  area text not null,
  nivel int not null check (nivel between 1 and 3),
  q text not null,
  txt text,
  o jsonb not null,                          -- 4 opciones
  a int not null check (a between 0 and 3),  -- índice correcto
  why text not null,
  activa boolean not null default true,
  origen text not null default 'semilla',    -- semilla | noche-AAAA-MM-DD
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lengua_pregunta_area on public.lengua_pregunta (area, nivel) where activa;

create table if not exists public.lengua_respuesta (
  id bigserial primary key,
  alumno_id uuid not null references public.lengua_alumno (id) on delete cascade,
  pregunta_id text not null references public.lengua_pregunta (id),
  area text not null,
  nivel int not null,
  correcta boolean not null,
  elegida int,                               -- índice original elegido (null = no lo sé)
  ms int,
  sesion text,
  repaso boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists lengua_respuesta_alumno on public.lengua_respuesta (alumno_id, created_at desc);
create index if not exists lengua_respuesta_pregunta on public.lengua_respuesta (pregunta_id);

-- Lote de siguientes preguntas, preparado cada 5 min por lengua_preparar().
create table if not exists public.lengua_cola (
  alumno_id uuid not null references public.lengua_alumno (id) on delete cascade,
  pos int not null,
  pregunta_id text not null references public.lengua_pregunta (id) on delete cascade,
  motivo text not null,                      -- repaso | nueva | refuerzo | relleno
  creada_at timestamptz not null default now(),
  primary key (alumno_id, pos)
);

-- Nivel por área que calcula la rutina de 5 min (lo leen alumno y padre).
create table if not exists public.lengua_nivel (
  alumno_id uuid not null references public.lengua_alumno (id) on delete cascade,
  area text not null,
  n int not null,                            -- respuestas totales en el área
  aciertos int not null,
  rec_n int not null,                        -- últimas (≤15) del área
  rec_ok int not null,
  score numeric not null,                    -- 0-1, suavizado y ponderado por dificultad
  nivel_obj int not null,                    -- dificultad a la que se le pregunta ahora
  updated_at timestamptz not null default now(),
  primary key (alumno_id, area)
);

-- Avisos sobre preguntas (alumno o revisor). Los atiende la rutina nocturna.
create table if not exists public.lengua_reporte (
  id bigserial primary key,
  pregunta_id text not null references public.lengua_pregunta (id) on delete cascade,
  alumno_id uuid references public.lengua_alumno (id) on delete set null,
  quien text not null default 'alumno',      -- alumno | revisor
  texto text not null,
  estado text not null default 'pendiente',  -- pendiente | atendido | descartado
  respuesta text,                            -- qué hizo la rutina
  created_at timestamptz not null default now(),
  atendido_at timestamptz
);

create table if not exists public.lengua_rutina_log (
  id bigserial primary key,
  tipo text not null,                        -- 5min | noche
  nota text,
  datos jsonb,
  created_at timestamptz not null default now()
);

-- RLS: la anon key lee todo y solo escribe lo que la app necesita.
alter table public.lengua_alumno enable row level security;
alter table public.lengua_pregunta enable row level security;
alter table public.lengua_respuesta enable row level security;
alter table public.lengua_cola enable row level security;
alter table public.lengua_nivel enable row level security;
alter table public.lengua_reporte enable row level security;
alter table public.lengua_rutina_log enable row level security;

do $$
declare t text;
begin
  foreach t in array array['lengua_alumno','lengua_pregunta','lengua_respuesta','lengua_cola','lengua_nivel','lengua_reporte','lengua_rutina_log'] loop
    execute format('drop policy if exists "anon read" on public.%I', t);
    execute format('create policy "anon read" on public.%I for select to anon using (true)', t);
  end loop;
end $$;

drop policy if exists "anon insert" on public.lengua_alumno;
create policy "anon insert" on public.lengua_alumno for insert to anon with check (true);
drop policy if exists "anon update" on public.lengua_alumno;
create policy "anon update" on public.lengua_alumno for update to anon using (true) with check (true);
revoke update on public.lengua_alumno from anon;
grant update (objetivo, nombre) on public.lengua_alumno to anon;

drop policy if exists "anon insert" on public.lengua_respuesta;
create policy "anon insert" on public.lengua_respuesta for insert to anon with check (true);

drop policy if exists "anon delete" on public.lengua_cola;
create policy "anon delete" on public.lengua_cola for delete to anon using (true);

drop policy if exists "anon insert" on public.lengua_reporte;
create policy "anon insert" on public.lengua_reporte for insert to anon with check (true);

-- El revisor puede retirar/reactivar una pregunta al momento (solo esa columna).
drop policy if exists "anon update" on public.lengua_pregunta;
create policy "anon update" on public.lengua_pregunta for update to anon using (true) with check (true);
revoke update on public.lengua_pregunta from anon;
grant update (activa) on public.lengua_pregunta to anon;
