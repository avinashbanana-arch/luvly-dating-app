const prisma = require("../config/db");
const { uploadBufferToCloudinary } = require("../middleware/upload");
const { t } = require("../utils/i18n");
const { hasActiveAccess } = require("../utils/pricing");

/** GET /api/profile/me */
async function getMyProfile(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { photos: true, interests: { include: { interest: true } } },
  });
  return res.json({
    user,
    access: {
      isPremium: user.isPremium,
      trialEndsAt: user.trialEndsAt,
      hasActiveAccess: hasActiveAccess(user),
    },
  });
}

/** PUT /api/profile/me  - update bio, dob, gender, location, religion, education, language */
async function updateMyProfile(req, res) {
  const {
    name,
    dob,
    gender,
    lookingFor,
    bio,
    latitude,
    longitude,
    city,
    country,
    religion,
    education,
    preferredLanguage,
    instagramHandle,
    spotifyUsername,
  } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      name,
      dob: dob ? new Date(dob) : undefined,
      gender,
      lookingFor,
      bio,
      latitude,
      longitude,
      city,
      country: country ? String(country).toUpperCase() : undefined,
      religion,
      education,
      preferredLanguage,
      instagramHandle,
      spotifyUsername,
    },
  });

  return res.json({ message: t("profile_updated", preferredLanguage), user });
}

/** PUT /api/profile/interests  { interestNames: ["Cricket","Bollywood",...] } */
async function setInterests(req, res) {
  const { interestNames } = req.body;
  if (!Array.isArray(interestNames)) {
    return res.status(400).json({ error: "interestNames must be an array" });
  }

  // Ensure each interest exists, then link it to the user.
  const interestRecords = await Promise.all(
    interestNames.map((name) =>
      prisma.interest.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  await prisma.userInterest.deleteMany({ where: { userId: req.user.id } });
  await prisma.userInterest.createMany({
  data: [...new Set(interestRecords.map(i => i.id))].map((id) => ({
    userId: req.user.id,
    interestId: id,
  })),
  skipDuplicates: true,
});
  return res.json({ message: "Interests updated", interests: interestRecords });
}

/** POST /api/profile/photos  (multipart/form-data, field "photo") */
async function uploadPhoto(req, res) {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const isVideo = req.file.mimetype.startsWith("video");
  const result = await uploadBufferToCloudinary(
    req.file.buffer,
    `dating-app/${req.user.id}`,
    isVideo ? "video" : "image"
  );

  const photo = await prisma.photo.create({
    data: { userId: req.user.id, url: result.secure_url },
  });

  return res.json({ photo });
}

/** DELETE /api/profile/photos/:photoId */
async function deletePhoto(req, res) {
  const { photoId } = req.params;
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo || photo.userId !== req.user.id) {
    return res.status(404).json({ error: "Photo not found" });
  }
  await prisma.photo.delete({ where: { id: photoId } });
  return res.json({ message: "Photo deleted" });
}

/**
 * POST /api/profile/verify-selfie (multipart/form-data, field "selfie")
 * Stores the selfie and marks verification as PENDING for manual/automated review.
 * Plug in a face-match API (e.g. AWS Rekognition / Azure Face) here later to
 * auto-compare the selfie against the user's profile photos.
 */
async function submitVerificationSelfie(req, res) {
  if (!req.file) return res.status(400).json({ error: "No selfie uploaded" });

  const result = await uploadBufferToCloudinary(
    req.file.buffer,
    `dating-app/${req.user.id}/verification`,
    "image"
  );

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { verificationSelfieUrl: result.secure_url, verificationStatus: "PENDING" },
  });

  return res.json({ message: t("verification_pending"), user });
}

/**
 * PATCH /api/profile/:userId/verification-status  { status: "VERIFIED" | "REJECTED" }
 * Admin-only endpoint to approve/reject verification badge requests.
 * Wire this up behind an admin-role check before going to production.
 */
async function reviewVerification(req, res) {
  const { userId } = req.params;
  const { status } = req.body;
  if (!["VERIFIED", "REJECTED"].includes(status)) {
    return res.status(400).json({ error: "status must be VERIFIED or REJECTED" });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { verificationStatus: status, isVerified: status === "VERIFIED" },
  });

  return res.json({ user });
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  setInterests,
  uploadPhoto,
  deletePhoto,
  submitVerificationSelfie,
  reviewVerification,
};
