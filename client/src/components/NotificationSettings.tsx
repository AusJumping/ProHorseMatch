import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Heart, MessageSquare, RefreshCw, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  const [isIOS, setIsIOS] = useState(false);
  
  // Check if PWA is installed and detect iOS
  useEffect(() => {
    const checkPWAInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsPWAInstalled(isStandalone || (isIOSDevice && isIOSStandalone));
      setIsIOS(isIOSDevice);
    };
    
    checkPWAInstalled();
  }, []);

  // Get subscription status and preferences
  const { data: status } = useQuery<{ 
    subscribed: boolean; 
    count: number;
    preferences?: {
      notify_matches: boolean;
      notify_messages: boolean;
      notify_updates: boolean;
      notify_digest: boolean;
    };
  }>({
    queryKey: ['/api/push/status'],
    enabled: permission === 'granted'
  });

  // Update notification preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: {
      notify_matches?: boolean;
      notify_messages?: boolean;
      notify_updates?: boolean;
      notify_digest?: boolean;
    }) => {
      await apiRequest('POST', '/api/push/preferences', preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/push/status'] });
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
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
      console.log('VAPID public key from server:', publicKey);
      console.log('VAPID key length:', publicKey?.length);
      
      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      console.log('Converted VAPID key (Uint8Array):', applicationServerKey);
      console.log('Converted key length:', applicationServerKey?.length);
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      // Log subscription details for debugging
      console.log('Full subscription object:', subscription);
      console.log('Subscription endpoint:', subscription.endpoint);
      console.log('Subscription getKey p256dh:', subscription.getKey('p256dh'));
      console.log('Subscription getKey auth:', subscription.getKey('auth'));
      
      // Manually construct the subscription data
      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');
      
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: p256dhKey ? btoa(String.fromCharCode(...Array.from(new Uint8Array(p256dhKey)))) : '',
          auth: authKey ? btoa(String.fromCharCode(...Array.from(new Uint8Array(authKey)))) : ''
        }
      };
      
      console.log('Constructed subscription data:', subscriptionData);
      
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
  const hasNotification = 'Notification' in window;
  const hasServiceWorker = 'serviceWorker' in navigator;
  const hasPushManager = 'PushManager' in window;
  const supportsNotifications = hasNotification && hasServiceWorker && hasPushManager;
  
  // Debug logging for troubleshooting
  console.log('Notification support check:', {
    hasNotification,
    hasServiceWorker,
    hasPushManager,
    supportsNotifications,
    permission,
    isPWAInstalled,
    isIOS
  });

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
          <div className="text-sm bg-blue-50 dark:bg-blue-950 p-4 rounded-md border border-blue-200 dark:border-blue-800">
            <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📱 {isIOS ? 'iOS Installation Required' : 'Install as App for Best Experience'}
            </p>
            {isIOS ? (
              <div className="text-blue-800 dark:text-blue-200 space-y-2">
                <p className="font-medium">
                  On iOS/Safari, push notifications only work when the app is installed to your home screen:
                </p>
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Open this site in <strong>Safari</strong> (not Chrome or other browsers)</li>
                  <li>Tap the <strong>Share</strong> button (square with arrow pointing up)</li>
                  <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                  <li>Tap <strong>"Add"</strong> in the top right</li>
                  <li>Open the app from your home screen</li>
                  <li>Return here and enable notifications</li>
                </ol>
                <p className="mt-2 text-sm">
                  💡 This is required for iOS 16.4+ to receive push notifications
                </p>
              </div>
            ) : (
              <div className="text-blue-800 dark:text-blue-200">
                <p>
                  For the best notification experience, install ProHorseMatch as an app:
                </p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li><strong>Chrome/Edge:</strong> Look for the install icon in the address bar or browser menu</li>
                  <li><strong>Android:</strong> Tap "Add to Home Screen" when prompted</li>
                </ul>
              </div>
            )}
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

        {isSubscribed && status?.preferences && (
          <div className="space-y-4 pt-4 border-t">
            <p className="text-sm font-medium">Choose which notifications you want to receive:</p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-3">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <Label htmlFor="notify-matches" className="text-sm font-normal cursor-pointer">
                      New matches
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      When horses you've liked get updated or sellers respond
                    </p>
                  </div>
                </div>
                <Switch
                  id="notify-matches"
                  checked={status.preferences.notify_matches}
                  onCheckedChange={(checked) => 
                    updatePreferencesMutation.mutate({ notify_matches: checked })
                  }
                  data-testid="toggle-notify-matches"
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <Label htmlFor="notify-messages" className="text-sm font-normal cursor-pointer">
                      Message replies
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      When buyers or sellers send you messages
                    </p>
                  </div>
                </div>
                <Switch
                  id="notify-messages"
                  checked={status.preferences.notify_messages}
                  onCheckedChange={(checked) => 
                    updatePreferencesMutation.mutate({ notify_messages: checked })
                  }
                  data-testid="toggle-notify-messages"
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-3">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <Label htmlFor="notify-updates" className="text-sm font-normal cursor-pointer">
                      Horse updates
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Price changes, new photos, or status updates on saved horses
                    </p>
                  </div>
                </div>
                <Switch
                  id="notify-updates"
                  checked={status.preferences.notify_updates}
                  onCheckedChange={(checked) => 
                    updatePreferencesMutation.mutate({ notify_updates: checked })
                  }
                  data-testid="toggle-notify-updates"
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <Label htmlFor="notify-digest" className="text-sm font-normal cursor-pointer">
                      Weekly digest
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Summary of new listings matching your preferences
                    </p>
                  </div>
                </div>
                <Switch
                  id="notify-digest"
                  checked={status.preferences.notify_digest}
                  onCheckedChange={(checked) => 
                    updatePreferencesMutation.mutate({ notify_digest: checked })
                  }
                  data-testid="toggle-notify-digest"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
