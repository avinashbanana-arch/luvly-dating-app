const prisma = require("../config/db");
const { rankCandidates } = require("../utils/matching");
const { sendPushNotification } = require("../utils/push");

const FREE_DAILY_LIKE_LIMIT = 20;

/** GET /api/match/discover - ranked feed of candidates for swiping */
async function getDiscoverFeed(req, res) {
  const country = req.query.country ? String(req.query.country).toUpperCase() : "";
  const me = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { interests: true, photos: true },
  });

  const [alreadyLiked, blockedByMe, blockedMe] = await Promise.all([
    prisma.like.findMany({ where: { fromUserId: me.id }, select: { toUserId: true } }),
    prisma.block.findMany({ where: { blockerId: me.id }, select: { blockedId: true } }),
    prisma.block.findMany({ where: { blockedId: me.id }, select: { blockerId: true } }),
  ]);

  const excludeIds = new Set([
    me.id,
    ...alreadyLiked.map((l) => l.toUserId),
    ...blockedByMe.map((b) => b.blockedId),
    ...blockedMe.map((b) => b.blockerId),
  ]);

  const candidates = await prisma.user.findMany({
    where: {
      id: { notIn: [...excludeIds] },
      ...(country ? { country } : {}),
    },
    include: { interests: true, photos: true },
    take: 200, // pull a reasonable pool, then rank in-memory
  });

  const ranked = rankCandidates(me, candidates);

  return res.json({
    candidates: ranked.slice(0, 30).map((r) => ({ ...r.user, matchScore: r.score })),
  });
}

/** POST /api/match/like  { toUserId, isSuperLike? } */
async function likeUser(req, res) {
  const { toUserId, isSuperLike } = req.body;
  if (toUserId === req.user.id) {
    return res.status(400).json({ error: "You can't like yourself" });
  }

  // Free-tier daily like limit (premium users are unlimited)
  if (!req.user.isPremium) {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const likesToday = await prisma.like.count({
      where: { fromUserId: req.user.id, createdAt: { gte: since } },
    });
    if (likesToday >= FREE_DAILY_LIKE_LIMIT) {
      return res.status(403).json({
        error: `Daily like limit (${FREE_DAILY_LIKE_LIMIT}) reached. Upgrade to Premium for unlimited likes.`,
      });
    }
  }

  const like = await prisma.like.upsert({
    where: { fromUserId_toUserId: { fromUserId: req.user.id, toUserId } },
    update: { isSuperLike: !!isSuperLike },
    create: { fromUserId: req.user.id, toUserId, isSuperLike: !!isSuperLike },
  });

  // Check if the other user already liked us back -> it's a match!
  const reciprocal = await prisma.like.findUnique({
    where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: req.user.id } },
  });

  let match = null;
  if (reciprocal) {
    const [userAId, userBId] = [req.user.id, toUserId].sort();
    match = await prisma.match.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      update: {},
      create: { userAId, userBId },
    });

    const otherUser = await prisma.user.findUnique({ where: { id: toUserId } });
    if (otherUser?.fcmToken) {
      await sendPushNotification(
        otherUser.fcmToken,
        "It's a match! 🎉",
        `You and ${req.user.name || "someone"} liked each other`
      );
    }
  }

  return res.json({ like, match });
}

/** GET /api/match/likes-received - "who liked me" (premium feature) */
async function getLikesReceived(req, res) {
  const likes = await prisma.like.findMany({
    where: { toUserId: req.user.id },
    include: { fromUser: { include: { photos: true } } },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ likes });
}

/** GET /api/match/matches - all mutual matches for the current user */
async function getMyMatches(req, res) {
  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: req.user.id }, { userBId: req.user.id }] },
    include: {
      userA: { include: { photos: true } },
      userB: { include: { photos: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const normalized = matches.map((m) => ({
    matchId: m.id,
    otherUser: m.userAId === req.user.id ? m.userB : m.userA,
    createdAt: m.createdAt,
  }));

  return res.json({ matches: normalized });
}

module.exports = { getDiscoverFeed, likeUser, getLikesReceived, getMyMatches };
