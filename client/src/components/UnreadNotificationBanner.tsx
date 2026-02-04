import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, MessageSquare, Bell } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

export function UnreadNotificationBanner() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  const { data: conversations = [] } = useQuery<Array<{ unread_count?: number }>>({
    queryKey: ["/api/conversations"],
    enabled: isAuthenticated,
  });

  const { data: pushStatus } = useQuery<{ subscribed: boolean }>({
    queryKey: ['/api/push/status'],
    enabled: isAuthenticated,
    retry: false,
  });

  const totalUnreadMessages = (conversations as Array<{ unread_count?: number }>).reduce((total: number, conversation) => {
    return total + (conversation.unread_count || 0);
  }, 0);

  const notificationsEnabled = pushStatus?.subscribed;

  useEffect(() => {
    if (isDismissed) return;
    
    const sessionKey = 'unread-banner-shown';
    const alreadyShown = sessionStorage.getItem(sessionKey);
    
    if (!alreadyShown && isAuthenticated && totalUnreadMessages > 0) {
      const timer = setTimeout(() => {
        setShowBanner(true);
        sessionStorage.setItem(sessionKey, 'true');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, totalUnreadMessages, isDismissed]);

  if (!showBanner || isDismissed || totalUnreadMessages === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-in slide-in-from-top-4">
      <div className="bg-white rounded-xl shadow-xl border-2 border-[#8B7355] p-4">
        <div className="flex items-start gap-3">
          <div className="bg-red-100 p-2 rounded-full flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-red-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-base mb-1">
              You have {totalUnreadMessages} unread message{totalUnreadMessages !== 1 ? 's' : ''}!
            </h4>
            <p className="text-sm text-neutral-600 mb-3">
              {!notificationsEnabled 
                ? "Enable notifications so you never miss a message again."
                : "Check your messages to stay connected with buyers and sellers."}
            </p>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => {
                  navigate("/messages");
                  setIsDismissed(true);
                }}
                className="bg-[#8B7355] hover:bg-[#6B5344]"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                View Messages
              </Button>
              
              {!notificationsEnabled && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    navigate("/profile");
                    setIsDismissed(true);
                  }}
                >
                  <Bell className="w-4 h-4 mr-1" />
                  Enable Alerts
                </Button>
              )}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
