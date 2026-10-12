-- Orto: esquema en el Supabase compartido del hosting Train. Todo con
-- prefijo orto_. Prototipo sin autenticación (como el resto de apps del
-- hosting): la anon key puede leer y escribir estas tablas.
create table if not exists public.orto_usuario (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  edad int,
  prueba_hecha boolean not null default false,
  score int,
  faltas numeric,
  nivel text,
  creado_en timestamptz not null default now()
);

-- Dominio (probabilidad BKT) de cada competencia por usuario.
create table if not exists public.orto_dominio (
  usuario_id uuid not null references public.orto_usuario(id) on delete cascade,
  competencia text not null,
  p numeric not null,
  intentos int not null default 0,
  aciertos int not null default 0,
  ultimo timestamptz,
  primary key (usuario_id, competencia)
);

-- Cada respuesta.
create table if not exists public.orto_intento (
  id bigserial primary key,
  usuario_id uuid not null references public.orto_usuario(id) on delete cascade,
  sesion uuid,
  fase text not null default 'practica',      -- prueba | practica | juego
  competencia text not null,
  item text,
  mecanica text,
  palabra text,                               -- palabra evaluada (para el ranking)
  correcto boolean not null,
  respuesta text,
  ms int,
  creado_en timestamptz not null default now()
);
create index if not exists orto_intento_usuario on public.orto_intento (usuario_id, creado_en desc);
create index if not exists orto_intento_palabra on public.orto_intento (palabra);

-- Historia del OrtoScore.
create table if not exists public.orto_score (
  id bigserial primary key,
  usuario_id uuid not null references public.orto_usuario(id) on delete cascade,
  score int not null,
  faltas numeric not null,
  nivel text,
  motivo text,
  creado_en timestamptz not null default now()
);

-- Ranking de palabras más falladas por todos los usuarios.
create or replace view public.orto_palabras_dificiles as
  select palabra, min(competencia) as competencia, count(*)::int as intentos,
         count(*) filter (where not correcto)::int as fallos,
         round((count(*) filter (where not correcto))::numeric / count(*), 3) as tasa
  from public.orto_intento
  where palabra is not null and palabra <> ''
  group by palabra
  having count(*) >= 2;

alter table public.orto_usuario enable row level security;
alter table public.orto_dominio enable row level security;
alter table public.orto_intento enable row level security;
alter table public.orto_score enable row level security;

do $$
declare t text;
begin
  foreach t in array array['orto_usuario','orto_dominio','orto_intento','orto_score'] loop
    execute format('drop policy if exists "anon select" on public.%I', t);
    execute format('drop policy if exists "anon insert" on public.%I', t);
    execute format('drop policy if exists "anon update" on public.%I', t);
    execute format('create policy "anon select" on public.%I for select to anon using (true)', t);
    execute format('create policy "anon insert" on public.%I for insert to anon with check (true)', t);
    execute format('create policy "anon update" on public.%I for update to anon using (true) with check (true)', t);
  end loop;
end $$;

grant select, insert, update on public.orto_usuario, public.orto_dominio, public.orto_intento, public.orto_score to anon;
grant usage, select on sequence public.orto_intento_id_seq, public.orto_score_id_seq to anon;
grant select on public.orto_palabras_dificiles to anon;
