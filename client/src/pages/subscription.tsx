import { useStripe, useElements, Elements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useLocation, useNavigate } from 'wouter';

// Ensure we have the public key
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing environment variable: VITE_STRIPE_PUBLIC_KEY');
}

// Load the Stripe instance once
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Plans configuration (in a real app, these would come from an API)
const SUBSCRIPTION_PLANS = {
  basic: {
    id: 'price_basic',
    name: 'Basic Seller',
    price: 25,
    description: 'Perfect for sellers with a small number of horses',
    features: [
      'List up to 5 horses',
      'Basic analytics',
      'Standard customer support'
    ]
  },
  premium: {
    id: 'price_premium',
    name: 'Premium Seller',
    price: 50,
    description: 'For professional sellers with multiple horses',
    features: [
      'Unlimited horse listings',
      'Advanced analytics and reporting',
      'Featured placement in search results',
      'Priority customer support'
    ]
  }
};

// Subscription form component
const SubscriptionForm = ({ planId }: { planId: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return toast({
        title: "Error",
        description: "Stripe has not been properly initialized",
        variant: "destructive"
      });
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/subscription/success`,
        },
      });
      
      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An error occurred during payment processing",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing
          </>
        ) : (
          'Subscribe Now'
        )}
      </Button>
    </form>
  );
};

// Main subscription page component
export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [clientSecret, setClientSecret] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get current subscription status
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['/api/subscription'],
    retry: false,
  });
  
  // Create subscription mutation
  const { mutate: createSubscription, isPending: isCreatingSubscription } = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('POST', '/api/create-subscription', { plan: planId });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    }
  });
  
  // Cancel subscription mutation
  const { mutate: cancelSubscription, isPending: isCancelingSubscription } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/cancel-subscription');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Canceled",
        description: "Your subscription will be canceled at the end of the billing period",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    }
  });
  
  // Handle plan selection and subscription creation
  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    createSubscription(SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS].id);
  };
  
  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  if (isLoadingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Display active subscription details
  if (subscriptionData?.hasSubscription) {
    const { status, currentPeriodEnd, planId } = subscriptionData;
    
    // Find plan name based on planId
    const getPlanName = () => {
      const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === planId);
      return plan ? plan.name : 'Custom Plan';
    };
    
    return (
      <div className="container mx-auto py-10 max-w-4xl">
        <h1 className="text-3xl font-accent font-bold mb-6">Your Subscription</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
              Active Subscription
            </CardTitle>
            <CardDescription>Your subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium">{getPlanName()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Period Ends</p>
                <p className="font-medium">{formatDate(currentPeriodEnd)}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => cancelSubscription()}
              disabled={isCancelingSubscription}
            >
              {isCancelingSubscription ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                'Cancel Subscription'
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <div className="text-center text-sm text-muted-foreground mt-8">
          <p>Need help? Contact our support team at support@prohorsemath.com</p>
        </div>
      </div>
    );
  }
  
  // Show subscription plans for new subscribers
  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <h1 className="text-3xl font-accent font-bold mb-2">Subscription Plans</h1>
      <p className="text-muted-foreground mb-8">
        Choose a subscription plan to list your horses and connect with potential buyers
      </p>
      
      {clientSecret ? (
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Subscription</CardTitle>
            <CardDescription>
              Enter your payment details to subscribe to the {SUBSCRIPTION_PLANS[selectedPlan as keyof typeof SUBSCRIPTION_PLANS].name} plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SubscriptionForm planId={selectedPlan} />
            </Elements>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="basic">Basic Plan</TabsTrigger>
            <TabsTrigger value="premium">Premium Plan</TabsTrigger>
          </TabsList>
          
          {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
            <TabsContent key={key} value={key} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{plan.name}</span>
                    <span className="text-2xl">${plan.price}/month</span>
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={() => handleSelectPlan(key)}
                    disabled={isCreatingSubscription}
                  >
                    {isCreatingSubscription ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing
                      </>
                    ) : (
                      'Subscribe Now'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
      
      <div className="text-center text-sm text-muted-foreground mt-8">
        <p>All plans include secure processing with Stripe</p>
        <p className="mt-2">Need help? Contact our support team at support@prohorsemath.com</p>
      </div>
    </div>
  );
}