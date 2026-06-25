const express = require("express");
const { requireAuth, requirePremium, requireActiveAccess } = require("../middleware/auth");
const {
  getDiscoverFeed,
  likeUser,
  getLikesReceived,
  getMyMatches,
} = require("../controllers/matchController");

const router = express.Router();

router.get("/discover", requireAuth, requireActiveAccess, getDiscoverFeed);
router.post("/like", requireAuth, requireActiveAccess, likeUser);
router.get("/likes-received", requireAuth, requireActiveAccess, requirePremium, getLikesReceived);
router.get("/matches", requireAuth, requireActiveAccess, getMyMatches);

module.exports = router;
