import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import asyncHandler from "express-async-handler";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User.js";
import { sendOtpEmail } from "../services/email.js";
import {
  generateOtp,
  hashOtp,
  verifyOtp,
  otpExpiry,
  resendWaitSeconds,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MINUTES,
} from "../services/otp.js";

/** Sign a JWT for a user id. */
function signToken(userId) {
  return jwt.sign({ sub: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

/** Google token verifier (reads GOOGLE_CLIENT_ID from the environment). */
let googleClient = null;
function getGoogleClient() {
  if (!process.env.GOOGLE_CLIENT_ID) {
    const err = new Error("Google sign-in isn't configured on the server.");
    err.status = 500;
    throw err;
  }
  if (!googleClient) {
    googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return googleClient;
}

/**
 * Issue a fresh OTP for a user, store its hash, and email the code.
 * Used by both signup and resend.
 *
 * If the email fails to send we roll back the cooldown stamp — otherwise the
 * user would be blocked for 60s waiting on a code that never arrived.
 */
async function issueOtp(user) {
  const previousSentAt = user.otpLastSentAt;
  const code = generateOtp();
  user.otpHash = await hashOtp(code);
  user.otpExpiresAt = otpExpiry();
  user.otpAttempts = 0;
  user.otpLastSentAt = new Date();
  await user.save();

  try {
    await sendOtpEmail(user.email, user.name, code);
  } catch (err) {
    user.otpLastSentAt = previousSentAt;
    await user.save();
    throw err;
  }
}

/**
 * POST /api/auth/signup
 * Creates an UNVERIFIED account and emails a code. No token is returned —
 * the user must verify their email before they can sign in.
 */
export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are all required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail }).select(
    "+otpHash +otpExpiresAt +otpAttempts +otpLastSentAt"
  );

  if (existing) {
    // A verified account (either kind) means this email is taken.
    if (existing.emailVerified) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }
    // Unverified signup being retried — refresh their details and re-send a code
    // rather than blocking them out of their own half-finished account.
    const wait = resendWaitSeconds(existing.otpLastSentAt);
    if (wait > 0) {
      return res.status(429).json({
        error: `We already sent you a code. Please wait ${wait}s before requesting another.`,
      });
    }
    existing.name = name;
    existing.passwordHash = await bcrypt.hash(password, 10);
    await issueOtp(existing);

    return res.status(200).json({
      needsVerification: true,
      email: existing.email,
      message: `We sent a new 6-digit code to ${existing.email}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
    authProvider: "email",
    emailVerified: false,
  });

  await issueOtp(user);

  res.status(201).json({
    needsVerification: true,
    email: user.email,
    message: `We sent a 6-digit code to ${user.email}. It expires in ${OTP_TTL_MINUTES} minutes.`,
  });
});

/**
 * POST /api/auth/verify-otp
 * Confirms the emailed code and, on success, signs the user in.
 */
export const verifyOtpCode = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "Email and verification code are required." });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+otpHash +otpExpiresAt +otpAttempts +otpLastSentAt"
  );

  if (!user) {
    return res.status(404).json({ error: "No account found for that email." });
  }
  if (user.emailVerified) {
    return res.status(400).json({ error: "This email is already verified. Please log in." });
  }
  if (!user.otpHash || !user.otpExpiresAt) {
    return res.status(400).json({ error: "No active code. Please request a new one." });
  }
  if (user.otpExpiresAt.getTime() < Date.now()) {
    return res.status(400).json({ error: "That code has expired. Please request a new one." });
  }
  if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
    return res.status(429).json({
      error: "Too many incorrect attempts. Please request a new code.",
    });
  }

  const ok = await verifyOtp(String(code).trim(), user.otpHash);
  if (!ok) {
    user.otpAttempts += 1;
    await user.save();
    const left = OTP_MAX_ATTEMPTS - user.otpAttempts;
    return res.status(400).json({
      error:
        left > 0
          ? `That code isn't right. ${left} attempt${left === 1 ? "" : "s"} left.`
          : "That code isn't right. Please request a new code.",
    });
  }

  // Verified — clear the OTP state and sign them in.
  user.emailVerified = true;
  user.otpHash = null;
  user.otpExpiresAt = null;
  user.otpAttempts = 0;
  await user.save();

  const token = signToken(user._id);
  res.json({ token, user: user.toJSON() });
});

/**
 * POST /api/auth/resend-otp
 * Sends a fresh code, rate-limited by a cooldown.
 */
export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+otpHash +otpExpiresAt +otpAttempts +otpLastSentAt"
  );

  if (!user) {
    return res.status(404).json({ error: "No account found for that email." });
  }
  if (user.emailVerified) {
    return res.status(400).json({ error: "This email is already verified. Please log in." });
  }

  const wait = resendWaitSeconds(user.otpLastSentAt);
  if (wait > 0) {
    return res.status(429).json({
      error: `Please wait ${wait}s before requesting another code.`,
    });
  }

  await issueOtp(user);
  res.json({
    message: `A new code is on its way to ${user.email}.`,
    email: user.email,
  });
});

/**
 * POST /api/auth/login
 * Email + password. Unverified accounts are refused and told to verify.
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  // Google-only account with no password set.
  if (!user.passwordHash) {
    return res.status(401).json({
      error: "This account uses Google sign-in. Please continue with Google.",
    });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  // The gate: email accounts must be verified first.
  if (!user.emailVerified) {
    return res.status(403).json({
      error: "Please verify your email first. We can send you a new code.",
      needsVerification: true,
      email: user.email,
    });
  }

  const token = signToken(user._id);
  res.json({ token, user: user.toJSON() });
});

/**
 * POST /api/auth/google
 * Verifies the Google ID token from the client, then signs in or registers.
 * Google-provided emails are already verified, so these accounts skip OTP.
 */
export const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: "Missing Google credential." });
  }

  let payload;
  try {
    const ticket = await getGoogleClient().verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: "Google sign-in failed. Please try again." });
  }

  if (!payload?.email) {
    return res.status(401).json({ error: "Google didn't return an email address." });
  }
  if (payload.email_verified === false) {
    return res.status(401).json({ error: "That Google email isn't verified." });
  }

  const email = payload.email.toLowerCase();
  let user = await User.findOne({ email });

  if (user) {
    // Link Google to an existing email account (and trust Google's verification).
    let changed = false;
    if (!user.googleId) {
      user.googleId = payload.sub;
      changed = true;
    }
    if (!user.emailVerified) {
      user.emailVerified = true;
      changed = true;
    }
    if (!user.avatar && payload.picture) {
      user.avatar = payload.picture;
      changed = true;
    }
    if (changed) await user.save();
  } else {
    user = await User.create({
      name: payload.name || email.split("@")[0],
      email,
      googleId: payload.sub,
      avatar: payload.picture || null,
      authProvider: "google",
      emailVerified: true,
      passwordHash: null,
    });
  }

  const token = signToken(user._id);
  res.json({ token, user: user.toJSON() });
});

/** GET /api/auth/me (protected) */
export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toJSON() });
});
