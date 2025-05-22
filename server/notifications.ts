/**
 * Notifications Service for ProHorseMatch
 * 
 * Handles server-side notification functionality including:
 * - Storing and managing push notification subscriptions
 * - Sending push notifications to subscribers
 * - Managing notification preferences
 */

import { db } from './db';
import { eq, and } from 'drizzle-orm';
import { pushSubscriptions, notifications, InsertPushSubscription, InsertNotification } from '../shared/schema';
import { Request, Response } from 'express';
import webpush from 'web-push';

// VAPID keys should be environment variables in production
// For now we'll generate them on first run
let VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
let VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  const vapidKeys = webpush.generateVAPIDKeys();
  VAPID_PUBLIC_KEY = vapidKeys.publicKey;
  VAPID_PRIVATE_KEY = vapidKeys.privateKey;
  
  console.log("=========================================");
  console.log("GENERATED VAPID KEYS FOR PUSH NOTIFICATIONS");
  console.log("Add these to your environment variables:");
  console.log(`VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}`);
  console.log(`VAPID_PRIVATE_KEY=${VAPID_PRIVATE_KEY}`);
  console.log("=========================================");
}

// Configure web-push
webpush.setVapidDetails(
  'mailto:admin@prohorsematch.com', // Change to your email
  VAPID_PUBLIC_KEY!,
  VAPID_PRIVATE_KEY!
);

// Get VAPID public key
export const getVapidPublicKey = (req: Request, res: Response) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
};

// Subscribe to push notifications
export const subscribe = async (req: Request, res: Response) => {
  try {
    const { subscription } = req.body;
    
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const userId = req.session.userId;
    
    // Extract subscription details
    const { endpoint, keys } = subscription;
    
    // Check if subscription already exists
    const [existingSubscription] = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.user_id, userId),
          eq(pushSubscriptions.endpoint, endpoint)
        )
      );
    
    if (existingSubscription) {
      return res.status(200).json({ message: 'Already subscribed' });
    }
    
    // Create new subscription
    const newSubscription: InsertPushSubscription = {
      user_id: userId,
      endpoint,
      auth_key: keys.auth,
      p256dh_key: keys.p256dh,
      subscription_data: subscription,
      notify_for_matches: true,
      notify_for_messages: true
    };
    
    await db.insert(pushSubscriptions).values(newSubscription);
    
    // Send welcome notification
    const notificationPayload = JSON.stringify({
      title: 'Welcome to ProHorseMatch Notifications',
      body: 'You will now receive notifications for new horse matches and messages.',
      icon: '/icons/app-icon-192x192.png',
      badge: '/icons/app-badge-96x96.png',
      data: {
        url: '/',
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    });
    
    await webpush.sendNotification(subscription, notificationPayload);
    
    res.status(201).json({ message: 'Subscription successful' });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    res.status(500).json({ message: 'Subscription failed' });
  }
};

// Unsubscribe from push notifications
export const unsubscribe = async (req: Request, res: Response) => {
  try {
    const { subscription } = req.body;
    
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const userId = req.session.userId;
    
    // Delete subscription from database
    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.user_id, userId),
          eq(pushSubscriptions.endpoint, subscription.endpoint)
        )
      );
    
    res.status(200).json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    res.status(500).json({ message: 'Unsubscription failed' });
  }
};

// Update notification preferences
export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const { notify_for_matches, notify_for_messages } = req.body;
    
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const userId = req.session.userId;
    
    // Update all user's subscription preferences
    await db
      .update(pushSubscriptions)
      .set({
        notify_for_matches,
        notify_for_messages
      })
      .where(eq(pushSubscriptions.user_id, userId));
    
    res.status(200).json({ message: 'Preferences updated' });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ message: 'Failed to update preferences' });
  }
};

