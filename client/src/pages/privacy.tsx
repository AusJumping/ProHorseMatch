import { Link } from "wouter";
import LegalPage, { CONTACT_EMAIL } from "@/components/LegalPage";

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" updated="10 October 2026">
      <p>
        Pro Horse Match ("we", "us") runs the Pro Horse Match website (prohorsematch.com) and our iPhone and
        Android apps (together, the "Service"). The Service helps people list performance horses and find new
        owners for them. This policy explains what information we collect, why we collect it, and what you can
        do about it. We handle personal information in line with the Australian Privacy Act 1988 and the
        Australian Privacy Principles.
      </p>

      <h2>What we collect</h2>
      <p><strong>Account details.</strong> Your name, email address, username and password when you register. If you
        sell horses, you may also give us a business name and contact name.</p>
      <p><strong>Listings and media.</strong> The horse details, photos and videos you upload. These are shown to other
        people using the Service.</p>
      <p><strong>Messages.</strong> Messages you send and receive through the Service, so we can deliver them and keep
        your conversation history.</p>
      <p><strong>Search and match preferences.</strong> Your saved searches, favourites, and the discipline, level, breed,
        price and similar preferences you set. Location is only the country and search distance you choose
        yourself. We do not use your phone's GPS.</p>
      <p><strong>Safety information.</strong> Users you block and reports you make about other users or listings.</p>
      <p><strong>Subscription and payment records.</strong> Your plan and its dates. Card payments are handled by Stripe,
        so your card details go straight to Stripe and are never stored on our servers.</p>
      <p><strong>Notification details.</strong> If you turn on notifications, a device identifier (push token) for your
        phone or browser so we can send alerts to it.</p>
      <p><strong>Technical information.</strong> Login times and basic device information, used to keep the Service secure
        and working.</p>

      <h2>How we use it</h2>
      <p>We use your information to run the Service: showing listings, connecting buyers and sellers, delivering messages
        and the alerts you ask for, processing payments, preventing misuse, and keeping accounts secure. We may email
        you about your account, matches and messages, and you can unsubscribe from marketing emails at any time.</p>
      <p>We do not sell your personal information. We do not use it for advertising, and we do not track you across
        other apps or websites.</p>

      <h2>Services that help us run Pro Horse Match</h2>
      <p>We use a small number of providers who handle data on our behalf: web hosting (Render), our database (Neon),
        photo and video storage (Cloudinary), payments (Stripe), email delivery (SendGrid and Resend), and push
        notifications (Google Firebase Cloud Messaging, and Apple's push notification service for iPhones). Some of
        these providers store or process data outside Australia, including in the United States.</p>

      <h2>Notifications</h2>
      <p>You choose whether to receive push notifications and can turn them off at any time in your device settings or in
        the app.</p>

      <h2>Keeping and deleting your information</h2>
      <p>We keep your information while your account is open. You can delete your account yourself at any time in the app
        or on the website (Profile, then Delete Account). Deleting your account permanently removes your profile, listings
        and their photos and videos, messages, favourites, saved searches and notification settings. Full steps are on
        our <Link href="/delete-account">Delete Your Account</Link> page.</p>
      <p>A few things may be kept after deletion: records of safety reports (so we can protect other users), payment
        records held by Stripe for tax purposes, and copies in routine backups, which are overwritten after a limited
        time.</p>

      <h2>Your rights</h2>
      <p>You can view and update your details by logging in. You can ask for a copy of the personal information we hold
        about you, ask us to correct it, or ask us to delete it, by emailing us at the address below.</p>

      <h2>Security</h2>
      <p>We protect information using measures such as encrypted connections (HTTPS) and restricted access to our systems.
        No online service can promise perfect security, but we take looking after your information seriously.</p>

      <h2>Children</h2>
      <p>The Service is for people aged 18 and over.</p>

      <h2>Changes to this policy</h2>
      <p>If we make significant changes we will update this page and its date.</p>

      <h2>Contact us</h2>
      <p>Questions or requests about your privacy: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
    </LegalPage>
  );
}
