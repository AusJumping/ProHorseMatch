import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AUTO_PUSH_OPT_OUT_KEY, hasCurrentWebPushSubscription, supportsWebPushHere } from "@/lib/webPushSupport";

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function ContextualNotificationPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const hasShownRef = useRef(false);
  const { toast } = useToast();

  const supportsNotifications = supportsWebPushHere();

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const registration = await navigator.serviceWorker.ready;
      const response = await fetch('/api/push/vapid-public-key');
      if (!response.ok) throw new Error('Failed to get VAPID public key');
      const { publicKey } = await response.json();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
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
    },
    onSuccess: () => {
      localStorage.removeItem(AUTO_PUSH_OPT_OUT_KEY);
      queryClient.invalidateQueries({ queryKey: ['/api/push/status'] });
      toast({ title: "Notifications enabled!", description: "You'll get instant alerts for matches and messages." });
      setIsVisible(false);
    },
    onError: (error: Error) => {
      setIsEnabling(false);
      toast({ title: "Could not enable notifications", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (hasShownRef.current || !supportsNotifications || Notification.permission === "denied") return;
    if (localStorage.getItem("notification-prompt-dismissed") === "true") return;
    if (sessionStorage.getItem("notification-prompt-dismissed-session") === "true") return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const checkThisDevice = async () => {
      if (Notification.permission === "granted") {
        try {
          if (await hasCurrentWebPushSubscription()) return;
        } catch {
          // Don't prompt if the browser's subscription can't be checked.
          return;
        }
      }
      if (cancelled) return;
      hasShownRef.current = true;
      timer = setTimeout(async () => {
        if (Notification.permission === "denied") return;
        if (Notification.permission === "granted") {
          try {
            if (await hasCurrentWebPushSubscription()) return;
          } catch {
            return;
          }
        }
        if (!cancelled) setIsVisible(true);
      }, 4000);
    };
    void checkThisDevice();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [supportsNotifications]);

  const handleEnable = async () => {
    if (!supportsNotifications) {
      toast({ title: "Install the app first", description: "Add the app to your home screen to enable notifications.", variant: "destructive" });
      return;
    }
    setIsEnabling(true);
    if (Notification.permission === 'denied') {
      toast({ title: "Notifications blocked", description: "Enable notifications in your browser settings, then try again.", variant: "destructive" });
      setIsEnabling(false);
      return;
    }
    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      if (result !== 'granted') {
        toast({ title: "Notifications not enabled", description: "You can turn them on anytime in Profile → Account Settings." });
        setIsEnabling(false);
        setIsVisible(false);
        sessionStorage.setItem('notification-prompt-dismissed-session', 'true');
        return;
      }
    }
    subscribeMutation.mutate();
  };

  const handleMaybeLater = () => {
    setIsVisible(false);
    sessionStorage.setItem('notification-prompt-dismissed-session', 'true');
  };

  const handleDontAskAgain = () => {
    localStorage.setItem('notification-prompt-dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4">
      <Card className="shadow-xl border-[#8B7355]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-[#8B7355]/10 p-2 rounded-full flex-shrink-0 mt-0.5">
              <Bell className="w-5 h-5 text-[#8B7355]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm mb-1">Enable Notifications?</h4>
              <p className="text-sm text-neutral-600 mb-3">
                Get instant alerts when horses match your search or you receive messages.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-[#8B7355] hover:bg-[#6B5344]"
                  onClick={handleEnable}
                  disabled={isEnabling || subscribeMutation.isPending}
                >
                  <Bell className="w-3 h-3 mr-1" />
                  {isEnabling || subscribeMutation.isPending ? "Enabling..." : "Enable"}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleMaybeLater}>
                  Maybe Later
                </Button>
              </div>
              <button
                onClick={handleDontAskAgain}
                className="text-xs text-neutral-400 hover:text-neutral-600 mt-2 block"
              >
                Don't ask again
              </button>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={handleMaybeLater}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
