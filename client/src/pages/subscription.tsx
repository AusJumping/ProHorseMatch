import { useState, useEffect, useCallback } from 'react';
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
import { useCurrency } from '@/contexts/CurrencyContext';
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
    price: 9.95,
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

// Terms of Service Dialog component
const TermsOfServiceDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 h-auto text-sm text-primary underline-offset-2" size="sm">
          Terms of Service <ExternalLink className="h-3 w-3 ml-1 inline" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
          <DialogDescription>Effective Date: 21 May 2025</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <h3 className="font-bold">Disclaimer of Liability and User Responsibility</h3>
          
          <div>
            <h4 className="font-semibold">1. Content Accuracy and Listings</h4>
            <p>ProHorseMatch is a platform that facilitates connections between buyers and sellers of performance horses. All listings, including descriptions, images, health records, training history, and other horse-related content, are provided by the users (sellers).</p>
            <p>ProHorseMatch does not create, verify, or endorse the accuracy, completeness, legality, or authenticity of any listing content. Users of the platform acknowledge and agree that the responsibility for all content posted lies solely with the user who posted it.</p>
          </div>
          
          <div>
            <h4 className="font-semibold">2. Buyer and Seller Due Diligence</h4>
            <p>ProHorseMatch strongly recommends that both buyers and sellers conduct their own due diligence before entering into any transaction. This includes, but is not limited to, verifying the identity and reputation of the other party, independently assessing the suitability, training level, and health of the horse, and seeking professional advice or veterinary assessments where appropriate.</p>
          </div>
          
          <div>
            <h4 className="font-semibold">3. No Warranties or Guarantees</h4>
            <p>ProHorseMatch makes no representations or warranties of any kind, express or implied, regarding the fitness, performance, soundness, temperament, or suitability of any horse listed on the platform for any specific purpose. All horses are sold "as-is" and "as-available" directly by the seller, and any representations made about a horse are solely the responsibility of the seller.</p>
          </div>
          
          <div>
            <h4 className="font-semibold">4. Limitation of Liability</h4>
            <p>To the maximum extent permitted by applicable law, ProHorseMatch disclaims all liability for any direct, indirect, incidental, special, consequential or punitive damages, including but not limited to loss of profits, loss of opportunity, personal injury, or property damage arising out of or in connection with:</p>
            <ul className="list-disc pl-5">
              <li>any inaccuracies or omissions in listing content;</li>
              <li>the condition, health, or behaviour of any horse;</li>
              <li>any transaction entered into between users of the platform.</li>
            </ul>
          </div>
          
          <h3 className="font-bold">Subscription Terms</h3>
          
          <div>
            <h4 className="font-semibold">5.1 Billing and Payments</h4>
            <p>ProHorseMatch offers subscription-based services for sellers and search-only access for buyers. All subscriptions are billed on a monthly basis in advance and are non-refundable. The applicable subscription fees and tier options are clearly stated at the time of sign-up and may vary depending on the user's selected plan.</p>
          </div>
          
          <div>
            <h4 className="font-semibold">5.2 Auto-Renewal</h4>
            <p>All subscriptions automatically renew at the end of each billing cycle (monthly) unless the user cancels their subscription before the next billing date. By subscribing, you authorise ProHorseMatch (or its payment processor) to charge your selected payment method on a recurring monthly basis.</p>
          </div>
          
          <div>
            <h4 className="font-semibold">5.3 Cancellations</h4>
            <p>You may cancel your subscription at any time via your account settings within the app or website. Cancellations must be made prior to the renewal date to avoid being charged for the next month. If you cancel after a charge has already been processed, access to your subscription benefits will continue until the end of the paid billing period, after which your subscription will not renew.</p>
          </div>
          
          <div>
            <h4 className="font-semibold">5.4 Changes to Pricing or Subscription Terms</h4>
            <p>ProHorseMatch reserves the right to modify subscription pricing, plans, or terms at any time. Any changes will be communicated in advance via email or app notification. Continued use of the platform after the effective date of any change constitutes acceptance of the new terms.</p>
          </div>
          
          <div>
            <h4 className="font-semibold">5.5 Beta Subscriptions and Free Trials</h4>
            <p>Beta subscriptions do not require payment details. You will be notified via email in advance before the beta subscriptions end to allow you to convert to a paid subscription.</p>
            <p>From time to time, ProHorseMatch may offer free trial subscriptions. These will auto-renew into paid subscriptions unless cancelled before the trial period ends.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Main subscription page component
