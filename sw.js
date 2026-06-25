// Service worker — Clash of the Last Chance
// Bump CACHE when you ship changes so clients pull the new version.
const CACHE = 'clash-lastchance-v35';

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

  // TOUT en NETWORK-FIRST : on récupère toujours la version fraîche du serveur,
  // le cache ne sert QUE de repli hors-ligne. Plus jamais de "rien n'a changé".
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
