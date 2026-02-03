const CACHE_NAME = "blog-pwa-v1";

const ASSETS = [
    "/",
    "/index.html",
    "/offline.html"
];

// Install – cacha HTML
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

// Fetch – hantera offline-läge
self.addEventListener("fetch", (event) => {
    const req = event.request;

    // Navigationsförfrågningar (HTML)
    if (req.mode === "navigate") {
        event.respondWith(
            fetch(req)
                .catch(() => caches.match("/index.html"))
                .catch(() => caches.match("/offline.html"))
        );
        return;
    }

    // Statiska filer (CSS, JS, bilder) – cache-first + dynamisk caching
    if (
        req.destination === "style" ||
        req.destination === "script" ||
        req.destination === "image"
    ) {
        event.respondWith(
            caches.match(req).then((cached) => {
                return (
                    cached ||
                    fetch(req).then((res) => {
                        const clone = res.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
                        return res;
                    })
                );
            })
        );
        return;
    }

    // API – network-first
    if (req.url.includes("/posts")) {
        event.respondWith(
            fetch(req).catch(() => caches.match(req))
        );
        return;
    }

    // Default fallback
    event.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
});
