import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, User, Home } from 'lucide-react';
import { ConversationView } from './ConversationView';

interface Conversation {
  id: number;
  customer_id: number;
  owner_id: number;
  horse_id: number;
  is_read_by_customer: boolean;
  is_read_by_owner: boolean;
  last_message_time: string | null;
  created_at: string;
  horse: {
    id: number;
    name: string;
    photos: string[] | null;
  };
  customer: {
    id: number;
    name: string | null;
    business_name: string | null;
  };
  owner: {
    id: number;
    name: string | null;
    business_name: string | null;
  };
}

export function MessageCenter() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
  });

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['/api/messages/unread'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading conversations...</div>
      </div>
    );
  }

  if (selectedConversationId) {
    return (
      <ConversationView
        conversationId={selectedConversationId}
        onBack={() => setSelectedConversationId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Messages</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </div>
      </div>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
            <p className="text-muted-foreground">
              Start browsing horses to connect with sellers and begin conversations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation) => {
            const otherParty = conversation.customer?.name || conversation.owner?.name || 
                              conversation.customer?.business_name || conversation.owner?.business_name || 
                              'Unknown User';
            const isUnread = !conversation.is_read_by_customer || !conversation.is_read_by_owner;
            
            return (
              <Card 
                key={conversation.id} 
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${isUnread ? 'border-primary' : ''}`}
                onClick={() => setSelectedConversationId(conversation.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {conversation.horse?.photos?.[0] ? (
                      <img
                        src={conversation.horse.photos[0]}
                        alt={conversation.horse.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                        <Home className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">
                          {conversation.horse?.name || 'Unknown Horse'}
                        </h3>
                        {isUnread && (
                          <Badge variant="secondary" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <User className="h-4 w-4" />
                        <span className="truncate">{otherParty}</span>
                      </div>
                      
                      {conversation.last_message_time && (
                        <p className="text-xs text-muted-foreground">
                          Last message: {new Date(conversation.last_message_time).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}