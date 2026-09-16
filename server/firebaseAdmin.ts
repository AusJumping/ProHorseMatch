import admin from 'firebase-admin';

let messaging: admin.messaging.Messaging | null = null;

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountJson) {
  console.error('FIREBASE_SERVICE_ACCOUNT_KEY is not configured - native push notifications are disabled');
} else {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    const app = admin.apps.length ? admin.app() : admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    messaging = admin.messaging(app);
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
  }
}

export function getMessaging(): admin.messaging.Messaging | null {
  return messaging;
}
