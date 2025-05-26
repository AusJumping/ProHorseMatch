import crypto from 'crypto';

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

export function getTokenExpirationDate(): Date {
  // Token expires in 24 hours
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + 24);
  return expiration;
}