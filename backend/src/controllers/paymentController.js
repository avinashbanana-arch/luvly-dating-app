const crypto = require("crypto");
const Razorpay = require("razorpay");
const prisma = require("../config/db");
const { t } = require("../utils/i18n");
const { getPlansForCountry, normalizeCountry } = require("../utils/pricing");

let razorpay;

function getRazorpayConfigError(requiredKeys) {
  const missing = requiredKeys.filter((key) => !process.env[key]);
  return missing.length ? `Missing required Razorpay environment variables: ${missing.join(", ")}` : null;
}

function getRazorpayClient() {
  const configError = getRazorpayConfigError(["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"]);
  if (configError) {
    const err = new Error(configError);
    err.status = 500;
    throw err;
  }

  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  return razorpay;
}

/** GET /api/payment/plans - exposes pricing to the frontend */
function getPlans(req, res) {
  const country = normalizeCountry(req.query.country);
  return res.json({ plans: getPlansForCountry(country), country: country || null });
}

/** POST /api/payment/create-order  { plan: "MONTHLY" | "YEARLY", country? } */
async function createOrder(req, res) {
  const { plan } = req.body;
  const country = normalizeCountry(req.body.country || req.user.country);
  const plans = getPlansForCountry(country);
  const planDetails = plans[plan];
  if (!planDetails) return res.status(400).json({ error: "Invalid plan" });

  try {
    const order = await getRazorpayClient().orders.create({
      amount: planDetails.amountMinor,
      currency: planDetails.currency,
      receipt: `order_rcpt_${req.user.id}_${Date.now()}`,
      notes: { userId: req.user.id, plan, country },
    });

    return res.json({ order, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    return res.status(500).json({ error: "Failed to create order", details: err.message });
  }
}

/**
 * POST /api/payment/verify
 * { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan }
 * Called by the frontend right after Razorpay Checkout succeeds.
 * Verifies the HMAC signature before activating the subscription —
 * never trust a "payment succeeded" callback from the client alone.
 */
async function verifyPayment(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;
  const country = normalizeCountry(req.body.country || req.user.country);
  const plans = getPlansForCountry(country);
  const planDetails = plans[plan];
  if (!planDetails) return res.status(400).json({ error: "Invalid plan" });

  const configError = getRazorpayConfigError(["RAZORPAY_KEY_SECRET"]);
  if (configError) return res.status(500).json({ error: configError });

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: "Payment signature verification failed" });
  }

  const trialStartedAt = new Date();
  const trialEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const endDate = new Date(trialEndsAt);
  endDate.setDate(endDate.getDate() + planDetails.days);

  const subscription = await prisma.subscription.create({
    data: {
      userId: req.user.id,
      plan,
      amountInr: planDetails.currency === "INR" ? planDetails.amount : 0,
      amountMinor: planDetails.amountMinor,
      currency: planDetails.currency,
      status: "ACTIVE",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      startDate: trialEndsAt,
      endDate,
    },
  });

  await prisma.user.update({
    where: { id: req.user.id },
    data: { isPremium: true, trialStartedAt, trialEndsAt },
  });

  return res.json({ message: t("subscription_active"), subscription });
}

/**
 * POST /api/payment/start-trial
 * Development checkout path used by the current simulated payment UI.
 * It records the selected plan, grants app access immediately, and marks
 * the paid subscription period as starting after the 3-day trial.
 */
async function startTrialSubscription(req, res) {
  const { plan } = req.body;
  const country = normalizeCountry(req.body.country || req.user.country);
  const plans = getPlansForCountry(country);
  const planDetails = plans[plan];
  if (!planDetails) return res.status(400).json({ error: "Invalid plan" });

  const trialStartedAt = new Date();
  const trialEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const endDate = new Date(trialEndsAt);
  endDate.setDate(endDate.getDate() + planDetails.days);

  const subscription = await prisma.subscription.create({
    data: {
      userId: req.user.id,
      plan,
      amountInr: planDetails.currency === "INR" ? planDetails.amount : 0,
      amountMinor: planDetails.amountMinor,
      currency: planDetails.currency,
      status: "ACTIVE",
      startDate: trialEndsAt,
      endDate,
    },
  });

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { isPremium: true, trialStartedAt, trialEndsAt },
  });

  return res.json({ message: "Trial started", subscription, user });
}

async function syncRevenueCatSubscription(req, res) {
  const secretKey = process.env.REVENUECAT_SECRET_API_KEY;
  const entitlementId = process.env.REVENUECAT_ENTITLEMENT_ID || "premium";
  if (!secretKey) {
    return res.status(500).json({ error: "RevenueCat secret key is not configured" });
  }

  const response = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(req.user.id)}`,
    { headers: { Authorization: `Bearer ${secretKey}` } }
  );

  if (!response.ok) {
    return res.status(502).json({ error: "RevenueCat verification failed" });
  }

  const data = await response.json();
  const entitlement = data.subscriber?.entitlements?.[entitlementId];
  if (!entitlement) {
    return res.status(402).json({ error: "No active RevenueCat entitlement found" });
  }

  const expiresAt = entitlement.expires_date ? new Date(entitlement.expires_date) : null;
  if (expiresAt && expiresAt.getTime() <= Date.now()) {
    return res.status(402).json({ error: "RevenueCat entitlement is expired" });
  }

  const trialStartedAt = req.user.trialStartedAt || new Date();
  const trialEndsAt = req.user.trialEndsAt || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { isPremium: true, trialStartedAt, trialEndsAt },
  });

  return res.json({ message: "Subscription verified", user });
}

/**
 * POST /api/payment/webhook
 * Razorpay server-to-server webhook (e.g. for subscription.charged,
 * payment.failed events). Configure this URL in the Razorpay dashboard.
 * IMPORTANT: this route must receive the RAW request body to verify the
 * signature — see server.js where express.raw() is applied just for this path.
 */
async function razorpayWebhook(req, res) {
  const configError = getRazorpayConfigError(["RAZORPAY_WEBHOOK_SECRET"]);
  if (configError) return res.status(500).json({ error: configError });

  const signature = req.headers["x-razorpay-signature"];
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.body) // raw buffer
    .digest("hex");

  if (signature !== expected) {
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  const event = JSON.parse(req.body.toString());
  // eslint-disable-next-line no-console
  console.log("[razorpay webhook]", event.event);

  // TODO: handle event.event cases like "payment.failed" to downgrade users,
  // or "subscription.charged" for recurring billing if you switch to
  // Razorpay Subscriptions instead of one-off orders.

  return res.json({ received: true });
}

/** GET /api/payment/my-subscription */
async function getMySubscription(req, res) {
  const subscription = await prisma.subscription.findFirst({
    where: { userId: req.user.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ subscription });
}

module.exports = {
  getPlans,
  createOrder,
  verifyPayment,
  startTrialSubscription,
  syncRevenueCatSubscription,
  razorpayWebhook,
  getMySubscription,
};
