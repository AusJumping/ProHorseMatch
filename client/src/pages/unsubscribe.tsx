import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, AlertCircle } from "lucide-react";

export default function UnsubscribePage() {
  const [location] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedEmail = params.get('email');

    if (!encodedEmail) {
      setStatus('invalid');
      return;
    }

    let email: string;
    try {
      email = atob(encodedEmail.replace(/-/g, '+').replace(/_/g, '/'));
    } catch {
      setStatus('invalid');
      return;
    }

    fetch('/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
      .then(res => {
        if (res.ok) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F6F0] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#2b2b2b]">ProHorseMatch</h1>
          <p className="text-[#6B5B3D] mt-1">Connecting Performance Horses with new owners</p>
        </div>

        <Card className="border border-[#E8E3D3] shadow-sm">
          <CardHeader className="text-center pb-4">
            {status === 'loading' && (
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
              </div>
            )}
            {status === 'success' && (
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
            )}
            {(status === 'error' || status === 'invalid') && (
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
            )}
            <CardTitle className="text-xl text-[#2b2b2b]">
              {status === 'loading' && 'Unsubscribing...'}
              {status === 'success' && 'You\'ve been unsubscribed'}
              {status === 'error' && 'Something went wrong'}
              {status === 'invalid' && 'Invalid link'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {status === 'success' && (
              <>
                <p className="text-[#4A453E]">
                  You've been successfully removed from ProHorseMatch notification emails. You won't receive match or message emails anymore.
                </p>
                <p className="text-sm text-[#6B5B3D]">
                  You can re-enable emails at any time from your profile settings.
                </p>
              </>
            )}
            {status === 'error' && (
              <p className="text-[#4A453E]">
                We couldn't process your unsubscribe request. Please try again or contact us at info@australianjumping.com.au.
              </p>
            )}
            {status === 'invalid' && (
              <p className="text-[#4A453E]">
                This unsubscribe link appears to be invalid. Please use the link from your email.
              </p>
            )}
            {status === 'loading' && (
              <p className="text-[#4A453E]">Please wait while we process your request...</p>
            )}
            <div className="pt-2">
              <Button
                variant="outline"
                className="border-[#CDAC6E] text-[#6B5B3D] hover:bg-[#F5E6D3]"
                onClick={() => window.location.href = '/'}
              >
                <Mail className="mr-2 h-4 w-4" />
                Back to ProHorseMatch
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[#6B5B3D] mt-6">
          © 2025 ProHorseMatch • Connecting Performance Horses with new owners
        </p>
      </div>
    </div>
  );
}
