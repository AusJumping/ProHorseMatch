import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      setIsInstalled(isStandalone);
    };
    
    checkInstalled();

    // Check if user has permanently dismissed
    const permanentlyDismissed = localStorage.getItem('pwa-install-dismissed');
    if (permanentlyDismissed === 'true') {
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser prompt
      e.preventDefault();
      
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Show banner after a delay and some engagement
      const pageViews = parseInt(localStorage.getItem('page-views') || '0');
      const lastInstallPromptTime = parseInt(localStorage.getItem('last-install-prompt-time') || '0');
      const now = Date.now();

      // Note: page-views is incremented by ContextualNotificationPrompt, so we use the current value
      // Show if:
      // 1. User has viewed 2+ pages
      // 2. At least 2 minutes since last prompt
      // 3. Not already installed
      if (pageViews >= 2 && (now - lastInstallPromptTime) > 120000 && !isInstalled) {
        setTimeout(() => {
          setIsVisible(true);
          localStorage.setItem('last-install-prompt-time', now.toString());
        }, 5000); // Wait 5 seconds before showing
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful app installation
    const handleAppInstalled = () => {
      setIsVisible(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handlePermanentDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setIsVisible(false);
  };

  // Don't show if not installable or already installed
  if (!deferredPrompt || !isVisible || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-md animate-in slide-in-from-bottom-4">
      <Card className="shadow-lg border-[#8B7355]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-[#8B7355]/10 p-2 rounded-full flex-shrink-0">
              <Smartphone className="w-5 h-5 text-[#8B7355]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm mb-1">
                Install ProHorseMatch
              </h4>
              <p className="text-sm text-neutral-600 mb-3">
                Install our app for faster access, offline support, and a better experience.
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="bg-[#8B7355] hover:bg-[#6B5344]"
                  onClick={handleInstall}
                  data-testid="button-install-pwa"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Install
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={handleDismiss}
                  data-testid="button-dismiss-pwa-banner"
                >
                  Not Now
                </Button>
              </div>
              <button
                onClick={handlePermanentDismiss}
                className="text-xs text-neutral-500 hover:text-neutral-700 mt-2"
              >
                Don't show again
              </button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
