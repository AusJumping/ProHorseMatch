import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Bell, MessageSquare, Heart, X, Sparkles, CheckCircle2 } from "lucide-react";
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-[#8B7355] to-[#6B5344] p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
              <Bell className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">Never Miss a Match!</h2>
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </div>
              <p className="text-white/90 mt-1">Stay connected with instant notifications</p>
            </div>
          </div>
          
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="bg-green-500 p-2 rounded-full flex-shrink-0">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-800">New Horse Matches</p>
                <p className="text-sm text-green-700 mt-0.5">Be first to see horses matching your criteria</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="bg-blue-500 p-2 rounded-full flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-blue-800">New Messages</p>
                <p className="text-sm text-blue-700 mt-0.5">Never miss a message from sellers</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
            <p className="font-semibold text-slate-800 text-sm mb-2 flex items-center gap-2">
              📱 Install as App for Best Experience
            </p>
            <ul className="text-slate-600 text-sm space-y-1.5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <span><strong>Desktop:</strong> Click install icon in address bar</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <span><strong>iPhone/iPad:</strong> Safari → Share → Add to Home Screen</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <span><strong>Android:</strong> Tap "Add to Home Screen" when prompted</span>
              </li>
            </ul>
          </div>
          
          {!supportsNotifications && (
            <div className="text-sm text-amber-800 bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
              <div className="bg-amber-400 p-1.5 rounded-full flex-shrink-0">
                <Bell className="w-3 h-3 text-white" />
              </div>
              <div>
                <p className="font-semibold">Install Required</p>
                <p className="text-amber-700 mt-0.5">Install the app first to enable push notifications.</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="p-6 pt-0 space-y-3">
          {supportsNotifications && (
            <Button 
              onClick={handleEnableNotifications}
              disabled={isEnabling}
              className="w-full bg-gradient-to-r from-[#8B7355] to-[#6B5344] hover:from-[#7a6348] hover:to-[#5a4539] text-white h-14 text-lg font-semibold rounded-xl shadow-lg shadow-[#8B7355]/25 transition-all hover:shadow-xl hover:shadow-[#8B7355]/30"
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
          
          <button 
            onClick={onClose}
            className="w-full py-3 text-slate-500 hover:text-slate-700 font-medium transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
