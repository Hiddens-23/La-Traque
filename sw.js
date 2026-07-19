// Service Worker - La Traque
// Met en cache uniquement le "coquille" de l'app (HTML, manifest, icônes).
// Les requêtes vers youtube.com / ytimg.com (musique d'ambiance) sont
// volontairement laissées en réseau direct : elles ne peuvent pas être
// mises en cache (streaming), donc sans connexion, le jeu tourne
// normalement mais sans musique.

const CACHE_NAME = 'la-traque-cache-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ne jamais intercepter les requêtes vers d'autres domaines
  // (YouTube, etc.) : on les laisse filer directement au réseau.
  if (url.origin !== self.location.origin) return;

  // Seules les requêtes GET sont mises en cache.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => cached);
    })
  );
});
