import { useEffect, useState, useRef } from "react";
import {
  Heart,
  Camera,
  MapPin,
  Navigation,
  CheckCircle,
  Sparkles,
  Lock,
  RefreshCw,
  Loader2,
  AlertCircle,
  Video,
  X,
  MessageSquareQuote,
} from "lucide-react";
import { useDeviceLocation } from "../hooks/useDeviceLocation";
import { countryOptions } from "../../lib/countries";
import { RELIGION_OPTIONS } from "../../lib/religions";
import { ETHNICITY_OPTIONS } from "../../lib/ethnicities";
import { AVAILABLE_PROMPTS } from "../../lib/prompts";
import { SearchableSelect } from "./SearchableSelect";

/**
 * Persists in-progress wizard answers across app restarts (not just
 * same-session backgrounding) — e.g. the OS reclaiming the Activity while the
 * app is backgrounded, which reruns this component from scratch. Without
 * this, a user midway through signup would lose everything they'd typed the
 * moment the app got recreated, even once the navigation bug that sent them
 * to Payment is fixed.
 */
const SIGNUP_DRAFT_KEY = "luvly_signup_draft";

interface SignupDraft {
  step: number;
  profileData: ProfileSetupData;
  selectedInterests: string[];
  locationSource: LocationSource;
}

