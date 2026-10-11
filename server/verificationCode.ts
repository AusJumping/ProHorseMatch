import { createHmac, timingSafeEqual } from "node:crypto";
import { secret } from "./authToken";

// The 6-digit code in the verification email. It is derived from the user's existing
// verification token with a secret key, so nothing extra is stored: a new token (from
// "resend") automatically means a new code, and a used token means the code stops working.
export function verificationCodeFor(token: string): string {
  const digest = createHmac("sha256", secret()).update(`phm-verify-code-v1:${token}`).digest();
  return String(digest.readUInt32BE(0) % 1_000_000).padStart(6, "0");
}

export function codeMatches(token: string, given: unknown): boolean {
  if (typeof given !== "string") return false;
  const cleaned = given.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  return timingSafeEqual(Buffer.from(verificationCodeFor(token)), Buffer.from(cleaned));
}

// Limits wrong guesses so a code cannot be brute-forced (1 in 1,000,000 per try).
export class AttemptLimiter {
  private entries = new Map<string, { count: number; resetAt: number }>();

  constructor(private max = 5, private windowMs = 15 * 60 * 1000) {}

  isBlocked(key: string, now = Date.now()): boolean {
    const entry = this.entries.get(key);
    if (!entry) return false;
    if (now >= entry.resetAt) {
      this.entries.delete(key);
      return false;
    }
    return entry.count >= this.max;
  }

  recordFailure(key: string, now = Date.now()): void {
    const entry = this.entries.get(key);
    if (!entry || now >= entry.resetAt) {
      this.entries.set(key, { count: 1, resetAt: now + this.windowMs });
    } else {
      entry.count += 1;
    }
    if (this.entries.size > 5000) {
      this.entries.forEach((v, k) => {
        if (now >= v.resetAt) this.entries.delete(k);
      });
    }
  }

  clear(key: string): void {
    this.entries.delete(key);
  }
}
