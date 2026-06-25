const express = require("express");
const { requireAuth, requireActiveAccess } = require("../middleware/auth");
const { getMessages, sendMessageRest } = require("../controllers/chatController");

const router = express.Router();

router.get("/:matchId/messages", requireAuth, requireActiveAccess, getMessages);
router.post("/:matchId/messages", requireAuth, requireActiveAccess, sendMessageRest);

module.exports = router;
