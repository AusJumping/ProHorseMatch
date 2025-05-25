import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Send, ArrowLeft, User, MessageCircle } from "lucide-react";
import { Message, Conversation, Horse } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface ConversationWithDetails extends Conversation {
  horse?: Horse;
  otherUser?: {
    id: number;
    name: string | null;
    business_name: string | null;
    contact_name: string | null;
    is_selling: boolean;
  };
}

export default function Messages() {
  const { user, isAuthenticated } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/conversations'],
    enabled: isAuthenticated,
    refetchInterval: 5000, // Refresh every 5 seconds for new messages
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/conversations', selectedConversation?.customer_id, selectedConversation?.owner_id, selectedConversation?.horse_id, 'messages'],
    enabled: !!selectedConversation,
    refetchInterval: 2000, // Refresh every 2 seconds for real-time feel
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: {
      customer_id: number;
      owner_id: number; 
      horse_id: number;
      content: string;
    }) => {
      console.log("Sending message:", messageData);
      try {
        const result = await apiRequest("POST", "/api/messages", messageData);
        console.log("API request completed:", result);
        return result;
      } catch (error) {
        console.error("API request failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("onSuccess called with:", data);
      setMessageText("");
      setIsSending(false);
      // Refresh messages and conversations
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      if (selectedConversation) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/conversations', selectedConversation.customer_id, selectedConversation.owner_id, selectedConversation.horse_id, 'messages'] 
        });
      }
      toast({
        title: "Message sent!",
        description: "Your message has been delivered successfully.",
      });
    },
    onError: (error: any) => {
      console.error("onError called with:", error);
      setIsSending(false);
      toast({
        title: "Failed to send message",
        description: error?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || isSending) return;

    setIsSending(true);
    
    sendMessageMutation.mutate({
      customer_id: selectedConversation.customer_id,
      owner_id: selectedConversation.owner_id,
      horse_id: selectedConversation.horse_id,
      content: messageText.trim()
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getOtherUserName = (conversation: ConversationWithDetails) => {
    if (!conversation.otherUser) return "Unknown User";
    return conversation.otherUser.name || 
           conversation.otherUser.business_name || 
           conversation.otherUser.contact_name || 
           "User";
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!isAuthenticated) {
    return (
      <Layout pageTitle="Messages">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view messages</h2>
            <p className="text-gray-600">You need to be logged in to access your messages.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Messages">
      <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow-sm border">
        {/* Conversations Sidebar - Facebook style */}
        <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-gray-200`}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Messages</h2>
          </div>
          
          <ScrollArea className="flex-1">
            {conversationsLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center space-x-3 animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !conversations || conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-gray-600 text-sm">Start browsing horses to begin conversations with sellers.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {conversations && conversations.map((conversation: ConversationWithDetails) => (
                  <div
                    key={`${conversation.customer_id}-${conversation.owner_id}-${conversation.horse_id}`}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-white text-sm">
                          {getInitials(getOtherUserName(conversation))}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {getOtherUserName(conversation)}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          About: {conversation.horse?.name || 'Horse'}
                        </p>
                        {conversation.last_message_time && (
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                      {conversation.unread_count && conversation.unread_count > 0 && (
                        <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area - Facebook Messenger style */}
        <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden p-1"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-white text-xs">
                      {getInitials(getOtherUserName(selectedConversation))}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">
                      {getOtherUserName(selectedConversation)}
                    </p>
                    <p className="text-xs text-gray-600">
                      Discussing: {selectedConversation.horse?.name || 'Horse'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs p-3 rounded-lg animate-pulse ${
                          i % 2 === 0 ? 'bg-gray-200' : 'bg-gray-100'
                        }`}>
                          <div className="h-4 bg-gray-300 rounded w-24"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages && messages.map((message: Message) => {
                      const isMyMessage = message.sender_type === (user?.is_selling ? 'owner' : 'customer');
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              isMyMessage
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isMyMessage ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatDistanceToNow(new Date(message.created_at!), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex space-x-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isSending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || isSending}
                    size="sm"
                    className="rounded-full bg-blue-500 hover:bg-blue-600 text-white px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-600">Choose a conversation from the sidebar to start messaging.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}