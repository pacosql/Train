// Service worker mínimo: cachea el shell de la app para que la PWA
// arranque instantáneamente y funcione (parcialmente) offline.
//
// Este repo aloja varias apps en subcarpetas distintas, cada una con su
// propio service worker, pero el Cache Storage es compartido por todo el
// origen (pacosql.github.io). Por eso el nombre de caché lleva el prefijo
// "football-" y el cleanup de "activate" solo toca cachés con ese prefijo,
// para no borrar nunca la caché de otra app del mismo hosting.
const CACHE_PREFIX = "football-shell-";
const CACHE_NAME = `${CACHE_PREFIX}__BUILD_ID__`;
const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./config.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Nunca cachear llamadas a Supabase: siempre queremos datos frescos.
  if (request.url.includes(".supabase.co")) return;

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
