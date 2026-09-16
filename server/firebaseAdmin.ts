import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';

let messaging: Messaging | null = null;

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountJson) {
  console.error('FIREBASE_SERVICE_ACCOUNT_KEY is not configured - native push notifications are disabled');
} else {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    const app = getApps().length ? getApp() : initializeApp({
      credential: cert(serviceAccount),
    });
    messaging = getMessaging(app);
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
  }
}

export function getFirebaseMessaging(): Messaging | null {
  return messaging;
}
