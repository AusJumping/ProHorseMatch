/**
 * Push Notifications Service for ProHorseMatch
 * 
 * Handles registration, permission management, and sending of push notifications
 * for new horse matches and messages.
 */

// Check if the browser supports push notifications
export const isPushSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Request notification permission from the user
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }

  try {
    return await Notification.requestPermission();
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    throw error;
  }
};

// Register the service worker for push notifications
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }

  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch (error) {
    console.error('Error registering service worker:', error);
    throw error;
  }
};

// Subscribe the user to push notifications
export const subscribeToPushNotifications = async (): Promise<PushSubscription | null> => {
  try {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('Notification permission was not granted');
      return null;
    }

    const registration = await registerServiceWorker();
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        // This is a placeholder for the VAPID public key
        // We'll implement the actual key when deploying
        'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
      ),
    });

    // Save subscription to the server
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscription }),
    });

    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      return true;
    }

    // Remove subscription from the server
    await fetch('/api/notifications/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscription }),
    });

    return await subscription.unsubscribe();
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
};

// Check if the user is subscribed to push notifications
export const isSubscribedToPushNotifications = async (): Promise<boolean> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (error) {
    console.error('Error checking push subscription:', error);
    return false;
  }
};

// Helper to convert base64 to Uint8Array for applicationServerKey
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
};