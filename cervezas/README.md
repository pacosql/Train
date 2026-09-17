# 🍺 Cervezas

Contador de cervezas entre amigos, con caricatura y todo. Josema (con
gorra) y Paco (con menos pelo) tienen cada uno su avatar, su jarra que
se va llenando, su botón de **+** y **−**, y arriba un marcador "esta
noche" tipo versus con corona para quien va ganando. Todo se sincroniza
al instante entre dispositivos vía Supabase Realtime.

- **Esta noche**: cuenta desde las 11:00 de la mañana (si son las 3 de
  la madrugada, sigue contando como "de anoche"). Es la que manda en el
  marcador, la jarra y la corona.
- **Total histórico**: el contador de siempre, se muestra como texto
  pequeño bajo cada jarra.

## Esquema de Supabase

Tablas con prefijo `cervezas_` y dos funciones RPC: una para sumar/restar
de forma atómica (evita condiciones de carrera si los dos le dan al botón
casi a la vez) y otra para calcular el marcador de "esta noche":

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

-- Log de eventos para poder calcular "esta noche" sin tocar el total
create table public.cervezas_eventos (
  id bigserial primary key,
  persona text not null,
  delta integer not null,
  created_at timestamptz not null default now()
);

alter table public.cervezas_eventos enable row level security;
create policy "allow anon read eventos" on public.cervezas_eventos for select to anon using (true);
create index cervezas_eventos_created_at_idx on public.cervezas_eventos (created_at);

-- cervezas_sumar inserta también en cervezas_eventos dentro de la misma
-- transacción (ver la versión final de la función más abajo)

create or replace function public.cervezas_esta_noche(p_desde timestamptz)
returns table(persona text, cantidad bigint)
language sql
stable
as $$
  select persona, coalesce(sum(delta), 0)::bigint as cantidad
  from public.cervezas_eventos
  where created_at >= p_desde
  group by persona;
$$;

grant execute on function public.cervezas_esta_noche(timestamptz) to anon;

alter publication supabase_realtime add table public.cervezas_eventos;
```

`cervezas_sumar` en producción también inserta en `cervezas_eventos`
(mismo `persona`/`delta`) dentro de la misma transacción, así el total
histórico y el marcador de "esta noche" nunca se desincronizan:

```sql
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

  insert into public.cervezas_eventos (persona, delta) values (p_persona, p_delta);

  return nuevo;
end;
$$;
```

El contador nunca baja de 0 (el `−` se deshabilita en la UI cuando ya
está a 0 esta noche, y la función lo protege igualmente con
`greatest(0, ...)` en el total histórico).

## Avatares

Josema y Paco son ilustraciones sencillas en SVG dentro de
[`index.html`](./index.html) (no hay fotos ni ficheros de imagen): cara
redonda, Josema con gorra roja y Paco con menos pelo, cada uno con el
color de su serie (rojo/azul) a juego con su jarra y su barra en el
marcador.

## Añadir o cambiar personas

Las personas se listan en [`config.js`](./config.js)
(`window.CERVEZAS_CONFIG.personas`), pero los avatares y el color de
cada uno están escritos a mano en `index.html` (es una app pensada para
estos dos). Para añadir a alguien más habría que darle su propio avatar,
color y tarjeta en el HTML, además de su fila en `cervezas_contador`.
