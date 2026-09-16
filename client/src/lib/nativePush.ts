import { Capacitor, registerPlugin } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { apiRequest } from './queryClient';

// Only used on iOS: bridges Firebase's FCM token out of native code (see
// ios/App/App/FCMTokenPlugin.swift). Android's FCM token comes directly
// from the standard PushNotifications 'registration' event below.
interface FCMTokenPluginPlugin {
  addListener(eventName: 'fcmToken', listenerFunc: (data: { value: string }) => void): void;
}
const FCMTokenPlugin = registerPlugin<FCMTokenPluginPlugin>('FCMTokenPlugin');

let initialized = false;

async function registerDeviceToken(token: string) {
  try {
    await apiRequest('POST', '/api/push/register-device', {
      token,
      platform: Capacitor.getPlatform(),
    });
    console.log('Device registered for native push notifications');
  } catch (error) {
    console.error('Failed to register device token with server:', error);
  }
}

// Sets up native (iOS/Android) push notifications when running inside the
// Capacitor app shell. No-ops entirely on the regular website, where the
// existing browser web-push flow (NotificationSettings.tsx) is used instead.
export function initNativePush() {
  if (initialized) return;
  if (!Capacitor.isNativePlatform()) return;
  initialized = true;

  if (Capacitor.getPlatform() === 'ios') {
    // iOS: Capacitor's own 'registration' event gives a raw Apple device
    // token, not something Firebase can send to directly - wait for the
    // real FCM token instead.
    FCMTokenPlugin.addListener('fcmToken', (data) => {
      registerDeviceToken(data.value);
    });
  } else {
    // Android: Capacitor's push-notifications plugin already talks to
    // Firebase directly, so this token is a usable FCM token as-is.
    PushNotifications.addListener('registration', (token) => {
      registerDeviceToken(token.value);
    });
  }

  PushNotifications.addListener('registrationError', (error) => {
    console.error('Push registration error:', error);
  });

  // When the user taps a notification, send them to the relevant page
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const url = action.notification?.data?.url;
    if (url) {
      window.location.href = url;
    }
  });

  PushNotifications.checkPermissions().then(async (status) => {
    let permission = status.receive;
    if (permission === 'prompt' || permission === 'prompt-with-rationale') {
      const requested = await PushNotifications.requestPermissions();
      permission = requested.receive;
    }
    if (permission !== 'granted') {
      console.log('Push notification permission not granted');
      return;
    }
    await PushNotifications.register();
  });
}
