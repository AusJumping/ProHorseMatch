import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

export function NotificationSettings() {
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  
  // Check if PWA is installed
  useEffect(() => {
    const checkPWAInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsPWAInstalled(isStandalone || (isIOS && isIOSStandalone));
    };
    
    checkPWAInstalled();
  }, []);

  // Get subscription status
  const { data: status } = useQuery<{ subscribed: boolean; count: number }>({
    queryKey: ['/api/push/status'],
    enabled: permission === 'granted'
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications are not supported in your browser');
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Fetch the public VAPID key from the server
      const response = await fetch('/api/push/vapid-public-key');
      if (!response.ok) {
        throw new Error('Failed to get VAPID public key');
      }
      const { publicKey } = await response.json();
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // Convert subscription to JSON-serializable format
      const subscriptionData = subscription.toJSON();
      
      await apiRequest('POST', '/api/push/subscribe', subscriptionData);
      
      return subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/push/status'] });
      toast({
        title: "Notifications enabled",
        description: "You'll now receive push notifications for new matches and messages"
      });
    },
    onError: (error: Error) => {
      console.error('Subscription error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      toast({
        title: "Could not enable notifications",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Unsubscribe mutation
  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await apiRequest('POST', '/api/push/unsubscribe', {
          endpoint: subscription.endpoint
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/push/status'] });
      toast({
        title: "Notifications disabled",
        description: "You won't receive push notifications anymore"
      });
    },
    onError: (error: Error) => {
      console.error('Unsubscribe error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Not supported",
        description: "Your browser doesn't support push notifications",
        variant: "destructive"
      });
      return;
    }

    if (permission === 'denied') {
      toast({
        title: "Permission denied",
        description: "Please enable notifications in your browser settings",
        variant: "destructive"
      });
      return;
    }

    if (permission === 'default') {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        subscribeMutation.mutate();
      }
    } else if (permission === 'granted') {
      subscribeMutation.mutate();
    }
  };

  const handleDisableNotifications = () => {
    unsubscribeMutation.mutate();
  };

  const isSubscribed = status?.subscribed;
  const isLoading = subscribeMutation.isPending || unsubscribeMutation.isPending;
  
  // Check if browser supports notifications
  const supportsNotifications = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified about new matches, messages, and listing updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!supportsNotifications && (
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <p>Push notifications are not supported in your current browser.</p>
            <p className="mt-1">Try using Chrome, Edge, or Firefox for the best experience.</p>
          </div>
        )}
        
        {supportsNotifications && permission === 'denied' && (
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <p>Notifications are blocked. To enable them:</p>
            <ol className="list-decimal ml-5 mt-2 space-y-1">
              <li>Click the lock icon in your address bar</li>
              <li>Find "Notifications" and set it to "Allow"</li>
              <li>Refresh the page and try again</li>
            </ol>
          </div>
        )}
        
        {supportsNotifications && permission !== 'denied' && !isPWAInstalled && (
          <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
            <p className="font-medium text-blue-900 dark:text-blue-100">💡 Pro Tip: Install as App</p>
            <p className="mt-1 text-blue-800 dark:text-blue-200">
              For the best notification experience, install ProHorseMatch as an app on your device. 
              Look for the install button in your browser menu.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium">
              {isSubscribed ? 'Notifications Enabled' : 'Notifications Disabled'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isSubscribed 
                ? "You're receiving push notifications" 
                : "Enable to get instant updates"}
            </p>
          </div>
          
          {supportsNotifications && permission !== 'denied' && (
            <Button
              onClick={isSubscribed ? handleDisableNotifications : handleEnableNotifications}
              disabled={isLoading}
              variant={isSubscribed ? "outline" : "default"}
              size="sm"
              data-testid={isSubscribed ? "button-disable-notifications" : "button-enable-notifications"}
            >
              {isLoading ? (
                "Processing..."
              ) : isSubscribed ? (
                <>
                  <BellOff className="h-4 w-4 mr-2" />
                  Disable
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Enable
                </>
              )}
            </Button>
          )}
        </div>

        {isSubscribed && (
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            You'll receive notifications for:
            <ul className="list-disc ml-5 mt-1 space-y-0.5">
              <li>New matches on horses you've liked</li>
              <li>Message replies from buyers/sellers</li>
              <li>Updates on horses you're watching</li>
              <li>Weekly digest of new listings</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
