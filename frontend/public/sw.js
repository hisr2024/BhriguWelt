// BhriguWelt Service Worker - Offline-First PWA
// Version 1.2.0 - Fixed cache.addAll error with graceful individual caching

const CACHE_NAME = 'bhriguwelt-v1.2';
const RUNTIME_CACHE = 'bhriguwelt-runtime-v1.2';
const DATA_CACHE = 'bhriguwelt-data-v1.2';

// Core app shell - cache immediately for offline-first experience
const APP_SHELL = [
  '/',
  '/offline',
  '/manifest.json',
  '/data/cities.json',
  '/data/wisdom_cards.json',
];

// Assets to cache (lazy-loaded)
const ASSETS_TO_CACHE = [
  '/icons/icon-72x72.svg',
  '/icons/icon-96x96.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
];

// API endpoints that should use network-first strategy
const API_ROUTES = ['/api/'];

// Data routes that should use cache-first strategy
const DATA_ROUTES = ['/data/'];

// Helper function to cache resources individually (graceful fallback)
async function cacheResourcesIndividually(cache, resources) {
  const results = await Promise.allSettled(
    resources.map(async (resource) => {
      try {
        const response = await fetch(resource, { cache: 'no-cache' });
        if (response.ok) {
          await cache.put(resource, response);
          return { resource, status: 'cached' };
        }
        return { resource, status: 'skipped', reason: `HTTP ${response.status}` };
      } catch (error) {
        return { resource, status: 'failed', reason: error.message };
      }
    })
  );

  const failed = results.filter(r => r.value?.status === 'failed');
  const skipped = results.filter(r => r.value?.status === 'skipped');
  const cached = results.filter(r => r.value?.status === 'cached');

  console.log(`[SW] Cached: ${cached.length}, Skipped: ${skipped.length}, Failed: ${failed.length}`);
  if (failed.length > 0) {
    console.warn('[SW] Failed resources:', failed.map(r => r.value?.resource));
  }

  return { cached: cached.length, failed: failed.length, skipped: skipped.length };
}

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v1.2...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Caching app shell and essential assets');
      // Cache resources individually to prevent one failure from stopping others
      await cacheResourcesIndividually(cache, [...APP_SHELL, ...ASSETS_TO_CACHE]);
    }).then(() => {
      console.log('[SW] Installation complete');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('[SW] Installation error:', error);
      // Still skip waiting even if caching partially failed
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v1.2...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![CACHE_NAME, RUNTIME_CACHE, DATA_CACHE].includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except API)
  if (url.origin !== location.origin) {
    // For API calls to backend, try network only
    if (url.href.includes('/api/')) {
      event.respondWith(
        fetch(request).catch(() => {
          return new Response(JSON.stringify({
            error: 'offline',
            message: 'API unavailable offline. Please use offline mode.'
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );
      return;
    }
    return;
  }

  // Data files: Cache-first strategy (cities, wisdom cards)
  if (DATA_ROUTES.some(route => url.pathname.includes(route))) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] Serving from data cache:', url.pathname);
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(DATA_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // API routes: Network-first strategy
  if (API_ROUTES.some(route => url.pathname.includes(route))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cached API response if available
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[SW] Serving stale API data from cache:', url.pathname);
              return cachedResponse;
            }
            
            // No cache available, return offline error
            return new Response(JSON.stringify({
              error: 'offline',
              message: 'API unavailable and no cached data'
            }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Default: Network-first, fallback to cache, then offline page
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone the response before caching
        const responseToCache = response.clone();

        // Cache successful responses
        if (response.status === 200) {
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Serving from cache:', url.pathname);
            return cachedResponse;
          }

          // If not in cache and it's a navigation request, show offline page
          if (request.mode === 'navigate') {
            return caches.match('/offline');
          }

          // Return a basic offline response for other requests
          return new Response('Offline - Content not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          });
        });
      })
  );
});

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'sync-reports') {
    event.waitUntil(syncReports());
  }
});

// Push notification support (for future features)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  const options = {
    body: event.data ? event.data.text() : 'New insight available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    tag: 'bhriguwelt-notification',
  };

  event.waitUntil(
    self.registration.showNotification('BhriguWelt', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

// Helper function for syncing reports
async function syncReports() {
  try {
    console.log('[SW] Syncing reports...');

    const clientsList = await self.clients.matchAll({
      includeUncontrolled: true,
      type: 'window',
    });

    if (!clientsList.length) {
      console.log('[SW] No active clients available for report sync');
      return;
    }

    await Promise.all(
      clientsList.map(
        (client) =>
          new Promise((resolve) => {
            const channel = new MessageChannel();
            const timeout = setTimeout(resolve, 2000);

            channel.port1.onmessage = () => {
              clearTimeout(timeout);
              resolve();
            };

            client.postMessage(
              { type: 'SYNC_REPORTS' },
              [channel.port2]
            );
          })
      )
    );

    console.log('[SW] Report sync request dispatched');
  } catch (error) {
    console.error('[SW] Error syncing reports:', error);
    return Promise.reject(error);
  }
}

// Message handler for communication with the app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});
