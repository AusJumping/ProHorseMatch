import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import Layout from '@/components/Layout';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Heart } from 'lucide-react';
import { apiRequest } from "@/lib/queryClient";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// The checkout form component that uses Stripe Elements
const DonationCheckoutForm = ({ amount }: { amount: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: "Error",
        description: "Stripe is not available. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Use the confirmPayment method with the elements instance
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/donation-success?amount=${amount}`,
        },
        redirect: 'if_required'
      });

      if (error) {
        console.error('Payment error:', error);
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred processing your donation",
          variant: "destructive",
        });
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        toast({
          title: "Thank You!",
          description: `Your $${amount} donation has been received`,
        });
        
        setIsPaid(true);
        setTimeout(() => {
          navigate('/donation-success');
        }, 1000);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      toast({
        title: "Payment Failed",
        description: err.message || "An error occurred processing your donation",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  }

  return (
    <div className="bg-[#e4e2dd] rounded-xl p-6 shadow-sm max-w-xl mx-auto">
      {isPaid ? (
        <div className="text-center py-10">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-[#cdac6e]" />
          <h2 className="text-2xl font-accent font-bold mb-2">Donation Successful!</h2>
          <p className="text-neutral-600 mb-6">
            Thank you for your generous support. You will be redirected shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <div className="text-center mb-6">
              <Heart className="mx-auto mb-4 h-12 w-12 text-[#cdac6e]" />
              <h2 className="text-2xl font-accent font-bold mb-2">Complete Your Donation</h2>
              <p className="text-neutral-600 mb-6">
                You're donating <span className="font-semibold">${amount.toLocaleString()}</span> to support Pro Horse Match
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg mb-6">
              <PaymentElement />
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full bg-[#cdac6e] hover:bg-[#b69a5e]" 
            disabled={!stripe || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Donate $${amount.toLocaleString()}`
            )}
          </Button>
          <Button 
            type="button"
            variant="ghost" 
            className="w-full mt-2" 
            onClick={() => navigate('/subscription')}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </form>
      )}
    </div>
  );
};

// Main donation checkout page
export default function DonationCheckout() {
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const amount = parseInt(searchParams.get('amount') || '10', 10);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();
  
  useEffect(() => {
    // Get a payment intent for the donation
    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log("Creating donation payment intent for amount:", amount);
        
        const response = await apiRequest('POST', '/api/create-donation', {
          amount,
          currency: 'usd',
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to create payment intent');
        }
        
        if (!data.clientSecret) {
          throw new Error('No client secret returned from the server');
        }
        
        console.log("Payment intent created successfully");
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        console.error("Error creating payment intent:", err);
        setError(err.message || 'An unexpected error occurred');
        toast({
          title: "Error",
          description: err.message || "Failed to initialize donation",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    createPaymentIntent();
  }, [amount, toast, navigate]);

  if (isLoading) {
    return (
      <Layout pageTitle="Processing Donation">
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#cdac6e] border-t-transparent rounded-full" aria-label="Loading"/>
        </div>
      </Layout>
    );
  }

  if (error || !clientSecret) {
    return (
      <Layout pageTitle="Donation Error">
        <div className="text-center py-12">
          <h2 className="text-2xl font-accent font-bold mb-3">Donation Error</h2>
          <p className="text-neutral-600 mb-4">
            {error || "Unable to initialize donation. Please try again later."}
          </p>
          <Button 
            onClick={() => navigate('/subscription')} 
            className="mt-2"
          >
            Go Back
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Complete Your Donation">
      <div className="container py-10">
        <Elements stripe={stripePromise} options={{ 
          clientSecret,
          appearance: { 
            theme: 'stripe',
            variables: {
              colorPrimary: '#cdac6e',
            },
          } 
        }}>
          <DonationCheckoutForm amount={amount} />
        </Elements>
      </div>
    </Layout>
  );
}