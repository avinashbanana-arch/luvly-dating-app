const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  blockUser,
  unblockUser,
  getBlockedUsers,
  reportUser,
  getReportsQueue,
  updateReportStatus,
} = require("../controllers/reportController");

const router = express.Router();

router.post("/block", requireAuth, blockUser);
router.delete("/block/:userId", requireAuth, unblockUser);
router.get("/blocked", requireAuth, getBlockedUsers);

router.post("/report", requireAuth, reportUser);
// TODO: protect with an admin-only middleware before production
router.get("/reports", requireAuth, getReportsQueue);
router.patch("/reports/:reportId", requireAuth, updateReportStatus);

module.exports = router;
