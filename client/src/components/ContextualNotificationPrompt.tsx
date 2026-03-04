import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  const [showCard, setShowCard] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const { toast } = useToast();

  const hasNotificationAPI = typeof Notification !== 'undefined';
  const hasPushSupport = hasNotificationAPI && 'serviceWorker' in navigator && 'PushManager' in window;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isIOSStandalone = (window.navigator as any).standalone === true;
  const isIOSNotReady = isIOS && !isIOSStandalone;

  const { data: notificationStatus } = useQuery<{ subscribed: boolean }>({
    queryKey: ['/api/push/status'],
    retry: false,
    enabled: hasPushSupport && hasNotificationAPI && Notification.permission === 'granted',
  });

  useEffect(() => {
    if (sessionStorage.getItem('notification-prompt-shown') === 'true') return;
    if (localStorage.getItem('notification-prompt-dismissed') === 'true') return;
    if (notificationStatus?.subscribed) return;

    sessionStorage.setItem('notification-prompt-shown', 'true');

    const timer = setTimeout(async () => {
      if (!hasNotificationAPI) {
        setShowCard(true);
        return;
      }

      if (Notification.permission === 'denied') {
        return;
      }

      if (isIOSNotReady) {
        setShowCard(true);
        return;
      }

      if (!hasPushSupport) {
        setShowCard(true);
        return;
      }

      if (Notification.permission === 'granted' && !notificationStatus?.subscribed) {
        try {
          await subscribeUserToPush();
          queryClient.invalidateQueries({ queryKey: ['/api/push/status'] });
          toast({ title: "Notifications enabled!", description: "You'll get instant alerts for matches and messages." });
        } catch (err) {
          console.error('Auto-subscribe failed:', err);
          setShowCard(true);
        }
        return;
      }

      if (Notification.permission === 'default') {
        try {
          const result = await Notification.requestPermission();
          if (result === 'granted') {
            await subscribeUserToPush();
            queryClient.invalidateQueries({ queryKey: ['/api/push/status'] });
            toast({ title: "Notifications enabled!", description: "You'll get instant alerts for matches and messages." });
          }
        } catch (err) {
          console.error('Permission request failed:', err);
          setShowCard(true);
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [notificationStatus]);

  const handleEnableClick = async () => {
    if (isIOSNotReady) return;

    setIsEnabling(true);
    try {
      if (!hasPushSupport) {
        toast({
          title: "Not supported",
          description: "Please use Chrome or Firefox, or install this app to your home screen.",
          variant: "destructive",
        });
        setIsEnabling(false);
        return;
      }

      if (Notification.permission === 'denied') {
        toast({
          title: "Notifications blocked",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
        setIsEnabling(false);
        return;
      }

      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission === 'granted') {
        await subscribeUserToPush();
        queryClient.invalidateQueries({ queryKey: ['/api/push/status'] });
        toast({ title: "Notifications enabled!", description: "You'll get instant alerts for matches and messages." });
        setShowCard(false);
      } else {
        toast({ title: "Notifications not enabled", description: "You can enable them anytime in Profile → Account Settings." });
        setShowCard(false);
      }
    } catch (err) {
      console.error('Enable notifications error:', err);
      toast({ title: "Could not enable notifications", description: "Please try again from Profile → Account Settings.", variant: "destructive" });
    }
    setIsEnabling(false);
  };

  const handleDismiss = () => {
    setShowCard(false);
    sessionStorage.setItem('notification-prompt-dismissed-session', 'true');
  };

  const handlePermanentDismiss = () => {
    localStorage.setItem('notification-prompt-dismissed', 'true');
    setShowCard(false);
  };

  if (!showCard) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4">
      <Card className="shadow-xl border-[#8B7355]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-[#8B7355]/10 p-2 rounded-full flex-shrink-0 mt-0.5">
              <Bell className="w-5 h-5 text-[#8B7355]" />
            </div>
            <div className="flex-1 min-w-0">
              {isIOSNotReady ? (
                <>
                  <h4 className="font-semibold text-sm mb-1">Get Notifications on iPhone</h4>
                  <p className="text-sm text-neutral-600 mb-2">
                    Add this app to your home screen to receive match and message alerts:
                  </p>
                  <ol className="text-xs text-neutral-500 space-y-1 list-decimal list-inside mb-3">
                    <li>Tap the <strong>Share</strong> button in Safari</li>
                    <li>Tap <strong>"Add to Home Screen"</strong></li>
                    <li>Open the app from your home screen</li>
                  </ol>
                </>
              ) : (
                <>
                  <h4 className="font-semibold text-sm mb-1">Enable Notifications</h4>
                  <p className="text-sm text-neutral-600 mb-3">
                    Get instant alerts when horses match your search or you receive messages.
                  </p>
                  <div className="flex gap-2 mb-2">
                    <Button
                      size="sm"
                      className="bg-[#8B7355] hover:bg-[#6B5344]"
                      onClick={handleEnableClick}
                      disabled={isEnabling}
                    >
                      <Bell className="w-3 h-3 mr-1" />
                      {isEnabling ? "Enabling..." : "Enable"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleDismiss}>
                      Maybe Later
                    </Button>
                  </div>
                </>
              )}
              <button
                onClick={handlePermanentDismiss}
                className="text-xs text-neutral-400 hover:text-neutral-600 block"
              >
                Don't ask again
              </button>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