// Get user's notification preferences
export const getPreferences = async (req: Request, res: Response) => {
  try {
    console.log("Getting notification preferences - Session:", {
      sessionId: req.sessionID,
      userId: req.session.userId,
      sessionContent: req.session
    });
    
    // Default preferences for users without subscriptions
    const defaultPreferences = {
      notify_for_matches: true,
      notify_for_messages: true,
      marketing: false,
      is_subscribed: false,
      preferences: {
        horses: true,
        messages: true,
        marketing: false
      },
      subscribed: false
    };
    
    if (!req.session.userId) {
      console.log("Notification preferences access failed - Not authenticated");
      
      // To avoid breaking the UI, we'll return default preferences with an unauthorized status
      return res.status(401).json({ 
        message: 'Not authenticated',
        ...defaultPreferences
      });
    }
    
    const userId = req.session.userId;
    console.log("Fetching notification preferences for user:", userId);
    
    // Get user's subscription preferences
    const [subscription] = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.user_id, userId));
    
    if (!subscription) {
      return res.status(200).json({
        ...defaultPreferences
      });
    }
    
    res.status(200).json({
      notify_for_matches: subscription.notify_for_matches || true,
      notify_for_messages: subscription.notify_for_messages || true,
      marketing: false,
      is_subscribed: true,
      preferences: {
        horses: subscription.notify_for_matches || true,
        messages: subscription.notify_for_messages || true,
        marketing: false
      },
      subscribed: true
    });
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({ 
      message: 'Failed to get preferences',
      preferences: {
        horses: true,
        messages: true,
        marketing: false
      },
      subscribed: false
    });
  }
};

// Send push notification to user
export const sendNotification = async (
  userId: number,
  title: string,
  message: string,
  type: 'new-match' | 'new-message',
  data: any = {},
  url: string = '/'
) => {
  try {
    // Store notification in database
    const notification: InsertNotification = {
      user_id: userId,
      type,
      title,
      message,
      data,
      action_url: url
    };
    
    await db.insert(notifications).values(notification);
    
    // Get user's push subscriptions
    const userSubscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.user_id, userId));
    
    if (userSubscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return;
    }
    
    // Filter subscriptions based on notification type and preferences
    const eligibleSubscriptions = userSubscriptions.filter(sub => {
      if (type === 'new-match' && !sub.notify_for_matches) return false;
      if (type === 'new-message' && !sub.notify_for_messages) return false;
      return true;
    });
    
    if (eligibleSubscriptions.length === 0) {
      console.log(`User ${userId} has disabled notifications for ${type}`);
      return;
    }
    
    // Format notification payload
    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/icons/app-icon-192x192.png',
      badge: '/icons/app-badge-96x96.png',
      data: {
        ...data,
        url,
        type,
        dateOfArrival: Date.now()
      }
    });
    
    // Send notifications to all user's push subscriptions
    const sendPromises = eligibleSubscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription_data, payload);
      } catch (error) {
        console.error(`Failed to send notification to subscription ${sub.id}:`, error);
        
        // If the subscription is invalid (404), remove it
        if (error.statusCode === 404 || error.statusCode === 410) {
          console.log(`Removing invalid subscription ${sub.id}`);
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, sub.id));
        }
      }
    });
    
    await Promise.all(sendPromises);
    console.log(`Successfully sent ${type} notification to user ${userId}`);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

// Get user's unread notifications
export const getUnreadNotifications = async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const userId = req.session.userId;
    
    // Get user's unread notifications
    const unreadNotifications = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.user_id, userId),
          eq(notifications.is_read, false)
        )
      )
      .orderBy(notifications.created_at, 'desc');
    
    res.status(200).json(unreadNotifications);
  } catch (error) {
    console.error('Error getting unread notifications:', error);
    res.status(500).json({ message: 'Failed to get notifications' });
  }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const userId = req.session.userId;
    
    // Mark notification as read
    await db
      .update(notifications)
      .set({ is_read: true })
      .where(
        and(
          eq(notifications.id, parseInt(notificationId)),
          eq(notifications.user_id, userId)
        )
      );
    
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const userId = req.session.userId;
    
    // Mark all user's notifications as read
    await db
      .update(notifications)
      .set({ is_read: true })
      .where(
        and(
          eq(notifications.user_id, userId),
          eq(notifications.is_read, false)
        )
      );
    
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
};