const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  getPlans,
  createOrder,
  verifyPayment,
  startTrialSubscription,
  syncRevenueCatSubscription,
  getMySubscription,
} = require("../controllers/paymentController");

const router = express.Router();

router.get("/plans", getPlans);
router.post("/create-order", requireAuth, createOrder);
router.post("/verify", requireAuth, verifyPayment);
router.post("/start-trial", requireAuth, startTrialSubscription);
router.post("/revenuecat-sync", requireAuth, syncRevenueCatSubscription);
router.get("/my-subscription", requireAuth, getMySubscription);

// Note: the webhook route itself is mounted separately in server.js
// because it needs the raw request body for signature verification.

module.exports = router;
