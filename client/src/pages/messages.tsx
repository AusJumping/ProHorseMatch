import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MessageCard from "@/components/MessageCard";
import ChatInterface from "@/components/ChatInterface";
import { Loader2 } from "lucide-react";
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

export default function Messages() {
  const isMobile = useMobile();
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [showChat, setShowChat] = useState(false);

  // Fetch conversations
  const { data: conversations, isLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
  });

  // Fetch messages for active conversation
  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [
      `/api/messages/${activeConversation?.customer_id}/${activeConversation?.owner_id}/${activeConversation?.horse_id}`
    ],
    enabled: !!activeConversation,
    refetchInterval: 3000, // Refetch every 3 seconds to get new messages
  });

  const handleSelectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
    if (isMobile) {
      setShowChat(true);
    }
  };

  const handleBackToList = () => {
    setShowChat(false);
  };

  if (isLoading) {
    return (
      <Layout pageTitle="Messages">
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading conversations...</span>
        </div>
      </Layout>
    );
  }

  // Mobile view
  if (isMobile) {
    return (
      <Layout pageTitle="Messages" showBackButton={showChat} onBackClick={handleBackToList}>
        {!showChat ? (
          <Card className="h-full">
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-130px)]">
                <div className="p-4 space-y-2">
                  {conversations && conversations.length > 0 ? (
                    conversations.map((conversation) => (
                      <MessageCard
                        key={conversation.id}
                        conversation={conversation}
                        onClick={() => handleSelectConversation(conversation)}
                      />
                    ))
                  ) : (
                    <div className="text-center p-6">
                      <p className="text-neutral-600">No messages yet</p>
                      <p className="text-sm text-neutral-400 mt-2">
                        Like a horse and message the owner to get started
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          <ChatInterface
            conversation={activeConversation!}
            messages={messages || []}
            isLoading={messagesLoading}
          />
        )}
      </Layout>
    );
  }

  // Desktop view
  return (
    <Layout pageTitle="Messages">
      <div className="flex h-full gap-4">
        <Card className="w-80 flex-shrink-0 h-full">
          <CardContent className="p-3">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="all">All Messages</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-0">
                <ScrollArea className="h-[calc(100vh-210px)]">
                  <div className="space-y-2">
                    {conversations && conversations.length > 0 ? (
                      conversations.map((conversation) => (
                        <MessageCard
                          key={conversation.id}
                          conversation={conversation}
                          onClick={() => handleSelectConversation(conversation)}
                          isActive={activeConversation?.id === conversation.id}
                        />
                      ))
                    ) : (
                      <div className="text-center p-6">
                        <p className="text-neutral-600">No messages yet</p>
                        <p className="text-sm text-neutral-400 mt-2">
                          Like a horse and message the owner to get started
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="unread" className="mt-0">
                <ScrollArea className="h-[calc(100vh-210px)]">
                  <div className="space-y-2">
                    {conversations && conversations.filter(c => c.unread_count > 0).length > 0 ? (
                      conversations
                        .filter(c => c.unread_count > 0)
                        .map((conversation) => (
                          <MessageCard
                            key={conversation.id}
                            conversation={conversation}
                            onClick={() => handleSelectConversation(conversation)}
                            isActive={activeConversation?.id === conversation.id}
                          />
                        ))
                    ) : (
                      <div className="text-center p-6">
                        <p className="text-neutral-600">No unread messages</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex-1 h-full">
          {activeConversation ? (
            <ChatInterface
              conversation={activeConversation}
              messages={messages || []}
              isLoading={messagesLoading}
            />
          ) : (
            <div className="flex justify-center items-center h-full bg-white rounded-xl">
              <div className="text-center">
                <p className="text-neutral-600">Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
