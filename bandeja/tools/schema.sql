-- Bandeja: chat contigo mismo entre dispositivos.
-- La "sala" es una clave secreta larga que va en el enlace (#k=...). La
-- tabla no tiene políticas RLS para anon: todo pasa por funciones
-- security definer que exigen la clave, así que sin el enlace no se ve nada.
create table if not exists public.bandeja_items (
  id uuid primary key default gen_random_uuid(),
  room text not null,
  created_at timestamptz not null default now(),
  device text,
  body text,
  file_path text,
  file_name text,
  file_type text,
  file_size bigint,
  category text
);
create index if not exists bandeja_items_room_created on public.bandeja_items (room, created_at desc);
alter table public.bandeja_items enable row level security;

create or replace function public.bandeja_list(p_room text, p_limit int default 500)
returns setof public.bandeja_items language sql security definer set search_path = public stable as $$
  select * from (
    select * from bandeja_items where room = p_room and length(p_room) >= 16
    order by created_at desc limit least(greatest(p_limit, 1), 2000)
  ) t order by created_at asc;
$$;

create or replace function public.bandeja_post(p_room text, p_device text, p_body text,
  p_file_path text default null, p_file_name text default null, p_file_type text default null, p_file_size bigint default null)
returns public.bandeja_items language plpgsql security definer set search_path = public as $$
declare r bandeja_items;
begin
  if length(p_room) < 16 then raise exception 'sala no válida'; end if;
  if p_file_path is not null and p_file_path not like p_room || '/%' then raise exception 'ruta no válida'; end if;
  insert into bandeja_items (room, device, body, file_path, file_name, file_type, file_size)
  values (p_room, left(p_device, 60), p_body, p_file_path, p_file_name, p_file_type, p_file_size)
  returning * into r;
  return r;
end $$;

create or replace function public.bandeja_set_category(p_room text, p_id uuid, p_category text)
returns void language sql security definer set search_path = public as $$
  update bandeja_items set category = nullif(trim(p_category), '') where id = p_id and room = p_room;
$$;

create or replace function public.bandeja_delete(p_room text, p_id uuid)
returns void language sql security definer set search_path = public as $$
  delete from bandeja_items where id = p_id and room = p_room;
$$;

revoke all on function public.bandeja_list(text, int) from public;
revoke all on function public.bandeja_post(text, text, text, text, text, text, bigint) from public;
revoke all on function public.bandeja_set_category(text, uuid, text) from public;
revoke all on function public.bandeja_delete(text, uuid) from public;
grant execute on function public.bandeja_list(text, int) to anon;
grant execute on function public.bandeja_post(text, text, text, text, text, text, bigint) to anon;
grant execute on function public.bandeja_set_category(text, uuid, text) to anon;
grant execute on function public.bandeja_delete(text, uuid) to anon;

-- Adjuntos: bucket público de lectura (la ruta empieza por la clave de la
-- sala, imposible de adivinar) sin política de select, así que no se
-- puede listar. Anon solo puede subir dentro del bucket.
insert into storage.buckets (id, name, public, file_size_limit)
values ('bandeja', 'bandeja', true, 52428800)
on conflict (id) do update set public = true, file_size_limit = 52428800;
drop policy if exists "bandeja anon upload" on storage.objects;
create policy "bandeja anon upload" on storage.objects for insert to anon
  with check (bucket_id = 'bandeja' and length(split_part(name, '/', 1)) >= 16);
