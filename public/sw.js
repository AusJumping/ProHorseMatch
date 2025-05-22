/**
 * Service Worker for ProHorseMatch
 * 
 * Handles push notifications for:
 * - New horse matches based on user preferences
 * - New messages in conversations
 */

// Cache name for the app
const CACHE_NAME = 'prohorsematch-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/favicon.ico'
      ]);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  // Claim clients to ensure the service worker controls all clients
  event.waitUntil(self.clients.claim());
  
  // Remove old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push Received');
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('Could not parse push event data as JSON', e);
      data = {
        title: 'ProHorseMatch Notification',
        body: event.data.text(),
        icon: '/icons/app-icon-192x192.png'
      };
    }
  } else {
    data = {
      title: 'ProHorseMatch Notification',
      body: 'Something new happened in your account',
      icon: '/icons/app-icon-192x192.png'
    };
  }
  
  // Format type-specific notifications
  let options = {
    body: data.body,
    icon: data.icon || '/icons/app-icon-192x192.png',
    badge: '/icons/app-badge-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  // Add type-specific features to notifications
  if (data.type === 'new-match') {
    options.actions = [
      {
        action: 'view',
        title: 'View Horse'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ];
  } else if (data.type === 'new-message') {
    options.actions = [
      {
        action: 'reply',
        title: 'Reply'
      },
      {
        action: 'view',
        title: 'View Conversation'
      }
    ];
  }
  
  // Show the notification
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event - handle user interaction with notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click');
  
  event.notification.close();
  
  // Handle action clicks
  let url = '/';
  
  if (event.action === 'view' && event.notification.data.url) {
    url = event.notification.data.url;
  } else if (event.action === 'reply') {
    // For messages, go to the conversation page
    url = event.notification.data.url || '/messages';
  }
  
  // Open or focus the appropriate page
  event.waitUntil(
    clients.matchAll({
      type: 'window'
    }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
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

// Fetch event - serve cached content when possible
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
  );
});