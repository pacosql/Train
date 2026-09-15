# Football ⚽

PWA mínima (sin build, HTML/CSS/JS puro), tipo "Hello World", que
comprueba la conexión con Supabase. Sirve para validar que el hosting
multi-app de este repo funciona de verdad. Forma parte del hosting
multi-app de este repo — ver el [README de la raíz](../README.md) para
el panorama general.

Vive en `football/` y todas sus tablas en Supabase usan el prefijo
`football_`, para poder compartir el mismo proyecto de Supabase con
otras apps de este mismo repo sin que sus tablas choquen entre sí.

## 1. Configura tus credenciales

Edita [`config.js`](./config.js) con los datos de tu proyecto (Supabase →
*Project Settings → API*):

```js
window.FOOTBALL_CONFIG = {
  url: "https://TU-PROYECTO.supabase.co",
  anonKey: "TU-ANON-KEY",
  tablePrefix: "football_",
};
```

La `anon key` es pública por diseño (se usa desde el navegador) y va
protegida por las políticas de *Row Level Security* de tus tablas, así
que no hay problema en que viva en un archivo del repo.

## 2. (Opcional) Crea la tabla de prueba

La app funciona igualmente sin esta tabla (te avisa con instrucciones si
no existe), pero para ver datos reales yendo y viniendo, ejecuta esto en
el **SQL Editor** de Supabase:

```sql
create table football_hello (
  id bigint generated always as identity primary key,
  message text not null,
  created_at timestamptz default now()
);

alter table football_hello enable row level security;

create policy "allow anon read" on football_hello
  for select to anon using (true);

create policy "allow anon insert" on football_hello
  for insert to anon with check (true);
```

## 3. Publica el sitio (GitHub Pages)

Esta app se despliega junto con el resto del hosting desde la raíz del
repo — ver el paso 3 del [README general](../README.md#3-publica-el-hosting-github-pages).
Una vez publicado, esta app queda en:

`https://<tu-usuario>.github.io/Train/football/`

## Qué hace la app

- Comprueba la conexión básica contra la API REST de Supabase (`ping`).
- Lee y escribe filas en la tabla `football_hello`, si existe.
- Se puede usar sin conexión gracias a un Service Worker que cachea el
  "shell" de la app (las llamadas a Supabase nunca se cachean). Su caché
  usa el prefijo `football-shell-` para no interferir con la de otras
  apps del mismo hosting.
- Al pie de página muestra un `build <hash>` para poder confirmar de un
  vistazo qué versión está sirviendo GitHub Pages.
