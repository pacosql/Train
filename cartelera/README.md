# Cartelera Cine 🎬

PWA (sin build, HTML/CSS/JS puro) que muestra qué películas hay en
cartelera **en la ciudad de Murcia ahora mismo**, agregando todos sus
cines en una única lista (sin separar por sala). Forma parte del hosting
multi-app de este repo — ver el [README de la raíz](../README.md) para
el panorama general.

Vive en `cartelera/` y todas sus tablas en Supabase usan el prefijo
`cartelera_`.

## Qué hace la app

- Al abrirla, muestra al instante la última cartelera guardada en
  Supabase (no hace falta esperar ni pulsar nada).
- Botón **«🔄 Actualizar»**: dispara una Edge Function de Supabase
  (`cartelera-actualizar`) que sale a buscar en la web los cines de
  Murcia, saca la lista de películas que están echando entre todos
  ellos (deduplicada) y, para cada una, su ficha (cartel, sinopsis,
  fotos, duración, género, clasificación por edad…). Tarda entre 30 s y
  2 min; mientras tanto se ve una barra de progreso y el texto de
  estado se actualiza en vivo.
- Cada película se muestra con: cartel, título, duración, género,
  clasificación por edad (con aviso claro de si es apta para todos los
  públicos o no), sinopsis, alguna foto adicional (fotograma/cartel
  alternativo, con visor a pantalla completa) y, cuando se ha podido
  extraer, un fragmento de crítica y ficha técnica.
- Instalable como PWA (Service Worker cachea el "shell"; los datos y las
  imágenes de las películas nunca se cachean, para que siempre estén al
  día).

## Arquitectura

La app en sí (HTML/JS estático en GitHub Pages) **no puede** hacer
scraping directo de otras webs desde el navegador del usuario (CORS). Por
eso el trabajo pesado —salir a internet a buscar la cartelera— lo hace
una **Edge Function de Supabase** (`cartelera-actualizar`, en
[`supabase/functions/cartelera-actualizar/index.ts`](./supabase/functions/cartelera-actualizar/index.ts)),
que:

1. Busca los cines de Murcia ciudad en una web de cartelera pública.
2. Recorre cada cine y anota qué películas proyecta (sin mostrarlas
   agrupadas por cine: solo se usa para saber qué se está echando en la
   ciudad).
3. Para cada película única, entra en su ficha y extrae título, cartel,
   fotos, sinopsis, duración, género, clasificación por edad, etc.
4. Guarda el resultado en `cartelera_peliculas` y el estado/progreso en
   `cartelera_estado`, usando la *service role key* (inyectada
   automáticamente por Supabase en toda Edge Function, nunca expuesta al
   navegador) para poder escribir saltándose RLS.

El cliente (anon key, con RLS) solo puede **leer** esas dos tablas.
Escribir en ellas solo lo puede hacer la Edge Function.

Al ser web scraping sobre una web de terceros, la extracción es
best-effort: algunos campos (crítica, director, reparto, clasificación
por edad) pueden faltar en algunas películas si la web cambia su
maquetado — la sinopsis, el cartel y las fotos son los que mejor
funcionan hoy.

### Tablas

```sql
create table cartelera_peliculas (
  id bigint generated always as identity primary key,
  slug text unique not null,
  titulo text not null,
  poster_url text,
  fotos jsonb not null default '[]'::jsonb,
  sinopsis text,
  critica text,
  clasificacion_edad text,
  genero text,
  duracion_min integer,
  director text,
  reparto text,
  fuente text,
  fuente_url text,
  actualizado_en timestamptz not null default now()
);
alter table cartelera_peliculas enable row level security;
create policy "cartelera anon read peliculas" on cartelera_peliculas
  for select to anon using (true);

create table cartelera_estado (
  id smallint primary key default 1 check (id = 1),
  estado text not null default 'nunca',      -- nunca | actualizando | ok | error
  mensaje text,
  num_peliculas integer,
  fuente text,
  iniciado_en timestamptz,
  terminado_en timestamptz
);
alter table cartelera_estado enable row level security;
create policy "cartelera anon read estado" on cartelera_estado
  for select to anon using (true);
```

### Desplegar/actualizar la Edge Function

```bash
cd cartelera/supabase/functions/cartelera-actualizar
curl -X POST "https://api.supabase.com/v1/projects/dzlhsdpgyxnjwudmrnul/functions/deploy?slug=cartelera-actualizar" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -F 'metadata={"entrypoint_path":"index.ts","name":"cartelera-actualizar","verify_jwt":true};type=application/json' \
  -F "file=@index.ts;filename=index.ts"
```

## Publicar

Esta app se despliega junto con el resto del hosting desde la raíz del
repo — ver el paso 3 del [README general](../README.md#3-publica-el-hosting-github-pages).
Una vez publicado, esta app queda en:

`https://<tu-usuario>.github.io/Train/cartelera/`
