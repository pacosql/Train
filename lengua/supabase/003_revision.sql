-- Lengua — revisión experta (página /lengua/may/): la experta responde a
-- ciegas cada pregunta y da su veredicto. Las discrepancias, comentarios y
-- «quitar» además crean un aviso en lengua_reporte para la rutina nocturna.
create table if not exists public.lengua_revision (
  id bigserial primary key,
  revisor text not null,
  pregunta_id text not null references public.lengua_pregunta (id) on delete cascade,
  version int not null default 1,            -- versión de la pregunta que vio
  elegida int,                               -- índice original elegido (null = no lo sé)
  coincide boolean,
  veredicto text not null,                   -- ok | quitar | discrepa | comentario
  texto text,
  created_at timestamptz not null default now()
);
create index if not exists lengua_revision_rev on public.lengua_revision (revisor, pregunta_id);
alter table public.lengua_revision enable row level security;
drop policy if exists "anon read" on public.lengua_revision;
create policy "anon read" on public.lengua_revision for select to anon using (true);
drop policy if exists "anon insert" on public.lengua_revision;
create policy "anon insert" on public.lengua_revision for insert to anon with check (true);
