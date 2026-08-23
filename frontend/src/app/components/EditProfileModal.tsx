import { useEffect, useState } from "react";
import { X, User, Briefcase, MapPin, GraduationCap, Users, Ruler } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PhotoVideoUpload } from "./PhotoVideoUpload";
import { countryOptions } from "../../lib/countries";
import { RELIGION_OPTIONS } from "../../lib/religions";
import { ETHNICITY_OPTIONS } from "../../lib/ethnicities";
import { AVAILABLE_PROMPTS } from "../../lib/prompts";
import { SearchableSelect } from "./SearchableSelect";

interface UserProfile {
  name: string;
  email?: string;
  phone?: string;
  age: number;
  image: string;
  images: string[];
  video?: string;
  bio: string;
  location: string;
  country?: string;
  occupation: string;
  education: string;
  ethnicity: string;
  religion: string;
  heightCm: number | "";
  gender?: string;
  preference?: string;
  zodiacSign: string;
  interests: string[];
  prompts: Array<{ question: string; answer: string }>;
  photoIds?: string[];
}

interface EditProfileModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSave: (profile: UserProfile) => Promise<void> | void;
  onDeletePhoto: (photoId: string) => Promise<void>;
}

function normalizeSavedChoice(value: string | undefined, options: string[]) {
  const trimmedValue = (value || "").trim();
  return options.find((option) => option.toLowerCase() === trimmedValue.toLowerCase()) || trimmedValue;
}

function normalizeStoredPrompts(value: unknown): Array<{ question: string; answer: string }> {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? (() => {
          try {
            return JSON.parse(value);
          } catch {
            return [];
          }
        })()
      : [];
  if (!Array.isArray(source)) return [];
  return source
    .filter((prompt) => prompt && typeof prompt.question === "string")
    .map((prompt) => ({ question: prompt.question, answer: String(prompt.answer || "") }));
}

function getStoredVideo(profile: UserProfile) {
  const source = profile as UserProfile & { videoUrl?: string; video_url?: string };
  return source.video || source.videoUrl || source.video_url || "";
}

function getStoredOccupation(profile: UserProfile) {
  const source = profile as UserProfile & { jobTitle?: string };
  return profile.occupation || source.jobTitle || "";
}

function toEditableProfile(profile: UserProfile): UserProfile {
  const { email: _email, phone: _phone, ...editableProfile } = profile;
  return editableProfile;
}

