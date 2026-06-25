const prisma = require("../config/db");

const useTwilio =
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_VERIFY_SERVICE_SID;

let twilioClient = null;
if (useTwilio) {
  const twilio = require("twilio");
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

function isEmailIdentifier(identifier) {
  return String(identifier).includes("@");
}

async function sendEmailOtp(email, code) {
  if (!process.env.RESEND_API_KEY || !process.env.OTP_FROM_EMAIL) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.OTP_FROM_EMAIL,
      to: email,
      subject: "Your Luvly OTP",
      html: `<p>Your Luvly verification code is <strong>${code}</strong>.</p><p>This code expires in 5 minutes.</p>`,
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Email OTP failed: ${details || response.status}`);
  }

  return true;
}

/**
 * Sends an OTP to an Indian phone number.
 * - If Twilio Verify credentials are set in .env, uses real SMS delivery.
 * - Otherwise falls back to a "console OTP" so you can build without
 *   paying for SMS credits. The code still gets stored & expires in 5 min.
 */
async function sendOtp(phone) {
  if (isEmailIdentifier(phone)) {
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await prisma.otp.create({ data: { phone, code, expiresAt } });

    const sent = await sendEmailOtp(phone, code);
    if (!sent) {
      // eslint-disable-next-line no-console
      console.log(`\n[DEV EMAIL OTP] Email: ${phone} -> Code: ${code}\n`);
      return { delivery: "console" };
    }

    return { delivery: "email" };
  }

  if (useTwilio) {
    await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: phone, channel: "sms" });
    return { delivery: "sms" };
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await prisma.otp.create({ data: { phone, code, expiresAt } });

  // eslint-disable-next-line no-console
  console.log(`\n[DEV OTP] Phone: ${phone} -> Code: ${code}\n`);
  return { delivery: "console" };
}

/**
 * Verifies an OTP. Returns true/false.
 */
async function verifyOtp(phone, code) {
  if (useTwilio) {
    const result = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: phone, code });
    return result.status === "approved";
  }

  const otp = await prisma.otp.findFirst({
    where: { phone, code, consumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return false;
  if (otp.expiresAt < new Date()) return false;

  await prisma.otp.update({ where: { id: otp.id }, data: { consumed: true } });
  return true;
}

module.exports = { sendOtp, verifyOtp };
