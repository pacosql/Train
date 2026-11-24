-- App "Logros": lo que has hecho cada día (logros y fracasos) con su tiempo.
create table if not exists public.logros_entradas (
  id bigint generated always as identity primary key,
  fecha date not null,
  titulo text not null,
  descripcion text not null default '',
  minutos integer check (minutos is null or (minutos >= 0 and minutos <= 1440)),
  tipo text not null default 'logro' check (tipo in ('logro','fracaso')),
  created_at timestamptz not null default now()
);
create index if not exists logros_entradas_fecha_idx on public.logros_entradas (fecha desc);
alter table public.logros_entradas enable row level security;
drop policy if exists "allow anon read" on public.logros_entradas;
drop policy if exists "allow anon insert" on public.logros_entradas;
drop policy if exists "allow anon update" on public.logros_entradas;
drop policy if exists "allow anon delete" on public.logros_entradas;
create policy "allow anon read" on public.logros_entradas for select to anon using (true);
create policy "allow anon insert" on public.logros_entradas for insert to anon with check (true);
create policy "allow anon update" on public.logros_entradas for update to anon using (true) with check (true);
create policy "allow anon delete" on public.logros_entradas for delete to anon using (true);
