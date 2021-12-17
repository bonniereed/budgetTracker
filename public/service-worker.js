const CACHED_FILES = [
    '/',
    '/index.html',
    '/styles.css',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/indexedDB.js',
    '/index.js',
];

const CACHE = 'cache-v1';
const RUNTIME = 'runtime';

self.addEventListener('install', (event) => {
    event.waitUntil(
        cached
            .open(CACHE)
            .then((cache) => cache.addAll(CACHED_FILES))
            .then(self.skipWaiting())
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        cached.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE && key !== RUNTIME) {
                        console.log('Removing old cache data', key);
                        return cached.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

// fetch
self.addEventListener('fetch', function (event) {
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            cached
                .open(RUNTIME)
                .then((cache) => {
                    return fetch(event.request)
                        .then((reply) => {
                            // Response successful. Clone then cache.
                            if (reply.status === 200) {
                                cache.put(event.request.url, reply.clone());
                            }

                            return reply;
                        })
                        .catch((err) => {
                            // Network request return from cache.
                            return cache.match(event.request);
                        });
                })
                .catch((err) => console.log(err))
        );

        return;
    }

    event.respondWith(
        cached.match(event.request).then(function (reply) {
            return reply || fetch(event.request);
        })
    );
});
