import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check, CheckCircle2, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Layout from '@/components/Layout';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from "@/components/ui/scroll-area";
import TermsDialog from '@/components/TermsDialog';

// Ensure we have the public key
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing environment variable: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Beta plans - Free during beta period
const betaPlans = [
  {
    id: 'beta-seller',
    name: 'SELLER',
    price: 0,
    interval: 'month',
    description: 'Free for a limited time',
    features: [
      'List unlimited horses for sale',
      'Detailed horse profile creation',
      'Connect with interested buyers',
      'Unlimited searches',
      'No payment details required'
    ],
    buttonText: 'Get Started'
  },
  {
    id: 'beta-searching',
    name: 'SEARCHING',
    price: 0,
    interval: 'month',
    description: 'Free for a limited time',
    features: [
      'Use advanced filtering options',
      'Connect with sellers directly',
      'Save favorite horses',
      'Unlimited searches',
      'No payment details required'
    ],
    buttonText: 'Get Started'
  }
];

// Future plans (will be available after beta)
const futurePlans = [
  {
    id: 'standard',
    name: 'STANDARD',
    price: 39.95,
    interval: 'month',
    currency: 'AUD',
    description: '',
    features: [
      'List up to 5 horses',
      'Unlimited searches',
      'Basic horse profile creation',
      'Connect with interested buyers',
      'Email notifications',
      'GST Included'
    ],
    buttonText: 'Coming Soon',
    isComingSoon: true
  },
  {
    id: 'professional',
    name: 'PROFESSIONAL',
    price: 69.95,
    interval: 'month',
    currency: 'AUD',
    description: '',
    isPopular: true,
    features: [
      'List up to 15 horses',
      'Unlimited searches',
      'Advanced horse profile creation',
      'Priority listing placement',
      'Connect with interested buyers',
      'Advanced notification options',
      'GST Included'
    ],
    buttonText: 'Coming Soon',
    isComingSoon: true
  },
  {
    id: 'elite',
    name: 'ELITE',
    price: 99.95,
    interval: 'month',
    currency: 'AUD',
    description: '',
    features: [
      'List unlimited horses',
      'Unlimited searches',
      'Detailed horse profile creation',
      'Connect with interested buyers',
      'Notification options',
      'GST Included'
    ],
    buttonText: 'Coming Soon',
    isComingSoon: true
  }
];

// Main subscription page component
export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState('beta-seller');
  const [tosAgreed, setTosAgreed] = useState(false);
  const { toast } = useToast();
  
  // Get authentication status
  const { data: user, isLoading: isLoadingAuth } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // Try to get user from localStorage if authentication is failing
  const fallbackUser = (() => {
    if (user) return user;
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  // Use fallback user if primary user data is unavailable
  const currentUser = user || fallbackUser;
  
  // Get current subscription status - handle failures gracefully
  const { data: subscriptionData, isLoading: isLoadingSubscription, error: subscriptionError } = useQuery({
    queryKey: ['/api/subscription'],
    retry: 1,
    enabled: !!currentUser,
    select: (data) => {
      if (data?.hasSubscription) {
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
    
    // For beta plans, activate the subscription
    if (planId.startsWith('beta-')) {
      activateBetaSubscription(planId);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Try to get user from localStorage if authentication is failing
  const fallbackUser = (() => {
    if (user) return user;
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

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

  // Use fallback user if primary user data is unavailable
  const currentUser = user || fallbackUser;

  // Show current subscription if user has one (from API or localStorage)
  if (subscriptionData?.hasSubscription || currentUser?.stripe_subscription_id) {
    // Use API data if available, otherwise use user data
    const subscriptionId = subscriptionData?.subscriptionId || currentUser?.stripe_subscription_id;
    const status = subscriptionData?.status || currentUser?.subscription_status || 'active';
    const planId = subscriptionData?.planId || currentUser?.subscription_plan;
    const currentPeriodEnd = subscriptionData?.currentPeriodEnd || 
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
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold font-accent">Billing Information</h3>
                  {isBetaPlan ? (
                    <p className="text-sm">
                      Your beta subscription is active until further notice
                    </p>
                  ) : (
                    <p className="text-sm">
                      Your subscription renews on <span className="font-medium">{formatDate(currentPeriodEnd)}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Feature list */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold font-accent">Features</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Future plans preview for beta users */}
              {isBetaPlan && (
                <div className="space-y-4 pt-6 border-t border-gray-200 mt-6">
                  <h3 className="text-lg font-semibold font-accent">Coming Soon</h3>
                  <p className="text-sm text-muted-foreground">
                    These premium plans will be available after our beta period. 
                    Enjoy free access now while it lasts!
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {futurePlans.map((futurePlan) => (
                      <Card key={futurePlan.id} className={`border ${futurePlan.isPopular ? 'border-primary' : 'border-gray-200'}`}>
                        <CardHeader className="pb-2">
                          {futurePlan.isPopular && (
                            <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 text-xs font-medium rounded-bl-md">
                              Most Popular
                            </div>
                          )}
                          <CardTitle className="text-lg font-accent">{futurePlan.name}</CardTitle>
                          <div className="text-2xl font-bold">
                            ${futurePlan.price}
                            <span className="text-sm font-normal text-muted-foreground">/month</span>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <ul className="space-y-2">
                            {futurePlan.features.slice(0, 4).map((feature, index) => (
                              <li key={index} className="flex items-start text-sm">
                                <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Show subscription selection for users without subscription
  return (
    <Layout pageTitle="Choose Your Plan">
      <div className="container mx-auto py-12 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-accent mb-4">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground">
            Start with our free beta plans - no payment required!
          </p>
        </div>

        {/* Beta Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {betaPlans.map((plan) => (
            <Card key={plan.id} className="relative border-2 border-primary">
              <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 text-xs font-medium rounded-bl-md">
                FREE BETA
              </div>
              <CardHeader>
                <CardTitle className="text-xl font-accent">{plan.name}</CardTitle>
                <div className="text-3xl font-bold">
                  FREE
                  <span className="text-sm font-normal text-muted-foreground ml-2">{plan.description}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full" 
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isActivatingBeta && selectedPlan === plan.id}
                >
                  {isActivatingBeta && selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    plan.buttonText
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Terms of Service Agreement */}
        <div className="flex items-center space-x-2 justify-center mb-6">
          <Checkbox 
            id="terms" 
            checked={tosAgreed}
            onCheckedChange={setTosAgreed}
          />
          <label htmlFor="terms" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            I agree to the{" "}
            <TermsDialog>
              <Button variant="link" className="p-0 h-auto text-sm text-primary underline-offset-2" size="sm">
                Terms of Service <ExternalLink className="h-3 w-3 ml-1 inline" />
              </Button>
            </TermsDialog>
          </label>
        </div>

        {/* Future Plans Preview */}
        <div className="space-y-4 pt-6 border-t border-gray-200">
          <div className="text-center">
            <h2 className="text-2xl font-bold font-accent mb-2">Coming After Beta</h2>
            <p className="text-muted-foreground">
              These premium plans will be available after our beta period ends
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {futurePlans.map((plan) => (
              <Card key={plan.id} className={`border ${plan.isPopular ? 'border-primary' : 'border-gray-200'} opacity-75`}>
                <CardHeader className="pb-2">
                  {plan.isPopular && (
                    <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 text-xs font-medium rounded-bl-md">
                      Most Popular
                    </div>
                  )}
                  <CardTitle className="text-lg font-accent">{plan.name}</CardTitle>
                  <div className="text-2xl font-bold">
                    ${plan.price}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button className="w-full" disabled>
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}