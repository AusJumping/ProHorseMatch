import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  Users, 
  Activity, 
  CheckCircle, 
  XCircle,
  Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserSubscription {
  userId: number;
  email: string;
  username: string;
  subscriptionCount: number;
  hasNotifications: boolean;
  preferences: {
    notify_matches: boolean;
    notify_messages: boolean;
    notify_updates: boolean;
    notify_digest: boolean;
  } | null;
}

export function PushNotificationTestPanel() {
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ 
    users: UserSubscription[];
    totalUsers: number;
    usersWithNotifications: number;
  }>({
    queryKey: ['/api/admin/push-subscriptions']
  });

  const testNotificationMutation = useMutation({
    mutationFn: async ({ userId, title, body }: { userId: number; title?: string; body?: string }) => {
      await apiRequest('POST', '/api/admin/test-notification', { userId, title, body });
    },
    onSuccess: () => {
      toast({
        title: "Test notification sent!",
        description: "Check your device for the notification",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send notification",
        description: error.message || "User may not have notifications enabled",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading notification status...</div>;
  }

  const usersWithNotifs = data?.users.filter(u => u.hasNotifications) || [];
  const usersWithoutNotifs = data?.users.filter(u => !u.hasNotifications) || [];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Bell className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{data?.usersWithNotifications || 0}</div>
              <p className="text-sm text-gray-600">Users with notifications</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <div className="text-2xl font-bold">{data?.totalUsers || 0}</div>
              <p className="text-sm text-gray-600">Total users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">
                {data?.totalUsers ? Math.round((data.usersWithNotifications / data.totalUsers) * 100) : 0}%
              </div>
              <p className="text-sm text-gray-600">Adoption rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users with Notifications Enabled */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Users with Notifications ({usersWithNotifs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usersWithNotifs.length > 0 ? (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {usersWithNotifs.map((user) => (
                  <div key={user.userId} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex-1">
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                      <div className="flex gap-2 mt-2">
                        {user.preferences?.notify_matches && <Badge variant="outline" className="text-xs">Matches</Badge>}
                        {user.preferences?.notify_messages && <Badge variant="outline" className="text-xs">Messages</Badge>}
                        {user.preferences?.notify_updates && <Badge variant="outline" className="text-xs">Updates</Badge>}
                        {user.preferences?.notify_digest && <Badge variant="outline" className="text-xs">Digest</Badge>}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => testNotificationMutation.mutate({ userId: user.userId })}
                      disabled={testNotificationMutation.isPending}
                      className="ml-4"
                      data-testid={`button-test-notification-${user.userId}`}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Test
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-center text-gray-500 py-8">No users have enabled notifications yet</p>
          )}
        </CardContent>
      </Card>

      {/* Users without Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-gray-400" />
            Users without Notifications ({usersWithoutNotifs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usersWithoutNotifs.length > 0 ? (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {usersWithoutNotifs.map((user) => (
                  <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{user.username}</div>
                      <div className="text-xs text-gray-600">{user.email}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">No subscription</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-center text-gray-500 py-4">All users have notifications enabled!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
