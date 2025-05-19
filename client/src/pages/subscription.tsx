import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Layout from '@/components/Layout';

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
      'Save favorite listings',
      'Notification options',
      'No payment details required'
    ],
    buttonText: 'Get Started'
  }
];

// Future plans - Coming after beta period
const futurePlans = [
  {
    id: 'searching',
    name: 'SEARCHING',
    price: 6.95,
    interval: 'month',
    currency: 'AUD',
    description: '',
    features: [
      'Unlimited searches',
      'Use advanced filtering options',
      'Connect with sellers directly',
      'Save favorite listings',
      'Notification options',
      'GST Included'
    ],
    buttonText: 'Coming Soon',
    isComingSoon: true
  },
  {
    id: 'professional',
    name: 'PROFESSIONAL',
    price: 39.95,
    interval: 'month',
    currency: 'AUD',
    description: '',
    features: [
      'List up to 3 horses at any one time',
      'Unlimited searches',
      'Detailed horse profile creation',
      'Connect with interested buyers',
      'Notification options',
      'GST Included'
    ],
    buttonText: 'Coming Soon',
    isComingSoon: true,
    isPopular: true
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

// Checkout form component (uses Stripe Elements)
const CheckoutForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/subscription/success',
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed. Please try again.');
        toast({
          title: 'Payment Failed',
          description: error.message || 'There was an issue processing your payment.',
          variant: 'destructive',
        });
      } else {
        // Payment succeeded
        toast({
          title: 'Payment Successful',
          description: 'Your subscription has been activated!',
        });
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
      toast({
        title: 'Error',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {errorMessage && (
        <div className="text-sm font-medium text-destructive">{errorMessage}</div>
      )}
      
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
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
  const [selectedPlan, setSelectedPlan] = useState('beta-seller');
  const [clientSecret, setClientSecret] = useState('');
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState(20);
  const [isDonating, setIsDonating] = useState(false);
  const { toast } = useToast();
  
  // Get authentication status
  const { data: user, isLoading: isLoadingAuth } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // Get current subscription status
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['/api/subscription'],
    retry: false,
    enabled: !!user // Only run if user is authenticated
  });
  
  // Create subscription mutation
  const { mutate: createSubscription, isPending: isCreatingSubscription } = useMutation({
    mutationFn: async (planId: string) => {
      // Using apiRequest which already handles JSON parsing and errors
      return await apiRequest('POST', '/api/subscription', { planId });
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: Error) => {
      toast({
        title: 'Subscription Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Cancel subscription mutation
  const { mutate: cancelSubscription, isPending: isCancellingSubscription } = useMutation({
    mutationFn: async () => {
      // Using apiRequest which already handles JSON parsing and errors
      return await apiRequest('DELETE', '/api/subscription');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription has been cancelled successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Cancellation Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // When plan is selected, handle beta or paid subscriptions accordingly
  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    
    // For beta plans, just show a success message without payment details
    if (planId.startsWith('beta-')) {
      // Skip the backend call for beta plans and just show success message
      toast({
        title: 'Beta Subscription Activated',
        description: 'You are now subscribed to the Beta version of this site. This subscription is free and is for a limited time only. Enjoy exploring the features of this app. We hope you find your perfect match!',
        duration: 6000, // Longer duration for this important message
      });
      
      // Always redirect to filter page regardless of subscription type
      setTimeout(() => navigate('/filter'), 2000);
    } else {
      // For paid plans, create a payment intent
      createSubscription(planId);
    }
  };
  
  // Handle successful payment
  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    
    toast({
      title: 'Subscription Active',
      description: 'Your subscription has been successfully activated!',
      duration: 5000,
    });
    
    // Redirect to filter page after successful payment
    setTimeout(() => navigate('/filter'), 2000);
  };
  
  // Handle donation
  const handleDonation = async (amount: number) => {
    try {
      setIsDonating(true);
      
      toast({
        title: 'Thank You!',
        description: 'You are being redirected to complete your donation.',
      });
      
      // Format the amount with 2 decimal places to ensure consistency
      const formattedAmount = amount.toFixed(2);
      
      // Use direct window location change to avoid any stale state issues
      window.location.href = `/donation-checkout?amount=${formattedAmount}`;
      
    } catch (error: any) {
      toast({
        title: 'Donation Error',
        description: error.message || 'An error occurred processing your donation',
        variant: 'destructive',
      });
      setIsDonating(false);
      setShowCustomAmount(false);
    }
  };
  
  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // Show login message if user is not authenticated
  if (!user && !isLoadingAuth) {
    return (
      <Layout pageTitle="Subscription Plans">
        <div className="container mx-auto py-20 max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-accent">Login Required</CardTitle>
              <CardDescription>
                You need to be logged in to access subscription features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Please log in to view subscription options and manage your subscription.</p>
              <Button onClick={() => navigate('/login')} className="w-full">
                Log In
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }
  
  if (isLoadingAuth || isLoadingSubscription) {
    return (
      <Layout pageTitle="Subscription Plans">
        <div className="container mx-auto py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <h2 className="text-2xl font-accent font-semibold">Loading subscription status...</h2>
        </div>
      </Layout>
    );
  }
  
  // Show current subscription if the user has one
  if (subscriptionData?.hasSubscription) {
    const { status, currentPeriodEnd, planId } = subscriptionData;
    // Find the plan from beta or future plans
    const allPlans = [...betaPlans, ...futurePlans];
    const plan = allPlans.find(p => p.id === planId) || { name: 'Unknown', price: 0, features: [] as string[] };
    
    return (
      <Layout pageTitle="My Subscription">
        <div className="container mx-auto py-20 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-accent">Your Subscription</CardTitle>
              <CardDescription>Current subscription details and management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Plan Details</h3>
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-medium">{plan.name} Plan</span>
                    <span className="font-bold">${plan.price}/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Status: <span className="capitalize">{status}</span>
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Billing Cycle</h3>
                  <p className="text-sm">
                    Your subscription renews on <span className="font-medium">{formatDate(currentPeriodEnd)}</span>
                  </p>
                  {status === 'active' && (
                    <Button 
                      variant="destructive" 
                      onClick={() => cancelSubscription()} 
                      disabled={isCancellingSubscription}
                      className="mt-4"
                    >
                      {isCancellingSubscription ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Cancel Subscription'
                      )}
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-semibold">Benefits & Features</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {plan.features?.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }
  
  // Show subscription plans for new subscribers
  return (
    <Layout pageTitle="Subscription Plans">
      <div className="w-full py-10" style={{ backgroundColor: "#e4e2dd" }}>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-accent font-bold mb-2">Beta Access</h1>
            <p className="text-muted-foreground">Enjoy full access during our Beta Launch Period. This subscription is free and is for a limited time only. Enjoy exploring the features of this app. We hope you find your perfect match!</p>
          </div>
          
          {!clientSecret ? (
            <>
              {/* Beta Plans Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                {betaPlans.map((plan) => (
                  <Card key={plan.id} className="overflow-hidden flex flex-col">
                    <CardHeader className="pb-4">
                      <CardTitle className="font-accent">{plan.name}</CardTitle>
                      <div className="flex items-baseline mt-2">
                        <span className="text-xl font-medium">{plan.price === 0 ? 'Free for a limited time' : `$${plan.price}/${plan.interval}`}</span>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-grow">
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    
                    <div className="px-6 pb-6 mt-auto">
                      <Button 
                        onClick={() => handleSelectPlan(plan.id)} 
                        className="w-full"
                      >
                        {plan.buttonText || "Get Started"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              
              {/* Future Plans Section */}
              <div className="text-center mb-8 mt-20">
                <h1 className="text-3xl font-accent font-bold mb-2">Select Your Plan</h1>
                <p className="text-muted-foreground">When we approach the end of the Beta phase, we will notify you well in advance via email. At that time, if you would would like to continue using the platform, simply select the subscription level below that best suits your needs.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {futurePlans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    className={`overflow-hidden flex flex-col ${plan.isPopular ? 'ring-2 ring-[#cdac6e] relative' : ''}`}
                  >
                    {plan.isPopular && (
                      <div className="absolute top-0 right-0 bg-[#cdac6e] text-white px-4 py-1 text-xs font-medium">
                        Popular
                      </div>
                    )}
                    <CardHeader className="pb-4">
                      <CardTitle className="font-accent">{plan.name}</CardTitle>
                      <div className="flex items-baseline mt-2">
                        <span className="text-3xl font-bold">${plan.price}</span>
                        <span className="text-sm text-muted-foreground ml-1">/{plan.interval}</span>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-grow">
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    
                    <div className="px-6 pb-6 mt-auto">
                      <Button 
                        className="w-full"
                        variant="outline"
                        disabled={true}
                      >
                        {plan.buttonText || "Coming Soon"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="max-w-md mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="font-accent">Complete Your Subscription</CardTitle>
                  <CardDescription>
                    Enter your payment details to start your subscription
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                    <CheckoutForm onSuccess={handlePaymentSuccess} />
                  </Elements>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Donation Section */}
          <div className="max-w-2xl mx-auto mt-20 mb-10 bg-white rounded-lg p-6 border border-[#d1cfc8]">
            <div className="text-center">
              <h3 className="text-xl font-accent font-semibold mb-3">Support Our Development</h3>
              <p className="text-muted-foreground mb-6">
                Help us make Pro Horse Match the #1 horse sale app with a one-time donation. 
                Every contribution helps us build new features and improve the platform.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-6">
                {[10, 25, 50, 100].map((amount) => (
                  <Button 
                    key={amount}
                    variant="outline" 
                    className="min-w-[80px] bg-white hover:bg-[#cdac6e] hover:text-white border-[#d1cfc8]"
                    onClick={() => handleDonation(amount)}
                    disabled={isDonating}
                  >
                    ${amount}
                  </Button>
                ))}
                <Button 
                  variant="outline" 
                  className="min-w-[80px] bg-white hover:bg-primary hover:text-white border-amber-300"
                  onClick={() => setShowCustomAmount(true)}
                  disabled={isDonating}
                >
                  Custom
                </Button>
              </div>
              
              {showCustomAmount && (
                <div className="max-w-xs mx-auto mb-6">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Enter amount"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(Number(e.target.value))}
                      min={1}
                    />
                    <Button 
                      variant="default" 
                      onClick={() => handleDonation(customAmount)}
                      disabled={isDonating || customAmount <= 0}
                    >
                      Donate
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}