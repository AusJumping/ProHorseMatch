import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { Trash2, MoreVertical } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

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
  onDelete?: (conversation: Conversation) => void;
}

const MessageCard = ({ conversation, onClick, isActive = false, onDelete }: MessageCardProps) => {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
  
  // Handle conversation deletion
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onClick of parent
    setShowDeleteDialog(true);
  };
  
  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      
      const response = await apiRequest("DELETE", `/api/conversations/${conversation.id}`);
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Conversation deleted successfully",
          duration: 800,
        });
        
        // Refresh conversations list
        queryClient.invalidateQueries({ 
          queryKey: ['/api/conversations'] 
        });
      } else {
        // Safe error handling
        let errorMessage = "Failed to delete conversation";
        try {
          const errorData = await response.text();
          const parsedError = JSON.parse(errorData);
          if (parsedError && parsedError.message) {
            errorMessage = parsedError.message;
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("Error deleting conversation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete conversation",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      {/* Delete Conversation Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entire conversation? This will remove all messages and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <span className="mr-2">Deleting...</span>
                </>
              ) : (
                "Delete Conversation"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    
      <div className="group relative">
        <div 
          className={`flex gap-3 p-3 rounded-lg cursor-pointer ${
            isActive ? "bg-primary text-white" : "hover:bg-neutral-50"
          }`}
          onClick={onClick}
        >
          {conversation.horse?.photos?.length > 0 ? (
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
              <span className={`text-xs ${isActive ? "text-white" : "text-neutral-500"}`}>
                {conversation.last_message_time 
                  ? formatTimeAgo(conversation.last_message_time)
                  : "New"}
              </span>
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
        
        {/* Delete option - only visible on hover */}
        <div 
          className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={handleDeleteClick}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default MessageCard;
