import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Mail, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    // Verify the email
    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const result = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(result.message);
        } else {
          setStatus('error');
          setMessage(result.message || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Network error occurred');
      }
    };

    verifyEmail();
  }, []);

  const handleGoToLogin = () => {
    setLocation('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && (
              <Loader2 className="h-12 w-12 text-amber-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Your email has been successfully verified. You can now log in to your ProHorseMatch account.
              </p>
              <Button 
                onClick={handleGoToLogin}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                Go to Login
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                The verification link may have expired or is invalid. Please try registering again or contact support.
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={() => setLocation('/auth/register')}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  Back to Registration
                </Button>
                <Button 
                  onClick={() => setLocation('/auth/login')}
                  variant="outline"
                  className="w-full"
                >
                  Try Login Instead
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}