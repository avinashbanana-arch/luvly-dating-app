require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const matchRoutes = require("./routes/match.routes");
const chatRoutes = require("./routes/chat.routes");
const paymentRoutes = require("./routes/payment.routes");
const reportRoutes = require("./routes/report.routes");
const notificationRoutes = require("./routes/notification.routes");
const { razorpayWebhook } = require("./controllers/paymentController");
const { initChatSocket } = require("./sockets/chatSocket");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || "*" },
});

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));

// Razorpay webhook needs the RAW body for signature verification, so it
// must be registered BEFORE express.json() and excluded from JSON parsing.
app.post("/api/payment/webhook", express.raw({ type: "application/json" }), razorpayWebhook);

app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/safety", reportRoutes);
app.use("/api/notifications", notificationRoutes);

// Centralized error handler (catches anything thrown in async route handlers
// that wasn't already caught locally)
app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

initChatSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Dating app backend running on http://localhost:${PORT}`);
});
