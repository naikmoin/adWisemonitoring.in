const CACHE_NAME = "adwise-cache-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.json",
  "./logo192.png",
  "./logo512.png",
  "./app.js",
  "./init.js"
];

// Install the service worker and cache necessary files
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker: Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("✅ Service Worker: Caching files...");
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate the service worker
self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker: Activated");
});

// Fetch files from cache or network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