export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState('beta-seller');
  const [clientSecret, setClientSecret] = useState('');
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState(20);
  const [isDonating, setIsDonating] = useState(false);
  const [convertedFuturePlans, setConvertedFuturePlans] = useState(futurePlans);
  const [tosAgreed, setTosAgreed] = useState(false);
  const [isPendingSubscribe, setIsPendingSubscribe] = useState(false);
  const { toast } = useToast();
  const { currentCurrency, convertPrice, formatPrice } = useCurrency();
  
  // Get authentication status
  const { data: user, isLoading: isLoadingAuth } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // Convert subscription prices to user's preferred currency
  useEffect(() => {
    const convertPrices = async () => {
      try {
        // Only convert if we have a different currency than AUD (base currency for plans)
        if (currentCurrency !== 'AUD') {
          const newPlans = futurePlans.map((plan) => {
            // Simple conversion using static rates for now to avoid re-render loops
            // This prevents infinite re-renders while still showing approximate converted prices
            const conversionRates: { [key: string]: number } = {
              'USD': 0.66, // AUD to USD
              'EUR': 0.60, // AUD to EUR
              'GBP': 0.52, // AUD to GBP
              'CAD': 0.88, // AUD to CAD
            };
            
            const rate = conversionRates[currentCurrency] || 1;
            const convertedPrice = plan.price * rate;
            
            return {
              ...plan,
              price: parseFloat(convertedPrice.toFixed(2))
            };
          });
          setConvertedFuturePlans(newPlans);
        } else {
          setConvertedFuturePlans(futurePlans);
        }
      } catch (error) {
        console.error('Error converting prices:', error);
        // Fallback to original prices if conversion fails
        setConvertedFuturePlans(futurePlans);
      }
    };
    
    convertPrices();
  }, [currentCurrency]); // Only depend on currentCurrency to prevent infinite re-renders
  
  // Get current subscription status - handle failures gracefully
  const { data: subscriptionData, isLoading: isLoadingSubscription, error: subscriptionError } = useQuery({
    queryKey: ['/api/subscription'],
    retry: 1, // Retry once
    enabled: !!user, // Only run if user is authenticated
    // Fallback to provide subscription info from the user object if API fails
    select: (data) => {
      if (data?.hasSubscription) {
        return data;
      }
      
      // Fallback for when the Stripe API call fails but we still have user data
      // This ensures the subscription page works even if Stripe API is unreachable
      if (user?.stripe_subscription_id) {
        const isBetaPlan = user.stripe_subscription_id.startsWith('beta-');
        
        return {
          hasSubscription: true,
          subscriptionId: user.stripe_subscription_id,
          status: user.subscription_status || 'active',
          planId: user.subscription_plan || (isBetaPlan ? 'beta-seller' : 'standard'),
          currentPeriodEnd: user.subscription_end_date 
            ? new Date(user.subscription_end_date).getTime() / 1000 
            : (Date.now() + 90 * 24 * 60 * 60 * 1000) / 1000,
        };
      }
      
      return data;
    }
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
  
  // Beta subscription activation mutation
  const { mutate: activateBetaSubscription, isPending: isActivatingBeta } = useMutation({
    mutationFn: async (planId: string) => {
      return await apiRequest('POST', '/api/subscription/beta', { planId });
    },
    onSuccess: () => {
      // Invalidate queries to refresh subscription data
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Check if we're on a mobile device for auto-dismissing toast
      const isMobile = window.innerWidth <= 768;
      
      // Show toast with auto-dismiss on mobile
      toast({
        title: 'Beta Subscription Activated',
        description: 'You are now subscribed to the Beta version of this site. This subscription is free and is for a limited time only. Enjoy exploring the features of this app. We hope you find your perfect match!',
        duration: isMobile ? 2000 : 6000, // 2 seconds on mobile, 6 seconds on desktop
      });
      
      // Always redirect to filter page regardless of subscription type
      setTimeout(() => navigate('/filter'), 2000);
    },
    onError: (error: Error) => {
      toast({
        title: 'Subscription Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // When plan is selected, handle beta or paid subscriptions accordingly
  const handleSelectPlan = (planId: string) => {
    // Always verify that user has agreed to Terms of Service
    if (!tosAgreed) {
      toast({
        title: 'Terms of Service Required',
        description: 'Please agree to the Terms of Service before subscribing.',
        variant: 'destructive',
        duration: 4000,
      });
      
      // Find the appropriate terms section - works for both initial and plan change pages
      const termsSection = document.getElementById('terms-section') || document.getElementById('plan-change-terms-section');
      if (termsSection) {
        termsSection.scrollIntoView({ behavior: 'smooth' });
        termsSection.classList.add('border-red-500');
        setTimeout(() => {
          termsSection.classList.remove('border-red-500');
        }, 3000);
      }
      return;
    }
    
    setSelectedPlan(planId);
    
    // For beta plans, activate the subscription with the API
    if (planId.startsWith('beta-')) {
      setIsPendingSubscribe(true);
      activateBetaSubscription(planId);
    } else {
      // For paid plans, create a payment intent
      setIsPendingSubscribe(true);
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
  
  // Only show loading when no fallback data is available
  if ((isLoadingAuth || (isLoadingSubscription && !user?.stripe_subscription_id))) {
    return (
      <Layout pageTitle="Subscription Plans">
        <div className="container mx-auto py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <h2 className="text-2xl font-accent font-semibold">Loading subscription status...</h2>
        </div>
      </Layout>
    );
  }
  
  // If there was an error fetching subscription data, show a notification but continue
  if (subscriptionError && user?.stripe_subscription_id) {
    console.error("Error fetching subscription details:", subscriptionError);
    toast({
      title: "Subscription Information",
      description: "We're having trouble connecting to the subscription service. Showing available information.",
      variant: "default",
    });
  }

  // Show current subscription if the user has one
  if (subscriptionData?.hasSubscription || user?.stripe_subscription_id) {
    // Use subscription data if available, otherwise fallback to user data
    const status = subscriptionData?.status || user?.subscription_status || 'active';
    const currentPeriodEnd = subscriptionData?.currentPeriodEnd || 
      (user?.subscription_end_date ? new Date(user.subscription_end_date).getTime() / 1000 : (Date.now() + 90 * 24 * 60 * 60 * 1000) / 1000);
    const planId = subscriptionData?.planId || user?.subscription_plan || 
      (user?.stripe_subscription_id?.startsWith('beta-') ? 'beta-seller' : 'standard');
    
    // Find the plan from beta or future plans
    const allPlans = [...betaPlans, ...futurePlans];
    const plan = allPlans.find(p => p.id === planId) || { name: 'Unknown', price: 0, features: [] as string[] };
    
    // Check if this is a beta plan
    const isBetaPlan = planId.startsWith('beta-');
    // Get other plans that the user could upgrade or switch to
    const otherPlans = isBetaPlan 
      ? betaPlans.filter(p => p.id !== planId) 
      : futurePlans.filter(p => p.id !== planId);
    
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
              
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold font-accent">Current Plan Benefits</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {plan.features?.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Options to switch plans */}
              {otherPlans.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-gray-200 mt-6">
                  <h3 className="text-lg font-semibold font-accent">Change Your Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    You can switch to another plan that better suits your needs.
                  </p>
                  
                  {/* Terms of Service for Plan Changes */}
                  <div id="plan-change-terms-section" className="mb-6 p-4 border border-gray-300 rounded-lg bg-white transition-colors duration-300">
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="terms-plan-change" 
                        checked={tosAgreed}
                        onCheckedChange={(checked) => {
                          setTosAgreed(checked === true);
                          console.log("Terms agreed for plan change:", checked === true);
                        }}
                        className="mt-1"
                      />
                      <div>
                        <label
                          htmlFor="terms-plan-change"
                          className="text-base font-medium cursor-pointer"
                          onClick={() => setTosAgreed(!tosAgreed)}
                        >
                          I agree to the Terms of Service
                        </label>
                        <p className="text-sm text-muted-foreground mb-2">
                          You must agree to our Terms of Service before changing your subscription.
                        </p>
                        
                        {/* View Terms of Service Button */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="mb-2 font-medium">
                              View Terms of Service
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[800px]">
                            <DialogHeader>
                              <DialogTitle>Pro Horse Match - Terms of Service</DialogTitle>
                              <DialogDescription>
                                Last Updated: May 20, 2025
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="h-[450px] mt-4">
                              <div className="text-sm space-y-4 pr-4">
                                <h3 className="text-lg font-bold">1. Introduction</h3>
                                <p>Welcome to Pro Horse Match ("we," "our," or "us"). By accessing or using our website, mobile application, and services (collectively, the "Services"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Services.</p>
                                
                                <h3 className="text-lg font-bold">2. Definitions</h3>
                                <p>"User" refers to any individual who accesses or uses our Services, including horse owners, prospective buyers, and browsers.</p>
                                <p>"Content" refers to all information, text, images, videos, and other material provided by Users for listing horses or interacting on our platform.</p>
                                
                                <h3 className="text-lg font-bold">3. Account Registration</h3>
                                <p>To access certain features of our Services, you may need to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.</p>
                                
                                <h3 className="text-lg font-bold">4. Horse Listings</h3>
                                <p>Users who list horses for sale or lease ("Sellers") are solely responsible for the accuracy and completeness of their listings, including but not limited to the horse's description, characteristics, health status, price, and images.</p>
                                
                                <h3 className="text-lg font-bold">5. Transactions Between Users</h3>
                                <p>Our Services facilitate connections between Sellers and prospective buyers. We are not a party to any transaction between Users.</p>
                                
                                <h3 className="text-lg font-bold">6. Subscription Services</h3>
                                <p>We offer various subscription plans that provide enhanced features and services. The specific features included in each plan are described on our website or app.</p>
                                
                                <h3 className="text-lg font-bold">7. Prohibited Content and Conduct</h3>
                                <p>Users may not post Content or engage in conduct that is misleading, deceptive, or violates any applicable laws.</p>
                                
                                <h3 className="text-lg font-bold">8. Disclaimer of Warranties</h3>
                                <p>Our Services are provided on an "as is" and "as available" basis. We make no warranties regarding the reliability, accuracy, or availability of our Services.</p>
                                
                                <h3 className="text-lg font-bold">9. Limitation of Liability</h3>
                                <p>To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our Services.</p>
                                
                                <h3 className="text-lg font-bold">10. Governing Law</h3>
                                <p>These Terms shall be governed by and construed in accordance with the laws of Australia.</p>
                              </div>
                            </ScrollArea>
                            <DialogClose asChild>
                              <Button className="mt-4">I Understand</Button>
                            </DialogClose>
                          </DialogContent>
                        </Dialog>
                        
                        {!tosAgreed && (
                          <p className="text-sm text-red-500 font-medium">
                            Please check this box to continue
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {otherPlans.map((otherPlan) => (
                      <Card key={otherPlan.id} className={`border ${otherPlan.isPopular ? 'border-primary' : 'border-gray-200'}`}>
                        <CardHeader className="pb-2">
                          {otherPlan.isPopular && (
                            <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 text-xs font-medium rounded-bl-md">
                              Popular
                            </div>
                          )}
                          <CardTitle className="text-xl font-accent">{otherPlan.name}</CardTitle>
                          <div className="flex items-baseline mt-1">
                            <span className="text-2xl font-bold">${otherPlan.price}</span>
                            <span className="text-muted-foreground ml-1">/month</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-muted-foreground mb-4">
                            {otherPlan.description || `Get all features of the ${otherPlan.name} plan.`}
                          </div>
                          <Button 
                            className="w-full"
                            variant={otherPlan.isPopular ? "default" : "outline"}
                            disabled={otherPlan.isComingSoon || isCreatingSubscription}
                            onClick={() => handleSelectPlan(otherPlan.id)}
                          >
                            {isCreatingSubscription && selectedPlan === otherPlan.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : otherPlan.isComingSoon ? (
                              'Coming Soon'
                            ) : (
                              `Switch to ${otherPlan.name}`
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Future paid plans preview (for beta users) */}
              {isBetaPlan && (
                <div className="space-y-4 pt-6 border-t border-gray-200 mt-6">
                  <h3 className="text-lg font-semibold font-accent">Coming Soon</h3>
                  <p className="text-sm text-muted-foreground">
                    These premium plans will be available after our beta period. 
                    Enjoy free access now while it lasts!
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {convertedFuturePlans.map((futurePlan) => (
                      <Card key={futurePlan.id} className={`border ${futurePlan.isPopular ? 'border-primary' : 'border-gray-200'}`}>
                        <CardHeader className="pb-2">
                          {futurePlan.isPopular && (
                            <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 text-xs font-medium rounded-bl-md">
                              Popular
                            </div>
                          )}
                          <CardTitle className="text-lg font-accent">{futurePlan.name}</CardTitle>
                          <div className="flex items-baseline mt-1">
                            <span className="text-xl font-bold">{formatPrice(futurePlan.price)}</span>
                            <span className="text-muted-foreground ml-1">/month</span>
                          </div>
                          {currentCurrency !== 'AUD' && (
                            <span className="text-xs text-muted-foreground">
                              Original price: A${futurePlan.price.toFixed(2)}
                            </span>
                          )}
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Button 
                            className="w-full mb-3"
                            variant="outline"
                            disabled={true}
                          >
                            Coming Soon
                          </Button>
                          
                          <div className="text-xs text-muted-foreground">
                            {futurePlan.features.slice(0, 3).map((feature, i) => (
                              <div key={i} className="flex items-start gap-1 mb-1">
                                <Check className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </div>
                            ))}
                            {futurePlan.features.length > 3 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                +{futurePlan.features.length - 3} more features
                              </div>
                            )}
                          </div>
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
  
  // Show subscription plans for new subscribers
  return (
    <Layout pageTitle="Subscription Plans">
      <div className="w-full py-10" style={{ backgroundColor: "#e4e2dd" }}>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-accent font-bold mb-2">Beta Access</h1>
            <p className="text-muted-foreground">Enjoy full access during our Beta Launch Period. This subscription is free and is for a limited time only. Enjoy exploring the features of this app. We hope you find your perfect match!</p>
          </div>
          
          {/* Terms of Service Agreement - Global for all plans */}
          <div id="terms-section" className="mb-8 p-4 border border-gray-300 rounded-lg bg-white transition-colors duration-300">
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="terms-global" 
                checked={tosAgreed}
                onCheckedChange={(checked) => {
                  setTosAgreed(checked === true);
                  console.log("Terms agreed:", checked === true);
                }}
                className="mt-1"
              />
              <div>
                <label
                  htmlFor="terms-global"
                  className="text-base font-medium cursor-pointer"
                  onClick={() => setTosAgreed(!tosAgreed)}
                >
                  I agree to the Terms of Service
                </label>
                <p className="text-sm text-muted-foreground mb-2">
                  You must agree to our Terms of Service before subscribing to any plan or changing your subscription.
                </p>
                
                {/* View Terms of Service Button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="mb-2 font-medium">
                      View Terms of Service
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px]">
                    <DialogHeader>
                      <DialogTitle>Pro Horse Match - Terms of Service</DialogTitle>
                      <DialogDescription>
                        Last Updated: May 20, 2025
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[450px] mt-4">
                      <div className="text-sm space-y-4 pr-4">
                        <h3 className="text-lg font-bold">1. Introduction</h3>
                        <p>Welcome to Pro Horse Match ("we," "our," or "us"). By accessing or using our website, mobile application, and services (collectively, the "Services"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Services.</p>
                        
                        <h3 className="text-lg font-bold">2. Definitions</h3>
                        <p>"User" refers to any individual who accesses or uses our Services, including horse owners, prospective buyers, and browsers.</p>
                        <p>"Content" refers to all information, text, images, videos, and other material provided by Users for listing horses or interacting on our platform.</p>
                        
                        <h3 className="text-lg font-bold">3. Account Registration</h3>
                        <p>To access certain features of our Services, you may need to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.</p>
                        
                        <h3 className="text-lg font-bold">4. Horse Listings</h3>
                        <p>Users who list horses for sale or lease ("Sellers") are solely responsible for the accuracy and completeness of their listings, including but not limited to the horse's description, characteristics, health status, price, and images.</p>
                        
                        <h3 className="text-lg font-bold">5. Transactions Between Users</h3>
                        <p>Our Services facilitate connections between Sellers and prospective buyers. We are not a party to any transaction between Users.</p>
                        
                        <h3 className="text-lg font-bold">6. Subscription Services</h3>
                        <p>We offer various subscription plans that provide enhanced features and services. The specific features included in each plan are described on our website or app.</p>
                        
                        <h3 className="text-lg font-bold">7. Prohibited Content and Conduct</h3>
                        <p>Users may not post Content or engage in conduct that is misleading, deceptive, or violates any applicable laws.</p>
                        
                        <h3 className="text-lg font-bold">8. Disclaimer of Warranties</h3>
                        <p>Our Services are provided on an "as is" and "as available" basis. We make no warranties regarding the reliability, accuracy, or availability of our Services.</p>
                        
                        <h3 className="text-lg font-bold">9. Limitation of Liability</h3>
                        <p>To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our Services.</p>
                        
                        <h3 className="text-lg font-bold">10. Governing Law</h3>
                        <p>These Terms shall be governed by and construed in accordance with the laws of Australia.</p>
                      </div>
                    </ScrollArea>
                    <DialogClose asChild>
                      <Button className="mt-4">I Understand</Button>
                    </DialogClose>
                  </DialogContent>
                </Dialog>
                
                {!tosAgreed && (
                  <p className="text-sm text-red-500 font-medium">
                    Please check this box to continue
                  </p>
                )}
              </div>
            </div>
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
                        disabled={!tosAgreed || isPendingSubscribe}
                      >
                        {isPendingSubscribe ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          plan.buttonText || "Get Started"
                        )}
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
              <h3 className="text-xl font-accent mb-3">Support Our Development</h3>
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