import crypto from 'crypto';

// Shared by the account API routes for email-verification and password-reset links.
export function randomToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
