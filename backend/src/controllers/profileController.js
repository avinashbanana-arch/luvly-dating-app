const prisma = require("../config/db");
const { uploadBufferToCloudinary } = require("../middleware/upload");
const { t } = require("../utils/i18n");
const { hasActiveAccess, getSubscriptionStatus } = require("../utils/pricing");
const { normalizeEmail } = require("./authController");

function validatePrompts(prompts) {
  if (prompts === undefined) return { ok: true, value: undefined };
  if (!Array.isArray(prompts)) {
    return { ok: false, error: "Prompts must be an array" };
  }

  const normalizedPrompts = prompts.map((prompt) => ({
    question: String(prompt?.question || "").trim(),
    answer: String(prompt?.answer || "").trim(),
  }));

  if (normalizedPrompts.some((prompt) => !prompt.question || !prompt.answer)) {
    return { ok: false, error: "Write an answer for each selected prompt before saving." };
  }

  return { ok: true, value: normalizedPrompts };
}

function validateRequiredProfileFields({ name, bio, city, ethnicity, religion, heightCm }) {
  if (name !== undefined && !String(name).trim()) {
    return "Name is required.";
  }
  if (bio !== undefined && !String(bio).trim()) {
    return "Bio is required. Please write something about yourself.";
  }
  if (city !== undefined && !String(city).trim()) {
    return "Location is required. Please select your city.";
  }
  if (ethnicity !== undefined && !String(ethnicity).trim()) {
    return "Ethnicity is required. Please select your ethnicity.";
  }
  if (religion !== undefined && !String(religion).trim()) {
    return "Religion is required. Please select your religion.";
  }
  if (heightCm !== undefined) {
    const heightValue = Number(heightCm);
    if (heightCm === null || heightCm === "" || !Number.isFinite(heightValue)) {
      return "Height is required. Please enter your height in cm.";
    }
    if (!Number.isInteger(heightValue) || heightValue < 100 || heightValue > 250) {
      return "Height must be a whole number between 100 and 250 cm.";
    }
  }
  return "";
}

/** GET /api/profile/me */
async function getMyProfile(req, res) {
  // Older builds could create more than the supported number of photos.
  // Keep the earliest five and remove any overflow so the account immediately
  // conforms to the current 3–5 photo rule.
  const overflowPhotos = await prisma.photo.findMany({
    where: { userId: req.user.id },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    skip: 5,
    select: { id: true },
  });
  if (overflowPhotos.length) {
    await prisma.photo.deleteMany({ where: { id: { in: overflowPhotos.map((photo) => photo.id) } } });
  }
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      photos: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
      interests: { include: { interest: true } },
      subscriptions: { where: { status: "ACTIVE" }, orderBy: { endDate: "desc" } },
    },
  });
  const subscriptionStatus = getSubscriptionStatus(user);
  return res.json({
    user: { ...user, subscriptionStatus },
    access: {
      isPremium: user.isPremium,
      trialEndsAt: user.trialEndsAt,
      hasActiveAccess: hasActiveAccess(user),
      subscriptionStatus,
    },
  });
}

/** DELETE /api/profile/me */
async function deleteMyAccount(req, res) {
  await prisma.user.delete({ where: { id: req.user.id } });
  return res.json({ message: "Account deleted" });
}

/** PUT /api/profile/me  - update bio, dob, gender, location, religion, education, language */
async function updateMyProfile(req, res) {
  const {
    name,
    email,
    dob,
    gender,
    lookingFor,
    bio,
    latitude,
    longitude,
    city,
    country,
    religion,
    heightCm,
    education,
    ethnicity,
    ethnicGroup,
    occupation,
    jobTitle,
    zodiacSign,
    videoUrl,
    prompts,
    communities,
    preferredLanguage,
    instagramHandle,
    spotifyUsername,
  } = req.body;

  const promptValidation = validatePrompts(prompts);
  if (!promptValidation.ok) {
    return res.status(400).json({ error: promptValidation.error });
  }
  // Accept the legacy field name as well so users on an older mobile build
  // retain the ethnicity they selected when the API is upgraded.
  const resolvedEthnicity = ethnicity ?? ethnicGroup;
  const requiredFieldError = validateRequiredProfileFields({ name, bio, city, ethnicity: resolvedEthnicity, religion, heightCm });
  if (requiredFieldError) {
    return res.status(400).json({ error: requiredFieldError });
  }
  const normalizedEmail = email === undefined ? undefined : normalizeEmail(email);
  if (email !== undefined && (!normalizedEmail || !normalizedEmail.includes("@"))) {
    return res.status(400).json({ error: "Email is required. Please enter a valid email address." });
  }
  if (normalizedEmail) {
    const existingEmailUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingEmailUser && existingEmailUser.id !== req.user.id) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      name,
      email: normalizedEmail,
      dob: dob ? new Date(dob) : undefined,
      gender,
      lookingFor,
      bio,
      latitude,
      longitude,
      city,
      country: country ? String(country).toUpperCase() : undefined,
      religion,
      heightCm: heightCm !== undefined ? Number(heightCm) : undefined,
      education,
      ethnicity: resolvedEthnicity,
      occupation,
      jobTitle,
      zodiacSign,
      videoUrl,
      prompts: promptValidation.value,
      communities: Array.isArray(communities) ? communities : undefined,
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
  const uniqueInterestNames = [
    ...new Set(
      interestNames
        .map((name) => String(name || "").trim())
        .filter(Boolean)
    ),
  ];
  if (uniqueInterestNames.length > 5) {
    return res.status(400).json({ error: "You can select up to 5 interests." });
  }

  // Ensure each interest exists, then link it to the user.
  const interestRecords = await Promise.all(
    uniqueInterestNames.map((name) =>
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
  if (!isVideo) {
    const existingPhotos = await prisma.photo.count({ where: { userId: req.user.id } });
    if (existingPhotos >= 5) {
      return res.status(400).json({ error: "You can upload a maximum of 5 photos." });
    }
  }
  const result = await uploadBufferToCloudinary(
    req.file.buffer,
    `dating-app/${req.user.id}`,
    isVideo ? "video" : "image"
  );

  if (isVideo) {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { videoUrl: result.secure_url },
    });
    return res.json({ videoUrl: result.secure_url, user });
  }

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
  deleteMyAccount,
};
