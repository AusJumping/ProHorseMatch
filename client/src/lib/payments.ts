import { loadStripe } from "@stripe/stripe-js/pure";

// A missing payment configuration must not prevent the rest of the app loading.
// The pure import also avoids injecting Stripe's script on disabled test sites.
export const paymentsAvailable =
  import.meta.env.VITE_REDESIGN_SANDBOX !== "true" &&
  Boolean(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export const stripePromise = paymentsAvailable
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;
