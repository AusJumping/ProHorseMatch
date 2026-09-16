import webpush from 'web-push';
import { storage } from './storage';
import { getMessaging } from './firebaseAdmin';
import type { PushSubscription, DeviceToken } from '@shared/schema';

// Configure VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  console.error('VAPID keys are not configured');
} else {
  webpush.setVapidDetails(
    'mailto:info@prohorsematch.com',
    vapidPublicKey,
    vapidPrivateKey
  );
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

const preferenceMap = {
  matches: 'notify_matches',
  messages: 'notify_messages',
  updates: 'notify_updates',
  digest: 'notify_digest'
} as const;

export async function sendPushNotification(
  userId: number,
  payload: NotificationPayload,
  notificationType: 'matches' | 'messages' | 'updates' | 'digest'
) {
  try {
    const preferenceKey = preferenceMap[notificationType];

    // Browser (web push) subscriptions
    const subscriptions = await storage.getPushSubscriptionsByUserId(userId);
    const activeSubscriptions = subscriptions.filter(sub => sub[preferenceKey as keyof PushSubscription] === true);

    const webPromises = activeSubscriptions.map(async (subscription) => {
      if (!subscription.endpoint || !subscription.p256dh || !subscription.auth) {
        console.log(`Invalid subscription data for user ${userId}, skipping`);
        return;
      }

      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth
        }
      };

      const notificationData = {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icons/icon-192.png',
        badge: payload.badge || '/icons/icon-192.png',
        data: {
          url: payload.url || '/',
          tag: payload.tag
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, JSON.stringify(notificationData));
        console.log(`Web push notification sent to user ${userId} for ${notificationType}`);
      } catch (error: any) {
        console.error(`Failed to send web push notification to user ${userId}:`, error);

        // If subscription is invalid (410 Gone or 404 Not Found), remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`Removing invalid subscription for user ${userId}`);
          await storage.deletePushSubscription(subscription.endpoint);
        }
      }
    });

    // Native app (iOS/Android) device tokens via Firebase Cloud Messaging
    const messaging = getMessaging();
    let nativePromises: Promise<void>[] = [];

    if (messaging) {
      const deviceTokens = await storage.getDeviceTokensByUserId(userId);
      const activeDeviceTokens = deviceTokens.filter(d => d[preferenceKey as keyof DeviceToken] === true);

      nativePromises = activeDeviceTokens.map(async (device) => {
        try {
          await messaging.send({
            token: device.token,
            notification: {
              title: payload.title,
              body: payload.body,
            },
            data: {
              url: payload.url || '/',
              tag: payload.tag || '',
            },
            apns: {
              payload: {
                aps: { sound: 'default' },
              },
            },
          });
          console.log(`FCM notification sent to user ${userId} (${device.platform}) for ${notificationType}`);
        } catch (error: any) {
          console.error(`Failed to send FCM notification to user ${userId}:`, error);

          // Remove tokens that are no longer valid
          if (
            error?.code === 'messaging/registration-token-not-registered' ||
            error?.code === 'messaging/invalid-registration-token'
          ) {
            console.log(`Removing invalid device token for user ${userId}`);
            await storage.deleteDeviceToken(device.token);
          }
        }
      });
    }

    if (activeSubscriptions.length === 0 && nativePromises.length === 0) {
      console.log(`User ${userId} has no active devices for ${notificationType} notifications`);
    }

    await Promise.all([...webPromises, ...nativePromises]);
  } catch (error) {
    console.error(`Error sending push notifications to user ${userId}:`, error);
  }
}

// Convenience functions for different notification types
export async function sendNewMatchNotification(userId: number, horseName: string, horseId: number) {
  await sendPushNotification(userId, {
    title: '🐴 New Match!',
    body: `${horseName} matches your search preferences`,
    url: `/horses/${horseId}`,
    tag: `new-match-${horseId}`
  }, 'matches');
}

export async function sendNewMessageNotification(userId: number, senderName: string, conversationId: number) {
  await sendPushNotification(userId, {
    title: '💬 New Message',
    body: `${senderName} sent you a message`,
    url: `/messages?conversation=${conversationId}`,
    tag: `new-message-${conversationId}`
  }, 'messages');
}

export async function sendHorseUpdateNotification(userId: number, horseName: string, horseId: number, updateType: string) {
  await sendPushNotification(userId, {
    title: '🔔 Horse Update',
    body: `${horseName} has been updated: ${updateType}`,
    url: `/horses/${horseId}`,
    tag: `horse-update-${horseId}`
  }, 'updates');
}

export async function sendWeeklyDigestNotification(userId: number, newHorsesCount: number) {
  await sendPushNotification(userId, {
    title: '📊 Weekly Digest',
    body: `${newHorsesCount} new horses match your preferences this week`,
    url: '/filter',
    tag: 'weekly-digest'
  }, 'digest');
}
