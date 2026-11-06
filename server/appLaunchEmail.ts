// "Pro Horse Match is now on the App Store" announcement email.
//
// Pure functions only (no network, no database) so the wording and the recipient rules can be tested.
// Rules for who gets it: verified address, has not unsubscribed, valid-looking address, one email per
// address, and never twice for the same campaign.

export const SITE_URL = "https://prohorsematch.com";
export const APP_STORE_URL = "https://apps.apple.com/au/app/pro-horse-match/id6815109289";
export const CONTACT_EMAIL = "info@australianjumping.com.au";
export const LAUNCH_CAMPAIGN_ID = "app-store-launch-2026-11";

export type LaunchUser = {
  id: number;
  email?: string | null;
  username?: string | null;
  name?: string | null;
  email_verified?: boolean | null;
  email_unsubscribed?: boolean | null;
};

export type RecipientSummary = {
  totalUsers: number;
  eligible: number;
  notVerified: number;
  unsubscribed: number;
  invalidEmail: number;
  duplicateEmail: number;
  alreadySent: number;
};

const EMAIL_SHAPE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

export function selectRecipients<T extends LaunchUser>(
  users: T[],
  alreadySentUserIds: Set<number> = new Set(),
  excludeEmails: string[] = [],
): { recipients: T[]; summary: RecipientSummary } {
  const summary: RecipientSummary = {
    totalUsers: users.length, eligible: 0, notVerified: 0, unsubscribed: 0, invalidEmail: 0, duplicateEmail: 0, alreadySent: 0,
  };
  const skip = new Set(excludeEmails.map(e => e.trim().toLowerCase()));
  const seen = new Set<string>();
  const recipients: T[] = [];
  for (const user of users) {
    const email = typeof user.email === "string" ? user.email.trim() : "";
    if (!user.email_verified) { summary.notVerified++; continue; }
    if (user.email_unsubscribed) { summary.unsubscribed++; continue; }
    if (!EMAIL_SHAPE.test(email)) { summary.invalidEmail++; continue; }
    const key = email.toLowerCase();
    if (skip.has(key)) continue;
    if (seen.has(key)) { summary.duplicateEmail++; continue; }
    if (alreadySentUserIds.has(user.id)) { summary.alreadySent++; seen.add(key); continue; }
    seen.add(key);
    recipients.push(user);
  }
  summary.eligible = recipients.length;
  return { recipients, summary };
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// "Jo Jennings" -> "Jo". Falls back to a plain greeting rather than showing a login handle or an email address.
export function greetingName(user: Pick<LaunchUser, "name" | "username">): string {
  const name = (user.name || "").trim();
  if (name && !name.includes("@")) return name.split(/\s+/)[0];
  return "";
}

export function unsubscribeUrlFor(email: string): string {
  return `${SITE_URL}/unsubscribe?email=${Buffer.from(email).toString("base64url")}`;
}

export const LAUNCH_SUBJECT = "Pro Horse Match is now available for iPhone";
const PREHEADER = "Download Pro Horse Match from the App Store. Android testers wanted.";

export function renderAppLaunchEmail(params: { name?: string; unsubscribeUrl: string }): { subject: string; html: string; text: string } {
  const unsub = escapeHtml(params.unsubscribeUrl);
  const p = "font-size:16px;line-height:1.7;margin:0 0 18px 0;";

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f4f2ec;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f4f2ec;">${escapeHtml(PREHEADER)}</div>
<div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#2b2b2b;">
  <div style="background:#2b2b2b;padding:36px 30px;text-align:center;">
    <div style="color:#e4e2dd;font-size:28px;font-weight:700;letter-spacing:4px;">PRO HORSE MATCH</div>
  </div>
  <div style="background:#ffffff;padding:40px 32px;border-left:1px solid #e8e3d3;border-right:1px solid #e8e3d3;">
    <h1 style="margin:0 0 18px 0;font-size:28px;line-height:1.25;color:#2b2b2b;">Pro Horse Match is now available for iPhone</h1>
    <p style="${p}">Finding your next performance horse, or connecting your horse with the right buyer, is now even more convenient.</p>
    <p style="${p}">Download Pro Horse Match from the App Store to browse horses, save your favourites and keep in touch with buyers and sellers from your iPhone.</p>
    <p style="${p}">Already a member? Sign in with your existing Pro Horse Match email address and password. There\u2019s no need to create another account.</p>
    <div style="text-align:center;margin:30px 0;">
      <a href="${APP_STORE_URL}" style="background:#cdac6e;color:#2b2b2b;padding:16px 34px;text-decoration:none;border-radius:6px;font-weight:700;font-size:16px;display:inline-block;">Download Pro Horse Match for iPhone</a>
    </div>
    <div style="background:#faf6ec;border-left:4px solid #cdac6e;padding:20px 22px;margin:30px 0;">
      <p style="font-size:18px;font-weight:700;margin:0 0 10px 0;">Android is coming soon, and we need your help</p>
      <p style="font-size:16px;line-height:1.7;margin:0 0 12px 0;">Before we can launch on Google Play, we need a small group of Android users to try the app for two weeks.</p>
      <p style="font-size:16px;line-height:1.7;margin:0 0 12px 0;">If you have an Android phone and can spare a few minutes during that time, email <a href="mailto:${CONTACT_EMAIL}" style="color:#8a6f3c;">${CONTACT_EMAIL}</a> and we\u2019ll send you the link and instructions.</p>
      <p style="font-size:16px;line-height:1.7;margin:0;">Your feedback will help make the app better for everyone.</p>
    </div>
    <p style="${p}">Thank you to everyone who has supported Pro Horse Match so far. Whether you\u2019re looking for your next horse or finding the right home for one, we\u2019re glad you\u2019re part of it.</p>
    <p style="${p}">You can still use Pro Horse Match any time at <a href="${SITE_URL}" style="color:#8a6f3c;">prohorsematch.com</a>.</p>
    <p style="font-size:16px;line-height:1.7;margin:28px 0 0 0;"><strong>The Pro Horse Match team</strong></p>
  </div>
  <div style="padding:22px 30px;text-align:center;font-size:12px;line-height:1.6;color:#6f6a5f;">
    You are receiving this because you have a Pro Horse Match account. Questions? Write to <a href="mailto:${CONTACT_EMAIL}" style="color:#6f6a5f;">${CONTACT_EMAIL}</a>.<br>
    <a href="${unsub}" style="color:#6f6a5f;">Unsubscribe</a> from Pro Horse Match emails.
  </div>
</div>
</body>
</html>`;

  const text = `PRO HORSE MATCH

Pro Horse Match is now available for iPhone

Finding your next performance horse, or connecting your horse with the right buyer, is now even more convenient.

Download Pro Horse Match from the App Store to browse horses, save your favourites and keep in touch with buyers and sellers from your iPhone.

Already a member? Sign in with your existing Pro Horse Match email address and password. There\u2019s no need to create another account.

Download Pro Horse Match for iPhone:
${APP_STORE_URL}

ANDROID IS COMING SOON, AND WE NEED YOUR HELP
Before we can launch on Google Play, we need a small group of Android users to try the app for two weeks.

If you have an Android phone and can spare a few minutes during that time, email ${CONTACT_EMAIL} and we\u2019ll send you the link and instructions.

Your feedback will help make the app better for everyone.

Thank you to everyone who has supported Pro Horse Match so far. Whether you\u2019re looking for your next horse or finding the right home for one, we\u2019re glad you\u2019re part of it.

You can still use Pro Horse Match any time at ${SITE_URL}.

The Pro Horse Match team

---
You are receiving this because you have a Pro Horse Match account. Questions? Write to ${CONTACT_EMAIL}.
Unsubscribe from Pro Horse Match emails: ${params.unsubscribeUrl}
`;

  return { subject: LAUNCH_SUBJECT, html, text };
}
