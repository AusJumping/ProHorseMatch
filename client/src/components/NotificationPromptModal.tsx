import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Bell, MessageSquare, Heart, Sparkles, Smartphone, Monitor } from "lucide-react";
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
        description: "Your browser doesn't support push notifications. Try installing the app first.",
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
        toast({
          title: "Permission required",
          description: "You'll need to allow notifications to receive alerts",
          variant: "destructive"
        });
      }
    } else if (Notification.permission === 'granted') {
      subscribeMutation.mutate();
    }
  };

  const handleSkip = () => {
    toast({
      title: "Notifications skipped",
      description: "You can enable notifications anytime from your Profile settings",
    });
    onClose();
  };

  const supportsNotifications = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

  console.log('NotificationPromptModal render - isOpen:', isOpen);
  if (!isOpen) return null;
  console.log('NotificationPromptModal - rendering modal UI');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - non-clickable */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8B7355] to-[#6B5344] p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative text-center">
            <div className="inline-flex bg-white/20 p-4 rounded-full backdrop-blur-sm mb-4">
              <Bell className="w-10 h-10" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <h2 className="text-2xl font-bold">Set Up Notifications</h2>
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <p className="text-white/90 text-lg">Stay informed about new horse matches and messages</p>
          </div>
        </div>
        
        {/* Benefits */}
        <div className="p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="bg-green-500 p-2.5 rounded-full flex-shrink-0">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-800">New Horse Matches</p>
                <p className="text-sm text-green-700">Be first to see matching horses</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="bg-blue-500 p-2.5 rounded-full flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-blue-800">New Messages</p>
                <p className="text-sm text-blue-700">Never miss seller replies</p>
              </div>
            </div>
          </div>
          
          {/* Installation Instructions */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              How to Enable Notifications
            </h3>
            
            <div className="space-y-4">
              {/* iPhone/iPad */}
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  🍎 iPhone / iPad
                </p>
                <ol className="text-sm text-slate-600 space-y-1.5 list-decimal list-inside">
                  <li>Tap the <strong>Share</strong> button (square with arrow) in Safari</li>
                  <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                  <li>Open the app from your home screen</li>
                  <li>Tap <strong>"Enable Notifications"</strong> below</li>
                </ol>
              </div>
              
              {/* Android */}
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  🤖 Android
                </p>
                <ol className="text-sm text-slate-600 space-y-1.5 list-decimal list-inside">
                  <li>Tap the <strong>menu</strong> (three dots) in Chrome</li>
                  <li>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></li>
                  <li>Open the app from your home screen</li>
                  <li>Tap <strong>"Enable Notifications"</strong> below</li>
                </ol>
              </div>
              
              {/* Desktop */}
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <Monitor className="w-4 h-4" /> Desktop Browser
                </p>
                <ol className="text-sm text-slate-600 space-y-1.5 list-decimal list-inside">
                  <li>Click the <strong>install icon</strong> in your browser's address bar</li>
                  <li>Or simply tap <strong>"Enable Notifications"</strong> below</li>
                </ol>
              </div>
            </div>
          </div>
          
          {!supportsNotifications && (
            <div className="text-sm text-amber-800 bg-amber-50 p-4 rounded-xl border border-amber-200">
              <p className="font-semibold mb-1">📱 Install App First</p>
              <p className="text-amber-700">Follow the instructions above to install the app, then enable notifications.</p>
            </div>
          )}
        </div>
        
        {/* Actions - Required choice */}
        <div className="p-6 pt-0 space-y-3 border-t border-slate-100">
          <p className="text-center text-sm text-slate-500 mb-2">Choose an option to continue:</p>
          
          {supportsNotifications ? (
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
          ) : (
            <Button 
              disabled
              className="w-full bg-slate-300 text-slate-500 h-14 text-lg font-semibold rounded-xl cursor-not-allowed"
            >
              <Bell className="w-5 h-5 mr-2" />
              Install App First (see above)
            </Button>
          )}
          
          <Button 
            variant="outline"
            onClick={handleSkip}
            className="w-full h-12 text-base font-medium border-2 border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400 rounded-xl"
          >
            Skip for Now
          </Button>
          
          <p className="text-center text-xs text-slate-400 mt-2">
            You can always enable notifications later in Profile → Account Settings
          </p>
        </div>
      </div>
    </div>
  );
}
