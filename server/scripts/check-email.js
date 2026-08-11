/**
 * Checks that SMTP_USER / SMTP_PASS in server/.env can actually log in to Gmail,
 * and optionally sends a real test email.
 *
 *   npm run check:email                 # just verify the credentials
 *   npm run check:email you@gmail.com   # verify, then send a test message there
 */
import "dotenv/config";
import nodemailer from "nodemailer";

const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const to = process.argv[2];

if (!user || !pass) {
  console.error("✗ SMTP_USER and SMTP_PASS must both be set in server/.env");
  process.exit(1);
}

console.log(`Checking Gmail login for ${user}...`);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user, pass },
});

try {
  await transporter.verify();
  console.log("✓ Gmail accepted the credentials.");
} catch (err) {
  console.error("✗ Gmail rejected the credentials.");
  if (err.code === "EAUTH") {
    console.error(
      "\n  SMTP_PASS must be a 16-character app password — not your normal\n" +
        "  Google password — generated on the SAME account as SMTP_USER.\n\n" +
        "  1. Turn on 2-Step Verification:\n" +
        "     https://myaccount.google.com/signinoptions/two-step-verification\n" +
        "  2. Create an app password:\n" +
        "     https://myaccount.google.com/apppasswords\n"
    );
  } else {
    console.error(`  ${err.message}`);
  }
  process.exit(1);
}

if (!to) {
  console.log("\nPass an address to also send a test email:");
  console.log("  npm run check:email you@gmail.com");
  process.exit(0);
}

console.log(`Sending a test email to ${to}...`);
const info = await transporter.sendMail({
  from: process.env.SMTP_FROM || `ResuMate <${user}>`,
  to,
  subject: "ResuMate email test",
  text: "If you're reading this, ResuMate can send verification codes. 🎉",
});
console.log(`✓ Sent (id ${info.messageId}). Check the inbox — and spam.`);
