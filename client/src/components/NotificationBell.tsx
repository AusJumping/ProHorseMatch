import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = "" }: NotificationBellProps) {
  const [, navigate] = useLocation();
  
  const { data: conversations = [] } = useQuery<Array<{ unread_count?: number }>>({
    queryKey: ["/api/conversations"],
    refetchInterval: 10000,
  });

  const { data: pushStatus } = useQuery<{ subscribed: boolean }>({
    queryKey: ['/api/push/status'],
    retry: false,
  });

  const totalUnreadMessages = (conversations as Array<{ unread_count?: number }>).reduce((total: number, conversation) => {
    return total + (conversation.unread_count || 0);
  }, 0);

  const notificationsEnabled = pushStatus?.subscribed;
  const hasUnread = totalUnreadMessages > 0;

  const handleClick = () => {
    if (hasUnread) {
      navigate("/messages");
    } else {
      navigate("/profile");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={`relative h-10 w-10 ${className}`}
      title={hasUnread ? `${totalUnreadMessages} unread messages` : (notificationsEnabled ? "Notifications enabled" : "Enable notifications")}
    >
      <Bell className={`h-5 w-5 ${notificationsEnabled ? 'text-[#8B7355]' : 'text-neutral-400'}`} />
      
      {hasUnread && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-[10px] px-1 bg-red-500 hover:bg-red-500 flex items-center justify-center"
        >
          {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
        </Badge>
      )}
      
      {!notificationsEnabled && !hasUnread && (
        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-amber-500 rounded-full animate-pulse" />
      )}
    </Button>
  );
}
