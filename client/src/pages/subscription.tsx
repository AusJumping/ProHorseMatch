import { useState, useEffect } from 'react';
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
import { NotificationPromptModal } from '@/components/NotificationPromptModal';

// Ensure we have the public key
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing environment variable: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Beta plans - Free during beta period
const betaPlans = [
  {
    id: 'beta-seller',
    name: 'BETA SELLER',
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
    name: 'BETA SEARCHING',
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">ProHorseMatch Terms and Conditions</DialogTitle>
          <DialogDescription>
            Effective Date: January 2025
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[500px] mt-4 pr-4">
          <div className="text-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold mb-2">1. Introduction</h3>
              <p>Welcome to ProHorseMatch ("we," "our," or "us"). By accessing or using our website, mobile application, and related services (collectively, the "Services"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you may not use our Services.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">2. Definitions</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>"User" refers to any individual or entity who accesses or uses our Services, including horse owners, prospective buyers, or browsers.</li>
                <li>"Content" refers to all information, text, images, videos, and other materials provided by Users on the platform.</li>
                <li>"Sellers" are Users who create horse listings for sale or lease.</li>
                <li>"Searchers" are Users seeking to purchase horses through contact made with 'Sellers' using our Services.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">3. Eligibility</h3>
              <p>You must be at least 18 years old, or the legal age of majority in your jurisdiction, to use our Services. By using the Services, you represent and warrant that you meet these requirements.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">4. Account Registration</h3>
              <p>To access certain features, you may need to create an account. You agree to provide accurate, current, and complete information, and to update it as necessary. You are responsible for safeguarding your login details and for all activities under your account.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">5. Horse Listings</h3>
              <p>Sellers are solely responsible for the accuracy and completeness of their listings, including the horse's description, age, health, performance history, price, and images. ProHorseMatch does not verify or guarantee the accuracy of listings.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">6. Transactions Between Users</h3>
              <p>Our Services facilitate introductions between Sellers and Buyers. We are not a party to any transaction, agreement, or dispute between Users. All negotiations, contracts, and exchanges of funds take place directly between Users.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">7. Subscription Services</h3>
              <p>We may offer subscription plans with enhanced features. Details of these plans, including pricing and benefits, are provided in-app or on our website. Subscriptions are non-transferable and may be subject to auto-renewal unless cancelled in accordance with our cancellation policy.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">8. Payments and Refunds</h3>
              <p>All payments for subscription services are processed through third-party providers. By purchasing a subscription, you agree to abide by the payment terms provided at checkout. Refunds are granted only where required by law.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">9. Prohibited Content and Conduct</h3>
              <p className="mb-2">You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Post false, misleading, or deceptive Content.</li>
                <li>Infringe on any intellectual property rights.</li>
                <li>Post Content that is unlawful, offensive, defamatory, obscene, or harmful.</li>
                <li>Attempt to interfere with or disrupt the Services.</li>
              </ul>
              <p className="mt-2">We reserve the right to remove Content or suspend accounts that violate these Terms.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">10. Communication with Users</h3>
              <p>By creating an account, you consent to receive communications from us electronically. We may contact you via email from time to time regarding issues, updates, or changes to our Services and offerings.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">11. Intellectual Property</h3>
              <p>All trademarks, logos, and proprietary materials used in connection with the Services are owned by us or our licensors. You may not use, copy, or distribute our intellectual property without prior written consent.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">12. Disclaimer of Warranties</h3>
              <p>The Services are provided "as is" and "as available." We make no warranties or representations about the accuracy, reliability, or availability of the Services or Content.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">13. Limitation of Liability</h3>
              <p>To the maximum extent permitted by law, ProHorseMatch shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Services.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">14. Indemnity</h3>
              <p>You agree to indemnify and hold harmless ProHorseMatch, its affiliates, and employees from any claims, damages, losses, or expenses (including legal fees) arising out of your use of the Services or violation of these Terms.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">15. Termination</h3>
              <p>We may suspend or terminate your account or access to the Services at any time if we reasonably believe you have violated these Terms or engaged in harmful conduct.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">16. Governing Law</h3>
              <p>These Terms are governed by the laws of Australia. Any disputes will be resolved exclusively in the courts of Australia.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">17. Changes to the Terms</h3>
              <p>We reserve the right to modify these Terms at any time. If changes are made, we will notify Users by posting the updated Terms on our website or app. Continued use of the Services after such updates constitutes acceptance of the revised Terms.</p>
            </div>
          </div>
        </ScrollArea>
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
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const { toast } = useToast();
  const { currentCurrency, convertPrice, formatPrice } = useCurrency();
  
  // Get authentication status
  const { data: user, isLoading: isLoadingAuth } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // Handle reminder token auto-login from email
  const reminderLoginMutation = useMutation({
    mutationFn: async (reminderToken: string) => {
      const response = await apiRequest('POST', '/api/auth/reminder-login', { reminderToken });
      return response;
    },
    onSuccess: (data) => {
      console.log('Reminder token login successful:', data);
      
      // Store auth token
      if (data.user?.auth_token) {
        localStorage.setItem('auth_token', data.user.auth_token);
      }
      
      // Update auth cache with user data
      queryClient.setQueryData(['/api/auth/me'], data.user);
      
      // Show success toast
      toast({
        title: "Welcome back!",
        description: "You've been logged in automatically.",
      });
      
      // Remove the token from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    },
    onError: (error: any) => {
      console.error('Reminder token login failed:', error);
      toast({
        title: "Link Expired",
        description: "This login link has expired or already been used. Please login manually.",
        variant: "destructive",
      });
      // Remove the token from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  });
  
  // Check for reminder token in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reminderToken = urlParams.get('reminderToken');
    
    if (reminderToken && !user) {
      console.log('Found reminder token in URL, attempting auto-login...');
      reminderLoginMutation.mutate(reminderToken);
    }
  }, []); // Only run on mount
  
  // Convert subscription prices to user's preferred currency
  useEffect(() => {
    const convertPrices = async () => {
      try {
        // Only convert if we have a different currency than AUD (base currency for plans)
        if (currentCurrency !== 'AUD') {
          const newPlans = await Promise.all(futurePlans.map(async (plan) => {
            const convertedPrice = await convertPrice(plan.price, 'AUD');
            return {
              ...plan,
              price: parseFloat(convertedPrice.toFixed(2))
            };
          }));
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
  }, [currentCurrency, convertPrice]);
  
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
        description: 'You are now subscribed to the Beta version of this site. This subscription is free and is for a limited time only.',
        duration: isMobile ? 2000 : 4000,
      });
      
      // Always show the notification prompt modal after subscription
      // Even if push isn't fully supported, we want to encourage PWA installation
      console.log('About to show notification prompt modal');
      setTimeout(() => {
        console.log('Setting showNotificationPrompt to true');
        setShowNotificationPrompt(true);
      }, 500);
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
      duration: 4000,
    });
    
    // Always show the notification prompt modal after subscription
    // Even if push isn't fully supported, we want to encourage PWA installation
    setTimeout(() => setShowNotificationPrompt(true), 500);
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
                  
                  {/* Admin test button - temporarily for testing notification modal */}
                  {user?.email === 'info@australianjumping.com.au' && (
                    <Button 
                      onClick={() => setShowNotificationPrompt(true)}
                      variant="outline"
                      className="mt-4"
                    >
                      Test Notification Modal
                    </Button>
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
                              <DialogTitle>Terms of Service</DialogTitle>
                              <DialogDescription>
                                Effective Date: 21 July 2025
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="h-[450px] mt-4">
                              <div className="text-sm space-y-4 pr-4">
                                <h3 className="text-lg font-bold">Disclaimer of Liability and User Responsibility</h3>
                                
                                <div>
                                  <h4 className="font-semibold">1. Content Accuracy and Listings</h4>
                                  <p>ProHorseMatch is a platform that facilitates connections between buyers and sellers of performance horses. All listings, including descriptions, images, health records, training history, and other horse-related content, are provided by the users (sellers). ProHorseMatch does not create, verify, or endorse the accuracy, completeness, legality, or authenticity of any listing content. Users of the platform acknowledge and agree that the responsibility for all content posted lies solely with the user who posted it.</p>
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
                                  <ul className="list-disc pl-5 mt-2">
                                    <li>any inaccuracies or omissions in listing content;</li>
                                    <li>the condition, health, or behaviour of any horse;</li>
                                    <li>any transaction entered into between users of the platform.</li>
                                  </ul>
                                  <p className="mt-2">By using ProHorseMatch, you agree that any legal responsibility for the quality, health, condition, or fitness for purpose of any horse lies solely between the buyer and seller, and not with ProHorseMatch.</p>
                                </div>
                                
                                <h3 className="text-lg font-bold">5. Subscription Terms</h3>
                                
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
                                  <h4 className="font-semibold">5.5 Free Trials and Beta Subscriptions</h4>
                                  <p>From time to time, ProHorseMatch may offer free trial or beta access subscriptions. These will also auto-renew into paid subscriptions unless cancelled before the trial or beta period ends. You will be notified via email in advance before any billing begins.</p>
                                </div>
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
        
        {/* Notification Prompt Modal - for existing subscriber testing */}
        <NotificationPromptModal
          isOpen={showNotificationPrompt}
          onClose={() => {
            setShowNotificationPrompt(false);
            navigate('/filter');
          }}
          onComplete={() => {
            navigate('/filter');
          }}
        />
      </Layout>
    );
  }
  
  // Show subscription plans for new subscribers
  return (
    <Layout pageTitle="Subscription Plans">
      <div className="w-full py-10" style={{ backgroundColor: "#e4e2dd" }}>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-accent font-bold mb-2">Beta Access - No Payment Details Needed</h1>
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
                  <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">ProHorseMatch Terms and Conditions</DialogTitle>
                      <DialogDescription>
                        Effective Date: January 2025
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[500px] mt-4 pr-4">
                      <div className="text-sm space-y-4">
                        <div>
                          <h3 className="text-lg font-bold mb-2">1. Introduction</h3>
                          <p>Welcome to ProHorseMatch ("we," "our," or "us"). By accessing or using our website, mobile application, and related services (collectively, the "Services"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you may not use our Services.</p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">2. Definitions</h3>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>"User" refers to any individual or entity who accesses or uses our Services, including horse owners, prospective buyers, or browsers.</li>
                            <li>"Content" refers to all information, text, images, videos, and other materials provided by Users on the platform.</li>
                            <li>"Sellers" are Users who create horse listings for sale or lease.</li>
                            <li>"Searchers" are Users seeking to purchase horses through contact made with 'Sellers' using our Services.</li>
                          </ul>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">3. Eligibility</h3>
                          <p>You must be at least 18 years old, or the legal age of majority in your jurisdiction, to use our Services. By using the Services, you represent and warrant that you meet these requirements.</p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">4. Account Registration</h3>
                          <p>To access certain features, you may need to create an account. You agree to provide accurate, current, and complete information, and to update it as necessary. You are responsible for safeguarding your login details and for all activities under your account.</p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">5. Horse Listings</h3>
                          <p>Sellers are solely responsible for the accuracy and completeness of their listings, including the horse's description, age, health, performance history, price, and images. ProHorseMatch does not verify or guarantee the accuracy of listings.</p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">6. Transactions Between Users</h3>
                          <p>Our Services facilitate introductions between Sellers and Buyers. We are not a party to any transaction, agreement, or dispute between Users. All negotiations, contracts, and exchanges of funds take place directly between Users.</p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">7. Subscription Services</h3>
                          <p>We may offer subscription plans with enhanced features. Details of these plans, including pricing and benefits, are provided in-app or on our website. Subscriptions are non-transferable and may be subject to auto-renewal unless cancelled in accordance with our cancellation policy.</p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">8. Payments and Refunds</h3>
                          <p>All payments for subscription services are processed through third-party providers. By purchasing a subscription, you agree to abide by the payment terms provided at checkout. Refunds are granted only where required by law.</p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">9. Prohibited Content and Conduct</h3>
                          <p className="mb-2">You agree not to:</p>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Post false, misleading, or deceptive Content.</li>
                            <li>Infringe on any intellectual property rights.</li>
                            <li>Post Content that is unlawful, offensive, defamatory, obscene, or harmful.</li>
                            <li>Attempt to interfere with or disrupt the Services.</li>
                          </ul>
                          <p className="mt-2">We reserve the right to remove Content or suspend accounts that violate these Terms.</p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">10. Communication with Users</h3>
                          <p>By creating an account, you consent to receive communications from us electronically. We may contact you via email from time to time regarding issues, updates, or changes to our Services and offerings.</p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">11. Intellectual Property</h3>
                          <p>All trademarks, logos, and proprietary materials used in connection with the Services are owned by us or our licensors. You may not use, copy, or distribute our intellectual property without prior written consent.</p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">12. Disclaimer of Warranties</h3>
                          <p>The Services are provided "as is" and "as available." We make no warranties or representations about the accuracy, reliability, or availability of the Services or Content.</p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">13. Limitation of Liability</h3>
                          <p>To the maximum extent permitted by law, ProHorseMatch shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Services.</p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">14. Indemnity</h3>
                          <p>You agree to indemnify and hold harmless ProHorseMatch, its affiliates, and employees from any claims, damages, losses, or expenses (including legal fees) arising out of your use of the Services or violation of these Terms.</p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">15. Termination</h3>
                          <p>We may suspend or terminate your account or access to the Services at any time if we reasonably believe you have violated these Terms or engaged in harmful conduct.</p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">16. Governing Law</h3>
                          <p>These Terms are governed by the laws of Australia. Any disputes will be resolved exclusively in the courts of Australia.</p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">17. Changes to the Terms</h3>
                          <p>We reserve the right to modify these Terms at any time. If changes are made, we will notify Users by posting the updated Terms on our website or app. Continued use of the Services after such updates constitutes acceptance of the revised Terms.</p>
                        </div>
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
      
      {/* Notification Prompt Modal - shown after subscription activation */}
      <NotificationPromptModal
        isOpen={showNotificationPrompt}
        onClose={() => {
          setShowNotificationPrompt(false);
          navigate('/filter');
        }}
        onComplete={() => {
          navigate('/filter');
        }}
      />
    </Layout>
  );
}