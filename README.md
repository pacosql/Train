# Hello Supabase 👋

PWA mínima (sin build, HTML/CSS/JS puro) para comprobar que la conexión a
Supabase funciona, pensada para instalarse en el iPhone como app de
pantalla de inicio.

## 1. Configura tus credenciales

Edita [`config.js`](./config.js) con los datos de tu proyecto (Supabase →
*Project Settings → API*):

```js
window.SUPABASE_CONFIG = {
  url: "https://TU-PROYECTO.supabase.co",
  anonKey: "TU-ANON-KEY",
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
create table hello (
  id bigint generated always as identity primary key,
  message text not null,
  created_at timestamptz default now()
);

alter table hello enable row level security;

create policy "allow anon read" on hello
  for select to anon using (true);

create policy "allow anon insert" on hello
  for insert to anon with check (true);
```

## 3. Publica el sitio (GitHub Pages)

1. En GitHub: **Settings → Pages → Build and deployment → Source**, elige
   **GitHub Actions** (solo hay que hacerlo una vez).
2. El workflow [`.github/workflows/pages.yml`](./.github/workflows/pages.yml)
   despliega automáticamente en cada push a `main`.
3. Para probarlo ahora mismo sin esperar al merge: pestaña **Actions** →
   *Deploy static site to Pages* → **Run workflow**, eligiendo esta rama.
4. Cuando termine, tendrás una URL tipo
   `https://<tu-usuario>.github.io/Train/`.

## 4. Instálala en el iPhone

1. Abre la URL de GitHub Pages en **Safari** (tiene que ser Safari, no
   Chrome, para que funcione "Añadir a inicio").
2. Toca el icono de compartir (el cuadrado con la flecha hacia arriba).
3. Elige **"Añadir a pantalla de inicio"**.
4. Listo: se abre a pantalla completa como una app nativa, con su propio
   icono.

## Qué hace la app

- Comprueba la conexión básica contra la API REST de Supabase (`ping`).
- Lee y escribe filas en la tabla `hello`, si existe.
- Se puede usar sin conexión gracias a un Service Worker que cachea el
  "shell" de la app (las llamadas a Supabase nunca se cachean).
