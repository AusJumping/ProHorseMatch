import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Mail, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function VerifyEmail() {
  const [, params] = useRoute("/verify-email/:token?");
  const [, setLocation] = useLocation();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error' | 'expired'>('pending');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    // Check for token in URL params first (path parameter)
    if (params?.token) {
      verifyToken(params.token);
      return;
    }
    
    // Check for token in query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const queryToken = urlParams.get('token');
    if (queryToken) {
      verifyToken(queryToken);
    }
  }, [params?.token]);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`);
      const data = await response.json();
      
      if (response.ok) {
        setVerificationStatus('success');
        setMessage(data.message);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          setLocation('/auth');
        }, 3000);
      } else {
        if (data.message.includes('expired')) {
          setVerificationStatus('expired');
        } else {
          setVerificationStatus('error');
        }
        setMessage(data.message);
      }
    } catch (error) {
      setVerificationStatus('error');
      setMessage('Network error occurred. Please try again.');
    }
  };

  const resendVerification = async () => {
    if (!email) return;
    
    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('Verification email sent! Please check your inbox.');
        setVerificationStatus('pending');
      } else {
        setMessage(data.message || 'Failed to resend verification email');
      }
    } catch (error: any) {
      setMessage('Network error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const getIcon = () => {
    switch (verificationStatus) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />;
      case 'error':
      case 'expired':
        return <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />;
      case 'pending':
      default:
        return <Mail className="h-16 w-16 text-blue-500 mx-auto mb-4" />;
    }
  };

  const getTitle = () => {
    switch (verificationStatus) {
      case 'success':
        return 'Email Verified Successfully!';
      case 'error':
        return 'Verification Failed';
      case 'expired':
        return 'Verification Link Expired';
      case 'pending':
      default:
        return params?.token ? 'Verifying Email...' : 'Email Verification';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {getIcon()}
          <CardTitle className="text-2xl font-bold text-gray-900">
            {getTitle()}
          </CardTitle>
          <CardDescription>
            {verificationStatus === 'success' && 'You will be redirected to login shortly.'}
            {verificationStatus === 'pending' && !params?.token && 'Enter your email to resend verification link.'}
            {verificationStatus === 'expired' && 'Request a new verification link below.'}
            {verificationStatus === 'error' && 'There was an issue verifying your email.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {message && (
            <Alert className={verificationStatus === 'success' ? 'border-green-200 bg-green-50' : verificationStatus === 'error' || verificationStatus === 'expired' ? 'border-red-200 bg-red-50' : ''}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {(verificationStatus === 'expired' || verificationStatus === 'error' || (!params?.token && verificationStatus === 'pending')) && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                />
              </div>
              
              <Button 
                onClick={resendVerification} 
                disabled={!email || isResending}
                className="w-full"
              >
                {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Verification Email
              </Button>
            </div>
          )}

          {verificationStatus === 'success' && (
            <div className="text-center">
              <Button 
                onClick={() => setLocation('/auth')}
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          )}

          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/')}
              className="w-full"
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}