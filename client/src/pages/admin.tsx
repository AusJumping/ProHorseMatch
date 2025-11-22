import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Heart, 
  MessageCircle, 
  TrendingUp,
  DollarSign,
  Activity,
  Calendar,
  Globe,
  User,
  Mail,
  Phone,
  Building,
  CheckCircle,
  XCircle,
  BarChart3,
  Trash2,
  Edit,
  Download,
  Eye,
  Bookmark,
  Bell,
  Send
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { apiRequest } from '@/lib/queryClient';
import Sidebar from '@/components/Sidebar';
import MobileNavbar from '@/components/MobileNavbar';
import { PushNotificationTestPanel } from '@/components/PushNotificationTestPanel';

interface AnalyticsData {
  users: {
    total: number;
    activeSubscribers: number;
    sellers: number;
    searchers: number;
    recentRegistrations: number;
  };
  horses: {
    total: number;
    recentListings: number;
    byDiscipline: Record<string, number>;
    byCountry: Record<string, number>;
  };
  engagement: {
    totalMessages: number;
    totalConversations: number;
    totalMatches: number;
    totalLikes: number;
    totalSavedSearches: number;
  };
  growth: {
    usersLast30Days: number;
    horsesLast30Days: number;
  };
}

interface User {
  id: number;
  email: string;
  username: string;
  name: string;
  business_name: string;
  is_selling: boolean;
  is_searching: boolean;
  subscription_status: string;
  subscription_plan: string;
  created_at: string;
  email_verified: boolean;
}

interface Horse {
  id: number;
  owner_id: number;
  name: string;
  disciplines: string[];
  levels: string[];
  breeds: string[];
  age: number;
  height_hands: number | null;
  sex: string;
  sire: string;
  dam: string;
  dam_sire: string;
  price_min: number;
  price_max: number;
  currency: string;
  location_country: string;
  description: string;
  photos: string[];
  videos: string[];
  created_at: string;
  owner?: User;
}

interface RevenueData {
  monthlyRevenue: number;
  subscriberCount: number;
  planBreakdown: Record<string, number>;
  averageRevenuePerUser: number;
}

interface HorseDeletionResponse {
  id: number;
  horse_id: number;
  user_id: number;
  horse_name: string;
  sold_through_app: boolean;
  sold_elsewhere: boolean;
  unsold: boolean;
  created_at: string;
}

interface HorseDeletionAnalytics {
  totalDeletions: number;
  soldThroughApp: number;
  soldElsewhere: number;
  unsold: number;
  responsesByMonth: Record<string, {
    total: number;
    soldThroughApp: number;
    soldElsewhere: number;
    unsold: number;
  }>;
  responsesByUser: Record<string, {
    total: number;
    soldThroughApp: number;
    soldElsewhere: number;
    unsold: number;
  }>;
}

