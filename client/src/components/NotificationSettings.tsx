import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
// Use simpler approach without icons from lucide-react

interface NotificationPreferences {
  horses: boolean;
  messages: boolean;
  marketing: boolean;
}

const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    horses: true,
    messages: true,
    marketing: false,
  });

  // Fetch notification preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setIsLoading(true);
        
        // Let's check authentication status directly
        console.log("Current user state:", { user, isAuthenticated: !!user });
        
        // Always use the most reliable endpoint to get preferences
        const apiUrl = '/api/notifications/preferences-public';
        console.log(`Fetching notification preferences from ${apiUrl}`);
        
        try {
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include' // Important for sessions
          });
          
          if (response.ok) {
            console.log("Successfully fetched notification preferences");
            const data = await response.json();
            
            // Set preferences from response data - with multiple fallbacks to ensure we have values
            setPreferences({
              horses: data.preferences?.horses ?? data.notify_for_matches ?? true,
              messages: data.preferences?.messages ?? data.notify_for_messages ?? true,
              marketing: data.preferences?.marketing ?? false
            });
            
            setSubscribed(data.subscribed ?? data.is_subscribed ?? false);
          } else {
            console.log("Failed to fetch preferences, using defaults");
            // Use defaults for now
            setPreferences({
              horses: true,
              messages: true,
              marketing: false
            });
            setSubscribed(false);
          }
        } catch (fetchError) {
          console.error("Fetch error:", fetchError);
          // Use defaults
          setPreferences({
            horses: true,
            messages: true,
            marketing: false
          });
          setSubscribed(false);
        }
      } catch (error) {
        console.error('Failed to handle notification preferences:', error);
        // Use defaults
        setPreferences({
          horses: true,
          messages: true,
          marketing: false
        });
        setSubscribed(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchPreferences();
    }
  }, [user, toast]);

  // Handle subscription
  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      
      if (subscribed) {
        // Unsubscribe
        const response = await apiRequest('POST', '/api/notifications/unsubscribe');
        if (response.ok) {
          setSubscribed(false);
          toast({
            title: 'Notifications disabled',
            description: 'You will no longer receive push notifications.',
          });
        }
      } else {
        // Check if the browser supports notifications
        if (!('Notification' in window)) {
          toast({
            title: 'Notifications not supported',
            description: 'Your browser does not support push notifications.',
            variant: 'destructive',
          });
          return;
        }

        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast({
            title: 'Permission denied',
            description: 'You need to allow notifications from your browser settings.',
            variant: 'destructive',
          });
          return;
        }

        // Register service worker and subscribe
        try {
          // Import and use the notification helpers from our lib
          const { 
            registerNotificationServiceWorker, 
            subscribeToPushNotifications 
          } = await import('@/lib/notifications');
          
          // First register the service worker
          const registered = await registerNotificationServiceWorker();
          if (!registered) {
            throw new Error('Failed to register service worker');
          }
          
          // Then subscribe to push notifications
          const success = await subscribeToPushNotifications();
          
          if (success) {
            setSubscribed(true);
            toast({
              title: 'Notifications enabled',
              description: 'You will now receive notifications about new horses and messages.',
            });
          } else {
            // If subscription failed due to auth issues
            toast({
              title: 'Authentication required',
              description: 'Please log in again to enable notifications.',
              variant: 'destructive',
            });
          }
        } catch (error) {
          console.error('Failed to subscribe to notifications:', error);
          toast({
            title: 'Subscription failed',
            description: 'Failed to enable notifications. Please try again later.',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification settings. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle preference changes
  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
    try {
      setIsLoading(true);
      const newPreferences = { ...preferences, [key]: value };
      
      const response = await apiRequest('POST', '/api/notifications/preferences', {
        preferences: newPreferences
      });
      
      if (response.ok) {
        setPreferences(newPreferences);
        toast({
          title: 'Preferences updated',
          description: 'Your notification preferences have been updated.',
        });
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification preferences. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Push Notifications
          </CardTitle>
          <CardDescription>
            Receive alerts directly to your device when new horses match your preferences or you get new messages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center py-2">
            <div>
              <p className="font-medium">Enable push notifications</p>
              <p className="text-sm text-gray-500">
                {subscribed 
                  ? 'Push notifications are currently enabled' 
                  : 'Enable notifications to stay updated on new horses and messages'}
              </p>
            </div>
            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              variant={subscribed ? "outline" : "default"}
            >
              {isLoading ? 'Processing...' : subscribed ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {subscribed && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Select which types of notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <div>
                <Label htmlFor="horses">New Horse Alerts</Label>
                <p className="text-sm text-gray-500">Get notified when new horses match your preferences</p>
              </div>
              <Switch
                id="horses"
                checked={preferences.horses}
                onCheckedChange={(checked) => handlePreferenceChange('horses', checked)}
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-between items-center py-2">
              <div>
                <Label htmlFor="messages">Message Alerts</Label>
                <p className="text-sm text-gray-500">Get notified when you receive new messages</p>
              </div>
              <Switch
                id="messages"
                checked={preferences.messages}
                onCheckedChange={(checked) => handlePreferenceChange('messages', checked)}
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-between items-center py-2">
              <div>
                <Label htmlFor="marketing">Updates and Announcements</Label>
                <p className="text-sm text-gray-500">Receive updates about new features and platform improvements</p>
              </div>
              <Switch
                id="marketing"
                checked={preferences.marketing}
                onCheckedChange={(checked) => handlePreferenceChange('marketing', checked)}
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mt-6">
        <h3 className="text-amber-800 font-medium mb-2">About Browser Notifications</h3>
        <p className="text-amber-700 text-sm">
          Push notifications are only delivered when your browser is open. For the best experience, consider keeping a browser tab 
          open to ProHorseMatch or allowing background notifications in your browser settings.
        </p>
      </div>
    </div>
  );
};

export default NotificationSettings;