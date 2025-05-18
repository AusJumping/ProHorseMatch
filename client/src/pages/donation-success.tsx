import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Heart, CheckCircle } from 'lucide-react';

export default function DonationSuccess() {
  const [location, navigate] = useLocation();
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const amount = searchParams.get('amount') || '10';

  // Redirect after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/subscription');
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Layout pageTitle="Thank You for Your Donation">
      <div className="container max-w-xl mx-auto py-10">
        <div className="bg-[#e4e2dd] rounded-xl p-8 text-center space-y-6">
          <div className="relative mx-auto h-20 w-20 rounded-full bg-white flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-[#cdac6e]" />
          </div>

          <Heart className="h-16 w-16 text-[#cdac6e] mx-auto" />
          
          <h1 className="text-3xl font-accent font-bold">Thank You!</h1>
          
          <p className="text-xl">
            Your generous donation of <span className="font-semibold">${parseFloat(amount).toLocaleString()}</span> to Pro Horse Match has been received.
          </p>
          
          <p className="text-neutral-600">
            Your support helps us continue developing the platform and provide better services to the equestrian community.
          </p>
          
          <div className="pt-4">
            <Button 
              onClick={() => navigate('/subscription')}
              className="bg-[#cdac6e] hover:bg-[#b69a5e]"
            >
              Return to Subscription Page
            </Button>
          </div>
          
          <p className="text-sm text-neutral-500">
            You will be automatically redirected in a few seconds.
          </p>
        </div>
      </div>
    </Layout>
  );
}