function readSignupDraft(): SignupDraft | null {
  try {
    const raw = localStorage.getItem(SIGNUP_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as SignupDraft;
  } catch {
    // Corrupt or unreadable draft — proceed as if there were none rather
    // than blocking signup on a storage error.
    return null;
  }
}

function writeSignupDraft(draft: SignupDraft) {
  try {
    localStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Best-effort only (e.g. storage quota exceeded from a large selfie
    // capture). Losing the draft cache is far better than crashing signup.
  }
}

function clearSignupDraft() {
  try {
    localStorage.removeItem(SIGNUP_DRAFT_KEY);
  } catch {
    // Ignore — nothing further to do if storage is unavailable.
  }
}

/**
 * Where the current `location` value came from. This is the single source
 * of truth for whether the field is locked — "detected" is the only state
 * in which manual edits are rejected, and it can only be entered/updated by
 * a successful device-location detection (see the effect below), never by
 * the text input's onChange handler.
 */
type LocationSource = "none" | "manual" | "detected";

interface ProfileSetupData {
  name: string;
  occupation: string;
  education: string;
  gender: "male" | "female" | "non-binary" | "transgender" | "other" | "";
  zodiacSign: string;
  religion: string;
  heightCm: number | "";
  ethnicity: string;
  preference: "men" | "women" | "everyone" | "";
  location: string;
  country: string;
  latitude?: number;
  longitude?: number;
  distance: number;
  age: number;
  bio: string;
  interests: string[];
  prompts: Array<{ question: string; answer: string }>;
  selfieUrl: string;
}

interface ProfileSetupProps {
  onComplete: (data: ProfileSetupData & { photoFiles: File[]; videoFile: File | null; selfieFile: File | null }) => void | Promise<unknown>;
}

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const initialDraft = useRef<SignupDraft | null>(null);
  if (initialDraft.current === null) {
    initialDraft.current = readSignupDraft() ?? ({} as SignupDraft);
  }
  const draft = initialDraft.current;

  const TOTAL_STEPS = 11;
  const PHOTOS_STEP = 8;
  // The draft in localStorage can only hold JSON-serializable data (text
  // fields, the step number). It was never able to hold the actual File
  // objects for gallery photos, video, or the verification selfie — those
  // only ever live in memory. If the WebView gets recreated by the OS after
  // step 8 (very common: backgrounding to the system camera/gallery picker,
  // or a low-memory reclaim), the draft happily restores `step: 11` and the
  // selfie's base64 preview (a string, so it does survive), making step 11
  // look fully filled in — but `photoFiles` silently comes back empty,
  // since there's nothing to restore it from. Complete then submits 0
  // photos and the server-side completeness check fails with no clear
  // explanation. Clamping the restored step to the photos step whenever the
  // draft claims to be past it forces the user to redo the one thing that
  // truly cannot be recovered, before they can reach Complete again.
  const draftStepRequestedPastPhotos = Boolean(draft.step && draft.step > PHOTOS_STEP);
  const [step, setStep] = useState(() => {
    if (draftStepRequestedPastPhotos) return PHOTOS_STEP;
    return draft.step && draft.step >= 1 && draft.step <= TOTAL_STEPS ? draft.step : 1;
  });
  // Tracks the final "Complete" submission specifically (profile save +
  // photo/selfie uploads), so the button can show real feedback instead of
  // sitting there looking unresponsive during the network round-trip.
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState<ProfileSetupData>({
    name: draft.profileData?.name || "",
    occupation: draft.profileData?.occupation || "",
    education: draft.profileData?.education || "",
    gender: draft.profileData?.gender || "",
    zodiacSign: draft.profileData?.zodiacSign || "",
    religion: draft.profileData?.religion || "",
    heightCm: draft.profileData?.heightCm || "",
    ethnicity: draft.profileData?.ethnicity || "",
    preference: draft.profileData?.preference || "",
    location: draft.profileData?.location || "",
    country: draft.profileData?.country || "",
    latitude: draft.profileData?.latitude,
    longitude: draft.profileData?.longitude,
    distance: draft.profileData?.distance ?? 25,
    age: draft.profileData?.age ?? 25,
    bio: draft.profileData?.bio || "",
    interests: [],
    prompts: Array.isArray(draft.profileData?.prompts) ? draft.profileData.prompts : [],
    selfieUrl: draft.profileData?.selfieUrl || "",
  });
  const [selectedInterests, setSelectedInterests] = useState<string[]>(draft.selectedInterests || []);
  const [locationSource, setLocationSource] = useState<LocationSource>(draft.locationSource || "none");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Persist every change so a backgrounded app that gets recreated by the OS
  // (or a full app restart mid-signup) resumes with the same answers instead
  // of a blank wizard. This is requirement 1/2: preserve signup state across
  // pause/resume and restore it intact.
  useEffect(() => {
    writeSignupDraft({ step, profileData, selectedInterests, locationSource });
  }, [step, profileData, selectedInterests, locationSource]);

  const {
    detectedLocation,
    permissionState,
    isDetecting,
    error: locationError,
    detect: detectLocation,
  } = useDeviceLocation();

  const isLocationLocked = locationSource === "detected";

  // The ONLY place `location` is ever set to a detected value, and the only
  // place `locationSource` is ever set to "detected". Whenever the device
  // reports a fresh detected location, it overwrites anything the user may
  // have typed and (re-)locks the field. This runs regardless of which
  // wizard step is active, so if location was already detected before the
  // user reaches step 4, the field renders locked from the start.
  useEffect(() => {
    if (detectedLocation) {
      setProfileData((prev) => ({
        ...prev,
        location: detectedLocation.label,
        country: detectedLocation.country || prev.country,
        latitude: detectedLocation.latitude,
        longitude: detectedLocation.longitude,
      }));
      setLocationSource("detected");
    }
  }, [detectedLocation]);

  // If permission is denied/unsupported and there's no detected location to
  // back the locked value, fall back to an editable field. A previously
  // detected value that was locked in stays locked (per requirements, only
  // a new detection can change a locked value) — this only unlocks the
  // field when it was never actually backed by a detection in the first
  // place.
  useEffect(() => {
    if ((permissionState === "denied" || permissionState === "unsupported") && !detectedLocation) {
      setLocationSource((prev) => (prev === "detected" ? "none" : prev));
    }
  }, [permissionState, detectedLocation]);

  // Guarded state mutators for manual typing/selection. This is the
  // enforcement point in state management, independent of the inputs'
  // `disabled` attribute: even if the UI restriction were bypassed (e.g. by
  // dispatching a change event directly), these handlers still refuse to
  // apply the edit while a detected location is locked in.
  const handleManualLocationChange = (value: string) => {
    if (isLocationLocked) return;
    setProfileData((prev) => ({ ...prev, location: value }));
    setLocationSource(value.trim() || profileData.country ? "manual" : "none");
  };

  const handleManualCountryChange = (value: string) => {
    if (isLocationLocked) return;
    setProfileData((prev) => ({ ...prev, country: value }));
    setLocationSource(value || profileData.location.trim() ? "manual" : "none");
  };

  const availableInterests = [
    "Travel",
    "Music",
    "Movies",
    "Sports",
    "Gym",
    "Books",
    "Science",
    "Dance",
    "Cooking",
    "Photography",
    "Art",
    "Gaming",
    "Coffee",
    "Fashion",
  ];

  const zodiacSigns = [
    { value: "Aries", symbol: "♈", dates: "Mar 21 - Apr 19" },
    { value: "Taurus", symbol: "♉", dates: "Apr 20 - May 20" },
    { value: "Gemini", symbol: "♊", dates: "May 21 - Jun 20" },
    { value: "Cancer", symbol: "♋", dates: "Jun 21 - Jul 22" },
    { value: "Leo", symbol: "♌", dates: "Jul 23 - Aug 22" },
    { value: "Virgo", symbol: "♍", dates: "Aug 23 - Sep 22" },
    { value: "Libra", symbol: "♎", dates: "Sep 23 - Oct 22" },
    { value: "Scorpio", symbol: "♏", dates: "Oct 23 - Nov 21" },
    { value: "Sagittarius", symbol: "♐", dates: "Nov 22 - Dec 21" },
    { value: "Capricorn", symbol: "♑", dates: "Dec 22 - Jan 19" },
    { value: "Aquarius", symbol: "♒", dates: "Jan 20 - Feb 18" },
    { value: "Pisces", symbol: "♓", dates: "Feb 19 - Mar 20" },
  ];

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }
    // Guard against double-taps: the actual save is an async network
    // round-trip (profile save + photo/selfie uploads) with no other
    // visual indicator, so without this the button looked "dead" and
    // people tapped it repeatedly, firing duplicate submissions.
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Recompute the submitted location from its source of truth rather
      // than trusting `profileData.location` verbatim: while locked, the
      // detected value (not whatever may be sitting in profileData) is what
      // gets sent, so submission can't be tricked by any client-side
      // manipulation of profileData outside the guarded handler above.
      const finalLocationFields =
        locationSource === "detected" && detectedLocation
          ? {
              location: detectedLocation.label,
              country: detectedLocation.country || profileData.country,
              latitude: detectedLocation.latitude,
              longitude: detectedLocation.longitude,
            }
          : {
              location: profileData.location,
              country: profileData.country,
              latitude: profileData.latitude,
              longitude: profileData.longitude,
            };
      // Await so the button stays in its "submitting" state for the full
      // save. Keep the text draft until App.tsx confirms the complete
      // profile, so an interrupted upload does not force the user to retype
      // every answer after an app restart.
      await onComplete({
        ...profileData,
        ...finalLocationFields,
        interests: selectedInterests,
        photoFiles,
        videoFile,
        selfieFile,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, selfieUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).filter((file) => file.type.startsWith("image/"));
    if (!selected.length) return;
    const remaining = 5 - photoFiles.length;
    if (selected.length > remaining) {
      setPhotoError(`You can add a maximum of 5 photos. ${remaining} slot${remaining === 1 ? "" : "s"} remaining.`);
    } else {
      setPhotoError("");
    }
    const accepted = selected.slice(0, Math.max(0, remaining));
    setPhotoFiles((current) => [...current, ...accepted]);
    setPhotoPreviewUrls((current) => [...current, ...accepted.map((file) => URL.createObjectURL(file))]);
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotoFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setPhotoPreviewUrls((current) => {
      URL.revokeObjectURL(current[index]);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
    setPhotoError("");
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const togglePrompt = (question: string) => {
    const existing = profileData.prompts.find((p) => p.question === question);
    if (existing) {
      setProfileData({ ...profileData, prompts: profileData.prompts.filter((p) => p.question !== question) });
    } else if (profileData.prompts.length < 3) {
      setProfileData({ ...profileData, prompts: [...profileData.prompts, { question, answer: "" }] });
    }
  };

  const updatePromptAnswer = (question: string, answer: string) => {
    setProfileData({
      ...profileData,
      prompts: profileData.prompts.map((p) => (p.question === question ? { ...p, answer } : p)),
    });
  };

  const isHeightValid = (value: number | "") =>
    value !== "" && Number.isInteger(Number(value)) && Number(value) >= 100 && Number(value) <= 250;

  const canProceed = () => {
    switch (step) {
      case 1:
        return profileData.name.trim() !== "" && profileData.bio.trim() !== "";
      case 2:
        return profileData.gender !== "";
      case 3:
        return profileData.religion !== "" && isHeightValid(profileData.heightCm) && profileData.ethnicity !== "";
      case 4:
        return profileData.zodiacSign !== "";
      case 5:
        return profileData.preference !== "";
      case 6:
        return profileData.location !== "" && profileData.country !== "";
      case 7:
        return selectedInterests.length >= 3;
      case 8:
        return photoFiles.length >= 3 && photoFiles.length <= 5;
      case 9:
        return true; // Video is optional
      case 10:
        return profileData.prompts.every((p) => p.answer.trim() !== ""); // Prompts are optional, but a selected one needs an answer
      case 11:
        return profileData.selfieUrl !== "";
      default:
        return false;
    }
  };

  return (
    <div className="h-full bg-gradient-to-b from-pink-50 to-red-50 flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-pink-500 fill-current" />
          <span className="text-xl bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
            Luvly
          </span>
        </div>
        <div className="text-sm text-gray-600">
          Step {step} of {TOTAL_STEPS}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 mb-6">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-red-500 transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 shadow-xl">
          {/* Step 1: Basic profile */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl mb-2 text-center">Tell us about you</h2>
              <p className="text-gray-600 text-sm text-center mb-6">This information appears on your profile.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Name</label>
                  <input type="text" value={profileData.name} maxLength={40} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} placeholder="Your name" className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Bio</label>
                  <textarea value={profileData.bio} maxLength={180} rows={3} onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })} placeholder="Tell people a little about yourself" className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-pink-500 resize-none" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Occupation</label>
                  <input type="text" value={profileData.occupation} onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })} placeholder="What do you do?" className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Education</label>
                  <input type="text" value={profileData.education} onChange={(e) => setProfileData({ ...profileData, education: e.target.value })} placeholder="School or university" className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Gender */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl mb-2 text-center">I am a</h2>
              <p className="text-gray-600 text-sm text-center mb-6">
                Select your gender identity
              </p>
              <div className="space-y-3">
                {[
                  { value: "male", label: "Male", icon: "👨" },
                  { value: "female", label: "Female", icon: "👩" },
                  { value: "non-binary", label: "Non-binary", icon: "⚧️" },
                  { value: "transgender", label: "Transgender", icon: "🏳️‍⚧️" },
                  { value: "other", label: "Other", icon: "✨" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setProfileData({
                        ...profileData,
                        gender: option.value as any,
                      })
                    }
                    className={`w-full py-4 rounded-full border-2 transition-all ${
                      profileData.gender === option.value
                        ? "border-pink-500 bg-pink-50"
                        : "border-gray-200 hover:border-pink-300"
                    }`}
                  >
                    {option.icon} {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: About You (Religion + Height) */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl mb-2 text-center">A bit more about you</h2>
              <p className="text-gray-600 text-sm text-center mb-6">
                This helps us find your best matches
              </p>
              <div className="space-y-6">
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Religion</label>
                  <SearchableSelect
                    value={profileData.religion}
                    onChange={(value) => setProfileData({ ...profileData, religion: value })}
                    options={RELIGION_OPTIONS}
                    placeholder="Select your religion"
                  />
                  {!profileData.religion && (
                    <p className="text-sm text-red-500 mt-2">Religion is required. Please select an option.</p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Height (cm)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={profileData.heightCm}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setProfileData({
                        ...profileData,
                        heightCm: raw === "" ? "" : Number(raw),
                      });
                    }}
                    placeholder="e.g. 170"
                    min={100}
                    max={250}
                    step={1}
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                  />
                  {profileData.heightCm === "" ? (
                    <p className="text-sm text-red-500 mt-2">Height is required.</p>
                  ) : !isHeightValid(profileData.heightCm) && (
                    <p className="text-sm text-red-500 mt-2">
                      Height must be a whole number between 100 and 250 cm.
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Ethnicity</label>
                  <select
                    value={profileData.ethnicity}
                    onChange={(e) => setProfileData({ ...profileData, ethnicity: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500 bg-white"
                  >
                    <option value="">Select ethnicity</option>
                    {ETHNICITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Zodiac Sign */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl mb-2 text-center">My Zodiac Sign</h2>
              <p className="text-gray-600 text-sm text-center mb-6">
                Select your zodiac sign
              </p>
              <div className="grid grid-cols-2 gap-3">
                {zodiacSigns.map((sign) => (
                  <button
                    key={sign.value}
                    onClick={() =>
                      setProfileData({
                        ...profileData,
                        zodiacSign: sign.value,
                      })
                    }
                    className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                      profileData.zodiacSign === sign.value
                        ? "border-pink-500 bg-pink-50"
                        : "border-gray-200 hover:border-pink-300"
                    }`}
                  >
                    <span className="text-2xl mb-1">{sign.symbol}</span>
                    <span className="font-medium text-sm">{sign.value}</span>
                    <span className="text-xs text-gray-400">{sign.dates}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Preference */}
          {step === 5 && (
            <div>
              <h2 className="text-2xl mb-2 text-center">Show me</h2>
              <p className="text-gray-600 text-sm text-center mb-6">
                Who would you like to meet?
              </p>
              <div className="space-y-3">
                {[
                  { value: "men", label: "Men" },
                  { value: "women", label: "Women" },
                  { value: "everyone", label: "Everyone" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setProfileData({
                        ...profileData,
                        preference: option.value as any,
                      })
                    }
                    className={`w-full py-4 rounded-full border-2 transition-all ${
                      profileData.preference === option.value
                        ? "border-pink-500 bg-pink-50"
                        : "border-gray-200 hover:border-pink-300"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Location & Distance */}
          {step === 6 && (
            <div>
              <h2 className="text-2xl mb-2 text-center">Where are you?</h2>
              <p className="text-gray-600 text-sm text-center mb-6">
                Set your location and dating radius
              </p>
              <div className="space-y-6">
                <div>
                  <label className="text-sm text-gray-600 mb-2 block flex items-center justify-between">
                    <span>Country</span>
                    {isLocationLocked && (
                      <span className="text-xs text-pink-600 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Auto-detected
                      </span>
                    )}
                  </label>
                  <select
                    value={profileData.country}
                    onChange={(e) => handleManualCountryChange(e.target.value)}
                    disabled={isLocationLocked}
                    className={`w-full px-4 py-3 border rounded-full focus:outline-none transition-colors bg-white ${
                      isLocationLocked
                        ? "border-pink-200 bg-pink-50 text-gray-700 cursor-not-allowed"
                        : "border-gray-300 focus:border-pink-500"
                    }`}
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
                  <label className="text-sm text-gray-600 mb-2 block flex items-center justify-between">
                    <span>
                      <MapPin className="w-4 h-4 inline mr-1" />
                      City
                    </span>
                    {isLocationLocked && (
                      <span className="text-xs text-pink-600 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Auto-detected
                      </span>
                    )}
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => handleManualLocationChange(e.target.value)}
                      readOnly={isLocationLocked}
                      disabled={isLocationLocked}
                      placeholder="e.g., San Francisco, CA"
                      className={`w-full px-4 py-3 border rounded-full focus:outline-none transition-colors ${
                        isLocationLocked
                          ? "border-pink-200 bg-pink-50 text-gray-700 cursor-not-allowed"
                          : "border-gray-300 focus:border-pink-500"
                      }`}
                    />
                    {isDetecting && (
                      <Loader2 className="w-5 h-5 text-pink-500 animate-spin absolute right-4 top-1/2 -translate-y-1/2" />
                    )}
                  </div>

                  {isLocationLocked ? (
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={isDetecting}
                      className="mt-2 text-xs text-pink-600 hover:text-pink-700 flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isDetecting ? "animate-spin" : ""}`} />
                      Refresh detected location
                    </button>
                  ) : (
                    <div className="mt-2 space-y-1">
                      {permissionState === "denied" ? (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Location access denied — enter it manually, or enable
                          location for this app in your device settings.
                        </p>
                      ) : permissionState === "unsupported" ? (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Location detection isn't available on this device.
                          Enter your location manually.
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={detectLocation}
                          disabled={isDetecting}
                          className="text-xs text-pink-600 hover:text-pink-700 flex items-center gap-1 disabled:opacity-50"
                        >
                          <Navigation className={`w-3 h-3 ${isDetecting ? "animate-spin" : ""}`} />
                          {isDetecting ? "Detecting your location…" : "Use my current location"}
                        </button>
                      )}
                      {locationError && !isDetecting && (
                        <p className="text-xs text-gray-400">{locationError}</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">
                    <Navigation className="w-4 h-4 inline mr-1" />
                    Maximum Distance: {profileData.distance} miles
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={profileData.distance}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        distance: parseInt(e.target.value),
                      })
                    }
                    className="w-full accent-pink-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 mi</span>
                    <span>100 mi</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block">
                    Your Age: {profileData.age}
                  </label>
                  <input
                    type="range"
                    min="18"
                    max="80"
                    value={profileData.age}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
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
              </div>
            </div>
          )}

          {/* Step 7: Interests */}
          {step === 7 && (
            <div>
              <h2 className="text-2xl mb-2 text-center">Your Interests</h2>
              <p className="text-gray-600 text-sm text-center mb-6">
                Select at least 3 interests
              </p>
              <div className="flex flex-wrap gap-2">
                {availableInterests.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full border-2 transition-all ${
                      selectedInterests.includes(interest)
                        ? "border-pink-500 bg-pink-50 text-pink-700"
                        : "border-gray-200 hover:border-pink-300"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4 text-center">
                {selectedInterests.length} selected
              </p>
            </div>
          )}

          {/* Step 8: Required photos */}
          {step === 8 && (
            <div>
              <h2 className="text-2xl mb-2 text-center">Add your photos</h2>
              <p className="text-gray-600 text-sm text-center mb-2">Add at least 3 and up to 5 profile photos.</p>
              <p className="text-gray-500 text-xs text-center mb-6">You can select several photos at once or add them one at a time.</p>
              {draftStepRequestedPastPhotos && (
                <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 text-center">
                  Your app restarted partway through signup, so your selected photos didn't carry over. Please add them again to continue.
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                {photoPreviewUrls.map((url, index) => (
                  <div key={url} className="relative aspect-square overflow-hidden rounded-2xl">
                    <img src={url} alt={`Profile photo ${index + 1}`} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removePhoto(index)} className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-sm text-white">×</button>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 5 - photoFiles.length) }, (_, emptyIndex) => {
                  const index = photoFiles.length + emptyIndex;
                  return (
                    <button
                      key={`empty-photo-${index}`}
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className={`aspect-square rounded-2xl border-2 border-dashed px-2 text-xs transition-colors ${index < 3 ? "border-pink-300 text-pink-600 hover:border-pink-500" : "border-gray-300 text-gray-500 hover:border-pink-500 hover:text-pink-500"}`}
                    >
                      {index < 3 ? `Required photo ${index + 1}` : `Add photo ${index + 1}`}
                    </button>
                  );
                })}
              </div>
              <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
              <p className={`mt-4 text-center text-sm ${photoFiles.length >= 3 ? "text-green-600" : "text-red-500"}`}>{photoFiles.length}/5 photos selected {photoFiles.length < 3 && "— add at least 3"}</p>
              {photoError && <p className="mt-2 text-center text-sm text-red-500">{photoError}</p>}
            </div>
          )}

          {/* Step 9: Video (optional) */}
          {step === 9 && (
            <div>
              <h2 className="text-2xl mb-2 text-center">Add a video</h2>
              <p className="text-gray-600 text-sm text-center mb-6">
                Optional — show a bit of your personality in motion
              </p>
              <div className="space-y-4">
                {videoPreviewUrl ? (
                  <div className="relative">
                    <video
                      src={videoPreviewUrl}
                      controls
                      className="w-full h-64 object-cover rounded-2xl bg-black"
                    />
                    <button
                      onClick={() => {
                        setVideoFile(null);
                        setVideoPreviewUrl("");
                      }}
                      className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-lg hover:bg-white"
                      aria-label="Remove video"
                    >
                      <X className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center hover:border-pink-500 transition-colors"
                  >
                    <Video className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-gray-600">Upload a short video</p>
                    <p className="text-sm text-gray-400 mt-1">MP4 or MOV — optional, you can skip this</p>
                  </button>
                )}
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Step 10: Prompts (optional) */}
          {step === 10 && (
            <div>
              <h2 className="text-2xl mb-2 text-center">Answer a few prompts</h2>
              <p className="text-gray-600 text-sm text-center mb-6">
                Optional — pick up to 3 to help break the ice
              </p>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => togglePrompt(prompt)}
                    disabled={
                      profileData.prompts.length >= 3 &&
                      !profileData.prompts.some((p) => p.question === prompt)
                    }
                    className={`px-4 py-2 rounded-full border-2 transition-all ${
                      profileData.prompts.some((p) => p.question === prompt)
                        ? "border-pink-500 bg-pink-50 text-pink-700"
                        : "border-gray-200 hover:border-pink-300"
                    }`}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              {profileData.prompts.map((prompt) => (
                <div key={prompt.question} className="mt-4">
                  <label className="text-xs text-gray-600 mb-1 block flex items-center gap-1">
                    <MessageSquareQuote className="w-3.5 h-3.5" />
                    {prompt.question}
                  </label>
                  <input
                    type="text"
                    value={prompt.answer}
                    onChange={(e) => updatePromptAnswer(prompt.question, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                    placeholder="Your answer..."
                  />
                </div>
              ))}
            </div>
          )}

          {/* Step 11: One-time selfie verification */}
          {step === 11 && (
            <div>
              <h2 className="text-2xl mb-2 text-center">Verify Your Profile</h2>
              <p className="text-gray-600 text-sm text-center mb-6">
                Upload one selfie to verify your identity
              </p>
              <div className="space-y-4">
                {profileData.selfieUrl ? (
                  <div className="relative">
                    <img
                      src={profileData.selfieUrl}
                      alt="Selfie"
                      className="w-full h-64 object-cover rounded-2xl"
                    />
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Selfie selected
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-50"
                    >
                      Change Photo
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center hover:border-pink-500 transition-colors"
                  >
                    <Camera className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-gray-600">Upload a selfie</p>
                    <p className="text-sm text-gray-400 mt-1">
                      JPG, PNG or HEIC
                    </p>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSelfieUpload}
                  className="hidden"
                  // Android WebView can expose a styled file input even when
                  // its utility class has not loaded yet. An inline rule keeps
                  // it out of the touch layer above the Complete button.
                  style={{ display: "none" }}
                  tabIndex={-1}
                />
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Verification helps:</strong> Build trust in the
                    community and ensure authentic profiles
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="p-6 bg-white border-t">
        <div className="max-w-md mx-auto flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex-1 py-3 border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <span
                className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
                aria-hidden="true"
              />
            )}
            {step === TOTAL_STEPS ? (isSubmitting ? "Creating profile..." : "Complete") : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
