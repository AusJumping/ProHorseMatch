import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function urlBase64ToUint8Array(base64String: string) {
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

async function subscribeUserToPush() {
  const registration = await navigator.serviceWorker.ready;
  const response = await fetch('/api/push/vapid-public-key');
  if (!response.ok) throw new Error('Failed to get VAPID public key');
  const { publicKey } = await response.json();
  const applicationServerKey = urlBase64ToUint8Array(publicKey);
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });
  const p256dhKey = subscription.getKey('p256dh');
  const authKey = subscription.getKey('auth');
  await apiRequest('POST', '/api/push/subscribe', {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: p256dhKey ? btoa(String.fromCharCode(...Array.from(new Uint8Array(p256dhKey)))) : '',
      auth: authKey ? btoa(String.fromCharCode(...Array.from(new Uint8Array(authKey)))) : '',
    },
  });
}

export function ContextualNotificationPrompt() {
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const { toast } = useToast();

  const supportsNotifications =
    typeof Notification !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isIOSStandalone = (window.navigator as any).standalone === true;
  const isIOSReady = !isIOS || isIOSStandalone;

  const { data: notificationStatus } = useQuery<{ subscribed: boolean }>({
    queryKey: ['/api/push/status'],
    retry: false,
    enabled: supportsNotifications && typeof Notification !== 'undefined' && Notification.permission === 'granted',
  });

  useEffect(() => {
    if (!supportsNotifications) return;
    if (sessionStorage.getItem('notification-auto-triggered') === 'true') return;

    const alreadySubscribed = notificationStatus?.subscribed;
    if (alreadySubscribed) return;

    sessionStorage.setItem('notification-auto-triggered', 'true');

    if (isIOS && !isIOSStandalone) {
      setTimeout(() => setShowIOSPrompt(true), 3000);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        if (Notification.permission === 'default') {
          const result = await Notification.requestPermission();
          if (result === 'granted') {
            await subscribeUserToPush();
            queryClient.invalidateQueries({ queryKey: ['/api/push/status'] });
            toast({ title: "Notifications enabled!", description: "You'll get instant alerts for matches and messages." });
          }
        } else if (Notification.permission === 'granted') {
          await subscribeUserToPush();
          queryClient.invalidateQueries({ queryKey: ['/api/push/status'] });
        }
      } catch {
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [notificationStatus, supportsNotifications]);

  if (!showIOSPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4">
      <Card className="shadow-xl border-[#8B7355]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-[#8B7355]/10 p-2 rounded-full flex-shrink-0 mt-0.5">
              <Bell className="w-5 h-5 text-[#8B7355]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm mb-1">Get Notifications on iPhone</h4>
              <p className="text-sm text-neutral-600 mb-2">
                To receive alerts for matches and messages, add this app to your home screen first:
              </p>
              <ol className="text-xs text-neutral-500 space-y-1 list-decimal list-inside mb-3">
                <li>Tap the <strong>Share</strong> button in Safari</li>
                <li>Tap <strong>"Add to Home Screen"</strong></li>
                <li>Open the app from your home screen</li>
              </ol>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={() => setShowIOSPrompt(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
