import React, { useEffect, useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '../hooks/useAuth';
import { 
  isPushNotificationSupported, 
  requestNotificationPermission, 
  isSubscribedToPushNotifications,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  registerNotificationServiceWorker
} from '../lib/notifications';

interface NotificationPreferences {
  horses: boolean;
  messages: boolean;
  marketing: boolean;
}

const NotificationSettings: React.FC = () => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isEnabling, setIsEnabling] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    horses: true,
    messages: true,
    marketing: false
  });

  // Check if push notifications are supported
  useEffect(() => {
    setIsSupported(isPushNotificationSupported());
    checkSubscriptionStatus();
    fetchPreferences();
  }, [isAuthenticated]);

  const checkSubscriptionStatus = async () => {
    if (isAuthenticated) {
      try {
        const subscribed = await isSubscribedToPushNotifications();
        setIsSubscribed(subscribed);
      } catch (error) {
        console.error("Error checking notification subscription:", error);
      }
    }
  };

  const fetchPreferences = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await apiRequest("GET", "/api/notifications/preferences");
      if (response.ok) {
        const data = await response.json();
        setPreferences({
          horses: data.horses !== false,
          messages: data.messages !== false,
          marketing: data.marketing === true
        });
      }
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
    }
  };

  const handleToggleNotifications = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported on your device or browser.",
        variant: "destructive",
      });
      return;
    }

    setIsEnabling(true);

    try {
      if (!isSubscribed) {
        // Request permission and register service worker
        const permissionGranted = await requestNotificationPermission();
        
        if (!permissionGranted) {
          toast({
            title: "Permission Denied",
            description: "Please allow notifications in your browser settings to receive updates.",
            variant: "destructive",
          });
          setIsEnabling(false);
          return;
        }

        // Register service worker
        await registerNotificationServiceWorker();
        
        // Subscribe to push notifications
        const success = await subscribeToPushNotifications();
        
        if (success) {
          setIsSubscribed(true);
          toast({
            title: "Notifications Enabled",
            description: "You will now receive notifications about new horses and messages.",
          });
        } else {
          toast({
            title: "Subscription Failed",
            description: "Failed to enable notifications. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        // Unsubscribe from push notifications
        const success = await unsubscribeFromPushNotifications();
        
        if (success) {
          setIsSubscribed(false);
          toast({
            title: "Notifications Disabled",
            description: "You will no longer receive push notifications.",
          });
        } else {
          toast({
            title: "Unsubscription Failed",
            description: "Failed to disable notifications. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
      toast({
        title: "Error",
        description: "An error occurred while changing notification settings.",
        variant: "destructive",
      });
    }
    
    setIsEnabling(false);
  };

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!isAuthenticated) return;
    
    try {
      const newPreferences = { ...preferences, [key]: value };
      setPreferences(newPreferences);
      
      const response = await apiRequest("POST", "/api/notifications/preferences", newPreferences);
      
      if (!response.ok) {
        // Revert the change if the request fails
        setPreferences(preferences);
        toast({
          title: "Update Failed",
          description: "Failed to update notification preferences.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating preferences:", error);
      // Revert the change if the request fails
      setPreferences(preferences);
      toast({
        title: "Update Failed",
        description: "Failed to update notification preferences.",
        variant: "destructive",
      });
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Push notifications are not supported in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            To receive notifications, please use a modern browser like Chrome, Firefox, or Edge.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Enable notifications to stay updated on new horses and messages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium">Enable Push Notifications</div>
              <div className="text-sm text-muted-foreground">
                {isSubscribed ? 'You are currently receiving notifications' : 'You will receive notifications on this device'}
              </div>
            </div>
            <Button 
              variant={isSubscribed ? "outline" : "default"}
              onClick={handleToggleNotifications}
              disabled={isEnabling}
            >
              {isEnabling ? "Processing..." : isSubscribed ? "Disable" : "Enable"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isSubscribed && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Choose which notifications you want to receive.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium">Horse Matches</div>
                <div className="text-sm text-muted-foreground">
                  Get notified when horses matching your search criteria are listed
                </div>
              </div>
              <Switch 
                checked={preferences.horses} 
                onCheckedChange={(checked) => handlePreferenceChange('horses', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium">Messages</div>
                <div className="text-sm text-muted-foreground">
                  Get notified when you receive new messages
                </div>
              </div>
              <Switch 
                checked={preferences.messages} 
                onCheckedChange={(checked) => handlePreferenceChange('messages', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium">Marketing & Updates</div>
                <div className="text-sm text-muted-foreground">
                  Get notified about platform updates and special offers
                </div>
              </div>
              <Switch 
                checked={preferences.marketing} 
                onCheckedChange={(checked) => handlePreferenceChange('marketing', checked)}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <p className="text-xs text-muted-foreground">
              You can change your notification preferences at any time. Your browser may also have additional notification settings.
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default NotificationSettings;