import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, X } from "lucide-react";
import { Link } from "wouter";

export function ContextualNotificationPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if user has notifications enabled
  const { data: notificationStatus } = useQuery<{ subscribed: boolean }>({
    queryKey: ['/api/push/status'],
    retry: false,
    enabled: typeof Notification !== 'undefined' && Notification.permission === 'granted'
  });

  useEffect(() => {
    // Don't show if already dismissed in this session
    if (isDismissed) return;

    // Don't show if notifications aren't supported
    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Don't show if permission is denied
    if (Notification.permission === 'denied') {
      return;
    }

    // Don't show if already subscribed
    if (notificationStatus?.subscribed) {
      return;
    }

    // Check if user has already dismissed this permanently
    const permanentlyDismissed = localStorage.getItem('notification-prompt-dismissed');
    if (permanentlyDismissed === 'true') {
      return;
    }

    // Check engagement signals
    const pageViews = parseInt(localStorage.getItem('page-views') || '0');
    const lastPromptTime = parseInt(localStorage.getItem('last-prompt-time') || '0');
    const now = Date.now();
    
    // Increment page views
    localStorage.setItem('page-views', (pageViews + 1).toString());

    // Show prompt if:
    // 1. User has viewed 3+ pages
    // 2. At least 1 minute since last prompt (avoid spam)
    // 3. Not on auth or help pages
    const shouldShow = 
      pageViews >= 3 && 
      (now - lastPromptTime) > 60000 &&
      !window.location.pathname.includes('/auth') &&
      !window.location.pathname.includes('/help');

    if (shouldShow) {
      // Wait a few seconds before showing (don't interrupt immediately)
      const timer = setTimeout(() => {
        setIsVisible(true);
        localStorage.setItem('last-prompt-time', now.toString());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isDismissed, notificationStatus]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
  };

  const handlePermanentDismiss = () => {
    localStorage.setItem('notification-prompt-dismissed', 'true');
    setIsVisible(false);
    setIsDismissed(true);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-4">
      <Card className="shadow-lg border-[#8B7355]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-[#8B7355]/10 p-2 rounded-full flex-shrink-0">
              <Bell className="w-5 h-5 text-[#8B7355]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm mb-1">
                Stay Updated on New Matches
              </h4>
              <p className="text-sm text-neutral-600 mb-3">
                Get instant notifications when horses match your search criteria or when you receive new messages.
              </p>
              <div className="flex gap-2">
                <Link href="/profile">
                  <Button 
                    size="sm" 
                    className="bg-[#8B7355] hover:bg-[#6B5344]"
                    data-testid="button-enable-notifications-prompt"
                  >
                    <Bell className="w-3 h-3 mr-1" />
                    Enable
                  </Button>
                </Link>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={handleDismiss}
                  data-testid="button-dismiss-notification-prompt"
                >
                  Maybe Later
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
