const CACHE_VERSION = 'v4'; // Solid background icons

self.addEventListener("install", () => {
  console.log("Service Worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
  // Clear all old caches when activating
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("push", (event) => {
  console.log("Push notification received", event);
  
  const data = event.data ? event.data.json() : { 
    title: "ProHorseMatch", 
    body: "New notification" 
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || "ProHorseMatch", {
      body: data.body || "New matches waiting",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: {
        url: data.url || "/"
      },
      tag: data.tag || "default",
      requireInteraction: false
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked", event);
  event.notification.close();
  
  const url = event.notification.data?.url || "/";
  
  event.waitUntil(
    clients.openWindow(url)
  );
});
