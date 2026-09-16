# Pistas 🎾 — Eduardo Carrillo Tenis & Pádel Club

Prototipo funcional (sin build, HTML/CSS/JS puro) de reserva de pistas
para un club de tenis y pádel. Forma parte del hosting multi-app de
este repo — ver el [README de la raíz](../README.md) para el panorama
general.

Vive en `pistas/` y todas sus tablas en Supabase usan el prefijo
`pistas_`.

## Qué hace

- **Portada** con el nombre del club (mapa isométrico de las 13 pistas
  de fondo) y un botón "Reservar pista".
- Filtros de **día** (próximos 14 días), **duración** (60 / 90 / 120
  min) y **hora de inicio** (huecos cada 30 min, de 9:00 a 23:00).
- **Mapa de pistas** agrupado por tipo, con cada pista dibujada (pista
  de tenis con sus líneas, pista de pádel con paredes de cristal) y
  coloreada por superficie: azul = pista dura, marrón = tierra batida,
  verde = hierba, morado = pádel. Cada tarjeta muestra si esa pista
  está libre u ocupada para el filtro actual, y arriba un resumen
  ("8 de 13 pistas libres · mié 16 sept · 20:30–21:30").
- Los huecos de hoy que ya han pasado se ven (el día siempre se muestra
  desde las 9:00) pero tachados y no reservables; por defecto se
  selecciona el próximo hueco disponible.
- **Horario del día por pista**: al pulsar "ver horario" (o sobre una
  pista ocupada) se abre el detalle de esa pista con los 28 huecos de
  media hora del día, para elegir directamente uno libre.
- **Reservar**: confirma pista/fecha/hora, pide nombre y teléfono
  (opcional) y crea la reserva. Si dos personas reservan el mismo
  hueco a la vez, la base de datos rechaza la segunda automáticamente
  (ver más abajo) y la app avisa para elegir otro horario.
- **Mis reservas**: reservas hechas desde ese mismo dispositivo
  (guardadas en `localStorage`), con contador en la cabecera y opción
  de cancelar. El nombre y teléfono de la última reserva se recuerdan
  para no volver a teclearlos.
- El service worker sirve el shell de la app con estrategia "red
  primero": cada despliegue se ve a la primera carga, y la caché solo
  se usa sin conexión.

## Pistas del club

| Tipo | Cantidad | Nombres |
|---|---|---|
| 🔵 Tenis pista dura | 3 | Tenis Dura 1–3 |
| 🟤 Tenis tierra batida | 3 | Tenis Tierra 1–3 |
| 🟢 Tenis hierba | 2 | Tenis Hierba 1–2 |
| 🟣 Pádel | 5 | Pádel 1–5 |

Los tres tipos de superficie de tenis del club se llaman siempre
"hierba", "tierra batida" y "pista dura" — sin usar otros sinónimos
("césped", "pista rápida", "cemento"...) en ningún sitio.

## Esquema de datos (Supabase)

Dos tablas, ambas con RLS activada y abiertas a `anon` (ver
"Limitaciones" más abajo):

```sql
create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table public.pistas_courts (
  id bigint generated always as identity primary key,
  name text not null unique,
  type text not null check (type in ('tenis_dura','tenis_tierra','tenis_cesped','padel')),
  sort_order int not null default 0
);
alter table public.pistas_courts enable row level security;
create policy "allow anon read courts" on public.pistas_courts for select to anon using (true);

create table public.pistas_reservas (
  id bigint generated always as identity primary key,
  court_id bigint not null references public.pistas_courts(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  duration_minutes int not null check (duration_minutes in (60,90,120)),
  customer_name text not null,
  customer_phone text,
  cancel_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- una pista no puede tener dos reservas que se solapen en el tiempo
  constraint pistas_reservas_no_overlap
    exclude using gist (court_id with =, tstzrange(start_time, end_time) with &&)
);
alter table public.pistas_reservas enable row level security;
create policy "allow anon read reservas" on public.pistas_reservas for select to anon using (true);
create policy "allow anon insert reservas" on public.pistas_reservas for insert to anon with check (true);
create policy "allow anon delete reservas" on public.pistas_reservas for delete to anon using (true);
```

La restricción `pistas_reservas_no_overlap` es lo que impide el doble
reservado de una pista aunque dos personas pulsen "reservar" a la vez:
la segunda inserción falla con el código `23P01`, y la app lo detecta
y refresca el mapa.

Las 13 pistas se insertaron una sola vez con el `name` como clave para
poder repetir el `insert ... on conflict (name) do nothing` sin
duplicarlas.

## Limitaciones conocidas (es un prototipo)

- **Sin login**: cualquiera puede reservar o cancelar cualquier
  reserva llamando directamente a la API de Supabase (la app solo
  enseña el botón de cancelar para las reservas hechas en ese
  navegador, vía `localStorage`, pero no lo impide a nivel de base de
  datos). Para producción real: añadir Supabase Auth y políticas RLS
  por usuario (`user_id = auth.uid()`).
- Los nombres/teléfonos de todas las reservas son legibles por
  cualquiera con la anon key (no hay restricción por columnas). No
  poner datos sensibles de verdad hasta resolver el punto anterior.
- Todo funciona en la zona horaria del navegador de cada persona
  (asume que el club y sus clientes están en la misma zona horaria).

## Publicar

Se despliega junto con el resto del hosting desde la raíz del repo —
ver el paso 3 del [README general](../README.md#3-publica-el-hosting-github-pages).
URL final: `https://<tu-usuario>.github.io/Train/pistas/`
