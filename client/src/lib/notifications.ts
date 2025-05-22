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
    // First, check if we're already subscribed
    const isAlreadySubscribed = await isSubscribedToPushNotifications();
    if (isAlreadySubscribed) {
      console.log('Already subscribed to push notifications');
      return true;
    }

    // Step 1: Make sure service worker is registered
    console.log('Registering service worker if needed...');
    await registerNotificationServiceWorker();
    
    // Step 2: Get the service worker registration
    const swRegistration = await getRegisteredServiceWorker();
    if (!swRegistration) {
      console.error('Service worker registration failed');
      return false;
    }
    
    // Step 3: Get the server's public VAPID key with retry logic
    console.log('Getting VAPID public key...');
    let publicKey = null;
    let retries = 3;
    
    while (retries > 0 && !publicKey) {
      try {
        const response = await fetch('/api/notifications/vapid-public-key');
        if (response.ok) {
          const data = await response.json();
          publicKey = data.publicKey;
        } else {
          console.warn(`Failed to get VAPID key, status: ${response.status}, retrying...`);
        }
      } catch (error) {
        console.error('Error fetching VAPID key:', error);
      }
      
      if (!publicKey) {
        retries--;
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 500));
        }
      }
    }
    
    if (!publicKey) {
      console.error('Failed to get VAPID public key from server after multiple attempts');
      return false;
    }
    
    // Step 4: Convert the VAPID key to the format required by the browser
    const applicationServerKey = urlB64ToUint8Array(publicKey);
    
    // Step 5: Subscribe the user to push notifications
    console.log('Creating push subscription...');
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });
    
    // Step 6: Get user ID from multiple sources for better reliability
    console.log('Getting user ID for subscription...');
    let userId = null;
    
    // Try session-based auth first
    try {
      const userResponse = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        userId = userData.id;
        console.log('Retrieved authenticated userId from session:', userId);
      }
    } catch (authError) {
      console.error('Error checking session authentication:', authError);
    }
    
    // If session didn't work, try localStorage fallback
    if (!userId) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.id) {
            userId = parsedUser.id;
            console.log('Retrieved userId from localStorage:', userId);
          }
        }
      } catch (storageError) {
        console.error('Error checking localStorage for user:', storageError);
      }
    }
    
    // Step 7: Send subscription to server with multiple fallbacks
    console.log('Sending subscription to server...');
    const subscriptionData = {
      subscription: JSON.stringify(subscription),
      preferences: {
        horses: true,
        messages: true,
        marketing: false
      },
      userId: userId
    };
    
    // First try: Standard endpoint with session cookies
    let subscribeSuccess = false;
    
    try {
      const subscribeResponse = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
        credentials: 'include'
      });
      
      if (subscribeResponse.ok) {
        console.log('Successfully subscribed to push notifications using primary endpoint');
        subscribeSuccess = true;
      } else {
        console.warn('Primary subscription endpoint failed, trying alternative...');
      }
    } catch (primaryError) {
      console.error('Error with primary subscription endpoint:', primaryError);
    }
    
    // Second try: Alternative endpoint without cookies if first try failed
    if (!subscribeSuccess && userId) {
      try {
        const alternativeResponse = await fetch('/api/notifications/subscribe-direct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscriptionData)
        });
        
        if (alternativeResponse.ok) {
          console.log('Successfully subscribed using alternative endpoint');
          subscribeSuccess = true;
        }
      } catch (alternativeError) {
        console.error('Error with alternative subscription endpoint:', alternativeError);
      }
    }
    
    return subscribeSuccess;
  } catch (error) {
    console.error('Error in subscription process:', error);
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
    // Use a dedicated push service worker specifically for push notifications
    // This is separate from the main service worker to avoid conflicts
    const registration = await navigator.serviceWorker.register('/push-sw.js');
    console.log('Push Service Worker registered with scope:', registration.scope);
    return true;
  } catch (error) {
    console.error('Push Service Worker registration failed:', error);
    return false;
  }
}