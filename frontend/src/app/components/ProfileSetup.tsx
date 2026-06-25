import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle, Heart, MapPin, Navigation, User } from "lucide-react";
import {
  countryOptions,
  detectCountryFromLocale,
  getDeviceCoordinates,
} from "../../lib/countries";

interface ProfileSetupData {
  name: string;
  gender: "male" | "female" | "non-binary" | "transgender" | "other" | "";
  preference: "men" | "women" | "everyone" | "";
  location: string;
  country: string;
  latitude?: number;
  longitude?: number;
  distance: number;
  age: number;
  bio: string;
  interests: string[];
  photoFiles: File[];
}

interface ProfileSetupProps {
  onComplete: (data: ProfileSetupData) => void;
}

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState<ProfileSetupData>({
    name: "",
    gender: "",
    preference: "",
    location: "",
    country: detectCountryFromLocale(),
    distance: 25,
    age: 25,
    bio: "",
    interests: [],
    photoFiles: [],
  });
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const detectDeviceLocation = async () => {
    const coords = await getDeviceCoordinates();
    if (!coords) return;
    setProfileData((current) => ({
      ...current,
      latitude: coords.latitude,
      longitude: coords.longitude,
      country: current.country || detectCountryFromLocale(),
    }));
  };

  useEffect(() => {
    detectDeviceLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      onComplete({ ...profileData, interests: selectedInterests });
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((current) =>
      current.includes(interest) ? current.filter((i) => i !== interest) : [...current, interest]
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 6);
    if (!files.length) return;
    setProfileData((current) => ({
      ...current,
      photoFiles: [...current.photoFiles, ...files].slice(0, 6),
    }));
  };

  const removePhoto = (index: number) => {
    setProfileData((current) => ({
      ...current,
      photoFiles: current.photoFiles.filter((_, i) => i !== index),
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return profileData.name.trim().length >= 2 && profileData.age >= 18;
      case 2:
        return profileData.photoFiles.length >= 1;
      case 3:
        return profileData.gender !== "" && profileData.preference !== "";
      case 4:
        return profileData.location.trim() !== "" && profileData.country !== "";
      case 5:
        return selectedInterests.length >= 3;
      default:
        return false;
    }
  };

  return (
    <div className="h-full bg-gradient-to-b from-pink-50 to-red-50 flex flex-col">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-pink-500 fill-current" />
          <span className="text-xl bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
            Luvly
          </span>
        </div>
        <div className="text-sm text-gray-600">Step {step} of 5</div>
      </div>

      <div className="px-6 mb-6">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-red-500 transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 shadow-xl">
          {step === 1 && (
            <div>
              <h2 className="text-2xl mb-2 text-center">Basic Details</h2>
              <p className="text-gray-600 text-sm text-center mb-6">Tell people who you are.</p>
              <label className="text-sm text-gray-600 mb-2 block">Full name</label>
              <div className="relative mb-5">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="Your full name"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                />
              </div>
              <label className="text-sm text-gray-600 mb-2 block">Your Age: {profileData.age}</label>
              <input
                type="range"
                min="18"
                max="80"
                value={profileData.age}
                onChange={(e) => setProfileData({ ...profileData, age: parseInt(e.target.value) })}
                className="w-full accent-pink-500"
              />
              <label className="text-sm text-gray-600 mt-5 mb-2 block">Short bio</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="A little about you"
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-pink-500 min-h-24"
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl mb-2 text-center">Profile Photos</h2>
              <p className="text-gray-600 text-sm text-center mb-6">Add at least one clear photo.</p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {profileData.photoFiles.map((file, index) => (
                  <button
                    type="button"
                    key={`${file.name}-${index}`}
                    onClick={() => removePhoto(index)}
                    className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100"
                  >
                    <img src={URL.createObjectURL(file)} alt="Profile" className="w-full h-full object-cover" />
                    <span className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 text-sm">x</span>
                  </button>
                ))}
                {profileData.photoFiles.length < 6 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center hover:border-pink-500 transition-colors"
                  >
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500">Add</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
              {profileData.photoFiles.length > 0 && (
                <p className="text-sm text-green-600 flex items-center justify-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {profileData.photoFiles.length} photo selected
                </p>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl mb-2 text-center">Dating Preferences</h2>
              <p className="text-gray-600 text-sm text-center mb-6">Choose your gender and who you want to meet.</p>
              <label className="text-sm text-gray-600 mb-2 block">I am</label>
              <div className="space-y-3 mb-6">
                {[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "non-binary", label: "Non-binary" },
                  { value: "transgender", label: "Transgender" },
                  { value: "other", label: "Other" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setProfileData({ ...profileData, gender: option.value as any })}
                    className={`w-full py-3 rounded-full border-2 transition-all ${
                      profileData.gender === option.value ? "border-pink-500 bg-pink-50" : "border-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <label className="text-sm text-gray-600 mb-2 block">Looking for</label>
              <div className="space-y-3">
                {[
                  { value: "men", label: "Men" },
                  { value: "women", label: "Women" },
                  { value: "everyone", label: "Everyone" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setProfileData({ ...profileData, preference: option.value as any })}
                    className={`w-full py-3 rounded-full border-2 transition-all ${
                      profileData.preference === option.value ? "border-pink-500 bg-pink-50" : "border-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-2xl mb-2 text-center">Location</h2>
              <p className="text-gray-600 text-sm text-center mb-6">Set where you are using Luvly.</p>
              <label className="text-sm text-gray-600 mb-2 block">Country</label>
              <select
                value={profileData.country}
                onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500 bg-white mb-5"
              >
                <option value="">Select country</option>
                {countryOptions.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
              <label className="text-sm text-gray-600 mb-2 block">City</label>
              <div className="relative mb-5">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  value={profileData.location}
                  onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                  placeholder="Mumbai, New York, Tokyo"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-pink-500"
                />
              </div>
              <button
                type="button"
                onClick={detectDeviceLocation}
                className="w-full py-3 border-2 border-pink-200 text-pink-600 rounded-full hover:bg-pink-50 transition-colors mb-5"
              >
                Detect device location
              </button>
              <label className="text-sm text-gray-600 mb-2 block">
                <Navigation className="w-4 h-4 inline mr-1" />
                Maximum Distance: {profileData.distance} miles
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={profileData.distance}
                onChange={(e) => setProfileData({ ...profileData, distance: parseInt(e.target.value) })}
                className="w-full accent-pink-500"
              />
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="text-2xl mb-2 text-center">Interests</h2>
              <p className="text-gray-600 text-sm text-center mb-6">Select at least 3 interests.</p>
              <div className="flex flex-wrap gap-2">
                {availableInterests.map((interest) => (
                  <button
                    key={interest}
                    type="button"
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
              <p className="text-sm text-gray-500 mt-4 text-center">{selectedInterests.length} selected</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 bg-white border-t">
        <div className="max-w-md mx-auto flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 py-3 border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
          >
            {step === 5 ? "Create Profile" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
