// WHO GIS Surveillance Platform — Service Worker
const CACHE_NAME = "who-gis-v1";
const STATIC_CACHES = [
  "/",
  "/login",
  "/dashboard",
  "/offline.html",
];

// Install: Cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_CACHES.map((url) =>
          cache.add(url).catch(() => {
            console.warn("[SW] Failed to cache", url);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith("who-gis-") && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Cache-first for static, network-first for API
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests: Network-first with fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstWithQueue(request));
    return;
  }

  // Static assets: Cache-first
  if (request.destination === "style" || request.destination === "script" || request.destination === "font" || request.destination === "image") {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation: Network-first
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  event.respondWith(fetch(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirstWithQueue(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Queue for later sync
    const queue = await getSyncQueue();
    queue.push({
      url: request.url,
      method: request.method,
      body: request.method === "POST" ? await request.clone().text() : null,
      timestamp: Date.now(),
    });
    await saveSyncQueue(queue);

    return new Response(
      JSON.stringify({ success: false, error: { code: "OFFLINE", message: "Request queued for sync" } }),
      { status: 202, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) return response;
    throw new Error("Network failed");
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match("/offline.html");
  }
}

// IndexedDB-based sync queue
function getSyncQueue() {
  return new Promise((resolve) => {
    const request = indexedDB.open("WHOGISSyncQueue", 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("queue")) {
        db.createObjectStore("queue", { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction("queue", "readonly");
      const store = transaction.objectStore("queue");
      const getAll = store.getAll();
      getAll.onsuccess = () => resolve(getAll.result || []);
      getAll.onerror = () => resolve([]);
    };
    request.onerror = () => resolve([]);
  });
}

function saveSyncQueue(queue) {
  return new Promise((resolve) => {
    const request = indexedDB.open("WHOGISSyncQueue", 1);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction("queue", "readwrite");
      const store = transaction.objectStore("queue");
      store.clear();
      queue.forEach((item) => store.add(item));
      resolve();
    };
    request.onerror = () => resolve();
  });
}

// Background sync
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-data") {
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  const queue = await getSyncQueue();
  for (const item of queue) {
    try {
      const options = {
        method: item.method,
        headers: { "Content-Type": "application/json" },
      };
      if (item.body) options.body = item.body;
      const response = await fetch(item.url, options);
      if (response.ok) {
        const remaining = queue.filter((q) => q.timestamp !== item.timestamp);
        await saveSyncQueue(remaining);
      }
    } catch (error) {
      console.error("Background sync failed for:", item.url, error);
    }
  }
}
