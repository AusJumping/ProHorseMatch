import crypto from 'crypto';

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
}

export function createTokenExpiration(): Date {
  // Token expires in 48 hours
  const expires = new Date();
  expires.setHours(expires.getHours() + 48);
  return expires;
}

export function createPasswordResetExpiration(): Date {
  // Password reset token expires in 48 hours
  const expires = new Date();
  expires.setHours(expires.getHours() + 48);
  return expires;
}