export function EditProfileModal({
  isOpen,
  profile,
  onClose,
  onSave,
  onDeletePhoto,
}: EditProfileModalProps) {
  const [editedProfile, setEditedProfile] = useState(() => toEditableProfile(profile));
  const [selectedInterests, setSelectedInterests] = useState(profile.interests);
  const [prompts, setPrompts] = useState(() => normalizeStoredPrompts(profile.prompts));
  const [images, setImages] = useState(profile.images || [profile.image]);
  const [photoIds, setPhotoIds] = useState(profile.photoIds || []);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [video, setVideo] = useState(() => getStoredVideo(profile));
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [zodiacSign, setZodiacSign] = useState(profile.zodiacSign || "");
  const [saving, setSaving] = useState(false);
  const [promptError, setPromptError] = useState("");
  const [interestError, setInterestError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const source = profile as UserProfile & { ethnicGroup?: string; zodiac?: string; astrology?: string };
    const ethnicity = normalizeSavedChoice(profile.ethnicity || source.ethnicGroup, ethnicityOptions);
    const zodiac = normalizeSavedChoice(profile.zodiacSign || source.zodiac || source.astrology, zodiacSigns);
    const religion = normalizeSavedChoice(profile.religion, RELIGION_OPTIONS);
    setEditedProfile({
      ...toEditableProfile(profile),
      occupation: getStoredOccupation(profile),
      ethnicity,
      religion,
      heightCm: profile.heightCm || "",
      zodiacSign: zodiac,
      video: getStoredVideo(profile),
    });
    setSelectedInterests(profile.interests || []);
    setPrompts(normalizeStoredPrompts(profile.prompts));
    setImages(profile.images?.length ? profile.images : [profile.image].filter(Boolean));
    setPhotoIds(profile.photoIds || []);
    setImageFiles([]);
    setVideo(getStoredVideo(profile));
    setVideoFile(null);
    setZodiacSign(zodiac);
    setPromptError("");
    setInterestError("");
    setFormError("");
    setSuccessMessage("");
  }, [isOpen, profile]);

  const availablePrompts = AVAILABLE_PROMPTS;

  const ethnicityOptions = ETHNICITY_OPTIONS;

  const zodiacSigns = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];

  const availableInterests = [
    "Travel",
    "Music",
    "Movies",
    "Football",
    "Basketball",
    "Tennis",
    "Badminton",
    "Swimming",
    "Running",
    "Cycling",
    "Yoga",
    "Hiking",
    "Gym",
    "Books",
    "Science",
    "Dance",
    "Cooking",
    "Gardening",
    "Photography",
    "Art",
    "Painting",
    "Drawing",
    "Pottery",
    "Crafts",
    "Design",
    "Gaming",
    "Coffee",
    "Tea",
    "Fashion",
    "Bollywood",
    "Cricket",
    "Anime",
    "K-pop",
    "Theatre",
    "Stand-up Comedy",
    "Pets",
    "Volunteering",
    "Spirituality",
    "Meditation",
    "Technology",
    "Startups",
    "Food",
    "Baking",
    "Wine",
    "Road Trips",
    "Beaches",
    "Mountains",
  ];

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
      setInterestError("");
    } else if (selectedInterests.length < 5) {
      setSelectedInterests([...selectedInterests, interest]);
      setInterestError("");
    } else {
      setInterestError("You can select up to 5 interests.");
    }
  };

  const nextProfile = {
      ...editedProfile, 
      interests: selectedInterests, 
      prompts, 
      images,
      image: images[0] || editedProfile.image,
    video,
    zodiacSign,
      photoFiles: imageFiles,
      videoFile,
    } as UserProfile & { photoFiles: File[]; videoFile: File | null };

  const normalizeProfile = (value: Partial<UserProfile>) => ({
    name: (value.name || "").trim(),
    age: value.age || 18,
    image: value.image || "",
    images: value.images || [],
    video: value.video || "",
    bio: (value.bio || "").trim(),
    location: (value.location || "").trim(),
    country: value.country || "",
    occupation: (value.occupation || "").trim(),
    education: (value.education || "").trim(),
    ethnicity: (value.ethnicity || "").trim(),
    religion: (value.religion || "").trim(),
    heightCm: value.heightCm || "",
    gender: value.gender || "",
    preference: value.preference || "",
    zodiacSign: value.zodiacSign || "",
    interests: value.interests || [],
    prompts: (value.prompts || []).map((prompt) => ({
      question: prompt.question,
      answer: prompt.answer.trim(),
    })),
  });

  const hasChanges =
    JSON.stringify(normalizeProfile(nextProfile)) !==
      JSON.stringify(
        normalizeProfile({
          ...profile,
          images: profile.images?.length ? profile.images : [profile.image].filter(Boolean),
        })
      ) ||
    imageFiles.length > 0 ||
    !!videoFile;

  const handleRemoveImage = async (index: number) => {
    setFormError("");
    const photoId = photoIds[index];
    try {
      if (photoId) await onDeletePhoto(photoId);
      setImages((current) => current.filter((_, itemIndex) => itemIndex !== index));
      if (photoId) setPhotoIds((current) => current.filter((_, itemIndex) => itemIndex !== index));
      else setImageFiles((current) => current.filter((_, itemIndex) => itemIndex !== index - photoIds.length));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not delete this photo. Please try again.");
    }
  };

  const handleSave = async () => {
    setFormError("");
    setPromptError("");
    setInterestError("");
    setSuccessMessage("");
    if (!editedProfile.name.trim()) {
      setFormError("Name is required. Please enter your name.");
      return;
    }
    if (!editedProfile.bio.trim()) {
      setFormError("Bio is required. Please write something about yourself.");
      return;
    }
    if (!editedProfile.location.trim()) {
      setFormError("Location is required. Please add your city.");
      return;
    }
    if (!editedProfile.country) {
      setFormError("Country is required. Please select your country.");
      return;
    }
    if (!editedProfile.ethnicity.trim()) {
      setFormError("Ethnicity is required. Please select your ethnicity.");
      return;
    }
    if (!editedProfile.religion.trim()) {
      setFormError("Religion is required. Please select your religion.");
      return;
    }
    if (
      editedProfile.heightCm === "" ||
      !Number.isFinite(Number(editedProfile.heightCm)) ||
      !Number.isInteger(Number(editedProfile.heightCm)) ||
      Number(editedProfile.heightCm) < 100 ||
      Number(editedProfile.heightCm) > 250
    ) {
      setFormError("Height is required and must be a whole number between 100 and 250 cm.");
      return;
    }
    if (images.length < 3) {
      setFormError("Photo upload is required. Please add at least 3 photos.");
      return;
    }
    const emptyPrompt = prompts.find((prompt) => !prompt.answer.trim());
    if (emptyPrompt) {
      setPromptError("Write an answer for each selected prompt before saving.");
      return;
    }
    if (selectedInterests.length > 5) {
      setInterestError("You can select up to 5 interests.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...nextProfile,
        name: editedProfile.name.trim(),
        bio: editedProfile.bio.trim(),
        location: editedProfile.location.trim(),
        country: editedProfile.country,
        occupation: editedProfile.occupation.trim(),
        education: editedProfile.education.trim(),
        ethnicity: editedProfile.ethnicity.trim(),
        religion: editedProfile.religion.trim(),
        heightCm: editedProfile.heightCm === "" ? undefined : Number(editedProfile.heightCm),
        gender: editedProfile.gender,
        preference: editedProfile.preference,
        prompts: prompts.map((prompt) => ({
          question: prompt.question,
          answer: prompt.answer.trim(),
        })),
      });
      setFormError("");
      setSuccessMessage("Profile updated successfully.");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => {
            if (!saving) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white text-gray-900 rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b flex items-center justify-between bg-white text-gray-900">
              <h2 className="text-xl text-gray-900">Edit Profile</h2>
              <button
                onClick={onClose}
                disabled={saving}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white text-gray-900">
              {/* Photos and Video Upload */}
              <PhotoVideoUpload
                images={images}
                video={video}
                onImagesChange={setImages}
                onVideoChange={setVideo}
                onImageFilesAdded={(files) => setImageFiles((current) => [...current, ...files])}
                onVideoFileChange={setVideoFile}
                minPhotos={3}
                maxPhotos={5}
                onRemoveImage={handleRemoveImage}
              />

              {/* Name */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Name
                </label>
                <input
                  type="text"
                  value={editedProfile.name}
                  maxLength={40}
                  onChange={(e) =>
                    setEditedProfile({ ...editedProfile, name: e.target.value.slice(0, 40) })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">{editedProfile.name.length}/40</p>
              </div>

              {/* Age */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Age: {editedProfile.age}
                </label>
                <input
                  type="range"
                  min="18"
                  max="80"
                  value={editedProfile.age}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      age: parseInt(e.target.value),
                    })
                  }
                  className="w-full accent-pink-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>18</span>
                  <span>80</span>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Bio</label>
                <textarea
                  value={editedProfile.bio}
                  onChange={(e) =>
                    setEditedProfile({ ...editedProfile, bio: e.target.value })
                  }
                  rows={3}
                  maxLength={180}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-pink-500 resize-none"
                  placeholder="Tell us about yourself..."
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {editedProfile.bio.length}/180
                </p>
              </div>

              {/* Location */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Country
                </label>
                <select
                  value={editedProfile.country || ""}
                  onChange={(e) =>
                    setEditedProfile({ ...editedProfile, country: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                >
                  <option value="">Select country</option>
                  {countryOptions.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-2 block flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                <input
                  type="text"
                  value={editedProfile.location}
                  onChange={(e) =>
                    setEditedProfile({ ...editedProfile, location: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                  placeholder="City, State"
                />
              </div>

              {/* Gender and Preference */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Gender
                </label>
                <select
                  value={editedProfile.gender || ""}
                  onChange={(e) => setEditedProfile({ ...editedProfile, gender: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                >
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="NON_BINARY">Non-binary</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-2 block">Looking for</label>
                <select
                  value={editedProfile.preference || ""}
                  onChange={(e) => setEditedProfile({ ...editedProfile, preference: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                >
                  <option value="">Select preference</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="everyone">Everyone</option>
                </select>
              </div>

              {/* Occupation */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Occupation
                </label>
                <input
                  type="text"
                  value={editedProfile.occupation}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      occupation: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                  placeholder="Your job title"
                />
              </div>

              {/* Education */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Education
                </label>
                <input
                  type="text"
                  value={editedProfile.education}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      education: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                  placeholder="School or university"
                />
              </div>

              {/* Ethnicity */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Ethnicity</label>
                <select
                  value={editedProfile.ethnicity}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      ethnicity: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                >
                  <option value="">Select ethnicity</option>
                  {ethnicityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Religion */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Religion</label>
                <SearchableSelect
                  value={editedProfile.religion}
                  onChange={(value) => setEditedProfile({ ...editedProfile, religion: value })}
                  options={RELIGION_OPTIONS}
                  placeholder="Select your religion"
                />
              </div>

              {/* Height */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  Height (cm)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={editedProfile.heightCm}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setEditedProfile({
                      ...editedProfile,
                      heightCm: raw === "" ? "" : Number(raw),
                    });
                  }}
                  min={100}
                  max={250}
                  step={1}
                  placeholder="e.g. 170"
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                />
                {editedProfile.heightCm !== "" &&
                  (!Number.isFinite(Number(editedProfile.heightCm)) ||
                    !Number.isInteger(Number(editedProfile.heightCm)) ||
                    Number(editedProfile.heightCm) < 100 ||
                    Number(editedProfile.heightCm) > 250) && (
                    <p className="text-sm text-red-500 mt-2">Height must be a whole number between 100 and 250 cm.</p>
                  )}
              </div>

              {/* Zodiac Sign */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Zodiac Sign</label>
                <div className="flex flex-wrap gap-2">
                  {zodiacSigns.map((sign) => (
                    <button
                      key={sign}
                      type="button"
                      onClick={() => setZodiacSign(sign)}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        zodiacSign === sign
                          ? "border-pink-500 bg-pink-50 text-pink-700"
                          : "border-gray-200 hover:border-pink-300"
                      }`}
                    >
                      {sign}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div>
                <label className="text-sm text-gray-600 mb-3 block">
                  Interests ({selectedInterests.length}/5 selected)
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableInterests.map((interest) => {
                    const selected = selectedInterests.includes(interest);
                    const disabled = !selected && selectedInterests.length >= 5;
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        disabled={disabled}
                        className={`px-4 py-2 rounded-full border-2 transition-all ${
                          selected
                            ? "border-pink-500 bg-pink-50 text-pink-700"
                            : "border-gray-200 hover:border-pink-300"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
                {interestError && <p className="mt-3 text-sm text-red-500">{interestError}</p>}
              </div>

              {/* Prompts */}
              <div>
                <label className="text-sm text-gray-600 mb-3 block">
                  Prompts (Max 3)
                </label>
                <div className="flex flex-wrap gap-2">
                  {availablePrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => {
                        const existingPrompt = prompts.find((p) => p.question === prompt);
                        if (existingPrompt) {
                          setPrompts(prompts.filter((p) => p.question !== prompt));
                        } else if (prompts.length < 3) {
                          setPrompts([...prompts, { question: prompt, answer: "" }]);
                        }
                        setPromptError("");
                      }}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        prompts.some((p) => p.question === prompt)
                          ? "border-pink-500 bg-pink-50 text-pink-700"
                          : "border-gray-200 hover:border-pink-300"
                      }`}
                      disabled={prompts.length >= 3 && !prompts.some((p) => p.question === prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                {prompts.map((prompt) => (
                  <div key={prompt.question} className="mt-3">
                    <label className="text-xs text-gray-600 mb-1 block">
                      {prompt.question}
                    </label>
                    <input
                      type="text"
                      value={prompt.answer}
                      onChange={(e) => {
                        const updatedPrompts = prompts.map((p) =>
                          p.question === prompt.question ? { ...p, answer: e.target.value } : p
                        );
                        setPrompts(updatedPrompts);
                        setPromptError("");
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                      placeholder="Your answer..."
                    />
                  </div>
                ))}
                {promptError && <p className="mt-3 text-sm text-red-500">{promptError}</p>}
              </div>
              {formError && <p className="text-sm text-red-500 text-center">{formError}</p>}
              {successMessage && <p className="text-sm text-green-600 text-center">{successMessage}</p>}
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex gap-3 bg-white text-gray-900">
              <button
                onClick={onClose}
                disabled={saving}
                className="flex-1 py-3 border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || images.length < 3 || saving}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
