import nodemailer from "nodemailer";
import { OTP_TTL_MINUTES } from "./otp.js";

/**
 * Nodemailer transport using Gmail SMTP.
 *
 * Requires a Gmail address plus an *app password* (not the normal account
 * password) — see DEPLOY.md / README for how to generate one. The transporter
 * is created lazily and cached so we don't rebuild it on every send.
 */
let transporter = null;

function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    const err = new Error(
      "Email isn't configured on the server (SMTP_USER / SMTP_PASS missing)."
    );
    err.status = 500;
    throw err;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return transporter;
}

/** Plain-text fallback for clients that don't render HTML. */
function textVersion(name, code) {
  return [
    `Hi ${name},`,
    "",
    `Your ResuMate verification code is: ${code}`,
    "",
    `This code expires in ${OTP_TTL_MINUTES} minutes.`,
    "If you didn't create a ResuMate account, you can safely ignore this email.",
  ].join("\n");
}

/** Simple, clean HTML email matching the app's look. */
function htmlVersion(name, code) {
  return `
  <div style="margin:0;padding:32px 16px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <h1 style="margin:0 0 4px;font-size:22px;color:#0f172a;">Verify your email</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#64748b;">Hi ${name}, welcome to ResuMate!</p>

      <p style="margin:0 0 12px;font-size:14px;color:#334155;">Enter this code to finish setting up your account:</p>

      <div style="margin:0 0 24px;padding:20px;text-align:center;background:#f1f5f9;border-radius:12px;">
        <span style="font-size:34px;font-weight:700;letter-spacing:10px;color:#0f172a;font-family:'Courier New',monospace;">${code}</span>
      </div>

      <p style="margin:0 0 8px;font-size:13px;color:#64748b;">
        This code expires in <strong>${OTP_TTL_MINUTES} minutes</strong>.
      </p>
      <p style="margin:0;font-size:13px;color:#94a3b8;">
        Didn't sign up for ResuMate? You can safely ignore this email.
      </p>
    </div>
    <p style="max-width:480px;margin:16px auto 0;text-align:center;font-size:12px;color:#94a3b8;">
      ResuMate — AI resume builder &amp; checker
    </p>
  </div>`;
}

/**
 * Send a verification code to a user's email address.
 * Throws a tagged error (status 502) if the mail server rejects the send.
 */
export async function sendOtpEmail(to, name, code) {
  const from = process.env.SMTP_FROM || `ResuMate <${process.env.SMTP_USER}>`;

  try {
    await getTransporter().sendMail({
      from,
      to,
      subject: `${code} is your ResuMate verification code`,
      text: textVersion(name, code),
      html: htmlVersion(name, code),
    });
  } catch (err) {
    if (err.status) throw err;
    if (err.code === "EAUTH") {
      // Not transient — the credentials are wrong, so say so in the log rather
      // than leaving someone chasing a "try again later" that never resolves.
      console.error(
        "Gmail rejected SMTP_USER/SMTP_PASS. SMTP_PASS must be a 16-character " +
          "app password (https://myaccount.google.com/apppasswords) generated on " +
          `the same account as SMTP_USER (currently "${process.env.SMTP_USER}").`
      );
    } else {
      console.error("Failed to send OTP email:", err.message);
    }
    const wrapped = new Error(
      "We couldn't send the verification email. Please try again in a moment."
    );
    wrapped.status = 502;
    throw wrapped;
  }
}
