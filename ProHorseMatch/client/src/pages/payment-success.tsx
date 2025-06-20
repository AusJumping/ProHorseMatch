import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  const [countdown, setCountdown] = useState(5);
  const [location] = useLocation();
  const [purchaseDetails, setPurchaseDetails] = useState({
    horseName: '',
    amount: 0,
    currency: 'AUD',
    transactionId: ''
  });

  useEffect(() => {
    // Try to parse payment details from URL search params
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const paymentIntent = searchParams.get('payment_intent');
      const horseName = searchParams.get('horse_name') || 'Your Horse';
      const amount = parseFloat(searchParams.get('amount') || '0');
      const currency = searchParams.get('currency') || 'AUD';
      
      setPurchaseDetails({
        horseName,
        amount,
        currency: currency.toUpperCase(),
        transactionId: paymentIntent || 'Unknown'
      });
    } catch (error) {
      console.error('Failed to parse payment details:', error);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <Layout pageTitle="Payment Successful">
      <div className="container max-w-xl mx-auto py-16">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-white text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16" />
            <h1 className="text-3xl font-accent font-bold mb-2">Payment Successful!</h1>
            <p className="text-lg opacity-90">
              Thank you for your purchase
            </p>
          </div>
          
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="rounded-lg bg-neutral-50 p-4">
                <h3 className="text-sm font-medium text-neutral-500 mb-1">Purchase Details</h3>
                <p className="text-xl font-accent font-bold">{purchaseDetails.horseName}</p>
                <p className="text-2xl font-bold mt-2">{purchaseDetails.currency} ${purchaseDetails.amount.toLocaleString()}</p>
              </div>
              
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Transaction ID</span>
                  <span className="font-medium">{purchaseDetails.transactionId.slice(0, 16)}...</span>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Date</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
              
              <p className="text-neutral-500 text-sm text-center mt-6">
                You will be redirected to the home page in {countdown} seconds.
              </p>
              
              <div className="flex gap-3 mt-4">
                <Button 
                  onClick={() => navigate('/')} 
                  className="w-full"
                  variant="outline"
                >
                  Return Home
                </Button>
                <Button
                  onClick={() => navigate('/browse')}
                  className="w-full"
                >
                  Browse More Horses <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}