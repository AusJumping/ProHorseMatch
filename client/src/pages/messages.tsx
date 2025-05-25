import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { MessageSquare } from "lucide-react";
import Layout from "@/components/Layout";

export default function Messages() {
  const { user, isAuthenticated } = useAuth();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <Layout pageTitle="Messages">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Please log in to view your messages.</p>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout pageTitle="Messages">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading messages...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Messages">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="mt-2 text-gray-600">Manage your conversations about horses</p>
        </div>

        {conversations && conversations.length > 0 ? (
          <div className="grid gap-4">
            {conversations.map((conversation: any) => (
              <Card key={conversation.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5" />
                    {conversation.horse?.name || "Unknown Horse"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {conversation.horse?.photos && conversation.horse.photos.length > 0 && (
                      <img
                        src={conversation.horse.photos[0]}
                        alt={conversation.horse.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Conversation with {conversation.customer?.name || conversation.owner?.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last message: {new Date(conversation.last_message_time).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">No messages yet</h3>
              <p className="text-muted-foreground">
                When you send messages about horses, they'll appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}