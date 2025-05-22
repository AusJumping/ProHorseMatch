import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// A minimal, dedicated page just for enabling notifications with no dependencies on other parts of the app
const EnableNotificationsPage: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Simple direct function to handle notification subscription
  const enableNotifications = async () => {
    setIsLoading(true);
    setStatus('idle');
    
    try {
      // First check if browser supports notifications
      if (!('Notification' in window)) {
        toast({
          title: 'Browser Not Supported',
          description: 'Your browser does not support notifications.',
          variant: 'destructive',
        });
        setStatus('error');
        return;
      }
      
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: 'Permission Denied',
          description: 'Please allow notifications in your browser settings.',
          variant: 'destructive',
        });
        setStatus('error');
        return;
      }
      
      // Register service worker directly
      try {
        const registration = await navigator.serviceWorker.register('/push-sw.js');
        console.log('Push Service Worker registered:', registration);
        
        // Get VAPID key
        const vapidResponse = await fetch('/api/notifications/vapid-public-key');
        const vapidData = await vapidResponse.json();
        const vapidKey = vapidData.publicKey;
        
        if (!vapidKey) {
          throw new Error('Failed to get VAPID key');
        }
        
        // Convert base64 VAPID key to Uint8Array
        const applicationServerKey = urlBase64ToUint8Array(vapidKey);
        
        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });
        
        // Store the subscription on the server using our public endpoint
        const storeResponse = await fetch('/api/notifications/subscribe-public', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription: JSON.stringify(subscription),
            preferences: {
              horses: true,
              messages: true,
              marketing: false
            }
          })
        });
        
        if (storeResponse.ok) {
          setStatus('success');
          toast({
            title: 'Notifications Enabled',
            description: 'You will now receive notifications for new horses and messages.',
          });
        } else {
          throw new Error('Failed to store subscription on server');
        }
      } catch (error) {
        console.error('Error enabling notifications:', error);
        setStatus('error');
        toast({
          title: 'Subscription Failed',
          description: 'There was a problem enabling notifications. Please try again later.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to convert base64 string to Uint8Array
  function urlBase64ToUint8Array(base64String: string): Uint8Array {
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

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Enable Notifications</CardTitle>
          <CardDescription>
            Stay updated with alerts about new horses and messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Enabling notifications will allow ProHorseMatch to send you alerts when:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>New horses match your search criteria</li>
              <li>You receive new messages from horse owners</li>
              <li>Important updates about your account or subscriptions</li>
            </ul>
            
            {status === 'success' ? (
              <div className="bg-green-50 p-4 rounded-md">
                <p className="text-green-700 font-medium">Notifications Successfully Enabled!</p>
                <p className="text-green-600 text-sm mt-1">
                  You will now receive alerts about new horses and messages.
                </p>
              </div>
            ) : status === 'error' ? (
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-red-700 font-medium">Notification Setup Failed</p>
                <p className="text-red-600 text-sm mt-1">
                  Please check your browser settings and try again.
                </p>
              </div>
            ) : null}
            
            <Button 
              className="w-full" 
              onClick={enableNotifications}
              disabled={isLoading || status === 'success'}
            >
              {isLoading ? 'Setting Up...' : status === 'success' ? 'Notifications Enabled' : 'Enable Notifications'}
            </Button>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              You can change your notification preferences anytime in your account settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnableNotificationsPage;