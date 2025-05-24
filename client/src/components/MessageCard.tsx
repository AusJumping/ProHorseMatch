import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface Conversation {
  id: number;
  customer_id: number;
  owner_id: number;
  horse_id: number;
  last_message_id: number | null;
  last_message_time: string | null;
  unread_count: number;
  horse: {
    id: number;
    name: string;
    photos: string[];
    price: number;
    currency: string;
    breeds: string[];
    age: number;
    sex: string;
  } | null;
  otherParty: {
    id: number;
    name: string;
    type: string;
  } | null;
}

interface MessageCardProps {
  conversation: Conversation;
  onClick: () => void;
  isActive?: boolean;
  onDelete?: () => void;
}

const MessageCard = ({ conversation, onClick, isActive = false, onDelete }: MessageCardProps) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  // Format the timestamp
  const timeAgo = conversation.last_message_time 
    ? formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })
    : "New conversation";

  // Format the last message time to be more user friendly
  const formatTimeAgo = (timeString: string) => {
    const time = formatDistanceToNow(new Date(timeString), { addSuffix: true });
    return time.replace("about ", "").replace("less than a minute ago", "just now");
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the conversation click
    
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      
      await apiRequest("DELETE", `/api/conversations/${conversation.id}`);
      
      // Refresh conversations list
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations'] 
      });
      
      // Refresh unread count
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/messages/unread'] 
      });
      
      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed successfully.",
      });
      
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div 
      className={`flex gap-3 p-3 rounded-lg cursor-pointer ${
        isActive ? "bg-primary text-white" : "hover:bg-neutral-50"
      }`}
      onClick={onClick}
    >
      {conversation.horse?.photos?.length && conversation.horse.photos.length > 0 ? (
        <img 
          src={conversation.horse.photos[0]} 
          alt={`${conversation.horse.name}`} 
          className="w-12 h-12 rounded-full object-cover" 
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500">
          <span className="text-lg font-semibold">
            {conversation.horse?.name?.charAt(0) || "H"}
          </span>
        </div>
      )}
      
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h4 className="font-accent font-medium">
            {conversation.otherParty?.name || "User"}
          </h4>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${isActive ? "text-white" : "text-neutral-500"}`}>
              {conversation.last_message_time 
                ? formatTimeAgo(conversation.last_message_time)
                : "New"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className={`h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 ${
                isActive ? "text-white hover:text-red-600" : "text-neutral-400"
              }`}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className={`text-sm ${isActive ? "text-white" : "text-neutral-700"} line-clamp-1`}>
            {conversation.horse 
              ? `${conversation.horse.name}`
              : "No horse details"}
          </p>
          {conversation.unread_count > 0 && (
            <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageCard;
