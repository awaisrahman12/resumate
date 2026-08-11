import crypto from "crypto";
import bcrypt from "bcryptjs";

/** How long a code stays valid, and how many wrong guesses we allow. */
export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

/**
 * Generate a cryptographically random 6-digit code.
 * crypto.randomInt avoids the modulo bias of Math.random.
 */
export function generateOtp() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Hash a code before storing it — we never keep the raw OTP. */
export async function hashOtp(code) {
  return bcrypt.hash(code, 10);
}

/** Constant-time-ish compare of a submitted code against the stored hash. */
export async function verifyOtp(code, hash) {
  if (!hash) return false;
  return bcrypt.compare(code, hash);
}

/** Expiry timestamp for a freshly issued code. */
export function otpExpiry() {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
}

/**
 * Seconds the user must still wait before another code can be sent.
 * Returns 0 when they're free to request one.
 */
export function resendWaitSeconds(lastSentAt) {
  if (!lastSentAt) return 0;
  const elapsed = (Date.now() - new Date(lastSentAt).getTime()) / 1000;
  const remaining = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsed);
  return remaining > 0 ? remaining : 0;
}
