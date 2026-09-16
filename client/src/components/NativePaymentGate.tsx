import { Capacitor } from '@capacitor/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import Layout from '@/components/Layout';

// Apple and Google require their own in-app purchase system for anything
// sold inside the native app itself. Rather than build that (and give them
// a cut), the app simply never sells anything inside the native shell -
// this screen replaces any payment/subscription page when running there,
// sending the person to the website to pay instead. Nothing changes for
// the website itself, which keeps using Stripe directly.
export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export function NativePaymentGate({ path = '/subscription' }: { path?: string }) {
  return (
    <Layout pageTitle="Subscription">
      <div className="container mx-auto py-20 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-accent">Manage on our website</CardTitle>
            <CardDescription>
              Subscriptions and payments are handled at prohorsematch.com
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              To subscribe, change your plan, or make a payment, open prohorsematch.com in your phone's browser. Everything else in the app works as normal.
            </p>
            <Button
              className="w-full"
              onClick={() => window.open(`https://prohorsematch.com${path}`, '_system')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open prohorsematch.com
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
