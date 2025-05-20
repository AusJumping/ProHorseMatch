import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function SubscriptionSuccessPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Get the subscription details
  const { data: subscription, isLoading, isError } = useQuery({
    queryKey: ['/api/subscription'],
    retry: 3,
  });
  
  useEffect(() => {
    // Show a success message when the page loads
    toast({
      title: "Subscription Successful",
      description: "Your subscription has been activated successfully!",
    });
    
    // Invalidate the user data to refresh subscription status
    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
  }, [toast, queryClient]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <h2 className="text-2xl font-accent font-semibold">Verifying subscription...</h2>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="container mx-auto py-20 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Subscription Status</CardTitle>
            <CardDescription>There was an issue verifying your subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>We couldn't verify the status of your subscription. This might be a temporary issue.</p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/subscription'] })}>
              Try Again
            </Button>
            <Button variant="outline" onClick={() => navigate('/subscription')}>
              Return to Subscriptions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-20 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto bg-green-100 rounded-full p-3 mb-4 w-16 h-16 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-accent">Subscription Activated!</CardTitle>
          <CardDescription>
            Your subscription has been successfully processed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground">Subscription Status</p>
              <p className="font-medium capitalize">{subscription?.status || 'Active'}</p>
            </div>
            {subscription?.currentPeriodEnd && (
              <div>
                <p className="text-sm text-muted-foreground">Next Billing Date</p>
                <p className="font-medium">
                  {new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <Button className="w-full" onClick={() => navigate('/welcome')}>
              Get Started
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate('/account-settings')}>
              Go to My Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}