const express = require("express");
const rateLimit = require("express-rate-limit");
const { requireAuth } = require("../middleware/auth");
const {
  requestOtp,
  requestEmailOtp,
  verifyOtpAndLogin,
  verifyEmailOtpAndLogin,
  setEmailPassword,
  loginWithEmail,
} = require("../controllers/authController");

const router = express.Router();

// Prevent OTP spam / SMS-bombing abuse — max 5 requests per phone per 15 min window.
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.body.phone || req.body.email || req.ip,
  message: { error: "Too many OTP requests. Please try again later." },
});

router.post("/request-otp", otpLimiter, requestOtp);
router.post("/verify-otp", verifyOtpAndLogin);
router.post("/request-email-otp", otpLimiter, requestEmailOtp);
router.post("/verify-email-otp", verifyEmailOtpAndLogin);
router.post("/login-email", loginWithEmail);
router.post("/set-email-password", requireAuth, setEmailPassword);

module.exports = router;
