import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, MessageSquare, Heart, X } from "lucide-react";
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

interface NotificationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function NotificationPromptModal({ isOpen, onClose, onComplete }: NotificationPromptModalProps) {
  const { toast } = useToast();
  const [isEnabling, setIsEnabling] = useState(false);

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
      onComplete?.();
      onClose();
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
        description: "Please enable notifications in your browser settings",
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
        onClose();
      }
    } else if (Notification.permission === 'granted') {
      subscribeMutation.mutate();
    }
  };

  const supportsNotifications = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-[#8B7355]/10 p-2 rounded-full">
              <Bell className="w-6 h-6 text-[#8B7355]" />
            </div>
            Never Miss a Match!
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Stay connected with instant notifications
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <Heart className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">New Horse Matches</p>
              <p className="text-sm text-green-700">Get notified when horses matching your search are listed</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-800">New Messages</p>
              <p className="text-sm text-blue-700">Know instantly when someone sends you a message</p>
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <p className="font-semibold text-slate-800 text-sm mb-2 flex items-center gap-2">
              <span>📱</span> Install as App for Best Experience
            </p>
            <p className="text-slate-700 text-sm mb-2">
              For the best notification experience, install ProHorseMatch as an app:
            </p>
            <ul className="text-slate-600 text-sm space-y-1 ml-4 list-disc">
              <li><strong>Chrome/Edge:</strong> Look for the install icon in the address bar or browser menu</li>
              <li><strong>Android:</strong> Tap "Add to Home Screen" when prompted</li>
              <li><strong>iPhone/iPad:</strong> Open in <strong>Safari</strong>, tap the Share button, then "Add to Home Screen"</li>
            </ul>
          </div>
          
          {!supportsNotifications && (
            <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <p className="font-medium">Install Required for Notifications</p>
              <p>Install the app first using the instructions above to enable push notifications.</p>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          {supportsNotifications && (
            <Button 
              onClick={handleEnableNotifications}
              disabled={isEnabling}
              className="w-full bg-[#8B7355] hover:bg-[#6B5344] text-white h-12 text-base"
            >
              {isEnabling ? (
                "Enabling..."
              ) : (
                <>
                  <Bell className="w-5 h-5 mr-2" />
                  Enable Notifications
                </>
              )}
            </Button>
          )}
          
          <Button 
            variant="ghost"
            onClick={onClose}
            className="w-full text-neutral-500"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
