import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // users stay logged in
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

let fallbackSecret: string | undefined;

// Signing key. If SESSION_SECRET is missing we use a random per-process key instead of a
// known default: logins then reset on every restart, but they can never be forged.
function secret(): string {
  const configured = process.env.SESSION_SECRET;
  if (configured) return configured;
  if (!fallbackSecret) {
    fallbackSecret = randomBytes(32).toString("hex");
    console.warn("SESSION_SECRET is not set: using a temporary key, so logins will reset whenever the server restarts.");
  }
  return fallbackSecret;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(`phm-auth-token-v2:${payload}`).digest("base64url");
}

// Token format: <userId>.<issuedAtMs>.<signature>
export function createAuthToken(userId: number, now: number = Date.now()): string {
  const payload = `${userId}.${now}`;
  return `${payload}.${sign(payload)}`;
}

// Returns the user id for a genuine, unexpired token, otherwise null.
// The old unsigned tokens (base64 of "id:time") fail the shape check, so they stop working.
export function verifyAuthToken(token: unknown, now: number = Date.now()): number | null {
  if (typeof token !== "string" || token.length > 200) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [id, issuedAt, signature] = parts;
  if (!/^\d{1,10}$/.test(id) || !/^\d{10,15}$/.test(issuedAt)) return null;

  const expected = Buffer.from(sign(`${id}.${issuedAt}`));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  const age = now - Number(issuedAt);
  if (age > MAX_AGE_MS || age < -MAX_CLOCK_SKEW_MS) return null;

  const userId = Number(id);
  return Number.isSafeInteger(userId) && userId > 0 ? userId : null;
}
