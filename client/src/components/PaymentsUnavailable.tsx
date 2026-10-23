import Layout from "@/components/Layout";
import { Link } from "wouter";

export function PaymentsUnavailable() {
  return (
    <Layout pageTitle="Payments unavailable">
      <section className="mx-auto max-w-xl px-6 py-12 text-center">
        <h1 className="mb-4 text-2xl font-bold">Payments unavailable</h1>
        <p className="mb-6">
          Payments, donations and paid subscriptions are not enabled on this site.
          You can continue browsing without making a payment.
        </p>
        <Link href="/" className="underline">Return to home</Link>
      </section>
    </Layout>
  );
}
