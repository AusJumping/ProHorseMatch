import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, AlertTriangle, X } from "lucide-react";
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

export function NotificationReminder() {
  const { toast } = useToast();
  const [isEnabling, setIsEnabling] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('notification-reminder-dismissed') === 'true';
  });

  const { data: pushStatus, isLoading } = useQuery<{ subscribed: boolean }>({
    queryKey: ['/api/push/status'],
    retry: false,
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications are not supported in your browser');
      }

      const registration = await navigator.serviceWorker.ready;
      
      const response = await fetch('/api/push/vapid-public-key');
      if (!response.ok) {
        throw new Error('Failed to get VAPID public key');
      }
      const { publicKey } = await response.json();
      
      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');
      
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: p256dhKey ? btoa(String.fromCharCode(...Array.from(new Uint8Array(p256dhKey)))) : '',
          auth: authKey ? btoa(String.fromCharCode(...Array.from(new Uint8Array(authKey)))) : ''
        }
      };
      
      await apiRequest('POST', '/api/push/subscribe', subscriptionData);
      
      return subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/push/status'] });
      toast({
        title: "Notifications enabled!",
        description: "You'll now receive instant alerts for new matches and messages",
      });
      setIsEnabling(false);
    },
    onError: (error: Error) => {
      console.error('Subscription error:', error);
      toast({
        title: "Could not enable notifications",
        description: error.message,
        variant: "destructive"
      });
      setIsEnabling(false);
    }
  });

  const handleEnableNotifications = async () => {
    setIsEnabling(true);
    
    if (!('Notification' in window)) {
      toast({
        title: "Not supported",
        description: "Your browser doesn't support push notifications",
        variant: "destructive"
      });
      setIsEnabling(false);
      return;
    }

    if (Notification.permission === 'denied') {
      toast({
        title: "Permission blocked",
        description: "Please enable notifications in your browser settings, then try again",
        variant: "destructive"
      });
      setIsEnabling(false);
      return;
    }

    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        subscribeMutation.mutate();
      } else {
        setIsEnabling(false);
      }
    } else if (Notification.permission === 'granted') {
      subscribeMutation.mutate();
    }
  };

  const supportsNotifications = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  const notificationPermission = typeof Notification !== 'undefined' ? Notification.permission : 'denied';
  
  if (isLoading || pushStatus?.subscribed || isDismissed || !supportsNotifications || notificationPermission === 'denied') {
    return null;
  }

  return (
    <Card className="border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg mb-6">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="bg-amber-500 p-3 rounded-full flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-amber-900 mb-1">
              Don't Miss Out on New Matches!
            </h3>
            <p className="text-amber-800 mb-4">
              You're not receiving push notifications. Enable them now to get <strong>instant alerts</strong> when:
            </p>
            <ul className="text-amber-800 mb-4 space-y-1 ml-4">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span> A new horse matches your saved search
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-600">✓</span> Someone sends you a message
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-600">✓</span> A horse you like gets updated
              </li>
            </ul>
            
            <Button 
              onClick={handleEnableNotifications}
              disabled={isEnabling}
              className="bg-amber-600 hover:bg-amber-700 text-white h-11 px-6 text-base font-semibold shadow-md"
            >
              {isEnabling ? (
                "Enabling..."
              ) : (
                <>
                  <Bell className="w-5 h-5 mr-2" />
                  Enable Notifications Now
                </>
              )}
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 text-amber-600 hover:text-amber-800"
            onClick={() => {
              localStorage.setItem('notification-reminder-dismissed', 'true');
              setIsDismissed(true);
            }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
