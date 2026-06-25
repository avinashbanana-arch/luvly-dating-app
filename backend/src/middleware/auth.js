const { verifyToken } = require("../utils/jwt");
const prisma = require("../config/db");
const { hasActiveAccess } = require("../utils/pricing");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing auth token" });

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: "Invalid token" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/** Blocks access to premium-only routes/features (e.g. unlimited likes, see who liked you) */
function requirePremium(req, res, next) {
  if (!req.user.isPremium) {
    return res.status(403).json({ error: "This feature requires a Premium subscription" });
  }
  next();
}

function requireActiveAccess(req, res, next) {
  if (hasActiveAccess(req.user)) return next();
  return res.status(402).json({
    error: "Please start a subscription to use Luvly. Your selected plan begins after a 3-day free trial.",
    code: "PREMIUM_REQUIRED",
  });
}

module.exports = { requireAuth, requirePremium, requireActiveAccess };
