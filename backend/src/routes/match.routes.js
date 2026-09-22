const express = require("express");
const { requireAuth, requireActiveAccess } = require("../middleware/auth");
const {
  getDiscoverFeed,
  getCommunityFeed,
  likeUser,
  getDailyLikes,
  getLikesReceived,
  getLikesSent,
  getMyMatches,
} = require("../controllers/matchController");

const router = express.Router();

router.get("/discover", requireAuth, requireActiveAccess, getDiscoverFeed);
router.get("/community/:communityId", requireAuth, requireActiveAccess, getCommunityFeed);
router.post("/like", requireAuth, requireActiveAccess, likeUser);
router.get("/daily-likes", requireAuth, requireActiveAccess, getDailyLikes);
router.get("/likes-received", requireAuth, requireActiveAccess, getLikesReceived);
router.get("/likes-sent", requireAuth, requireActiveAccess, getLikesSent);
router.get("/matches", requireAuth, requireActiveAccess, getMyMatches);

module.exports = router;
