-- Gastos: archivo de extractos bancarios y de tarjetas, con mapa de huecos.
--
-- El "archivo" (room) es el SHA-256 de la contraseña que el usuario elige
-- en la app (64 caracteres hex). Las tablas no tienen políticas RLS para
-- anon: todo pasa por funciones security definer que exigen esa clave,
-- así que sin la contraseña no se ve nada. La rutina de proceso no usa la
-- anon key: escribe con la Management API (tools/db.py).

create table if not exists public.gastos_archivos (
  id uuid primary key default gen_random_uuid(),
  room text not null,
  created_at timestamptz not null default now(),
  nombre text not null,          -- nombre original del fichero
  path text not null,            -- ruta en el bucket "gastos": <room>/<id>/<nombre seguro>
  mime text,
  tamano bigint,
  sha256 text,                   -- para avisar de duplicados
  nota_usuario text,             -- pista opcional ("Visa de Ana", "cuenta en USD")
  estado text not null default 'pendiente', -- pendiente · procesado · error · ignorado
  tipo_doc text,                 -- extracto · movimientos · resumen_tarjeta · otro
  resumen text,                  -- lo escribe la rutina (o el motivo del error)
  procesado_en timestamptz
);
create unique index if not exists gastos_archivos_room_sha on public.gastos_archivos (room, sha256);
create index if not exists gastos_archivos_room_created on public.gastos_archivos (room, created_at);

create table if not exists public.gastos_cuentas (
  id uuid primary key default gen_random_uuid(),
  room text not null,
  created_at timestamptz not null default now(),
  banco text not null,
  tipo text not null default 'cuenta', -- cuenta · tarjeta · ahorro · inversion · otro
  numero text not null,                -- tal como aparece (IBAN, últimos 4 de la tarjeta…)
  numero_norm text not null,           -- sin espacios ni guiones, en mayúsculas: clave de cruce
  divisa text not null default 'EUR',
  titular text,
  alias text,                          -- lo pone el usuario
  esperado_desde date,                 -- "quiero histórico desde…" (por defecto, el primer extracto)
  cerrada_en date,                     -- a partir de aquí no se esperan extractos
  meses_ignorados text[] not null default '{}' -- 'YYYY-MM' sin extracto a propósito
);
create unique index if not exists gastos_cuentas_room_num on public.gastos_cuentas (room, banco, numero_norm, divisa);

-- Qué periodo de qué cuenta cubre cada archivo (un PDF puede traer varias cuentas).
create table if not exists public.gastos_periodos (
  id uuid primary key default gen_random_uuid(),
  room text not null,
  archivo_id uuid not null references public.gastos_archivos(id) on delete cascade,
  cuenta_id uuid not null references public.gastos_cuentas(id) on delete cascade,
  desde date not null,
  hasta date not null,
  saldo_inicial numeric,
  saldo_final numeric,
  num_movimientos int not null default 0
);
create index if not exists gastos_periodos_cuenta on public.gastos_periodos (cuenta_id, desde);

create table if not exists public.gastos_movimientos (
  id bigint generated always as identity primary key,
  room text not null,
  archivo_id uuid not null references public.gastos_archivos(id) on delete cascade,
  cuenta_id uuid not null references public.gastos_cuentas(id) on delete cascade,
  fecha date not null,
  fecha_valor date,
  concepto text,
  importe numeric not null,
  divisa text,
  saldo numeric
);
create index if not exists gastos_movimientos_cuenta_fecha on public.gastos_movimientos (cuenta_id, fecha);

-- Notas de la rutina para el usuario (lo que no se deduce solo del calendario).
create table if not exists public.gastos_avisos (
  id uuid primary key default gen_random_uuid(),
  room text not null,
  created_at timestamptz not null default now(),
  cuenta_id uuid references public.gastos_cuentas(id) on delete cascade,
  texto text not null
);

create table if not exists public.gastos_rutinas (
  id bigint generated always as identity primary key,
  ejecutada_en timestamptz not null default now(),
  procesados int not null default 0,
  resumen text
);

alter table public.gastos_archivos enable row level security;
alter table public.gastos_cuentas enable row level security;
alter table public.gastos_periodos enable row level security;
alter table public.gastos_movimientos enable row level security;
alter table public.gastos_avisos enable row level security;
alter table public.gastos_rutinas enable row level security;

-- Todo el estado de un archivo en una llamada (sin movimientos sueltos:
-- van resumidos por cuenta y mes).
create or replace function public.gastos_estado(p_room text)
returns jsonb language sql security definer set search_path = public stable as $$
  select case when length(p_room) < 32 then null else jsonb_build_object(
    'archivos', coalesce((select jsonb_agg(to_jsonb(a) - 'room' order by a.created_at) from gastos_archivos a where a.room = p_room), '[]'),
    'cuentas', coalesce((select jsonb_agg(to_jsonb(c) - 'room' - 'numero_norm' order by c.banco, c.tipo, c.numero) from gastos_cuentas c where c.room = p_room), '[]'),
    'periodos', coalesce((select jsonb_agg(to_jsonb(p) - 'room' order by p.desde) from gastos_periodos p where p.room = p_room), '[]'),
    'meses', coalesce((select jsonb_agg(m) from (
        select cuenta_id, to_char(fecha, 'YYYY-MM') as mes, count(*) as n,
               sum(importe) filter (where importe > 0) as entradas, sum(importe) filter (where importe < 0) as salidas
        from gastos_movimientos where room = p_room group by 1, 2) m), '[]'),
    'avisos', coalesce((select jsonb_agg(to_jsonb(v) - 'room' order by v.created_at) from gastos_avisos v where v.room = p_room), '[]'),
    'rutina', (select to_jsonb(r) from gastos_rutinas r order by ejecutada_en desc limit 1)
  ) end;
