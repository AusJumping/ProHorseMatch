import { Link } from "wouter";
import LegalPage, { CONTACT_EMAIL } from "@/components/LegalPage";

export default function DeleteAccountPage() {
  return (
    <LegalPage title="Delete Your Account">
      <p>
        You can permanently delete your Pro Horse Match account at any time, in the app or on the website.
      </p>

      <h2>Delete it yourself</h2>
      <ol>
        <li>Log in to Pro Horse Match (app or prohorsematch.com).</li>
        <li>Open the menu and choose <strong>Profile</strong>, then scroll to the <strong>Danger Zone</strong>.</li>
        <li>Tap <strong>Delete Account</strong>, enter your password, and confirm.</li>
      </ol>
      <p>Your account is deleted straight away.</p>

      <h2>What gets deleted</h2>
      <ul>
        <li>Your profile and login details</li>
        <li>All of your horse listings, including their photos and videos</li>
        <li>Your messages and conversations</li>
        <li>Your favourites, saved searches, blocked users and notification settings</li>
      </ul>

      <h2>What may be kept</h2>
      <ul>
        <li>Records of safety reports, so we can protect other users</li>
        <li>Payment records held by Stripe, which they keep for tax purposes</li>
        <li>Copies in routine backups, which are overwritten after a limited time</li>
      </ul>
      <p>If you have a paid plan, any time remaining on it is lost and is not refunded.</p>

      <h2>Can't log in?</h2>
      <p>
        Email <a href={`mailto:${CONTACT_EMAIL}?subject=Delete%20my%20account`}>{CONTACT_EMAIL}</a> from the email
        address on your account with the subject "Delete my account", and we will delete it for you.
      </p>

      <p>
        More detail is in our <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </LegalPage>
  );
}
