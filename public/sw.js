// Service Worker for ProHorseMatch
// Handles push notifications and caching strategies

const CACHE_NAME = 'prohorsematch-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/icons/app-icon-192x192.png',
  '/icons/app-badge-96x96.png'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker');
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching core app shell');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => console.error('[Service Worker] Error caching static assets:', err))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker');
  
  event.waitUntil(
    caches.keys()
      .then((keyList) => {
        return Promise.all(keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        }));
      })
  );
  
  return self.clients.claim();
});

// Fetch event - implement cache-first strategy for static assets
self.addEventListener('fetch', (event) => {
  // Only for GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip for API requests and browser extensions
  if (event.request.url.includes('/api/') || 
      !event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if available
        if (response) {
          return response;
        }
        
        // Otherwise, fetch from network and cache the result
        return fetch(event.request)
          .then((networkResponse) => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clone the response - one to return, one to cache
            const responseToCache = networkResponse.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
              
            return networkResponse;
          })
          .catch(err => {
            console.error('[Service Worker] Fetch failed:', err);
            // Return the offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            
            return null;
          });
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  
  let data = {};
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (error) {
    console.error('[Service Worker] Error parsing push data:', error);
  }
  
  const title = data.title || 'ProHorseMatch Notification';
  const options = {
    body: data.body || 'Something new happened in ProHorseMatch!',
    icon: data.icon || '/icons/app-icon-192x192.png',
    badge: data.badge || '/icons/app-badge-96x96.png',
    vibrate: [100, 50, 100],
    data: data.data || {}
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event - handle when user clicks notification
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received');
  
  const notification = event.notification;
  notification.close();
  
  // Get notification data
  const data = notification.data || {};
  const url = data.url || '/';
  
  // Open or focus on the relevant page
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientsList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientsList) {
          if (client.url.indexOf(url) !== -1 && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window/tab is open with the URL, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});