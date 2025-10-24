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

export function generateReminderToken(): string {
  // Generate a secure random token for subscription reminder magic links
  return crypto.randomBytes(32).toString('hex');
}

export function hashReminderToken(token: string): string {
  // Hash the token before storing in database
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createReminderTokenExpiration(): Date {
  // Reminder token expires in 24 hours
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);
  return expires;
}