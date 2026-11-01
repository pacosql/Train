create table if not exists public.hucha_movimientos (
  id bigint generated always as identity primary key,
  fecha date not null,
  tipo text not null check (tipo in ('entrada','retirada')),
  importe numeric(12,2) not null check (importe > 0),
  origen text not null default 'Otro',
  concepto text not null default '',
  created_at timestamptz not null default now()
);
alter table public.hucha_movimientos enable row level security;
drop policy if exists "allow anon read" on public.hucha_movimientos;
create policy "allow anon read" on public.hucha_movimientos for select to anon using (true);

create table if not exists public.hucha_ajustes (clave text primary key, valor text not null);
alter table public.hucha_ajustes enable row level security;
create extension if not exists pgcrypto with schema extensions;
insert into public.hucha_ajustes(clave, valor) values ('pin_hash', extensions.crypt('<PIN>', extensions.gen_salt('bf')))
  on conflict (clave) do update set valor = excluded.valor;

create or replace function public.hucha_pin_ok(p_pin text) returns boolean
language sql security definer set search_path = public, extensions as $$
  select exists(select 1 from public.hucha_ajustes where clave='pin_hash' and valor = extensions.crypt(p_pin, valor));
$$;

create or replace function public.hucha_saldo(p_fecha date) returns numeric
language sql security definer set search_path = public as $$
  select coalesce(sum(case when tipo='entrada' then 1 else -1 end * importe * power(1.1::numeric, (p_fecha - fecha)::numeric / 365.25)), 0)
  from public.hucha_movimientos where fecha <= p_fecha;
$$;

create or replace function public.hucha_movimiento(p_pin text, p_fecha date, p_tipo text, p_importe numeric, p_origen text, p_concepto text)
returns public.hucha_movimientos
language plpgsql security definer set search_path = public as $$
declare r public.hucha_movimientos;
begin
  if not public.hucha_pin_ok(p_pin) then raise exception 'PIN incorrecto'; end if;
  if p_fecha > current_date + 1 then raise exception 'La fecha no puede ser futura'; end if;
  if p_importe is null or p_importe <= 0 then raise exception 'Importe no válido'; end if;
  if p_tipo = 'retirada' and public.hucha_saldo(p_fecha) + 0.005 < p_importe then
    raise exception 'No hay tanto dinero en la hucha en esa fecha';
  end if;
  insert into public.hucha_movimientos(fecha, tipo, importe, origen, concepto)
    values (p_fecha, p_tipo, round(p_importe, 2), coalesce(nullif(p_origen,''),'Otro'), coalesce(p_concepto,''))
    returning * into r;
  return r;
end $$;

create or replace function public.hucha_borrar(p_pin text, p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.hucha_pin_ok(p_pin) then raise exception 'PIN incorrecto'; end if;
  delete from public.hucha_movimientos where id = p_id;
end $$;

revoke all on function public.hucha_pin_ok(text) from public;
grant execute on function public.hucha_movimiento(text,date,text,numeric,text,text) to anon;
grant execute on function public.hucha_borrar(text,bigint) to anon;
grant execute on function public.hucha_saldo(date) to anon;
