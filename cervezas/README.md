# 🍺 Cervezas

Contador de cervezas entre amigos. Josema y Paco tienen cada uno su
botón de **+** y **−**; el total se suma y todo se sincroniza al
instante entre dispositivos vía Supabase Realtime.

## Esquema de Supabase

Tabla con prefijo `cervezas_` y una función RPC para sumar/restar de
forma atómica (evita condiciones de carrera si los dos le dan al botón
casi a la vez):

```sql
create table public.cervezas_contador (
  persona text primary key,
  cantidad integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.cervezas_contador enable row level security;
create policy "allow anon read" on public.cervezas_contador for select to anon using (true);
create policy "allow anon insert" on public.cervezas_contador for insert to anon with check (true);
create policy "allow anon update" on public.cervezas_contador for update to anon using (true) with check (true);

insert into public.cervezas_contador (persona, cantidad) values ('Josema', 0), ('Paco', 0);

create or replace function public.cervezas_sumar(p_persona text, p_delta integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  nuevo integer;
begin
  insert into public.cervezas_contador (persona, cantidad, updated_at)
  values (p_persona, greatest(0, p_delta), now())
  on conflict (persona) do update
    set cantidad = greatest(0, cervezas_contador.cantidad + p_delta),
        updated_at = now()
  returning cantidad into nuevo;
  return nuevo;
end;
$$;

grant execute on function public.cervezas_sumar(text, integer) to anon;

alter publication supabase_realtime add table public.cervezas_contador;
```

El contador nunca baja de 0 (el `−` se deshabilita en la UI cuando ya
está a 0, y la función lo protege igualmente con `greatest(0, ...)`).

## Añadir o cambiar personas

Las personas se listan en [`config.js`](./config.js)
(`window.CERVEZAS_CONFIG.personas`). Para añadir a alguien más, mete su
nombre en ese array y una fila nueva en `cervezas_contador` (o deja que
la primera llamada a `cervezas_sumar` la cree sola).
