import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageCircle, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface Conversation {
  id: number;
  customer_id: number;
  owner_id: number;
  horse_id: number;
  last_message_time: string;
  is_read_by_customer: boolean;
  is_read_by_owner: boolean;
  created_at: string;
}

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_type: "customer" | "owner";
  content: string;
  is_read: boolean;
  created_at: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  is_searching: boolean;
  is_selling: boolean;
}

interface Horse {
  id: number;
  name: string;
  owner_id: number;
}

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const queryClient = useQueryClient();

  // Get current user
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  // Get conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  // Get messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/conversations", selectedConversation, "messages"],
    enabled: !!selectedConversation,
  });

  // Get horse details for conversations
  const { data: horses = [] } = useQuery<Horse[]>({
    queryKey: ["/api/horses"],
  });

  // Get all users for conversation display
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { conversation_id: number; content: string }) => {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      conversation_id: selectedConversation,
      content: newMessage.trim(),
    });
  };

  const getOtherUser = (conversation: Conversation) => {
    const otherUserId = conversation.customer_id === currentUser?.id 
      ? conversation.owner_id 
      : conversation.customer_id;
    return users.find(user => user.id === otherUserId);
  };

  const getHorse = (horseId: number) => {
    return horses.find(horse => horse.id === horseId);
  };

  const isUnread = (conversation: Conversation) => {
    if (!currentUser) return false;
    return conversation.customer_id === currentUser.id 
      ? !conversation.is_read_by_customer
      : !conversation.is_read_by_owner;
  };

  if (conversationsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <MessageCircle className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-20rem)]">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No conversations yet</p>
                    <p className="text-sm mt-1">Start a conversation by contacting a horse owner</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conversation) => {
                      const otherUser = getOtherUser(conversation);
                      const horse = getHorse(conversation.horse_id);
                      const unread = isUnread(conversation);

                      return (
                        <div
                          key={conversation.id}
                          onClick={() => setSelectedConversation(conversation.id)}
                          className={`p-4 cursor-pointer border-b hover:bg-gray-50 transition-colors ${
                            selectedConversation === conversation.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {otherUser?.name?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`font-medium ${unread ? "font-bold" : ""}`}>
                                  {otherUser?.name || "Unknown User"}
                                </p>
                                {unread && (
                                  <Badge variant="default" className="bg-blue-600 text-xs">
                                    New
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 truncate">
                                About: {horse?.name || "Unknown Horse"}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages View */}
          <Card className="lg:col-span-2">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedConversation(null)}
                      className="lg:hidden"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                      {(() => {
                        const conversation = conversations.find(c => c.id === selectedConversation);
                        const otherUser = conversation ? getOtherUser(conversation) : null;
                        const horse = conversation ? getHorse(conversation.horse_id) : null;
                        return (
                          <div>
                            <CardTitle className="text-lg">{otherUser?.name || "Unknown User"}</CardTitle>
                            <p className="text-sm text-gray-600">Discussing: {horse?.name || "Unknown Horse"}</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-[calc(100vh-24rem)]">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {messagesLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                            <div className="h-12 bg-gray-200 rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => {
                          const isCurrentUser = message.sender_id === currentUser?.id;
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  isCurrentUser
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 text-gray-900"
                                }`}
                              >
                                <p>{message.content}</p>
                                <p
                                  className={`text-xs mt-1 ${
                                    isCurrentUser ? "text-blue-100" : "text-gray-500"
                                  }`}
                                >
                                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1"
                        disabled={sendMessageMutation.isPending}
                      />
                      <Button
                        type="submit"
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                  <p>Choose a conversation from the list to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}