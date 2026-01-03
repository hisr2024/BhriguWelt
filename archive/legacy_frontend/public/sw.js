/* global self, caches, fetch, URL, Request, crypto, TextEncoder */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `bhriguwelt-static-${CACHE_VERSION}`;
const ENGINE_CACHE = `bhriguwelt-engine-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";
const ENGINE_ENDPOINTS = [
  "/horoscope",
  "/timeline",
  "/past-life",
  "/future",
  "/future-directives",
  "/past-future",
  "/matchmaking",
  "/matchmaking/pipeline",
  "/matchmaking/diagnostics",
  "/varshaphal",
  "/calendar",
  "/transits",
  "/core-wisdom",
  "/core-engines",
  "/implementation-core",
  "/karmic-dashboard",
  "/experience-flow",
  "/wisdom-aggregator",
  "/wisdom-bot",
  "/chat",
];

const textEncoder = new TextEncoder();

async function hashBody(body) {
  const data = textEncoder.encode(body);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function buildCacheKey(request) {
  const body = await request.clone().text();
  const hash = await hashBody(body || "");
  const url = new URL(request.url);
  url.searchParams.set("bhriguwelt_cache", hash);
  return new Request(url.toString(), { method: "GET" });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(["/", OFFLINE_URL, "/manifest.json", "/logo.svg"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              (key.startsWith("bhriguwelt-static-") && key !== STATIC_CACHE) ||
              (key.startsWith("bhriguwelt-engine-") && key !== ENGINE_CACHE)
          )
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  if (request.method === "POST" && ENGINE_ENDPOINTS.includes(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ENGINE_CACHE);
        const cacheKey = await buildCacheKey(request);
        const cached = await cache.match(cacheKey);

        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.put(cacheKey, response.clone());
          }
          return response;
        } catch (error) {
          if (cached) {
            return cached;
          }
          throw error;
        }
      })()
    );
    return;
  }

  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((response) => {
        const responseClone = response.clone();
        caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone));
        return response;
      });
    })
  );
});
