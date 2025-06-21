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
import { Send, ArrowLeft, User, MessageCircle, Trash2 } from "lucide-react";
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

  // Mark conversation as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (conversationId: number) => 
      apiRequest('PATCH', `/api/conversations/${conversationId}/read`),
    onSuccess: () => {
      // Refresh conversations to update unread counts
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: (conversationId: number) => 
      apiRequest('DELETE', `/api/conversations/${conversationId}`),
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      // If we deleted the selected conversation, clear selection
      if (selectedConversation && selectedConversation.id === conversationId) {
        setSelectedConversation(null);
      }
      toast({
        title: "Conversation deleted",
        description: "The conversation has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Fetch conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/conversations'],
    enabled: isAuthenticated,
    refetchInterval: 5000, // Refresh every 5 seconds for new messages
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/conversations', selectedConversation?.customer_id, selectedConversation?.owner_id, selectedConversation?.horse_id, 'messages'],
    queryFn: () => {
      if (!selectedConversation) return Promise.resolve([]);
      return fetch(`/api/conversations/${selectedConversation.customer_id}/${selectedConversation.owner_id}/${selectedConversation.horse_id}/messages`)
        .then(res => res.json());
    },
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
      const result = await apiRequest("POST", "/api/messages", messageData);
      console.log("API request completed:", result);
      return result;
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
    },
    onMutate: () => {
      console.log("onMutate called - mutation starting");
    },
    onSettled: (data, error) => {
      console.log("onSettled called", { data, error });
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
    
    try {
      // Send message using the direct approach that works
      const messageData = {
        customer_id: selectedConversation.customer_id,
        owner_id: selectedConversation.owner_id,
        horse_id: selectedConversation.horse_id,
        content: messageText.trim()
      };
      
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }
      
      // Success!
      setMessageText("");
      setIsSending(false);
      
      // Refresh messages and conversations
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations', selectedConversation.customer_id, selectedConversation.owner_id, selectedConversation.horse_id, 'messages'] 
      });
      
      toast({
        title: "Message sent!",
        description: "Your message has been delivered successfully.",
      });
      
    } catch (error: any) {
      setIsSending(false);
      toast({
        title: "Failed to send message",
        description: error?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getOtherPersonName = (conversation: ConversationWithDetails) => {
    if (!conversation.otherUser) return "";
    return conversation.otherUser.name || 
           conversation.otherUser.business_name || 
           conversation.otherUser.contact_name || 
           "";
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
      <div className="flex h-[calc(100vh-180px)] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Conversations Sidebar - Enhanced Design */}
        <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-96 flex-col border-r border-gray-100 bg-gray-50`}>
          <div className="p-6 border-b border-gray-200 bg-white">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3 font-sans">
              <MessageCircle className="h-5 w-5 text-accent" />
              Conversations
            </h2>
          </div>
          
          <ScrollArea className="flex-1">
            {conversationsLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center space-x-4 p-3 animate-pulse">
                    <div className="w-14 h-14 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded-lg w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded-lg w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !conversations || conversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-accent/10 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="h-10 w-10 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No conversations yet</h3>
                <p className="text-gray-600 text-sm max-w-xs mx-auto leading-relaxed">
                  Start browsing horses to begin conversations with sellers and find your perfect match.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {conversations && conversations
                  .sort((a, b) => new Date(b.last_message_time || 0).getTime() - new Date(a.last_message_time || 0).getTime())
                  .map((conversation: ConversationWithDetails) => (
                  <div
                    key={`${conversation.customer_id}-${conversation.owner_id}-${conversation.horse_id}`}
                    onClick={() => {
                      setSelectedConversation(conversation);
                      // Mark conversation as read when opened if it has unread messages
                      if (conversation.unread_count && conversation.unread_count > 0) {
                        markAsReadMutation.mutate(conversation.id);
                      }
                    }}
                    className={`p-4 hover:bg-white cursor-pointer transition-all duration-200 group ${
                      selectedConversation?.id === conversation.id ? 'bg-accent/10 border-r-4 border-accent' : 'hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Avatar className="h-14 w-14 ring-2 ring-white shadow-md">
                          {conversation.horse?.photos && conversation.horse.photos.length > 0 ? (
                            <img 
                              src={conversation.horse.photos[0]} 
                              alt={conversation.horse.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-accent to-accent/80 text-white text-lg font-semibold">
                              {conversation.horse?.name ? conversation.horse.name.charAt(0).toUpperCase() : 'H'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        {conversation.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                            {conversation.unread_count}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-base font-semibold text-gray-900 truncate group-hover:text-accent transition-colors">
                            {conversation.horse?.name || 'Horse'}
                          </p>
                          <div className="flex items-center space-x-2">
                            {conversation.last_message_time && (
                              <p className="text-xs text-gray-500 font-medium">
                                {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}
                              </p>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversationMutation.mutate(conversation.id);
                              }}
                              disabled={deleteConversationMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {getOtherPersonName(conversation)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area - Enhanced Design */}
        <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gradient-to-b from-gray-50 to-white`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-200 bg-white shadow-sm">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden p-2 hover:bg-gray-100 rounded-full"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12 ring-2 ring-accent/20">
                      {selectedConversation.horse?.photos && selectedConversation.horse.photos.length > 0 ? (
                        <img 
                          src={selectedConversation.horse.photos[0]} 
                          alt={selectedConversation.horse.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-accent to-accent/80 text-white text-lg font-semibold">
                          {selectedConversation.horse?.name ? selectedConversation.horse.name.charAt(0).toUpperCase() : 'H'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">
                        {selectedConversation.horse?.name || 'Horse'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-6">
                {messagesLoading ? (
                  <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-sm p-4 rounded-3xl animate-pulse shadow-sm ${
                          i % 2 === 0 ? 'bg-accent/10' : 'bg-white border border-gray-200'
                        }`}>
                          <div className="h-4 bg-gray-300 rounded-lg w-32 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded-lg w-16"></div>
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
                          className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} group`}
                        >
                          <div
                            className={`max-w-sm lg:max-w-md px-5 py-3 rounded-3xl shadow-sm transition-all duration-200 ${
                              isMyMessage
                                ? 'bg-gradient-to-r from-accent to-accent/80 text-white'
                                : 'bg-white text-gray-900 border border-gray-200 hover:shadow-md'
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            <p className={`text-xs mt-2 ${
                              isMyMessage ? 'text-white/80' : 'text-gray-500'
                            }`}>
                              {message.created_at ? formatDistanceToNow(new Date(message.created_at), { addSuffix: true }) : 'just now'}
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
              <div className="p-6 border-t border-gray-200 bg-white">
                <div className="flex items-end space-x-4">
                  <div className="flex-1 relative">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="w-full py-3 px-4 pr-12 rounded-3xl border-2 border-gray-200 focus:border-accent focus:ring-accent focus:ring-2 bg-gray-50 focus:bg-white transition-all duration-200"
                      disabled={isSending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || isSending}
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/80 hover:to-accent text-white shadow-lg transition-all duration-200 flex items-center justify-center"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {isSending && (
                  <div className="flex items-center justify-center mt-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="ml-3 text-sm text-gray-500">Sending...</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2 font-sans">Select a conversation</h3>
                <p className="text-xs text-gray-600 font-sans">Choose a conversation from the sidebar to start messaging.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}