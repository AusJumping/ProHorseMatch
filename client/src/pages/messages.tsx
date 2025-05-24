import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: number;
  from_user_id: number;
  to_user_id: number;
  horse_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  horse?: {
    id: number;
    name: string;
    photos: string[];
  };
  from_user?: {
    id: number;
    name: string;
    business_name: string;
  };
  to_user?: {
    id: number;
    name: string;
    business_name: string;
  };
}

interface Conversation {
  horse_id: number;
  other_user_id: number;
  horse_name: string;
  other_user_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // Get conversations for current user
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/messages/conversations"],
    enabled: !!user,
  });

  // Get messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedConversation?.horse_id, selectedConversation?.other_user_id],
    enabled: !!selectedConversation,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: {
      to_user_id: number;
      horse_id: number;
      content: string;
    }) => {
      return apiRequest("/api/messages", {
        method: "POST",
        body: JSON.stringify(messageData),
      });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!selectedConversation || !newMessage.trim()) return;

    sendMessageMutation.mutate({
      to_user_id: selectedConversation.other_user_id,
      horse_id: selectedConversation.horse_id,
      content: newMessage.trim(),
    });
  };

  if (!user) {
    return (
      <Layout pageTitle="Messages">
        <div className="flex items-center justify-center h-64">
          <p className="text-neutral-600">Please log in to view messages.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Messages">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {conversationsLoading ? (
                <div className="p-4 text-center text-neutral-600">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-neutral-600">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 text-neutral-400" />
                  <p>No conversations yet</p>
                  <p className="text-sm mt-1">Like a horse to start messaging the owner</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={`${conversation.horse_id}-${conversation.other_user_id}`}
                    className={`p-4 border-b cursor-pointer hover:bg-neutral-50 ${
                      selectedConversation?.horse_id === conversation.horse_id &&
                      selectedConversation?.other_user_id === conversation.other_user_id
                        ? "bg-primary/10"
                        : ""
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {conversation.other_user_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">
                            {conversation.other_user_name}
                          </p>
                          {conversation.unread_count > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-neutral-600 mb-1">
                          Re: {conversation.horse_name}
                        </p>
                        <p className="text-sm text-neutral-600 truncate">
                          {conversation.last_message}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">
                          {formatDistanceToNow(new Date(conversation.last_message_time), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Messages Area */}
        <Card className="lg:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader>
                <CardTitle className="text-lg">
                  Chat with {selectedConversation.other_user_name}
                </CardTitle>
                <p className="text-sm text-neutral-600">
                  About: {selectedConversation.horse_name}
                </p>
              </CardHeader>
              <CardContent className="flex flex-col h-[500px]">
                {/* Messages */}
                <ScrollArea className="flex-1 mb-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-neutral-600">Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-neutral-600">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <div className="space-y-4 p-2">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.from_user_id === user.id ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              message.from_user_id === user.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-neutral-100 text-neutral-900"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.from_user_id === user.id
                                  ? "text-primary-foreground/70"
                                  : "text-neutral-500"
                              }`}
                            >
                              {formatDistanceToNow(new Date(message.created_at), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <Separator className="mb-4" />

                {/* Send Message */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 min-h-[40px] max-h-[120px]"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-[500px]">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
                <p className="text-neutral-600">Select a conversation to view messages</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </Layout>
  );
}