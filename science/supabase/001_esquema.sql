-- Science (Unit 1: Living organisms) — tablas con prefijo science_.
-- Alumno: quién juega. Respuestas: una fila por pregunta contestada.
-- Eventos: lecciones vistas y exámenes de prueba (con su nota).
create table if not exists public.science_learner (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.science_answer (
  id bigint generated always as identity primary key,
  learner_id uuid not null references public.science_learner(id) on delete cascade,
  session_id uuid,
  mode text,            -- jugar | tema | examen
  topic text,
  concept_id text,
  question_id text,
  kind text,            -- choice | label | write | tap | num | pics | order
  correct boolean not null,
  chosen text,          -- lo que contestó
  expected text,        -- la respuesta correcta
  dont_know boolean not null default false,
  ms integer,
  created_at timestamptz not null default now()
);
create index if not exists science_answer_learner_idx on public.science_answer (learner_id, created_at);

create table if not exists public.science_event (
  id bigint generated always as identity primary key,
  learner_id uuid not null references public.science_learner(id) on delete cascade,
  kind text not null,   -- lesson | exam
  topic text,
  data jsonb,
  created_at timestamptz not null default now()
);
create index if not exists science_event_learner_idx on public.science_event (learner_id, created_at);

alter table public.science_learner enable row level security;
alter table public.science_answer enable row level security;
alter table public.science_event enable row level security;

do $$
declare t text;
begin
  foreach t in array array['science_learner', 'science_answer', 'science_event'] loop
    if not exists (select 1 from pg_policies where tablename = t and policyname = 'anon read') then
      execute format('create policy "anon read" on public.%I for select to anon using (true)', t);
    end if;
    if not exists (select 1 from pg_policies where tablename = t and policyname = 'anon insert') then
      execute format('create policy "anon insert" on public.%I for insert to anon with check (true)', t);
    end if;
  end loop;
end $$;
