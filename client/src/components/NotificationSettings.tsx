import React, { useState, useEffect } from 'react';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { Bell, BellOff, Check, XCircle } from 'lucide-react';
import { subscribeToPushNotifications, unsubscribeFromPushNotifications, isSubscribedToPushNotifications } from '../lib/notifications';

const NotificationSettings = () => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [notifyForMatches, setNotifyForMatches] = useState(true);
  const [notifyForMessages, setNotifyForMessages] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Check notification permission and subscription status
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkPermissionAndSubscription = async () => {
      try {
        // Check if browser has denied notification permission
        if (Notification.permission === 'denied') {
          setPermissionDenied(true);
          setIsLoading(false);
          return;
        }

        // Check if already subscribed
        const subscribed = await isSubscribedToPushNotifications();
        setIsSubscribed(subscribed);

        // Get notification preferences
        const response = await apiRequest('GET', '/api/notifications/preferences');
        const data = await response.json();
        
        setNotifyForMatches(data.notify_for_matches);
        setNotifyForMessages(data.notify_for_messages);
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking notification status:', error);
        setIsLoading(false);
      }
    };

    checkPermissionAndSubscription();
  }, [isAuthenticated]);

  // Subscribe to push notifications
  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      const subscribed = await subscribeToPushNotifications();
      
      if (subscribed) {
        setIsSubscribed(true);
        toast({
          title: 'Notifications enabled',
          description: "You'll now receive notifications for new matches and messages.",
          variant: 'default',
        });
      } else if (Notification.permission === 'denied') {
        setPermissionDenied(true);
        toast({
          title: 'Permission denied',
          description: 'Please allow notifications in your browser settings.',
          variant: 'destructive',
        });
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      toast({
        title: 'Subscription failed',
        description: 'There was a problem enabling notifications.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  // Unsubscribe from push notifications
  const handleUnsubscribe = async () => {
    try {
      setIsLoading(true);
      const unsubscribed = await unsubscribeFromPushNotifications();
      
      if (unsubscribed) {
        setIsSubscribed(false);
        toast({
          title: 'Notifications disabled',
          description: "You won't receive any more push notifications.",
          variant: 'default',
        });
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      toast({
        title: 'Unsubscription failed',
        description: 'There was a problem disabling notifications.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  // Update notification preferences
  const updatePreferences = async () => {
    try {
      setIsLoading(true);
      await apiRequest('POST', '/api/notifications/preferences', {
        notify_for_matches: notifyForMatches,
        notify_for_messages: notifyForMessages,
      });
      
      toast({
        title: 'Preferences updated',
        description: 'Your notification preferences have been saved.',
        variant: 'default',
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: 'Update failed',
        description: 'There was a problem saving your preferences.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <div className="text-center p-4">Please log in to manage notifications</div>;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Manage how and when you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : permissionDenied ? (
          <div className="bg-destructive/10 p-4 rounded-md flex items-start gap-3">
            <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium">Permission Denied</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Your browser is blocking notifications. Please update your browser settings to enable notifications from this site.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Push Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    {isSubscribed ? 'Notifications are enabled' : 'Enable browser notifications'}
                  </p>
                </div>
                <Button 
                  variant={isSubscribed ? "outline" : "default"}
                  onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
                  disabled={isLoading}
                >
                  {isSubscribed ? (
                    <span className="flex items-center gap-1"><BellOff className="h-4 w-4" /> Disable</span>
                  ) : (
                    <span className="flex items-center gap-1"><Bell className="h-4 w-4" /> Enable</span>
                  )}
                </Button>
              </div>

              {isSubscribed && (
                <>
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Notification Types</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">Horse Matches</h5>
                          <p className="text-sm text-muted-foreground">
                            Get notified when new horses match your preferences
                          </p>
                        </div>
                        <Switch 
                          checked={notifyForMatches} 
                          onCheckedChange={setNotifyForMatches}
                          aria-label="Notify for matches"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">Messages</h5>
                          <p className="text-sm text-muted-foreground">
                            Get notified when you receive new messages
                          </p>
                        </div>
                        <Switch 
                          checked={notifyForMessages} 
                          onCheckedChange={setNotifyForMessages}
                          aria-label="Notify for messages"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
      {isSubscribed && !isLoading && !permissionDenied && (
        <CardFooter className="flex justify-end border-t pt-4">
          <Button 
            onClick={updatePreferences} 
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <Check className="h-4 w-4" /> Save Preferences
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default NotificationSettings;