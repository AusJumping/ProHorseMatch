import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Send, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";

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

  // Get user type from the API, for now we'll use a mock value
  const userType = "customer";

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    
    try {
      setIsSending(true);
      
      await apiRequest("POST", "/api/messages", {
        customer_id: conversation.customer_id,
        owner_id: conversation.owner_id,
        horse_id: conversation.horse_id,
        content: messageInput,
        sender_type: userType
      });
      
      setMessageInput("");
      
      // Invalidate the messages query to refetch messages
      queryClient.invalidateQueries({ 
        queryKey: [`/api/messages/${conversation.customer_id}/${conversation.owner_id}/${conversation.horse_id}`] 
      });
      
      // Invalidate conversations to update last message
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    } catch (error) {
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

  return (
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
            <h3 className="font-medium">{conversation.otherParty?.name || "User"}</h3>
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
  );
};

export default ChatInterface;