$$;

create or replace function public.gastos_subir(p_room text, p_nombre text, p_path text, p_mime text,
  p_tamano bigint, p_sha256 text, p_nota text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r gastos_archivos; prev gastos_archivos;
begin
  if length(p_room) < 32 then raise exception 'archivo no válido'; end if;
  if p_path not like p_room || '/%' then raise exception 'ruta no válida'; end if;
  select * into prev from gastos_archivos where room = p_room and sha256 = p_sha256;
  if found then return jsonb_build_object('duplicado', true, 'archivo', to_jsonb(prev) - 'room'); end if;
  insert into gastos_archivos (room, nombre, path, mime, tamano, sha256, nota_usuario)
  values (p_room, left(p_nombre, 300), p_path, p_mime, p_tamano, p_sha256, nullif(trim(p_nota), ''))
  returning * into r;
  return jsonb_build_object('duplicado', false, 'archivo', to_jsonb(r) - 'room');
end $$;

-- ¿Ya tengo este fichero? (antes de subirlo, para no gastar subida).
create or replace function public.gastos_existe(p_room text, p_sha256 text)
returns text language sql security definer set search_path = public stable as $$
  select nombre from gastos_archivos where room = p_room and sha256 = p_sha256 and length(p_room) >= 32;
$$;

create or replace function public.gastos_borrar_archivo(p_room text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from gastos_archivos where id = p_id and room = p_room;
  -- Cuentas que se quedan sin ningún extracto desaparecen.
  delete from gastos_cuentas c where c.room = p_room
    and not exists (select 1 from gastos_periodos p where p.cuenta_id = c.id);
end $$;

-- Vuelve a la cola de la rutina (con una nota nueva, si se da).
create or replace function public.gastos_reprocesar(p_room text, p_id uuid, p_nota text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  update gastos_archivos set estado = 'pendiente', procesado_en = null,
    nota_usuario = coalesce(nullif(trim(p_nota), ''), nota_usuario)
  where id = p_id and room = p_room;
end $$;

create or replace function public.gastos_editar_cuenta(p_room text, p_id uuid, p_alias text,
  p_esperado_desde date, p_cerrada_en date, p_meses_ignorados text[])
returns void language sql security definer set search_path = public as $$
  update gastos_cuentas set alias = nullif(trim(p_alias), ''), esperado_desde = p_esperado_desde,
    cerrada_en = p_cerrada_en, meses_ignorados = coalesce(p_meses_ignorados, '{}')
  where id = p_id and room = p_room;
$$;

-- Movimientos para el .zip, por páginas (PostgREST corta en 1000 filas).
create or replace function public.gastos_movimientos_pag(p_room text, p_offset int default 0, p_limit int default 1000)
returns jsonb language sql security definer set search_path = public stable as $$
  select coalesce(jsonb_agg(to_jsonb(m) - 'room' order by m.cuenta_id, m.fecha, m.id), '[]') from (
    select * from gastos_movimientos where room = p_room and length(p_room) >= 32
    order by cuenta_id, fecha, id offset greatest(p_offset, 0) limit least(greatest(p_limit, 1), 1000)
  ) m;
$$;

revoke all on function public.gastos_estado(text) from public;
revoke all on function public.gastos_subir(text, text, text, text, bigint, text, text) from public;
revoke all on function public.gastos_existe(text, text) from public;
revoke all on function public.gastos_borrar_archivo(text, uuid) from public;
revoke all on function public.gastos_reprocesar(text, uuid, text) from public;
revoke all on function public.gastos_editar_cuenta(text, uuid, text, date, date, text[]) from public;
revoke all on function public.gastos_movimientos_pag(text, int, int) from public;
grant execute on function public.gastos_estado(text) to anon;
grant execute on function public.gastos_subir(text, text, text, text, bigint, text, text) to anon;
grant execute on function public.gastos_existe(text, text) to anon;
grant execute on function public.gastos_borrar_archivo(text, uuid) to anon;
grant execute on function public.gastos_reprocesar(text, uuid, text) to anon;
grant execute on function public.gastos_editar_cuenta(text, uuid, text, date, date, text[]) to anon;
grant execute on function public.gastos_movimientos_pag(text, int, int) to anon;

-- Ficheros: bucket público de lectura por URL (la ruta empieza por la
-- clave del archivo, imposible de adivinar) sin política de select, así
-- que no se puede listar. Anon solo puede subir.
insert into storage.buckets (id, name, public, file_size_limit)
values ('gastos', 'gastos', true, 52428800)
on conflict (id) do update set public = true, file_size_limit = 52428800;
drop policy if exists "gastos anon upload" on storage.objects;
create policy "gastos anon upload" on storage.objects for insert to anon
  with check (bucket_id = 'gastos' and length(split_part(name, '/', 1)) >= 32);
