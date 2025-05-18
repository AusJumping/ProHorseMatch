import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Heart, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';

export default function DonationSuccessPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    // Show a success message when the page loads
    toast({
      title: "Thank You for Your Donation!",
      description: "Your contribution will help improve Pro Horse Match.",
    });
  }, [toast]);
  
  return (
    <div className="container mx-auto py-20 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto bg-amber-100 rounded-full p-3 mb-4 w-16 h-16 flex items-center justify-center">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-accent">Thank You!</CardTitle>
          <CardDescription>
            Your generous donation has been received
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex gap-3 items-center mb-3">
              <Gift className="text-primary h-5 w-5" />
              <p className="font-medium">How your donation helps</p>
            </div>
            <ul className="space-y-2 text-sm pl-8 list-disc">
              <li>Fund new feature development</li>
              <li>Improve user experience and interface design</li>
              <li>Enhance matching algorithms for better horse/buyer matches</li>
              <li>Expand platform availability to more countries</li>
            </ul>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>A receipt has been sent to your email address if you were logged in.</p>
          </div>
          
          <div className="space-y-3 pt-4">
            <Button className="w-full" onClick={() => navigate('/')}>
              Back to Home
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate('/subscription')}>
              View Subscription Plans <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}