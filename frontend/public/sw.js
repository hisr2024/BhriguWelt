// BhriguWelt Service Worker — v2
//
// Strategy (privacy- and deploy-safe):
//   /_next/static/*   cache-first   (content-hashed, immutable)
//   /data/*, /icons/* stale-while-revalidate
//   page navigations  network-only, offline page as fallback
//   /api/* and every cross-origin request: never cached — readings contain
//   birth data and the app stores them encrypted; the SW must not keep
//   plaintext copies.
// Bump SW_VERSION to drop all old caches on the next activation.

const SW_VERSION = 'v2';
const STATIC_CACHE = `bhriguwelt-static-${SW_VERSION}`;
const ASSET_CACHE = `bhriguwelt-assets-${SW_VERSION}`;
const SHELL_CACHE = `bhriguwelt-shell-${SW_VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, ASSET_CACHE, SHELL_CACHE];
const STATIC_MAX_ENTRIES = 300;

const SHELL = ['/offline', '/manifest.json'];
const PRECACHE_ASSETS = [
  '/data/cities.json',
  '/data/wisdom_cards.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
];

async function precache(cacheName, urls) {
  const cache = await caches.open(cacheName);
  await Promise.allSettled(
    urls.map(async (url) => {
      const response = await fetch(url, { cache: 'no-cache' });
      if (response.ok) await cache.put(url, response);
    })
  );
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - maxEntries; i++) {
    await cache.delete(keys[i]);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([precache(SHELL_CACHE, SHELL), precache(ASSET_CACHE, PRECACHE_ASSETS)])
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => !CURRENT_CACHES.includes(n)).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // backend API and third parties: browser default
  if (url.pathname.startsWith('/api/')) return;      // never cache API data

  // Hashed build assets: cache-first.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) {
          cache.put(request, response.clone());
          trimCache(STATIC_CACHE, STATIC_MAX_ENTRIES);
        }
        return response;
      })
    );
    return;
  }

  // Small public data and icons: stale-while-revalidate.
  if (url.pathname.startsWith('/data/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Pages: always fresh from the network; offline page when there is none.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match('/offline')) || Response.error())
    );
  }
});

// Background sync: ask open app windows to flush their offline queue.
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reports') {
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clients) =>
        Promise.all(
          clients.map(
            (client) =>
              new Promise((resolve) => {
                const channel = new MessageChannel();
                const timeout = setTimeout(resolve, 2000);
                channel.port1.onmessage = () => {
                  clearTimeout(timeout);
                  resolve();
                };
                client.postMessage({ type: 'SYNC_REPORTS' }, [channel.port2]);
              })
          )
        )
      )
    );
  }
});

self.addEventListener('push', (event) => {
  event.waitUntil(
    self.registration.showNotification('BhriguWelt', {
      body: event.data ? event.data.text() : 'New insight available',
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-96x96.svg',
      tag: 'bhriguwelt-notification',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('/'));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches
        .keys()
        .then((names) => Promise.all(names.map((n) => caches.delete(n))))
        .then(() => event.ports?.[0]?.postMessage({ success: true }))
    );
  }
});
