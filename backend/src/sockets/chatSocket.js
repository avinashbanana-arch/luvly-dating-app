const { verifyToken } = require("../utils/jwt");
const prisma = require("../config/db");
const { sendPushNotification } = require("../utils/push");
const { assertParticipant } = require("../controllers/chatController");
const { hasActiveAccess } = require("../utils/pricing");

/**
 * Initializes the Socket.io real-time chat layer.
 *
 * Client usage (frontend side):
 *   const socket = io(SERVER_URL, { auth: { token: jwtToken } });
 *   socket.emit("join_match", matchId);
 *   socket.emit("send_message", { matchId, content });
 *   socket.on("new_message", (message) => { ... });
 *   socket.on("typing", ({ matchId, userId }) => { ... });
 */
function initChatSocket(io) {
  // Authenticate every socket connection using the same JWT as the REST API.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Missing auth token"));
      const payload = verifyToken(token);
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) return next(new Error("Invalid token"));
      if (!hasActiveAccess(user)) return next(new Error("Premium required"));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    // eslint-disable-next-line no-console
    console.log(`[socket] ${socket.user.id} connected`);

    socket.on("join_match", async (matchId) => {
      const match = await assertParticipant(matchId, socket.user.id);
      if (!match) return socket.emit("error_message", "Not part of this match");
      socket.join(`match:${matchId}`);
    });

    socket.on("send_message", async ({ matchId, content }) => {
      try {
        const match = await assertParticipant(matchId, socket.user.id);
        if (!match) return socket.emit("error_message", "Not part of this match");
        const freshUser = await prisma.user.findUnique({ where: { id: socket.user.id } });
        if (!hasActiveAccess(freshUser)) {
          return socket.emit("error_message", "Premium required");
        }
        if (!content?.trim()) return;

        const message = await prisma.message.create({
          data: { matchId, senderId: socket.user.id, content: content.trim() },
        });

        socket.emit("new_message", message);
        socket.to(`match:${matchId}`).emit("new_message", message);

        // Push-notify the other participant if they're offline.
        const otherUserId = match.userAId === socket.user.id ? match.userBId : match.userAId;
        const otherUser = await prisma.user.findUnique({ where: { id: otherUserId } });
        if (otherUser?.fcmToken) {
          await sendPushNotification(
            otherUser.fcmToken,
            socket.user.name || "New message",
            content.length > 60 ? content.slice(0, 60) + "..." : content
          );
        }
      } catch (err) {
        socket.emit("error_message", "Failed to send message");
      }
    });

    socket.on("typing", ({ matchId }) => {
      socket.to(`match:${matchId}`).emit("typing", { matchId, userId: socket.user.id });
    });

    socket.on("mark_read", async ({ matchId }) => {
      await prisma.message.updateMany({
        where: { matchId, senderId: { not: socket.user.id }, readAt: null },
        data: { readAt: new Date() },
      });
      socket.to(`match:${matchId}`).emit("messages_read", { matchId, readBy: socket.user.id });
    });

    socket.on("disconnect", () => {
      // eslint-disable-next-line no-console
      console.log(`[socket] ${socket.user.id} disconnected`);
    });
  });
}

module.exports = { initChatSocket };
