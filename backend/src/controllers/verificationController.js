const prisma = require("../config/db");
const path = require("path");
const fs = require("fs");

/**
 * POST /api/profile/verify-selfie
 * Accepts a base64 selfie image, saves it, and marks the user as verified.
 * In production you would pass this to a face-liveness / face-match AI API
 * (e.g. AWS Rekognition, Azure Face, or a custom model) before marking verified.
 */
async function verifySelfie(req, res) {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Strip the data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Save selfie to uploads/selfies/<userId>.jpg
    const selfiesDir = path.join(__dirname, "../../uploads/selfies");
    if (!fs.existsSync(selfiesDir)) fs.mkdirSync(selfiesDir, { recursive: true });

    const filePath = path.join(selfiesDir, `${req.user.id}.jpg`);
    fs.writeFileSync(filePath, buffer);

    // TODO: In production, call an AI face liveness API here before setting isVerified.
    // For now we trust the submission and mark the user verified.
    await prisma.user.update({
      where: { id: req.user.id },
      data: { isVerified: true },
    });

    return res.json({ message: "Profile verified successfully", isVerified: true });
  } catch (err) {
    console.error("[verifySelfie]", err);
    return res.status(500).json({ error: "Verification failed", details: err.message });
  }
}

/**
 * GET /api/profile/verification-status
 */
async function getVerificationStatus(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { isVerified: true },
    });
    return res.json({ isVerified: user?.isVerified ?? false });
  } catch (err) {
    return res.status(500).json({ error: "Could not fetch status" });
  }
}

module.exports = { verifySelfie, getVerificationStatus };
