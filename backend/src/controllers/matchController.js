const prisma = require("../config/db");
const { rankCandidates } = require("../utils/matching");
const { sendPushNotification } = require("../utils/push");
const { publicProfileSelect, toPublicProfile } = require("../utils/publicProfile");

const FREE_DAILY_LIKE_LIMIT = 50;
const COMMUNITY_IDS = new Set([
  "music", "travelling", "gym", "books", "science", "dance", "movies", "sports", "astrology",
]);

async function getDailyLikeSummary(userId) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const count = await prisma.like.count({
    where: { fromUserId: userId, createdAt: { gte: since } },
  });
  return { count, limit: FREE_DAILY_LIKE_LIMIT };
}

/** GET /api/match/discover - ranked feed of candidates for swiping */
async function getDiscoverFeed(req, res) {
  const country = req.query.country ? String(req.query.country).toUpperCase() : "";
  const me = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { interests: { include: { interest: true } }, photos: true },
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
    include: { interests: { include: { interest: true } }, photos: true },
    take: 200, // pull a reasonable pool, then rank in-memory
  });

  const ranked = rankCandidates(me, candidates);

  return res.json({
    candidates: ranked.slice(0, 30).map((r) => ({ ...toPublicProfile(r.user), matchScore: r.score })),
  });
}

/** GET /api/match/community/:communityId?zodiac=Leo - real members of a community */
async function getCommunityFeed(req, res) {
  try {
    const communityId = String(req.params.communityId || "").trim().toLowerCase();
    const zodiac = String(req.query.zodiac || "").trim();
    if (!COMMUNITY_IDS.has(communityId)) {
      return res.status(400).json({ error: "Unknown community" });
    }

    const [alreadyLiked, blockedByMe, blockedMe] = await Promise.all([
      prisma.like.findMany({ where: { fromUserId: req.user.id }, select: { toUserId: true } }),
      prisma.block.findMany({ where: { blockerId: req.user.id }, select: { blockedId: true } }),
      prisma.block.findMany({ where: { blockedId: req.user.id }, select: { blockerId: true } }),
    ]);
    const excludedIds = [
      req.user.id,
      ...alreadyLiked.map((like) => like.toUserId),
      ...blockedByMe.map((block) => block.blockedId),
      ...blockedMe.map((block) => block.blockerId),
    ];
    const candidates = await prisma.user.findMany({
      where: {
        id: { notIn: excludedIds },
        communities: { has: communityId },
        ...(communityId === "astrology" && zodiac ? { zodiacSign: zodiac } : {}),
      },
      select: publicProfileSelect,
      take: 50,
    });

    return res.json({ candidates: candidates.map(toPublicProfile) });
  } catch (err) {
    console.error("Failed to load community feed", err);
    return res.status(500).json({ error: "Couldn't load community members right now. Please try again." });
  }
}

/** POST /api/match/like  { toUserId, isSuperLike? } */
async function likeUser(req, res) {
  try {
    const toUserId = typeof req.body?.toUserId === "string" ? req.body.toUserId.trim() : "";
    const isSuperLike = !!req.body?.isSuperLike;

    if (!toUserId) {
      return res.status(400).json({ error: "Choose a profile to like" });
    }
    if (toUserId === req.user.id) {
      return res.status(400).json({ error: "You can't like yourself" });
    }

    // Check this before writing the Like. A stale card (for example, after
    // somebody deletes their account) used to hit a foreign-key error that
    // Express 4 did not turn into an HTTP response, so Android showed a
    // misleading "Couldn't reach the server" message.
    const otherUser = await prisma.user.findUnique({
      where: { id: toUserId },
      select: { id: true, fcmToken: true },
    });
    if (!otherUser) {
      return res.status(404).json({ error: "This profile is no longer available. Refresh Likes and try another profile." });
    }

    const existingLike = await prisma.like.findUnique({
      where: { fromUserId_toUserId: { fromUserId: req.user.id, toUserId } },
    });
    const dailyLikesBefore = await getDailyLikeSummary(req.user.id);

    // A repeated like updates the existing record and must not consume another
    // daily slot. Only a new like is subject to the free-tier limit.
    if (!req.user.isPremium && !existingLike && dailyLikesBefore.count >= FREE_DAILY_LIKE_LIMIT) {
      return res.status(403).json({
        error: `Daily like limit (${FREE_DAILY_LIKE_LIMIT}) reached. Upgrade to Premium for unlimited likes.`,
      });
    }

    const like = await prisma.like.upsert({
      where: { fromUserId_toUserId: { fromUserId: req.user.id, toUserId } },
      update: { isSuperLike },
      create: { fromUserId: req.user.id, toUserId, isSuperLike },
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

    if (otherUser?.fcmToken) {
      await sendPushNotification(
        otherUser.fcmToken,
        "It's a match! 🎉",
        `You and ${req.user.name || "someone"} liked each other`
      );
    }
    }

    const dailyLikes = await getDailyLikeSummary(req.user.id);
    return res.json({ like, match, dailyLikes });
  } catch (err) {
    // Never drop a mobile request on a Prisma or notification failure.
    // The app can then show a useful error and the user can retry safely.
    console.error("Failed to save like", err);
    return res.status(500).json({ error: "Couldn't save your like right now. Please try again." });
  }
}

/** GET /api/match/daily-likes - authoritative current user's daily usage */
async function getDailyLikes(req, res) {
  return res.json({ dailyLikes: await getDailyLikeSummary(req.user.id) });
}

/** GET /api/match/likes-received - "who liked me" (premium feature) */
async function getLikesReceived(req, res) {
  const likes = await prisma.like.findMany({
    where: { toUserId: req.user.id },
    include: { fromUser: { select: publicProfileSelect } },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ likes: likes.map((like) => ({ ...like, fromUser: toPublicProfile(like.fromUser) })) });
}

/** GET /api/match/likes-sent - profiles liked by the current user */
async function getLikesSent(req, res) {
  const likes = await prisma.like.findMany({
    where: { fromUserId: req.user.id },
    include: { toUser: { select: publicProfileSelect } },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ likes: likes.map((like) => ({ ...like, toUser: toPublicProfile(like.toUser) })) });
}

/** GET /api/match/matches - all mutual matches for the current user */
async function getMyMatches(req, res) {
  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: req.user.id }, { userBId: req.user.id }] },
    include: {
      userA: { select: publicProfileSelect },
      userB: { select: publicProfileSelect },
    },
    orderBy: { createdAt: "desc" },
  });

  const normalized = matches.map((m) => ({
    matchId: m.id,
    otherUser: toPublicProfile(m.userAId === req.user.id ? m.userB : m.userA),
    createdAt: m.createdAt,
  }));

  return res.json({ matches: normalized });
}

module.exports = { getDiscoverFeed, getCommunityFeed, likeUser, getDailyLikes, getLikesReceived, getLikesSent, getMyMatches };
