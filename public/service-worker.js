const CACHE_VERSION = 'v11';
const SHELL_CACHE = 'shell-' + CACHE_VERSION;

// Assets to cache on install — failures are caught individually so one bad
// asset cannot prevent the service worker from installing
const SHELL_ASSETS = [
  '/',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  console.log('Service Worker installing, caching app shell');
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.allSettled(
        SHELL_ASSETS.map((url) =>
          cache.add(url).catch((err) =>
            console.warn('SW: could not cache', url, err)
          )
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== SHELL_CACHE)
          .map((name) => {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    )
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) =>
        Promise.all(
          clients.map((client) => client.navigate(client.url))
        )
      )
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept API calls — always go to network
  if (url.pathname.startsWith('/api/')) return;

  // For navigation requests (page loads / PWA resume), use network-first
  // with a fast fallback to the cached shell so there's no white screen
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          // Cache a fresh copy of the shell on successful load
          const clone = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('/', clone));
          return response;
        } catch (err) {
          // Network failed (offline / phone just woke up) — serve cached shell.
          // Await the cache properly so we never resolve to `undefined`, which
          // would make the page fail to load (white screen).
          const cached = (await caches.match('/')) || (await caches.match(request));
          if (cached) return cached;
          // Nothing cached yet — try the network one last time rather than
          // returning undefined.
          return fetch(request);
        }
      })()
    );
    return;
  }

  // For static assets: cache-first, fall back to network
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.webmanifest')
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        const response = await fetch(request).catch(() => null);

        // A hashed /assets/ file that's missing or comes back as something
        // other than the real file (e.g. the server's HTML fallback page,
        // because this exact build no longer exists after a newer deploy)
        // means the cached app shell referencing it is stale. Clear it and
        // tell every open tab to reload, instead of leaving the page stuck
        // on a blank screen indefinitely.
        const isRealFile = response && response.ok &&
          !(response.headers.get('content-type') || '').includes('text/html');
        if (url.pathname.startsWith('/assets/') && !isRealFile) {
          await caches.delete(SHELL_CACHE);
          const clients = await self.clients.matchAll({ type: 'window' });
          clients.forEach((client) => client.postMessage({ type: 'STALE_SHELL_RELOAD' }));
        }

        return response || Response.error();
      })()
    );
    return;
  }

  // Everything else goes straight to the network
});

self.addEventListener('push', (event) => {
  console.log('Push notification received', event);

  const data = event.data
    ? event.data.json()
    : { title: 'ProHorseMatch', body: 'New notification' };

  event.waitUntil(
    self.registration.showNotification(data.title || 'ProHorseMatch', {
      body: data.body || 'New matches waiting',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || '/' },
      tag: data.tag || 'default',
      requireInteraction: false,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked', event);
  event.notification.close();

  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
