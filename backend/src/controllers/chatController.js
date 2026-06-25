const prisma = require("../config/db");

async function assertParticipant(matchId, userId) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return null;
  if (match.userAId !== userId && match.userBId !== userId) return null;
  return match;
}

/** GET /api/chat/:matchId/messages */
async function getMessages(req, res) {
  const { matchId } = req.params;
  const match = await assertParticipant(matchId, req.user.id);
  if (!match) return res.status(403).json({ error: "Not part of this match" });

  const messages = await prisma.message.findMany({
    where: { matchId },
    orderBy: { createdAt: "asc" },
  });

  return res.json({ messages });
}

/**
 * POST /api/chat/:matchId/messages  { content }
 * REST fallback for sending a message (e.g. for clients without a
 * persistent socket connection). Real-time delivery happens via the
 * Socket.io layer in src/sockets/chatSocket.js — this just persists it.
 */
async function sendMessageRest(req, res) {
  const { matchId } = req.params;
  const { content } = req.body;
  const match = await assertParticipant(matchId, req.user.id);
  if (!match) return res.status(403).json({ error: "Not part of this match" });
  if (!content?.trim()) return res.status(400).json({ error: "Message content required" });

  const message = await prisma.message.create({
    data: { matchId, senderId: req.user.id, content: content.trim() },
  });

  return res.json({ message });
}

module.exports = { getMessages, sendMessageRest, assertParticipant };
