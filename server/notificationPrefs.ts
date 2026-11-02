// Notifications are ON by default for everything (matches, messages, listing updates, digest).
// A person switches off only what they don't want. "No saved choice" therefore means ON, and
// only an explicit false turns a notification off.

export type NotifyKey = "notify_matches" | "notify_messages" | "notify_updates" | "notify_digest";

export function wantsNotification(row: Partial<Record<NotifyKey, boolean | null>>, key: NotifyKey): boolean {
  return row[key] !== false;
}

type PrefRow = Partial<Record<NotifyKey, boolean | null>>;

// What the settings screen shows. Browser subscriptions and phone (app) registrations both count,
// and a person with neither yet still sees every switch ON.
export function summariseNotificationStatus(webSubscriptions: PrefRow[], devices: PrefRow[]) {
  const first = webSubscriptions[0] ?? devices[0];
  return {
    subscribed: webSubscriptions.length + devices.length > 0,
    count: webSubscriptions.length + devices.length,
    nativeDevices: devices.length,
    preferences: {
      notify_matches: first ? wantsNotification(first, "notify_matches") : true,
      notify_messages: first ? wantsNotification(first, "notify_messages") : true,
      notify_updates: first ? wantsNotification(first, "notify_updates") : true,
      notify_digest: first ? wantsNotification(first, "notify_digest") : true,
    },
  };
}
