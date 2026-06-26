// Service worker — Clash of the Last Chance
// Bump CACHE when you ship changes so clients pull the new version.
const CACHE = 'clash-lastchance-v51';

// App shell precached on install so the game boots offline.
const SHELL = [
  './',
  './index.html',
  './three.min.js',
  './manifest.json',
  './assets/apple-touch-icon.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/SupercellMagic.ttf',
  './assets/intro.mp3',
  './assets/ui_brandlogo.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Navigations: network-first so updates land, fall back to cached shell offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Assets statiques (images/polices/audio) : CACHE-FIRST -> chargement INSTANTANÉ après la 1re fois,
  // plus de "galère à charger". Le bump de CACHE à chaque déploiement force la récupération des nouveaux.
  // En tâche de fond, on rafraîchit le cache (stale-while-revalidate) pour la prochaine fois.
  if (/\.(png|jpe?g|webp|gif|svg|woff2?|ttf|otf|mp3|ogg|wav)$/i.test(new URL(req.url).pathname)) {
    e.respondWith(
      caches.match(req).then((hit) => {
        const net = fetch(req).then((res) => {
          if (res && (res.ok || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        }).catch(() => hit);
        return hit || net;   // sert le cache tout de suite s'il existe, sinon attend le réseau
      })
    );
    return;
  }

  // Le reste (JS, JSON, etc.) : NETWORK-FIRST -> toujours frais, cache en repli hors-ligne.
  e.respondWith(
    fetch(req).then((res) => {
      if (res && (res.ok || res.type === 'opaque')) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match(req))
  );
});
