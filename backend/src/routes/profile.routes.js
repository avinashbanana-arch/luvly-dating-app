const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const {
  getMyProfile,
  updateMyProfile,
  setInterests,
  uploadPhoto,
  deletePhoto,
  submitVerificationSelfie,
  reviewVerification,
} = require("../controllers/profileController");

const router = express.Router();

router.get("/me", requireAuth, getMyProfile);
router.put("/me", requireAuth, updateMyProfile);
router.put("/interests", requireAuth, setInterests);

router.post("/photos", requireAuth, upload.single("photo"), uploadPhoto);
router.delete("/photos/:photoId", requireAuth, deletePhoto);

router.post(
  "/verify-selfie",
  requireAuth,
  upload.single("selfie"),
  submitVerificationSelfie
);
// TODO: protect with an admin-only middleware before production
router.patch("/:userId/verification-status", requireAuth, reviewVerification);

module.exports = router;
