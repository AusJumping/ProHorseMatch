import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Send, Loader2, Trash2, MoreVertical } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
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
    price_min: number;
    price_max: number;
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

interface Message {
  id: number;
  customer_id: number;
  owner_id: number;
  horse_id: number;
  content: string;
  sender_type: string;
  created_at: string;
  is_read: boolean;
}

interface User {
  id: number;
  name?: string | null;
  business_name?: string | null;
  is_searching: boolean;
  is_selling: boolean;
}

interface ChatInterfaceProps {
  conversation: Conversation;
  messages: Message[];
  isLoading: boolean;
}

const ChatInterface = ({ conversation, messages, isLoading }: ChatInterfaceProps) => {
  const isMobile = useMobile();
  const { toast } = useToast();
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Get current user info
  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  // Determine user type based on user roles and conversation context
  const userType = user?.id === conversation.owner_id && user?.is_selling 
    ? "owner" 
    : "customer";

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    
    try {
      setIsSending(true);
      
      const result = await apiRequest("POST", "/api/messages", {
        customer_id: conversation.customer_id,
        owner_id: conversation.owner_id,
        horse_id: conversation.horse_id,
        content: messageInput,
        sender_type: userType
      });
      
      setMessageInput("");
      
      // Immediately invalidate queries to refetch latest data
      await Promise.all([
        // Refresh messages for this conversation
        queryClient.invalidateQueries({ 
          queryKey: [`/api/messages/${conversation.customer_id}/${conversation.owner_id}/${conversation.horse_id}`] 
        }),
        // Refresh the conversations list with updated last message info
        queryClient.invalidateQueries({ 
          queryKey: ['/api/conversations'] 
        }),
        // Refresh unread message count
        queryClient.invalidateQueries({ 
          queryKey: ['/api/messages/unread'] 
        })
      ]);
      
      console.log("Message sent and queries refreshed:", result);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If the message was sent today, show only the time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise, show a relative time
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  const handleDeleteMessage = async (message: Message) => {
    setMessageToDelete(message);
    setShowDeleteDialog(true);
  };
  
  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    
    try {
      setIsDeleting(true);
      
      const response = await apiRequest("DELETE", `/api/messages/${messageToDelete.id}`);
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Message deleted successfully",
        });
        
        // Immediately invalidate queries to refetch latest data
        await Promise.all([
          // Refresh messages for this conversation
          queryClient.invalidateQueries({ 
            queryKey: [`/api/messages/${conversation.customer_id}/${conversation.owner_id}/${conversation.horse_id}`] 
          }),
          // Refresh the conversations list with updated last message info
          queryClient.invalidateQueries({ 
            queryKey: ['/api/conversations'] 
          })
        ]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete message");
      }
    } catch (error: any) {
      console.error("Error deleting message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete message",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setMessageToDelete(null);
    }
  };

  return (
    <>
      {/* Delete Message Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMessage}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Card className="h-full flex flex-col">
        <CardHeader className="border-b p-4">
          <div className="flex items-center">
            {conversation.horse?.photos?.length > 0 ? (
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage src={conversation.horse.photos[0]} alt={conversation.horse.name} />
                <AvatarFallback>{conversation.horse.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="h-10 w-10 mr-3">
                <AvatarFallback>{conversation.horse?.name?.charAt(0) || "H"}</AvatarFallback>
              </Avatar>
            )}
            
            <div>
              <h3 className="font-accent font-medium">{conversation.otherParty?.name || "User"}</h3>
              <p className="text-sm text-neutral-500">
                {conversation.horse?.name && `About ${conversation.horse.name}`}
              </p>
            </div>
          </div>
        </CardHeader>
      
        <CardContent className="flex-1 overflow-auto p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full text-center p-6">
              <div>
                <p className="text-neutral-600">No messages yet</p>
                <p className="text-sm text-neutral-400 mt-2">
                  Start the conversation by sending a message
                </p>
              </div>
            </div>
          ) : (
            <div className={`p-4 space-y-4 ${isMobile ? 'h-[calc(100vh-300px)]' : 'h-[calc(100vh-290px)]'} overflow-y-auto`}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_type === userType ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="flex items-start group">
                    {/* Show options menu only for messages sent by current user */}
                    {message.sender_type === userType && (
                      <div className="relative mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => handleDeleteMessage(message)}>
                              <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                              <span className="text-destructive">Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[75%] rounded-lg px-4 py-2 ${
                        message.sender_type === userType
                          ? "bg-primary text-white"
                          : "bg-neutral-100"
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_type === userType
                          ? "text-primary-foreground/75"
                          : "text-neutral-500"
                      }`}>
                        {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              className="flex-1"
              placeholder="Type your message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isSending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSending || !messageInput.trim()}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
};

export default ChatInterface;