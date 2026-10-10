import { useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import logoImage from "../assets/logo.jpg";

export const CONTACT_EMAIL = "info@australianjumping.com.au";

interface LegalPageProps {
  title: string;
  updated?: string;
  children: ReactNode;
}

// Public page shell for legal and policy pages. Works without logging in, because the
// App Store and Google Play reviewers (and anyone with the link) need to read these.
export default function LegalPage({ title, updated, children }: LegalPageProps) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} | Pro Horse Match`;
    return () => {
      document.title = previous;
    };
  }, [title]);

  return (
    <div className="min-h-screen bg-white">
      <header className="py-6 px-4 text-center" style={{ backgroundColor: "#2b2b2b" }}>
        <Link href="/">
          <img src={logoImage} alt="Pro Horse Match" className="h-16 mx-auto object-contain cursor-pointer" />
        </Link>
      </header>
      <main className="max-w-3xl mx-auto px-5 py-10">
        <h1 className="text-3xl font-bold text-neutral-900 mb-1">{title}</h1>
        {updated && <p className="text-sm text-neutral-500 mb-8">Last updated: {updated}</p>}
        <div className="prose prose-neutral max-w-none prose-headings:font-semibold prose-a:text-[#8B7355]">
          {children}
        </div>
        <footer className="mt-12 pt-6 border-t text-sm text-neutral-500 flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          <Link href="/delete-account" className="hover:underline">Delete Your Account</Link>
          <Link href="/help" className="hover:underline">Help</Link>
          <Link href="/" className="hover:underline">Back to Pro Horse Match</Link>
        </footer>
      </main>
    </div>
  );
}
