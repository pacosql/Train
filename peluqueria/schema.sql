-- App "Peluquería": reservas de sillón. Todas las tablas con prefijo peluqueria_.
-- Demo sin seguridad: anon puede leer y escribir todo (RLS abierta).
create table if not exists public.peluqueria_peluqueros (
  id bigint generated always as identity primary key,
  nombre text not null,
  activo boolean not null default true,
  orden int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.peluqueria_ajustes (
  id int primary key default 1 check (id = 1),
  nombre_local text not null default 'Barbería Tijeras de Oro',
  duracion_min int not null default 30,
  horario jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.peluqueria_reservas (
  id bigint generated always as identity primary key,
  peluquero_id bigint not null references public.peluqueria_peluqueros(id) on delete cascade,
  fecha date not null,
  hora text not null,
  cliente text not null,
  created_at timestamptz not null default now(),
  unique (peluquero_id, fecha, hora)
);
do $$ declare t text; begin
  foreach t in array array['peluqueria_peluqueros','peluqueria_ajustes','peluqueria_reservas'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "demo all" on public.%I', t);
    execute format('create policy "demo all" on public.%I for all to anon using (true) with check (true)', t);
    execute format('grant select, insert, update, delete on public.%I to anon', t);
  end loop;
end $$;
insert into public.peluqueria_ajustes (id, horario) values (1,
  '{"1":[["09:00","14:00"],["17:00","20:00"]],"2":[["09:00","14:00"],["17:00","20:00"]],"3":[["09:00","14:00"],["17:00","20:00"]],"4":[["09:00","14:00"],["17:00","20:00"]],"5":[["09:00","14:00"],["17:00","20:00"]],"6":[["09:00","15:00"]],"0":[]}')
on conflict (id) do nothing;
insert into public.peluqueria_peluqueros (nombre, orden)
select v.n, v.o from (values ('Juan',1),('José',2),('Pepe',3)) v(n,o)
where not exists (select 1 from public.peluqueria_peluqueros);
