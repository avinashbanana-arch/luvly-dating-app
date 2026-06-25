const prisma = require("../config/db");
const { t } = require("../utils/i18n");

/** POST /api/safety/block  { userId } */
async function blockUser(req, res) {
  const { userId } = req.body;
  if (userId === req.user.id) return res.status(400).json({ error: "You can't block yourself" });

  const block = await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: req.user.id, blockedId: userId } },
    update: {},
    create: { blockerId: req.user.id, blockedId: userId },
  });

  return res.json({ message: t("user_blocked"), block });
}

/** DELETE /api/safety/block/:userId */
async function unblockUser(req, res) {
  const { userId } = req.params;
  await prisma.block.deleteMany({ where: { blockerId: req.user.id, blockedId: userId } });
  return res.json({ message: "User unblocked" });
}

/** GET /api/safety/blocked */
async function getBlockedUsers(req, res) {
  const blocks = await prisma.block.findMany({
    where: { blockerId: req.user.id },
    include: { blocked: { select: { id: true, name: true, photos: true } } },
  });
  return res.json({ blocked: blocks.map((b) => b.blocked) });
}

/**
 * POST /api/safety/report  { reportedId, reason, details }
 * reason examples: "fake_profile", "harassment", "inappropriate_photos",
 * "underage", "scam_or_spam", "other"
 */
async function reportUser(req, res) {
  const { reportedId, reason, details } = req.body;
  if (!reportedId || !reason) {
    return res.status(400).json({ error: "reportedId and reason are required" });
  }

  const report = await prisma.report.create({
    data: { reporterId: req.user.id, reportedId, reason, details },
  });

  // Auto-block as a safety default so the reporter doesn't see them again immediately.
  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: req.user.id, blockedId: reportedId } },
    update: {},
    create: { blockerId: req.user.id, blockedId: reportedId },
  });

  return res.json({ message: t("report_submitted"), report });
}

/**
 * GET /api/safety/reports - admin moderation queue.
 * Wire this up behind an admin-role check before going to production.
 */
async function getReportsQueue(req, res) {
  const reports = await prisma.report.findMany({
    where: { status: "PENDING" },
    include: {
      reporter: { select: { id: true, name: true } },
      reported: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return res.json({ reports });
}

/** PATCH /api/safety/reports/:reportId  { status } */
async function updateReportStatus(req, res) {
  const { reportId } = req.params;
  const { status } = req.body;
  const report = await prisma.report.update({ where: { id: reportId }, data: { status } });
  return res.json({ report });
}

module.exports = {
  blockUser,
  unblockUser,
  getBlockedUsers,
  reportUser,
  getReportsQueue,
  updateReportStatus,
};
