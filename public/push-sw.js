// Push Notification Service Worker for ProHorseMatch
// This is a dedicated service worker that only handles push notifications

console.log('[Push Service Worker] Initializing');

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[Push Service Worker] Push notification received');
  
  let data = { title: 'ProHorseMatch', body: 'You have a new notification' };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (error) {
    console.error('[Push Service Worker] Error parsing push data:', error);
  }
  
  const title = data.title || 'ProHorseMatch Notification';
  const options = {
    body: data.body || 'Something new happened in ProHorseMatch!',
    icon: '/icons/app-icon-192x192.png',
    badge: '/icons/app-badge-96x96.png',
    vibrate: [100, 50, 100],
    data: data.data || {}
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event - handle when user clicks notification
self.addEventListener('notificationclick', (event) => {
  console.log('[Push Service Worker] Notification click received');
  
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

// Install event - initialize the service worker
self.addEventListener('install', (event) => {
  console.log('[Push Service Worker] Installing');
  self.skipWaiting();
});

// Activate event - take control immediately
self.addEventListener('activate', (event) => {
  console.log('[Push Service Worker] Activating');
  return self.clients.claim();
});