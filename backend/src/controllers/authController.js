const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const { sendOtp, verifyOtp } = require("../utils/otp");
const { signToken } = require("../utils/jwt");
const { t } = require("../utils/i18n");

/** Basic Indian phone number normalizer: ensures it has +91 prefix. */
function normalizePhone(phone) {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (String(phone).startsWith("+")) return phone;
  return `+${digits}`;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/** POST /api/auth/request-otp  { phone } */
async function requestOtp(req, res) {
  try {
    const phone = normalizePhone(req.body.phone);
    if (!phone) return res.status(400).json({ error: "Phone number is required" });

    const result = await sendOtp(phone);
    return res.json({ message: t("otp_sent"), phone, delivery: result.delivery });
  } catch (err) {
    return res.status(500).json({ error: "Failed to send OTP", details: err.message });
  }
}

/** POST /api/auth/request-email-otp  { email } */
async function requestEmailOtp(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    const result = await sendOtp(email);
    return res.json({
      message: "Email OTP sent",
      email,
      delivery: result.delivery,
      devHint:
        result.delivery === "console"
          ? "In dev mode, the email OTP is printed in the backend terminal."
          : undefined,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to send email OTP", details: err.message });
  }
}

/** POST /api/auth/verify-otp  { phone, code } -> creates user if new, returns JWT */
async function verifyOtpAndLogin(req, res) {
  try {
    const phone = normalizePhone(req.body.phone);
    const { code } = req.body;

    const isValid = await verifyOtp(phone, code);
    if (!isValid) return res.status(400).json({ error: t("otp_invalid") });

    let user = await prisma.user.findUnique({ where: { phone } });
    let isNewUser = false;

    if (!user) {
      user = await prisma.user.create({ data: { phone } });
      isNewUser = true;
    }

    const token = signToken(user.id);
    return res.json({ token, isNewUser, user });
  } catch (err) {
    return res.status(500).json({ error: "Login failed", details: err.message });
  }
}

/**
 * POST /api/auth/verify-email-otp
 * { email, code, password? } -> creates user if new, returns JWT.
 * If password is present during signup, it is saved for future password login.
 */
async function verifyEmailOtpAndLogin(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const { code, password } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    const isValid = await verifyOtp(email, code);
    if (!isValid) return res.status(400).json({ error: t("otp_invalid") });

    let user = await prisma.user.findUnique({ where: { email } });
    let isNewUser = false;

    if (!user) {
      const passwordHash = password && password.length >= 6 ? await bcrypt.hash(password, 10) : undefined;
      user = await prisma.user.create({ data: { email, passwordHash } });
      isNewUser = true;
    } else if (password && password.length >= 6 && !user.passwordHash) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await bcrypt.hash(password, 10) },
      });
    }

    const token = signToken(user.id);
    return res.json({ token, isNewUser, user });
  } catch (err) {
    return res.status(500).json({ error: "Email login failed", details: err.message });
  }
}

/**
 * Optional: allow users to also set an email + password as a backup login
 * method (useful if they lose access to their phone number).
 */
async function setEmailPassword(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: "Valid email and a password (6+ chars) are required" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { email, passwordHash },
    });
    return res.json({ message: "Email login configured", user });
  } catch (err) {
    return res.status(500).json({ error: "Failed to set email/password", details: err.message });
  }
}

/** POST /api/auth/login-email  { email, password } */
async function loginWithEmail(req, res) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: "Invalid email or password" });

    const token = signToken(user.id);
    return res.json({ token, user });
  } catch (err) {
    return res.status(500).json({ error: "Login failed", details: err.message });
  }
}

module.exports = {
  requestOtp,
  requestEmailOtp,
  verifyOtpAndLogin,
  verifyEmailOtpAndLogin,
  setEmailPassword,
  loginWithEmail,
  normalizePhone,
  normalizeEmail,
};
