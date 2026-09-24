// Service worker mínimo: cachea el shell de la app para que la PWA arranque
// al instante. El Cache Storage es compartido por todo el origen
// (pacosql.github.io), así que el nombre de caché lleva el prefijo "logos-"
// y el cleanup de "activate" solo toca cachés con ese prefijo.
const CACHE_PREFIX = "logos-shell-";
const CACHE_NAME = `${CACHE_PREFIX}__BUILD_ID__`;
const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./config.js",
  "./fonts/poppins.css",
  "./fonts/poppins-500.woff2",
  "./fonts/poppins-600.woff2",
  "./fonts/poppins-700.woff2",
  "./fonts/poppins-800.woff2",
  "./fonts/poppins-900.woff2",
  "./fonts/poppins-700i.woff2",
  "./fonts/poppins-800i.woff2",
  "./fonts/poppins-900i.woff2",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  // Nunca cachear Supabase: los diseños nuevos tienen que verse al momento.
  if (request.url.includes(".supabase.co")) return;
  // La página, siempre de la red primero (si no, se vería un build viejo).
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("./index.html")));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});