function SubscriptionReminderPanel() {
  const { toast } = useToast();
  const [previewSent, setPreviewSent] = useState(false);
  const [batchSent, setBatchSent] = useState(false);
  
  const { data: countData, isLoading: countLoading } = useQuery({
    queryKey: ['/api/admin/subscription-reminder-count'],
  });
  
  const recipientCount = countData?.count || 0;
  
  const previewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/preview-subscription-reminder');
      return response;
    },
    onSuccess: () => {
      setPreviewSent(true);
      toast({
        title: "Preview Email Sent",
        description: "Check info@australianjumping.com.au for the preview email.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Preview",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });
  
  const batchMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/send-subscription-reminders');
      return response;
    },
    onSuccess: (data: any) => {
      setBatchSent(true);
      toast({
        title: "Subscription Reminder Emails Sent",
        description: `Successfully sent ${data.sent} of ${data.total} emails to users without subscriptions.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Emails",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Subscription Reminder
        </CardTitle>
        <CardDescription>
          Remind users without subscriptions to select their free plan and start browsing horses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Section */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">📧 Email Details</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• <strong>Subject:</strong> Complete Your ProHorseMatch Setup - Free Beta Access</li>
            <li>• <strong>Recipients:</strong> {countLoading ? 'Loading...' : `${recipientCount} verified users without subscriptions`}</li>
            <li>• <strong>Content:</strong> Free beta access reminder, no payment required, browse lovely horses</li>
            <li>• <strong>Link:</strong> Direct link to subscription selection page with auto-login</li>
            <li>• <strong>Send Time:</strong> ~{Math.ceil(recipientCount * 0.55)} seconds (rate limited for deliverability)</li>
          </ul>
        </div>
        
        {/* Preview Section */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Step 1: Preview Email</h3>
            <p className="text-sm text-gray-600 mb-3">
              Send a test email to <strong>info@australianjumping.com.au</strong> to review before sending to all users.
            </p>
            <Button
              onClick={() => previewMutation.mutate()}
              disabled={previewMutation.isPending || previewSent}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-send-subscription-preview"
            >
              {previewMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending Preview...
                </>
              ) : previewSent ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Preview Sent
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Preview to Admin
                </>
              )}
            </Button>
            {previewSent && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Preview email sent! Check your inbox at info@australianjumping.com.au
              </p>
            )}
          </div>
        </div>
        
        <Separator />
        
        {/* Batch Send Section */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Step 2: Send to All Users</h3>
            <p className="text-sm text-gray-600 mb-3">
              After reviewing the preview, send the reminder to all {recipientCount} users without subscriptions.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Important:</strong> This will send {recipientCount} emails. Make sure you've reviewed the preview first!
              </p>
            </div>
            <Button
              onClick={() => {
                if (confirm(`Are you sure you want to send subscription reminders to ${recipientCount} users without subscriptions?`)) {
                  batchMutation.mutate();
                }
              }}
              disabled={batchMutation.isPending || batchSent || !previewSent || recipientCount === 0}
              variant={batchSent ? "outline" : "default"}
              className={batchSent ? "" : "bg-green-600 hover:bg-green-700"}
              data-testid="button-send-subscription-batch"
            >
              {batchMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending to {recipientCount} users...
                </>
              ) : batchSent ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Emails Sent Successfully
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to All {recipientCount} Users
                </>
              )}
            </Button>
            {batchSent && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Subscription reminder emails sent successfully to all users without subscriptions!
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmailAnnouncementPanel() {
  const { toast } = useToast();
  const [previewSent, setPreviewSent] = useState(false);
  const [batchSent, setBatchSent] = useState(false);
  
  const previewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/preview-push-notification-announcement');
      return response;
    },
    onSuccess: () => {
      setPreviewSent(true);
      toast({
        title: "Preview Email Sent",
        description: "Check info@australianjumping.com.au for the preview email.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Preview",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });
  
  const batchMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/send-push-notification-announcement');
      return response;
    },
    onSuccess: (data: any) => {
      setBatchSent(true);
      toast({
        title: "Announcement Emails Sent",
        description: `Successfully sent ${data.sent} of ${data.total} emails to verified users.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Emails",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Push Notification Feature Announcement
        </CardTitle>
        <CardDescription>
          Send announcement email to all verified users about the new push notifications feature
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📧 Email Details</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Subject:</strong> Never Miss a Match! Push Notifications Now Available</li>
            <li>• <strong>Recipients:</strong> All verified users (92 users)</li>
            <li>• <strong>Content:</strong> Feature announcement with installation instructions</li>
            <li>• <strong>Send Time:</strong> ~45-50 seconds (rate limited for deliverability)</li>
          </ul>
        </div>
        
        {/* Preview Section */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Step 1: Preview Email</h3>
            <p className="text-sm text-gray-600 mb-3">
              Send a test email to <strong>info@australianjumping.com.au</strong> to review before sending to all users.
            </p>
            <Button
              onClick={() => previewMutation.mutate()}
              disabled={previewMutation.isPending || previewSent}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-send-preview-email"
            >
              {previewMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending Preview...
                </>
              ) : previewSent ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Preview Sent
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Preview to Admin
                </>
              )}
            </Button>
            {previewSent && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Preview email sent! Check your inbox at info@australianjumping.com.au
              </p>
            )}
          </div>
        </div>
        
        <Separator />
        
        {/* Batch Send Section */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Step 2: Send to All Users</h3>
            <p className="text-sm text-gray-600 mb-3">
              After reviewing the preview, send the announcement to all 92 verified users.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Important:</strong> This will send 92 emails. Make sure you've reviewed the preview first!
              </p>
            </div>
            <Button
              onClick={() => {
                if (confirm('Are you sure you want to send the push notification announcement to all 92 verified users?')) {
                  batchMutation.mutate();
                }
              }}
              disabled={batchMutation.isPending || batchSent || !previewSent}
              variant={batchSent ? "outline" : "default"}
              className={batchSent ? "" : "bg-green-600 hover:bg-green-700"}
              data-testid="button-send-batch-emails"
            >
              {batchMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending to {92} users...
                </>
              ) : batchSent ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Emails Sent Successfully
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to All {92} Users
                </>
              )}
            </Button>
            {batchSent && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Announcement emails sent successfully to all verified users!
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoginAnalyticsPanel() {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['/api/admin/login-analytics'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Login Analytics
          </CardTitle>
          <CardDescription>
            Track user engagement with daily, weekly, and monthly active users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { dailyActiveUsers, weeklyActiveUsers, monthlyActiveUsers, loginTrend } = analyticsData || {};

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Login Analytics
          </CardTitle>
          <CardDescription>
            Track user engagement with daily, weekly, and monthly active users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Daily Active Users */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600" data-testid="text-dau">
                  {dailyActiveUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Users who logged in today
                </p>
              </CardContent>
            </Card>

            {/* Weekly Active Users */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weekly Active Users</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600" data-testid="text-wau">
                  {weeklyActiveUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Users who logged in this week
                </p>
              </CardContent>
            </Card>

            {/* Monthly Active Users */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Active Users</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600" data-testid="text-mau">
                  {monthlyActiveUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Users who logged in this month
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Login Trend Chart */}
      {loginTrend && loginTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">30-Day Login Trend</CardTitle>
            <CardDescription>
              Daily unique logins over the past 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 w-full">
              <div className="space-y-2">
                {loginTrend.map((item: { date: string; count: number }) => (
                  <div key={item.date} className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground w-24">
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-amber-600 h-full rounded-full flex items-center justify-end pr-2"
                        style={{ 
                          width: `${Math.max(5, (item.count / Math.max(...loginTrend.map((t: { count: number }) => t.count))) * 100)}%` 
                        }}
                      >
                        <span className="text-xs font-medium text-white">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [editingEmail, setEditingEmail] = useState<{userId: number, currentEmail: string, newEmail: string} | null>(null);
  const queryClient = useQueryClient();

  // Excel export function
  const exportUsersToExcel = () => {
    if (!users || users.length === 0) {
      toast({
        title: "No Data",
        description: "No user data available to export",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    // Import xlsx dynamically to avoid bundling issues
    import('xlsx').then((XLSX) => {
      // Prepare data for Excel export
      const exportData = users.map(user => ({
        'User ID': user.id,
        'Email': user.email,
        'Username': user.username || '',
        'Name': user.name || '',
        'Business Name': user.business_name || '',
        'Account Type': `${user.is_selling && user.subscription_status === 'active' ? 'Seller' : ''}${user.is_selling && user.is_searching && user.subscription_status === 'active' ? ' & ' : ''}${user.is_searching && user.subscription_status === 'active' ? 'Searcher' : ''}`,
        'Subscription Status': user.subscription_status || 'None',
        'Subscription Plan': user.subscription_plan || 'None',
        'Email Verified': user.email_verified ? 'Yes' : 'No',
        'Registration Date': user.created_at ? new Date(user.created_at).toLocaleDateString() : ''
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Add some styling - auto-size columns
      const columnWidths = [
        { wch: 10 }, // User ID
        { wch: 30 }, // Email
        { wch: 20 }, // Username
        { wch: 20 }, // Name
        { wch: 25 }, // Business Name
        { wch: 20 }, // Account Type
        { wch: 18 }, // Subscription Status
        { wch: 18 }, // Subscription Plan
        { wch: 15 }, // Email Verified
        { wch: 15 }  // Registration Date
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

      // Generate filename with current date
      const today = new Date();
      const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      const filename = `ProHorseMatch_Users_${dateString}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Export Successful",
        description: `User data exported to ${filename}`,
        duration: 5000,
      });
    }).catch((error) => {
      console.error('Excel export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export user data to Excel",
        variant: "destructive",
        duration: 5000,
      });
    });
  };

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/admin/analytics'],
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Admin access required. Redirecting...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
    }
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Admin access required.",
          variant: "destructive",
        });
      }
    }
  });

  const { data: horses, isLoading: horsesLoading } = useQuery<Horse[]>({
    queryKey: ['/api/admin/horses'],
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Admin access required.",
          variant: "destructive",
        });
      }
    }
  });

  const { data: revenue, isLoading: revenueLoading } = useQuery<RevenueData>({
    queryKey: ['/api/admin/revenue'],
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Admin access required.",
          variant: "destructive",
        });
      }
    }
  });

  const { data: deletionAnalytics, isLoading: deletionAnalyticsLoading } = useQuery<HorseDeletionAnalytics>({
    queryKey: ['/api/admin/horse-deletion-analytics'],
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Admin access required.",
          variant: "destructive",
        });
      }
    }
  });

  const { data: deletionResponses, isLoading: deletionResponsesLoading } = useQuery<HorseDeletionResponse[]>({
    queryKey: ['/api/admin/horse-deletion-responses'],
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Admin access required.",
          variant: "destructive",
        });
      }
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    },
    onSuccess: (data, userId) => {
      toast({
        title: "User Deleted",
        description: data.message || "User has been successfully deleted",
        duration: 5000,
      });
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics'] });
    },
    onError: (error: Error) => {
      console.error('Delete user error:', error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Admin access required for user deletion",
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: "Delete Failed",
          description: error.message || "Failed to delete user",
          variant: "destructive",
          duration: 5000,
        });
      }
    }
  });

  const handleDeleteUser = (userId: number, userEmail: string) => {
    if (window.confirm(`Are you sure you want to delete user: ${userEmail}?\n\nThis will permanently delete the user and all their data including horses, conversations, and messages. This action cannot be undone.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Delete horse mutation
  const deleteHorseMutation = useMutation({
    mutationFn: async (horseId: number) => {
      const response = await fetch(`/api/admin/horses/${horseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Horse Deleted",
        description: data.message || "Horse has been successfully deleted",
        duration: 5000,
      });
      // Invalidate and refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/horses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics'] });
    },
    onError: (error: Error) => {
      console.error('Delete horse error:', error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Admin access required for horse deletion",
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: "Delete Failed",
          description: error.message || "Failed to delete horse",
          variant: "destructive",
          duration: 5000,
        });
      }
    }
  });

  const handleDeleteHorse = (horseId: number, horseName: string) => {
    if (window.confirm(`Are you sure you want to delete horse: ${horseName}?\n\nThis will permanently delete the horse and all associated data. This action cannot be undone.`)) {
      deleteHorseMutation.mutate(horseId);
    }
  };

  // Email update mutation
  const updateEmailMutation = useMutation({
    mutationFn: async (data: {userId: number, newEmail: string}) => {
      const response = await fetch(`/api/admin/users/${data.userId}/email`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.newEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Email Updated",
        description: "User email has been successfully updated",
        duration: 5000,
      });
      setEditingEmail(null);
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: Error) => {
      console.error('Update email error:', error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Admin access required for email updates",
          variant: "destructive",
          duration: 5000,
        });
      } else {
        toast({
          title: "Update Failed",
          description: error.message || "Failed to update email",
          variant: "destructive",
          duration: 5000,
        });
      }
    }
  });

  const handleEmailUpdate = (userId: number, currentEmail: string) => {
    setEditingEmail({
      userId,
      currentEmail,
      newEmail: currentEmail
    });
  };

  const submitEmailUpdate = () => {
    if (editingEmail && editingEmail.newEmail !== editingEmail.currentEmail) {
      updateEmailMutation.mutate({
        userId: editingEmail.userId,
        newEmail: editingEmail.newEmail
      });
    }
  };

  // Check if user is admin
  if (!authLoading && (!user || user.email !== 'info@australianjumping.com.au')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Admin access is restricted to authorized personnel only.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <MobileNavbar />
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          <div className="container mx-auto px-4 py-8 lg:py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ProHorseMatch Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Platform analytics and user management
              </p>
            </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Mobile Dropdown */}
          <div className="md:hidden">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a tab" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="users">Users</SelectItem>
                <SelectItem value="horses">Horses</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="deletions">Deletions</SelectItem>
                <SelectItem value="notifications">Notifications</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Tabs */}
          <TabsList className="hidden md:grid w-full grid-cols-9">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="horses">Horses</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="deletions">Deletions</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {analytics && (
              <>
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.users.total}</div>
                      <p className="text-xs text-muted-foreground">
                        +{analytics.growth.usersLast30Days} this month
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Horses</CardTitle>
                      <Heart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.horses.total}</div>
                      <p className="text-xs text-muted-foreground">
                        +{analytics.growth.horsesLast30Days} this month
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.users.activeSubscribers}</div>
                      <p className="text-xs text-muted-foreground">
                        {((analytics.users.activeSubscribers / analytics.users.total) * 100).toFixed(1)}% of users
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Conversations</CardTitle>
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.engagement.totalConversations}</div>
                      <p className="text-xs text-muted-foreground">
                        {analytics.engagement.totalMessages} messages total
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* User Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Types</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Sellers</span>
                        <Badge variant="secondary">{analytics.users.sellers}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Searchers</span>
                        <Badge variant="secondary">{analytics.users.searchers}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Subscribers</span>
                        <Badge variant="default">{analytics.users.activeSubscribers}</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top Disciplines</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {Object.entries(analytics.horses.byDiscipline)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 10)
                            .map(([discipline, count]) => (
                              <div key={discipline} className="flex justify-between items-center">
                                <span className="text-sm">{discipline}</span>
                                <Badge variant="outline">{count}</Badge>
                              </div>
                            ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                {/* Country Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Horses by Country</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(analytics.horses.byCountry)
                        .sort(([,a], [,b]) => b - a)
                        .map(([country, count]) => (
                          <div key={country} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{country}</span>
                            </div>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      View and manage platform users
                    </p>
                  </div>
                  <Button
                    onClick={exportUsersToExcel}
                    disabled={usersLoading || !users || users.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export to Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                  </div>
                ) : users ? (
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {users.map(user => (
                        <div key={user.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {user.name || user.business_name || user.username}
                                </span>
                                {user.email_verified ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span>{user.email}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <div className="flex items-center space-x-2">
                                {user.subscription_status === 'active' && (
                                  <Badge variant="default">{user.subscription_plan}</Badge>
                                )}
                                {/* Edit email button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEmailUpdate(user.id, user.email)}
                                  disabled={updateEmailMutation.isPending}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300 hover:border-blue-400"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                {/* Only show delete button for non-admin users */}
                                {user.email !== 'info@australianjumping.com.au' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user.id, user.email)}
                                    disabled={deleteUserMutation.isPending}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 hover:border-red-400"
                                  >
                                    {deleteUserMutation.isPending ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                                    ) : (
                                      <Trash2 className="h-3 w-3" />
                                    )}
                                  </Button>
                                )}
                              </div>
                              <div className="flex space-x-1">
                                {user.is_selling && user.subscription_status === 'active' && (
                                  <Badge variant="secondary">Seller</Badge>
                                )}
                                {user.is_searching && user.subscription_status === 'active' && (
                                  <Badge variant="outline">Searcher</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  Joined {new Date(user.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            {user.email === 'info@australianjumping.com.au' && (
                              <Badge variant="destructive" className="text-xs">
                                Admin Account
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No user data available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="horses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Horse Management</CardTitle>
              </CardHeader>
              <CardContent>
                {horsesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading horses...</p>
                  </div>
                ) : horses && horses.length > 0 ? (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                      {horses.map((horse) => (
                        <div key={horse.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <div className="font-medium">{horse.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  ID: {horse.id} • Owner: {horse.owner_id}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {horse.disciplines?.join(', ') || 'No disciplines'} • {horse.age === 1 ? "Yearling" : `${horse.age}yo`} • {horse.sex}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {horse.price_min && horse.price_max ? 
                                    `${horse.currency} ${horse.price_min.toLocaleString()} - ${horse.price_max.toLocaleString()}` : 
                                    'Price not set'
                                  }
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {horse.location_country || 'Location not set'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/horse/${horse.id}`, '_blank')}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/edit-horse/${horse.id}`, '_blank')}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete horse: ${horse.name}?\n\nThis will permanently delete the horse and all associated data. This action cannot be undone.`)) {
                                  handleDeleteHorse(horse.id, horse.name);
                                }
                              }}
                              disabled={deleteHorseMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No horses found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${revenue?.monthlyRevenue?.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Estimated from subscriptions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{revenue?.subscriberCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Active paying users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Revenue/User</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${revenue?.averageRevenuePerUser?.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per paying subscriber
                  </p>
                </CardContent>
              </Card>
            </div>

            {revenue && (
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(revenue.planBreakdown).map(([plan, amount]) => (
                      <div key={plan} className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">{plan.replace('-', ' ')}</span>
                        <div className="text-right">
                          <div className="font-bold">${amount.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">monthly</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Messages</CardTitle>
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.engagement.totalMessages}</div>
                    <p className="text-xs text-muted-foreground">
                      Total messages sent
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversations</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.engagement.totalConversations}</div>
                    <p className="text-xs text-muted-foreground">
                      Active conversations
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.engagement.totalMatches}</div>
                    <p className="text-xs text-muted-foreground">
                      All user interactions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Likes</CardTitle>
                    <Heart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.engagement.totalLikes}</div>
                    <p className="text-xs text-muted-foreground">
                      Positive matches
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Saved Searches</CardTitle>
                    <Bookmark className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.engagement.totalSavedSearches}</div>
                    <p className="text-xs text-muted-foreground">
                      Active saved searches
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {((analytics.engagement.totalLikes / Math.max(analytics.engagement.totalMatches, 1)) * 100).toFixed(1)}%
                        </div>
                        <p className="text-sm text-blue-700">Like Rate</p>
                        <p className="text-xs text-blue-600">
                          Percentage of positive matches
                        </p>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {(analytics.engagement.totalMessages / Math.max(analytics.engagement.totalConversations, 1)).toFixed(1)}
                        </div>
                        <p className="text-sm text-green-700">Messages per Conversation</p>
                        <p className="text-xs text-green-600">
                          Average conversation length
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deletions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Horse Deletion Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {deletionAnalyticsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : deletionAnalytics ? (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {deletionAnalytics.totalDeletions}
                        </div>
                        <p className="text-sm text-blue-700">Total Deletions</p>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {deletionAnalytics.soldThroughApp}
                        </div>
                        <p className="text-sm text-green-700">Sold Through App</p>
                        <p className="text-xs text-green-600">
                          {deletionAnalytics.totalDeletions > 0 
                            ? `${((deletionAnalytics.soldThroughApp / deletionAnalytics.totalDeletions) * 100).toFixed(1)}%`
                            : '0%'}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {deletionAnalytics.soldElsewhere}
                        </div>
                        <p className="text-sm text-orange-700">Sold Elsewhere</p>
                        <p className="text-xs text-orange-600">
                          {deletionAnalytics.totalDeletions > 0 
                            ? `${((deletionAnalytics.soldElsewhere / deletionAnalytics.totalDeletions) * 100).toFixed(1)}%`
                            : '0%'}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {deletionAnalytics.unsold}
                        </div>
                        <p className="text-sm text-red-700">Unsold</p>
                        <p className="text-xs text-red-600">
                          {deletionAnalytics.totalDeletions > 0 
                            ? `${((deletionAnalytics.unsold / deletionAnalytics.totalDeletions) * 100).toFixed(1)}%`
                            : '0%'}
                        </p>
                      </div>
                    </div>

                    {/* Monthly Breakdown */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Monthly Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(deletionAnalytics.responsesByMonth)
                            .sort(([a], [b]) => b.localeCompare(a))
                            .slice(0, 6)
                            .map(([month, data]) => (
                            <div key={month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="font-medium">{month}</div>
                              <div className="flex gap-4 text-sm">
                                <span className="text-blue-600">Total: {data.total}</span>
                                <span className="text-green-600">App: {data.soldThroughApp}</span>
                                <span className="text-orange-600">Elsewhere: {data.soldElsewhere}</span>
                                <span className="text-red-600">Unsold: {data.unsold}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Deletion Responses */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recent Deletion Responses</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {deletionResponsesLoading ? (
                          <div className="flex items-center justify-center p-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          </div>
                        ) : deletionResponses && deletionResponses.length > 0 ? (
                          <ScrollArea className="h-64">
                            <div className="space-y-3">
                              {deletionResponses
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .slice(0, 20)
                                .map((response) => (
                                <div key={response.id} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div>
                                    <div className="font-medium">{response.horse_name}</div>
                                    <div className="text-sm text-gray-500">
                                      {new Date(response.created_at).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {response.sold_through_app && (
                                      <Badge className="bg-green-100 text-green-800">App Sale</Badge>
                                    )}
                                    {response.sold_elsewhere && (
                                      <Badge className="bg-orange-100 text-orange-800">External Sale</Badge>
                                    )}
                                    {response.unsold && (
                                      <Badge className="bg-red-100 text-red-800">Unsold</Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <p className="text-center text-gray-500 py-4">No deletion responses yet</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No deletion analytics available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Push Notification Testing
                </CardTitle>
                <CardDescription>
                  Test push notifications and view user subscription status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PushNotificationTestPanel />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <LoginAnalyticsPanel />
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-6">
            <SubscriptionReminderPanel />
            <EmailAnnouncementPanel />
          </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Email Edit Dialog */}
      <Dialog open={!!editingEmail} onOpenChange={() => setEditingEmail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-email">Current Email</Label>
              <Input
                id="current-email"
                value={editingEmail?.currentEmail || ''}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">New Email</Label>
              <Input
                id="new-email"
                type="email"
                value={editingEmail?.newEmail || ''}
                onChange={(e) => setEditingEmail(prev => prev ? { ...prev, newEmail: e.target.value } : null)}
                placeholder="Enter new email address"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setEditingEmail(null)}
                disabled={updateEmailMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={submitEmailUpdate}
                disabled={updateEmailMutation.isPending || !editingEmail?.newEmail || editingEmail.newEmail === editingEmail.currentEmail}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateEmailMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  'Update Email'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}