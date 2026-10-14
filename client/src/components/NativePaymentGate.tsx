import { Capacitor } from '@capacitor/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/Layout';

// Apple and Google require their own in-app purchase system for anything sold inside the
// native app itself, so the app never sells anything inside the native shell. This screen
// replaces any payment/subscription page when running there. The website is unaffected and
// keeps using Stripe directly.
export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export function NativePaymentGate({ path = '/subscription' }: { path?: string }) {
  // While the service is free there is nothing to buy, so this screen says so and points
  // nowhere. Apple dislikes in-app buttons or text that send people elsewhere to pay. Before
  // paid plans launch, revisit the store rules (see isNativeApp above) and the `path` link.
  void path;
  return (
    <Layout pageTitle="Subscription">
      <div className="container mx-auto py-20 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-accent">Free during our beta</CardTitle>
            <CardDescription>
              Pro Horse Match is free to use right now
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              There is nothing to buy or subscribe to in the app. Everything works as normal, and we will let you know well in advance if that ever changes.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
