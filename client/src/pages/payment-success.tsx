import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useLocation } from 'wouter';

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  const [countdown, setCountdown] = useState(5);

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
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <CheckCircle className="mx-auto mb-6 h-20 w-20 text-green-500" />
          <h1 className="text-3xl font-accent font-bold mb-4">Payment Successful!</h1>
          <p className="text-lg text-neutral-600 mb-6">
            Thank you for your purchase. Your transaction has been completed successfully.
          </p>
          <p className="text-neutral-500 mb-8">
            You will be redirected to the home page in {countdown} seconds.
          </p>
          <Button
            onClick={() => navigate('/')}
            className="min-w-[150px]"
          >
            Return Home
          </Button>
        </div>
      </div>
    </Layout>
  );
}