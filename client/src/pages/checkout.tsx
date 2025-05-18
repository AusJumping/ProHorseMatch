import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Layout from '@/components/Layout';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ horseId, horsePrice, horseName }: { horseId: number, horsePrice: number, horseName: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/payment-success",
        },
        redirect: 'if_required'
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred processing your payment",
          variant: "destructive",
        });
        setIsProcessing(false);
      } else {
        toast({
          title: "Payment Successful!",
          description: `Thank you for your purchase of ${horseName}`,
        });
        setIsPaid(true);
        // In a real app, we'd record the successful payment on the server
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (err: any) {
      toast({
        title: "Payment Failed",
        description: err.message || "An error occurred processing your payment",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm max-w-xl mx-auto">
      {isPaid ? (
        <div className="text-center py-10">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h2 className="text-2xl font-accent font-bold mb-2">Payment Successful!</h2>
          <p className="text-neutral-600 mb-6">
            Thank you for your purchase of {horseName}. You will be redirected shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <h2 className="text-2xl font-accent font-bold mb-2">Complete Your Purchase</h2>
            <p className="text-neutral-600 mb-6">
              You're purchasing <span className="font-semibold">{horseName}</span> for{' '}
              <span className="font-semibold">${horsePrice.toLocaleString()}</span>
            </p>
            <div className="bg-neutral-50 p-4 rounded-lg mb-6">
              <PaymentElement />
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!stripe || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${horsePrice.toLocaleString()}`
            )}
          </Button>
        </form>
      )}
    </div>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [horseDetails, setHorseDetails] = useState<{id: number, name: string, price: number} | null>(null);
  const [location] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Extract horse ID from the URL 
    const horseId = location.split('/').pop();

    if (!horseId) {
      toast({
        title: "Error",
        description: "No horse specified for purchase",
        variant: "destructive"
      });
      return;
    }

    // First, get the horse details
    const fetchHorseDetails = async () => {
      try {
        const response = await fetch(`/api/horses/${horseId}`);
        if (!response.ok) throw new Error("Failed to fetch horse details");
        
        const horse = await response.json();
        setHorseDetails({
          id: horse.id,
          name: horse.name,
          price: horse.price
        });

        // Then create a payment intent
        const paymentResponse = await apiRequest("POST", "/api/create-payment-intent", { 
          horseId: horse.id,
          amount: horse.price 
        });
        
        const paymentData = await paymentResponse.json();
        setClientSecret(paymentData.clientSecret);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to initialize payment",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHorseDetails();
  }, [location, toast]);

  if (isLoading) {
    return (
      <Layout pageTitle="Checkout">
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
        </div>
      </Layout>
    );
  }

  if (!clientSecret || !horseDetails) {
    return (
      <Layout pageTitle="Checkout">
        <div className="text-center py-12">
          <h2 className="text-2xl font-accent font-bold mb-3">Payment Error</h2>
          <p className="text-neutral-600">
            Unable to initialize payment. Please try again later.
          </p>
          <Button 
            onClick={() => window.history.back()} 
            className="mt-6"
          >
            Go Back
          </Button>
        </div>
      </Layout>
    );
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <Layout pageTitle={`Checkout - ${horseDetails.name}`}>
      <div className="container py-10">
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
          <CheckoutForm 
            horseId={horseDetails.id}
            horsePrice={horseDetails.price}
            horseName={horseDetails.name}
          />
        </Elements>
      </div>
    </Layout>
  );
}