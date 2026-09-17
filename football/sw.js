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
  "./css/pack-i.css",
  "./js/game-barras2.js",
  "./js/game-dobleces.js",
  "./js/game-probetas.js",
  "./js/game-lupa.js",
  "./js/game-rebajas.js",
  "./css/pack-h.css",
  "./js/game-cifras.js",
  "./js/game-todas.js",
  "./js/game-inventa.js",
  "./js/game-criba.js",
  "./js/game-nim.js",
  "./css/pack-g.css",
  "./js/game-pentominos.js",
  "./js/game-futoshiki.js",
  "./js/game-kakuro.js",
  "./js/game-shikaku.js",
  "./js/game-magico.js",
  "./",
  "./index.html",
  "./manifest.json",
  "./config.js",
  "./css/style.css",
  "./css/pack-a.css",
  "./css/pack-b.css",
  "./css/pack-c.css",
  "./css/pack-d.css",
  "./css/pack-e.css",
  "./css/pack-f.css",
  "./js/app.js",
  "./js/utils.js",
  "./js/ratings.js",
  "./js/quiz-engine.js",
  "./js/balloons-game.js",
  "./js/games-data.js",
  "./js/games-creative.js",
  "./js/game-parejas.js",
  "./js/game-orden.js",
  "./js/game-recta.js",
  "./js/game-reloj.js",
  "./js/game-balanza.js",
  "./js/game-memoria.js",
  "./js/game-atrapa.js",
  "./js/game-bloques.js",
  "./js/game-angulo.js",
  "./js/game-puntos.js",
  "./js/games-data-2.js",
  "./js/games-creative-2.js",
  "./js/game-ruleta.js",
  "./js/game-clasifica.js",
  "./js/game-estima.js",
  "./js/game-teclado.js",
  "./js/game-barras.js",
  "./js/game-monedas.js",
  "./js/game-coordenadas.js",
  "./js/game-simetria.js",
  "./js/game-amigos10.js",
  "./js/game-area.js",
  "./js/game-laberinto.js",
  "./js/games-pack.js",
  "./js/game-pesca.js",
  "./js/game-escalera.js",
  "./js/game-tragaperras.js",
  "./js/game-dados.js",
  "./js/game-carrera.js",
  "./js/game-abaco.js",
  "./js/game-reparte.js",
  "./js/game-vaso.js",
  "./js/game-torre.js",
  "./js/game-regla.js",
  "./js/game-error.js",
  "./js/game-semaforo.js",
  "./js/game-lineas.js",
  "./js/game-colorea.js",
  "./js/game-puzle.js",
  "./js/game-calendario.js",
  "./js/game-compra.js",
  "./js/game-proporciones.js",
  "./js/game-termometro.js",
  "./js/game-brujula.js",
  "./js/game-grafica.js",
  "./js/game-tarta2.js",
  "./js/game-ritmo.js",
  "./js/game-binario.js",
  "./js/game-cubos.js",
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
