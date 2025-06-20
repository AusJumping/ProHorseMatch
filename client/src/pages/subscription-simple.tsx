import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check, Star, Crown, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Layout from '@/components/Layout';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  recommended?: boolean;
  popular?: boolean;
}

export default function SubscriptionSimplePage() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [tosAgreed, setTosAgreed] = useState(false);

  // Try to get user from localStorage if authentication is failing
  const fallbackUser = (() => {
    if (user) return user;
    try {
      const stored = localStorage.getItem('user');
      const parsed = stored ? JSON.parse(stored) : null;
      console.log('Subscription page - fallback user from localStorage:', parsed);
      return parsed;
    } catch (error) {
      console.log('Subscription page - localStorage parse error:', error);
      return null;
    }
  })();

  // Use fallback user if primary user data is unavailable
  const currentUser = user || fallbackUser;
  
  console.log('Subscription page - Auth state:', { 
    user: !!user, 
    fallbackUser: !!fallbackUser, 
    currentUser: !!currentUser,
    hasSubscription: currentUser?.stripe_subscription_id 
  });

  // Beta subscription plans
  const betaPlans: SubscriptionPlan[] = [
    {
      id: 'beta-searching',
      name: 'BETA SEARCHING',
      price: 0,
      currency: 'AUD',
      features: [
        'Browse all horses',
        'Advanced search filters',
        'Contact horse owners',
        'Save favorites',
        'Beta period access'
      ],
      popular: true
    },
    {
      id: 'beta-seller',
      name: 'BETA SELLING',
      price: 0,
      currency: 'AUD',
      features: [
        'List unlimited horses',
        'Professional horse profiles',
        'Direct buyer messaging',
        'Performance analytics',
        'Beta period access'
      ],
      recommended: true
    }
  ];

  // Future subscription plans
  const futurePlans: SubscriptionPlan[] = [
    {
      id: 'searching-monthly',
      name: 'SEARCHING',
      price: 29,
      currency: 'AUD',
      features: [
        'Browse all horses',
        'Advanced search filters',
        'Contact horse owners',
        'Save favorites',
        'Priority support'
      ]
    },
    {
      id: 'selling-monthly',
      name: 'SELLING',
      price: 49,
      currency: 'AUD',
      features: [
        'List unlimited horses',
        'Professional horse profiles',
        'Direct buyer messaging',
        'Performance analytics',
        'Priority support'
      ],
      recommended: true
    }
  ];

  // Get current subscription status - handle failures gracefully
  const { data: subscriptionData, isLoading: isLoadingSubscription, error: subscriptionError } = useQuery({
    queryKey: ['/api/subscription'],
    retry: 1,
    enabled: !!currentUser,
    select: (data) => {
      if (data && typeof data === 'object' && 'hasSubscription' in data && data.hasSubscription) {
        return data;
      }
      
      // Fallback for when the Stripe API call fails but we still have user data
      if (currentUser?.stripe_subscription_id) {
        const isBetaPlan = currentUser.stripe_subscription_id.startsWith('beta-');
        
        return {
          hasSubscription: true,
          subscriptionId: currentUser.stripe_subscription_id,
          status: currentUser.subscription_status || 'active',
          planId: currentUser.subscription_plan || (isBetaPlan ? 'beta-seller' : 'standard'),
          currentPeriodEnd: currentUser.subscription_end_date 
            ? new Date(currentUser.subscription_end_date).getTime() / 1000 
            : (Date.now() + 90 * 24 * 60 * 60 * 1000) / 1000,
        };
      }
      
      return data;
    }
  });

  // Beta subscription activation
  const { mutate: activateBetaSubscription, isPending: isActivatingBeta } = useMutation({
    mutationFn: async (planId: string) => {
      return await apiRequest('POST', '/api/subscription/beta', { planId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: 'Subscription Activated',
        description: 'Your beta subscription has been activated!',
        duration: 5000,
      });
      
      // Redirect to browse page
      setTimeout(() => navigate('/browse'), 1500);
    },
    onError: (error: Error) => {
      toast({
        title: 'Activation Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle plan selection
  const handleSelectPlan = (planId: string) => {
    if (!tosAgreed) {
      toast({
        title: 'Terms of Service Required',
        description: 'Please agree to the Terms of Service before continuing.',
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedPlan(planId);
    
    // For beta plans, activate immediately
    if (planId.startsWith('beta-')) {
      activateBetaSubscription(planId);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Show loading state only if no fallback data is available
  if (isLoadingAuth && !fallbackUser) {
    return (
      <Layout pageTitle="Subscription">
        <div className="container mx-auto py-12 max-w-4xl">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  // Show login prompt only if neither user nor fallback data is available
  if (!user && !fallbackUser) {
    return (
      <Layout pageTitle="Subscription">
        <div className="container mx-auto py-12 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>Please log in to view subscription options</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/auth')}>
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Show current subscription if user has one (from API or localStorage)
  if (subscriptionData?.hasSubscription || currentUser?.stripe_subscription_id) {
    // Use API data if available, otherwise use user data
    const subscriptionId = (subscriptionData as any)?.subscriptionId || currentUser?.stripe_subscription_id;
    const status = (subscriptionData as any)?.status || currentUser?.subscription_status || 'active';
    const planId = (subscriptionData as any)?.planId || currentUser?.subscription_plan;
    const currentPeriodEnd = (subscriptionData as any)?.currentPeriodEnd || 
      (currentUser?.subscription_end_date ? new Date(currentUser.subscription_end_date).getTime() / 1000 : undefined);
    
    const isBetaPlan = subscriptionId?.startsWith('beta-');
    const plan = isBetaPlan 
      ? betaPlans.find(p => p.id === planId) || betaPlans[0]
      : futurePlans.find(p => p.id === planId) || futurePlans[0];
    
    return (
      <Layout pageTitle="My Subscription">
        <div className="container mx-auto py-12 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-accent">Your Subscription</CardTitle>
              <CardDescription>Current subscription details and management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full mb-2">
                    Current Plan
                  </div>
                  <h3 className="text-2xl font-semibold font-accent">{plan.name} PLAN</h3>
                  <div className="text-lg mt-2">
                    <span className="font-bold">${plan.price}</span>
                    <span className="text-muted-foreground ml-1">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Status: <span className="capitalize font-medium">{status}</span>
                  </p>
                  
                  {isBetaPlan && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
                      <p className="text-sm font-medium">
                        You're using our free beta plan. Enjoy full access to all features during our beta period.
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold">Plan Features</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {currentPeriodEnd && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {isBetaPlan ? 'Beta access valid until' : 'Next billing date'}: {formatDate(currentPeriodEnd)}
                  </p>
                </div>
              )}
              
              <div className="flex gap-4 pt-4">
                <Button onClick={() => navigate('/browse')} className="flex-1">
                  Browse Horses
                </Button>
                {currentUser?.is_selling && (
                  <Button variant="outline" onClick={() => navigate('/my-horses')} className="flex-1">
                    Manage Horses
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Show subscription plan selection
  return (
    <Layout pageTitle="Subscription Plans">
      <div className="container mx-auto py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-accent mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join our beta program and get free access to all premium features. 
            Help us build the future of horse trading.
          </p>
        </div>

        {/* Beta Plans */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="text-lg px-4 py-2 mb-4">
              <Crown className="h-5 w-5 mr-2" />
              Beta Access - Free for Limited Time
            </Badge>
            <h2 className="text-2xl font-semibold">Beta Subscription Plans</h2>
            <p className="text-muted-foreground mt-2">
              Get full access to all features during our beta period
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {betaPlans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative ${plan.popular ? 'ring-2 ring-primary' : ''} ${plan.recommended ? 'ring-2 ring-amber-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant="secondary" className="bg-amber-500 text-white">
                      <Zap className="h-3 w-3 mr-1" />
                      Recommended
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-accent">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    FREE
                    <span className="text-sm font-normal text-muted-foreground ml-2">during beta</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isActivatingBeta && selectedPlan === plan.id}
                    className="w-full"
                    variant={plan.recommended ? "default" : "outline"}
                  >
                    {isActivatingBeta && selectedPlan === plan.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Activating...
                      </>
                    ) : (
                      'Start Beta Access'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Future Plans Preview */}
        <div className="opacity-60">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold">Future Pricing</h2>
            <p className="text-muted-foreground mt-2">
              After beta period, these will be our standard plans
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {futurePlans.map((plan) => (
              <Card key={plan.id} className="relative">
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant="secondary">Recommended</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-accent">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    ${plan.price}
                    <span className="text-sm font-normal text-muted-foreground">/{plan.currency}/month</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button disabled className="w-full" variant="outline">
                    Available After Beta
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Terms of Service Agreement */}
        <div className="mt-12 max-w-md mx-auto">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="terms" 
              checked={tosAgreed}
              onCheckedChange={(checked) => setTosAgreed(checked === true)}
            />
            <Label htmlFor="terms" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I agree to the{' '}
              <button 
                type="button"
                className="text-primary underline hover:no-underline"
                onClick={() => window.open('/terms', '_blank')}
              >
                Terms of Service
              </button>
            </Label>
          </div>
        </div>
      </div>
    </Layout>
  );
}