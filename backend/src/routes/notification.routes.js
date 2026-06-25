const express = require("express");
const prisma = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/** POST /api/notifications/register-device  { fcmToken } */
router.post("/register-device", requireAuth, async (req, res) => {
  const { fcmToken } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { fcmToken },
  });
  return res.json({ message: "Device registered for push notifications", userId: user.id });
});

module.exports = router;
