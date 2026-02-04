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
    <div className="mb-6 rounded-2xl overflow-hidden shadow-2xl border-4 border-[#8B7355] animate-pulse-subtle">
      {/* Bold Header */}
      <div className="bg-gradient-to-r from-[#8B7355] via-[#9D8B6E] to-[#8B7355] p-5 text-white relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBjeD0iMjAiIGN5PSIyMCIgcj0iMiIvPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm animate-bounce">
              <Bell className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-2xl flex items-center gap-2">
                🔔 Enable Notifications
              </h3>
              <p className="text-white/90 text-lg">Never miss a horse match or message!</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-white/70 hover:text-white hover:bg-white/20"
            onClick={() => {
              localStorage.setItem('notification-reminder-dismissed', 'true');
              setIsDismissed(true);
            }}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="bg-gradient-to-b from-amber-50 to-orange-50 p-6">
        <div className="grid sm:grid-cols-3 gap-4 mb-5">
          <div className="bg-white rounded-xl p-4 shadow-md border border-green-200 text-center">
            <div className="bg-green-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white text-xl">🐴</span>
            </div>
            <p className="font-semibold text-green-800">New Matches</p>
            <p className="text-sm text-green-600">Instant alerts for matching horses</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-md border border-blue-200 text-center">
            <div className="bg-blue-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white text-xl">💬</span>
            </div>
            <p className="font-semibold text-blue-800">Messages</p>
            <p className="text-sm text-blue-600">Know when sellers respond</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-md border border-purple-200 text-center">
            <div className="bg-purple-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white text-xl">📢</span>
            </div>
            <p className="font-semibold text-purple-800">Updates</p>
            <p className="text-sm text-purple-600">Price drops & new photos</p>
          </div>
        </div>
        
        <div className="bg-white/80 rounded-xl p-4 mb-5 border border-slate-200">
          <p className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
            📱 Install as App for Best Experience
          </p>
          <div className="grid sm:grid-cols-3 gap-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>Desktop:</strong> Install icon in address bar</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>iPhone:</strong> Safari → Share → Add to Home</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>Android:</strong> "Add to Home Screen"</span>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleEnableNotifications}
          disabled={isEnabling}
          className="w-full bg-gradient-to-r from-[#8B7355] to-[#6B5344] hover:from-[#7a6348] hover:to-[#5a4539] text-white h-14 text-lg font-bold rounded-xl shadow-lg shadow-[#8B7355]/30 transition-all hover:shadow-xl hover:scale-[1.02]"
        >
          {isEnabling ? (
            "Enabling..."
          ) : (
            <>
              <Bell className="w-6 h-6 mr-3" />
              Enable Notifications Now
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
