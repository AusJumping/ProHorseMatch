import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { MessageSquare, Home, Search, Heart, Plus, User, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Messages() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: isAuthenticated,
  });

  const navigationItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Search, label: "Browse Horses", href: "/browse" },
    { icon: Heart, label: "Favorites", href: "/favorites" },
    { icon: MessageSquare, label: "Messages", href: "/messages", active: true },
    ...(user?.is_selling ? [{ icon: Plus, label: "Add Horse", href: "/add-horse" }] : []),
    ...(user?.is_selling ? [{ icon: Settings, label: "My Horses", href: "/my-horses" }] : []),
  ];

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Please log in to view your messages.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200 p-6">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900">ProHorseMatch</h2>
          <p className="text-sm text-gray-600 mt-1">Welcome back, {user?.name}</p>
        </div>
        
        <nav className="space-y-2">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link key={index} href={item.href}>
                <Button
                  variant={item.active ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 ${
                    item.active ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-xs">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl">
          <div className="mb-8">
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
      </div>
    </div>
  );
}