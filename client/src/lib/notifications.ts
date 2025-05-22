import { apiRequest } from './queryClient';

// Check if push notifications are supported
export function isPushNotificationSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Get the registered service worker
export async function getRegisteredServiceWorker() {
  if (!isPushNotificationSupported()) {
    return null;
  }
  
  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.error('Error getting service worker registration:', error);
    return null;
  }
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

// Check if already subscribed to push notifications
export async function isSubscribedToPushNotifications(): Promise<boolean> {
  const swRegistration = await getRegisteredServiceWorker();
  
  if (!swRegistration) {
    return false;
  }
  
  try {
    const subscription = await swRegistration.pushManager.getSubscription();
    return !!subscription;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

// Subscribe to push notifications
export async function subscribeToPushNotifications(): Promise<boolean> {
  // First, check if notifications are supported
  if (!isPushNotificationSupported()) {
    console.error('Push notifications are not supported in this browser');
    return false;
  }
  
  // Then, request permission if not already granted
  const permission = await requestNotificationPermission();
  if (!permission) {
    console.error('Notification permission was denied');
    return false;
  }
  
  try {
    // Get the service worker registration
    const swRegistration = await getRegisteredServiceWorker();
    if (!swRegistration) {
      console.error('Service worker registration failed');
      return false;
    }
    
    // Get the server's public VAPID key
    const response = await apiRequest('GET', '/api/notifications/vapid-public-key');
    const { publicKey } = await response.json();
    
    if (!publicKey) {
      console.error('Failed to get VAPID public key from server');
      return false;
    }
    
    // Convert the VAPID key to the format required by the browser
    const applicationServerKey = urlB64ToUint8Array(publicKey);
    
    // Subscribe the user to push notifications
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });
    
    // Send the push subscription to the server
    const subscribeResponse = await apiRequest('POST', '/api/notifications/subscribe', {
      subscription
    });
    
    if (!subscribeResponse.ok) {
      const errorData = await subscribeResponse.json();
      console.error('Failed to register subscription with server:', errorData.message);
      
      // If authentication error, we should refresh the auth status
      if (subscribeResponse.status === 401) {
        console.log('Authentication required for notifications. Please log in again.');
      }
      
      return false;
    }
    
    console.log('Successfully subscribed to push notifications');
    return true;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return false;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const swRegistration = await getRegisteredServiceWorker();
    if (!swRegistration) {
      return false;
    }
    
    const subscription = await swRegistration.pushManager.getSubscription();
    if (!subscription) {
      return true; // Already unsubscribed
    }
    
    // Delete the subscription from the server
    await apiRequest('POST', '/api/notifications/unsubscribe', {
      subscription
    });
    
    // Unsubscribe on the client
    await subscription.unsubscribe();
    
    return true;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
}

// Helper function to convert a base64 string to Uint8Array
// This is required for the applicationServerKey
function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

// Register the service worker for push notifications
export async function registerNotificationServiceWorker(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered with scope:', registration.scope);
    return true;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return false;
  }
}